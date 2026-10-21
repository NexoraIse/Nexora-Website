import { createHash } from "node:crypto";
import { evaluationPrompt } from "./prompts";
import type {
  EvaluationResult,
  JobRequirements,
  ResumeAnalysis,
  ScoreBreakdown,
} from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_AI_INPUT = 45_000;
const cache = new Map<string, EvaluationResult>();

const ATS_TERMS = [
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java", "c++", "c#",
  "sql", "mysql", "postgresql", "mongodb", "aws", "azure", "gcp", "docker", "kubernetes",
  "git", "github", "figma", "rest", "restful", "graphql", "html", "css", "tailwind",
  "machine learning", "artificial intelligence", "data analysis", "data structures",
  "algorithms", "object oriented programming", "microservices", "distributed systems",
  "software development", "system design", "api", "ci/cd", "continuous integration",
  "continuous delivery", "agile", "scrum", "teamwork", "collaboration", "communication",
  "problem solving", "scalable services", "cloud computing", "unit testing", "jest",
  "spring", "spring boot", "hibernate", "swing", "jdbc", "linux",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]/g, " ").replace(/\s+/g, " ").trim();
}

function parseModelJson<T>(content: string): T {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("Groq returned invalid evaluation JSON.");
  }
}

function extractKeywords(jobDescription: string): string[] {
  const normalizedDescription = normalize(jobDescription);
  return ATS_TERMS.filter((term) => normalizedDescription.includes(normalize(term)));
}

function containsKeyword(text: string, keyword: string) {
  return ` ${normalize(text)} `.includes(` ${normalize(keyword)} `);
}

function hasSection(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasProfessionalExperience(text: string) {
  const hasExplicitAbsence = /\b(?:no|without|lack(?:ing)?)\s+(?:any\s+)?(?:professional\s+)?(?:work\s+)?experience\b/i.test(text);
  if (hasExplicitAbsence) return false;

  const hasEmploymentContext = /\b(?:intern(?:ship)?|employment|work history|professional experience|software engineer|software developer|full[- ]stack developer|frontend developer|backend developer|web developer|data analyst|research assistant)\b/i.test(text);
  const hasDateRange = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|19\d{2}|20\d{2})\b[\s\S]{0,35}\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|19\d{2}|20\d{2}|present)\b/i.test(text);
  return hasEmploymentContext && hasDateRange;
}

function analyzeLocally(text: string, jobDescription: string): {
  breakdown: ScoreBreakdown;
  score: number;
  missingKeywords: string[];
  matchingSkills: string[];
  missingSkills: string[];
  analysis: ResumeAnalysis;
} {
  const lower = text.toLowerCase();
  const keywords = extractKeywords(jobDescription);
  const matchingKeywords = keywords.filter((keyword) => containsKeyword(text, keyword));
  const missingKeywords = keywords.filter((keyword) => !matchingKeywords.includes(keyword)).slice(0, 15);
  const contactInfo = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d ()-]{7,}/gi) || [];
  const analysis: ResumeAnalysis = {
    candidateName: text.split(/\s{2,}|\n/).find((line) => line.trim().length > 2)?.trim() || "Unknown candidate",
    contactInfo,
    professionalSummary: hasSection(lower, [/summary|objective|profile/]) ? "Detected" : "",
    skills: hasSection(lower, [/skills|technical skills|competencies/]) ? ["Skills section detected"] : [],
    education: hasSection(lower, [/education|university|college|bachelor|master|degree/]) ? ["Education section detected"] : [],
    projects: hasSection(lower, [/projects|portfolio/]) ? ["Projects section detected"] : [],
    experience: hasSection(lower, [/experience|employment|work history|internship/]) ? ["Experience section detected"] : [],
    certifications: hasSection(lower, [/certifications?|licenses?/]) ? ["Certifications section detected"] : [],
  };
  const sectionCompleteness = [analysis.professionalSummary, ...analysis.skills, ...analysis.education, ...analysis.projects, ...analysis.experience, ...analysis.certifications].filter(Boolean).length;
  const sectionScore = Math.min(20, sectionCompleteness * 3);
  const keywordScore = jobDescription ? Math.round((matchingKeywords.length / Math.max(keywords.length, 1)) * 30) : 15;
  const experienceEvidence = hasProfessionalExperience(text)
    ? Math.min(25, 10 + Math.min(8, (text.match(/\d+%|\d+\+?\s*(?:years?|users?|projects?)/gi) || []).length * 2) + Math.min(7, (text.match(/\b(led|built|developed|designed|improved|implemented|managed|created|optimized)\b/gi) || []).length))
    : 0;
  const breakdown = { sectionCompleteness: sectionScore, keywordRelevance: keywordScore, experienceEvidence, skillsCoverage: analysis.skills.length ? 15 : 4, education: analysis.education.length ? 10 : 0 };
  const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  return { breakdown, score, missingKeywords, matchingSkills: matchingKeywords, missingSkills: missingKeywords, analysis };
}

async function askGroq(resumeText: string, jobDescription: string): Promise<Pick<EvaluationResult, "strengths" | "weaknesses" | "experienceAlignment" | "summary"> & { candidateName: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured on the server.");
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a precise, practical resume improvement consultant." },
        { role: "user", content: evaluationPrompt(resumeText.slice(0, MAX_AI_INPUT), jobDescription.slice(0, 12000)) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq request failed with status ${response.status}.`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty evaluation.");
  return parseModelJson(content);
}

export async function evaluateResume(
  fileName: string,
  resumeText: string,
  jobDescription: string,
): Promise<{ jobRequirements: JobRequirements | null; result: EvaluationResult }> {
  const key = createHash("sha256").update(`${resumeText}\n---\n${jobDescription}`).digest("hex");
  const cached = cache.get(key);
  if (cached) return { jobRequirements: null, result: { ...cached, fileName } };
  const local = analyzeLocally(resumeText, jobDescription);
  const ai = await askGroq(resumeText, jobDescription);
  const result: EvaluationResult = {
    ...ai,
    candidateName: ai.candidateName || local.analysis.candidateName,
    fileName,
    score: local.score,
    verdict: local.score >= 75 ? "strong-match" : local.score >= 55 ? "potential-match" : "needs-improvement",
    scoreBreakdown: local.breakdown,
    strengths: ai.strengths || [],
    weaknesses: ai.weaknesses || [],
    missingKeywords: local.missingKeywords,
    matchingSkills: local.matchingSkills,
    missingSkills: local.missingSkills,
    analysis: local.analysis,
  };
  cache.set(key, result);
  return { jobRequirements: null, result };
}
