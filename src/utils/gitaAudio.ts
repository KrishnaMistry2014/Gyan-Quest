/**
 * Pure Web Audio API Synthesizer for Vedic Ambience and Gameplay Chimes
 * Zero external audio assets required; fully self-contained and offline-ready.
 */
class VedicSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playKeyType() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      // Warm woody xylophone tap
      const freq = 440 + Math.random() * 40;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback silent
    }
  }

  public playBackspace() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Silent catch
    }
  }

  public playSubmitAttempt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      // Gentle brass singing bowl harmonic
      const now = this.ctx.currentTime;
      const frequencies = [330, 495]; // E4 and B4 harmonic fifth
      frequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.07 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch {
      // Silent catch
    }
  }

  public playVictoryChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      // Majestic Vedic Tanpura chord (Sa - Pa - Sa' - Ga') in Indian Classical notes:
      // C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25)
      const now = this.ctx.currentTime;
      const notes = [
        { f: 261.63, delay: 0 },
        { f: 329.63, delay: 0.12 },
        { f: 392.00, delay: 0.24 },
        { f: 523.25, delay: 0.38 },
        { f: 659.25, delay: 0.52 }
      ];
      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.delay);
        gain.gain.setValueAtTime(0.001, now + note.delay);
        gain.gain.linearRampToValueAtTime(0.12, now + note.delay + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + note.delay + 1.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + note.delay);
        osc.stop(now + note.delay + 1.6);
      });
    } catch {
      // Silent catch
    }
  }

  public playWordReveal() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      // Deep temple gong / resonant bell
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(196, now + 1.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Silent catch
    }
  }

  public playInvalidWord() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.15);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Silent catch
    }
  }
}

export const vedicAudio = new VedicSoundEngine();
