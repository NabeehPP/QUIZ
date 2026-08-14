"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const COLORS = ["#3B5CFF", "#8B2FE8", "#FFC93C", "#FF7A29", "#FF3EA5", "#22D67E"];

export default function Confetti({ trigger }: { trigger: number }) {
  useEffect(() => {
    if (trigger <= 0) return;
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 65,
        origin: { x: 0 },
        colors: COLORS,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 65,
        origin: { x: 1 },
        colors: COLORS,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.4 },
      colors: COLORS,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return null;
}
