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
      { freq: 528, gain: 0.35, decay: 4.2 },
      { freq: 1056, gain: 0.18, decay: 3.4 },
      { freq: 1584, gain: 0.09, decay: 2.6 },
      { freq: 2112, gain: 0.04, decay: 1.8 },
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
