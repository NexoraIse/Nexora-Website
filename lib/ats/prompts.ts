import type { JobRequirements, ResumeAnalysis } from "./types";

export const jobAnalysisPrompt = (description: string) => `Analyze this job description and return only valid JSON:
{
  "requiredSkills": ["skills explicitly required"],
  "preferredSkills": ["nice-to-have skills"],
  "qualifications": ["degrees, certifications, or education requirements"],
  "experience": ["years, roles, or domain experience requirements"]
}
Keep entries concise and do not invent requirements.

JOB DESCRIPTION:
${description}`;

export const resumeAnalysisPrompt = (resumeText: string) => `Extract the candidate information from this resume and return only valid JSON:
{
  "candidateName": "candidate name or Unknown",
  "contactInfo": ["email, phone, portfolio, or location if present"],
  "professionalSummary": "summary or objective text, or empty string",
  "skills": ["technical and professional skills"],
  "education": ["degrees and institutions"],
  "projects": ["notable projects"],
  "experience": ["roles, employers, and responsibilities"],
  "certifications": ["certifications"]
}
Do not infer information that is not present.

RESUME:
${resumeText}`;

export const evaluationPrompt = (
  requirements: JobRequirements | null,
  candidate: ResumeAnalysis,
) => `Review this resume for ATS compatibility and produce specific, evidence-based improvement guidance. Return only valid JSON:
{
  "strengths": ["specific strengths visible in the resume"],
  "weaknesses": ["specific weaknesses or missing sections"],
  "recommendations": [
    {"priority":"high","section":"Professional Summary","issue":"specific issue","action":"specific change","example":"optional rewrite example"}
  ],
  "matchingSkills": ["job requirements directly demonstrated by the candidate"],
  "missingSkills": ["required skills not demonstrated"],
  "missingKeywords": ["important job keywords absent from the resume"],
  "experienceAlignment": "brief explanation of alignment",
  "summary": "brief professional verdict",
  "improvedResume": "a complete improved plain-text resume draft using only facts present in the candidate resume"
}
Recommendations must be concrete and tailored to the supplied evidence. Never invent employers, dates, metrics, skills, or qualifications.

JOB REQUIREMENTS:
${JSON.stringify(requirements || "No job description supplied; focus on general ATS compatibility.")}

CANDIDATE:
${JSON.stringify(candidate)}`;
