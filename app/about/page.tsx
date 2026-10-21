"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";

type Member = { name: string; role: string; image: string };

const HOD: Member = {
  name: "Dr. John Prakash Veigas",
  role: "Professor & HOD",
  image: "/faculty/john-prakash-veigas.jpg",
};

const FACULTY: Member[] = [
  HOD,
  { name: "Dr. Lokesh M R", role: "Professor", image: "/faculty/lokesh-m-r.jpg" },
  { name: "Dr. Krishna Prasad K", role: "Associate Professor", image: "/faculty/krishna-prasad-k.jpg" },
  { name: "Mr. Rakesh M R", role: "Assistant Professor", image: "/faculty/rakesh-m-r.jpg" },
  { name: "Mrs. Sharanya P S", role: "Assistant Professor", image: "/faculty/sharanya-p-s.jpg" },
  { name: "Mrs. Divya", role: "Assistant Professor", image: "/faculty/divya.jpg" },
  { name: "Mrs. R Sahaya Shamini", role: "Assistant Professor", image: "/faculty/sahaya-shamini.jpg" },
  { name: "Mrs. Archana Priyadarshini", role: "Assistant Professor", image: "/faculty/archana-priyadarshini.jpg" },
  { name: "Mrs. Arpitha Kumari G", role: "Assistant Professor", image: "/faculty/arpitha-kumari-g.jpg" },
  { name: "Mr. Harish Kumar", role: "Programmer", image: "/faculty/harish-kumar.jpg" },
  { name: "Ms. Sushmitha", role: "Instructor", image: "/faculty/sushmitha.jpg" },
  { name: "Mr. Anup Anchan", role: "Instructor", image: "/faculty/anup-anchan.jpg" },
  { name: "Ms. Daksha N Poojary", role: "Instructor", image: "/faculty/daksha-n-poojary.jpg" },
];

const MISSIONS = [
  "To impart theoretical and practical knowledge through modern concepts and technologies in Information Science and Engineering.",
  "To foster research, collaboration, and higher education with premier institutions and industrial partners.",
  "To promote student innovation and entrepreneurship to fulfill the technological needs of society and industry.",
];

const STATS = [
  { value: "2016", label: "Established" },
  { value: "60", label: "Annual Student Intake" },
  { value: "100+", label: "Research Publications" },
  { value: "NBA", label: "Accredited B.E. Program" },
];

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function FacultyCard({ member, index }: { member: Member; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const tag = `ISE_FAC_${String(index + 1).padStart(3, "0")}.dat`;

  return (
    <div
      className="member-card group relative flex flex-col overflow-hidden rounded-lg
        border border-[var(--theme-primary,#00f0ff)]/20 bg-[#060913]/60 backdrop-blur-md isolate transition-all duration-300 hover:border-[var(--theme-primary,#00f0ff)]/50 hover:bg-[#060913]/80"
      style={{ boxShadow: "0 0 0 1px rgba(0, 240, 255,0.08), 0 20px 50px rgba(0,0,0,0.35)" }}
    >
      {/* Terminal window header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#080f09]/60 border-b border-[var(--theme-primary,#00f0ff)]/15 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#FF5F56]/70" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#FFBD2E]/70" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#27C93F]/70" />
        </div>
        <span className="font-terminal text-[9px] uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]/50">
          {tag}
        </span>
      </div>

      {/* Photo with scanline effect */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#080f09]/40">
        {!imgFailed ? (
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover contrast-105 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080f09]/40">
            <span className="font-clash font-bold text-[var(--theme-primary,#00f0ff)]/20 text-5xl">
              {initials(member.name)}
            </span>
          </div>
        )}
        <div aria-hidden className="terminal-scanlines opacity-30 group-hover:opacity-0 transition-opacity duration-700" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Member Details */}
      <div className="flex flex-col gap-1 px-4 py-3 bg-[#060913]/60">
        <h3 className="font-clash font-bold text-[var(--theme-bg-hero,#dce6ef)] text-base leading-tight group-hover:text-white transition-colors">
          {member.name}
        </h3>
        <span className="font-terminal uppercase tracking-[0.15em] text-[var(--theme-primary,#00f0ff)]/70 text-[10px]">
          {member.role}
        </span>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full isolate bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <ContourBackdrop />

      <Navbar />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        {/* 1. Header Hero Banner */}
        <section className="relative mb-16 overflow-hidden rounded-2xl border border-[var(--theme-primary,#00f0ff)]/30 bg-[#060913]/50 backdrop-blur-md p-8 sm:p-12 lg:p-16 shadow-[0_0_50px_rgba(0,240,255,0.08)]">
          <div className="terminal-scanlines opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-primary,#00f0ff)] animate-ping" />
              <span>About Department</span>
            </div>

            <h1 className="mt-6 font-clash font-bold text-4xl sm:text-5xl md:text-6xl text-[var(--theme-bg-hero,#dce6ef)] leading-tight">
              Information Science <br />
              <span className="text-[var(--theme-primary,#00f0ff)]">&amp; Engineering</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[var(--theme-primary,#00f0ff)]/80 leading-relaxed font-cabinet">
              A J Institute of Engineering &amp; Technology (AJIET)
              <span className="block text-xs sm:text-sm text-white/60 font-mono mt-1">
                A Unit of Laxmi Memorial Educational Trust&reg; &middot; Kottara Chowki, Mangaluru, Karnataka
              </span>
            </p>
          </div>
        </section>

        {/* 2. Department Narrative */}
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center mb-16">
          <div>
            <h2 className="font-clash font-bold text-2xl sm:text-3xl text-white">
              Explore, Innovate, and Engineer the Future
            </h2>
            <div className="h-0.5 w-16 bg-[var(--theme-primary,#00f0ff)] my-4" />
            <p className="text-sm sm:text-base leading-relaxed text-white/80 font-cabinet">
              The Department of Information Science and Engineering, established in 2016 as a founding
              branch of AJ Institute of Engineering and Technology in Mangaluru, has rapidly emerged as a
              leading academic unit. Offering an NBA-accredited Bachelor of Engineering program with an
              annual intake of 60 students, the department focuses on equipping students with both
              theoretical and practical skills for success in the rapidly evolving IT industry.
            </p>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/80 font-cabinet">
              With state-of-the-art infrastructure, including advanced computing facilities and
              specialized laboratories, students gain hands-on experience through innovative projects,
              research initiatives, and engagement with our vibrant startup ecosystem. Our dedicated
              faculty have published textbooks, chapters, and over 100 research papers.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[var(--theme-primary,#00f0ff)]/25 bg-[#060913]/50 backdrop-blur-md p-6 text-center shadow-lg transition-transform hover:-translate-y-1"
              >
                <div className="font-clash font-bold text-3xl sm:text-4xl text-[var(--theme-primary,#00f0ff)]">
                  {s.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-white/70 font-mono">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Vision & Mission */}
        <section className="grid gap-8 md:grid-cols-2 mb-16">
          <div className="rounded-2xl border border-[var(--theme-primary,#00f0ff)]/20 bg-[#060913]/50 backdrop-blur-md p-8">
            <h3 className="font-clash font-bold text-2xl text-[var(--theme-bg-hero,#dce6ef)]">
              Department Vision
            </h3>
            <div className="h-0.5 w-12 bg-[var(--theme-primary,#00f0ff)] my-3" />
            <p className="text-sm sm:text-base leading-relaxed text-white/80 font-cabinet">
              To be a center of excellence in Information Science &amp; Engineering education, research,
              and training to meet the growing needs of the industry and society.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--theme-primary,#00f0ff)]/20 bg-[#060913]/50 backdrop-blur-md p-8">
            <h3 className="font-clash font-bold text-2xl text-[var(--theme-bg-hero,#dce6ef)]">
              Department Mission
            </h3>
            <div className="h-0.5 w-12 bg-[var(--theme-primary,#00f0ff)] my-3" />
            <ul className="space-y-3">
              {MISSIONS.map((m, i) => (
                <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-white/80 font-cabinet">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 text-xs font-mono font-bold text-[var(--theme-primary,#00f0ff)]">
                    {i + 1}
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. HOD Desk */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--theme-primary,#00f0ff)]/30 bg-[#060913]/60 backdrop-blur-md p-6 sm:p-10 shadow-[0_0_40px_rgba(0,240,255,0.08)]">
            <div className="terminal-scanlines opacity-20 pointer-events-none" />
            
            <div className="relative z-10 grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
              <div className="flex flex-col items-center md:items-start">
                <span className="font-terminal text-xs uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)] mb-3">
                  LEADERSHIP · HOD DESK
                </span>
                <div className="w-48 h-56 rounded-xl overflow-hidden border border-[var(--theme-primary,#00f0ff)]/40 bg-[#080f09]">
                  <img
                    src={HOD.image}
                    alt={HOD.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <h4 className="mt-3 font-clash font-bold text-lg text-white">{HOD.name}</h4>
                <p className="text-xs font-mono text-[var(--theme-primary,#00f0ff)]">{HOD.role}</p>
              </div>

              <div className="md:pt-6 space-y-4 text-sm sm:text-base leading-relaxed text-white/80 font-cabinet">
                <p>
                  Welcome to the Department of Information Science and Engineering (ISE), which offers an
                  NBA-accredited undergraduate B.E. program dedicated to achieving excellence in technical
                  education. Our vision is to become a center of excellence, empowering students to meet
                  the evolving needs of industry and society.
                </p>
                <p>
                  With a team of experienced faculty, state-of-the-art laboratories, and collaborative
                  industry partnerships, we prepare our students to thrive in the dynamic IT landscape.
                  We have established strong MOUs with leading industries and foster student-led clubs
                  like Nexora to champion real-world coding, competitive development, and research.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Faculty & Staff Grid */}
        <section>
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--theme-primary,#00f0ff)]/20" />
              <h2 className="font-clash font-bold text-2xl sm:text-3xl text-white uppercase tracking-wider text-center">
                Faculty &amp; Staff
              </h2>
              <div className="h-px flex-1 bg-[var(--theme-primary,#00f0ff)]/20" />
            </div>
            <p className="text-center font-mono text-xs uppercase tracking-widest text-[var(--theme-primary,#00f0ff)]/70">
              Department Mentors · Research Guides · Technical Instructors
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {FACULTY.map((member, i) => (
              <FacultyCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
