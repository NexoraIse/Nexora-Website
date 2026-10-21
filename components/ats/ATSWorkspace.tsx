"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type {
  EvaluationResponse,
  EvaluationResult,
  Recommendation,
  ScoreBreakdown,
} from "@/lib/ats/types";

type Tab = "overview" | "recommendations" | "job-match" | "improved";

const scoreLabels: Array<{ key: keyof ScoreBreakdown; label: string; max: number }> = [
  { key: "sectionCompleteness", label: "Section completeness", max: 20 },
  { key: "keywordRelevance", label: "Keyword relevance", max: 30 },
  { key: "experienceEvidence", label: "Experience evidence", max: 25 },
  { key: "skillsCoverage", label: "Skills coverage", max: 15 },
  { key: "education", label: "Education", max: 10 },
];

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "text-emerald-200 border-emerald-300/40" : score >= 55 ? "text-amber-200 border-amber-300/40" : "text-rose-200 border-rose-300/40";
  return (
    <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 ${tone}`}>
      <span className="font-jersey text-4xl leading-none">{score}</span>
      <span className="mt-1 text-[9px] uppercase tracking-widest text-white/50">out of 100</span>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const tone = recommendation.priority === "high" ? "border-rose-300/30 bg-rose-300/[0.06]" : recommendation.priority === "medium" ? "border-amber-300/30 bg-amber-300/[0.06]" : "border-cyan-300/20 bg-cyan-300/[0.04]";
  return (
    <article className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{recommendation.section}</p>
        <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-widest text-white/60">{recommendation.priority} priority</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/65"><strong className="text-white">Issue:</strong> {recommendation.issue}</p>
      <p className="mt-2 text-sm leading-6 text-white/75"><strong className="text-cyan-200">Action:</strong> {recommendation.action}</p>
      {recommendation.example && <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm italic leading-6 text-white/60">“{recommendation.example}”</p>}
    </article>
  );
}

function VerdictPanel({ result }: { result: EvaluationResult }) {
  const verdict = result.verdict === "strong-match"
    ? {
        label: "Strong foundation",
        message: "This resume is structurally ready for screening. Focus on the prioritized refinements below to make the evidence sharper.",
        tone: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-100",
      }
    : result.verdict === "potential-match"
      ? {
          label: "Promising, needs refinement",
          message: "The resume has relevant evidence, but targeted improvements are needed before it will consistently perform well in ATS screening.",
          tone: "border-amber-300/30 bg-amber-300/[0.06] text-amber-100",
        }
      : {
          label: "Needs focused improvement",
          message: "Several ATS fundamentals are missing or underdeveloped. Start with the high-priority recommendations before applying.",
          tone: "border-rose-300/30 bg-rose-300/[0.06] text-rose-100",
        };

  const highPriorityCount = result.recommendations.filter((item) => item.priority === "high").length;
  return (
    <div className={`mt-6 rounded-2xl border p-5 ${verdict.tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Verdict</p>
          <h3 className="mt-1 font-clash text-xl font-semibold">{verdict.label}</h3>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-current/25 px-3 py-1.5">{result.score}/100 ATS score</span>
          <span className="rounded-full border border-current/25 px-3 py-1.5">{highPriorityCount} high priority</span>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 opacity-80">{verdict.message}</p>
    </div>
  );
}

function CandidateDashboard({ result, hasJobDescription }: { result: EvaluationResult; hasJobDescription: boolean }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const sortedRecommendations = [...result.recommendations].sort((first, second) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[first.priority] - priority[second.priority];
  });
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "recommendations", label: "Recommendations" },
    ...(hasJobDescription ? [{ key: "job-match" as const, label: "Job match" }] : []),
    { key: "improved", label: "Improved draft" },
  ];
  return (
    <article className="rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-5 shadow-[0_0_40px_rgba(0,240,255,0.04)] backdrop-blur-md sm:p-7">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <ScoreBadge score={result.score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Candidate report</p>
          <h2 className="mt-2 truncate font-clash text-2xl font-semibold text-white">{result.candidateName}</h2>
          <p className="mt-1 truncate text-sm text-white/40">{result.fileName}</p>
          <p className="mt-3 text-sm leading-6 text-white/70">{result.summary}</p>
        </div>
      </div>
      <VerdictPanel result={result} />

      <nav className="flex gap-2 overflow-x-auto border-b border-white/10 py-4">
        {tabs.map((item) => (
          <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${tab === item.key ? "bg-cyan-300 font-semibold text-slate-950" : "bg-white/[0.06] text-white/60 hover:text-white"}`}>
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="font-clash text-lg font-semibold text-white">ATS score breakdown</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">The score is calculated from fixed weights: sections (20), keywords (30), experience evidence (25), skills (15), and education (10).</p>
            <div className="mt-6 space-y-5">
              {scoreLabels.map((item) => <div key={item.key}><div className="mb-2 flex justify-between text-sm"><span className="text-white/70">{item.label}</span><span className="text-cyan-200">{result.scoreBreakdown[item.key]}/{item.max}</span></div><ProgressBar value={result.scoreBreakdown[item.key]} max={item.max} /></div>)}
            </div>
          </div>
          <div className="space-y-5">
            <div><h3 className="font-clash text-lg font-semibold text-white">Strengths</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-100/75">{result.strengths.length ? result.strengths.map((item) => <li key={item}>+ {item}</li>) : <li>No strengths identified yet.</li>}</ul></div>
            <div><h3 className="font-clash text-lg font-semibold text-white">Weaknesses</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-rose-100/75">{result.weaknesses.length ? result.weaknesses.map((item) => <li key={item}>− {item}</li>) : <li>No critical weaknesses identified.</li>}</ul></div>
          </div>
        </div>
      )}

      {tab === "recommendations" && <div className="mt-6"><div className="mb-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-6 text-white/65">Start with the high-priority items first. Each recommendation is tied to a detected resume issue and includes a concrete next action.</div><div className="grid gap-4">{sortedRecommendations.length ? sortedRecommendations.map((item, index) => <RecommendationCard key={`${item.section}-${index}`} recommendation={item} />) : <p className="text-sm text-white/60">No additional recommendations were returned.</p>}</div></div>}

      {tab === "job-match" && <div className="mt-6 grid gap-6 md:grid-cols-2"><div><h3 className="font-clash text-lg font-semibold text-white">Matching skills</h3><div className="mt-3 flex flex-wrap gap-2">{result.matchingSkills.map((item) => <span key={item} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">{item}</span>)}</div></div><div><h3 className="font-clash text-lg font-semibold text-white">Missing keywords and skills</h3><div className="mt-3 flex flex-wrap gap-2">{[...result.missingSkills, ...result.missingKeywords].map((item) => <span key={item} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs text-rose-100">{item}</span>)}</div></div><p className="text-sm leading-6 text-white/70 md:col-span-2"><strong className="text-white">Experience alignment:</strong> {result.experienceAlignment}</p></div>}

      {tab === "improved" && <div className="mt-6"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="max-w-2xl text-sm leading-6 text-white/55">This draft reorganizes and strengthens the supplied information. Review every claim before using it; no new facts should be added.</p><button type="button" disabled={!result.improvedResume} onClick={async () => { await navigator.clipboard.writeText(result.improvedResume); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="shrink-0 rounded-full border border-cyan-300/30 px-4 py-2 text-xs text-cyan-200 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40">{copied ? "Copied" : "Copy draft"}</button></div><div data-lenis-prevent tabIndex={0} className="max-h-[36rem] min-h-[18rem] overscroll-contain overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-5 font-mono text-sm leading-7 text-white/75"><pre className="whitespace-pre-wrap">{result.improvedResume || "No improved draft was generated."}</pre></div></div>}
    </article>
  );
}

export default function ATSWorkspace() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEvaluation(null);
    setIsLoading(true);
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    files.forEach((file) => formData.append("resumes", file));
    try {
      const response = await fetch("/api/ats/evaluate", { method: "POST", body: formData });
      const payload = (await response.json()) as EvaluationResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Evaluation failed.");
      setEvaluation(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Evaluation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="px-5 pb-20 pt-28 text-[var(--theme-bg-hero,#dce6ef)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-4xl text-center">
          <Link href="/" className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/[0.06] px-5 py-2 font-jersey text-xs uppercase tracking-[0.3em] text-cyan-300 transition hover:border-cyan-300/60 hover:text-white">&gt;_ Nexora | intelligent screening</Link>
          <h1 className="mt-8 font-clash text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">Resume <span className="text-cyan-300">evaluator.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-cyan-100/65 sm:text-lg">Evaluate one or more resumes, match them to a role, and turn clear findings into a stronger draft.</p>
        </header>

        <form onSubmit={handleSubmit} className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <label className="cursor-pointer rounded-3xl border border-cyan-300/25 bg-slate-950/45 p-7 shadow-[0_0_40px_rgba(0,240,255,0.04)] backdrop-blur-md transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.06]">
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 10))} />
            <span className="font-jersey text-4xl text-cyan-300">+</span><p className="mt-5 font-clash text-2xl font-semibold text-white">Upload resumes</p><p className="mt-2 text-sm leading-6 text-white/45">PDF or DOCX · up to 10 files · 8 MB each</p>
            <div className="mt-8 space-y-2 text-sm text-cyan-100/70">{files.length ? files.map((file) => <p key={`${file.name}-${file.lastModified}`} className="truncate">✓ {file.name}</p>) : <p>No files selected yet</p>}</div>
          </label>
          <div className="flex flex-col rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-7 backdrop-blur-md">
            <label htmlFor="job-description" className="font-clash text-2xl font-semibold text-white">Job description <span className="text-sm font-normal text-white/40">(optional)</span></label><p className="mt-2 text-sm text-white/45">Add a role to unlock keyword matching, missing skills, and experience alignment.</p>
            <textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the role requirements, responsibilities, and qualifications..." className="mt-5 min-h-44 flex-1 resize-y rounded-2xl border border-cyan-300/15 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60" />
            <button type="submit" disabled={isLoading || !files.length} className="mt-5 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.25)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">{isLoading ? "Analyzing resumes..." : "Run ATS evaluation →"}</button>
          </div>
        </form>

        {error && <div role="alert" className="mx-auto mt-6 max-w-5xl rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">{error}</div>}
        {evaluation && <section className="mx-auto mt-16 max-w-5xl space-y-6"><div className="flex flex-col justify-between gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end"><div><p className="font-jersey text-sm tracking-[0.3em] text-cyan-300">REPORTS READY</p><h2 className="mt-2 font-clash text-3xl font-semibold text-white">Resume intelligence dashboard</h2></div><p className="text-sm text-white/45">{evaluation.results.length} resume{evaluation.results.length === 1 ? "" : "s"} analyzed</p></div>{evaluation.results.map((result, index) => <CandidateDashboard key={`${result.fileName}-${index}`} result={result} hasJobDescription={Boolean(jobDescription.trim())} />)}</section>}
      </div>
    </section>
  );
}
