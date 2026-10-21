import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// Allow-lists keep user input out of the prompt.
const CODING_TOPICS = [
  "Basics & Loops",
  "Arrays",
  "Strings",
  "Recursion",
  "Sorting & Searching",
  "Math & Number Theory",
  "Matrices",
  "Stacks & Queues",
  "Dynamic Programming",
];
const APTITUDE_CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Interpretation",
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const SYSTEM_PROMPT =
  "You write practice questions for engineering students. Respond with a single valid JSON object and nothing else: no preface, no markdown fences.";

function extractJson(text: string) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(clean.slice(start, end + 1));
}

class GroqError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Temporary problems worth retrying (rate limit, overload, server hiccups)
const RETRYABLE = [429, 500, 502, 503, 504];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGroq(model: string, prompt: string, maxTokens: number) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      // JSON mode: the prompt must mention JSON (it does)
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
    // Never hang: give up on this attempt after 20 seconds
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new GroqError(
      `Groq API error ${res.status} (${model}): ${detail.slice(0, 400)}`,
      res.status
    );
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";

  if (!text.trim()) {
    throw new Error(
      `Groq returned no text. finish_reason: ${data.choices?.[0]?.finish_reason ?? "unknown"}`
    );
  }

  return text;
}

// Tries the main model with retries, then falls back to a second model.
async function askAI(prompt: string, maxTokens: number) {
  const primary = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const fallback = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

  const plan = [{ model: primary, tries: 3 }];
  if (fallback && fallback !== primary) plan.push({ model: fallback, tries: 2 });

  let lastError: unknown;

  for (const { model, tries } of plan) {
    for (let attempt = 1; attempt <= tries; attempt++) {
      try {
        return extractJson(await callGroq(model, prompt, maxTokens));
      } catch (err) {
        lastError = err;
        console.warn(
          `[api/generate] ${model} attempt ${attempt}/${tries} failed:`,
          (err as Error).message?.slice(0, 300)
        );

        if (err instanceof GroqError && !RETRYABLE.includes(err.status)) {
          break; // 400/401/403/404: retrying won't help, move on to the next model
        }
        const name = (err as Error).name;
        if (name === "TimeoutError" || name === "AbortError") {
          break; // too slow: switch models instead of waiting again
        }
        if (attempt < tries) await sleep(1000 * attempt);
      }
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured. Add GROQ_API_KEY to .env and restart the server." },
      { status: 500 }
    );
  }

  if (!rateLimit(req, "generate", 10)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }

  let body: { type?: string; topic?: string; difficulty?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, topic = "", difficulty = "" } = body;
  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty." }, { status: 400 });
  }

  try {
    /* ------------------------------ CODING ------------------------------ */
    if (type === "coding") {
      if (!CODING_TOPICS.includes(topic)) {
        return NextResponse.json({ error: "Invalid topic." }, { status: 400 });
      }

      const prompt = `Create one original ${difficulty} coding problem on the topic "${topic}" for a college student.
The program reads from standard input and prints to standard output, so it works in Java, C and Python.

Return JSON with exactly this shape:
{
  "title": string,
  "description": string,
  "inputFormat": string,
  "outputFormat": string,
  "constraints": string[],
  "samples": [{ "input": string, "output": string, "explanation": string }],
  "testCases": [{ "input": string, "output": string }]
}

Rules:
- Give 2 samples and 5 testCases (include edge cases).
- Every output must be exactly what a correct program prints, with a single correct answer (no "any valid answer" problems).
- Keep inputs small so outputs can be verified by hand. Trace each one carefully before including it.
- Inputs and outputs are plain text with \\n for new lines.`;

      const problem = await askAI(prompt, 2500);

      const valid =
        typeof problem.title === "string" &&
        typeof problem.description === "string" &&
        Array.isArray(problem.samples) &&
        Array.isArray(problem.testCases) &&
        problem.testCases.length > 0;

      if (!valid) throw new Error("Bad problem shape");

      return NextResponse.json({ problem });
    }

    /* ----------------------------- APTITUDE ----------------------------- */
    if (type === "aptitude") {
      if (!APTITUDE_CATEGORIES.includes(topic)) {
        return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      }
      const count = Math.min(Math.max(Number(body.count) || 5, 1), 10);

      const prompt = `Create ${count} original ${difficulty} multiple-choice questions for placement aptitude practice.
Category: ${topic}.

Return JSON with exactly this shape:
{
  "questions": [
    { "question": string, "options": [string, string, string, string], "answerIndex": 0, "explanation": string }
  ]
}

Rules:
- Exactly 4 options per question; answerIndex is the 0-based index of the one correct option.
- Vary the position of the correct answer.
- Work each question out step by step before writing it so the answer is right.
- Keep explanations short (1-3 sentences) and show the key calculation or reasoning.
- Do not include option letters like "A)" inside the option text.`;

      const result = await askAI(prompt, 3500);

      const questions = (result.questions ?? []).filter(
        (q: { question?: unknown; options?: unknown; answerIndex?: unknown }) =>
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.answerIndex) &&
          (q.answerIndex as number) >= 0 &&
          (q.answerIndex as number) < 4
      );

      if (questions.length === 0) throw new Error("Bad questions shape");

      return NextResponse.json({ questions });
    }

    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  } catch (err) {
    // Shows the real reason in the terminal running `npm run dev`
    console.error("[api/generate]", err);

    const status = err instanceof GroqError ? err.status : undefined;
    const busy = status === 503 || status === 429;
    return NextResponse.json(
      {
        error: busy
          ? "The AI is busy right now. Please try again in a few seconds."
          : "Could not generate questions right now. Please try again.",
      },
      { status: busy ? 503 : 502 }
    );
  }
}
