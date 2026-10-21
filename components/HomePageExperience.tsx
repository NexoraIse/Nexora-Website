"use client";

import { useEffect, useState, type ReactNode } from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import { useAudio } from "@/components/AudioProvider";

export default function HomePageExperience({
  children,
  suppressPreloader = false,
}: {
  children: ReactNode
  suppressPreloader?: boolean
}) {
  const [preloaderFinished, setPreloaderFinished] = useState<boolean | null>(null);
  const [introStarted, setIntroStarted] = useState(false);
  const { initializeAudio } = useAudio();

  useEffect(() => {
    if (suppressPreloader) {
      setPreloaderFinished(true);
      setIntroStarted(true);
      return;
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("code")) {
        window.location.replace(`/api/connect/auth/callback${window.location.search}`);
        return;
      }
    }

    const hasSeenPreloader = sessionStorage.getItem("preloaderShown") === "true";

    queueMicrotask(() => {
      setPreloaderFinished(hasSeenPreloader);
      if (hasSeenPreloader) {
        initializeAudio(true);
        setIntroStarted(true);
      }
    });
  }, [initializeAudio, suppressPreloader]);

  const handlePreloaderFinish = () => {
    setPreloaderFinished(true);
    sessionStorage.setItem("preloaderShown", "true");
    initializeAudio(true);
    setIntroStarted(true);
  };

  if (preloaderFinished === null) {
    return <div className="min-h-screen bg-[var(--theme-bg-main,#060913)]" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg-hero,#dce6ef)] text-white">
      {preloaderFinished === false && !suppressPreloader && (
        <Preloader onFinish={handlePreloaderFinish} />
      )}

      <main className="relative min-h-screen w-full bg-[var(--theme-bg-hero,#dce6ef)] text-white">
        <Navbar />
        <Hero introStarted={introStarted}>{children}</Hero>
        <Footer />
      </main>
    </div>
  );
}
