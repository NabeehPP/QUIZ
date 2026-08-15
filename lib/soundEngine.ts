"use client";

type OscType = "sine" | "triangle" | "square" | "sawtooth";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private musicSource: MediaElementAudioSourceNode | null = null;
  private musicResumeTimer: number | null = null;

  private _enabled = true;
  private musicPlaying = false;
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
    this.musicGain.gain.value = 0;

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

  // ====
  // BACKGROUND MUSIC
  // ====

  /**
   * Start the real quiz background track.
   *
   * The MP3 is routed through Web Audio so its volume can be
   * controlled independently and ducked during action sounds.
   *
   * File: public/audio/quiz-master.mp3
   */
  startMusic() {
    if (
      !this._enabled ||
      !this.ctx ||
      !this.musicGain ||
      this.musicPlaying
    ) {
      return;
    }

    if (!this.musicAudio) {
      this.musicAudio = new Audio("/audio/quiz-master.mp3");
      this.musicAudio.loop = true;
      this.musicAudio.preload = "auto";

      this.musicSource = this.ctx.createMediaElementSource(
        this.musicAudio
      );

      this.musicSource.connect(this.musicGain);
    }

    const now = this.ctx.currentTime;

    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(
      0.025,
      now,
      0.04
    );

    this.musicPlaying = true;

    this.musicAudio.play().catch(() => {
      this.musicPlaying = false;
    });
  }

  /**
   * Stop and reset the background track.
   */
  stopMusic() {
    if (this.musicResumeTimer !== null) {
      window.clearTimeout(this.musicResumeTimer);
      this.musicResumeTimer = null;
    }

    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }

    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;

      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(
        0,
        now,
        0.03
      );
    }

    this.musicPlaying = false;
  }

  /**
   * Duck background music while an important action sound plays.
   */
  private duckMusic() {
    if (
      !this.ctx ||
      !this.musicGain ||
      !this.musicPlaying
    ) {
      return;
    }

    const now = this.ctx.currentTime;

    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(
      0.004,
      now,
      0.015
    );

    if (this.musicResumeTimer !== null) {
      window.clearTimeout(this.musicResumeTimer);
    }

    this.musicResumeTimer = window.setTimeout(() => {
      if (
        this.ctx &&
        this.musicGain &&
        this.musicPlaying
      ) {
        const currentTime = this.ctx.currentTime;

        this.musicGain.gain.cancelScheduledValues(
          currentTime
        );

        this.musicGain.gain.setTargetAtTime(
          0.012,
          currentTime,
          0.12
        );
      }

      this.musicResumeTimer = null;
    }, 650);
  }

  // ====
  // UI SOUNDS
  // ====

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
        gain: 0.25,
      }
    );
  }

  /**
   * Short energetic quiz intro.
   */
  quizIntro() {
    if (
      !this.ready ||
      this.throttled("intro", 800)
    ) {
      return;
    }

    this.duckMusic();

    const notes = [392, 523.25, 659.25, 783.99, 1046.5];

    notes.forEach((frequency, index) => {
      this.tone(
        frequency,
        index * 0.10,
        index === notes.length - 1 ? 0.35 : 0.12,
        {
          type: index === notes.length - 1 ? "sine" : "triangle",
          gain: index === notes.length - 1 ? 0.27 : 0.20,
        }
      );
    });

    this.noiseBurst(0.42, 0.35, {
      gain: 0.045,
      lowpass: 4200,
    });
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

    this.tone(392, 0, 0.12, {
      type: "triangle",
      gain: 0.16,
      sweepTo: 523.25,
    });

    this.tone(659.25, 0.08, 0.13, {
      type: "triangle",
      gain: 0.19,
    });

    this.tone(1046.5, 0.16, 0.22, {
      type: "sine",
      gain: 0.17,
    });

    this.noiseBurst(0.14, 0.20, {
      gain: 0.018,
      lowpass: 4500,
    });
  }

  /**
   * Countdown tick.
   */
  countdownTick() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(880, 0, 0.075, {
      type: "square",
      gain: 0.16,
      sweepTo: 1046.5,
    });

    this.tone(1318.5, 0.035, 0.055, {
      type: "sine",
      gain: 0.09,
    });

    this.noiseBurst(0, 0.035, {
      gain: 0.018,
      lowpass: 5000,
    });
  }

  /**
   * Final countdown tick.
   */
  finalCountdownTick() {
    if (!this.ready) return;

    this.duckMusic();

    this.tone(1046.5, 0, 0.10, {
      type: "triangle",
      gain: 0.22,
      sweepTo: 1318.5,
    });

    this.tone(1568, 0.045, 0.09, {
      type: "sine",
      gain: 0.12,
    });

    this.noiseBurst(0, 0.055, {
      gain: 0.025,
      lowpass: 6000,
    });
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

    this.tone(440, 0, 0.11, {
      type: "square",
      gain: 0.16,
      sweepTo: 330,
    });

    this.tone(440, 0.13, 0.11, {
      type: "square",
      gain: 0.18,
      sweepTo: 330,
    });

    this.tone(220, 0.26, 0.14, {
      type: "triangle",
      gain: 0.12,
    });
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
      1318.5,
    ];

    notes.forEach((frequency, index) => {
      this.tone(
        frequency,
        index * 0.075,
        index >= 3 ? 0.28 : 0.13,
        {
          type: index >= 3 ? "sine" : "triangle",
          gain: index >= 3 ? 0.24 : 0.22,
        }
      );
    });

    this.noiseBurst(
      0.28,
      0.25,
      {
        gain: 0.035,
        lowpass: 4000,
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
      1318.5,
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
