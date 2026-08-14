"use client";

export default function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? "Turn sound off" : "Turn sound on"}
      title={enabled ? "Sound: On" : "Sound: Off"}
      className="glass rounded-xl px-3 py-2 font-display font-bold text-sm flex items-center gap-2 hover:bg-white/15 transition"
    >
      <span>{enabled ? "🔊" : "🔇"}</span>
      <span className="hidden sm:inline">{enabled ? "Sound On" : "Sound Off"}</span>
    </button>
  );
}
