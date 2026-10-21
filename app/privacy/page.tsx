"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";
import { ShieldCheck, Lock, Eye, Database, FileText, Bell } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2026";

  const sections = [
    {
      icon: Eye,
      title: "1. Information We Collect",
      content: [
        "Personal Identification: When registering for club events, hackathons, or using Nexora Connect, we may collect your name, USN (University Seat Number), college email, phone number, and semester/branch details.",
        "Authentication Data: If you authenticate using GitHub or OAuth providers, we receive public profile details such as your GitHub username, avatar URL, and authorized email address.",
        "Academic & Activity Records: Event attendance, workshop submissions, coding problem completions, and leaderboard rankings within the Nexora platform.",
        "Technical Telemetry: IP address, browser type, device information, and interaction logs captured to ensure system security and optimize portal performance.",
      ],
    },
    {
      icon: Database,
      title: "2. How We Use Your Data",
      content: [
        "To organize, manage, and verify participation in ISE Department events, workshops, hackathons, and technical symposiums.",
        "To publish verified leaderboards, issue digital certificates of participation/merit, and maintain departmental achievement records.",
        "To communicate critical event schedules, rule updates, venue announcements, and department notices.",
        "To safeguard the platform against fraudulent submissions, unauthorized access, and malicious attacks.",
      ],
    },
    {
      icon: Lock,
      title: "3. Data Protection & Security",
      content: [
        "All sensitive data is encrypted in transit using industry-standard TLS (HTTPS) protocols.",
        "Authentication credentials and tokens are secured via hardened environment configurations and modern session tokens.",
        "We never sell, rent, or trade your personal data to commercial third parties or external marketing agencies.",
        "Access to backend records is strictly limited to authorized student club leads and faculty coordinators of the Department of Information Science and Engineering at AJIET.",
      ],
    },
    {
      icon: FileText,
      title: "4. Cookies & Local Storage",
      content: [
        "We utilize essential session tokens and local storage only to remember your login session, audio preferences, and theme choices.",
        "We do not use invasive tracking cookies or commercial behavioral-advertising trackers.",
      ],
    },
    {
      icon: Bell,
      title: "5. Your Rights & Contact Information",
      content: [
        "You have the right to inspect, correct, or request the deletion of your personal account data stored in our database.",
        "For any privacy queries, data requests, or concerns, please contact the Nexora ISE Technical Club team or the faculty coordinator at nexora.ise@ajiet.edu.in.",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg-main,#060913)] text-white">
      <Navbar />

      <main className="relative flex-1 pt-28 pb-20 px-6 sm:px-10 lg:px-16 overflow-hidden">
        {/* Futuristic Background Accents */}
        <ContourBackdrop />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--theme-primary,#00f0ff)]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)] text-xs font-mono uppercase tracking-widest mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DEPARTMENT OF ISE · POLICY DIRECTIVE</span>
          </div>

          {/* Page Heading */}
          <h1 className="font-clash text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl font-light">
            Your privacy and digital security are paramount to us. This policy details how the Nexora ISE Club (Department of Information Science & Engineering, AJIET Mangaluru) collects, manages, and protects student and participant data.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-[var(--theme-primary,#00f0ff)]/80 pb-8 border-b border-white/10 mb-12">
            <span>VERSION: 2.4.0</span>
            <span>•</span>
            <span>LAST REVISED: {lastUpdated}</span>
            <span>•</span>
            <span>STATUS: ACTIVE</span>
          </div>

          {/* Policy Sections */}
          <div className="space-y-10">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 sm:p-8 transition-all hover:border-[var(--theme-primary,#00f0ff)]/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-[var(--theme-primary,#00f0ff)]/10 border border-[var(--theme-primary,#00f0ff)]/30 flex items-center justify-center text-[var(--theme-primary,#00f0ff)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-clash text-lg sm:text-xl font-bold text-white tracking-wide">
                      {section.title}
                    </h2>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm text-white/75 leading-relaxed font-sans pl-2">
                    {section.content.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary,#00f0ff)] mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Department Contact Card */}
          <div className="mt-14 p-6 sm:p-8 rounded-xl border border-[var(--theme-primary,#00f0ff)]/30 bg-gradient-to-r from-[var(--theme-primary,#00f0ff)]/10 via-transparent to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-clash text-base sm:text-lg font-bold text-white mb-1">
                Have questions or privacy concerns?
              </h3>
              <p className="text-xs sm:text-sm text-white/70">
                Reach out to the ISE Student Club or AJIET Data Administration directly.
              </p>
            </div>
            <a
              href="mailto:nexora.ise@ajiet.edu.in"
              className="px-5 py-2.5 rounded-lg border border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-primary,#00f0ff)]/20 text-white font-mono text-xs uppercase tracking-wider hover:bg-[var(--theme-primary,#00f0ff)] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
            >
              Contact Privacy Desk
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

