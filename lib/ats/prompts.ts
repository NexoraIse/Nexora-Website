export const evaluationPrompt = (resumeText: string, jobDescription: string) => `Review this resume and return only valid JSON. The ATS score is calculated separately by the application, so do not provide a score.
{
  "candidateName": "candidate name or Unknown",
  "strengths": ["specific strengths visible in the resume"],
  "weaknesses": ["specific weaknesses or missing sections"],
  "experienceAlignment": "brief explanation of alignment",
  "summary": "brief professional verdict"
}
Keep each strength and weakness concise, specific, and evidence-based. Never invent employers, dates, metrics, skills, or qualifications.

JOB DESCRIPTION (optional):
${jobDescription || "Not provided; focus on general ATS compatibility."}

RESUME:
${resumeText}`;
