"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { HomepageLearningData, HomepageLearningResource } from "@/lib/home-learning";
import { HOME_APTITUDE_QUESTION, HOME_PRACTICE_CODE, HOME_PRACTICE_TESTS } from "@/lib/mock-home-practice";

type LearningTab = "papers" | "resources";
type CodeToken = { content: string; color?: string; offset: number };

const TABS: Array<{ id: LearningTab; label: string }> = [
  { id: "papers", label: "Question papers" },
  { id: "resources", label: "Resources" },
];
const SEMESTERS = ["all", "1", "2", "3", "4", "5", "6", "7", "8"];
const ease = [0.22, 1, 0.36, 1] as const;

function getPaperYear(paper: HomepageLearningResource) {
  return paper.academicYear?.match(/\d{4}/)?.[0]
    ?? paper.title.match(/\b(?:19|20)\d{2}\b/)?.[0]
    ?? "YEAR TBA";
}

function getPaperScheme(paper: HomepageLearningResource) {
  return paper.tags.find((tag) => /^scheme(?:\s|:)/i.test(tag))?.replace(/^scheme(?:\s|:)+/i, "")
    ?? "SCHEME TBA";
}

function resourceHref(resource: HomepageLearningResource) {
  const fileUrl = resource.fileUrl?.trim();
  if (!fileUrl || fileUrl === "#") return "/learn#study-materials";
  if (/^https?:\/\//i.test(fileUrl) || (fileUrl.startsWith("/") && !fileUrl.startsWith("//"))) {
    return fileUrl;
  }
  return "/learn#study-materials";
}

function hasExternalResource(resource: HomepageLearningResource) {
  return /^https?:\/\//i.test(resource.fileUrl ?? "");
}

function CountTicker({ count, hasEntered }: { count: number; hasEntered: boolean }) {
  const value = useMotionValue(0);
  const roundedValue = useTransform(value, (current) => Math.round(current));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!hasEntered) return;
    if (reducedMotion) {
      value.set(count);
      return;
    }
    const controls = animate(value, count, { duration: 0.85, ease });
    return () => controls.stop();
  }, [count, hasEntered, reducedMotion, value]);

  return <motion.span>{roundedValue}</motion.span>;
}

function PaperList({
  papers,
  selectedSemester,
  unavailable,
}: {
  papers: HomepageLearningResource[];
  selectedSemester: string;
  unavailable: boolean;
}) {
  const visiblePapers = useMemo(
    () => papers
      .filter((paper) => selectedSemester === "all" || String(paper.semester ?? "") === selectedSemester)
      .slice(0, 4),
    [papers, selectedSemester],
  );

  if (unavailable) {
    return <p className="home-learn-empty" role="status">Learning materials are temporarily unavailable.</p>;
  }

  if (!visiblePapers.length) {
    return (
      <p className="home-learn-empty home-learn-empty--dashed" role="status">
        {papers.length ? `No papers listed for Semester ${selectedSemester}.` : "Papers coming soon"}
      </p>
    );
  }

  return (
    <ul className="home-learn-list" aria-label="Recent question papers">
      {visiblePapers.map((paper) => (
        <li className="home-learn-paper" key={paper.id}>
          <a
            className="home-learn-paper-link"
            href={resourceHref(paper)}
            target={hasExternalResource(paper) ? "_blank" : undefined}
            rel={hasExternalResource(paper) ? "noreferrer" : undefined}
          >
            <span className="home-learn-paper-semester">
              {paper.semester ? `SEM ${paper.semester}` : "PAPER"}
            </span>
            <span className="home-learn-paper-copy">
              <strong>{paper.subject}</strong>
              <small>{paper.title}</small>
            </span>
            <span className="home-learn-paper-meta">
              <small>{getPaperScheme(paper)}</small>
              <small>{getPaperYear(paper)}</small>
            </span>
            <span className="home-learn-file-tag">{paper.resourceType || "PDF"}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function LearningPanel({
  data,
  hasEntered,
}: {
  data: HomepageLearningData;
  hasEntered: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<LearningTab>("papers");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? TABS.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex];
    setTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="home-learn-panel home-learn-panel--learning">
      <div className="home-learn-panel-heading">
        <span className="home-learn-panel-index">01 / LEARN</span>
        <h3>Learning Hub</h3>
      </div>
      <div className="home-learn-tabs" role="tablist" aria-label="Learning Hub content">
        {TABS.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`home-learn-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls="home-learn-tab-panel"
            tabIndex={tab === item.id ? 0 : -1}
            className={`home-learn-tab${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        id="home-learn-tab-panel"
        className="home-learn-tab-panel"
        role="tabpanel"
        aria-labelledby={`home-learn-tab-${tab}`}
        tabIndex={0}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="home-learn-tab-content"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease }}
          >
            {tab === "papers" ? (
              <>
                <div className="home-learn-paper-count">
                  <strong>
                    {data.unavailable
                      ? "—"
                      : <CountTicker count={data.paperCount} hasEntered={hasEntered} />}
                  </strong>
                  <span>{data.paperCount === 1 ? "paper" : "papers"}</span>
                </div>
                <div className="home-learn-semesters" role="group" aria-label="Filter papers by semester">
                  {SEMESTERS.map((semester) => (
                    <button
                      key={semester}
                      type="button"
                      aria-pressed={selectedSemester === semester}
                      className={`home-learn-semester${selectedSemester === semester ? " is-active" : ""}`}
                      onClick={() => setSelectedSemester(semester)}
                    >
                      {semester === "all" ? "ALL" : semester}
                    </button>
                  ))}
                </div>
                <PaperList papers={data.papers} selectedSemester={selectedSemester} unavailable={data.unavailable} />
              </>
            ) : (
              <ul className="home-learn-list" aria-label="Recent learning resources">
                {data.unavailable ? (
                  <li className="home-learn-empty" role="status">Learning materials are temporarily unavailable.</li>
                ) : data.resources.length ? data.resources.map((resource) => (
                  <li className="home-learn-resource" key={resource.id}>
                    <a href={resourceHref(resource)} target={hasExternalResource(resource) ? "_blank" : undefined} rel={hasExternalResource(resource) ? "noreferrer" : undefined}>
                      <span className="home-learn-resource-category">{resource.category}</span>
                      <strong>{resource.title}</strong>
                      <small>{resource.subject}{resource.semester ? ` · Semester ${resource.semester}` : ""}</small>
                    </a>
                  </li>
                )) : (
                  <li className="home-learn-empty" role="status">No published resources yet.</li>
                )}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Link className="home-learn-panel-cta" href="/learn">
        Explore Learning Hub <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

function PracticePanel({
  tokens,
  hasEntered,
  onReplay,
  replayKey,
  selectedOption,
  setSelectedOption,
}: {
  tokens: CodeToken[][];
  hasEntered: boolean;
  onReplay: () => void;
  replayKey: number;
  selectedOption: number | null;
  setSelectedOption: (option: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [typedCharacters, setTypedCharacters] = useState(0);
  const [visibleTests, setVisibleTests] = useState(0);
  const [runStarted, setRunStarted] = useState(false);
  const totalCharacters = HOME_PRACTICE_CODE.length;

  useEffect(() => {
    if (!hasEntered) return;
    let typed = 0;
    let completedTests = 0;
    let typeInterval: number | undefined;
    let testInterval: number | undefined;
    const timers: number[] = [];

    const startTimeout = window.setTimeout(() => {
      setTypedCharacters(0);
      setVisibleTests(0);
      setRunStarted(false);
      if (reducedMotion) {
        setTypedCharacters(totalCharacters);
        setVisibleTests(HOME_PRACTICE_TESTS.length);
        setRunStarted(true);
        return;
      }

      typeInterval = window.setInterval(() => {
        typed += 1;
        setTypedCharacters(typed);
        if (typed >= totalCharacters) {
          if (typeInterval !== undefined) window.clearInterval(typeInterval);
          const runTimeout = window.setTimeout(() => {
            setRunStarted(true);
            testInterval = window.setInterval(() => {
              completedTests += 1;
              setVisibleTests(completedTests);
              if (completedTests >= HOME_PRACTICE_TESTS.length && testInterval !== undefined) {
                window.clearInterval(testInterval);
              }
            }, 250);
          }, 450);
          timers.push(runTimeout);
        }
      }, 17);
    }, 0);

    return () => {
      window.clearTimeout(startTimeout);
      if (typeInterval !== undefined) window.clearInterval(typeInterval);
      if (testInterval !== undefined) window.clearInterval(testInterval);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [hasEntered, reducedMotion, replayKey, totalCharacters]);

  const visibleCharacterCount = hasEntered ? typedCharacters : totalCharacters;
  const selectedTokens = tokens.map((line) => {
    return line.map((token) => ({
      ...token,
      visibleContent: token.content.slice(0, Math.max(0, Math.min(token.content.length, visibleCharacterCount - token.offset))),
    }));
  });

  return (
    <div className="home-learn-panel home-learn-panel--practice">
      <div className="home-learn-panel-heading">
        <span className="home-learn-panel-index">02 / PRACTICE</span>
        <h3>Practice arena</h3>
        <button className="home-practice-replay" type="button" onClick={onReplay} aria-label="Replay code demo">
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="home-code-window">
        <div className="home-code-window-bar">
          <span className="home-code-window-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>two_sum.py</span>
          <span className="home-code-language">PYTHON</span>
        </div>
        <div className="home-code-scroll" role="region" aria-label="Scripted Python code preview" tabIndex={0}>
          <pre>
            <code>
              {selectedTokens.map((line, lineIndex) => (
                <span className="home-code-line" key={lineIndex}>
                  <span className="home-code-line-number" aria-hidden="true">{lineIndex + 1}</span>
                  <span className="home-code-line-content">
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} style={token.color ? { color: token.color } : undefined}>
                        {token.visibleContent}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
        {runStarted && (
          <div className="home-code-results" aria-live="polite">
            <p className="home-code-run-label">&gt; RUN · PYTHON 3</p>
            {HOME_PRACTICE_TESTS.slice(0, visibleTests).map((test, index) => (
              <p className={index < 2 ? "is-passed" : "is-muted"} key={test.label}>
                <span>{test.label}</span>
                <span>{test.input}</span>
                <span>{test.result} · passed</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="home-practice-question">
        <div className="home-practice-question-label">
          <span>APTITUDE / QUICK CHECK</span>
          <span>01 QUESTION</span>
        </div>
        <p>{HOME_APTITUDE_QUESTION.prompt}</p>
        <div className="home-practice-options">
          {HOME_APTITUDE_QUESTION.options.map((option, index) => {
            const selected = selectedOption === index;
            const answered = selectedOption !== null;
            const correct = index === HOME_APTITUDE_QUESTION.correctIndex;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                className={`home-practice-option${selected ? " is-selected" : ""}${answered && correct ? " is-correct" : ""}`}
                onClick={() => setSelectedOption(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
                {selected && <span>{correct ? "CORRECT" : "NOT QUITE"}</span>}
              </button>
            );
          })}
        </div>
        {selectedOption !== null && (
          <p className="home-practice-feedback" role="status">
            {selectedOption === HOME_APTITUDE_QUESTION.correctIndex ? "Correct. " : "Not quite. "}
            {HOME_APTITUDE_QUESTION.explanation}
          </p>
        )}
      </div>
      <Link className="home-learn-panel-cta" href="/practice">
        Start practicing <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function HomeLearnPracticeSection({
  data,
  codeTokens,
}: {
  data: HomepageLearningData;
  codeTokens: CodeToken[][];
}) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const enteredRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const onEnterView = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setHasEntered(true);
  }, []);

  useEffect(() => {
    let frame = 0;
    let scheduled = false;
    const checkVisibility = () => {
      if (enteredRef.current || scheduled) return;
      const bounds = sectionRef.current?.getBoundingClientRect();
      if (!bounds || bounds.top >= window.innerHeight || bounds.bottom <= 0) return;
      scheduled = true;
      frame = window.requestAnimationFrame(onEnterView);
    };

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    checkVisibility();
    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      window.cancelAnimationFrame(frame);
    };
  }, [onEnterView]);

  return (
    <motion.section
      ref={sectionRef}
      className="home-learn-practice-section"
      aria-labelledby="home-learn-practice-heading"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={onEnterView}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reducedMotion ? 0 : 0.72, ease }}
    >
      <header className="home-learn-section-header">
        <p className="home-learn-kicker">NEXORA · LEARN</p>
        <h2 id="home-learn-practice-heading">Study smarter. <span>Code harder.</span></h2>
        <p>Question papers, resources and a practice arena built for ISE.</p>
      </header>
      <div className="home-learn-frame">
        <div className="home-learn-panels">
          <LearningPanel data={data} hasEntered={hasEntered} />
          <PracticePanel
            tokens={codeTokens}
            hasEntered={hasEntered}
            replayKey={replayKey}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            onReplay={() => {
              if (!hasEntered) setHasEntered(true);
              setReplayKey((current) => current + 1);
            }}
          />
        </div>
      </div>
    </motion.section>
  );
}
