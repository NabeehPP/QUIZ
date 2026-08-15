"use client";

import { Gamepad2, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundShapes from "@/components/BackgroundShapes";
import { soundEngine } from "@/lib/soundEngine";

export default function LandingPage() {
  const playClickSound = () => {
    soundEngine.unlock();
    soundEngine.click();
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      <BackgroundShapes />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -3 }}
          transition={{ type: "spring", stiffness: 140, damping: 10 }}
          className="mb-6 inline-block bg-gameyellow text-ink font-display font-extrabold text-sm md:text-base px-5 py-2 rounded-full shadow-pop -rotate-3"
        >
          🎮  READY TO TEST YOUR AWARENESS?
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-display font-black leading-[0.95] text-5xl sm:text-6xl md:text-7xl"
        >
          <span className="block text-white">ANTI RAGGING</span>
          <span className="text-shimmer animate-shimmer block bg-clip-text text-transparent drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">
            QUIZ
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-6 text-base md:text-lg text-white/85 font-medium max-w-lg"
        >
        Think you can spot ragging? Prove it.
        15 questions.      
        One mission. Zero tolerance.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link
            href="/play"
            onClick={playClickSound}
            className="card-pop group relative font-display font-extrabold text-xl md:text-2xl px-10 py-5 rounded-2xl bg-gamegreen text-ink shadow-pop transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Gamepad2 className="mr-2 inline -translate-y-1 inline" size={40}/>
            JOIN GAME
          </Link>
          <Link
            href="/host"
            onClick={playClickSound}
            className="card-pop font-display font-bold text-base px-6 py-4 rounded-2xl glass text-white transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <MonitorPlay className="mr-2 inline" />
            HOST GAME
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-xs md:text-sm text-white/60"
        >
          Scan the QR code on the big screen, or tap JOIN GAME and enter the game code.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="relative z-10 mt-16 glass rounded-2xl px-6 py-4 text-center max-w-md"
      >
        <p className="font-display font-bold text-gameyellow text-sm md:text-base">
          Know the signs. Speak up. Stand together.
        </p>
      </motion.div>
    </main>
  );
}
