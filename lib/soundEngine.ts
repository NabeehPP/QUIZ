"use client";

// Lightweight synthesized sound engine using the Web Audio API only.
// No external audio files. Must be unlocked by a user gesture (browser
// autoplay policy) — call soundEngine.unlock() from a click handler.

type OscType = "sine" | "triangle" | "square" | "sawtooth";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _enabled = true;
  private lastPlayedAt: Record<string, number> = {};

  get enabled() {
    return this._enabled;
  }

  setEnabled(value: boolean) {
    this._enabled = value;
    if (this.master && this.ctx) {
      // Immediately silence in-flight sounds when turned off.
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(value ? 0.6 : 0, now);
    }
  }

  /** Call from within a user-gesture event handler (click/tap). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const Ctx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this._enabled ? 0.6 : 0;
    this.master.connect(this.ctx.destination);
  }

  private get ready() {
    return !!(this.ctx && this.master && this._enabled);
  }

  // Simple per-sound-id throttle so rapid duplicate triggers (e.g. realtime
  // updates firing twice) never stack into an overlapping mess.
  private throttled(id: string, minGapMs: number) {
    const now = performance.now();
    const last = this.lastPlayedAt[id] ?? 0;
    if (now - last < minGapMs) return true;
    this.lastPlayedAt[id] = now;
    return false;
  }

  private tone(
    freq: number,
    startOffset: number,
    duration: number,
    opts: { type?: OscType; gain?: number; sweepTo?: number } = {}
  ) {
    if (!this.ctx || !this.master) return;
    const { type = "sine", gain = 0.22, sweepTo } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + startOffset;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, duration / 4));
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  private noiseBurst(
    startOffset: number,
    duration: number,
    opts: { gain?: number; lowpass?: number } = {}
  ) {
    if (!this.ctx || !this.master) return;
    const { gain = 0.15, lowpass = 1200 } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + startOffset;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;

    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  /** Subtle click for buttons / general UI interactions. */
  click() {
    if (!this.ready) return;
    this.tone(720, 0, 0.05, { type: "sine", gain: 0.12 });
  }

  /** Short pleasant chime when a team joins the lobby. */
  teamJoin() {
    if (!this.ready || this.throttled("join", 150)) return;
    this.tone(660, 0, 0.12, { type: "triangle", gain: 0.16 });
    this.tone(990, 0.08, 0.16, { type: "triangle", gain: 0.14 });
  }

  /** Single soft tick — used for the final 3 seconds of the countdown. */
  countdownTick() {
    if (!this.ready) return;
    this.tone(880, 0, 0.06, { type: "sine", gain: 0.14 });
  }

  /** Slightly more urgent tone for the "time almost over" warning. */
  timeWarning() {
    if (!this.ready || this.throttled("warning", 500)) return;
    this.tone(500, 0, 0.09, { type: "square", gain: 0.1 });
    this.tone(500, 0.12, 0.09, { type: "square", gain: 0.1 });
  }

  /** Pleasant ascending success sound for a correct answer. */
  correct() {
    if (!this.ready || this.throttled("correct", 300)) return;
    this.tone(523.25, 0, 0.14, { type: "sine", gain: 0.18 }); // C5
    this.tone(659.25, 0.09, 0.14, { type: "sine", gain: 0.18 }); // E5
    this.tone(783.99, 0.18, 0.22, { type: "sine", gain: 0.18 }); // G5
  }

  /** Soft low buzz for an incorrect answer — not harsh or arcade-like. */
  incorrect() {
    if (!this.ready || this.throttled("incorrect", 300)) return;
    this.tone(160, 0, 0.28, { type: "sine", gain: 0.15, sweepTo: 110 });
  }

  /** Brief suspense swell right before the correct answer is revealed. */
  suspense() {
    if (!this.ready || this.throttled("suspense", 400)) return;
    this.tone(220, 0, 0.5, { type: "triangle", gain: 0.08, sweepTo: 440 });
    this.noiseBurst(0, 0.5, { gain: 0.05, lowpass: 900 });
  }

  /** Celebratory flourish when the whole quiz finishes. */
  gameOverFanfare() {
    if (!this.ready || this.throttled("fanfare", 800)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      this.tone(f, i * 0.11, 0.22, { type: "triangle", gain: 0.17 });
    });
  }

  /** Short celebration accent for the podium reveal. */
  podiumCelebrate() {
    if (!this.ready || this.throttled("podium", 800)) return;
    this.tone(784, 0, 0.12, { type: "sine", gain: 0.16 });
    this.tone(988, 0.1, 0.12, { type: "sine", gain: 0.16 });
    this.tone(1318.5, 0.2, 0.28, { type: "sine", gain: 0.18 });
    this.noiseBurst(0.02, 0.3, { gain: 0.04, lowpass: 3000 });
  }
}

export const soundEngine = new SoundEngine();
