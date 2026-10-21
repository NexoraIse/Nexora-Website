import React from 'react';
import FuzzyText from '@/components/FuzzyText';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050610] text-white selection:bg-sky-500/30 selection:text-sky-200 p-4">
      {/* Background ambient cyber grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#38bdf808_1px,transparent_1px),linear-gradient(to_bottom,#38bdf808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)]"
      />

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[700px] max-w-[90vw] rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-purple-500/20 blur-[130px]"
      />

      {/* Interactive Fuzzy 404 text from React Bits */}
      <div className="relative z-10 flex items-center justify-center select-none">
        <FuzzyText
          baseIntensity={0.2}
          hoverIntensity={0.55}
          enableHover={true}
          clickEffect={true}
          glitchMode={true}
          glitchInterval={3200}
          glitchDuration={200}
          fuzzRange={36}
          fontSize="clamp(5.5rem, 22vw, 16rem)"
          fontWeight={900}
          color="#38bdf8"
          gradient={['#38bdf8', '#818cf8', '#c084fc']}
        >
          404
        </FuzzyText>
      </div>
    </main>
  );
}

