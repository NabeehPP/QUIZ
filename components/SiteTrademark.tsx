"use client";

import { Sparkles } from "lucide-react";

export default function SiteTrademark() {
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl px-4 py-2">
        <Sparkles size={12} className="text-gameyellow" />

        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Created by
        </span>

        <span className="text-xs font-black tracking-wider bg-gradient-to-r from-gameyellow via-gamepink to-gamegreen bg-clip-text text-transparent">
          NABEEH
        </span>

        <Sparkles size={12} className="text-gamepink" />
      </div>
    </div>
  );
}