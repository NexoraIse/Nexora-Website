'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useSpring } from 'motion/react';
import { on } from '@/hooks/useEventBus';
import { useStackOffset } from '@/hooks/useBottomStack';
import { NAV_LINKS } from './Navbar';

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

const DIAL_POSITIONS = [
  { dx: 0, dy: -210, rot: 0 },
  { dx: -88, dy: -168, rot: -4 },
  { dx: 88, dy: -168, rot: 4 },
  { dx: 0, dy: -126, rot: -2 },
  { dx: -88, dy: -84, rot: 3 },
  { dx: 88, dy: -84, rot: -3 },
];

const DIAL_ITEMS = NAV_LINKS.slice(0, DIAL_POSITIONS.length);

export default function BottomNavCluster() {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [scrollUp, setScrollUp] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const playPillOffset = useStackOffset('play-pill');

  const smoothX = useSpring(0, { stiffness: 300, damping: 26 });
  const rowObserver = useRef<ResizeObserver | null>(null);

  const setRowRef = useCallback(
    (el: HTMLDivElement | null) => {
      rowObserver.current?.disconnect();
      if (!el) return;
      let firstMeasurement = true;
      const observer = new ResizeObserver(() => {
        const target = -el.offsetWidth / 2;
        if (firstMeasurement) {
          smoothX.jump(target);
          firstMeasurement = false;
        } else {
          smoothX.set(target);
        }
      });
      observer.observe(el);
      rowObserver.current = observer;
    },
    [smoothX]
  );

  useEffect(() => on<boolean>('navbar:collapsed', setNavCollapsed), []);

  useEffect(() => {
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 4) {
        setScrollUp(y < lastY);
        lastY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hamburgerPresent = navCollapsed;
  const rowVisible = scrollUp && hamburgerPresent;

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
  };

  return (
    <>
      {menuOpen && (
        <div
          aria-hidden
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[299] bg-black/40 backdrop-blur-[2px]"
        />
      )}

      <AnimatePresence>
        {rowVisible && (
          <motion.div
            key="bottom-nav-cluster"
            ref={setRowRef}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: -playPillOffset }}
            exit={{ opacity: 0, y: 60 }}
            transition={{
              opacity: { duration: 0.35, ease: EASE },
              y: { type: 'spring', stiffness: 300, damping: 26 },
            }}
            style={{ x: smoothX }}
            className="fixed bottom-6 left-1/2 z-[300] flex items-center gap-3"
          >
            {/* Hamburger Circular Button */}
            <div className="relative">
              <button
                onClick={toggleMenu}
                aria-label={menuOpen ? 'Close quick menu' : 'Open quick menu'}
                aria-expanded={menuOpen}
                data-cursor="Menu"
                className="group relative z-[301] w-12 h-12 rounded-full border border-[var(--theme-primary,#00f0ff)] bg-[var(--theme-bg-main,#060913)]
                  flex flex-col items-center justify-center gap-1.5
                  hover:bg-[var(--theme-primary,#00f0ff)] shadow-2xl transition-colors cursor-pointer"
              >
                <motion.span
                  animate={{ width: menuOpen ? 14 : 18, rotate: menuOpen ? 8 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="h-[2px] bg-[var(--theme-primary,#00f0ff)] rounded-full group-hover:bg-[var(--theme-bg-main,#060913)]"
                />
                <motion.span
                  animate={{ width: menuOpen ? 18 : 14, rotate: menuOpen ? -8 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="h-[2px] bg-[var(--theme-primary,#00f0ff)] rounded-full group-hover:bg-[var(--theme-bg-main,#060913)]"
                />
              </button>

              {/* Exploded Dial Links */}
              <AnimatePresence>
                {menuOpen &&
                  DIAL_ITEMS.map((item, i) => (
                    <div
                      key={item.href}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300]"
                    >
                      <motion.div
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                        animate={{
                          x: DIAL_POSITIONS[i].dx,
                          y: DIAL_POSITIONS[i].dy,
                          opacity: 1,
                          scale: 1,
                          rotate: DIAL_POSITIONS[i].rot,
                        }}
                        exit={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.04 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          data-cursor={item.label}
                          className="block whitespace-nowrap rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-bg-main,#060913)]
                            px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-[var(--theme-primary,#00f0ff)] shadow-lg
                            hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] transition-colors"
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    </div>
                  ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
