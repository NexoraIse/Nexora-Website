"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Code2,
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
  Terminal,
  CornerDownRight,
  Send,
  HelpCircle,
  Award,
  ChevronDown,
  ArrowRight,
  Clock,
  HardDrive,
  GitBranch,
  Bell,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";


const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#070b16] text-xs text-[var(--theme-primary,#00f0ff)]/70 font-terminal">
      <span className="h-4 w-4 rounded-full border-2 border-[var(--theme-primary,#00f0ff)] border-t-transparent animate-spin" />
      <span>INITIALIZING MONACO CYBER COMPILER...</span>
    </div>
  ),
});

/* -------------------------------------------------------------------------- */
/* CONSTANTS & TYPES                                                          */
/* -------------------------------------------------------------------------- */

type Lang = "python" | "c" | "java";
type Difficulty = "Easy" | "Medium" | "Hard";

const LANGS: {
  id: Lang;
  label: string;
  file: string;
  langName: string;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: "python",
    label: "Python 3",
    file: "solution.py",
    langName: "Python",
    badge: "PY",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  },
  {
    id: "c",
    label: "C (GCC)",
    file: "solution.c",
    langName: "C",
    badge: "C",
    badgeColor: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  },
  {
    id: "java",
    label: "Java (OpenJDK)",
    file: "Main.java",
    langName: "Java",
    badge: "J",
    badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  },
];

const STARTERS: Record<Lang, string> = {
  python: `# Nexora Cyber Compiler — Python 3
# Read input with input(), output with print()

import sys

def main():
    # Read all input from standard input
    raw_input = sys.stdin.read().split()
    if not raw_input:
        return
    
    # Process problem logic here
    print(" ".join(raw_input))

if __name__ == "__main__":
    main()
`,
  c: `// Nexora Cyber Compiler — C (GCC)
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%d\\n", n);
    }
    return 0;
}
`,
  java: `// Nexora Cyber Compiler — Java 17+
// NOTE: Please keep the public class name as 'Main'
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String val = sc.next();
            System.out.println(val);
        }
    }
}
`,
};

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

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

type Problem = {
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  samples: { input: string; output: string; explanation?: string }[];
  testCases: { input: string; output: string }[];
};

type RunResult = {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  statusId: number;
  time: string | null;
  memory: number | null;
};

type TestResult = {
  pass: boolean;
  input: string;
  expected: string;
  got: string;
  note?: string;
};

type MCQ = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

/* -------------------------------------------------------------------------- */
/* REUSABLE UI PRIMITIVES                                                     */
/* -------------------------------------------------------------------------- */

function CustomSelect<T extends string | number>({
  label,
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  label?: string;
  value: T;
  onChange: (val: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="font-mono text-xs font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={ariaLabel || label}
          className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#070b16] pl-3.5 pr-9 font-mono text-xs text-white/90 outline-none transition-all duration-200 hover:border-white/25 focus:border-[var(--theme-primary,#00f0ff)]/60 focus:ring-1 focus:ring-[var(--theme-primary,#00f0ff)]/40 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value} className="bg-[#0f1117] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

async function runCode(language: Lang, source: string, stdin: string): Promise<RunResult> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, source, stdin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Run failed.");
  return data;
}

function normalize(s: string) {
  return s
    .replace(/\r/g, "")
    .trim()
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n");
}

function describeRun(r: RunResult) {
  if (r.compileOutput) return r.compileOutput;
  if (r.stderr) return r.stderr;
  return r.stdout;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
      <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
      <span className="font-mono text-xs">{message}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CODING TAB                                                                 */
/* -------------------------------------------------------------------------- */

function CodingTab() {
  const [topic, setTopic] = useState(CODING_TOPICS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const [lang, setLang] = useState<Lang>("python");
  const [codes, setCodes] = useState<Record<Lang, string>>(STARTERS);
  const [stdin, setStdin] = useState("");

  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const editorRef = useRef<any>(null);
  const cursorSubRef = useRef<any>(null);

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme("nexora-cyber", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "00f0ff", fontStyle: "bold" },
        { token: "keyword.control", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "class", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "identifier", foreground: "D4D4D4" },
        { token: "delimiter", foreground: "D4D4D4" },
      ],
      colors: {
        "editor.background": "#0f1117",
        "editor.foreground": "#D4D4D4",
        "editorCursor.foreground": "#00f0ff",
        "editor.lineHighlightBackground": "#161b26",
        "editorLineNumber.foreground": "#495162",
        "editorLineNumber.activeForeground": "#00f0ff",
        "editor.selectionBackground": "#00f0ff28",
        "editor.inactiveSelectionBackground": "#00f0ff14",
        "editorIndentGuide.background": "#232936",
        "editorIndentGuide.activeBackground": "#3b4457",
        "editorGutter.background": "#0f1117",
      },
    });
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (cursorSubRef.current) {
      cursorSubRef.current.dispose();
    }
    cursorSubRef.current = editor.onDidChangeCursorPosition((e: any) => {
      setCursor({ line: e.position.lineNumber, col: e.position.column });
    });
    const pos = editor.getPosition();
    if (pos) {
      setCursor({ line: pos.lineNumber, col: pos.column });
    }
  };

  React.useEffect(() => {
    return () => {
      if (cursorSubRef.current) {
        cursorSubRef.current.dispose();
      }
    };
  }, []);

  async function generate() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "coding", topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate a problem.");
      setProblem(data.problem);
      setStdin(data.problem.samples?.[0]?.input ?? "");
      setOutput(null);
      setResults(null);
      setRunError("");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function run() {
    setRunning(true);
    setRunError("");
    setResults(null);
    try {
      setOutput(await runCode(lang, codes[lang], stdin));
    } catch (e) {
      setOutput(null);
      setRunError(e instanceof Error ? e.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  async function submit() {
    if (!problem) return;
    setSubmitting(true);
    setRunError("");
    setOutput(null);
    const collected: TestResult[] = [];
    setResults([]);
    try {
      for (const tc of problem.testCases) {
        const r = await runCode(lang, codes[lang], tc.input);
        if (r.statusId !== 3) {
          collected.push({
            pass: false,
            input: tc.input,
            expected: tc.output,
            got: describeRun(r),
            note: r.status,
          });
          setResults([...collected]);
          break;
        }
        collected.push({
          pass: normalize(r.stdout) === normalize(tc.output),
          input: tc.input,
          expected: tc.output,
          got: r.stdout,
        });
        setResults([...collected]);
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const passed = results?.filter((r) => r.pass).length ?? 0;
  const total = problem?.testCases.length ?? 0;
  const busy = running || submitting;
  const currentFile = LANGS.find((l) => l.id === lang) || LANGS[0];

  return (
    <div className="space-y-6">
      {/* ── Control Console / Filter Bar ── */}
      {/* ── Control Bar ── */}
      <div className="rounded-2xl border border-white/10 bg-[#070b16]/80 p-4 sm:p-5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            {/* Topic Select */}
            <CustomSelect
              label="Topic"
              value={topic}
              onChange={(val) => setTopic(val)}
              options={CODING_TOPICS.map((t) => ({ value: t, label: t }))}
              className="w-full sm:w-56"
            />

            {/* Difficulty Select */}
            <CustomSelect
              label="Difficulty"
              value={difficulty}
              onChange={(val) => setDifficulty(val as Difficulty)}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              className="w-full sm:w-36"
            />

            {/* Generator Action Button */}
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary,#00f0ff)] px-5 font-clash text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] shadow-md transition-all duration-200 hover:bg-white hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              <span>{generating ? "Generating..." : problem ? "Next Challenge" : "Generate Challenge"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-white/50 pb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Ready to Code</span>
          </div>
        </div>
      </div>

      {genError && <ErrorBox message={genError} />}

      {/* ── Main Workspace Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Problem Spec Panel ── */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#070b16]/90 shadow-xl backdrop-blur-xl lg:max-h-[860px]">
          {/* Deck Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#070a12] px-4 py-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[var(--theme-primary,#00f0ff)]" />
              <span className="font-mono text-xs font-medium text-white/90">
                Problem Description
              </span>
            </div>

            {problem && (
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-white/70">
                  {topic}
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 font-mono text-[11px] font-semibold border ${
                    difficulty === "Easy"
                      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                      : difficulty === "Medium"
                      ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                      : "text-rose-400 border-rose-400/30 bg-rose-400/10"
                  }`}
                >
                  {difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 terminal-scroll">
            {generating && !problem ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <span className="h-6 w-6 rounded-full border-2 border-[var(--theme-primary,#00f0ff)] border-t-transparent animate-spin" />
                <p className="font-mono text-sm text-white/70">
                  Generating problem requirements...
                </p>
              </div>
            ) : problem ? (
              <div className="space-y-6">
                <div>
                  <h2 className="font-clash text-2xl font-bold tracking-tight text-[var(--theme-bg-hero,#dce6ef)]">
                    {problem.title}
                  </h2>
                  <p className="mt-3 whitespace-pre-line font-cabinet text-sm sm:text-base leading-7 text-white/85">
                    {problem.description}
                  </p>
                </div>

                {problem.inputFormat && (
                  <div className="rounded-xl border border-white/10 bg-[#090d16] p-4">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary,#00f0ff)]">
                      Input Format
                    </h3>
                    <p className="mt-2 whitespace-pre-line font-mono text-xs leading-6 text-white/80">
                      {problem.inputFormat}
                    </p>
                  </div>
                )}

                {problem.outputFormat && (
                  <div className="rounded-xl border border-white/10 bg-[#090d16] p-4">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary,#00f0ff)]">
                      Output Format
                    </h3>
                    <p className="mt-2 whitespace-pre-line font-mono text-xs leading-6 text-white/80">
                      {problem.outputFormat}
                    </p>
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#090d16] p-4">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary,#00f0ff)]">
                      Constraints
                    </h3>
                    <ul className="mt-2 space-y-1.5 font-mono text-xs text-white/80">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--theme-primary,#00f0ff)]">&bull;</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Samples */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white/70">
                    Sample Test Cases
                  </h3>
                  {problem.samples.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-[#090d16] p-4 transition-all hover:border-white/20"
                    >
                      <div className="mb-2.5 flex items-center justify-between font-mono text-xs text-white/70">
                        <span className="font-medium text-white/90">Example {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setStdin(s.input)}
                          className="flex items-center gap-1.5 text-xs text-[var(--theme-primary,#00f0ff)] transition-colors hover:text-white cursor-pointer font-mono"
                        >
                          <Terminal className="h-3 w-3" />
                          <span>Use as Input</span>
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                          <span className="block font-mono text-[10px] uppercase text-white/50 tracking-wider">
                            Input
                          </span>
                          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-white/90">
                            {s.input || "(empty)"}
                          </pre>
                        </div>
                        <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                          <span className="block font-mono text-[10px] uppercase text-white/50 tracking-wider">
                            Expected Output
                          </span>
                          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-emerald-300">
                            {s.output || "(empty)"}
                          </pre>
                        </div>
                      </div>

                      {s.explanation && (
                        <p className="mt-2.5 border-t border-white/5 pt-2 font-cabinet text-xs leading-5 text-white/60">
                          <strong className="text-white/80">Explanation: </strong>
                          {s.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Clean Developer Empty State */
              <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-xl p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--theme-primary,#00f0ff)] mb-4">
                  <Code2 className="h-7 w-7" />
                </div>
                <h3 className="font-clash text-xl font-bold text-white">
                  Ready for a Challenge?
                </h3>
                <p className="mt-2 max-w-sm font-cabinet text-sm text-white/60 leading-relaxed">
                  Select a topic domain and difficulty above, then click <strong className="text-[var(--theme-primary,#00f0ff)]">Generate Challenge</strong> to start practicing.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {CODING_TOPICS.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTopic(t);
                      }}
                      className={`rounded-lg border px-3 py-1 font-mono text-xs transition-all cursor-pointer ${
                        topic === t
                          ? "border-[var(--theme-primary,#00f0ff)]/50 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Right: Code Deck & Results Panel ── */}
        <section className="flex flex-col gap-5">
          {/* VS Code Dark Modern Editor Window */}
          <div className="overflow-hidden rounded-xl border border-[var(--theme-primary,#00f0ff)]/25 bg-[#0f1117] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col">
            {/* 1. Title bar (h-9) */}
            <div className="relative flex h-9 items-center justify-between border-b border-white/10 bg-[#070a12] px-3.5 select-none shrink-0">
              {/* macOS three dots */}
              <div className="flex items-center gap-1.5 z-10">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]/85" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/85" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]/85" />
              </div>

              {/* Centered muted text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                <span className="truncate font-mono text-[11px] text-white/50 tracking-wide">
                  {currentFile.file} &mdash; Nexora Cyber Compiler
                </span>
              </div>

              <div className="w-8 z-10" />
            </div>

            {/* 2. Tab bar (h-9, bg slightly darker than editor, border-b) */}
            <div className="flex h-9 items-stretch justify-between border-b border-white/10 bg-[#090d16] overflow-x-auto no-scrollbar whitespace-nowrap select-none shrink-0">
              {/* Active Tab */}
              <div className="flex items-center gap-2 border-r border-white/10 border-t-2 border-t-[var(--theme-primary,#00f0ff)] bg-[#0f1117] px-3.5 py-1 shrink-0">
                <span
                  className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${currentFile.badgeColor}`}
                >
                  {currentFile.badge}
                </span>
                <span className="font-mono text-xs text-white/90">{currentFile.file}</span>
                <span className="ml-1 text-white/40 hover:text-white/80 cursor-pointer">
                  <X className="h-3 w-3" />
                </span>
              </div>

              {/* Tab Controls (Never wrap onto second row) */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 shrink-0">
                {/* Language selector */}
                <div className="relative shrink-0">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Lang)}
                    aria-label="Programming language"
                    className="h-7 appearance-none rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[#070b16] pl-2.5 pr-6 font-terminal text-[11px] font-bold text-[var(--theme-primary,#00f0ff)] outline-none transition-all hover:border-[var(--theme-primary,#00f0ff)] focus:shadow-[0_0_8px_rgba(0,240,255,0.3)] cursor-pointer"
                  >
                    {LANGS.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0f1117] text-white">
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--theme-primary,#00f0ff)]" />
                </div>

                {/* Reset button (ghost icon button with tooltip) */}
                <button
                  type="button"
                  onClick={() => setCodes((c) => ({ ...c, [lang]: STARTERS[lang] }))}
                  className="flex h-7 items-center gap-1 rounded-full px-2 font-terminal text-[11px] text-white/50 transition-colors hover:text-[var(--theme-primary,#00f0ff)] hover:bg-white/5 cursor-pointer shrink-0"
                  title="Reset to starter boilerplate"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                {/* RUN: outlined cyan pill with play icon */}
                <button
                  type="button"
                  onClick={run}
                  disabled={busy}
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded-full border border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-primary,#00f0ff)]/10 px-2.5 sm:px-3 font-clash text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--theme-primary,#00f0ff)] transition-all hover:bg-[var(--theme-primary,#00f0ff)]/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Play className={`h-2.5 w-2.5 fill-current ${running ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">{running ? "Compiling..." : "Run"}</span>
                  <span className="sm:hidden">{running ? "..." : "Run"}</span>
                </button>

                {/* SUBMIT SUITE: solid cyan pill with send icon */}
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !problem}
                  title={problem ? "Execute against all hidden test suites" : "Generate a challenge to submit"}
                  className="group inline-flex h-7 items-center justify-center gap-1.5 rounded-full bg-[var(--theme-primary,#00f0ff)] px-3 sm:px-3.5 font-clash text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--theme-bg-main,#060913)] shadow-md transition-all hover:bg-white hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Send className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{submitting ? "Testing..." : "Submit Suite"}</span>
                  <span className="sm:hidden">{submitting ? "..." : "Submit"}</span>
                </button>
              </div>
            </div>

            {/* 3. Breadcrumb bar (h-6, text-[11px], muted) */}
            <div className="flex h-6 items-center gap-1 border-b border-white/5 bg-[#0b0f19] px-3 font-mono text-[11px] text-white/45 select-none overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
              <span className="hover:text-white/70 transition-colors">nexora</span>
              <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
              <span className="hover:text-white/70 transition-colors">practice</span>
              <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
              <span className="text-white/70">{currentFile.file}</span>
              <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
              <span className="text-[var(--theme-primary,#00f0ff)]/80">main</span>
            </div>

            {/* 4. Monaco editor (keep the dynamic import and ssr:false) */}
            <div className="h-[390px] sm:h-[440px] bg-[#0f1117]">
              <Editor
                height="100%"
                theme="nexora-cyber"
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                language={lang}
                value={codes[lang]}
                onChange={(v) => setCodes((c) => ({ ...c, [lang]: v ?? "" }))}
                options={{
                  fontSize: 13.5,
                  fontFamily: "var(--font-ibm-plex-mono), 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            </div>

            {/* 5. Status bar (h-6, solid cyan or deep-blue like VS Code's blue status bar) */}
            <div className="flex h-6 items-center justify-between bg-[#0e639c] px-3 font-mono text-[11px] text-white select-none whitespace-nowrap overflow-x-auto no-scrollbar shrink-0">
              {/* Items left: git-branch icon + "main", error/warning counters "0 errors 0 warnings" */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  <GitBranch className="h-3 w-3" />
                  <span>main</span>
                </div>
                <div className="flex items-center gap-1.5 hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer text-white/95">
                  <XCircle className="h-3 w-3" />
                  <span>0 errors, 0 warnings</span>
                </div>
              </div>

              {/* Items right: Ln X, Col Y (REAL, updated live), Spaces: 4, UTF-8, LF, language name, bell icon */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  Ln {cursor.line}, Col {cursor.col}
                </span>
                <span className="hidden sm:inline hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  Spaces: 4
                </span>
                <span className="hidden sm:inline hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  UTF-8
                </span>
                <span className="hidden md:inline hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  LF
                </span>
                <span className="font-semibold hover:bg-black/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
                  {currentFile.langName}
                </span>
                <span className="hover:bg-black/15 px-1 py-0.5 rounded transition-colors cursor-pointer">
                  <Bell className="h-3 w-3 opacity-90" />
                </span>
              </div>
            </div>
          </div>

          {/* Stdin Custom Input */}
          <div className="rounded-xl border border-white/10 bg-[#070b16]/80 p-4 shadow-md backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 text-white/80 font-medium">
                <Terminal className="h-3.5 w-3.5 text-[var(--theme-primary,#00f0ff)]" />
                Custom Input (stdin)
              </span>
              <span className="text-white/40 text-[11px]">Optional</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={3}
              placeholder="Provide standard input to pass into your program..."
              className="w-full resize-y rounded-lg border border-white/10 bg-[#090d16] px-3.5 py-2.5 font-mono text-xs text-white placeholder-white/30 outline-none transition-all focus:border-[var(--theme-primary,#00f0ff)]/60 focus:ring-1 focus:ring-[var(--theme-primary,#00f0ff)]/40"
            />
          </div>

          {runError && <ErrorBox message={runError} />}

          {/* Single Run Output Box */}
          {output && (
            <div className="rounded-xl border border-white/10 bg-[#070b16]/95 p-4 shadow-lg backdrop-blur-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider ${
                      output.statusId === 3
                        ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                        : "border border-rose-400/40 bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {output.status}
                  </span>
                  <span className="font-mono text-xs text-white/60">Execution Output</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-white/50">
                  {output.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-white/40" />
                      {output.time}s
                    </span>
                  )}
                  {output.memory != null && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-white/40" />
                      {Math.round(output.memory / 1024)} MB
                    </span>
                  )}
                </div>
              </div>

              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-black/50 p-3 font-mono text-xs text-white/90 terminal-scroll border border-white/5">
                {describeRun(output) || "(standard output was empty)"}
              </pre>
            </div>
          )}

          {/* Test Cases Results Breakdown */}
          {results && results.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#070b16]/95 p-5 shadow-lg backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-clash text-base font-bold text-white tracking-wide">
                    Test Results
                  </h4>
                  <p className="font-mono text-xs text-white/60 mt-0.5">
                    {passed} of {total} test cases passed
                  </p>
                </div>

                {!submitting && passed === total ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passed
                  </span>
                ) : !submitting ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-500/15 px-3 py-0.5 font-mono text-xs font-semibold text-rose-300">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                  </span>
                ) : null}
              </div>

              <div className="space-y-2.5">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3.5 transition-all ${
                      r.pass
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                        : "border-rose-500/30 bg-rose-500/5 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        {r.pass ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        )}
                        Case {i + 1}
                      </span>
                      <span>{r.pass ? "Passed" : r.note ? r.note : "Wrong Answer"}</span>
                    </div>

                    {!r.pass && (
                      <div className="mt-2.5 grid gap-2.5 font-mono text-xs sm:grid-cols-2">
                        <div className="rounded-lg bg-black/50 p-2.5 border border-white/5">
                          <span className="block font-mono text-[10px] text-white/50 uppercase">Expected</span>
                          <pre className="mt-1 whitespace-pre-wrap text-emerald-300">{r.expected}</pre>
                        </div>
                        <div className="rounded-lg bg-black/50 p-2.5 border border-white/5">
                          <span className="block font-mono text-[10px] text-white/50 uppercase">Output</span>
                          <pre className="mt-1 whitespace-pre-wrap text-rose-300">{r.got || "(none)"}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* APTITUDE TAB                                                               */
/* -------------------------------------------------------------------------- */

function AptitudeTab() {
  const [category, setCategory] = useState(APTITUDE_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "aptitude", topic: category, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate questions.");
      setQuestions(data.questions);
      setAnswers({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const answered = Object.keys(answers).length;
  const score = questions.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);
  const finished = questions.length > 0 && answered === questions.length;

  return (
    <div className="space-y-6">
      {/* ── Console / Config Bar ── */}
      <div className="rounded-2xl border border-white/10 bg-[#070b16]/80 p-4 sm:p-5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            {/* Category Select */}
            <CustomSelect
              label="Category"
              value={category}
              onChange={(val) => setCategory(val)}
              options={APTITUDE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              className="w-full sm:w-56"
            />

            {/* Difficulty Select */}
            <CustomSelect
              label="Difficulty"
              value={difficulty}
              onChange={(val) => setDifficulty(val as Difficulty)}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              className="w-full sm:w-32"
            />

            {/* Count Select */}
            <CustomSelect
              label="Questions"
              value={count}
              onChange={(val) => setCount(Number(val))}
              options={[
                { value: 5, label: "5 Questions" },
                { value: 10, label: "10 Questions" },
              ]}
              className="w-full sm:w-36"
            />

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary,#00f0ff)] px-5 font-clash text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] shadow-md transition-all duration-200 hover:bg-white hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Generating..." : questions.length ? "New Questions" : "Generate MCQs"}</span>
            </button>
          </div>

          {/* Real-time stats display */}
          {questions.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="font-clash font-bold text-2xl sm:text-3xl text-[var(--theme-bg-hero,#dce6ef)] tabular-nums leading-none">
                  {score}<span className="text-sm sm:text-base text-white/50"> / {questions.length}</span>
                </span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/60">
                  Score
                </span>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="font-clash font-bold text-2xl sm:text-3xl text-[var(--theme-bg-hero,#dce6ef)] tabular-nums leading-none">
                  {answered}<span className="text-sm sm:text-base text-white/50"> / {questions.length}</span>
                </span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/60">
                  Completed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {questions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-[var(--theme-primary,#00f0ff)] transition-all duration-300"
                style={{ width: `${(answered / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {/* Clean Empty State */}
      {questions.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] rounded-2xl border border-white/10 bg-[#070b16]/80 p-8 text-center shadow-lg backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--theme-primary,#00f0ff)] mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="font-clash text-xl font-bold text-white">
            Aptitude &amp; Reasoning Practice
          </h3>
          <p className="mt-2 max-w-md font-cabinet text-sm text-white/60 leading-relaxed">
            Select a category, difficulty, and question count above, then click <strong className="text-[var(--theme-primary,#00f0ff)]">Generate MCQs</strong> to test your quantitative, logical, and verbal skills.
          </p>
        </div>
      )}

      {loading && questions.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
          <span className="h-6 w-6 rounded-full border-2 border-[var(--theme-primary,#00f0ff)] border-t-transparent animate-spin" />
          <p className="font-mono text-sm text-white/70">
            Generating practice questions...
          </p>
        </div>
      )}

      {/* Question Cards */}
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          const done = chosen !== undefined;

          return (
            <li
              key={qi}
              className="rounded-xl border border-white/10 bg-[#070b16]/90 p-6 shadow-md backdrop-blur-xl transition-all"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-mono text-xs font-semibold text-white/70">
                  Question {qi + 1} of {questions.length}
                </span>
                {done && (
                  <span
                    className={`font-mono text-xs font-semibold ${
                      chosen === q.answerIndex ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {chosen === q.answerIndex ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              <p className="mt-3.5 font-cabinet text-base sm:text-lg font-medium leading-7 text-white/90">
                {q.question}
              </p>

              {/* Options */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  let cls =
                    "border-white/10 bg-white/[0.02] text-white/90 hover:border-white/30 hover:bg-white/[0.04]";
                  if (done) {
                    if (oi === q.answerIndex) {
                      cls =
                        "border-emerald-400/80 bg-emerald-500/15 text-emerald-200";
                    } else if (oi === chosen) {
                      cls =
                        "border-rose-400/80 bg-rose-500/15 text-rose-200";
                    } else {
                      cls = "border-white/5 bg-white/[0.01] text-white/30";
                    }
                  }

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left text-sm font-cabinet transition-all ${cls} ${
                        done ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          done && oi === q.answerIndex
                            ? "bg-emerald-400 text-black"
                            : done && oi === chosen
                            ? "bg-rose-400 text-black"
                            : "bg-white/10 text-[var(--theme-primary,#00f0ff)]"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="mt-0.5 leading-5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {done && (
                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    chosen === q.answerIndex
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
                    {chosen === q.answerIndex
                      ? "Correct"
                      : `Solution: Option ${String.fromCharCode(65 + q.answerIndex)}`}
                  </p>
                  <p className="mt-1 font-cabinet text-xs sm:text-sm leading-6 text-white/75">
                    {q.explanation}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Completion Banner */}
      {finished && (
        <div className="rounded-2xl border border-white/10 bg-[#070b16]/95 p-8 sm:p-10 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/15 text-[var(--theme-primary,#00f0ff)] shadow-md">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-clash text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Set Complete!
          </h3>
          <p className="mt-1 font-mono text-xs text-white/60">
            Here is your score breakdown:
          </p>

          {/* Score Strip */}
          <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-6 my-6 max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <span className="font-clash font-bold text-4xl sm:text-5xl text-[var(--theme-bg-hero,#dce6ef)] tabular-nums leading-none">
                {score}
              </span>
              <span className="mt-2 font-mono text-[11px] uppercase tracking-wider text-white/60">
                Correct Answers
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-clash font-bold text-4xl sm:text-5xl text-[var(--theme-primary,#00f0ff)] tabular-nums leading-none">
                {Math.round((score / questions.length) * 100)}%
              </span>
              <span className="mt-2 font-mono text-[11px] uppercase tracking-wider text-white/60">
                Accuracy Rate
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary,#00f0ff)] px-6 py-2.5 font-clash text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--theme-bg-main,#060913)] shadow-md transition-all duration-200 hover:bg-white hover:text-black active:scale-95 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Generate Another Set</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN PRACTICE PAGE COMPONENT                                               */
/* -------------------------------------------------------------------------- */

export default function PracticePage() {
  const [tab, setTab] = useState<"coding" | "aptitude">("coding");

  const tabs = [
    { id: "coding" as const, label: "Coding Arena", icon: Code2, desc: "Python · C · Java" },
    { id: "aptitude" as const, label: "Aptitude MCQ", icon: Sparkles, desc: "Aptitude · Logic" },
  ];

  return (
    <main className="relative isolate min-h-screen w-full bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)] selection:bg-[var(--theme-primary,#00f0ff)] selection:text-[var(--theme-bg-main,#060913)] overflow-x-hidden">
      {/* ── Ambient Topographical ASCII Contour Canvas ── */}
      <ContourBackdrop className="z-0" />

      {/* ── Site Floating Navigation ── */}
      <Navbar />

      {/* ── Main Arena Content ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        {/* ── Header Section ── */}
        <section className="mb-10 max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/70">
            Department of ISE · Practice Arena
          </p>

          <h1 className="font-clash text-[clamp(2.8rem,6.5vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-[var(--theme-bg-hero,#dce6ef)]">
            Practice <span className="text-[var(--theme-primary,#00f0ff)]">Arena.</span>
          </h1>

          <p className="mt-5 max-w-2xl font-cabinet text-base font-medium leading-relaxed text-white/75 sm:text-lg">
            Sharpen your problem-solving skills across data structures, algorithms, and technical aptitude. Run code with instant compilation and test case verification.
          </p>
        </section>

        {/* ── Mode Switcher Tabs (Segmented Control) ── */}
        <div role="tablist" aria-label="Practice arena modes" className="mb-8 flex justify-start">
          <div className="inline-flex rounded-full border border-white/10 bg-[#070b16]/90 p-1.5 shadow-lg backdrop-blur-xl">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 font-clash text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] shadow-md"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Tab View (Persisting State for both tabs) ── */}
        <div hidden={tab !== "coding"}>
          <CodingTab />
        </div>
        <div hidden={tab !== "aptitude"}>
          <AptitudeTab />
        </div>
      </div>

      {/* ── Platform Footer ── */}
      <Footer />
    </main>
  );
}
