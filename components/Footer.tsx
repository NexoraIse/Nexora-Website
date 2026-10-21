"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Globe, Mail } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Department" },
  { href: "/events", label: "Events & Hackathons" },
  { href: "/learn", label: "Learning Resources" },
  { href: "/practice", label: "Practice & Coding" },
  { href: "/achievements", label: "Student Achievements" },
  { href: "/members", label: "Club Members & Team" },
  { href: "/connect", label: "Nexora Connect" },
];

const RESOURCE_LINKS = [
  { href: "/learn", label: "VTU Semester Notes" },
  { href: "/learn", label: "Previous Question Papers" },
  { href: "/learn", label: "Laboratory Manuals" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[var(--theme-bg-main,#060913)] text-white overflow-hidden border-t border-[var(--theme-primary,#00f0ff)]/20">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4 max-w-md">
            <div className="flex items-center gap-2.5">
              <Link href="/" aria-label="Nexora home" className="inline-flex">
                <Image
                  src="/logo-navbar.png"
                  alt="Nexora"
                  width={188}
                  height={40}
                  className="h-10 w-[188px] object-contain object-left"
                />
              </Link>
            </div>

            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]">
              Department of Information Science and Engineering
            </p>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              A J Institute of Engineering and Technology (AJIET), Kottara Chowki, Mangaluru,
              Karnataka 575006. (A Unit of Laxmi Memorial Educational Trust® · NBA Accredited).
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3.5 pt-2">
              <a
                href="https://github.com/NexoraIse"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="GitHub"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-[var(--theme-primary,#00f0ff)] hover:border-[var(--theme-primary,#00f0ff)] transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="mailto:nexora.ise@ajiet.edu.in"
                data-cursor="Email"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-[var(--theme-primary,#00f0ff)] hover:border-[var(--theme-primary,#00f0ff)] transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://ajiet.edu.in"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="AJIET"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-[var(--theme-primary,#00f0ff)] hover:border-[var(--theme-primary,#00f0ff)] transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-clash font-bold uppercase text-xs tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-cursor={link.label}
                    className="text-white/75 hover:text-[var(--theme-primary,#00f0ff)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Resources */}
          <div className="space-y-3">
            <h4 className="font-clash font-bold uppercase text-xs tracking-[0.2em] text-[var(--theme-primary,#00f0ff)]">
              Quick Resources
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    data-cursor={link.label}
                    className="text-white/75 hover:text-[var(--theme-primary,#00f0ff)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© 2026 Nexora ISE Club · All rights reserved.</p>

          <button
            onClick={scrollToTop}
            data-cursor="Top"
            className="flex items-center gap-2 text-white/80 hover:text-[var(--theme-primary,#00f0ff)] transition-colors cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
