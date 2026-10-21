export type JobRequirements = {
  requiredSkills: string[];
  preferredSkills: string[];
  qualifications: string[];
  experience: string[];
};

export type ResumeAnalysis = {
  candidateName: string;
  contactInfo: string[];
  professionalSummary: string;
  skills: string[];
  education: string[];
  projects: string[];
  experience: string[];
  certifications: string[];
};

export type ScoreBreakdown = {
  sectionCompleteness: number;
  keywordRelevance: number;
  experienceEvidence: number;
  skillsCoverage: number;
  education: number;
};

export type EvaluationResult = {
  fileName: string;
  candidateName: string;
  score: number;
  verdict: "strong-match" | "potential-match" | "needs-improvement";
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  matchingSkills: string[];
  missingSkills: string[];
  experienceAlignment: string;
  summary: string;
  analysis: ResumeAnalysis;
};

export type EvaluationResponse = {
  jobRequirements: JobRequirements | null;
  result: EvaluationResult;
};
