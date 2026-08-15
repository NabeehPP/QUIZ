"use client";

type OscType = "sine" | "triangle" | "square" | "sawtooth";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private _enabled = true;
  private musicPlaying = false;
  private musicTimer: number | null = null;
  private musicStep = 0;

  private lastPlayedAt: Record<string, number> = {};

  get enabled() {
    return this._enabled;
  }

  /**
   * Enable / disable all sounds.
   */
  setEnabled(value: boolean) {
    this._enabled = value;

    if (!this.master || !this.ctx) return;

    const now = this.ctx.currentTime;

    this.master.gain.cancelScheduledValues(now);

    this.master.gain.setTargetAtTime(
      value ? 0.82 : 0,
      now,
      0.04
    );

    if (!value) {
      this.stopMusic();
    } else if (!this.musicPlaying) {
      this.startMusic();
    }
  }

  /**
   * Must be called from a user interaction such as:
   * Create Game / Start Quiz / Sound button.
   */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      if (!this.musicPlaying && this._enabled) {
        this.startMusic();
      }

      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.master = this.ctx.createGain();

    this.master.gain.value = this._enabled ? 0.82 : 0;

    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();

    // Keep music present but safely underneath the quiz sounds.
    this.musicGain.gain.value = 0.11;

    this.musicGain.connect(this.master);

    if (this._enabled) {
      this.startMusic();
    }
  }

  /**
   * Whether the sound engine is ready.
   */
  private get ready() {
    return !!(
      this.ctx &&
      this.master &&
      this._enabled
    );
  }

  /**
   * Prevent repeated sounds from stacking.
   */
  private throttled(id: string, minGapMs: number) {
    const now = performance.now();

    const last = this.lastPlayedAt[id] ?? 0;

    if (now - last < minGapMs) {
      return true;
    }

    this.lastPlayedAt[id] = now;

    return false;
  }

  /**
   * Create a musical tone.
   */
  private tone(
    freq: number,
    startOffset: number,
    duration: number,
   opts: {
  type?: OscType;
  gain?: number;
  sweepTo?: number;
  destination?: GainNode;
} = {}
  ) {
    if (!this.ctx || !this.master) return;

 const {
  type = "sine",
  gain = 0.2,
  sweepTo,
  destination = this.master,
} = opts;

    const ctx = this.ctx;

    const startTime =
      ctx.currentTime + startOffset;

    const oscillator =
      ctx.createOscillator();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      freq,
      startTime
    );

    if (sweepTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        sweepTo,
        startTime + duration
      );
    }

    const envelope =
      ctx.createGain();

    envelope.gain.setValueAtTime(
      0.0001,
      startTime
    );

    envelope.gain.exponentialRampToValueAtTime(
      gain,
      startTime + Math.min(0.025, duration / 4)
    );

    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(envelope);
    envelope.connect(destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  }

  /**
   * Soft noise used for subtle transitions.
   */
  private noiseBurst(
    startOffset: number,
    duration: number,
    opts: {
      gain?: number;
      lowpass?: number;
      destination?: GainNode;
    } = {}
  ) {
    if (!this.ctx || !this.master) return;

    const {
      gain = 0.06,
      lowpass = 1500,
      destination = this.master,
    } = opts;

    const ctx = this.ctx;

    const startTime =
      ctx.currentTime + startOffset;

    const sampleCount =
      Math.floor(ctx.sampleRate * duration);

    const buffer =
      ctx.createBuffer(
        1,
        sampleCount,
        ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i++) {
      const fade =
        1 - i / sampleCount;

      data[i] =
        (Math.random() * 2 - 1) *
        fade;
    }

    const source =
      ctx.createBufferSource();

    source.buffer = buffer;

    const filter =
      ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = lowpass;

    const envelope =
      ctx.createGain();

    envelope.gain.setValueAtTime(
      gain,
      startTime
    );

    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);

    source.start(startTime);
    source.stop(startTime + duration + 0.03);
  }

  // ============================================================
  // BACKGROUND MUSIC
  // ============================================================

  /**
   * Light game-show background music.
   *
   * It uses a simple four-chord progression with a soft bass pulse
   * and a small arpeggio. It is designed to stay underneath speech
   * and quiz effects rather than dominate them.
   */
  startMusic() {
    if (
      !this.ctx ||
      !this.musicGain ||
      !this._enabled ||
      this.musicPlaying
    ) {
      return;
    }

    this.musicPlaying = true;
    this.musicStep = 0;

    // About 107 BPM.
    const interval = 560;

    this.playMusicStep();

    this.musicTimer = window.setInterval(() => {
      this.playMusicStep();
    }, interval);
  }

  /**
   * Stop the background music loop.
   */
  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    this.musicPlaying = false;
  }

  /**
   * Lower the music while an important UI sound is playing.
   */
  private duckMusic() {
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;

    this.musicGain.gain.cancelScheduledValues(now);

    this.musicGain.gain.setTargetAtTime(
      0.025,
      now,
      0.025
    );

    this.musicGain.gain.setTargetAtTime(
      0.11,
      now + 0.45,
      0.18
    );
  }

  /**
   * Four-chord game-show progression:
   * C → G → Am → F
   *
   * Each step has:
   *   1. soft chord
   *   2. low bass note
   *   3. tiny high arpeggio accent
   */
  private playMusicStep() {
    if (
      !this.ctx ||
      !this.musicGain ||
      !this._enabled
    ) {
      return;
    }

    const chords = [
      [261.63, 329.63, 392.0],   // C major
      [196.0, 246.94, 392.0],    // G major
      [220.0, 261.63, 329.63],   // A minor
      [174.61, 220.0, 349.23],   // F major
    ];

    const bassNotes = [
      130.81, // C3
      98.0,   // G2
      110.0,  // A2
      87.31,  // F2
    ];

    const chord = chords[this.musicStep % chords.length];
    const bass = bassNotes[this.musicStep % bassNotes.length];

    // Soft chord bed.
    chord.forEach((frequency, index) => {
      this.tone(
        frequency,
        index * 0.035,
        0.48,
        {
          type: "triangle",
          gain: 0.022,
          destination: this.musicGain!,
        }
      );
    });

    // Gentle bass pulse.
    this.tone(
      bass,
      0,
      0.22,
      {
        type: "sine",
        gain: 0.035,
        destination: this.musicGain,
      }
    );

    // Small sparkle every second step.
    if (this.musicStep % 2 === 1) {
      this.tone(
        chord[2] * 2,
        0.18,
        0.18,
        {
          type: "sine",
          gain: 0.018,
          destination: this.musicGain,
        }
      );

      this.tone(
        chord[1] * 2,
        0.34,
        0.12,
        {
          type: "sine",
          gain: 0.012,
          destination: this.musicGain,
        }
      );
    }

    this.musicStep++;
  }

  // ============================================================
  // UI SOUNDS
  // ============================================================

  /**
   * Small bright button click.
   */
  click() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(
      900,
      0,
      0.045,
      {
        type: "sine",
        gain: 0.16,
      }
    );
  }

  /**
   * Team joins the lobby.
   */
  teamJoin() {
    if (
      !this.ready ||
      this.throttled("join", 150)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      659.25,
      0,
      0.12,
      {
        type: "triangle",
        gain: 0.22,
      }
    );

    this.tone(
      987.77,
      0.09,
      0.18,
      {
        type: "triangle",
        gain: 0.19,
      }
    );
  }

  /**
   * Question starts.
   */
  questionStart() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(
      523.25,
      0,
      0.1,
      {
        type: "triangle",
        gain: 0.18,
      }
    );

    this.tone(
      783.99,
      0.08,
      0.16,
      {
        type: "triangle",
        gain: 0.2,
      }
    );
  }

  /**
   * Countdown tick.
   */
  countdownTick() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(
      1046.5,
      0,
      0.07,
      {
        type: "sine",
        gain: 0.2,
      }
    );
  }

  /**
   * Final countdown tick.
   */
  finalCountdownTick() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(
      1318.5,
      0,
      0.08,
      {
        type: "triangle",
        gain: 0.24,
      }
    );
  }

  /**
   * Time almost over.
   */
  timeWarning() {
    if (
      !this.ready ||
      this.throttled("warning", 500)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      440,
      0,
      0.1,
      {
        type: "square",
        gain: 0.13,
      }
    );

    this.tone(
      440,
      0.13,
      0.1,
      {
        type: "square",
        gain: 0.13,
      }
    );
  }

  /**
   * Correct answer.
   *
   * Bright four-note celebration.
   */
  correct() {
    if (
      !this.ready ||
      this.throttled("correct", 300)
    ) {
      return;
    }

    this.duckMusic();

    const notes = [
      523.25,
      659.25,
      783.99,
      1046.5,
    ];

    notes.forEach((frequency, index) => {
      this.tone(
        frequency,
        index * 0.09,
        index === 3 ? 0.30 : 0.14,
        {
          type: index === 3 ? "sine" : "triangle",
          gain: index === 3 ? 0.25 : 0.23,
        }
      );
    });

    this.noiseBurst(
      0.28,
      0.25,
      {
        gain: 0.025,
        lowpass: 3200,
      }
    );
  }

  /**
   * Incorrect answer.
   *
   * Two-note game-show buzzer. Strong enough to hear clearly,
   * but short enough not to become annoying.
   */
  incorrect() {
    if (
      !this.ready ||
      this.throttled("incorrect", 300)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      260,
      0,
      0.16,
      {
        type: "square",
        gain: 0.28,
        sweepTo: 150,
      }
    );

    this.tone(
      180,
      0.12,
      0.22,
      {
        type: "square",
        gain: 0.30,
        sweepTo: 105,
      }
    );
  }

  /**
   * Suspense before answer reveal.
   */
  suspense() {
    if (
      !this.ready ||
      this.throttled("suspense", 400)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      196,
      0,
      0.45,
      {
        type: "triangle",
        gain: 0.1,
        sweepTo: 392,
      }
    );

    this.noiseBurst(
      0,
      0.45,
      {
        gain: 0.035,
        lowpass: 1000,
      }
    );
  }

  /**
   * Time is up.
   *
   * Clear descending buzzer so the end of the question is obvious.
   */
  timeUp() {
    if (
      !this.ready ||
      this.throttled("timeup", 500)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      392,
      0,
      0.12,
      {
        type: "square",
        gain: 0.20,
        sweepTo: 300,
      }
    );

    this.tone(
      262,
      0.12,
      0.18,
      {
        type: "square",
        gain: 0.22,
        sweepTo: 180,
      }
    );

    this.tone(
      175,
      0.27,
      0.24,
      {
        type: "square",
        gain: 0.24,
        sweepTo: 120,
      }
    );
  }

  /**
   * Quiz finished.
   */
  gameOverFanfare() {
    if (
      !this.ready ||
      this.throttled("fanfare", 800)
    ) {
      return;
    }

    this.stopMusic();

    const notes = [
      523.25,
      659.25,
      783.99,
      1046.5,
    ];

    notes.forEach((frequency, index) => {
      this.tone(
        frequency,
        index * 0.11,
        0.22,
        {
          type: "triangle",
          gain: 0.25,
        }
      );
    });

    this.noiseBurst(
      0.3,
      0.35,
      {
        gain: 0.05,
        lowpass: 3500,
      }
    );
  }

  /**
   * Podium celebration.
   */
  podiumCelebrate() {
    if (
      !this.ready ||
      this.throttled("podium", 800)
    ) {
      return;
    }

    this.stopMusic();

    this.tone(
      784,
      0,
      0.13,
      {
        type: "triangle",
        gain: 0.23,
      }
    );

    this.tone(
      988,
      0.1,
      0.13,
      {
        type: "triangle",
        gain: 0.23,
      }
    );

    this.tone(
      1318.5,
      0.2,
      0.3,
      {
        type: "sine",
        gain: 0.25,
      }
    );

    this.noiseBurst(
      0.02,
      0.3,
      {
        gain: 0.055,
        lowpass: 3500,
      }
    );
  }
}

export const soundEngine =
  new SoundEngine();