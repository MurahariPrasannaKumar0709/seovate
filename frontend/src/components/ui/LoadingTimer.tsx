"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A start/stop-driven elapsed-seconds counter. Deliberately not derived reactively from a
 *  boolean "active" prop via useEffect — reading Date.now() or a ref during render, or calling
 *  setState synchronously in an effect body, both violate this project's React Compiler purity
 *  rules. Calling `start()`/`stop()` directly from the same async function that flips a loading
 *  flag keeps every state update inside an explicit event-driven callback instead. */
export function useLoadingTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(0);
    const startedAt = Date.now();
    intervalRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { seconds, start, stop };
}

/** A small spinner + running timer, shown only while `active`. Pair with `useLoadingTimer()` —
 *  call `.start()`/`.stop()` around the async work and pass its `seconds` through here. */
export function LoadingTimer({ active, seconds, label }: { active: boolean; seconds: number; label: string }) {
  if (!active) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span
        className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-ink border-t-transparent"
        aria-hidden="true"
      />
      <span>
        {label} — {seconds}s
      </span>
    </div>
  );
}
