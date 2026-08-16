"use client";

export default function SiteTrademark() {
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className="rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md px-3 py-1 shadow-sm">
        <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-white/40">
          Created by{" "}
          <span className="text-white/60">Nabeeh</span>
        </span>
      </div>
    </div>
  );
}