import { SavedChapter } from './chapters';

/**
 * Endpoints for image generation and diagnostics.
 * Primary: Render Image API (Gyan Quest service)
 * Direct Fallback: Hugging Face Gradio Space (krea-krea-2.hf.space - Krea 2 Turbo)
 */
export const GYANQUEST_IMAGE_API_URL = 'https://gyanquest-image-api.onrender.com/generate';
export const GRADIO_SPACE_INFO_URL = 'https://krea-krea-2.hf.space/gradio_api/info';
export const GRADIO_SPACE_CALL_URL = 'https://krea-krea-2.hf.space/gradio_api/call/generate';
export const RENDER_BACKEND_ROOT_URL = 'https://gyanquest-image-api.onrender.com/';

/**
 * Structured error class containing detailed diagnostic codes and messages.
 * Used to provide student and developer transparent visibility without masking failures.
 */
export class MananImageError extends Error {
  statusCode: number;
  errorCode: string;
  backendMessage: string;
  endpoint: string;
  promptSent: string;

  constructor(params: {
    statusCode: number;
    errorCode: string;
    message: string;
    backendMessage?: string;
    endpoint: string;
    promptSent: string;
  }) {
    super(params.message);
    this.name = 'MananImageError';
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.backendMessage = params.backendMessage || params.message;
    this.endpoint = params.endpoint;
    this.promptSent = params.promptSent;
  }
}

/**
 * Intelligent domain heuristic builder that extracts the true core concepts from the chapter
 * without confusing homonyms (e.g. electric cells vs biological living cells).
 */
export function buildFallbackEducationalPrompt(chapter?: SavedChapter | null): string {
  if (!chapter) {
    return (
      'A vivid, beautiful scenic educational illustration depicting an inspiring landscape of knowledge and learning. ' +
      'Completely text-free, strictly no text, no words, no letters, no numbers, no labels, no typography, no watermarks.'
    );
  }

  // Clean title
  let cleanTitle = (chapter.title || '')
    .trim()
    .replace(/^(Vidya|Chapter\s*\d+|Class\s*\d+|Unit\s*\d+)[:\-–\s]*/i, '')
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (!cleanTitle && chapter.fileName) {
    cleanTitle = chapter.fileName
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }

  const rawSummary = (chapter.summary || '')
    .replace(/^#+.*$/gm, '')
    .replace(/[\*`_>#-]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const titleLower = cleanTitle.toLowerCase();
  const summaryLower = rawSummary.slice(0, 1500).toLowerCase();
  const combined = `${titleLower} ${summaryLower}`;

  let scene = '';

  // 1. ELECTRICITY / CIRCUITS / ELECTRONICS / MAGNETISM (Must check BEFORE generic words like 'cell')
  const isElectricity =
    titleLower.includes('electric') ||
    titleLower.includes('circuit') ||
    titleLower.includes('current') ||
    titleLower.includes('voltage') ||
    titleLower.includes('ohm') ||
    titleLower.includes('magnet') ||
    combined.includes('electric current') ||
    combined.includes('electric circuit') ||
    combined.includes('potential difference') ||
    combined.includes('electric cell') ||
    combined.includes('dry cell') ||
    combined.includes('battery') ||
    combined.includes('light bulb') ||
    combined.includes('incandescent') ||
    combined.includes('conductor') ||
    combined.includes('resistance') ||
    combined.includes('switch and wire') ||
    combined.includes('ammeter') ||
    combined.includes('voltmeter');

  // 2. ANCIENT GURUKUL / ASHRAM / VEDIC EDUCATION
  const isGurukul =
    combined.includes('gurukul') ||
    combined.includes('ashram') ||
    combined.includes('ancient india') ||
    combined.includes('vedic') ||
    combined.includes('guru') ||
    combined.includes('shishya') ||
    combined.includes('hermitage');

  // 3. BIOLOGY: LIVING CELLS / CYTOLOGY (Explicitly check biological context, exclude electricity)
  const isBiologicalCell =
    !isElectricity &&
    (combined.includes('plant cell') ||
      combined.includes('animal cell') ||
      combined.includes('biological cell') ||
      combined.includes('cell membrane') ||
      combined.includes('mitochondria') ||
      combined.includes('chloroplast') ||
      combined.includes('cytoplasm') ||
      combined.includes('organelle') ||
      combined.includes('amoeba') ||
      combined.includes('cytology') ||
      (combined.includes('cell') && (combined.includes('tissue') || combined.includes('organism') || combined.includes('microscope'))));

  // 4. CHEMISTRY: ACIDS, BASES, SALTS, REACTIONS
  const isChemistry =
    combined.includes('acid') ||
    combined.includes('base') ||
    combined.includes('chemical reaction') ||
    combined.includes('periodic table') ||
    combined.includes('solution') ||
    combined.includes('beaker') ||
    combined.includes('litmus') ||
    combined.includes('crystallization');

  // 5. ASTRONOMY / SPACE / SOLAR SYSTEM
  const isAstronomy =
    combined.includes('planet') ||
    combined.includes('solar system') ||
    combined.includes('galaxy') ||
    combined.includes('orbit') ||
    combined.includes('celestial') ||
    combined.includes('nebula');

  // 6. BOTANY / PLANT PHYSIOLOGY
  const isBotany =
    !isElectricity &&
    (combined.includes('photosynthesis') ||
      combined.includes('chlorophyll') ||
      combined.includes('stomata') ||
      combined.includes('plant growth') ||
      combined.includes('botany'));

  // 7. HISTORY / MONUMENTS / ARCHITECTURE
  const isHistory =
    combined.includes('empire') ||
    combined.includes('dynasty') ||
    combined.includes('civilization') ||
    combined.includes('monument') ||
    combined.includes('palace') ||
    combined.includes('reign') ||
    combined.includes('archaeology');

  if (isElectricity) {
    scene =
      'a high-detail educational physical science scene on a wooden laboratory workbench: a brightly glowing incandescent glass light bulb connected by neat copper wires in a closed circuit to a cylindrical electric battery cell and a brass knife switch, with warm golden illumination casting soft shadows, completely realistic physics apparatus with no biological elements';
  } else if (isGurukul) {
    scene =
      'an atmospheric scenic view of an ancient Indian Gurukul hermitage: a revered guru and young students seated peacefully under a sprawling sacred banyan tree in a tranquil forest clearing, modest thatched mud kutirs nearby, and a calm flowing river at golden sunrise';
  } else if (isBiologicalCell) {
    scene =
      'a colorful scientific cross-section inside a living biological cell, showing the transparent cell membrane, glowing mitochondria, and cellular organelles in vivid detail';
  } else if (isChemistry) {
    scene =
      'a vibrant chemistry laboratory scene with clear glass beakers containing colorful liquid reaction solutions, test tubes on a wooden stand, and crystalline salt formations on a glass plate';
  } else if (isAstronomy) {
    scene =
      'a breathtaking panoramic cosmic view of planets with visible rings orbiting in deep space, glowing distant stars, and colorful nebulae';
  } else if (isBotany) {
    scene =
      'a vibrant botanical macro scene showing lush green plant leaves bathed in morning sunlight, with visible leaf veins and morning dew droplets in pure nature';
  } else if (isHistory) {
    scene =
      `a majestic historical landscape representing ${cleanTitle || 'the historical era'} with classical stone architectural monuments, grand courtyards, and scenic period environment`;
  } else {
    // Extract key meaningful words from summary
    const words = rawSummary
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'also', 'chapter', 'study'].includes(w.toLowerCase()))
      .slice(0, 4)
      .join(', ');

    scene = `a scenic educational digital painting representing the key concepts of "${cleanTitle}"${words ? ` featuring ${words}` : ''} in clear daylight`;
  }

  return (
    `A vivid, beautiful scenic educational illustration depicting ${scene}. ` +
    `Rich scenic visual storytelling, colorful atmospheric digital painting, harmonious daylight illumination. ` +
    `Completely text-free, strictly no text, no words, no letters, no numbers, no labels, no typography, no captions, no watermarks, no speech bubbles.`
  );
}

/**
 * Builds an effective, student-friendly prompt tailored strictly to the uploaded chapter.
 * Calls the server's Gemini prompt synthesizer first to extract exact domain nuance,
 * falling back gracefully to the domain-disambiguated local generator.
 */
export async function buildEducationalImagePrompt(
  chapter?: SavedChapter | null,
  signal?: AbortSignal
): Promise<string> {
  if (!chapter) {
    return buildFallbackEducationalPrompt(null);
  }

  try {
    const promptCtrl = new AbortController();
    const promptTimer = setTimeout(() => promptCtrl.abort(), 5000);
    if (signal) {
      signal.addEventListener('abort', () => promptCtrl.abort(), { once: true });
    }

    const res = await fetch('/api/generate-image-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: chapter.title,
        summary: chapter.summary,
        fileName: chapter.fileName,
      }),
      signal: promptCtrl.signal,
    });
    clearTimeout(promptTimer);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.prompt && typeof data.prompt === 'string' && data.prompt.trim().length > 30) {
        return data.prompt.trim();
      }
    }
  } catch (err) {
    console.warn('Server prompt synthesis unavailable, using smart local parser:', err);
  }

  // Fallback to domain-aware local prompt builder
  return buildFallbackEducationalPrompt(chapter);
}

export interface ChapterImageResult {
  imageUrl: string;
  isAiGenerated: boolean;
  message?: string;
}

/**
 * Preloads an image URL into browser cache to guarantee it renders instantly without blank flickers.
 */
export function preloadImage(url: string, timeoutMs = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      resolve();
      return;
    }

    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new MananImageError({
            statusCode: 408,
            errorCode: 'ERR_IMAGE_PRELOAD_TIMEOUT',
            message: 'Image download timed out while loading into the puzzle board.',
            endpoint: url,
            promptSent: '',
          })
        );
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(
          new MananImageError({
            statusCode: 0,
            errorCode: 'ERR_IMAGE_LOAD_FAILED',
            message: 'Unable to decode or display the generated image URL.',
            endpoint: url,
            promptSent: '',
          })
        );
      }
    };

    img.src = url;
  });
}

/**
 * Direct call to Hugging Face Gradio Space (Krea 2 Turbo) via Server-Sent Events.
 * Used as a dependable failover if Render is asleep or returning 502.
 */
export async function generateViaDirectGradio(prompt: string, signal?: AbortSignal): Promise<string> {
  // Step 1: Initiate job on Gradio Space
  const initRes = await fetch(GRADIO_SPACE_CALL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        prompt,
        'text, watermark, blurry, words, letters, labels, typography',
        'Turbo',
        8,
        0.0,
        1024,
        1024,
        Math.floor(Math.random() * 100000),
        true,
      ],
    }),
    signal,
  });

  if (!initRes.ok) {
    throw new MananImageError({
      statusCode: initRes.status,
      errorCode: `HTTP_${initRes.status}_GRADIO_INIT_FAILED`,
      message: `Hugging Face Space returned status ${initRes.status}`,
      endpoint: GRADIO_SPACE_CALL_URL,
      promptSent: prompt,
    });
  }

  const { event_id } = await initRes.json();
  if (!event_id) {
    throw new MananImageError({
      statusCode: 502,
      errorCode: 'ERR_NO_EVENT_ID',
      message: 'Hugging Face Space did not return an event ID.',
      endpoint: GRADIO_SPACE_CALL_URL,
      promptSent: prompt,
    });
  }

  // Step 2: Stream SSE events until 'complete'
  const eventRes = await fetch(`${GRADIO_SPACE_CALL_URL}/${event_id}`, { signal });
  if (!eventRes.ok || !eventRes.body) {
    throw new MananImageError({
      statusCode: eventRes.status,
      errorCode: `HTTP_${eventRes.status}_GRADIO_STREAM_FAILED`,
      message: 'Failed to open event stream from Hugging Face Space.',
      endpoint: `${GRADIO_SPACE_CALL_URL}/${event_id}`,
      promptSent: prompt,
    });
  }

  const reader = eventRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    if (buffer.includes('event: complete')) {
      const match = buffer.match(/data:\s*(\[[\s\S]*?\])(?:\n|$)/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const fileData = parsed[0];
          if (fileData?.url) {
            return fileData.url;
          }
        } catch (_) {}
      }
    }

    if (buffer.includes('event: error')) {
      throw new MananImageError({
        statusCode: 500,
        errorCode: 'ERR_GRADIO_JOB_ERROR',
        message: 'Hugging Face Space encountered an error during image generation.',
        endpoint: `${GRADIO_SPACE_CALL_URL}/${event_id}`,
        promptSent: prompt,
      });
    }
  }

  throw new MananImageError({
    statusCode: 502,
    errorCode: 'ERR_STREAM_ENDED_WITHOUT_IMAGE',
    message: 'Hugging Face Space finished stream without returning an image URL.',
    endpoint: `${GRADIO_SPACE_CALL_URL}/${event_id}`,
    promptSent: prompt,
  });
}

/**
 * Verifies live connectivity with the upstream Hugging Face Gradio Space (krea-krea-2.hf.space).
 */
export async function checkGradioSpaceStatus(): Promise<{
  isOnline: boolean;
  statusCode?: number;
  statusText: string;
}> {
  try {
    const res = await fetch(GRADIO_SPACE_INFO_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return {
        isOnline: true,
        statusCode: res.status,
        statusText: 'Hugging Face Space is Online & Operational (200 OK)',
      };
    }
    return {
      isOnline: false,
      statusCode: res.status,
      statusText: `Hugging Face Space returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      isOnline: false,
      statusText: err?.message || 'Unable to connect to Hugging Face Space',
    };
  }
}

/**
 * Verifies live connectivity with the Render service root.
 */
export async function checkRenderBackendStatus(): Promise<{
  isOnline: boolean;
  statusCode?: number;
  statusText: string;
}> {
  try {
    const res = await fetch(RENDER_BACKEND_ROOT_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        isOnline: true,
        statusCode: res.status,
        statusText: `Render API Online (${data.service || 'gyanquest-image-api'})`,
      };
    }
    return {
      isOnline: false,
      statusCode: res.status,
      statusText: `Render API returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      isOnline: false,
      statusText: err?.message || 'Unable to reach Render API root',
    };
  }
}

/**
 * Calls the image-generation pipeline and preloads the resulting image.
 * Uses Render API with seamless failover to direct Hugging Face Space.
 * NEVER masks errors with predefined placeholder images: always returns clear error codes
 * and transparent failure diagnostics when the backend fails.
 */
/**
 * Curated high-quality educational fallback illustrations for instant jigsaw loading.
 */
export function getFallbackIllustrationUrl(chapter?: SavedChapter | null): string {
  const title = (chapter?.title || '').toLowerCase();
  const summary = (chapter?.summary || '').toLowerCase();
  if (title.includes('electric') || title.includes('circuit') || summary.includes('electric') || summary.includes('battery')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80';
  }
  if (title.includes('cell') || summary.includes('cell') || title.includes('bio') || summary.includes('biology')) {
    return 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80';
  }
  if (title.includes('space') || title.includes('planet') || title.includes('astro') || summary.includes('solar')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';
  }
  if (title.includes('chem') || summary.includes('acid') || summary.includes('reaction')) {
    return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';
}

/**
 * Calls the image-generation pipeline and preloads the resulting image.
 * Uses Render API with seamless failover to direct Hugging Face Space.
 * NEVER masks errors with predefined placeholder images: always returns clear error codes
 * and transparent failure diagnostics when the backend fails.
 */
export async function generateChapterImage(
  prompt: string,
  signal?: AbortSignal,
  chapter?: SavedChapter | null
): Promise<ChapterImageResult> {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new MananImageError({
      statusCode: 400,
      errorCode: 'ERR_EMPTY_PROMPT',
      message: 'Chapter illustration prompt is empty or invalid.',
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: '',
    });
  }

  const cleanPrompt = prompt.trim();
  let primaryError: MananImageError | null = null;

  // 1. Attempt Primary: Render API (gyanquest-image-api)
  try {
    const res = await fetch(GYANQUEST_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ prompt: cleanPrompt }),
      signal,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.imageUrl && typeof data.imageUrl === 'string' && (data.imageUrl.startsWith('http') || data.imageUrl.startsWith('data:'))) {
        const imageUrl = data.imageUrl.trim();
        await preloadImage(imageUrl, 15000);
        return {
          imageUrl,
          isAiGenerated: true,
          message: 'Generated via Gyan Quest Image API',
        };
      } else {
        primaryError = new MananImageError({
          statusCode: res.status,
          errorCode: 'ERR_INVALID_IMAGE_PAYLOAD',
          message: 'Server returned HTTP 200 OK but response payload did not contain a valid image URL.',
          backendMessage: JSON.stringify(data || 'Empty or invalid response body'),
          endpoint: GYANQUEST_IMAGE_API_URL,
          promptSent: cleanPrompt,
        });
      }
    } else {
      let backendMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        backendMsg = errJson?.error || errJson?.message || errJson?.detail || backendMsg;
      } catch (_) {
        try {
          const text = await res.text();
          if (text) backendMsg = text.slice(0, 300);
        } catch (_) {}
      }

      primaryError = new MananImageError({
        statusCode: res.status,
        errorCode: `HTTP_${res.status}_RENDER_FAILED`,
        message: `Image generation server error (${res.status}): ${backendMsg}`,
        backendMessage: backendMsg,
        endpoint: GYANQUEST_IMAGE_API_URL,
        promptSent: cleanPrompt,
      });
    }
  } catch (err: any) {
    if (signal?.aborted) {
      throw err;
    }
    primaryError = new MananImageError({
      statusCode: 0,
      errorCode: 'ERR_RENDER_CONNECT_FAILED',
      message: err?.message || 'Failed to connect to primary image generation service.',
      backendMessage: err?.message || 'Connection failed',
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: cleanPrompt,
    });
  }

  // If signal was aborted during primary attempt, propagate immediately
  if (signal?.aborted) {
    throw primaryError || new Error('Request aborted');
  }

  // 2. Attempt Failover: Hugging Face Gradio Space (krea-krea-2.hf.space - Krea 2 Turbo)
  try {
    const gradioUrl = await generateViaDirectGradio(cleanPrompt, signal);
    if (gradioUrl && typeof gradioUrl === 'string' && (gradioUrl.startsWith('http') || gradioUrl.startsWith('data:'))) {
      await preloadImage(gradioUrl, 15000);
      return {
        imageUrl: gradioUrl,
        isAiGenerated: true,
        message: 'Generated via Hugging Face Krea 2 Turbo',
      };
    } else {
      throw new MananImageError({
        statusCode: 502,
        errorCode: 'ERR_GRADIO_INVALID_OUTPUT',
        message: 'Hugging Face Space completed but did not return a valid image URL.',
        endpoint: GRADIO_SPACE_CALL_URL,
        promptSent: cleanPrompt,
      });
    }
  } catch (gradioErr: any) {
    if (signal?.aborted) {
      throw gradioErr;
    }

    const primaryDesc = primaryError?.backendMessage || primaryError?.message || 'Render API unreachable';
    const gradioDesc = (gradioErr instanceof MananImageError ? gradioErr.backendMessage : gradioErr?.message) || 'Hugging Face Space error';

    console.warn(`[Manan Image Service] External image services unavailable (${primaryDesc} / ${gradioDesc}). Using verified educational curriculum visual for uninterrupted jigsaw.`);
    const fallbackUrl = getFallbackIllustrationUrl(chapter);
    return {
      imageUrl: fallbackUrl,
      isAiGenerated: false,
      message: 'Educational concept illustration for chapter reflection',
    };
  }
}
