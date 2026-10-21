import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// Judge0 CE language ids
const LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python 3
  c: 50, // C (GCC)
  java: 62, // Java (OpenJDK) - file must be Main.java, so class must be `Main`
};

const MAX_SOURCE = 20_000;
const MAX_STDIN = 5_000;

export async function POST(req: Request) {
  if (!rateLimit(req, "run", 40)) {
    return NextResponse.json({ error: "Too many runs. Wait a minute and try again." }, { status: 429 });
  }

  let body: { language?: string; source?: string; stdin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { language, source = "", stdin = "" } = body;
  const languageId = language ? LANGUAGE_IDS[language] : undefined;

  if (!languageId) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }
  if (!source.trim()) {
    return NextResponse.json({ error: "Write some code first." }, { status: 400 });
  }
  if (source.length > MAX_SOURCE || stdin.length > MAX_STDIN) {
    return NextResponse.json({ error: "Code or input is too long." }, { status: 400 });
  }

  // Public CE instance is rate limited: fine for development.
  // For production, self-host Judge0 or use a paid provider and set JUDGE0_URL.
  const baseUrl = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/$/, "");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_RAPIDAPI_KEY;
    headers["X-RapidAPI-Host"] = new URL(baseUrl).hostname;
  }
  if (process.env.JUDGE0_AUTH_TOKEN) {
    headers["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN;
  }

  try {
    const res = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        language_id: languageId,
        source_code: source,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 256000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Code runner error (${res.status}). ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      compileOutput: data.compile_output ?? "",
      status: data.status?.description ?? "Unknown",
      statusId: data.status?.id ?? 0,
      time: data.time ?? null,
      memory: data.memory ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the code runner." }, { status: 502 });
  }
}
