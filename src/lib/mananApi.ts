import { SavedChapter } from './chapters';

/**
 * Endpoint for the Gyan Quest Image Generation Service deployed on Render.
 * Calls the Hugging Face Gradio Space (Turbo model, 8 steps, 1024x1024) securely.
 */
export const GYANQUEST_IMAGE_API_URL = 'https://gyanquest-image-api.onrender.com/generate';

/**
 * Cleans chapter title and summary text to extract core educational subject matter
 * suitable for generating a scenic, text-free visual illustration.
 */
function extractCleanSubject(chapter?: SavedChapter | null): { topic: string; sceneContext: string } {
  if (!chapter) {
    return {
      topic: 'Natural Science and Cosmic Exploration',
      sceneContext: 'a panoramic view of glowing planets, lush nature, and biological wonders',
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

  // Extract key nouns / concepts from the summary (first ~300 chars, removing markdown)
  const summarySnippet = (chapter.summary || '')
    .replace(/^#+.*$/gm, '')
    .replace(/[\*`_>#-]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

  // Detect special themes for enhanced visual scene descriptions
  const combinedText = `${cleanTitle} ${summarySnippet}`.toLowerCase();

  let sceneContext = '';
  if (combinedText.includes('gurukul') || combinedText.includes('ashram') || combinedText.includes('ancient india') || combinedText.includes('vedic')) {
    sceneContext = 'a serene, picturesque view of an ancient Indian Gurukul hermitage under ancient banyan trees, peaceful thatched dwellings by a tranquil river, students gathered in nature';
  } else if (combinedText.includes('cell') || combinedText.includes('microscope') || combinedText.includes('bacteria') || combinedText.includes('dna')) {
    sceneContext = 'an awe-inspiring, colorful microscopic view inside a living cell with glowing mitochondria and nucleus, vivid organic forms';
  } else if (combinedText.includes('planet') || combinedText.includes('solar system') || combinedText.includes('space') || combinedText.includes('galaxy') || combinedText.includes('star')) {
    sceneContext = 'a panoramic view of orbiting planets and glowing celestial nebulae across deep cosmos';
  } else if (combinedText.includes('plant') || combinedText.includes('photo') || combinedText.includes('leaf') || combinedText.includes('tree') || combinedText.includes('flower')) {
    sceneContext = 'a lush scenic botanical landscape with golden sunlight beaming through vibrant foliage and blooming plants';
  } else if (combinedText.includes('history') || combinedText.includes('palace') || combinedText.includes('empire') || combinedText.includes('dynasty') || combinedText.includes('fort')) {
    sceneContext = 'a majestic historical architectural view with courtyards, stone arches, and classical landscape gardens';
  } else if (combinedText.includes('ocean') || combinedText.includes('water') || combinedText.includes('marine') || combinedText.includes('river')) {
    sceneContext = 'a breathtaking scenic aquatic landscape with crystal clear flowing water, coral reefs, and tranquil shores';
  } else {
    sceneContext = `a beautiful, immersive scenic view depicting ${cleanTitle || 'the educational concepts'}`;
  }

  return {
    topic: cleanTitle || 'Educational Study',
    sceneContext,
  };
}

/**
 * Builds an effective, student-friendly prompt tailored to the chapter topic.
 * Specifically crafts pictorial and scenic compositions WITHOUT text, words, labels,
 * or typography, producing an evocative illustration suitable for a reflection puzzle.
 */
export function buildEducationalImagePrompt(chapter?: SavedChapter | null): string {
  const { topic, sceneContext } = extractCleanSubject(chapter);

  return (
    `A vivid, beautiful scenic educational illustration depicting ${sceneContext}, representing ${topic}. ` +
    `Rich scenic visual art, cinematic lighting, atmospheric storytelling, colorful and immersive digital painting style. ` +
    `Purely pictorial scenery, clean visual artwork, strictly no text, no words, no letters, no numbers, no labels, no typography, no captions, no watermarks.`
  );
}

export interface ChapterImageResult {
  imageUrl: string;
  isAiGenerated: boolean;
  message?: string;
}

/**
 * Creates an exquisite, student-friendly 1024x1024 vector educational illustration
 * specifically reflecting the chapter's conceptual subject. Used as an immediate,
 * high-reliability visual when upstream Hugging Face GPU queues are busy.
 */
export function createThemedEducationalSvgUrl(chapter?: SavedChapter | null): string {
  const { topic } = extractCleanSubject(chapter);
  const text = `${chapter?.title || ''} ${chapter?.summary || ''}`.toLowerCase();

  let svgContent = '';

  if (text.includes('gurukul') || text.includes('ashram') || text.includes('ancient') || text.includes('vedic') || text.includes('guru')) {
    // Ancient Indian Gurukul Scene: Majestic Banyan tree, thatched huts, sunrise, tranquil river, Himalayan background
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF7E47"/>
            <stop offset="35%" stop-color="#FFA834"/>
            <stop offset="70%" stop-color="#FFE79A"/>
            <stop offset="100%" stop-color="#FFF8E7"/>
          </linearGradient>
          <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#3A8891"/>
            <stop offset="50%" stop-color="#0E5E6F"/>
            <stop offset="100%" stop-color="#002B5B"/>
          </linearGradient>
          <linearGradient id="canopy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1E5128"/>
            <stop offset="60%" stop-color="#4E9F3D"/>
            <stop offset="100%" stop-color="#191A19"/>
          </linearGradient>
          <linearGradient id="hills" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C5705D"/>
            <stop offset="100%" stop-color="#804638"/>
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="40%" stop-color="#FFF275"/>
            <stop offset="100%" stop-color="#FF8C32" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Sky -->
        <rect width="1024" height="1024" fill="url(#sky)"/>
        <!-- Rising Sun & Aura -->
        <circle cx="512" cy="380" r="140" fill="url(#sun)" opacity="0.95"/>
        <circle cx="512" cy="380" r="60" fill="#FFFBE6"/>
        <!-- Distant Mountains -->
        <polygon points="0,520 220,380 440,530" fill="url(#hills)" opacity="0.6"/>
        <polygon points="360,540 580,360 820,530" fill="url(#hills)" opacity="0.7"/>
        <polygon points="680,520 890,390 1024,510" fill="url(#hills)" opacity="0.5"/>
        <!-- Lush Green Foothills -->
        <path d="M0,580 Q250,510 512,560 T1024,570 L1024,1024 L0,1024 Z" fill="#2D5A27"/>
        <!-- Serene River winding through Gurukul -->
        <path d="M120,680 Q340,640 480,720 T1024,840 L1024,1024 L0,1024 L0,790 Z" fill="url(#river)"/>
        <!-- River Glare Reflections -->
        <ellipse cx="440" cy="740" rx="90" ry="12" fill="#FFE79A" opacity="0.5"/>
        <ellipse cx="620" cy="800" rx="140" ry="16" fill="#FFE79A" opacity="0.4"/>
        <!-- Ancient Banyan Tree Left (Wisdom Tree of Gurukul) -->
        <!-- Trunk & Aerial Roots -->
        <path d="M140,520 Q160,650 180,820 L130,830 Q120,670 90,520 Z" fill="#4A2E18"/>
        <path d="M90,580 Q80,720 70,820" stroke="#3A220F" stroke-width="12" fill="none"/>
        <path d="M190,590 Q220,710 240,810" stroke="#3A220F" stroke-width="10" fill="none"/>
        <!-- Banyan Canopy -->
        <ellipse cx="160" cy="420" rx="200" ry="120" fill="url(#canopy)"/>
        <ellipse cx="260" cy="390" rx="160" ry="100" fill="url(#canopy)" opacity="0.9"/>
        <ellipse cx="90" cy="380" rx="140" ry="90" fill="#2D5A27"/>
        <!-- Gurukul Hermitage Thatched Cottages (Kutir) -->
        <polygon points="460,660 560,590 660,660" fill="#D97706"/>
        <rect x="480" y="660" width="160" height="90" rx="6" fill="#FDE68A"/>
        <rect x="535" y="685" width="50" height="65" rx="4" fill="#78350F"/>
        <!-- Second Kutir in Grove -->
        <polygon points="680,670 760,610 840,670" fill="#B45309"/>
        <rect x="700" y="670" width="120" height="80" rx="4" fill="#FEF3C7"/>
        <rect x="740" y="695" width="40" height="55" rx="3" fill="#78350F"/>
        <!-- Sacred Yajna Altar / Platform under the open sky -->
        <rect x="350" y="740" width="70" height="24" rx="4" fill="#B45309"/>
        <polygon points="365,740 385,715 405,740" fill="#EF4444"/>
        <polygon points="375,740 385,720 395,740" fill="#FBBF24"/>
        <!-- Lotus flowers in the pond -->
        <circle cx="320" cy="850" r="14" fill="#F43F5E"/>
        <circle cx="320" cy="850" r="6" fill="#FEF08A"/>
        <circle cx="480" cy="910" r="18" fill="#FB7185"/>
        <circle cx="480" cy="910" r="8" fill="#FEF08A"/>
      </svg>
    `;
  } else if (text.includes('cell') || text.includes('micro') || text.includes('dna') || text.includes('bio') || text.includes('organ')) {
    // Biological Cell Concept
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <radialGradient id="cytoplasm" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#A7F3D0"/>
            <stop offset="60%" stop-color="#34D399"/>
            <stop offset="100%" stop-color="#059669"/>
          </radialGradient>
          <radialGradient id="nucleus" cx="45%" cy="45%" r="50%">
            <stop offset="0%" stop-color="#FDE047"/>
            <stop offset="50%" stop-color="#F97316"/>
            <stop offset="100%" stop-color="#9A3412"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="#064E3B"/>
        <!-- Cell Membrane Outer Glow -->
        <ellipse cx="512" cy="512" rx="440" ry="420" fill="none" stroke="#6EE7B7" stroke-width="16" opacity="0.8"/>
        <!-- Cytoplasm Body -->
        <ellipse cx="512" cy="512" rx="420" ry="400" fill="url(#cytoplasm)"/>
        <!-- Nucleus -->
        <circle cx="480" cy="480" r="160" fill="url(#nucleus)" stroke="#7C2D12" stroke-width="8"/>
        <circle cx="450" cy="450" r="60" fill="#431407"/>
        <!-- Mitochondria -->
        <ellipse cx="720" cy="360" rx="90" ry="45" fill="#F43F5E" transform="rotate(25 720 360)"/>
        <ellipse cx="280" cy="680" rx="100" ry="50" fill="#F43F5E" transform="rotate(-35 280 680)"/>
        <ellipse cx="300" cy="340" rx="80" ry="40" fill="#3B82F6" transform="rotate(45 300 340)"/>
        <ellipse cx="720" cy="680" rx="95" ry="45" fill="#3B82F6" transform="rotate(-20 720 680)"/>
      </svg>
    `;
  } else if (text.includes('space') || text.includes('planet') || text.includes('solar') || text.includes('star') || text.includes('gravity')) {
    // Space & Solar System
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <radialGradient id="deepSpace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1E1B4B"/>
            <stop offset="60%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#020617"/>
          </radialGradient>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="30%" stop-color="#FBBF24"/>
            <stop offset="80%" stop-color="#EA580C"/>
            <stop offset="100%" stop-color="#7C2D12"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#deepSpace)"/>
        <!-- Distant Stars -->
        <circle cx="200" cy="180" r="3" fill="#FFF"/>
        <circle cx="820" cy="140" r="2.5" fill="#FFF"/>
        <circle cx="900" cy="780" r="3.5" fill="#FFF"/>
        <circle cx="150" cy="850" r="2" fill="#FFF"/>
        <circle cx="640" cy="220" r="3" fill="#FFF"/>
        <!-- Glowing Sun -->
        <circle cx="180" cy="512" r="140" fill="url(#sunGrad)"/>
        <!-- Planetary Orbits -->
        <ellipse cx="180" cy="512" rx="380" ry="340" fill="none" stroke="#64748B" stroke-dasharray="6 6" stroke-width="2" opacity="0.6"/>
        <ellipse cx="180" cy="512" rx="580" ry="480" fill="none" stroke="#64748B" stroke-dasharray="6 6" stroke-width="2" opacity="0.5"/>
        <ellipse cx="180" cy="512" rx="760" ry="600" fill="none" stroke="#64748B" stroke-dasharray="6 6" stroke-width="2" opacity="0.4"/>
        <!-- Planets -->
        <circle cx="480" cy="380" r="36" fill="#38BDF8"/>
        <circle cx="680" cy="620" r="65" fill="#F59E0B"/>
        <ellipse cx="680" cy="620" rx="100" ry="24" fill="none" stroke="#FDE68A" stroke-width="6" transform="rotate(-20 680 620)"/>
        <circle cx="860" cy="400" r="48" fill="#818CF8"/>
      </svg>
    `;
  } else {
    // Universal Knowledge & Natural Sciences Landscape (Saffron & Cream aesthetic)
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="warmSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C2410C"/>
            <stop offset="45%" stop-color="#F97316"/>
            <stop offset="80%" stop-color="#FDE047"/>
            <stop offset="100%" stop-color="#FFFBEB"/>
          </linearGradient>
          <radialGradient id="wisdomSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF"/>
            <stop offset="50%" stop-color="#FCD34D"/>
            <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#warmSky)"/>
        <circle cx="512" cy="420" r="160" fill="url(#wisdomSun)" opacity="0.9"/>
        <circle cx="512" cy="420" r="70" fill="#FFFBEB"/>
        <!-- Mountains of Discovery -->
        <polygon points="0,580 280,390 560,590" fill="#9A3412" opacity="0.75"/>
        <polygon points="460,580 740,360 1024,560" fill="#7C2D12" opacity="0.85"/>
        <!-- Fertile Valley of Learning -->
        <path d="M0,640 Q250,560 512,620 T1024,630 L1024,1024 L0,1024 Z" fill="#14532D"/>
        <!-- River of Continuous Reflection -->
        <path d="M180,720 Q400,680 520,760 T1024,880 L1024,1024 L0,1024 L0,840 Z" fill="#0284C7"/>
        <ellipse cx="500" cy="780" rx="100" ry="12" fill="#FEF08A" opacity="0.5"/>
        <!-- Lotus on River -->
        <circle cx="360" cy="880" r="22" fill="#F43F5E"/>
        <circle cx="360" cy="880" r="9" fill="#FEF08A"/>
      </svg>
    `;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
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
 * If the external Render service or upstream Hugging Face space encounters an error,
 * automatically generates a beautiful educational vector illustration for the chapter
 * so student gameplay and reflection are never broken.
 */
export async function generateChapterImage(
  prompt: string,
  signal?: AbortSignal,
  chapter?: SavedChapter | null
): Promise<ChapterImageResult> {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A valid educational image prompt is required.');
  }

  // 1. Attempt generation with the Render service
  try {
    const response = await fetch(GYANQUEST_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
        const generatedUrl = data.imageUrl.trim();
        await preloadImage(generatedUrl);
        return {
          imageUrl: generatedUrl,
          isAiGenerated: true,
        };
      }
    } else {
      const errText = await response.text().catch(() => '');
      console.warn(`Render image API returned status ${response.status}:`, errText);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    console.warn('Network error reaching Render image API:', err);
  }

  // 2. High-reliability fallback: provide a beautiful conceptual vector illustration for the chapter
  const fallbackUrl = createThemedEducationalSvgUrl(chapter);
  await preloadImage(fallbackUrl);

  return {
    imageUrl: fallbackUrl,
    isAiGenerated: false,
    message: 'Upstream image generator is queueing. Enjoying your chapter reflection visual!',
  };
}
