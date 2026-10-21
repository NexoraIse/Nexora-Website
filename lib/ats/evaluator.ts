import {
  evaluationPrompt,
  jobAnalysisPrompt,
  resumeAnalysisPrompt,
} from "./prompts";
import type { EvaluationResult, JobRequirements, ResumeAnalysis } from "./types";
import type { Recommendation, ScoreBreakdown } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function parseModelJson<T>(content: string, operation: string): T {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Groq returned invalid JSON while ${operation}.`);
  }
}

async function askGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server.");
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a precise applicant tracking system evaluator.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq request failed with status ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
}

async function analyzeResume(text: string): Promise<ResumeAnalysis> {
  return parseModelJson<ResumeAnalysis>(
    await askGroq(resumeAnalysisPrompt(text)),
    "analyzing a resume",
  );
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.]/g, " ").replace(/\s+/g, " ").trim();

function containsTerm(text: string, term: string): boolean {
  const haystack = ` ${normalize(text)} `;
  const needle = ` ${normalize(term)} `;
  return haystack.includes(needle) || haystack.includes(` ${normalize(term)} `);
}

function calculateBreakdown(
  resumeText: string,
  analysis: ResumeAnalysis,
  requirements: JobRequirements | null,
): ScoreBreakdown {
  const sectionCompleteness =
    (analysis.contactInfo.length ? 3 : 0) +
    (analysis.professionalSummary.trim() ? 3 : 0) +
    (analysis.skills.length ? 4 : 0) +
    (analysis.experience.length ? 4 : 0) +
    (analysis.education.length ? 3 : 0) +
    (analysis.projects.length ? 2 : 0) +
    (analysis.certifications.length ? 1 : 0);
  const requiredTerms = requirements?.requiredSkills ?? [];
  const preferredTerms = requirements?.preferredSkills ?? [];
  const requiredMatch = requiredTerms.length
    ? requiredTerms.filter((term) => containsTerm(resumeText, term)).length / requiredTerms.length
    : Math.min(analysis.skills.length / 10, 1);
  const preferredMatch = preferredTerms.length
    ? preferredTerms.filter((term) => containsTerm(resumeText, term)).length / preferredTerms.length
    : Math.min(analysis.skills.length / 10, 1);
  const keywordRelevance = Math.round(requiredMatch * 22 + preferredMatch * 8);
  const quantifiedEvidence = (resumeText.match(/\b\d+(?:\.\d+)?\s*%|\b\d+\+?\s*(?:years?|users?|projects?|clients?|teams?)\b/gi) || []).length;
  const actionVerbs = (resumeText.match(/\b(led|built|developed|designed|improved|increased|reduced|implemented|automated|delivered|managed|created|optimized)\b/gi) || []).length;
  const experienceEvidence = Math.min(25,
    (analysis.experience.length ? 10 : 0) +
    Math.min(8, quantifiedEvidence * 2) +
    Math.min(7, actionVerbs),
  );
  const skillsCoverage = Math.min(15, analysis.skills.length * 1.5);
  const education = analysis.education.length ? 10 : 0;

  return {
    sectionCompleteness,
    keywordRelevance,
    experienceEvidence,
    skillsCoverage: Math.round(skillsCoverage),
    education,
  };
}

function totalScore(breakdown: ScoreBreakdown): number {
  return Math.max(0, Math.min(100, Math.round(
    breakdown.sectionCompleteness +
    breakdown.keywordRelevance +
    breakdown.experienceEvidence +
    breakdown.skillsCoverage +
    breakdown.education,
  )));
}

function fallbackRecommendations(
  analysis: ResumeAnalysis,
  breakdown: ScoreBreakdown,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (!analysis.professionalSummary.trim()) {
    recommendations.push({
      priority: "high",
      section: "Professional Summary",
      issue: "No professional summary was detected.",
      action: "Add a two-to-four-line summary focused on your target role, strongest skills, and measurable value.",
    });
  }
  if (!analysis.experience.length) {
    recommendations.push({
      priority: "high",
      section: "Work Experience",
      issue: "No work experience entries were detected.",
      action: "Add reverse-chronological roles with dates, responsibilities, and outcomes. Use projects or internships when formal employment is unavailable.",
    });
  }
  if (breakdown.experienceEvidence < 15) {
    recommendations.push({
      priority: "medium",
      section: "Work Experience",
      issue: "Experience bullets contain limited measurable or action-oriented evidence.",
      action: "Start bullets with strong action verbs and add metrics such as time saved, users reached, performance improved, or scope delivered.",
    });
  }
  if (!analysis.projects.length) {
    recommendations.push({
      priority: "medium",
      section: "Projects",
      issue: "No projects were detected.",
      action: "Add two or three relevant projects with the problem, technologies used, your contribution, and the outcome.",
    });
  }
  if (!analysis.certifications.length) {
    recommendations.push({
      priority: "low",
      section: "Certifications",
      issue: "No certifications were detected.",
      action: "Include relevant completed certifications only when they strengthen the target role.",
    });
  }
  return recommendations;
}

export async function evaluateResumes(
  jobDescription: string,
  resumes: Array<{ fileName: string; text: string }>,
): Promise<{ jobRequirements: JobRequirements | null; results: EvaluationResult[] }> {
  const jobRequirements = jobDescription.trim()
    ? parseModelJson<JobRequirements>(
      await askGroq(jobAnalysisPrompt(jobDescription)),
      "analyzing the job description",
    )
    : null;

  const results = await Promise.all(
    resumes.map(async ({ fileName, text }) => {
      const analysis = await analyzeResume(text);
      const evaluation = parseModelJson<Omit<EvaluationResult, "fileName" | "candidateName" | "analysis" | "score" | "verdict" | "scoreBreakdown">>(
        await askGroq(evaluationPrompt(jobRequirements, analysis)),
        "evaluating a resume",
      );
      const scoreBreakdown = calculateBreakdown(text, analysis, jobRequirements);
      const score = totalScore(scoreBreakdown);
      const recommendations = [
        ...fallbackRecommendations(analysis, scoreBreakdown),
        ...(evaluation.recommendations || []),
      ].slice(0, 8);

      return {
        ...evaluation,
        score,
        verdict: (score >= 75 ? "strong-match" : score >= 55 ? "potential-match" : "needs-improvement") as EvaluationResult["verdict"],
        scoreBreakdown,
        recommendations,
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        missingKeywords: evaluation.missingKeywords || [],
        improvedResume: evaluation.improvedResume || "",
        fileName,
        candidateName: analysis.candidateName || "Unknown candidate",
        analysis,
      };
    }),
  );

  return {
    jobRequirements,
    results: results.sort((first, second) => second.score - first.score),
  };
}
