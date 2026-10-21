"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { EvaluationResponse, EvaluationResult, ScoreBreakdown } from "@/lib/ats/types";

const scoreLabels: Array<{ key: keyof ScoreBreakdown; label: string; max: number }> = [
  { key: "sectionCompleteness", label: "Structure", max: 20 },
  { key: "keywordRelevance", label: "Keywords", max: 30 },
  { key: "experienceEvidence", label: "Experience evidence", max: 25 },
  { key: "skillsCoverage", label: "Skills", max: 15 },
  { key: "education", label: "Education", max: 10 },
];

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "text-emerald-200 border-emerald-300/40" : score >= 55 ? "text-amber-200 border-amber-300/40" : "text-rose-200 border-rose-300/40";
  return <div className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 ${tone}`}><span className="font-jersey text-5xl leading-none">{score}</span><span className="mt-1 text-[9px] uppercase tracking-widest text-white/50">estimated ATS</span></div>;
}

function Report({ result }: { result: EvaluationResult }) {
  const label = result.verdict === "strong-match" ? "Strong foundation" : result.verdict === "potential-match" ? "Promising, needs refinement" : "Needs focused improvement";
  return <section className="mx-auto mt-14 max-w-5xl rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-5 shadow-[0_0_40px_rgba(0,240,255,0.04)] backdrop-blur-md sm:p-8">
    <div className="flex flex-col gap-6 border-b border-white/10 pb-7 sm:flex-row sm:items-center"><ScoreRing score={result.score} /><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Evaluation overview</p><h2 className="mt-2 truncate font-clash text-2xl font-semibold text-white">{result.candidateName}</h2><p className="mt-1 truncate text-sm text-white/40">{result.fileName}</p><p className="mt-3 text-lg font-semibold text-white">{label}</p><p className="mt-1 text-sm leading-6 text-white/60">{result.summary}</p></div></div>
    <p className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-xs leading-5 text-white/55">This is an estimate based on transparent resume structure, keyword, experience, skills, and education checks. Real ATS platforms use different screening rules.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div><h3 className="font-clash text-xl font-semibold text-white">ATS score</h3><div className="mt-5 space-y-4">{scoreLabels.map((item) => <div key={item.key}><div className="mb-1 flex justify-between text-sm text-white/65"><span>{item.label}</span><span className="text-cyan-200">{result.scoreBreakdown[item.key]}/{item.max}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${(result.scoreBreakdown[item.key] / item.max) * 100}%` }} /></div></div>)}</div></div>
      <div><h3 className="font-clash text-xl font-semibold text-white">Strengths</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-emerald-100/75">{result.strengths.length ? result.strengths.map((item) => <li key={item}>+ {item}</li>) : <li>No strengths were identified.</li>}</ul><h3 className="mt-7 font-clash text-xl font-semibold text-white">Weaknesses</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-rose-100/75">{result.weaknesses.length ? result.weaknesses.map((item) => <li key={item}>− {item}</li>) : <li>No critical weaknesses were identified.</li>}</ul></div>
    </div>
    {(result.matchingSkills.length || result.missingKeywords.length) > 0 && <div className="mt-8 border-t border-white/10 pt-7"><h3 className="font-clash text-xl font-semibold text-white">Job description match</h3><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-widest text-emerald-300">Present keywords</p><div className="mt-3 flex flex-wrap gap-2">{result.matchingSkills.map((item) => <span key={item} className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">{item}</span>)}</div></div><div><p className="text-xs uppercase tracking-widest text-rose-300">Missing keywords</p><div className="mt-3 flex flex-wrap gap-2">{result.missingKeywords.map((item) => <span key={item} className="rounded-full bg-rose-300/10 px-3 py-1.5 text-xs text-rose-100">{item}</span>)}</div></div></div></div>}
    <div className="mt-8 border-t border-white/10 pt-7"><h3 className="font-clash text-xl font-semibold text-white">Final verdict</h3><p className="mt-3 text-lg font-semibold text-cyan-100">{label}</p><p className="mt-2 text-sm leading-7 text-white/65">{result.summary}</p><p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/60"><span className="font-semibold text-white">Role alignment:</span> {result.experienceAlignment}</p></div>
  </section>;
}

export default function ATSWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setEvaluation(null); setLoading(true);
    const body = new FormData(); if (file) body.append("resume", file); body.append("jobDescription", jobDescription);
    try { const response = await fetch("/api/ats/evaluate", { method: "POST", body }); const payload = (await response.json()) as EvaluationResponse & { error?: string }; if (!response.ok) throw new Error(payload.error || "Evaluation failed."); setEvaluation(payload.result); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Evaluation failed."); } finally { setLoading(false); }
  }
  return <section className="px-5 pb-20 pt-28 text-[var(--theme-bg-hero,#dce6ef)] sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><header className="mx-auto max-w-4xl text-center"><Link href="/" className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/[0.06] px-5 py-2 font-jersey text-xs uppercase tracking-[0.3em] text-cyan-300">&gt;_ Nexora | resume intelligence</Link><h1 className="mt-8 font-clash text-5xl font-bold leading-[0.95] text-white sm:text-7xl lg:text-8xl">Resume <span className="text-cyan-300">evaluator.</span></h1><p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-cyan-100/65 sm:text-lg">One resume. One clear report. Practical changes that make your application stronger.</p></header><form onSubmit={submit} className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]"><label className="cursor-pointer rounded-3xl border border-cyan-300/25 bg-slate-950/45 p-7 backdrop-blur-md transition hover:border-cyan-300/70"><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span className="font-jersey text-4xl text-cyan-300">+</span><p className="mt-5 font-clash text-2xl font-semibold text-white">Upload one resume</p><p className="mt-2 text-sm text-white/45">PDF or DOCX · maximum 8 MB</p><p className="mt-8 truncate text-sm text-cyan-100/70">{file ? `✓ ${file.name}` : "No file selected yet"}</p></label><div className="flex flex-col rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-7 backdrop-blur-md"><label htmlFor="job-description" className="font-clash text-2xl font-semibold text-white">Job description <span className="text-sm font-normal text-white/40">(optional)</span></label><p className="mt-2 text-sm text-white/45">Add a role to check missing keywords and skills.</p><textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the role requirements..." className="mt-5 min-h-44 flex-1 resize-y rounded-2xl border border-cyan-300/15 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60" /><button type="submit" disabled={loading || !file} className="mt-5 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Analyzing resume..." : "Evaluate resume →"}</button></div></form>{error && <div role="alert" className="mx-auto mt-6 max-w-5xl rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">{error}</div>}{evaluation && <Report result={evaluation} />}</div></section>;
}
