'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { setCursorMode, subscribeCursorMode, type CursorMode } from '@/hooks/useCursorMode';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';

let lastX = 0;
let lastY = 0;
let initialized = false;

const CURSOR_SPRING = { stiffness: 520, damping: 46, mass: 0.35 };
const RING_SPRING = { stiffness: 260, damping: 32, mass: 0.5 };
const HOVER_SELECTOR = 'a, button, [role="button"], input, select, textarea, [data-cursor]';

export default function CustomCursor() {
  const cursorLayerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const hidden = useIsTouchDevice();
  const [hovering, setHovering] = useState(false);
  const [mode, setMode] = useState<CursorMode>('');

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useSpring(mouseX, CURSOR_SPRING);
  const cursorY = useSpring(mouseY, CURSOR_SPRING);
  const ringX = useSpring(cursorX, RING_SPRING);
  const ringY = useSpring(cursorY, RING_SPRING);

  useEffect(() => {
    if (hidden || isAdminPage) return;

    if (!initialized) {
      lastX = window.innerWidth / 2;
      lastY = window.innerHeight / 2;
      initialized = true;
    }
    mouseX.set(lastX);
    mouseY.set(lastY);
    cursorX.jump(lastX);
    cursorY.jump(lastY);
    ringX.jump(lastX);
    ringY.jump(lastY);

    let rafId: number | null = null;
    const onMouseMove = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      mouseX.set(lastX);
      mouseY.set(lastY);

      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const target = document.elementFromPoint(lastX, lastY);
        setHovering(!!target?.closest(HOVER_SELECTOR));

        const cursorElement = target?.closest<HTMLElement>('[data-cursor]');
        setCursorMode(cursorElement?.dataset.cursor ?? '');
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [hidden, isAdminPage, cursorX, cursorY, ringX, ringY, mouseX, mouseY]);

  useEffect(() => subscribeCursorMode(setMode), []);

  useEffect(() => {
    const cursorLayer = cursorLayerRef.current;
    if (!cursorLayer) return;

    cursorLayer.showPopover();

    const bringCursorAboveModal = () => {
      if (!document.querySelector('dialog:modal')) return;
      cursorLayer.hidePopover();
      cursorLayer.showPopover();
    };

    const observer = new MutationObserver(bringCursorAboveModal);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (cursorLayer.matches(':popover-open')) cursorLayer.hidePopover();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('native-cursor', isAdminPage);
    return () => document.body.classList.remove('native-cursor');
  }, [isAdminPage]);

  useEffect(() => {
    queueMicrotask(() => {
      setHovering(false);
      setCursorMode('');
    });
  }, [pathname]);

  if (hidden || isAdminPage) return null;

  return (
    <div ref={cursorLayerRef} popover="manual" className="custom-cursor-top-layer">
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[999999] pointer-events-none"
        style={{
          x: cursorX,
          y: cursorY,
          translate: '-50% -50%',
          width: 8,
          height: 8,
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 4px rgba(7, 20, 38, 0.75)',
          willChange: 'transform',
        }}
        animate={{ scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[999998] pointer-events-none"
        style={{
          x: ringX,
          y: ringY,
          translate: '-50% -50%',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid var(--theme-accent, #00f0ff)',
          boxShadow: '0 0 0 1px rgba(7, 20, 38, 0.55), 0 0 10px rgba(0, 240, 255, 0.4)',
          willChange: 'transform',
        }}
        animate={{ scale: hovering ? 2.2 : 1, opacity: 0.85 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence>
        {mode && (
          <motion.div
            key={mode}
            aria-hidden="true"
            className="fixed left-0 top-0 z-[999999] pointer-events-none whitespace-nowrap rounded-full border border-sky-400/40 bg-[#060913] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#00f0ff] shadow-lg"
            style={{ x: cursorX, y: cursorY, translate: '16px 16px', willChange: 'transform' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
          >
            {mode}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
