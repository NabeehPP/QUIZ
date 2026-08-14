"use client";

import { useEffect, useRef, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function CountdownRing({
  startedAt,
  limitSeconds,
  onComplete,
  size = 120,
}: {
  startedAt: string | null;
  limitSeconds: number;
  onComplete?: () => void;
  size?: number;
}) {
  const [remaining, setRemaining] = useState(limitSeconds);
  const [done, setDone] = useState(false);
  const lastTickSecondRef = useRef<number | null>(null);
  const warningPlayedRef = useRef(false);

  useEffect(() => {
    setDone(false);
    lastTickSecondRef.current = null;
    warningPlayedRef.current = false;
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();

    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, limitSeconds - elapsed);
      setRemaining(left);

      // "Time almost over" warning — fires once, around the 5s mark.
      if (!warningPlayedRef.current && left <= 5 && left > 3) {
        warningPlayedRef.current = true;
        soundEngine.timeWarning();
      }

      // Soft tick on each of the final 3 whole seconds (3, 2, 1).
      if (left > 0 && left <= 3) {
        const wholeSecond = Math.ceil(left);
        if (lastTickSecondRef.current !== wholeSecond) {
          lastTickSecondRef.current = wholeSecond;
          soundEngine.countdownTick();
        }
      }

      if (left <= 0 && !done) {
        setDone(true);
        onComplete?.();
      }
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, limitSeconds]);

  const fraction = remaining / limitSeconds;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const urgent = remaining <= 5;
  const critical = remaining <= 3;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Pulsing alert ring during the final countdown seconds */}
      {critical && (
        <span
          className="absolute rounded-full border-2 border-gamepink animate-pulseRing"
          style={{ width: size, height: size }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? "#FF3EA5" : "#FFC93C"}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className={`absolute font-display font-extrabold ${
          urgent ? "text-gamepink animate-wiggle" : "text-white"
        }`}
        style={{ fontSize: size * 0.32 }}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}
