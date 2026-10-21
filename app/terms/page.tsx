"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";
import { Scale, CheckCircle2, AlertTriangle, Code, Award, FileSpreadsheet } from "lucide-react";

export default function TermsAndConditionsPage() {
  const lastUpdated = "October 2026";

  const terms = [
    {
      icon: Scale,
      title: "1. Acceptance of Terms",
      text: "By accessing and using the Nexora website, platform services, coding practice modules, and event registration portals, you agree to comply with and be bound by these Terms and Conditions and all applicable academic regulations established by AJIET and Visvesvaraya Technological University (VTU).",
    },
    {
      icon: Code,
      title: "2. Code of Conduct & Integrity",
      text: "Nexora is built to foster innovation, peer collaboration, and technical growth. All participants must treat peers, mentors, faculty, and guests with mutual respect. Harassment, unauthorized system probing, reverse-engineering, denial of service attempts, or disruptive behavior will result in immediate disqualification and academic reporting.",
    },
    {
      icon: AlertTriangle,
      title: "3. Academic Honesty & Plagiarism Policy",
      text: "For hackathons, coding challenges, project showcases, and departmental competitions, all code submissions must represent the original work of the registered team or individual. The unauthorized copying of third-party repositories without attribution, utilizing covert external assistance during timed contests, or submitting plagiarized materials is strictly prohibited.",
    },
    {
      icon: Award,
      title: "4. Event Registrations, Prizes & Certificates",
      text: "Registration for departmental events does not guarantee admission if capacity limits are exceeded. Winners of prizes, hackathons, and certifications are subject to project verification and compliance checks by the faculty judging committee. Decisions rendered by the evaluation jury are final.",
    },
    {
      icon: FileSpreadsheet,
      title: "5. Intellectual Property",
      text: "Participants retain ownership of the software, projects, and original ideas developed during Nexora hackathons and workshops. However, by participating, you grant the Nexora ISE Club and AJIET a royalty-free license to feature your project title, media, and summaries for academic, promotional, and accreditation showcases.",
    },
    {
      icon: CheckCircle2,
      title: "6. Platform Availability & Disclaimers",
      text: "The Nexora digital platform is provided on an 'as is' and 'as available' basis. While we strive for 100% system uptime during live events, the club and department shall not be held liable for temporary interruptions, third-party network outages, or data sync delays beyond our administrative control.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg-main,#060913)] text-white">
      <Navbar />

      <main className="relative flex-1 pt-28 pb-20 px-6 sm:px-10 lg:px-16 overflow-hidden">
        {/* Background Accents */}
        <ContourBackdrop />
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[300px] bg-[var(--theme-primary,#00f0ff)]/5 blur-[130px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[var(--theme-primary,#00f0ff)]/10 text-[var(--theme-primary,#00f0ff)] text-xs font-mono uppercase tracking-widest mb-6">
            <Scale className="w-3.5 h-3.5" />
            <span>OPERATIONAL CODE & LEGAL FRAMEWORK</span>
          </div>

          {/* Page Heading */}
          <h1 className="font-clash text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl font-light">
            Welcome to Nexora, the official technical club of the Department of Information Science and Engineering at A J Institute of Engineering and Technology (AJIET). Please review these terms governing event participation, platform usage, and code submissions.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-[var(--theme-primary,#00f0ff)]/80 pb-8 border-b border-white/10 mb-12">
            <span>GOVERNING BODY: AJIET ISE</span>
            <span>•</span>
            <span>EFFECTIVE: {lastUpdated}</span>
            <span>•</span>
            <span>JURISDICTION: MANGALURU, IN</span>
          </div>

          {/* Terms Grid */}
          <div className="space-y-8">
            {terms.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 sm:p-8 transition-all hover:border-[var(--theme-primary,#00f0ff)]/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[var(--theme-primary,#00f0ff)]/10 border border-[var(--theme-primary,#00f0ff)]/30 flex items-center justify-center text-[var(--theme-primary,#00f0ff)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-clash text-base sm:text-lg font-bold text-white tracking-wide">
                      {item.title}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans pl-1">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Academic Governance Note */}
          <div className="mt-14 p-6 sm:p-8 rounded-xl border border-white/15 bg-[#060913]/80 backdrop-blur-md">
            <h3 className="font-clash text-base font-bold text-white mb-2">
              Institutional Governance
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              These terms operate under the overarching statutory guidelines of A J Institute of Engineering & Technology (AJIET), Kottara Chowki, Mangaluru, and the regulations prescribed by Visvesvaraya Technological University (VTU), Belagavi. For institutional inquiries or dispute escalation, contact the Head of the Department (ISE).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

