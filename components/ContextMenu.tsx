"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  House,
  CalendarBlank,
  Bell,
  BookOpen,
  Code,
  Handshake,
  Trophy,
  UsersThree,
  Info,
  LinkSimple,
  ShareNetwork,
  ArrowClockwise,
  ArrowLineUp,
  Sparkle,
  Check,
  MouseRightClick,
  Users,
} from "@phosphor-icons/react";
import { useLenis } from "@/components/SmoothScroll";

const NAV_ITEMS: { href: string; label: string; icon: typeof House }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/about", label: "About", icon: Info },
  { href: "/events", label: "Events", icon: CalendarBlank },
  { href: "/notices", label: "Notices", icon: Bell },
  { href: "/learn", label: "Learning Hub", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Code },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/members", label: "Members", icon: Users },
  { href: "/connect", label: "Connect", icon: LinkSimple },
];

const HYPE_MESSAGES = [
  "Think. Build. Innovate. Welcome to Nexora.",
  "Engineering the future of Information Science.",
  "From code snippets to production systems.",
  "Explore hackathons, workshops, and notes.",
  "Department of ISE, AJIET Mangaluru.",
  "High on Tech. Passionate about Innovation.",
  "NBA Accredited B.E. Program in Information Science.",
  "100+ research papers published by faculty & students.",
  "Curiosity and code — our only entry requirements.",
];

const HINT_MESSAGES = [
  "Try right clicking",
  "Psst — right-click anywhere",
  "You haven't tried right-clicking yet",
  "There's a menu hiding under right-click",
  "Right-click. Go on.",
];

const HINT_MAX_POKES = 4;

const ITEM_CLS =
  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left " +
  "text-white/80 text-[13px] font-medium hover:bg-white/10 hover:text-[var(--theme-primary,#00f0ff)] transition-colors duration-150";

export default function ContextMenu() {
  const router = useRouter();
  const lenis = useLenis();
  const menuRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [hype, setHype] = useState<string | null>(null);
  const [canShare] = useState(
    () => typeof navigator !== "undefined" && !!navigator.share,
  );
  const [showHint, setShowHint] = useState(false);
  const [hintPos, setHintPos] = useState({ x: 0, y: 0 });
  const [hintMessage, setHintMessage] = useState(HINT_MESSAGES[0]);
  const showHintRef = useRef(false);

  const close = useCallback(() => setVisible(false), []);
  const updateHintVisibility = useCallback((show: boolean) => {
    showHintRef.current = show;
    setShowHint(show);
  }, []);

  /* ─── Right-click hint system for desktop ─── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let discovered = false;
    let pokes = 0;
    let lastIndex = -1;
    let timer: number;

    const markSeen = () => {
      discovered = true;
      updateHintVisibility(false);
      window.clearTimeout(timer);
    };

    const onMove = (e: MouseEvent) => {
      if (showHintRef.current) setHintPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("contextmenu", markSeen);

    const poke = () => {
      if (discovered || pokes >= HINT_MAX_POKES) return;
      pokes++;

      let index = Math.floor(Math.random() * HINT_MESSAGES.length);
      if (index === lastIndex) index = (index + 1) % HINT_MESSAGES.length;
      lastIndex = index;

      setHintMessage(HINT_MESSAGES[index]);
      updateHintVisibility(true);
      timer = window.setTimeout(() => {
        updateHintVisibility(false);
        timer = window.setTimeout(poke, 15000 + Math.random() * 15000);
      }, 4000);
    };

    timer = window.setTimeout(poke, 4000 + Math.random() * 5000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("contextmenu", markSeen);
    };
  }, [updateHintVisibility]);

  /* ─── Context menu listener ─── */
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'input, textarea, [contenteditable="true"], [data-no-context-menu]',
        )
      )
        return;
      e.preventDefault();
      setCopied(false);
      updateHintVisibility(false);

      const menu = menuRef.current;
      const pad = 8;
      const x = menu
        ? Math.max(pad, Math.min(e.clientX, window.innerWidth - menu.offsetWidth - pad))
        : e.clientX;
      const y = menu
        ? Math.max(pad, Math.min(e.clientY, window.innerHeight - menu.offsetHeight - pad))
        : e.clientY;
      setPos({ x, y });
      setVisible(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [close, updateHintVisibility]);

  /* ─── Clamp menu to viewport on open ─── */
  useEffect(() => {
    if (!visible || !menuRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = menuRef.current;
    const pad = 8;
    setPos((prev) => {
      const x = Math.max(pad, Math.min(prev.x, window.innerWidth - w - pad));
      const y = Math.max(pad, Math.min(prev.y, window.innerHeight - h - pad));
      return x === prev.x && y === prev.y ? prev : { x, y };
    });
  }, [visible]);

  const handleNav = (href: string) => {
    close();
    router.push(href);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(close, 700);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch {
      // User cancelled share
    }
    close();
  };

  const handleScrollTop = () => {
    close();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReload = () => window.location.reload();

  const handleHype = () => {
    close();
    setHype(HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)]);
    setTimeout(() => setHype(null), 2200);
  };

  return (
    <>
      {/* ── Context Menu ── */}
      <AnimatePresence>
        {visible && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={close}
            />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed",
                top: pos.y,
                left: pos.x,
                zIndex: 9999,
              }}
              className="w-60 bg-[var(--theme-bg-main,#060913)] border border-white/10 rounded-md shadow-2xl overflow-hidden py-1.5"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Header */}
              <div className="px-3.5 pt-2.5 pb-2 border-b border-white/10 mb-1">
                <span className="font-clash font-bold text-white text-sm tracking-wide">
                  Nexora ISE
                </span>
              </div>

              {/* Navigation */}
              <div className="px-1.5 py-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => handleNav(href)}
                    className={ITEM_CLS}
                  >
                    <Icon size={15} weight="bold" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="h-px bg-white/10 my-1" />

              {/* Utility actions */}
              <div className="px-1.5 py-1">
                <button onClick={handleCopyLink} className={ITEM_CLS}>
                  {copied ? (
                    <Check size={15} weight="bold" className="text-[var(--theme-primary,#00f0ff)]" />
                  ) : (
                    <LinkSimple size={15} weight="bold" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                {canShare && (
                  <button onClick={handleShare} className={ITEM_CLS}>
                    <ShareNetwork size={15} weight="bold" />
                    Share
                  </button>
                )}
                <button onClick={handleScrollTop} className={ITEM_CLS}>
                  <ArrowLineUp size={15} weight="bold" />
                  Scroll to Top
                </button>
                <button onClick={handleReload} className={ITEM_CLS}>
                  <ArrowClockwise size={15} weight="bold" />
                  Reload
                </button>
              </div>

              <div className="h-px bg-white/10 my-1" />

              {/* Hype Me Up */}
              <div className="px-1.5 py-1">
                <button
                  onClick={handleHype}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left
                  text-[var(--theme-primary,#00f0ff)] text-[13px] font-semibold hover:bg-[var(--theme-primary,#00f0ff)]/10 transition-colors duration-150"
                >
                  <Sparkle size={15} weight="fill" />
                  Hype Me Up
                </button>
              </div>

              {/* Footer */}
              <div className="px-3.5 pt-1.5 pb-2 border-t border-white/10 mt-1">
                <p className="text-white/30 text-[9px] uppercase tracking-[0.15em]">
                  Made with 💚 by Nexora ISE Club
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Hype pill toast ── */}
      <AnimatePresence>
        {hype && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[var(--theme-bg-main,#060913)] text-[var(--theme-primary,#00f0ff)]
              font-clash font-bold text-sm px-5 py-3 rounded-full shadow-2xl border border-[var(--theme-primary,#00f0ff)]/30
              flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkle size={16} weight="fill" />
            {hype}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right-click hint floating near cursor ── */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: hintPos.y,
              left: hintPos.x + 20,
              zIndex: 999997,
            }}
            className="pointer-events-none -translate-y-1/2 bg-[var(--theme-bg-main,#060913)] text-[var(--theme-primary,#00f0ff)] text-xs font-semibold
              px-3.5 py-2 rounded-full shadow-2xl border border-[var(--theme-primary,#00f0ff)]/30 whitespace-nowrap
              flex items-center gap-1.5"
          >
            <MouseRightClick size={14} weight="bold" />
            {hintMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
