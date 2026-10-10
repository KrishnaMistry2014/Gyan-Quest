import { SavedChapter } from './chapters';

/**
 * Endpoint for the Gyan Quest Image Generation Service deployed on Render.
 * Calls the Hugging Face Gradio Space (Turbo model, 8 steps, 1024x1024) securely.
 */
export const GYANQUEST_IMAGE_API_URL = 'https://gyanquest-image-api.onrender.com/generate';

/**
 * Cleans chapter summary text to extract core educational keywords for prompt synthesis.
 */
function extractKeyConcepts(summary?: string): string {
  if (!summary || typeof summary !== 'string') return '';
  return summary
    .replace(/^#+.*$/gm, '') // Remove markdown headers
    .replace(/\*+/g, '')     // Remove bold/italics
    .replace(/[`_]/g, '')    // Remove formatting
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);          // Focus on first ~240 characters of core concepts
}

/**
 * Builds an effective, student-friendly prompt tailored to the chapter topic.
 * Prompts strictly avoid textbook scans, copied pages, or copyright reproductions,
 * producing vibrant pedagogical vector illustrations for jigsaw puzzle contemplation.
 */
export function buildEducationalImagePrompt(chapter?: SavedChapter | null): string {
  const title = (chapter?.title || '').trim().replace(/^Vidya:\s*/i, '');
  const keyConcepts = extractKeyConcepts(chapter?.summary);

  if (!title && !keyConcepts) {
    return 'Vivid, student-friendly educational illustration of scientific exploration and cosmic wonder with planets, plants, and atoms, colorful pedagogical art style';
  }

  const topicName = title || 'Academic Science and Discovery';
  const conceptSnippet = keyConcepts ? `, highlighting: ${keyConcepts}` : '';

  return `Inspiring student-friendly educational illustration representing "${topicName}"${conceptSnippet}. Pedagogical digital art, colorful and engaging visual breakdown, clean composition, warm lighting, suitable for a learning reflection puzzle.`;
}

export interface GenerateImageResult {
  imageUrl: string;
}

/**
 * Preloads an image URL into browser cache to guarantee it renders instantly without blank flickers.
 */
export function preloadImage(url: string, timeoutMs = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Image download timed out while loading into the puzzle board.'));
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
        reject(new Error('Unable to render the generated educational image.'));
      }
    };

    img.src = url;
  });
}

/**
 * Calls the Render image-generation endpoint and preloads the resulting image.
 * Handles timeouts, network failures, and validates responses.
 */
export async function generateChapterImage(
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A valid educational image prompt is required.');
  }

  // 1. Send generation request to the Render service
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
    throw new Error(
      'Unable to connect to the image generation service. Please check your internet connection or try again.'
    );
  }

  // 2. Validate HTTP response
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Image generation server responded with status ${response.status}. ${errText || 'Please try again in a moment.'}`
    );
  }

  // 3. Parse and validate JSON structure
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('The image generation service returned an invalid response format.');
  }

  if (!data || typeof data.imageUrl !== 'string' || !data.imageUrl.startsWith('http')) {
    throw new Error('No valid image URL was received from the image generation service.');
  }

  const generatedUrl = data.imageUrl.trim();

  // 4. Preload and decode the image before passing it to the puzzle
  await preloadImage(generatedUrl);

  return generatedUrl;
}
