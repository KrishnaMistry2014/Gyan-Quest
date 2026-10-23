import { SavedChapter } from './chapters';

export interface ScriptureImage {
  id: string;
  url: string;
  title: string;
  caption: string;
}

export interface ScriptureDefinition extends SavedChapter {
  scriptureKey: 'gita' | 'ramayana' | 'mahabharata' | 'indus_valley';
  scriptureImages: ScriptureImage[];
}

export const SCRIPTURES: Record<'gita' | 'ramayana' | 'mahabharata' | 'indus_valley', ScriptureDefinition> = {
  gita: {
    id: 'gita_chapter_6_17',
    uniqueCode: '6170061700',
    scriptureKey: 'gita',
    title: 'Bhagavad Gita: Dhyana Yoga (Verse 6.17)',
    fileName: 'Bhagavad_Gita_Chapter_6_Verse_17.pdf',
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
    ],
  },
  ramayana: {
    id: 'epic_ramayana_dharma',
    uniqueCode: '7849201533',
    scriptureKey: 'ramayana',
    title: 'Ramayana: The Path of Truth, Courage, and Righteous Duty',
    fileName: 'Ramayana_Valmiki_Epic_Wisdom.pdf',
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
    ],
  },
  mahabharata: {
    id: 'epic_mahabharata_dharma',
    uniqueCode: '8920194821',
    scriptureKey: 'mahabharata',
    title: 'Mahabharata: The Great Epic of Dharma & Kurukshetra',
    fileName: 'Mahabharata_Vyasa_Epic_Wisdom.pdf',
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
    ],
  },
  indus_valley: {
    id: 'history_indus_valley_6_8',
    uniqueCode: '2600190021',
    scriptureKey: 'indus_valley',
    title: 'The Indus Valley Civilization',
    fileName: 'NCERT_History_The_Indus_Valley_Civilization.pdf',
    createdAt: new Date().toISOString(),
    summary: `# The Indus Valley Civilization (Harappan Civilization)
## Discover the cities, people, technology, trade, and mysteries of one of the world's earliest urban civilizations (NCERT Classes 6–8)

### 1. Introduction & Naming
The Indus Valley Civilization, also called the Harappan Civilization after Harappa (the first site excavated in 1921), was one of the world's earliest urban civilizations. It developed across parts of present-day Pakistan and north-western and western India. While early discoveries lay along the Indus River, hundreds of settlements occur in the Ghaggar-Hakra plains and coastal Gujarat. Because the Indus script has not been conclusively deciphered, historians rely on archaeological evidence—bricks, drains, pottery, seals, weights, seeds, and bones—and carefully separate physical evidence from uncertain interpretations.

### 2. Timeline & Phases (Approximate Dates)
- **Early Farming Communities (Before c. 3300 BCE)**: Settled farming of wheat and barley and herding of cattle, sheep, and goats developed in the wider region; Mehrgarh in Balochistan is an important earlier farming settlement (from c. 7000 BCE).
- **Early Harappan Phase (c. 3300–2600 BCE)**: Regional towns, wheel-made pottery, mud-brick fortifications, and trade networks grew.
- **Mature Harappan Phase (c. 2600–1900 BCE)**: Peak of planned cities, baked-brick architecture, covered street drains, the Great Bath, steatite seals, the Indus script, cubical chert weights, and long-distance trade.
- **Late Harappan Phase (c. 1900–1300 BCE)**: Gradual urban transformation; major cities shrank or changed while smaller settlements and regional cultures continued.

### 3. Discovery & Major Sites
- **1921**: Daya Ram Sahni led excavations at Harappa (Punjab, Pakistan).
- **1922**: R. D. Banerji began excavations at Mohenjo-daro (Sindh, Pakistan).
- **1924**: Sir John Marshall, Director-General of the Archaeological Survey of India, announced the civilization's discovery.
- **Key Sites**: Harappa (granary platforms, workshops, burials), Mohenjo-daro (Great Bath, covered drains, wells, bronze "Dancing Girl", stone "Priest-King"—modern labels for figures of unknown identity), Dholavira (Gujarat: rock-cut water reservoirs, three-part stone/brick layout, 10-sign signboard), Lothal (Gujarat: carnelian bead factory, warehouse sealings, brick basin often interpreted as a dockyard), Kalibangan (Rajasthan: Early Harappan ploughed field with criss-cross furrows, fire installations), Rakhigarhi (Haryana: one of the largest Harappan settlements), and Mehrgarh (Balochistan: earlier farming precursor).

### 4. Town Planning, Water Management, Farming, Crafts & Trade
- **Town Planning & Drainage**: Mud and baked bricks in standardized 1:2:4 ratios, courtyard houses, neighbourhood brick wells, sloped bathing floors, and covered street drains with removable slabs for cleaning. Shared building practices show organization without proving a single king ruled every city.
- **Agriculture**: Wheat, barley, pulses, sesame, mustard, cotton, and regional millets/rice; domesticated cattle, buffalo, sheep, and goats.
- **Crafts & Trade**: Painted pottery, etched carnelian beads, copper/bronze metallurgy, shell bangles, glazed faience, steatite seals, and standardized cubical chert weights. Trade connected South Asia with Afghanistan, Iran, Oman, and Mesopotamia (where cuneiform texts mention "Meluhha").

### 5. Gradual Transformation (After c. 1900 BCE)
Urban changes after c. 1900 BCE were gradual and varied by region due to multiple factors: climate and monsoon shifts, changing river courses, evolving long-distance trade, and population movement toward smaller settlements.`,
    scriptureImages: [
      {
        id: 'indus_1',
        url: '/assets/scriptures/indus_valley_harappan.svg',
        title: 'Harappan Urban Planning & The Great Bath (Educational Illustration)',
        caption: 'Artistic reconstruction illustrating baked-brick architecture, covered street drains, brick wells, and the Great Bath at Mohenjo-daro.',
      },
    ],
  },
};

/**
 * Checks if a given chapter is one of the predefined scriptures or curriculum chapters.
 */
export function getScriptureDefinition(chapter?: SavedChapter | null): ScriptureDefinition | null {
  if (!chapter) return null;
  const id = chapter.id?.toLowerCase() || '';
  const title = chapter.title?.toLowerCase() || '';
  const fileName = chapter.fileName?.toLowerCase() || '';

  if (id.includes('indus') || title.includes('indus') || title.includes('harappa') || fileName.includes('indus')) {
    return SCRIPTURES.indus_valley;
  }
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
