/**
 * Pure Web Audio API Synthesizer for Vedic Ambience and Gameplay Chimes
 * Zero external audio assets required; fully self-contained and offline-ready.
 * Dynamically aligns with Surya (Light / Radiant Day) and Chandra (Dark / Serene Night) modes.
 */
export type VedicThemeMode = 'surya' | 'chandra';

class VedicSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public get muted(): boolean {
    return this.isMuted;
  }
  public set muted(val: boolean) {
    this.isMuted = val;
  }
  public themeMode: VedicThemeMode = 'surya';

  // Ambient drone state
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneOsc3: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  public isDronePlaying: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Set theme alignment to Surya (Solar / Daylight) or Chandra (Lunar / Night)
   */
  public setTheme(mode: VedicThemeMode | boolean) {
    if (typeof mode === 'boolean') {
      this.themeMode = mode ? 'chandra' : 'surya';
    } else {
      this.themeMode = mode;
    }

    // If drone is active, smoothly modulate pitch and filter for the new celestial theme
    if (this.isDronePlaying && this.ctx && this.droneOsc1 && this.droneOsc2 && this.droneOsc3 && this.droneFilter) {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      const root = isChandra ? 110 : 138.59; // Chandra A2 (110Hz) vs Surya C#3 (138.59Hz)
      const fifth = isChandra ? 165 : 207.65; // Chandra E3 vs Surya G#3
      const oct = isChandra ? 220 : 277.18; // Chandra A3 vs Surya C#4

      this.droneOsc1.frequency.exponentialRampToValueAtTime(root, now + 1.2);
      this.droneOsc2.frequency.exponentialRampToValueAtTime(fifth, now + 1.2);
      this.droneOsc3.frequency.exponentialRampToValueAtTime(oct, now + 1.2);
      this.droneFilter.frequency.exponentialRampToValueAtTime(isChandra ? 320 : 540, now + 1.2);
    }
  }

  /**
   * Key typing tap - Crisper solar woodblock in Surya, softer nocturnal marimba in Chandra
   */
  public playKeyType() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isChandra ? 'sine' : 'triangle';

      const baseFreq = isChandra ? 320 : 520;
      const freq = baseFreq + Math.random() * (isChandra ? 20 : 35);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, this.ctx.currentTime + 0.08);

      const maxGain = isChandra ? 0.045 : 0.06;
      gain.gain.setValueAtTime(maxGain, this.ctx.currentTime);
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
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const startFreq = isChandra ? 220 : 290;
      const endFreq = isChandra ? 140 : 180;
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Silent catch
    }
  }

  /**
   * Submit attempt chime - Radiant brass bowl for Surya, deep calming Tibetan bowl for Chandra
   */
  public playSubmitAttempt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';

      // Harmonic interval: Surya is bright E4 + B4 (330Hz, 495Hz), Chandra is deeper calming A3 + E4 (220Hz, 330Hz)
      const frequencies = isChandra ? [220, 330] : [330, 495];
      const duration = isChandra ? 0.8 : 0.6;

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime((isChandra ? 0.05 : 0.07) / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + duration);
      });
    } catch {
      // Silent catch
    }
  }

  /**
   * Victory Chime - Solar Raag Bilawal/Bhupali chords in Surya, tranquil evening Raag Yaman in Chandra
   */
  public playVictoryChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';

      // Surya: Radiant Tanpura Sa-Ga-Pa-Sa' (C4: 261.63, E4: 329.63, G4: 392, C5: 523.25, E5: 659.25)
      // Chandra: Tranquil Night Yaman Sa-Ga-Pa-Ni-Sa' (A3: 220, C#4: 277.18, E4: 329.63, G#4: 415.30, A4: 440)
      const notes = isChandra
        ? [
            { f: 220.00, delay: 0 },
            { f: 277.18, delay: 0.14 },
            { f: 329.63, delay: 0.28 },
            { f: 415.30, delay: 0.44 },
            { f: 440.00, delay: 0.60 }
          ]
        : [
            { f: 261.63, delay: 0 },
            { f: 329.63, delay: 0.12 },
            { f: 392.00, delay: 0.24 },
            { f: 523.25, delay: 0.38 },
            { f: 659.25, delay: 0.52 }
          ];

      const sustain = isChandra ? 2.2 : 1.7;

      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.delay);
        gain.gain.setValueAtTime(0.001, now + note.delay);
        gain.gain.linearRampToValueAtTime(isChandra ? 0.09 : 0.12, now + note.delay + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + note.delay + sustain);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + note.delay);
        osc.stop(now + note.delay + sustain);
      });
    } catch {
      // Silent catch
    }
  }

  /**
   * Resonant Temple Bell / Gong chime
   */
  public playTempleBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      const baseFreq = isChandra ? 180 : 260;
      const dropFreq = isChandra ? 160 : 230;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(dropFreq, now + 1.8);

      gain.gain.setValueAtTime(isChandra ? 0.10 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.8);
    } catch {
      // Silent catch
    }
  }

  public playWordReveal() {
    this.playTempleBell();
  }

  public playInvalidWord() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isChandra ? 150 : 180, now);
      osc.frequency.linearRampToValueAtTime(isChandra ? 110 : 140, now + 0.15);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Silent catch
    }
  }

  /**
   * Sound when picking up a jigsaw puzzle piece
   */
  public playPiecePick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isChandra ? 440 : 587.33, now); // A4 / D5
      osc.frequency.exponentialRampToValueAtTime(isChandra ? 554.37 : 739.99, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Silent catch
    }
  }

  /**
   * Crisp celebratory chime when a jigsaw piece snaps into its exact slot (+5 XP)
   */
  public playPieceSnap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      // Dual resonant frequencies (harmonic fifth)
      const freqs = isChandra ? [523.25, 783.99] : [659.25, 987.77]; // C5+G5 or E5+B5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.025);
        gain.gain.setValueAtTime(0.001, now + idx * 0.025);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + idx * 0.025 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.025);
        osc.stop(now + 0.45);
      });
    } catch {
      // Silent catch
    }
  }

  /**
   * Gentle slide/bounce back sound when dropped in wrong slot or outside board
   */
  public playPieceReturn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isChandra ? 260 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(isChandra ? 180 : 210, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Silent catch
    }
  }

  /**
   * Continuous sacred Tanpura drone for deep study focus.
   * Modulates harmonically between Surya and Chandra.
   */
  public startDrone() {
    if (this.isDronePlaying) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const isChandra = this.themeMode === 'chandra';

      // Surya root = C#3 (138.59), Chandra root = A2 (110)
      const root = isChandra ? 110 : 138.59;
      const fifth = isChandra ? 165 : 207.65;
      const oct = isChandra ? 220 : 277.18;

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc3 = this.ctx.createOscillator();
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'sine';
      this.droneOsc3.type = 'sine';

      this.droneOsc1.frequency.setValueAtTime(root, now);
      this.droneOsc2.frequency.setValueAtTime(fifth, now);
      this.droneOsc3.frequency.setValueAtTime(oct, now);

      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(isChandra ? 320 : 540, now);

      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.linearRampToValueAtTime(this.isMuted ? 0.0001 : 0.035, now + 1.5);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneOsc3.connect(this.droneFilter);

      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.droneOsc3.start();

      this.isDronePlaying = true;
    } catch {
      this.isDronePlaying = false;
    }
  }

  public stopDrone() {
    if (!this.isDronePlaying || !this.ctx || !this.droneGain) return;
    try {
      const now = this.ctx.currentTime;
      this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      setTimeout(() => {
        try {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.droneOsc3?.stop();
          this.droneOsc1?.disconnect();
          this.droneOsc2?.disconnect();
          this.droneOsc3?.disconnect();
          this.droneGain?.disconnect();
          this.droneFilter?.disconnect();
        } catch (_) {}
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneOsc3 = null;
        this.droneGain = null;
        this.droneFilter = null;
        this.isDronePlaying = false;
      }, 850);
    } catch {
      this.isDronePlaying = false;
    }
  }

  public toggleDrone(): boolean {
    if (this.isDronePlaying) {
      this.stopDrone();
      return false;
    } else {
      this.startDrone();
      return true;
    }
  }
}

export const vedicAudio = new VedicSoundEngine();
