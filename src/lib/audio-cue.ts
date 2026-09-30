"use client";

/**
 * Web Audio API synthesizer for study focus, distraction warnings, and milestone chimes.
 * Requires no external audio assets; zero latency; works offline.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch {
    return null;
  }
}

/**
 * Play a double-beep uplifting chime when a study chapter or goal is completed.
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Note 1: E6 (1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1318.5, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Note 2: B6 (1975.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1975.5, now + 0.14);
    gain2.gain.setValueAtTime(0.001, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.5);

    setTimeout(() => void ctx.close(), 700);
  } catch {
    // audio unavailable
  }
}

/**
 * Play an alert buzzer tone when a tab switch or distraction occurs.
 */
export function playDistractionWarning() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now); // Low A3 buzz
    osc.frequency.setValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    setTimeout(() => void ctx.close(), 600);
  } catch {
    // audio unavailable
  }
}

/**
 * Play a polite gentle ping for periodic attention checks.
 */
export function playAttentionPing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5 ping

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    setTimeout(() => void ctx.close(), 600);
  } catch {
    // audio unavailable
  }
}

/**
 * Continuous Web Audio ambient binaural focus drone.
 * Employs a 432Hz fundamental + 442Hz harmonic to create a soothing 10Hz Alpha focus wave.
 * 100% synthesized in real time via Web Audio API. Zero external audio assets.
 */
export class AmbientFocusDrone {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private isPlaying = false;

  public start(volume = 0.05) {
    if (this.isPlaying) return;
    try {
      this.ctx = getAudioContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.0001, now);
      this.gainNode.gain.exponentialRampToValueAtTime(volume, now + 1.2);

      // Binaural carrier 1: 432 Hz
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(432, now);

      // Binaural carrier 2: 442 Hz (10 Hz Alpha beat frequency)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sine";
      this.osc2.frequency.setValueAtTime(442, now);

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc1.start(now);
      this.osc2.start(now);
      this.isPlaying = true;
    } catch {
      // audio failed or permissions denied
    }
  }

  public stop() {
    if (!this.isPlaying || !this.gainNode || !this.ctx) {
      this.isPlaying = false;
      return;
    }
    try {
      const now = this.ctx.currentTime;
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      const activeCtx = this.ctx;
      const osc1 = this.osc1;
      const osc2 = this.osc2;
      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          void activeCtx?.close();
        } catch {
          // ignore
        }
      }, 700);
    } catch {
      // ignore
    } finally {
      this.isPlaying = false;
      this.ctx = null;
      this.gainNode = null;
      this.osc1 = null;
      this.osc2 = null;
    }
  }

  public active(): boolean {
    return this.isPlaying;
  }
}
