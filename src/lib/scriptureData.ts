import { SavedChapter } from './chapters';

export interface ScriptureImage {
  id: string;
  url: string;
  title: string;
  caption: string;
}

export interface ScriptureDefinition extends SavedChapter {
  scriptureKey: 'gita' | 'ramayana' | 'mahabharata';
  scriptureImages: ScriptureImage[];
  audioUrl: string;
}

export const SCRIPTURES: Record<'gita' | 'ramayana' | 'mahabharata', ScriptureDefinition> = {
  gita: {
    id: 'gita_chapter_6_17',
    uniqueCode: '6170061700',
    scriptureKey: 'gita',
    title: 'Bhagavad Gita: Dhyana Yoga (Verse 6.17)',
    fileName: 'Bhagavad_Gita_Chapter_6_Verse_17.pdf',
    audioUrl: '/assets/audio/gita.wav',
    createdAt: new Date().toISOString(),
    summary: `# Bhagavad Gita for Students
## Become the Architect of Your Own Success Through Timeless Ancient Wisdom

### Chapter 6: Dhyana Yoga - Verse 6.17

Have you ever felt too busy or cluttered with homework, projects, classes, or studies? Timeless ancient wisdom revealed about 5000 years ago in the holy Bhagavad Gita will help you find a solution and discover enduring success in life. Verse 6.17 emphasizes the supreme importance of daily balance and prioritization.

> *yuktahara-viharasya yukta-cestasya karmasu*
> *yukta-swapnavabodhasya yogo bhavati duhkha-ha*

> *"He who is regulated in his habits of eating, sleeping, recreation, and work can mitigate all material pains by practicing the yoga system."*

### Word-by-Word Breakdown:
- **yukta** — regulated, balanced
- **ahara** — eating, nourishment
- **viharasya** — recreation, joyful leisure
- **cestasya** — of one who works with purpose
- **karmasu** — in discharging duties and studies
- **swapna-avabodhasya** — sleep and wakefulness
- **yogo** — practice of yoga and mindfulness
- **bhavati** — becomes
- **duhkha-ha** — diminishing all pains and anxiety

### Practical Pillars for Student Success:
1. **Regulated Resting**: Maintaining 8–10 hours of restorative sleep to ensure sharp memory recall, quick reaction times, and calm clarity of thought.
2. **Regulated Eating**: Treating the physical body like a sacred machine fueled with nutrient-rich foods, fruits, and hydration rather than processed snacks.
3. **Staying Active**: Regular daily movement, sports, or yoga to cultivate physical vitality and reduce mental stress.
4. **Regulated Work & Study**: Approaching academic tasks with dedicated concentration (Sankalp) and periodic breaks, avoiding rushed last-minute panic.
5. **Mindful Recreation**: Enjoying creative, rejuvenating hobbies in balanced moderation to refresh the intellect without distraction.
6. **Habit Formation**: Practicing daily discipline consistently for 21 days or more to forge unbreakable habits of focus and peace.`,
    scriptureImages: [
      {
        id: 'gita_1',
        url: '/assets/scriptures/gita_krishna_arjuna_1792219962444.jpg',
        title: 'Krishna & Arjuna at Kurukshetra',
        caption: 'The Divine Charioteer imparting eternal guidance on the battlefield of duty and righteous action.',
      },
      {
        id: 'gita_2',
        url: '/assets/scriptures/gita_dhyana_meditation_1792219980685.jpg',
        title: 'Dhyana Yoga & Calm Meditation',
        caption: 'Inner stillness, regulated breath, and disciplined mental focus under the sacred banyan tree.',
      },
      {
        id: 'gita_3',
        url: '/assets/scriptures/gita_cosmic_harmony_1792219992249.jpg',
        title: 'Cosmic Universal Harmony',
        caption: 'The transcendental golden lotus order connecting all living beings in balanced harmony.',
      },
    ],
  },
  ramayana: {
    id: 'epic_ramayana_dharma',
    uniqueCode: '7849201533',
    scriptureKey: 'ramayana',
    title: 'Ramayana: The Path of Truth, Courage, and Righteous Duty',
    fileName: 'Ramayana_Valmiki_Epic_Wisdom.pdf',
    audioUrl: '/assets/audio/ramayana.wav',
    createdAt: new Date().toISOString(),
    summary: `# Ramayana: The Path of Truth, Courage, and Righteous Duty

The Ramayana, composed by Sage Valmiki, chronicles the eternal journey of Sri Rama of Ayodhya, exemplifying Maryada Purushottama (the ideal embodiment of truth, duty, humility, and steadfast righteousness).

## Core Pillars for Young Scholars (Grades 4–8):
1. **Satya (Truthfulness)**: Rama's unwavering adherence to his father King Dasharatha's word, joyfully embracing fourteen years of forest exile rather than compromising on truth.
2. **Dharma (Righteous Action)**: Prioritizing moral duty and the protection of others above personal convenience or comfort.
3. **Bhratru-prema (Brotherly Loyalty)**: The selfless devotion of Lakshmana, Bharata, and Shatrughna in supporting one another through every challenge.
4. **Bhakti & Focus (Hanuman's Dedication)**: Facing immense hurdles with single-minded courage, wisdom, and humility.
5. **Harmony with Nature**: Honoring forests, rivers, and living creatures with reverence and gratitude.

## Student Wisdom:
True strength is built through quiet, daily choices. Just as Rama remained balanced in the palace and in the forest, a dedicated student practices calm focus and truthfulness in study and daily life.`,
    scriptureImages: [
      {
        id: 'ramayana_1',
        url: '/assets/scriptures/ramayana_forest_exile_1792220005761.jpg',
        title: 'Rama, Sita & Lakshmana in Forest Exile',
        caption: 'Embracing forest exile with calm dignity to honor King Dasharatha word and preserve dharma.',
      },
      {
        id: 'ramayana_2',
        url: '/assets/scriptures/ramayana_shiva_bow_1792220019253.jpg',
        title: "Breaking Shiva's Bow in Mithila",
        caption: "Prince Rama effortlessly lifting and stringing the mighty bow in King Janaka royal assembly.",
      },
      {
        id: 'ramayana_3',
        url: '/assets/scriptures/ramayana_hanuman_ring_1792220033179.jpg',
        title: 'Hanuman Devotion in Ashoka Vatika',
        caption: 'Shri Hanuman presenting Rama signet ring with humility, solace, and courage to Sita.',
      },
    ],
  },
  mahabharata: {
    id: 'epic_mahabharata_dharma',
    uniqueCode: '8920194821',
    scriptureKey: 'mahabharata',
    title: 'Mahabharata: The Great Epic of Dharma & Kurukshetra',
    fileName: 'Mahabharata_Vyasa_Epic_Wisdom.pdf',
    audioUrl: '/assets/audio/mahabharata.wav',
    createdAt: new Date().toISOString(),
    summary: `# Mahabharata: The Great Epic of Dharma & Kurukshetra

The Mahabharata, composed by Sage Krishna Dvaipayana Vyasa, is an unparalleled Itihasa exploring human nature, ethical dilemmas, statecraft, and the eternal supremacy of Dharma.

## Core Lessons for Students:
1. **Dharma as Moral Compass**: "Yato Dharmas Tato Jayah" (Where there is Dharma, there is victory). Righteousness guides every action and consequence.
2. **Single-Minded Focus (Arjuna's Discipline)**: The legendary archer Arjuna mastered concentration by seeing only the eye of the bird, illustrating the power of unbroken academic attention.
3. **Pitri-Bhakti & Integrity (Bhishma's Vow)**: Devavrata's lifelong oath of selflessness demonstrates personal discipline and devotion to family honor.
4. **Nishkama Karma (Selfless Duty)**: Performing study and service with full dedication without getting paralyzed by anxiety over results.
5. **Truth & Truthfulness (Yudhisthira's Steely Truth)**: Upholding honesty even in the face of immense adversity.

## Student Wisdom:
Life presents complex choices every day. The Mahabharata teaches scholars to cultivate discernment (Viveka), loyalty to truth, and steady calmness under pressure.`,
    scriptureImages: [
      {
        id: 'mahabharata_1',
        url: '/assets/scriptures/mahabharata_kurukshetra_counsel_1792220047309.jpg',
        title: 'Krishna Guiding Arjuna on the Divine Chariot',
        caption: 'The divine counsel at Kurukshetra teaching courageous action and self-mastery.',
      },
      {
        id: 'mahabharata_2',
        url: '/assets/scriptures/mahabharata_bhishma_wisdom_1792220061443.jpg',
        title: 'Bhishma Pitamah Discourse on Dharma',
        caption: 'Grand patriarch Bhishma resting on the bed of arrows imparting timeless wisdom on Shanti Parva.',
      },
      {
        id: 'mahabharata_3',
        url: '/assets/scriptures/mahabharata_indraprastha_splendor_1792220075573.jpg',
        title: 'The Splendor of Indraprastha',
        caption: 'The grand city of righteousness built for King Yudhisthira and the five Pandava brothers.',
      },
    ],
  },
};

/**
 * Checks if a given chapter is one of the 3 predefined scriptures.
 */
export function getScriptureDefinition(chapter?: SavedChapter | null): ScriptureDefinition | null {
  if (!chapter) return null;
  const id = chapter.id?.toLowerCase() || '';
  const title = chapter.title?.toLowerCase() || '';
  const fileName = chapter.fileName?.toLowerCase() || '';

  if (id.includes('gita') || title.includes('gita') || fileName.includes('gita')) {
    return SCRIPTURES.gita;
  }
  if (id.includes('ramayana') || title.includes('ramayana') || fileName.includes('ramayana')) {
    return SCRIPTURES.ramayana;
  }
  if (id.includes('mahabharata') || title.includes('mahabharata') || fileName.includes('mahabharata')) {
    return SCRIPTURES.mahabharata;
  }
  return null;
}
