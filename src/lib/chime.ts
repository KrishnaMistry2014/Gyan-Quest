/**
 * Generates an audible mindful chime sound using the browser Web Audio API.
 * Synthesizes a soothing bell with natural harmonic decay.
 */
export function playMindfulChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Harmonically tuned frequencies reminiscent of a temple singing bowl
    const harmonics = [
      { freq: 528, gain: 0.65, decay: 4.2 },
      { freq: 1056, gain: 0.35, decay: 3.4 },
      { freq: 1584, gain: 0.2, decay: 2.6 },
      { freq: 2112, gain: 0.1, decay: 1.8 },
    ];

    harmonics.forEach(({ freq, gain: peakGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  } catch (err) {
    console.debug('Chime audio notice:', err);
  }
}

/**
 * Plays a VERY MUCH AUDIBLE multi-strike warning chime at FULL VOLUME (1.0 gain)
 * when a student leaves fullscreen or switches tabs during Focus Mode.
 */
export function playLoudFocusWarningChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // 3 loud, piercing, unmistakable bell/alert strikes at full volume
    const strikeOffsets = [0, 0.38, 0.76];
    const tones = [
      { freq: 880, type: 'triangle' as OscillatorType, gain: 1.0, duration: 0.34 },
      { freq: 1318.5, type: 'sine' as OscillatorType, gain: 0.95, duration: 0.34 },
      { freq: 1760, type: 'square' as OscillatorType, gain: 0.6, duration: 0.3 },
      { freq: 2637, type: 'sine' as OscillatorType, gain: 0.75, duration: 0.3 },
    ];

    strikeOffsets.forEach((offset) => {
      const startTime = now + offset;
      tones.forEach(({ freq, type, gain, duration }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      });
    });
  } catch (err) {
    console.debug('Loud focus warning chime notice:', err);
  }
}

/**
 * Requests browser fullscreen on the document element.
 */
export async function requestAppFullscreen(): Promise<boolean> {
  try {
    const el = document.documentElement as any;
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      return true;
    }
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.debug('Fullscreen request notice:', err);
  }
  return false;
}

/**
 * Exits browser fullscreen if currently active.
 */
export async function exitAppFullscreen(): Promise<void> {
  try {
    const doc = document as any;
    if (document.fullscreenElement || doc.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    }
  } catch (_) {}
}

