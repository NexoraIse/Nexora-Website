"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";
import { HelpCircle, ChevronDown, Sparkles, BookOpen, Trophy, Terminal, Users } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
  category: "General" | "Events & Hackathons" | "Learning & Notes" | "Practice & Tech";
};

const FAQ_DATA: FAQItem[] = [
  {
    category: "General",
    question: "What is Nexora and what is its mission?",
    answer: "Nexora is the premier student-driven technical club of the Department of Information Science and Engineering (ISE) at A J Institute of Engineering and Technology (AJIET), Mangaluru. Our mission is to bridge academia and industry by organizing hackathons, open-source initiatives, technical workshops, peer learning sessions, and coding competitions.",
  },
  {
    category: "General",
    question: "Who is eligible to join Nexora club activities?",
    answer: "Nexora events, workshops, coding challenges, and study resources are open to all students across semesters at AJIET. Certain flagship inter-college hackathons and symposia are also open to engineering students across Karnataka and other VTU-affiliated institutions.",
  },
  {
    category: "General",
    question: "How can I join the Nexora executive core team or committee?",
    answer: "Core committee recruitment cycles are conducted annually at the beginning of the odd semester. Announcements are posted on the Nexora website, official Instagram (@nexora.ise), and student noticeboards. The selection involves a technical/creative task followed by a peer interview.",
  },
  {
    category: "Events & Hackathons",
    question: "How do I register for an upcoming hackathon or workshop?",
    answer: "Navigate to the 'Events' section on the website. Each active event includes full schedule details, eligibility criteria, problem statements, and a direct registration form. Once registered, you will receive confirmation and WhatsApp/email group invitations.",
  },
  {
    category: "Events & Hackathons",
    question: "Do I receive a certificate for participating in Nexora events?",
    answer: "Yes! All verified participants receive verified digital Certificates of Participation. Winners, runners-up, and honorable mentions are awarded Certificates of Merit along with cash prizes, trophies, and academic recognition from the Department.",
  },
  {
    category: "Events & Hackathons",
    question: "Can beginners or first-year students participate in hackathons?",
    answer: "Absolutely! Nexora regularly hosts beginner-friendly tracks, ideathons, and mentorship hours during hackathons specifically tailored for 1st and 2nd year students to help them build their first projects.",
  },
  {
    category: "Learning & Notes",
    question: "Where can I find VTU semester notes and previous question papers?",
    answer: "Head over to the 'Learning Hub' (/learn) page on the Nexora portal. We curate semester-wise VTU 2021/2022 scheme study materials, module-wise PDF notes, previous semester examination question papers, and official laboratory manuals prepared by AJIET ISE faculty.",
  },
  {
    category: "Learning & Notes",
    question: "Can I contribute study notes, cheat sheets, or lab code?",
    answer: "Yes! Nexora welcomes student contributions. You can submit verified notes or open pull requests to our GitHub repositories via the 'Connect' page or by contacting the student resource leads.",
  },
  {
    category: "Practice & Tech",
    question: "What is the Nexora Practice module?",
    answer: "The 'Practice' section provides an interactive browser-based coding environment with curated problems covering Data Structures & Algorithms, VTU lab exercises, and competitive programming challenges with automated test cases and execution.",
  },
  {
    category: "Practice & Tech",
    question: "How does GitHub authentication work on Nexora Connect?",
    answer: "Nexora Connect leverages secure GitHub OAuth to authenticate your profile. It syncs your public GitHub contributions, projects, and allows you to showcase your portfolio on the student achievement wall without storing your passwords.",
  },
];

const CATEGORIES = ["All", "General", "Events & Hackathons", "Learning & Notes", "Practice & Tech"] as const;

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg-main,#060913)] text-white">
      <Navbar />

      <main className="relative flex-1 pt-28 pb-20 px-6 sm:px-10 lg:px-16 overflow-hidden">
        {/* Background Accents */}
        <ContourBackdrop />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-[var(--theme-primary,#00f0ff)]/5 blur-[140px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)] text-xs font-mono uppercase tracking-widest mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>KNOWLEDGE BASE & SUPPORT DESK</span>
          </div>

          {/* Heading */}
          <h1 className="font-clash text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl font-light">
            Find immediate answers regarding Nexora club initiatives, hackathon guidelines, VTU study materials, coding practice, and member recruitments.
          </p>

          {/* Search Input */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search questions or topics (e.g. hackathon, notes, membership, practice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur-md text-white placeholder-white/40 text-sm focus:outline-none focus:border-[var(--theme-primary,#00f0ff)] transition-colors"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-white/10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[var(--theme-primary,#00f0ff)] text-black font-semibold shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion Questions */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "border-[var(--theme-primary,#00f0ff)]/50 bg-white/[0.04] shadow-[0_0_20px_rgba(0,240,255,0.07)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)] block">
                          [{faq.category}]
                        </span>
                        <h2 className="font-clash text-base sm:text-lg font-bold text-white tracking-wide">
                          {faq.question}
                        </h2>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen
                            ? "rotate-180 border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-primary,#00f0ff)]/20 text-[var(--theme-primary,#00f0ff)]"
                            : "border-white/20 text-white/50"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-white/75 leading-relaxed border-t border-white/5 font-sans animate-in fade-in duration-200">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 rounded-xl border border-white/10 bg-white/[0.02] text-white/50">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40 text-[var(--theme-primary,#00f0ff)]" />
                <p className="text-sm font-mono">No matching questions found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Quick Query Box */}
          <div className="mt-14 p-6 sm:p-8 rounded-xl border border-white/15 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-clash text-base sm:text-lg font-bold text-white mb-1">
                Still have questions?
              </h3>
              <p className="text-xs sm:text-sm text-white/70">
                Drop us an email or connect with the ISE student coordinators.
              </p>
            </div>
            <a
              href="mailto:nexora.ise@ajiet.edu.in"
              className="px-5 py-2.5 rounded-lg border border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-primary,#00f0ff)]/20 text-white font-mono text-xs uppercase tracking-wider hover:bg-[var(--theme-primary,#00f0ff)] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
            >
              Ask a Question
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

