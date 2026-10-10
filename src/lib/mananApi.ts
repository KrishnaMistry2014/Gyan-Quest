import { SavedChapter } from './chapters';

/**
 * Endpoint for the Gyan Quest Image Generation Service deployed on Render.
 * Calls the Hugging Face Gradio Space (Turbo model, 8 steps, 1024x1024) securely.
 */
export const GYANQUEST_IMAGE_API_URL = 'https://gyanquest-image-api.onrender.com/generate';
export const GRADIO_SPACE_INFO_URL = 'https://krea-krea-2.hf.space/gradio_api/info';
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
 * Cleans chapter title and summary text to extract core educational subject matter
 * strictly from the uploaded chapter context.
 */
function extractCleanSubject(chapter?: SavedChapter | null): { topic: string; sceneContext: string } {
  if (!chapter) {
    return {
      topic: 'Chapter Concept Study',
      sceneContext: 'a scenic educational landscape illustrating the core study concepts',
    };
  }

  // Clean title: remove prefixes like "Vidya:", "Chapter 1:", "Class 10:", file extensions
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

  // Extract key concept sentences from the summary (first ~400 chars, stripping markdown)
  const summarySnippet = (chapter.summary || '')
    .replace(/^#+.*$/gm, '')
    .replace(/[\*`_>#-]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);

  const combinedText = `${cleanTitle} ${summarySnippet}`.toLowerCase();

  let sceneContext = '';
  // Check for ancient Indian Gurukul hermitage context
  if (
    combinedText.includes('gurukul') ||
    combinedText.includes('ashram') ||
    combinedText.includes('ancient india') ||
    combinedText.includes('vedic') ||
    combinedText.includes('guru') ||
    combinedText.includes('shishya')
  ) {
    sceneContext =
      'a serene scenic view of an ancient Indian Gurukul hermitage: a revered guru and young students seated under a majestic banyan tree in a peaceful forest hermitage, simple thatched cottages (kutir) in a tranquil clearing by a flowing river';
  } else if (
    combinedText.includes('cell') ||
    combinedText.includes('microscope') ||
    combinedText.includes('bacteria') ||
    combinedText.includes('dna') ||
    combinedText.includes('nucleus')
  ) {
    sceneContext =
      'a vivid, colorful microscopic landscape inside a biological cell showing glowing mitochondria and nucleus in organic detail';
  } else if (
    combinedText.includes('planet') ||
    combinedText.includes('solar system') ||
    combinedText.includes('space') ||
    combinedText.includes('galaxy') ||
    combinedText.includes('orbit')
  ) {
    sceneContext =
      'a panoramic astronomical view of orbiting celestial bodies and glowing colorful nebulae across space';
  } else if (
    combinedText.includes('plant') ||
    combinedText.includes('photosynthesis') ||
    combinedText.includes('leaf') ||
    combinedText.includes('chlorophyll') ||
    combinedText.includes('botany')
  ) {
    sceneContext =
      'a lush scenic botanical landscape with golden morning sunlight illuminating vibrant green plant leaves and nature';
  } else if (
    combinedText.includes('history') ||
    combinedText.includes('palace') ||
    combinedText.includes('empire') ||
    combinedText.includes('dynasty') ||
    combinedText.includes('monument')
  ) {
    sceneContext =
      `a majestic historical landscape depicting ${cleanTitle || 'the historical era'} with classical architecture, courtyards, and gardens`;
  } else if (
    combinedText.includes('water') ||
    combinedText.includes('ocean') ||
    combinedText.includes('river') ||
    combinedText.includes('marine')
  ) {
    sceneContext =
      'a breathtaking scenic aquatic landscape with flowing crystal clear water and vibrant natural surroundings';
  } else {
    // For any other subject uploaded by student, faithfully depict the specific title and concepts
    sceneContext = `an educational scenic view representing ${cleanTitle || 'the uploaded study concepts'}`;
  }

  return {
    topic: cleanTitle || 'Educational Study',
    sceneContext,
  };
}

/**
 * Builds an effective, student-friendly prompt tailored strictly to the uploaded chapter.
 * Explicitly instructs the AI to generate a purely pictorial composition WITHOUT any text,
 * labels, words, or typography.
 */
export function buildEducationalImagePrompt(chapter?: SavedChapter | null): string {
  const { topic, sceneContext } = extractCleanSubject(chapter);

  return (
    `A vivid, beautiful scenic educational illustration depicting ${sceneContext}, representing "${topic}". ` +
    `Rich scenic visual storytelling, colorful atmospheric digital painting, harmonious daylight illumination. ` +
    `Completely text-free, strictly no text, no words, no letters, no numbers, no labels, no typography, no captions, no watermarks, no speech bubbles.`
  );
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
 * Calls the Render image-generation endpoint and preloads the resulting image.
 * Never masks errors with predefined placeholder images: always returns clear error codes
 * and transparent failure diagnostics when the backend fails.
 */
export async function generateChapterImage(
  prompt: string,
  signal?: AbortSignal,
  chapter?: SavedChapter | null
): Promise<ChapterImageResult> {
  if (!prompt || typeof prompt !== 'string') {
    throw new MananImageError({
      statusCode: 400,
      errorCode: 'ERR_EMPTY_PROMPT',
      message: 'A valid educational image prompt is required.',
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: '',
    });
  }

  let response: Response;
  try {
    response = await fetch(GYANQUEST_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    throw new MananImageError({
      statusCode: 0,
      errorCode: 'ERR_NETWORK_DISCONNECTED',
      message:
        'Network error: Failed to reach the image generation backend (https://gyanquest-image-api.onrender.com). Please check your internet connection.',
      backendMessage: err?.message || 'Network fetch failure',
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: prompt,
    });
  }

  // Handle non-2xx responses transparently with clear status and error code
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text().catch(() => '');
    }

    const cleanErrorMsg = errorDetail || `HTTP status ${response.status} (${response.statusText || 'Error'})`;

    throw new MananImageError({
      statusCode: response.status,
      errorCode: `HTTP_${response.status}_${response.status === 502 ? 'BAD_GATEWAY' : response.status === 500 ? 'INTERNAL_ERROR' : 'API_ERROR'}`,
      message: `Image API failed with status ${response.status}: "${cleanErrorMsg}"`,
      backendMessage: cleanErrorMsg,
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: prompt,
    });
  }

  // Handle 200 OK response
  let data: any;
  try {
    data = await response.json();
  } catch (err: any) {
    throw new MananImageError({
      statusCode: 200,
      errorCode: 'ERR_INVALID_JSON',
      message: 'Image API returned an unreadable response format.',
      backendMessage: err?.message || 'JSON parse error',
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: prompt,
    });
  }

  if (!data || typeof data.imageUrl !== 'string' || !data.imageUrl.startsWith('http')) {
    throw new MananImageError({
      statusCode: 200,
      errorCode: 'ERR_MISSING_IMAGE_URL',
      message: 'Image API completed successfully but returned no valid imageUrl field.',
      backendMessage: JSON.stringify(data),
      endpoint: GYANQUEST_IMAGE_API_URL,
      promptSent: prompt,
    });
  }

  const generatedUrl = data.imageUrl.trim();
  await preloadImage(generatedUrl);

  return {
    imageUrl: generatedUrl,
    isAiGenerated: true,
  };
}
