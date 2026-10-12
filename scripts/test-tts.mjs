import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const ai = new GoogleGenAI();

const speechInstruction = `Speak in natural, contemporary Indian English as a warm, knowledgeable Indian teacher explaining a school textbook chapter to a student. Sound friendly, confident, patient, and genuinely interested in the subject. Use authentic Indian English pronunciation without exaggerating the accent.

Deliver the explanation with a moderate, conversational pace and natural variations in pitch, rhythm, and emphasis. Give important facts and key concepts a little extra emphasis so they stand out and are easier to remember. Use natural pauses between ideas and slightly more energy when introducing an interesting discovery, example, or surprising fact.

Maintain a steady, engaging presence throughout the lesson. Be expressive enough to prevent the narration from sounding flat, but restrained enough that it remains comfortable to listen to for several minutes.

Avoid robotic rhythm, monotonous pitch, excessively uniform sentence endings, and mechanical textbook-reading delivery. Also avoid theatrical acting, booming declarations, exaggerated excitement, forced cheerfulness, dramatic suspense, artificial gravitas, and movie-trailer narration.

Do not sound like a newsreader, advertisement, meditation narrator, or fictional fantasy guru. Sound like a real, friendly Indian teacher who understands the subject and enjoys helping students learn.

Pronounce Indian names, Sanskrit terminology, and unfamiliar textbook vocabulary carefully. Keep the explanation clear and natural rather than forcing a particular pronunciation or accent where the text does not support it.`;

const auditionText = `Namaste students, and welcome to our exploration of astronomy in ancient and modern India. Today, let us study how Aryabhata observed the celestial sphere from Aryabhata Ashram in Kusumapura, modern-day Patna. In his treatise, he introduced the concept of Bhramana, which explains that the apparent movement of stars is actually caused by the Earth rotating on its own axis. Fascinatingly, this mathematical model accurately determined the length of a solar year centuries before telescopes were ever invented in Europe, demonstrating how disciplined observation and geometric calculation can unveil the deepest truths of the cosmos.`;

async function testSingle(model, voice) {
  const start = Date.now();
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${speechInstruction}\n\nPlease narrate this lesson:\n\n${auditionText}`,
              speechMetadata: {
                style: 'Warm, knowledgeable, natural contemporary Indian English male teacher with moderate pace and clear pronunciation of Sanskrit and Indian terms',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const duration = Date.now() - start;
    if (data) {
      fs.mkdirSync('auditions', { recursive: true });
      fs.writeFileSync(`auditions/${model}_${voice}.wav`, Buffer.from(data, 'base64'));
      return { success: true, model, voice, bytes: data.length, durationMs: duration };
    }
    return { success: false, model, voice, error: 'No audio data returned', durationMs: duration };
  } catch (err) {
    return { success: false, model, voice, error: err.message || String(err), durationMs: Date.now() - start };
  }
}

async function run() {
  const results = [];
  const models = [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
  ];

  console.log('--- Testing Models ---');
  for (const m of models) {
    console.log(`Testing ${m} with Puck...`);
    const r = await testSingle(m, 'Puck');
    console.log(JSON.stringify(r));
    results.push(r);
  }

  console.log('\n--- Auditioning Male Voices on gemini-3.8-flash-tts ---');
  const voices = ['Puck', 'Charon', 'Fenrir', 'Orpheus'];
  for (const v of voices) {
    if (v === 'Puck') continue; // already tested
    console.log(`Testing gemini-3.8-flash-tts with ${v}...`);
    const r = await testSingle('gemini-3.8-flash-tts', v);
    console.log(JSON.stringify(r));
    results.push(r);
  }

  fs.writeFileSync('audition-results.json', JSON.stringify(results, null, 2));
  console.log('\nAll done! Results saved to audition-results.json');
}

run();
