"use client";

export default function BackgroundShapes() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-blob bg-gameblue/30 animate-float blur-sm" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-blob bg-gamepink/25 animate-floatSlow blur-sm" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-blob bg-gamegreen/25 animate-float blur-sm" />
      <div className="absolute top-10 right-1/4 w-24 h-24 rotate-12 bg-gameyellow/70 rounded-3xl animate-wiggle" />
      <div className="absolute bottom-24 right-10 w-16 h-16 rounded-full bg-gameorange/60 animate-float" />
      <div className="absolute top-1/2 left-10 w-10 h-10 rotate-45 bg-gamepurple/60 rounded-lg animate-spinSlow" />
      <div className="absolute bottom-10 left-1/3 w-20 h-20 border-8 border-gamepink/40 rounded-full animate-spinSlow" />
      <div className="absolute top-20 left-1/2 w-14 h-14 border-4 border-gameyellow/50 rotate-45 animate-wiggle" />
    </div>
  );
}
