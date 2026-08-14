"use client";

import { useCallback, useEffect, useState } from "react";
import { soundEngine } from "./soundEngine";

const STORAGE_KEY = "ragging-quiz-sound-enabled";

/** Sound on/off state for the host/projector screen only. */
export function useSoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = stored === null ? true : stored === "true";
    setEnabled(initial);
    soundEngine.setEnabled(initial);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Turning sound on counts as a fresh user gesture — safe to unlock here.
        soundEngine.unlock();
      }
      // Turning off silences immediately, including anything mid-playback.
      soundEngine.setEnabled(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}
