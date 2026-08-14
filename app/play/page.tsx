"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BackgroundShapes from "@/components/BackgroundShapes";
import { soundEngine } from "@/lib/soundEngine";

export default function PlayEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    soundEngine.unlock();
    soundEngine.click();
    const clean = code.trim().toUpperCase();
    if (clean.length >= 4) router.push(`/play/${clean}`);
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">
      <BackgroundShapes />
      <motion.form
        onSubmit={go}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass rounded-3xl p-8 w-full max-w-sm text-center shadow-card"
      >
        <div className="text-5xl mb-3">🎯</div>
        <h1 className="font-display font-black text-2xl mb-1">Enter Game Code</h1>
        <p className="text-white/60 text-sm mb-6">
          Get the code from the projector screen.
        </p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXXX"
          maxLength={8}
          className="w-full text-center font-display font-black text-3xl tracking-[0.3em] bg-white/10 border-2 border-white/20 rounded-2xl py-4 mb-5 placeholder:text-white/20 outline-none focus:border-gameyellow uppercase"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="card-pop w-full font-display font-extrabold text-lg py-4 rounded-2xl bg-gamegreen text-ink shadow-pop"
        >
          CONTINUE ➜
        </motion.button>
      </motion.form>
    </main>
  );
}
