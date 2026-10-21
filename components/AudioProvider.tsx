"use client";

import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";

interface AudioContextType {
  musicPlaying: boolean;
  audioInitialized: boolean;
  toggleMusic: () => void;
  initializeAudio: (play: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playRequestedRef = useRef(false);
  const playRequestIdRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("hasVisited")) {
      queueMicrotask(() => setAudioInitialized(true));
    }
  }, []);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const requestId = ++playRequestIdRef.current;
    playRequestedRef.current = true;
    audio.volume = 0.6;
    audio.play().catch((error: unknown) => {
      if (requestId !== playRequestIdRef.current) return;
      playRequestedRef.current = false;
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError")
      ) return;
      console.error("Audio play failed:", error);
    });
  }, []);

  const initializeAudio = useCallback((play: boolean) => {
    setAudioInitialized(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasVisited", "true");
    }

    if (play) startPlayback();
  }, [startPlayback]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused || playRequestedRef.current) {
      playRequestIdRef.current += 1;
      playRequestedRef.current = false;
      audio.pause();
      setMusicPlaying(false);
    } else {
      startPlayback();
    }
  }, [startPlayback]);

  return (
    <AudioContext.Provider value={{ musicPlaying, audioInitialized, toggleMusic, initializeAudio }}>
      <audio
        ref={audioRef}
        src="/song.mp3"
        loop
        preload="none"
        onPlay={() => {
          playRequestedRef.current = false;
          setMusicPlaying(true);
        }}
        onPause={(event) => setMusicPlaying(!event.currentTarget.paused)}
      />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
