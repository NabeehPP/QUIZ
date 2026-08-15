"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BackgroundShapes from "@/components/BackgroundShapes";
import { soundEngine } from "@/lib/soundEngine";

export default function HostEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");

  async function createGame() {
    // First real user gesture on the host side — safe point to unlock audio.
    soundEngine.unlock();
    soundEngine.click();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/game/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create game.");
      router.push(`/host/${data.game.code}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  function resumeGame(e: React.FormEvent) {
    e.preventDefault();
    soundEngine.unlock();
    soundEngine.click();
    const code = joinCode.trim().toUpperCase();
    if (code) router.push(`/host/${code}`);
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <BackgroundShapes />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-card"
      >
        <div className="text-5xl mb-4">🖥️</div>
        <h1 className="font-display font-black text-3xl mb-2">Host Console</h1>
        <p className="text-white/70 mb-8 text-sm">
          Create a new game to display on the projector. Up to 8 teams can join
          using the code or QR that appears next.
        </p>

        <motion.button
          onClick={createGame}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="card-pop w-full font-display font-extrabold text-lg py-4 rounded-2xl bg-gamepurple text-white shadow-pop disabled:opacity-60"
        >
          {loading ? "Creating game..." : "✨ CREATE NEW GAME"}
        </motion.button>

        {error && <p className="mt-4 text-gamepink font-semibold text-sm">{error}</p>}

        <div className="mt-8 pt-6 border-t border-white/15">
          <p className="text-white/60 text-xs mb-3">Already have a game running?</p>
          <form onSubmit={resumeGame} className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="GAME CODE"
              maxLength={8}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center font-display font-bold tracking-widest uppercase placeholder:text-white/30 outline-none focus:border-gameyellow"
            />
            <button
              type="submit"
              className="px-4 rounded-xl bg-white/15 font-bold hover:bg-white/25 transition"
            >
              Go
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
