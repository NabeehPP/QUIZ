"use client";

import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/lib/types";

const PODIUM_HEIGHT: Record<number, string> = { 0: "h-40 md:h-56", 1: "h-28 md:h-40", 2: "h-20 md:h-28" };
const ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const MEDAL = ["🥇", "🥈", "🥉"];

export default function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  return (
    <div className="flex items-end justify-center gap-3 md:gap-6 w-full max-w-3xl mx-auto">
      {ORDER.map((rank, i) => {
        const team = top3[rank];
        if (!team) return <div key={rank} className="flex-1" />;
        return (
          <motion.div
            key={team.teamId}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.25 + 0.3, type: "spring", stiffness: 120, damping: 12 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="relative">
              {rank === 0 && (
                <span className="absolute inset-0 -m-3 rounded-full bg-gameyellow/30 blur-md animate-glowPulse" />
              )}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="relative text-4xl md:text-6xl mb-2"
              >
                {MEDAL[rank]}
              </motion.div>
            </div>
            <div
              className="w-full max-w-[140px] rounded-2xl px-3 py-2 text-center font-display font-extrabold text-ink shadow-card mb-2 truncate"
              style={{ backgroundColor: team.color }}
              title={team.name}
            >
              {team.name}
            </div>
            <div
              className={`w-full max-w-[160px] ${PODIUM_HEIGHT[rank]} rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-pop`}
              style={{
                background: `linear-gradient(180deg, ${team.color}dd, ${team.color}55)`,
              }}
            >
              <span className="text-2xl md:text-4xl font-display font-black text-white text-outline">
                {rank + 1}
              </span>
              <span className="text-xs md:text-sm font-bold text-white/90 mt-1">
                {team.score} pts
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
