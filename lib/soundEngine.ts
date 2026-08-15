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
      value ? 0.75 : 0,
      now,
      0.03
    );
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

    this.master.gain.value = this._enabled ? 0.75 : 0;

    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();

    // Background music is intentionally quiet.
    this.musicGain.gain.value = 0.08;

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
   * Start a very light looping game-show background.
   *
   * This is intentionally subtle:
   * soft triangle waves + simple notes + tiny percussion.
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

    // Roughly 100 BPM.
    const interval = 600;

    this.playMusicStep();

    this.musicTimer = window.setInterval(
      () => {
        this.playMusicStep();
      },
      interval
    );
  }

  /**
   * Stop the background music.
   */
  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(
        this.musicTimer
      );

      this.musicTimer = null;
    }

    this.musicPlaying = false;
  }

  /**
   * Lower the music temporarily.
   */
  private duckMusic() {
    if (!this.ctx || !this.musicGain) return;

    const now =
      this.ctx.currentTime;

    this.musicGain.gain.cancelScheduledValues(now);

    this.musicGain.gain.setTargetAtTime(
      0.025,
      now,
      0.03
    );

    this.musicGain.gain.setTargetAtTime(
      0.08,
      now + 0.7,
      0.2
    );
  }

  /**
   * Play one step of the background sequence.
   *
   * Simple progression:
   *
   * C → G → Am → F
   */
  private playMusicStep() {
    if (
      !this.ctx ||
      !this.musicGain ||
      !this._enabled
    ) {
      return;
    }

    const progression = [
      261.63, // C4
      392.0,  // G4
      440.0,  // A4
      349.23, // F4
    ];

    const root =
      progression[
        this.musicStep % progression.length
      ];

    // Very soft main note.
    this.tone(
      root,
      0,
      0.45,
      {
        type: "triangle",
        gain: 0.035,
        destination: this.musicGain,
      }
    );

    // Small high accent every second step.
    if (this.musicStep % 2 === 1) {
      this.tone(
        root * 2,
        0.15,
        0.25,
        {
          type: "sine",
          gain: 0.018,
          destination: this.musicGain,
        }
      );
    }

    // Extremely subtle pulse.
    if (this.musicStep % 2 === 0) {
      this.tone(
        110,
        0,
        0.08,
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
   * Bright C → E → G → C celebration.
   */
  correct() {
    if (
      !this.ready ||
      this.throttled("correct", 300)
    ) {
      return;
    }

    this.duckMusic();

    this.tone(
      523.25,
      0,
      0.14,
      {
        type: "triangle",
        gain: 0.25,
      }
    );

    this.tone(
      659.25,
      0.09,
      0.14,
      {
        type: "triangle",
        gain: 0.25,
      }
    );

    this.tone(
      783.99,
      0.18,
      0.14,
      {
        type: "triangle",
        gain: 0.25,
      }
    );

    this.tone(
      1046.5,
      0.29,
      0.25,
      {
        type: "sine",
        gain: 0.22,
      }
    );
  }

  /**
   * Incorrect answer.
   *
   * Short and soft, not an aggressive buzzer.
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
      220,
      0,
      0.18,
      {
        type: "triangle",
        gain: 0.18,
        sweepTo: 150,
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
      330,
      0,
      0.12,
      {
        type: "square",
        gain: 0.15,
      }
    );

    this.tone(
      220,
      0.12,
      0.2,
      {
        type: "square",
        gain: 0.13,
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