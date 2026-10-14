import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

const BEAT_SECONDS = 30;
/** Without input for this long, a visible tab counts as idle, not reading. */
const IDLE_AFTER_MS = 90_000;

/**
 * Credits reading time to a lesson: every 30s the tab is visible and the
 * learner has recently scrolled, typed or moved the pointer, add 30s (and
 * the furthest scroll depth) via add_lesson_time(). Leaving the lesson sends
 * the partial interval. The server caps each call, so a tampered client
 * cannot claim hours at once.
 */
export function useReadingHeartbeat(lessonId: string | undefined, enabled = true) {
  useEffect(() => {
    if (!lessonId || !enabled) return;

    let lastInput = Date.now();
    let maxScroll = 0;
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;

    const scrollPct = () => {
      const doc = document.documentElement;
      const range = doc.scrollHeight - window.innerHeight;
      return range <= 0 ? 100 : Math.round((window.scrollY / range) * 100);
    };

    const onInput = () => {
      lastInput = Date.now();
      maxScroll = Math.max(maxScroll, scrollPct());
    };

    const send = (seconds: number) => {
      if (seconds < 5) return;
      void supabase.rpc("add_lesson_time", {
        p_lesson_id: lessonId,
        p_seconds: Math.round(seconds),
        p_scroll_pct: Math.min(100, maxScroll),
      });
    };

    const elapsedActive = () => {
      if (visibleSince === null) return 0;
      const end = Math.min(Date.now(), lastInput + IDLE_AFTER_MS);
      return Math.max(0, (end - visibleSince) / 1000);
    };

    const interval = setInterval(() => {
      const seconds = elapsedActive();
      if (seconds >= BEAT_SECONDS) {
        send(seconds);
        visibleSince = Date.now();
      } else if (Date.now() - lastInput > IDLE_AFTER_MS) {
        visibleSince = Date.now();
      }
    }, BEAT_SECONDS * 1000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        send(elapsedActive());
        visibleSince = null;
      } else {
        visibleSince = Date.now();
        lastInput = Date.now();
      }
    };

    window.addEventListener("scroll", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    window.addEventListener("pointermove", onInput, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("pointermove", onInput);
      document.removeEventListener("visibilitychange", onVisibility);
      send(elapsedActive());
    };
  }, [lessonId, enabled]);
}
