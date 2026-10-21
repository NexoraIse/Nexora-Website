'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useIsTouchDevice(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
