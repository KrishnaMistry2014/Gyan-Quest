import fs from 'fs';
import path from 'path';

function createSereneAudio(durationSeconds = 120, baseFreq = 136.1) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const pcm = Buffer.alloc(dataSize);

  // Om / Meditation resonant frequency 136.1 Hz + harmonics (Tanpura tuning: Pa - Sa - Sa - Sa)
  const root = baseFreq; // C# / Cis
  const fifth = baseFreq * 1.5; // G#
  const octave = baseFreq * 2;
  const third = baseFreq * 1.25;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Pluck cycle every 4.0 seconds (mimicking 4-string Tanpura strum)
    const pluckTime = t % 4.0;
    const stringIdx = Math.floor(pluckTime / 1.0);
    const noteTime = pluckTime % 1.0;
    const decay = Math.exp(-noteTime * 2.2);

    let noteFreq = fifth;
    if (stringIdx === 1) noteFreq = octave;
    else if (stringIdx === 2) noteFreq = octave;
    else if (stringIdx === 3) noteFreq = root;

    // Resonant bell-like string with rich harmonics
    const sampleVal =
      0.35 * Math.sin(2 * Math.PI * noteFreq * t) * decay +
      0.20 * Math.sin(2 * Math.PI * noteFreq * 2 * t) * Math.pow(decay, 1.5) +
      0.12 * Math.sin(2 * Math.PI * noteFreq * 3 * t) * Math.pow(decay, 2.0) +
      0.08 * Math.sin(2 * Math.PI * noteFreq * 4 * t) * Math.pow(decay, 2.5) +
      // Continuous warm ambient drone bed
      0.15 * Math.sin(2 * Math.PI * root * t) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.15 * t)) +
      0.08 * Math.sin(2 * Math.PI * fifth * t) * (0.8 + 0.2 * Math.cos(2 * Math.PI * 0.12 * t));

    // Soft fade in & fade out
    let envelope = 1.0;
    if (t < 2.0) envelope = t / 2.0;
    else if (t > durationSeconds - 3.0) envelope = Math.max(0, (durationSeconds - t) / 3.0);

    const clamped = Math.max(-1.0, Math.min(1.0, sampleVal * envelope * 0.85));
    const int16 = Math.floor(clamped * 32767);
    pcm.writeInt16LE(int16, i * 2);
  }

  return Buffer.concat([header, pcm]);
}

const dir = path.resolve('public/assets/audio');
fs.mkdirSync(dir, { recursive: true });

const gitaBuf = createSereneAudio(90, 136.1); // Sacred Om frequency
fs.writeFileSync(path.join(dir, 'gita.wav'), gitaBuf);
console.log('Saved public/assets/audio/gita.wav', gitaBuf.length, 'bytes');

const ramayanaBuf = createSereneAudio(105, 144.0); // D note
fs.writeFileSync(path.join(dir, 'ramayana.wav'), ramayanaBuf);
console.log('Saved public/assets/audio/ramayana.wav', ramayanaBuf.length, 'bytes');

const mahabharataBuf = createSereneAudio(120, 128.0); // C note
fs.writeFileSync(path.join(dir, 'mahabharata.wav'), mahabharataBuf);
console.log('Saved public/assets/audio/mahabharata.wav', mahabharataBuf.length, 'bytes');
