import { CrosswordData, ChronologicalCrosswordEvent } from '../types';
import { buildValidCrosswordLayout } from './crosswordGenerator';

export function attachChronologicalMetadata(
  baseCrossword: CrosswordData,
  events: ChronologicalCrosswordEvent[],
  customId?: string
): CrosswordData {
  const normalizedEvents = events
    .map((ev, idx) => ({
      ...ev,
      stepOrder: ev.stepOrder || idx + 1,
      answer: ev.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''),
    }))
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const eventByAnswer = new Map<string, ChronologicalCrosswordEvent>();
  for (const ev of normalizedEvents) {
    if (ev.answer && !eventByAnswer.has(ev.answer)) {
      eventByAnswer.set(ev.answer, ev);
    }
  }

  const enrichedWords = baseCrossword.words.map((word) => {
    const matched = eventByAnswer.get(word.answer.toUpperCase());
    if (!matched) return word;
    return {
      ...word,
      chronologicalStep: matched.stepOrder,
      eraOrPhase: matched.eraOrPhase,
      eventDescription: matched.eventDescription,
    };
  });

  const linkedEvents: ChronologicalCrosswordEvent[] = normalizedEvents
    .map((ev) => {
      const matchedWord = enrichedWords.find((w) => w.answer.toUpperCase() === ev.answer);
      return {
        ...ev,
        wordId: matchedWord?.id,
      };
    })
    .filter((ev) => Boolean(ev.wordId));

  // Re-index stepOrder 1..N for the placed words so chronological sequence has no gaps
  const finalEvents = linkedEvents.map((ev, idx) => ({
    ...ev,
    stepOrder: idx + 1,
  }));

  const finalStepByWordId = new Map<string, ChronologicalCrosswordEvent>();
  for (const ev of finalEvents) {
    if (ev.wordId) finalStepByWordId.set(ev.wordId, ev);
  }

  const finalWords = enrichedWords.map((w) => {
    const ev = finalStepByWordId.get(w.id);
    if (!ev) return w;
    return {
      ...w,
      chronologicalStep: ev.stepOrder,
      eraOrPhase: ev.eraOrPhase,
      eventDescription: ev.eventDescription,
      clue: `[Step ${ev.stepOrder} • ${ev.eraOrPhase}] ${w.clue.replace(/^\[Step\s+\d+[^\]]*\]\s*/i, '')}`,
    };
  });

  return {
    ...baseCrossword,
    id: customId || `${baseCrossword.id}-chronological`,
    mode: 'chronological',
    words: finalWords,
    chronologicalEvents: finalEvents,
  };
}

export const SAMPLE_CROSSWORDS: CrosswordData[] = [
  {
    "id": "gita-6-17",
    "title": "Bhagavad Gita: Dhyana Yoga (Verse 6.17)",
    "theme": "Daily prioritization, balanced habits, eating, sleeping, and mindful action.",
    "summary": "Exploration of Bhagavad Gita Chapter 6 Verse 6.17 on how regulated habits in eating, sleeping, recreation, and work eliminate stress and bring success.",
    "gridSize": 15,
    "mode": "standard",
    "words": [
      {
        "id": "1_down",
        "number": 1,
        "direction": "down",
        "answer": "MIND",
        "clue": "Subtle faculty that can be a friend or foe through discipline",
        "row": 0,
        "col": 4
      },
      {
        "id": "2_across",
        "number": 2,
        "direction": "across",
        "answer": "DIET",
        "clue": "Sattvic food intake nourishing clarity and vitality",
        "row": 1,
        "col": 3
      },
      {
        "id": "3_across",
        "number": 3,
        "direction": "across",
        "answer": "WISDOM",
        "clue": "Experiential understanding guiding noble life decisions",
        "row": 3,
        "col": 2
      },
      {
        "id": "4_down",
        "number": 4,
        "direction": "down",
        "answer": "SHANTI",
        "clue": "Profound peace and tranquility of the calm intellect",
        "row": 3,
        "col": 3
      },
      {
        "id": "5_down",
        "number": 5,
        "direction": "down",
        "answer": "PEACE",
        "clue": "Equanimous state free from agitation and worry",
        "row": 2,
        "col": 7
      },
      {
        "id": "6_across",
        "number": 6,
        "direction": "across",
        "answer": "HEALTH",
        "clue": "Wholeness of body and mental clarity through good habits",
        "row": 5,
        "col": 2
      }
    ],
    "glossary": [
      {
        "term": "Mind",
        "definition": "Subtle faculty that can be a friend or foe through discipline"
      },
      {
        "term": "Diet",
        "definition": "Sattvic food intake nourishing clarity and vitality"
      },
      {
        "term": "Wisdom",
        "definition": "Experiential understanding guiding noble life decisions"
      },
      {
        "term": "Shanti",
        "definition": "Profound peace and tranquility of the calm intellect"
      },
      {
        "term": "Peace",
        "definition": "Equanimous state free from agitation and worry"
      },
      {
        "term": "Health",
        "definition": "Wholeness of body and mental clarity through good habits"
      }
    ]
  },
  {
    "id": "ramayana-dharma",
    "title": "Ramayana: Truth, Courage & Righteous Duty",
    "theme": "Timeless principles of Satya, brotherly loyalty, courage, and moral duty from Sage Valmiki epic.",
    "summary": "The life journey of Sri Rama of Ayodhya, exemplifying Maryada Purushottama and the path of steadfast truth.",
    "gridSize": 15,
    "mode": "standard",
    "words": [
      {
        "id": "1_down",
        "number": 1,
        "direction": "down",
        "answer": "SUGRIVA",
        "clue": "Vanara ruler befriended by Rama in Kishkindha",
        "row": 0,
        "col": 5
      },
      {
        "id": "2_across",
        "number": 2,
        "direction": "across",
        "answer": "VIRTUE",
        "clue": "Moral excellence practiced consistently in daily deeds",
        "row": 1,
        "col": 3
      },
      {
        "id": "3_down",
        "number": 3,
        "direction": "down",
        "answer": "DEVOTION",
        "clue": "Pure selfless love exemplified by Hanuman bhakti",
        "row": 2,
        "col": 8
      },
      {
        "id": "4_across",
        "number": 4,
        "direction": "across",
        "answer": "COURAGE",
        "clue": "Fearless bravery in confronting adversity and injustice",
        "row": 3,
        "col": 2
      },
      {
        "id": "5_down",
        "number": 5,
        "direction": "down",
        "answer": "SATYA",
        "clue": "Truthfulness honoring King Dasharatha sacred word",
        "row": 3,
        "col": 4
      },
      {
        "id": "6_across",
        "number": 6,
        "direction": "across",
        "answer": "HUMILITY",
        "clue": "Absence of pride displayed by Rama toward all beings",
        "row": 5,
        "col": 2
      }
    ],
    "glossary": [
      {
        "term": "Sugriva",
        "definition": "Vanara ruler befriended by Rama in Kishkindha"
      },
      {
        "term": "Virtue",
        "definition": "Moral excellence practiced consistently in daily deeds"
      },
      {
        "term": "Devotion",
        "definition": "Pure selfless love exemplified by Hanuman bhakti"
      },
      {
        "term": "Courage",
        "definition": "Fearless bravery in confronting adversity and injustice"
      },
      {
        "term": "Satya",
        "definition": "Truthfulness honoring King Dasharatha sacred word"
      },
      {
        "term": "Humility",
        "definition": "Absence of pride displayed by Rama toward all beings"
      }
    ]
  },
  {
    "id": "mahabharata-epic",
    "title": "Mahabharata: The Great Epic of Dharma",
    "theme": "Moral duty, single-minded concentration, selflessness, and the eternal supremacy of righteousness.",
    "summary": "Sage Vyasa monumental epic depicting the Kuru lineage, the battle of Kurukshetra, and eternal lessons in character.",
    "gridSize": 15,
    "mode": "standard",
    "words": [
      {
        "id": "1_down",
        "number": 1,
        "direction": "down",
        "answer": "VICTORY",
        "clue": "Triumph inevitably resting where moral order reigns",
        "row": 0,
        "col": 4
      },
      {
        "id": "1_across",
        "number": 1,
        "direction": "across",
        "answer": "VOW",
        "clue": "Solemn oath taken by Bhishma to preserve royal lineage",
        "row": 0,
        "col": 4
      },
      {
        "id": "2_down",
        "number": 2,
        "direction": "down",
        "answer": "BHIMA",
        "clue": "Second Pandava wielder of the mace and colossal physical strength",
        "row": 1,
        "col": 6
      },
      {
        "id": "3_down",
        "number": 3,
        "direction": "down",
        "answer": "ARJUNA",
        "clue": "Master Pandava archer who wove unbroken concentration",
        "row": 2,
        "col": 2
      },
      {
        "id": "4_across",
        "number": 4,
        "direction": "across",
        "answer": "LIBERATION",
        "clue": "Moksha: ultimate spiritual release from cycle of rebirth",
        "row": 4,
        "col": 1
      },
      {
        "id": "5_across",
        "number": 5,
        "direction": "across",
        "answer": "DRAUPADI",
        "clue": "Princess born of holy sacrificial fire and Pandava queen",
        "row": 6,
        "col": 2
      }
    ],
    "glossary": [
      {
        "term": "Victory",
        "definition": "Triumph inevitably resting where moral order reigns"
      },
      {
        "term": "Vow",
        "definition": "Solemn oath taken by Bhishma to preserve royal lineage"
      },
      {
        "term": "Bhima",
        "definition": "Second Pandava wielder of the mace and colossal physical strength"
      },
      {
        "term": "Arjuna",
        "definition": "Master Pandava archer who wove unbroken concentration"
      },
      {
        "term": "Liberation",
        "definition": "Moksha: ultimate spiritual release from cycle of rebirth"
      },
      {
        "term": "Draupadi",
        "definition": "Princess born of holy sacrificial fire and Pandava queen"
      }
    ]
  },
  {
    "id": "indus-valley-history",
    "title": "The Indus Valley Civilization (Classes 6–8)",
    "theme": "Harappan cities, water engineering, crafts, undeciphered script, and ancient trade.",
    "summary": "Explore the Mature Harappan urban peak (c. 2600–1900 BCE), planned brick cities, covered drainage, Dholavira reservoirs, Lothal bead workshops, and Meluhha trade links.",
    "gridSize": 15,
    "mode": "standard",
    "words": [
      {
        "id": "1_down",
        "number": 1,
        "direction": "down",
        "answer": "MELUHHA",
        "clue": "Name in Mesopotamian cuneiform texts widely associated by scholars with the Indus region",
        "row": 0,
        "col": 3
      },
      {
        "id": "2_across",
        "number": 2,
        "direction": "across",
        "answer": "SEAL",
        "clue": "Carved steatite stamp with animal motifs and short Indus script symbols",
        "row": 1,
        "col": 2
      },
      {
        "id": "3_across",
        "number": 3,
        "direction": "across",
        "answer": "HARAPPA",
        "clue": "First major site excavated by Daya Ram Sahni in 1921 in Punjab",
        "row": 4,
        "col": 3
      },
      {
        "id": "4_down",
        "number": 4,
        "direction": "down",
        "answer": "DRAINS",
        "clue": "Covered brick street channels with removable slabs that carried wastewater away",
        "row": 2,
        "col": 6
      },
      {
        "id": "5_down",
        "number": 5,
        "direction": "down",
        "answer": "SCRIPT",
        "clue": "Harappan writing system of short symbol sequences that remains undeciphered",
        "row": 0,
        "col": 8
      },
      {
        "id": "6_across",
        "number": 6,
        "direction": "across",
        "answer": "LOTHAL",
        "clue": "Gujarat site famous for its carnelian bead factory and brick basin interpreted as a dockyard",
        "row": 6,
        "col": 9
      }
    ],
    "glossary": [
      {
        "term": "Meluhha",
        "definition": "Mesopotamian cuneiform term widely associated by scholars with the Indus region"
      },
      {
        "term": "Seal",
        "definition": "Carved steatite stamp with animal motifs and short inscriptions"
      },
      {
        "term": "Harappa",
        "definition": "Key site excavated in 1921 that gave the Harappan Civilization its name"
      },
      {
        "term": "Drains",
        "definition": "Covered street channels designed for municipal sanitation and cleaning"
      },
      {
        "term": "Script",
        "definition": "The undeciphered writing system of the Indus Valley Civilization"
      },
      {
        "term": "Lothal",
        "definition": "Harappan site in Gujarat known for bead-making and maritime trade links"
      }
    ]
  }
];

function buildCuratedChronologicalCrossword(params: {
  id: string;
  title: string;
  theme: string;
  summary: string;
  events: (ChronologicalCrosswordEvent & { clue: string })[];
}): CrosswordData {
  const layout = buildValidCrosswordLayout(
    params.events.map((ev) => ({
      answer: ev.answer,
      clue: ev.clue,
    })),
    {
      title: params.title,
      theme: params.theme,
      summary: params.summary,
      glossary: params.events.map((ev) => ({
        term: `${ev.stepOrder}. ${ev.answer} (${ev.eraOrPhase})`,
        definition: ev.eventDescription,
      })),
    }
  );

  return attachChronologicalMetadata(layout, params.events, params.id);
}

export const CHRONOLOGICAL_SAMPLE_CROSSWORDS: Record<
  'indus_valley' | 'ramayana' | 'mahabharata' | 'gita',
  CrosswordData
> = {
  indus_valley: buildCuratedChronologicalCrossword({
    id: 'indus-valley-chronological',
    title: 'The Indus Valley Civilization: Chronological Sequence',
    theme: 'Trace the Harappan story in chronological order from early farming villages to urban peak, overseas trade, transformation, and 1921 rediscovery.',
    summary:
      'Solve the crossword by following the historical timeline of the Indus Valley Civilization from c. 7000 BCE early agricultural settlements through the Mature Harappan urban phase (2600–1900 BCE) to modern archaeological excavations.',
    events: [
      {
        stepOrder: 1,
        eraOrPhase: 'c. 7000–2600 BCE • Early Farming Phase',
        eventDescription: 'Early settled communities cultivate barley and wheat and domesticate cattle in the Indus-Sarasvati plains before large cities emerge.',
        answer: 'BARLEY',
        clue: 'Staple grain crop cultivated by the earliest farming communities of the Indus region before urban cities arose',
      },
      {
        stepOrder: 2,
        eraOrPhase: 'c. 2600 BCE • Rise of Planned Cities',
        eventDescription: 'Major Mature Harappan cities construct a raised western Citadel and an eastern Lower Town using standardized baked bricks.',
        answer: 'CITADEL',
        clue: 'Raised, fortified western precinct built with mud-brick platforms as Mature Harappan cities rose around 2600 BCE',
      },
      {
        stepOrder: 3,
        eraOrPhase: 'c. 2500 BCE • Municipal Water Engineering',
        eventDescription: 'Harappan engineers connect domestic bathing platforms to covered street drains with removable inspection slabs.',
        answer: 'DRAINS',
        clue: 'Covered brick street channels engineered during the urban peak to carry household wastewater away',
      },
      {
        stepOrder: 4,
        eraOrPhase: 'c. 2400–2000 BCE • Maritime & Overland Trade',
        eventDescription: 'Harappan merchants use carved steatite seals and chert weights to trade beads and cotton with Mesopotamia (Meluhha).',
        answer: 'MELUHHA',
        clue: 'Region name in Mesopotamian cuneiform inscriptions recording maritime trade with Indus merchants',
      },
      {
        stepOrder: 5,
        eraOrPhase: 'c. 1900–1300 BCE • Late Harappan Transformation',
        eventDescription: 'As river courses shift and monsoon rains weaken, large urban centres de-urbanize and populations move to smaller eastern and southern settlements.',
        answer: 'CLIMATE',
        clue: 'Gradual environmental and monsoon shift after 1900 BCE that contributed to the transformation of Harappan cities',
      },
      {
        stepOrder: 6,
        eraOrPhase: '1921–1922 CE • Modern Archaeological Rediscovery',
        eventDescription: 'Excavations led by Daya Ram Sahni at Harappa (1921) and R.D. Banerji at Mohenjo-daro (1922) reveal the forgotten civilization to the modern world.',
        answer: 'HARAPPA',
        clue: 'Site excavated in 1921 by Daya Ram Sahni that gave the Indus Valley Civilization its archaeological name',
      },
    ],
  }),
  ramayana: buildCuratedChronologicalCrossword({
    id: 'ramayana-chronological',
    title: 'Ramayana: Chronological Journey of Sri Rama',
    theme: 'Follow the narrative sequence of Valmiki Ramayana from Ayodhya to the forest exile, Kishkindha alliance, Lanka, and return.',
    summary:
      'Trace the chronological arc of the Ramayana from Prince Rama’s youth in Ayodhya and upholding King Dasharatha’s promise through the fourteen-year exile and triumph of Dharma.',
    events: [
      {
        stepOrder: 1,
        eraOrPhase: 'Stage 1 • Youth & Training in Kosala',
        eventDescription: 'Prince Rama grows up in the sacred capital of Ayodhya, mastering archery, scriptures, and humility.',
        answer: 'AYODHYA',
        clue: 'Capital city of Kosala where Prince Rama was born and trained in royal duties',
      },
      {
        stepOrder: 2,
        eraOrPhase: 'Stage 2 • Honoring the Sacred Vow',
        eventDescription: 'To protect King Dasharatha’s sacred promise, Rama calmly chooses truthfulness over the royal throne.',
        answer: 'SATYA',
        clue: 'Unwavering truthfulness upheld when Rama honored his father’s sacred word',
      },
      {
        stepOrder: 3,
        eraOrPhase: 'Stage 3 • Fourteen Years in the Forest',
        eventDescription: 'Rama, Sita, and Lakshmana depart the palace and live among forest sages in Dandakaranya.',
        answer: 'EXILE',
        clue: 'Fourteen-year period spent in the forest by Rama, Sita, and Lakshmana',
      },
      {
        stepOrder: 4,
        eraOrPhase: 'Stage 4 • Friendship in Kishkindha',
        eventDescription: 'During the search for Sita, Rama forms a sacred bond of mutual aid with the Vanara ruler in Kishkindha.',
        answer: 'SUGRIVA',
        clue: 'Vanara king in Kishkindha who allied with Rama to search for Sita',
      },
      {
        stepOrder: 5,
        eraOrPhase: 'Stage 5 • Crossing the Ocean to Lanka',
        eventDescription: 'Filled with selfless devotion, Hanuman leaps across the southern ocean and locates Sita in Ashoka Vatika.',
        answer: 'BHAKTI',
        clue: 'Selfless devotion exemplified by Hanuman as he crossed the ocean to serve Rama',
      },
      {
        stepOrder: 6,
        eraOrPhase: 'Stage 6 • Restoration of Moral Order',
        eventDescription: 'Following victory in Lanka, Rama returns to Ayodhya and establishes righteous governance.',
        answer: 'DHARMA',
        clue: 'Righteous moral order restored upon Rama’s victorious return to Ayodhya',
      },
    ],
  }),
  mahabharata: buildCuratedChronologicalCrossword({
    id: 'mahabharata-chronological',
    title: 'Mahabharata: Chronological Sequence of the Epic',
    theme: 'Follow the sequential milestones of the Mahabharata from Bhishma’s vow and Gurukula archery to Kurukshetra and the triumph of Dharma.',
    summary:
      'Order and solve the key chronological milestones of Sage Vyasa’s epic Mahabharata from early Hastinapura vows and training to the final triumph of righteousness.',
    events: [
      {
        stepOrder: 1,
        eraOrPhase: 'Stage 1 • The Lifelong Oath at Hastinapura',
        eventDescription: 'Devavrata (Bhishma) takes a solemn lifelong vow of renunciation to serve the throne of Hastinapura.',
        answer: 'VOW',
        clue: 'Solemn lifelong oath taken by Bhishma at the beginning of the Kuru dynastic saga',
      },
      {
        stepOrder: 2,
        eraOrPhase: 'Stage 2 • Gurukula Test of Concentration',
        eventDescription: 'During Dronacharya’s archery test, young Arjuna sees only the eye of the wooden bird on the tree branch.',
        answer: 'ARJUNA',
        clue: 'Pandava archer who saw only the bird’s eye during Gurukula training under Drona',
      },
      {
        stepOrder: 3,
        eraOrPhase: 'Stage 3 • The Swayamvara in Panchala',
        eventDescription: 'Following the archery challenge in Panchala, Princess Draupadi becomes the queen of the Pandavas.',
        answer: 'DRAUPADI',
        clue: 'Princess of Panchala wedded after the archery challenge and queen of Indraprastha',
      },
      {
        stepOrder: 4,
        eraOrPhase: 'Stage 4 • Thirteen Years of Forest Trial',
        eventDescription: 'During twelve years of forest exile and one year incognito, Bhima protects his brothers with unwavering strength.',
        answer: 'BHIMA',
        clue: 'Mace-wielding second Pandava who safeguarded his family throughout the forest exile',
      },
      {
        stepOrder: 5,
        eraOrPhase: 'Stage 5 • Wise Discernment Before Battle',
        eventDescription: 'Before the conflict at Kurukshetra, scholars and warriors are called to exercise moral discernment between right and wrong.',
        answer: 'VIVEKA',
        clue: 'Sanskrit term for clear moral discernment between righteousness and adharma',
      },
      {
        stepOrder: 6,
        eraOrPhase: 'Stage 6 • Yato Dharmas Tato Jayah',
        eventDescription: 'At the conclusion of the eighteen-day war, moral order prevails, affirming that where there is Dharma, there is victory.',
        answer: 'VICTORY',
        clue: 'Final outcome taught by Yato Dharmas Tato Jayah: triumph rests where righteousness stands',
      },
    ],
  }),
  gita: buildCuratedChronologicalCrossword({
    id: 'gita-6-17-chronological',
    title: 'Bhagavad Gita 6.17: Chronological Student Daily Cycle',
    theme: 'Follow the sequential daily rhythm of a balanced student from restorative sleep and sattvic nourishment to focused study and inner peace.',
    summary:
      'Trace the chronological progression taught in Bhagavad Gita Verse 6.17: how regulated daily habits from morning waking to evening reflection eliminate sorrow.',
    events: [
      {
        stepOrder: 1,
        eraOrPhase: 'Phase 1 • Restorative Sleep & Timely Waking',
        eventDescription: 'The student begins the daily cycle with regulated sleep and timely morning wakefulness (yukta-swapnavabodhasya).',
        answer: 'SLEEP',
        clue: 'Restorative nightly rest and timely waking that begins a balanced student’s day',
      },
      {
        stepOrder: 2,
        eraOrPhase: 'Phase 2 • Sattvic Nourishment (Yuktahara)',
        eventDescription: 'Wholesome, balanced meals nourish the body and sharpen mental clarity without lethargy.',
        answer: 'DIET',
        clue: 'Regulated, wholesome food intake (yuktahara) that fuels morning vitality',
      },
      {
        stepOrder: 3,
        eraOrPhase: 'Phase 3 • Disciplined Study & Duty (Yukta-Karmasu)',
        eventDescription: 'During study hours, the student performs academic duties with steady concentration and zero procrastination.',
        answer: 'WISDOM',
        clue: 'Deep understanding cultivated during focused daily study and inquiry',
      },
      {
        stepOrder: 4,
        eraOrPhase: 'Phase 4 • Balanced Recreation & Vitality (Vihara)',
        eventDescription: 'Scheduled outdoor movement and wholesome recreation renew physical stamina and prevent burnout.',
        answer: 'HEALTH',
        clue: 'Physical and mental vitality preserved through balanced daily recreation (vihara)',
      },
      {
        stepOrder: 5,
        eraOrPhase: 'Phase 5 • Steadying the Inner Faculty (Dhyana)',
        eventDescription: 'Through daily regulation, the restless intellect becomes a disciplined friend rather than an enemy.',
        answer: 'MIND',
        clue: 'Inner faculty trained through daily discipline to remain steady in meditation',
      },
      {
        stepOrder: 6,
        eraOrPhase: 'Phase 6 • Freedom from Stress & Lasting Peace',
        eventDescription: 'As the result of regulated sleep, diet, work, and recreation, all sorrow and anxiety dissolve into serene peace.',
        answer: 'SHANTI',
        clue: 'Profound inner peace achieved at the culmination of a regulated, balanced life',
      },
    ],
  }),
};

