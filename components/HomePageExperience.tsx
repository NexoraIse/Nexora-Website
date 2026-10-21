"use client";

import { useEffect, useState, type ReactNode } from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import { useAudio } from "@/components/AudioProvider";

export default function HomePageExperience({
  children,
  launchActive = false,
  postLaunchCycle = 0,
}: {
  children: ReactNode
  launchActive?: boolean
  postLaunchCycle?: number
}) {
  const [preloaderFinished, setPreloaderFinished] = useState<boolean | null>(
    () => launchActive ? true : null,
  );
  const [completedPostLaunchCycle, setCompletedPostLaunchCycle] = useState(0);
  const [introStarted, setIntroStarted] = useState(false);
  const { initializeAudio } = useAudio();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("code")) {
        window.location.replace(`/api/connect/auth/callback${window.location.search}`);
        return;
      }
    }

    if (launchActive || postLaunchCycle > 0) return;

    const hasSeenPreloader = sessionStorage.getItem("preloaderShown") === "true";

    queueMicrotask(() => {
      setPreloaderFinished(hasSeenPreloader);
      if (hasSeenPreloader) {
        initializeAudio(true);
        setIntroStarted(true);
      }
    });
  }, [initializeAudio, launchActive, postLaunchCycle]);

  const handlePreloaderFinish = () => {
    setPreloaderFinished(true);
    setCompletedPostLaunchCycle(postLaunchCycle);
    sessionStorage.setItem("preloaderShown", "true");
    initializeAudio(true);
    setIntroStarted(true);
  };

  if (preloaderFinished === null) {
    return <div className="min-h-screen bg-[var(--theme-bg-main,#060913)]" />;
  }

  const showPreloader =
    preloaderFinished === false || postLaunchCycle > completedPostLaunchCycle;

  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--theme-bg-hero,#dce6ef)] text-white"
      aria-hidden={launchActive}
      style={{ visibility: launchActive ? "hidden" : "visible" }}
    >
      {showPreloader && (
        <Preloader onFinish={handlePreloaderFinish} />
      )}

      <main className="relative min-h-screen w-full bg-[var(--theme-bg-hero,#dce6ef)] text-white">
        <Navbar />
        <Hero introStarted={introStarted || postLaunchCycle > 0}>{children}</Hero>
        <Footer />
      </main>
    </div>
  );
}
