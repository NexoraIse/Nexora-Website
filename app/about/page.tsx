"use client";

import React, { useEffect, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContourBackdrop from "@/components/ContourBackdrop";

type Member = { name: string; role: string; image: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const NEXORA_DESCRIPTION =
  "Nexora is the student-led technical body of the Department of Information Science & Engineering at A J Institute of Engineering & Technology, Mangaluru. From competitive programming and state-level hackathons to semester study repositories and project exhibitions — talent, curiosity, and code are our only currencies.";
const PILLARS = ["Learn", "Practice", "Compete", "Build"];

const HOD: Member = {
  name: "Dr. John Prakash Veigas",
  role: "Professor & HOD",
  image: "/faculty/john-prakash-veigas.jpg",
};

const FACULTY: Member[] = [
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

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value }: { value: string }) {
  const numericValue = Number.parseInt(value, 10);
  const suffix = value.replace(/^\d+/, "");
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`);
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.65 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      count.set(numericValue);
      return;
    }
    const controls = animate(count, numericValue, { duration: 1.25, ease: EASE });
    return () => controls.stop();
  }, [count, inView, numericValue, reducedMotion]);

  if (Number.isNaN(numericValue)) return <span>{value}</span>;
  return <motion.span ref={ref}>{display}</motion.span>;
}

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function FacultyCard({ member, index }: { member: Member; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const tag = `ISE_FAC_${String(index + 1).padStart(3, "0")}.dat`;

  return (
    <article className="about-faculty-card group relative isolate flex flex-col overflow-hidden border border-white/10 bg-black/35 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--theme-primary)]/50">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary)]" />
        <span className="font-terminal text-[10px] uppercase tracking-[0.16em] text-white/55">{tag}</span>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
        {!imgFailed ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center grayscale-[0.7] contrast-110 transition-[filter,transform] duration-500 group-hover:scale-[1.025] group-hover:grayscale-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.03]">
            <span className="font-clash text-5xl font-bold text-[var(--theme-primary)]/40">{initials(member.name)}</span>
          </div>
        )}
        <div aria-hidden="true" className="terminal-scanlines pointer-events-none opacity-20 transition-opacity duration-300 group-hover:opacity-55" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
      </div>
      <div className="mt-auto px-4 py-4">
        <h3 className="font-clash text-base font-semibold leading-tight text-[var(--theme-bg-hero)] group-hover:text-white">{member.name}</h3>
        <p className="mt-2 font-terminal text-[10px] uppercase tracking-[0.14em] text-[var(--theme-primary)]/80">{member.role}</p>
      </div>
    </article>
  );
}

function SectionIndex({ number, label }: { number: string; label: string }) {
  return (
    <p className="mb-8 flex items-center gap-3 font-terminal text-xs font-medium uppercase tracking-[0.18em] text-[var(--theme-primary)]">
      <span>{number}</span>
      <span aria-hidden="true" className="h-px w-8 bg-[var(--theme-primary)]/60" />
      <span>{label}</span>
    </p>
  );
}

export default function AboutPage() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[var(--theme-bg-main)] text-[var(--theme-bg-hero)]">
      <ContourBackdrop />
      <Navbar />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8 lg:px-10">
        <section aria-labelledby="nexora-title" className="relative border-b border-white/10 py-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 sm:block">
            <span className="about-x-mark select-none font-clash text-[28rem] font-semibold leading-none text-white/[0.025]">X</span>
          </div>
          <div className="relative z-10 max-w-5xl">
            <Reveal>
              <SectionIndex number="01" label="Nexora" />
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--theme-primary)]/70">
                Student tech club · ISE · AJIET
              </p>
              <h1 id="nexora-title" className="max-w-4xl font-clash text-[clamp(2.8rem,6.5vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-[var(--theme-bg-hero)]">
                About <span className="text-[var(--theme-primary)]">Nexora.</span>
              </h1>
            </Reveal>
            <div className="mt-7 grid max-w-4xl gap-8 md:grid-cols-[minmax(0,1fr)_16rem] md:items-end">
              <Reveal delay={0.08}>
                <p className="max-w-2xl font-cabinet text-base font-medium leading-relaxed text-white/75 sm:text-lg">{NEXORA_DESCRIPTION}</p>
              </Reveal>
              <Reveal delay={0.16}>
                <ul aria-label="Nexora pillars" className="border-t border-white/20">
                  {PILLARS.map((pillar, index) => (
                    <li key={pillar} className="flex items-center justify-between border-b border-white/15 py-3 font-terminal text-sm uppercase tracking-[0.12em]">
                      <span className="text-white/90">{pillar}</span>
                      <span className="text-xs text-[var(--theme-primary)]/75">0{index + 1}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="mt-7 flex items-center gap-4">
              <Image src="/logo-navbar.png" alt="Nexora" width={44} height={44} className="h-11 w-11 object-contain opacity-70" />
              <span className="h-px w-16 bg-[var(--theme-primary)]/55" />
              <span className="font-terminal text-[10px] uppercase tracking-[0.16em] text-white/50">Ideas into practice</span>
            </Reveal>
          </div>
        </section>

        <section aria-labelledby="department-title" className="border-b border-white/10 py-20 sm:py-28">
          <Reveal>
            <SectionIndex number="02" label="Department" />
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="mb-5 font-terminal text-xs uppercase tracking-[0.15em] text-white/55">A J Institute of Engineering &amp; Technology</p>
                <h2 id="department-title" className="font-clash text-[clamp(2.7rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
                  Information<br />Science <span className="text-[var(--theme-primary)]">&amp;</span><br />Engineering
                </h2>
              </div>
              <div className="border-l border-[var(--theme-primary)]/45 pl-6 sm:pl-8">
                <p className="max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
                  A department shaped by computing, collaboration, and the questions that move technology forward.
                </p>
                <p className="mt-5 font-terminal text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/50 sm:text-xs">
                  A Unit of Laxmi Memorial Educational Trust®<br />Kottara Chowki · Mangaluru · Karnataka
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <section aria-labelledby="department-story-title" className="grid gap-14 border-b border-white/10 py-20 md:py-24 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <p className="mb-4 font-terminal text-xs uppercase tracking-[0.16em] text-[var(--theme-primary)]">The department</p>
            <h2 id="department-story-title" className="max-w-md font-clash text-3xl font-semibold leading-tight sm:text-4xl">
              Explore, innovate, engineer the future.
            </h2>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-base leading-8 text-white/80">
                The Department of Information Science and Engineering, established in 2016 as a founding branch of AJ Institute of Engineering and Technology in Mangaluru, has rapidly emerged as a leading academic unit. Offering an NBA-accredited Bachelor of Engineering program with an annual intake of 60 students, the department focuses on equipping students with both theoretical and practical skills for success in the rapidly evolving IT industry.
              </p>
              <p className="mt-5 text-base leading-8 text-white/70">
                With state-of-the-art infrastructure, including advanced computing facilities and specialized laboratories, students gain hands-on experience through innovative projects, research initiatives, and engagement with our vibrant startup ecosystem. Our dedicated faculty have published textbooks, chapters, and over 100 research papers.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <dl className="mt-12 grid grid-cols-2 border-y border-white/20 sm:grid-cols-4">
                {STATS.map((stat, index) => (
                  <div key={stat.label} className={`py-6 pr-3 ${index > 0 ? "border-l border-white/15 pl-4 sm:pl-5" : ""} ${index > 1 ? "border-t border-white/15 sm:border-t-0" : ""}`}>
                    <dt className="font-terminal text-[10px] uppercase leading-relaxed tracking-[0.1em] text-white/55 sm:text-xs">{stat.label}</dt>
                    <dd className="mt-3 font-clash text-3xl font-semibold leading-none text-[var(--theme-bg-hero)] sm:text-4xl lg:text-5xl">
                      <CountUp value={stat.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <section aria-labelledby="vision-title" className="border-b border-white/10 py-20 sm:py-24">
          <Reveal>
            <p className="mb-12 font-terminal text-xs uppercase tracking-[0.16em] text-[var(--theme-primary)]">Principles / direction</p>
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              <article className="grid grid-cols-[auto_1fr] gap-5 sm:gap-8">
                <span aria-hidden="true" className="font-clash text-5xl font-light leading-none text-[var(--theme-primary)]/75 sm:text-7xl">01</span>
                <div>
                  <h2 id="vision-title" className="font-clash text-2xl font-semibold sm:text-3xl">Department Vision</h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-white/75">
                    To be a center of excellence in Information Science &amp; Engineering education, research, and training to meet the growing needs of the industry and society.
                  </p>
                </div>
              </article>
              <article className="grid grid-cols-[auto_1fr] gap-5 border-t border-white/15 pt-8 sm:gap-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <span aria-hidden="true" className="font-clash text-5xl font-light leading-none text-[var(--theme-primary)]/75 sm:text-7xl">02</span>
                <div>
                  <h2 className="font-clash text-2xl font-semibold sm:text-3xl">Department Mission</h2>
                  <ol className="mt-5 space-y-5">
                    {MISSIONS.map((mission, index) => (
                      <li key={mission} className="grid grid-cols-[2rem_1fr] gap-3 text-base leading-7 text-white/75">
                        <span className="font-terminal text-xs text-[var(--theme-primary)]/80">0{index + 1}</span>
                        <span>{mission}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            </div>
          </Reveal>
        </section>

        <section aria-labelledby="hod-name" className="border-b border-white/10 py-20 sm:py-24">
          <Reveal>
            <SectionIndex number="03" label="From the HOD's desk" />
            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end lg:gap-20">
              <div className="order-2 md:order-1">
                <p className="max-w-4xl font-clash text-2xl font-medium leading-snug text-[var(--theme-bg-hero)] sm:text-3xl lg:text-4xl">
                  “Welcome to the Department of Information Science and Engineering (ISE), which offers an NBA-accredited undergraduate B.E. program dedicated to achieving excellence in technical education.”
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-white/70">
                  Our vision is to become a center of excellence, empowering students to meet the evolving needs of industry and society. With a team of experienced faculty, state-of-the-art laboratories, and collaborative industry partnerships, we prepare our students to thrive in the dynamic IT landscape. We have established strong MOUs with leading industries and foster student-led clubs like Nexora to champion real-world coding, competitive development, and research.
                </p>
                <div className="mt-8 border-t border-white/20 pt-4">
                  <h2 id="hod-name" className="font-clash text-xl font-semibold text-white">{HOD.name}</h2>
                  <p className="mt-1 font-terminal text-xs uppercase tracking-[0.13em] text-[var(--theme-primary)]/80">{HOD.role}</p>
                </div>
              </div>
              <figure className="order-1 md:order-2">
                <div className="relative aspect-[4/5] overflow-hidden border border-white/20 p-2">
                  <Image src={HOD.image} alt={HOD.name} fill sizes="(max-width: 768px) 70vw, 240px" loading="lazy" className="object-cover object-center grayscale-[0.35]" />
                </div>
                <figcaption className="mt-3 font-terminal text-[10px] uppercase tracking-[0.14em] text-white/50">Department leadership</figcaption>
              </figure>
            </div>
          </Reveal>
        </section>

        <section aria-labelledby="faculty-title" className="pt-20 sm:pt-24">
          <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionIndex number="04" label="People" />
              <h2 id="faculty-title" className="font-clash text-4xl font-semibold tracking-tight sm:text-5xl">Faculty &amp; Staff</h2>
            </div>
            <p className="max-w-sm font-terminal text-[10px] uppercase leading-relaxed tracking-[0.13em] text-white/55 sm:text-right sm:text-xs">
              Department mentors · Research guides · Technical instructors
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {FACULTY.map((member, index) => (
              <Reveal key={member.name} delay={Math.min((index % 5) * 0.045, 0.18)}>
                <FacultyCard member={member} index={index} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
