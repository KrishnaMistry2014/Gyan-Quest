export interface SectionQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChapterSubtopic {
  heading: string;
  content: string;
}

export interface IndusChapterSection {
  id: string;
  number: number;
  shortTitle: string;
  title: string;
  readMinutes: number;
  leadParagraph: string;
  paragraphs: string[];
  subtopics?: ChapterSubtopic[];
  historianNote?: {
    title: string;
    text: string;
  };
  visualType?:
    | 'timeline'
    | 'map'
    | 'sites-table'
    | 'town-planning'
    | 'dholavira-water'
    | 'crafts-gallery'
    | 'evidence-vs-hypothesis'
    | 'transition-timeline'
    | 'quick-revision'
    | 'glossary';
  questions: SectionQuizQuestion[];
}

export interface TimelinePhase {
  id: string;
  phase: string;
  dates: string;
  eraTag: string;
  summary: string;
  keyDevelopments: string[];
  keySites: string[];
}

export interface ArchaeologicalSiteEntry {
  id: string;
  name: string;
  presentLocation: string;
  regionRiver: string;
  phaseHighlight: string;
  discoveries: string[];
  historicalImportance: string;
  mapCoords: { x: number; y: number };
}

export interface CraftArtefactEntry {
  id: string;
  category: string;
  materialsUsed: string;
  examples: string;
  techniquesAndSignificance: string;
  archaeologicalNote: string;
}

export interface KeyFactCardItem {
  id: string;
  category: 'Dates' | 'People' | 'Places' | 'Artefacts' | 'Concepts';
  title: string;
  frontSummary: string;
  backDetail: string;
  sectionRef: number;
}

export interface GlossaryItem {
  term: string;
  pronunciationHint?: string;
  category: 'Core Concept' | 'Archaeology' | 'Urban Life & Craft' | 'Economy & Writing';
  definition: string;
  exampleInChapter: string;
}

export interface EvidenceSortingItem {
  id: string;
  statement: string;
  type: 'evidence' | 'interpretation';
  explanation: string;
}

export interface PracticeQuestionItem {
  id: string;
  question: string;
  modelAnswer: string;
}

export const INDUS_CHAPTER_META = {
  id: 'history_indus_valley_6_8',
  uniqueCode: '2600190021',
  title: 'The Indus Valley Civilization',
  subtitle:
    "Discover the cities, people, technology, trade, and mysteries of one of the world's earliest urban civilizations.",
  targetAudience: 'NCERT Classes 6–8',
  subjectTag: 'History · Ancient Civilizations · Urban Archaeology',
  chapterQuestion: 'How did people build and sustain one of the world’s earliest urban civilizations?',
  learningGoals: [
    'Locate the civilization’s broad geographical extent across present-day Pakistan and India and place its main phases on a chronological timeline.',
    'Describe Harappan town planning, baked-brick architecture, covered drainage, water reservoirs, agriculture, crafts, and long-distance trade.',
    'Identify key archaeological sites—Harappa, Mohenjo-daro, Dholavira, Lothal, Kalibangan, Rakhigarhi, and Mehrgarh—and explain what their discoveries reveal.',
    'Distinguish clearly between solid archaeological evidence and historical interpretations that remain uncertain while the Indus script is undeciphered.',
  ],
};

export const TIMELINE_PHASES: TimelinePhase[] = [
  {
    id: 'pre-harappan',
    phase: 'Early Farming & Herding Communities',
    dates: 'Before c. 3300 BCE (from c. 7000 BCE at Mehrgarh)',
    eraTag: 'Neolithic & Chalcolithic Roots',
    summary:
      'Long before large cities existed, communities in the northwestern hills and plains domesticated wheat, barley, cattle, sheep, and goats, gradually learning pottery and copper working.',
    keyDevelopments: [
      'Transition from hunting-gathering to settled agriculture and animal herding.',
      'Mud-brick houses and storage compartments for surplus grain.',
      'Early craft traditions including bone tools, handmade pottery, and stone/shell ornaments.',
    ],
    keySites: ['Mehrgarh (Balochistan, Pakistan)', 'Kili Gul Mohammad', 'Bhirrana (early levels)'],
  },
  {
    id: 'early-harappan',
    phase: 'Early Harappan Phase',
    dates: 'Approximately 3300–2600 BCE',
    eraTag: 'Regional Towns & Growing Networks',
    summary:
      'Farming villages expanded into larger towns across the Indus and Ghaggar-Hakra plains. Regional craft styles, wheel-made pottery, fortified walls, and trade networks began connecting distant communities.',
    keyDevelopments: [
      'Spread of settled agricultural towns across river plains.',
      'Early street layouts, mud-brick fortifications, and standardized brick ratios.',
      'Growth of regional trade in stone, shells, and copper ores.',
    ],
    keySites: ['Kot Diji', 'Amri', 'Kalibangan (Early Phase)', 'Harappa (Early levels)', 'Rakhigarhi (Early levels)'],
  },
  {
    id: 'mature-harappan',
    phase: 'Mature Harappan Phase',
    dates: 'Approximately 2600–1900 BCE',
    eraTag: 'Peak Urban Civilization',
    summary:
      'The full urban peak of the civilization. Major planned cities flourished with baked-brick architecture, covered street drainage, reservoirs, carved steatite seals, the Indus script, standardized weights, and maritime trade.',
    keyDevelopments: [
      'Large planned urban centres with raised and lower town sectors.',
      'Sophisticated water engineering: neighbourhood wells, household bathing floors, covered street drains, and rock-cut reservoirs.',
      'Widespread use of the Indus script on seals, cubical chert weights, and long-distance trade with Oman, Iran, Afghanistan, and Mesopotamia.',
    ],
    keySites: ['Mohenjo-daro', 'Harappa', 'Dholavira', 'Rakhigarhi', 'Lothal', 'Kalibangan'],
  },
  {
    id: 'late-harappan',
    phase: 'Late Harappan Phase',
    dates: 'Approximately 1900–1300 BCE',
    eraTag: 'Gradual Urban Transformation',
    summary:
      'Many large cities gradually shrank or changed in how they were used. Long-distance trade, seals with script, and standardized weights declined, while smaller rural settlements and regional cultures continued and expanded into new areas.',
    keyDevelopments: [
      'Gradual de-urbanization of major metropolitan centres like Mohenjo-daro and Harappa.',
      'Disappearance of carved steatite seals, the Indus script, and standardized cubical weights.',
      'Shift of populations toward smaller villages and towns in eastern Punjab, Haryana, western Uttar Pradesh, and Gujarat.',
    ],
    keySites: ['Cemetery H at Harappa', 'Rangpur', 'Rojdi', 'Mitathal', 'Hulas'],
  },
];

export const ARCHAEOLOGICAL_SITES: ArchaeologicalSiteEntry[] = [
  {
    id: 'harappa',
    name: 'Harappa',
    presentLocation: 'Punjab, Pakistan',
    regionRiver: 'Near the old course of the Ravi River (an Indus tributary)',
    phaseHighlight: 'Early to Late Harappan (Excavated 1921)',
    discoveries: [
      'Baked-brick fortifications, gateways, and residential quarters',
      'Large brick platforms and multi-room storage structures (traditionally called granaries)',
      'Carved steatite seals, terracotta figurines, stone weights, and cemetery burials (R-37 and Cemetery H)',
      'Workshops for shell, agate, and copper working',
    ],
    historicalImportance:
      'The first major site excavated (by Daya Ram Sahni in 1921), giving the entire culture its archaeological name: the Harappan Civilization.',
    mapCoords: { x: 295, y: 155 },
  },
  {
    id: 'mohenjo-daro',
    name: 'Mohenjo-daro',
    presentLocation: 'Sindh, Pakistan',
    regionRiver: 'Indus River plain (Larkana District)',
    phaseHighlight: 'Mature Harappan Metropolis (Excavated 1922)',
    discoveries: [
      'The Great Bath—a watertight brick tank sealed with natural bitumen',
      'Extensive planned streets, multi-story brick houses, and hundreds of brick-lined wells',
      'Famous bronze figurine popularly called the "Dancing Girl"',
      'Carved steatite bust popularly called the "Priest-King" and numerous unicorn and Pashupati-motif seals',
    ],
    historicalImportance:
      'One of the largest and best-preserved cities of the Mature Harappan phase, demonstrating advanced civic sanitation, brick architecture, and bronze casting.',
    mapCoords: { x: 185, y: 295 },
  },
  {
    id: 'dholavira',
    name: 'Dholavira',
    presentLocation: 'Kachchh (Kutch), Gujarat, India',
    regionRiver: 'Khadir Bet island in the Rann of Kachchh (between seasonal streams Manhar and Mansar)',
    phaseHighlight: 'Early to Late Harappan (UNESCO World Heritage Site)',
    discoveries: [
      'Massive stone and rock-cut water reservoirs, dams, and stormwater channels',
      'Distinctive three-part city layout (Citadel, Middle Town, and Lower Town) built extensively with dressed stone as well as mud brick',
      'A large signboard inscription made of ten large gypsum-inlaid symbols',
      'Bead-making workshops and hemispherical monuments',
    ],
    historicalImportance:
      'Showcases extraordinary water harvesting and conservation engineering in a semi-arid environment, as well as stone architecture adapted to local geology.',
    mapCoords: { x: 235, y: 395 },
  },
  {
    id: 'lothal',
    name: 'Lothal',
    presentLocation: 'Gujarat, India',
    regionRiver: 'Near the Sabarmati/Bhogavo river delta close to the Gulf of Khambhat',
    phaseHighlight: 'Mature Harappan Trade & Craft Centre',
    discoveries: [
      'A large rectangular baked-brick basin connected by channels, often interpreted by archaeologists as a tidal dockyard',
      'A specialized bead-making factory with kilns, drills, and carnelian beads in stages of manufacture',
      'A warehouse structure containing clay sealings with impressions of cords and packing materials',
      'A circular Persian Gulf-style seal demonstrating maritime trade connections',
    ],
    historicalImportance:
      'Highlights Harappan craft specialization and maritime exchange linking western India with the Arabian Sea and West Asia.',
    mapCoords: { x: 285, y: 435 },
  },
  {
    id: 'kalibangan',
    name: 'Kalibangan',
    presentLocation: 'Hanumangarh District, Rajasthan, India',
    regionRiver: 'Along the dried bed of the Ghaggar River',
    phaseHighlight: 'Early & Mature Harappan Settlement',
    discoveries: [
      'An Early Harappan ploughed agricultural field with two sets of furrows at right angles, suggesting two crops were grown together',
      'Fortified Citadel and Lower Town with mud-brick and baked-brick construction',
      'Rows of oval clay structures containing ash and terracotta cakes, often described as fire installations or fire altars',
      'Distinctive incised pottery and cylindrical seals',
    ],
    historicalImportance:
      'Provides the earliest direct archaeological evidence of a ploughed field in South Asia and preserves a clear transition from Early to Mature Harappan town planning.',
    mapCoords: { x: 345, y: 215 },
  },
  {
    id: 'rakhigarhi',
    name: 'Rakhigarhi',
    presentLocation: 'Hisar District, Haryana, India',
    regionRiver: 'Ghaggar-Hakra plain (Chautang/Drishadvati river zone)',
    phaseHighlight: 'Early to Mature Harappan Mega-Site',
    discoveries: [
      'Seven interconnected mounds spanning one of the largest known settlement areas of the Harappan world',
      'Planned mud-brick and baked-brick streets, drainage systems, and craft production zones',
      'Workshops producing steatite beads, shell bangles, terracotta figurines, and copper objects',
      'Skeletal remains from a Harappan cemetery providing bio-archaeological and ancient DNA insights',
    ],
    historicalImportance:
      'Demonstrates the massive scale and long, continuous indigenous development of Harappan urban life in the eastern Ghaggar-Hakra plains of India.',
    mapCoords: { x: 390, y: 205 },
  },
  {
    id: 'mehrgarh',
    name: 'Mehrgarh',
    presentLocation: 'Balochistan, Pakistan',
    regionRiver: 'Kacchi Plain near the Bolan Pass (west of the Indus Valley)',
    phaseHighlight: 'Early Farming Settlement (Beginning c. 7000 BCE)',
    discoveries: [
      'Remains of domesticated wheat and barley and bones of domesticated cattle, sheep, and goats',
      'Rectangular mud-brick houses divided into multiple small compartments used for grain storage',
      'Human burials with grave goods such as baskets, stone/shell beads, and animal bones',
      'Early evidence of cotton seeds/fibres and craft evolution from stone tools to pottery and copper',
    ],
    historicalImportance:
      'Although an earlier Neolithic and Chalcolithic site rather than a Harappan city, Mehrgarh reveals the millennia-long agricultural and craft foundations that preceded Indus urbanism.',
    mapCoords: { x: 135, y: 225 },
  },
];

export const HARAPPAN_CRAFTS: CraftArtefactEntry[] = [
  {
    id: 'pottery',
    category: 'Pottery & Ceramics',
    materialsUsed: 'Fine alluvial clay, red slip, black mineral pigment',
    examples: 'Wheel-turned storage jars, S-shaped vessels, perforated jars, goblets, cooking pots, and painted bowls.',
    techniquesAndSignificance:
      'Shaped on a fast potter’s wheel and fired in kilns. Many vessels were coated with a bright red slip and painted in black with geometric patterns, intersecting circles, peepal leaves, fish scales, and peacocks.',
    archaeologicalNote:
      'Because broken pottery shards (potsherds) do not decay in soil, archaeologists use pottery styles to date layers of excavation and trace cultural links.',
  },
  {
    id: 'beads',
    category: 'Bead-Making & Lapidary Art',
    materialsUsed: 'Carnelian (reddish stone), agate, jasper, lapis lazuli, steatite, shell, terracotta, copper, gold',
    examples: 'Long barrel-cylinder carnelian beads, etched carnelian beads with white designs, micro-beads of steatite.',
    techniquesAndSignificance:
      'Craftspeople heated yellowish chalcedony nodules to deepen their rich red carnelian colour, chipped and ground them, and drilled tiny holes using specialized hard-stone drills (Ernestite).',
    archaeologicalNote:
      'Workshops at Chanhudaro, Lothal, and Dholavira preserve stone drills, unfinished beads, and bead kilns. Harappan etched carnelian beads found in Mesopotamian royal tombs prove long-distance exchange.',
  },
  {
    id: 'metalworking',
    category: 'Metalworking (Copper, Bronze, Gold, Silver)',
    materialsUsed: 'Copper, tin/arsenic alloys (bronze), gold, silver',
    examples: 'Flat axes, chisels, knives, spearheads, fishhooks, razors, mirrors, copper vessels, and fine jewellery.',
    techniquesAndSignificance:
      'Metallurgists smelted copper ore and alloyed copper with tin or arsenic to make harder bronze. They also used the "lost-wax" (cire perdue) casting technique to create detailed bronze sculptures.',
    archaeologicalNote:
      'Noticeably, Harappan metalworkers focused heavily on practical tools, vessels, and ornaments rather than large caches of heavy military weaponry.',
  },
  {
    id: 'shell-faience',
    category: 'Shell Working & Faience',
    materialsUsed: 'Marine conch shells (Turbinella pyrum) and artificial glazed paste (faience)',
    examples: 'Shell bangles, ladles, inlays, and tiny blue-green glazed faience pots, beads, and squirrel/ram figurines.',
    techniquesAndSignificance:
      'Coastal sites like Nageshwar and Balakot specialized in cutting marine shells. Faience was a high-tech artificial material made by grinding quartz/sand, mixing it with gum and metallic glaze, and firing it to create a glassy blue or sea-green surface.',
    archaeologicalNote:
      'Because faience was difficult and labour-intensive to manufacture, faience miniature pots and ornaments were likely valued luxury items.',
  },
  {
    id: 'seals',
    category: 'Carved Steatite Seals',
    materialsUsed: 'Steatite (soft soapstone), whitened and hardened by firing',
    examples: 'Square stamps featuring the one-horned "unicorn", humped bull, elephant, rhinoceros, tiger, and short script lines.',
    techniquesAndSignificance:
      'Carved in intaglio (sunken relief) with fine copper/stone burins and fitted with a perforated boss on the back so a cord could pass through. When pressed into wet clay on cargo knots, they left a raised impression.',
    archaeologicalNote:
      'Over 4,000 seals and inscribed objects have been recovered. Clay tags (sealings) found at Lothal and in Mesopotamia show rope and cloth marks on the back.',
  },
  {
    id: 'weights',
    category: 'Standardized Weights & Measures',
    materialsUsed: 'Hard,banded chert stone, carefully ground and polished into cubes',
    examples: 'Cubical weights without markings, graduated in a consistent binary and decimal ratio.',
    techniquesAndSignificance:
      'Smaller weights followed a binary progression (1, 2, 4, 8, 16, 32, 64, where the base unit is roughly 0.85–0.87 grams; 16 units ≈ 13.65 grams), while larger weights followed decimal multiples (160, 200, 320, 640).',
    archaeologicalNote:
      'Finding identical weight standards across settlements hundreds of kilometres apart suggests shared commercial rules and careful regulation of trade.',
  },
  {
    id: 'terracotta',
    category: 'Terracotta Figurines & Models',
    materialsUsed: 'Pinched and moulded river clay baked in fire (terracotta)',
    examples: 'Animal figures (bulls, dogs, birds), human figurines with elaborate headdresses, toy carts with solid wheels, bird whistles, and rattles.',
    techniquesAndSignificance:
      'Made quickly by hand using pinching and appliqué (attaching clay strips for eyes, necklaces, and headdresses). Miniature terracotta carts show how real wooden bullock carts were built.',
    archaeologicalNote:
      'While some human and animal figurines were clearly children’s toys, others with elaborate ornaments may have served household or ritual functions; their exact meanings remain debated.',
  },
  {
    id: 'famous-sculptures',
    category: 'Famous Sculptures: "Dancing Girl" & "Priest-King"',
    materialsUsed: 'Lost-wax cast bronze ("Dancing Girl", ~10.5 cm tall) and carved steatite with trefoil cloak ("Priest-King", ~17.5 cm tall)',
    examples: 'Both discovered at Mohenjo-daro during the 1920s excavations.',
    techniquesAndSignificance:
      'The bronze statuette portrays a confident young woman wearing stacked bangles on her left arm. The bearded stone bust wears a fillet headband, armband, and a cloak carved with trefoil patterns originally filled with red paste.',
    archaeologicalNote:
      'IMPORTANT HISTORICAL CAUTION: "Dancing Girl" and "Priest-King" are modern nicknames given by 20th-century archaeologists. We do not know who these individuals actually were or what roles they held in Harappan society.',
  },
];

export const KEY_FACT_CARDS: KeyFactCardItem[] = [
  {
    id: 'kf-1',
    category: 'Dates',
    title: 'c. 2600–1900 BCE',
    frontSummary: 'The Mature Harappan Phase (Urban Peak)',
    backDetail:
      'During these roughly 700 years, planned cities, baked-brick drainage, the Indus script, steatite seals, standardized weights, and long-distance maritime trade reached their height. (Dates are approximate and vary by site.)',
    sectionRef: 2,
  },
  {
    id: 'kf-2',
    category: 'Dates',
    title: '1921, 1922 & 1924',
    frontSummary: 'Excavations & World Announcement',
    backDetail:
      'Daya Ram Sahni excavated Harappa in 1921; R. D. Banerji began excavating Mohenjo-daro in 1922; and Sir John Marshall, Director-General of the ASI, announced the discovery of the Indus Valley Civilization to the world in 1924.',
    sectionRef: 4,
  },
  {
    id: 'kf-3',
    category: 'People',
    title: 'Daya Ram Sahni & R. D. Banerji',
    frontSummary: 'Pioneering Indian Archaeologists',
    backDetail:
      'Indian archaeologists of the Archaeological Survey of India whose excavations at Harappa (Punjab) and Mohenjo-daro (Sindh) demonstrated that the seals and brick ruins belonged to a single, pre-Mauryan bronze-age civilization.',
    sectionRef: 4,
  },
  {
    id: 'kf-4',
    category: 'Places',
    title: 'Mohenjo-daro (Sindh, Pakistan)',
    frontSummary: 'Home of the Great Bath & Covered Street Drains',
    backDetail:
      'One of the largest Mature Harappan cities, built with raised and lower town sectors, over 700 brick-lined wells, the bitumen-sealed Great Bath, and the find-spot of the "Dancing Girl" and "Priest-King".',
    sectionRef: 5,
  },
  {
    id: 'kf-5',
    category: 'Places',
    title: 'Dholavira (Kachchh, Gujarat)',
    frontSummary: 'Masterpiece of Arid-Zone Water Harvesting',
    backDetail:
      'Located on Khadir Bet island in the Rann of Kachchh, Dholavira channeled seasonal streams into interconnected rock-cut and stone-masonry reservoirs, and featured a 10-symbol signboard inscription.',
    sectionRef: 7,
  },
  {
    id: 'kf-6',
    category: 'Places',
    title: 'Lothal, Kalibangan & Rakhigarhi',
    frontSummary: 'Key Indian Sites of Trade, Farming & Scale',
    backDetail:
      'Lothal (Gujarat) had a bead factory and a brick basin often interpreted as a dockyard; Kalibangan (Rajasthan) preserved an Early Harappan ploughed field; Rakhigarhi (Haryana) is one of the largest known Harappan settlements.',
    sectionRef: 5,
  },
  {
    id: 'kf-7',
    category: 'Places',
    title: 'Mehrgarh (Balochistan, Pakistan)',
    frontSummary: 'Early Farming Precursor (from c. 7000 BCE)',
    backDetail:
      'An earlier Neolithic and Chalcolithic settlement near the Bolan Pass that shows how wheat/barley cultivation, animal domestication, mud-brick storage, and early crafts developed in the wider region before Harappan cities arose.',
    sectionRef: 2,
  },
  {
    id: 'kf-8',
    category: 'Artefacts',
    title: 'Steatite Seals & Undeciphered Script',
    frontSummary: 'Carved Stamp Seals with Animal Motifs & Signs',
    backDetail:
      'Square soapstone seals carved with animals and short lines of the Indus script. Clay impressions show they sealed bundles of trade goods, but because the script remains undeciphered, we cannot read their words.',
    sectionRef: 10,
  },
  {
    id: 'kf-9',
    category: 'Artefacts',
    title: 'Cubical Chert Weights',
    frontSummary: 'Standardized System of Measurement',
    backDetail:
      'Polished stone cubes made of banded chert that followed consistent weight ratios (1, 2, 4, 8, 16, 32, 64) across distant cities, supporting fair and organized trade.',
    sectionRef: 11,
  },
  {
    id: 'kf-10',
    category: 'Concepts',
    title: 'Meluhha in Mesopotamian Texts',
    frontSummary: 'Ancient Maritime Trade Connection',
    backDetail:
      'Cuneiform clay tablets from Mesopotamia (modern Iraq) describe ships arriving from a distant land called "Meluhha" carrying carnelian, ivory, timber, and copper. Many scholars identify Meluhha with the Indus region.',
    sectionRef: 11,
  },
  {
    id: 'kf-11',
    category: 'Concepts',
    title: 'Evidence vs. Historical Interpretation',
    frontSummary: 'Thinking Like an Archaeologist',
    backDetail:
      'Bricks, drains, seeds, bones, and seals are proven archaeological evidence. Ideas about who ruled the cities, whether the Great Bath was religious, or who the "Priest-King" was remain hypotheses because the script is undeciphered.',
    sectionRef: 12,
  },
  {
    id: 'kf-12',
    category: 'Concepts',
    title: 'Gradual Transformation (After c. 1900 BCE)',
    frontSummary: 'Multiple Regional Factors, Not a Sudden Disappearance',
    backDetail:
      'After c. 1900 BCE, climate and monsoon shifts, changing river courses, and evolving trade networks led to a gradual transformation. Large cities shrank, while people continued living in smaller settlements and regional cultures.',
    sectionRef: 13,
  },
];

export const EVIDENCE_SORTING_ITEMS: EvidenceSortingItem[] = [
  {
    id: 'ev-1',
    statement: 'Harappan farmers grew wheat, barley, sesame, and pulses, and raised cattle, sheep, and goats.',
    type: 'evidence',
    explanation:
      'Direct archaeological evidence: archaeobotanists and archaeozoologists have recovered charred seeds/grains and animal bones from excavated soil layers.',
  },
  {
    id: 'ev-2',
    statement: 'A single powerful Priest-King ruled both Mohenjo-daro and Harappa as one unified empire.',
    type: 'interpretation',
    explanation:
      'Uncertain interpretation: "Priest-King" is a modern label for a stone bust, and archaeologists have found no deciphered royal inscriptions or proven evidence of a single emperor.',
  },
  {
    id: 'ev-3',
    statement: 'Household bathing floors at Mohenjo-daro sloped toward brick channels that connected to covered street drains.',
    type: 'evidence',
    explanation:
      'Direct archaeological evidence: excavated brick houses, sloped floors, wall outlets, and covered street drains are physically preserved at Mohenjo-daro.',
  },
  {
    id: 'ev-4',
    statement: 'The Great Bath at Mohenjo-daro was used for sacred religious purification ceremonies by priests.',
    type: 'interpretation',
    explanation:
      'Hypothesis/interpretation: while the watertight tank is an archaeological fact, its exact ritual or communal purpose is an educated hypothesis because we have no readable texts explaining how it was used.',
  },
  {
    id: 'ev-5',
    statement: 'Craftspeople at Lothal and Chanhudaro drilled carnelian beads and traded goods with regions around the Arabian Gulf and Mesopotamia.',
    type: 'evidence',
    explanation:
      'Direct archaeological evidence: bead kilns, stone micro-drills, unfinished carnelian beads, and Harappan-style seals/beads excavated in Oman and Mesopotamia confirm this.',
  },
  {
    id: 'ev-6',
    statement: 'All terracotta female figurines found in Harappan homes represent a single supreme Mother Goddess worshipped by every family.',
    type: 'interpretation',
    explanation:
      'Debated interpretation: while terracotta figurines are real finds, their exact uses—whether votive offerings, ritual images, dolls, or protective figures—cannot be proven without deciphered texts.',
  },
];

export const GLOSSARY_TERMS: GlossaryItem[] = [
  {
    term: 'Civilization',
    category: 'Core Concept',
    definition:
      'A complex human society marked by planned towns or cities, specialized crafts and occupations, organized trade, shared standards or writing systems, and surplus food production.',
    exampleInChapter:
      'The Indus Valley Civilization was one of the world’s earliest urban civilizations alongside Mesopotamia and ancient Egypt.',
  },
  {
    term: 'Archaeology',
    category: 'Archaeology',
    definition:
      'The scientific study of human history and prehistory through the careful excavation and analysis of buildings, tools, pottery, seeds, bones, and other physical remains.',
    exampleInChapter:
      'Because the Indus script is undeciphered, our knowledge of Harappan life comes primarily from archaeology.',
  },
  {
    term: 'Artifact',
    category: 'Archaeology',
    definition:
      'Any portable object made, shaped, or used by human beings in the past—such as a clay pot, a stone weight, a copper chisel, a carnelian bead, or a carved seal.',
    exampleInChapter:
      'Thousands of Harappan artifacts help historians understand ancient technology, daily life, and trade.',
  },
  {
    term: 'Harappan',
    category: 'Core Concept',
    definition:
      'Relating to the Indus Valley Civilization or its people and culture, named after Harappa in Punjab (Pakistan), the first site where the civilization was identified in 1921.',
    exampleInChapter:
      'Archaeologists use "Harappan" to describe sites located even far outside the Indus River valley itself, such as Lothal and Rakhigarhi.',
  },
  {
    term: 'Mature Harappan phase',
    category: 'Core Concept',
    definition:
      'The main urban period of the Indus Valley Civilization (approximately 2600–1900 BCE), when planned cities, baked-brick drains, standardized weights, the Indus script, and long-distance trade were at their peak.',
    exampleInChapter:
      'Great cities like Mohenjo-daro, Harappa, Dholavira, and Rakhigarhi flourished during the Mature Harappan phase.',
  },
  {
    term: 'Drainage',
    category: 'Urban Life & Craft',
    definition:
      'A planned network of channels, pipes, sumps, and covered street conduits built to carry dirty wastewater and rainwater safely away from houses and neighbourhoods.',
    exampleInChapter:
      'Harappan cities are famous for covered brick street drainage systems with removable slabs for regular cleaning.',
  },
  {
    term: 'Seal',
    category: 'Economy & Writing',
    definition:
      'A small, finely carved stamp (usually made of fired steatite stone) bearing animal motifs and symbols of the Indus script, pressed into wet clay to mark or secure bundles of goods.',
    exampleInChapter:
      'Clay sealings found at Lothal show seal impressions on the front and rope and cloth marks on the back.',
  },
  {
    term: 'Script',
    category: 'Economy & Writing',
    definition:
      'A system of written signs or symbols used to record language or information. The Indus script consists of short sequences of symbols carved on seals, pottery, and tablets.',
    exampleInChapter:
      'Despite over a century of research, the Indus script has not yet been conclusively deciphered.',
  },
  {
    term: 'Faience',
    category: 'Urban Life & Craft',
    definition:
      'An artificially manufactured glazed material made by mixing powdered quartz or sand with a sticky binder and firing it with mineral colourants to produce a shiny blue or sea-green glassy surface.',
    exampleInChapter:
      'Harappan craftspeople used faience to craft delicate beads, bangles, tiny vessels, and miniature animal figurines.',
  },
  {
    term: 'Reservoir',
    category: 'Urban Life & Craft',
    definition:
      'A large artificial tank or rock-cut basin constructed to collect and store water for drinking, household use, and farming during dry months.',
    exampleInChapter:
      'Dholavira in Gujarat was surrounded by a series of interconnected stone and rock-cut reservoirs fed by seasonal streams.',
  },
  {
    term: 'Excavation',
    category: 'Archaeology',
    definition:
      'The systematic, layer-by-layer uncovering and recording of buried archaeological remains, structures, and artifacts at a historical site.',
    exampleInChapter:
      'Excavations at Harappa in 1921 and Mohenjo-daro in 1922 revealed a previously unknown urban civilization.',
  },
  {
    term: 'Trade',
    category: 'Economy & Writing',
    definition:
      'The exchange of raw materials (such as copper, timber, shells, and semi-precious stones) and finished goods (such as beads, pottery, and textiles) between communities locally or across long distances.',
    exampleInChapter:
      'Harappan trade networks connected settlements across South Asia with Afghanistan, Iran, Oman, and Mesopotamia.',
  },
];

export const PRACTICE_QUESTIONS: PracticeQuestionItem[] = [
  {
    id: 'pq-1',
    question: 'Describe three key features of Mature Harappan town planning and explain why we should not assume every city was identical.',
    modelAnswer:
      'Three major features of Mature Harappan town planning were: (1) planned streets and lanes arranged in organized patterns; (2) widespread use of mud bricks and baked bricks made in standardized proportions (often 1:2:4); and (3) distinct city sectors (such as raised platforms and lower residential areas) along with courtyards, wells, and covered drains. However, cities were not identical: Mohenjo-daro and Harappa had two main parts, whereas Dholavira was divided into three distinct zones and built heavily with stone, showing that local geography and community choices shaped each settlement.',
  },
  {
    id: 'pq-2',
    question: 'How did wells, household drains, and reservoirs support urban life in Harappan settlements?',
    modelAnswer:
      'Brick-lined neighbourhood wells provided residents with clean drinking and household water close to home. Sloped brick bathing floors and household drains carried wastewater out into covered street drains equipped with inspection sumps, keeping streets sanitary and reducing disease in crowded cities. In drier regions like Dholavira (Kachchh), stone channels and deep rock-cut reservoirs captured seasonal rainwater from streams so the city could survive long dry periods.',
  },
  {
    id: 'pq-3',
    question: 'Name four important Harappan archaeological sites (plus Mehrgarh) and state what each site reveals.',
    modelAnswer:
      '(1) Harappa (Punjab, Pakistan): the first excavated site (1921), revealing brick platforms, craft workshops, seals, and burials. (2) Mohenjo-daro (Sindh, Pakistan): famous for the Great Bath, covered drainage, hundreds of wells, and the "Dancing Girl" and "Priest-King" sculptures. (3) Dholavira (Gujarat, India): reveals advanced rock-cut water reservoirs, stone architecture, and a 10-sign signboard. (4) Lothal (Gujarat, India): reveals a carnelian bead factory, warehouse sealings, and a large brick basin often interpreted as a dockyard. (5) Kalibangan (Rajasthan, India): reveals an Early Harappan ploughed field with criss-cross furrows. (Mehrgarh in Balochistan is an earlier farming settlement showing how agriculture and herding developed before Harappan cities.)',
  },
  {
    id: 'pq-4',
    question: 'Explain how farming, specialized crafts, and long-distance trade depended on one another in the Harappan economy.',
    modelAnswer:
      'Farmers in fertile river plains grew crops like wheat, barley, pulses, sesame, and cotton and raised cattle, sheep, and goats, producing food surpluses that fed city craftspeople. In turn, specialized craftspeople needed raw materials that were not found locally—such as copper from Rajasthan or Oman, carnelian from Gujarat, and lapis lazuli from Afghanistan. Traders used river boats, bullock carts, and sea vessels (reaching Oman and Mesopotamia/Meluhha) alongside standardized chert weights and steatite seals to move raw materials to workshops and distribute finished beads, tools, and textiles.',
  },
  {
    id: 'pq-5',
    question: 'Why must historians be careful when discussing Harappan religion, government, and writing?',
    modelAnswer:
      'Historians must be careful because the Indus script has not been conclusively deciphered. Most inscriptions on seals and pottery are very short, and no bilingual inscription (like the Rosetta Stone) has been found. Therefore, while archaeologists have physical evidence of statues, figurines, seals, and the Great Bath, labels such as "Priest-King", "Dancing Girl", "Mother Goddess", or "ritual bath" are modern interpretations rather than proven facts.',
  },
  {
    id: 'pq-6',
    question: 'Give three possible factors behind the transformation of major Harappan urban centres after about 1900 BCE.',
    modelAnswer:
      'Scholars study multiple interacting factors rather than a single sudden event: (1) climate and monsoon rainfall changes that led to drier conditions in parts of north-western South Asia; (2) shifts in river courses or the drying of channels in the Indus and Ghaggar-Hakra systems, which disrupted water supplies and flood-plain farming; and (3) declines in long-distance trade with Mesopotamia and the Arabian Gulf. As a result, urban life transformed gradually and people moved toward smaller settlements in regions with more reliable rainfall.',
  },
];

export const INDUS_CHAPTER_SECTIONS: IndusChapterSection[] = [
  {
    id: 'section-1',
    number: 1,
    shortTitle: 'Introduction',
    title: 'What Was the Indus Valley Civilization?',
    readMinutes: 4,
    leadParagraph:
      'More than 4,500 years ago, across the fertile river plains, semi-arid regions, and coastlines of north-western South Asia, people built one of the world’s earliest urban civilizations: the Indus Valley Civilization, also known as the Harappan Civilization.',
    paragraphs: [
      'Alongside the ancient civilizations of Mesopotamia (along the Tigris and Euphrates rivers in present-day Iraq) and Egypt (along the Nile River), the Indus Valley Civilization was one of the great urban societies of the Bronze Age. Its mature urban phase flourished between approximately 2600 BCE and 1900 BCE across large parts of present-day Pakistan and north-western and western India.',
      'Why does this civilization have two common names? When archaeologists first identified its cities in the 1920s, the earliest excavated sites were located along the Indus River and its tributaries, leading to the name "Indus Valley Civilization." However, archaeologists also follow the scientific custom of naming an ancient culture after the first site where it was recognized. Because Harappa (in Punjab, Pakistan) was the first site excavated in 1921, historians and textbooks equally call it the "Harappan Civilization." Today, "Harappan Civilization" is often preferred by archaeologists because hundreds of settlements have been discovered far beyond the Indus River valley—in the Ghaggar-Hakra plains of Haryana and Rajasthan, as well as along the coast and islands of Gujarat.',
      'The Harappan Civilization is historically important because its cities demonstrated remarkable practical engineering and civic organization. Residents built sturdy houses of mud brick and kiln-fired baked brick, laid out planned streets, dug neighbourhood wells, and constructed covered street drains that carried wastewater away from homes. Craftspeople produced painted pottery, copper and bronze tools, shell bangles, faience ornaments, and microscopic stone beads, while traders used standardized stone weights and carved seals to exchange goods across thousands of kilometres.',
      'Unlike Mesopotamia or Egypt, where scholars can read royal chronicles and temple inscriptions, the writing system of the Indus people—known as the Indus script—has not yet been conclusively deciphered. As a result, everything we know comes from archaeological evidence: the buildings, streets, drains, pots, tools, seeds, animal bones, and seals uncovered by excavation. Learning about the Harappans teaches us not only about ancient history, but also how historians separate solid physical evidence from ideas that remain uncertain.',
    ],
    subtopics: [
      {
        heading: 'Why Both Names Matter',
        content:
          '"Indus Valley Civilization" highlights the great river basin where the first cities were found, while "Harappan Civilization" honours Harappa (excavated in 1921) and reflects the fact that settlements spread across a much wider geographical area than the Indus valley alone.',
      },
      {
        heading: 'How We Know Without Deciphered Writing',
        content:
          'Archaeologists act like scientific detectives. By studying baked bricks, covered drains, charred grains of wheat and barley, stone weights, and craft workshops, they reconstruct how people lived, farmed, built, and traded—while remaining cautious about unspoken beliefs, laws, or rulers.',
      },
    ],
    questions: [
      {
        id: 's1-q1',
        question: 'Why is the Indus Valley Civilization also called the Harappan Civilization?',
        options: [
          'Because Harappa was the capital city ruled by an emperor named Harappa',
          'Because Harappa was the first major site excavated (in 1921) where this civilization was identified',
          'Because the Indus script was decoded at Harappa in 1924',
          'Because Harappa was the only settlement that used baked bricks',
        ],
        correctIndex: 1,
        explanation:
          'In archaeology, a culture is often named after the first site where its distinctive remains are identified. Harappa, excavated in 1921, gave the Harappan Civilization its name.',
      },
      {
        id: 's1-q2',
        question: 'Why do many details about Harappan government, laws, and religious beliefs remain uncertain today?',
        options: [
          'No Harappan cities have ever been excavated by archaeologists',
          'The Harappans did not make any artifacts, tools, or buildings',
          'The Indus script has not yet been conclusively deciphered, so we cannot read their written records',
          'All Harappan sites are underwater and cannot be visited',
        ],
        correctIndex: 2,
        explanation:
          'Because the Indus script remains undeciphered, historians must rely on physical archaeological evidence rather than readable written texts.',
      },
      {
        id: 's1-q3',
        question: 'Which of the following is a well-established feature of Mature Harappan settlements based on archaeological evidence?',
        options: [
          'Planned settlements with baked-brick buildings, drainage systems, and standardized weights',
          'Massive iron-walled castles and horse-drawn iron chariots',
          'Large stone pyramids built as tombs for pharaohs',
          'Printed paper books describing royal laws',
        ],
        correctIndex: 0,
        explanation:
          'Excavations across Mature Harappan cities consistently reveal baked-brick and mud-brick architecture, planned streets, drainage networks, craft production, and standardized stone weights.',
      },
    ],
  },
  {
    id: 'section-2',
    number: 2,
    shortTitle: 'Timeline & Background',
    title: 'Timeline and Historical Background',
    readMinutes: 5,
    leadParagraph:
      'Great cities do not appear overnight. The urban civilization of the Harappans grew gradually over thousands of years from earlier farming and herding communities in north-western South Asia.',
    paragraphs: [
      'Before the rise of towns and cities, small communities in the hills and river plains learned how to cultivate crops such as wheat and barley and how to domesticate animals such as cattle, sheep, and goats. One of the most important early farming settlements in the wider region is Mehrgarh (located in Balochistan, Pakistan, near the Bolan Pass), where evidence of farming, herding, and mud-brick houses begins around 7000 BCE—thousands of years before the Harappan cities.',
      'As agricultural communities produced surplus food and mastered crafts like pottery, bead-making, and copper working, settlements spread across the fertile plains of the Indus and Ghaggar-Hakra river systems. Archaeologists divide the history of the Harappan tradition into three main phases to understand how urban life developed, peaked, and later changed.',
      'During the Early Harappan phase (approximately 3300–2600 BCE), villages grew into larger towns across the plains. People built mud-brick fortifications, used the potter’s wheel, began making bricks in regular proportions, and exchanged raw materials like marine shells, stone, and copper across regional networks.',
      'During the Mature Harappan phase (approximately 2600–1900 BCE), the civilization reached its full urban peak. Large planned cities such as Mohenjo-daro, Harappa, Dholavira, Rakhigarhi, Kalibangan, and Lothal thrived. Baked-brick houses, covered street drains, public structures like the Great Bath, carved steatite seals bearing the Indus script, cubical chert weights, and long-distance maritime trade were widespread during these centuries.',
      'During the Late Harappan phase (approximately 1900–1300 BCE), many of the large urban centres gradually shrank or changed in how they were used. Long-distance trade, the carving of steatite seals with script, and standardized weights faded away, while smaller agricultural settlements and regional cultures continued and expanded in areas such as eastern Punjab, Haryana, western Uttar Pradesh, and Gujarat. Historians emphasize that all these dates are approximate and can vary from one archaeological site to another.',
    ],
    visualType: 'timeline',
    historianNote: {
      title: 'Why Chronological Dates Are Approximate',
      text: 'Archaeologists determine ancient dates using radiocarbon dating (C-14) of organic remains like charred seeds or wood charcoal, along with stratigraphy (the layers of soil in a mound). Because cities grew and changed at different paces in different regions, phase dates such as c. 2600–1900 BCE are approximate guideposts rather than exact calendar years.',
    },
    questions: [
      {
        id: 's2-q1',
        question: 'Which approximate time period corresponds to the Mature Harappan phase (the peak of urban cities, seals, and standardized weights)?',
        options: [
          'Approximately 7000–5000 BCE',
          'Approximately 3300–2600 BCE',
          'Approximately 2600–1900 BCE',
          'Approximately 1900–1300 BCE',
        ],
        correctIndex: 2,
        explanation:
          'The Mature Harappan phase dates to approximately 2600–1900 BCE, when major planned cities, covered drainage, seals, and long-distance trade were at their peak.',
      },
      {
        id: 's2-q2',
        question: 'What is the historical significance of early farming communities like Mehrgarh (before c. 3300 BCE)?',
        options: [
          'They show that farming, herding, mud-brick building, and early crafts developed gradually in the wider region long before Harappan cities arose',
          'They were built after the decline of Mohenjo-daro around 1000 BCE',
          'They prove that Harappan cities were built without any knowledge of agriculture',
          'They were industrial iron-smelting cities',
        ],
        correctIndex: 0,
        explanation:
          'Earlier farming and herding settlements such as Mehrgarh provide the long historical background of agriculture, animal domestication, and craft skills that preceded Harappan urbanism.',
      },
      {
        id: 's2-q3',
        question: 'Why do historians state that the dates of Early, Mature, and Late Harappan phases are approximate?',
        options: [
          'Because archaeologists never record layers during excavation',
          'Because transitions occurred gradually and could vary in timing across different sites and regions',
          'Because all Harappan cities were built and abandoned on the exact same day',
          'Because radiocarbon dating only works on modern plastic',
        ],
        correctIndex: 1,
        explanation:
          'Urban growth and transformation happened gradually over centuries and differed from site to site, so phase boundaries are approximate.',
      },
    ],
  },
  {
    id: 'section-3',
    number: 3,
    shortTitle: 'Geographical Extent',
    title: 'Geographical Extent and Environment',
    readMinutes: 5,
    leadParagraph:
      'The Harappan Civilization covered a remarkably vast and diverse territory across parts of present-day Pakistan and north-western and western India—an area much larger than either ancient Egypt or Mesopotamia.',
    paragraphs: [
      'In present-day Pakistan, Harappan settlements stretched across the provinces of Punjab, Sindh, and parts of Balochistan and Khyber Pakhtunkhwa. In present-day India, hundreds of Harappan sites have been excavated across Jammu, Punjab, Haryana, Rajasthan, Gujarat, and western Uttar Pradesh. Far to the north in Afghanistan, a trading settlement at Shortughai even connected the Harappans to sources of blue lapis lazuli stone.',
      'This vast region was not a single uniform landscape. It included fertile river plains, semi-arid scrublands, desert margins, mountain foothills, and coastal estuaries along the Arabian Sea. At the heart of this geography were two major river systems: first, the Indus River and its tributaries (such as the Jhelum, Chenab, Ravi, Beas, and Sutlej); and second, the Ghaggar-Hakra river system (flowing seasonally through parts of modern India and Pakistan, whose ancient channels and hydrology continue to be actively researched by earth scientists and archaeologists).',
      'Rivers were vital to Harappan life for three main reasons. First, seasonal floods deposited rich, soft alluvial silt across the plains, creating fertile soil for winter and summer crops. Second, rivers and wells supplied essential drinking and household water. Third, calm river channels served as natural highways for boats carrying heavy loads of timber, grain, stone, and pottery between settlements.',
      'Beyond the river plains, coastal settlements in Gujarat (such as Lothal, Dholavira, Nageshwar, and Somnath) and along the Makran coast (such as Sutkagen-dor and Balakot) gave Harappan communities access to marine shells, salt, fish, and sea routes across the Arabian Sea toward Oman and the Persian Gulf. Historians remind students that maps of the civilization show approximate site distributions rather than rigid modern political borders, because ancient river courses shifted over millennia and new sites continue to be discovered.',
    ],
    visualType: 'map',
    subtopics: [
      {
        heading: 'The Indus & Tributaries',
        content:
          'Melting snow from the Himalayas and seasonal monsoon rains fed the Indus and its Punjab tributaries, supporting major cities like Harappa (near the Ravi) and Mohenjo-daro (along the Indus in Sindh).',
      },
      {
        heading: 'The Ghaggar-Hakra Region',
        content:
          'A dense concentration of Early, Mature, and Late Harappan sites—including Kalibangan, Banawali, and Rakhigarhi—lies along the Ghaggar-Hakra river plain and its ancient tributary channels.',
      },
      {
        heading: 'Coastal & Island Settlements',
        content:
          'Settlements in Kachchh and Saurashtra (Gujarat) and on the Makran coast adapted to arid and maritime environments, harvesting rainwater and engaging in sea trade.',
      },
    ],
    questions: [
      {
        id: 's3-q1',
        question: 'Across which present-day countries were the main settlements of the Indus Valley Civilization distributed?',
        options: [
          'Present-day Egypt and Sudan',
          'Present-day Pakistan and north-western/western India (with a trading outpost in Afghanistan)',
          'Present-day Greece and Italy',
          'Present-day China and Mongolia',
        ],
        correctIndex: 1,
        explanation:
          'Harappan settlements spread across present-day Pakistan (Punjab, Sindh, Balochistan) and north-western and western India (Punjab, Haryana, Rajasthan, Gujarat, western UP, and Jammu), with an outpost at Shortughai in Afghanistan.',
      },
      {
        id: 's3-q2',
        question: 'How did rivers such as the Indus and its tributaries support Harappan settlements?',
        options: [
          'They provided fresh water, deposited fertile alluvial soil during floods, and served as boat routes for trade and travel',
          'They prevented any communication between villages and cities',
          'They were used only for hydro-electric power generation',
          'They contained no fish or water for crops',
        ],
        correctIndex: 0,
        explanation:
          'Rivers supplied drinking and irrigation water, replenished fertile silt on floodplains, and enabled boat transport of heavy goods.',
      },
      {
        id: 's3-q3',
        question: 'Why do historical maps of the Indus Valley Civilization avoid drawing rigid border lines or exact ancient river paths?',
        options: [
          'Because the Harappans lived only on boats and had no land settlements',
          'Because ancient river courses shifted over time and settlement boundaries are still being researched by archaeologists',
          'Because no Harappan site has ever been mapped',
          'Because ancient maps were printed on plastic',
        ],
        correctIndex: 1,
        explanation:
          'Ancient river channels shifted over thousands of years and archaeological surveys continue to refine our understanding of settlement distribution.',
      },
    ],
  },
  {
    id: 'section-4',
    number: 4,
    shortTitle: 'Discovery & Excavation',
    title: 'Discovery and Archaeological Excavation',
    readMinutes: 4,
    leadParagraph:
      'For more than three thousand years after its great cities transformed, the Harappan Civilization lay buried beneath earthen mounds—until archaeological excavations in the early 1920s transformed our understanding of world history.',
    paragraphs: [
      'Long before modern excavations began, local villagers in Punjab and Sindh knew of large ancient mounds of brick and pottery shards. In the 19th century, British travellers and engineers noticed baked bricks at Harappa; unfortunately, railway contractors in the 1850s even carried away thousands of ancient bricks from Harappa to lay track ballast for the Lahore–Multan railway line, without realizing how old the ruins were.',
      'In the 1870s, Sir Alexander Cunningham, the first Director-General of the Archaeological Survey of India (ASI), visited Harappa and examined several artifacts, including a smooth stone seal carved with a one-horned animal and strange symbols. However, because historians at that time believed urban life in India began much later in the Ganga valley, Cunningham did not realize that the seal belonged to a much older Bronze Age civilization.',
      'The breakthrough came in the early 1920s under the Archaeological Survey of India. In 1921, Indian archaeologist Daya Ram Sahni led systematic excavations at Harappa (in Punjab, now in Pakistan), uncovering seals, painted pottery, and brick structures deep beneath the mound. One year later, in 1922, Indian archaeologist Rakhal Das Banerji (R. D. Banerji) began excavating Mohenjo-daro (in Sindh, now in Pakistan), where he found identical carved seals and planned brick buildings below a much later Buddhist stupa.',
      'Comparing the discoveries from Harappa and Mohenjo-daro—and matching Harappan-style seals with dated layers in Mesopotamia—Sir John Marshall, then Director-General of the Archaeological Survey of India, announced to the world in September 1924 that a great, previously unknown ancient civilization had been discovered in the Indus region, pushing back the story of urban life in South Asia by more than two thousand years.',
      'After 1924, and especially after 1947, archaeologists in both India and Pakistan carried out extensive surveys and excavations, uncovering major sites such as Kalibangan, Lothal, Dholavira, Banawali, and Rakhigarhi. Today, archaeology combines careful trowel-and-brush excavation with modern scientific tools—such as archaeobotany (studying ancient plant seeds), zooarchaeology (studying animal bones), residue analysis inside cooking pots, and satellite remote sensing—showing that historical knowledge continually grows as new evidence is found.',
    ],
    subtopics: [
      {
        heading: '1921 — Daya Ram Sahni at Harappa',
        content:
          'Led excavations at Harappa in Punjab, uncovering deep layers of brick architecture and carved steatite seals.',
      },
      {
        heading: '1922 — R. D. Banerji at Mohenjo-daro',
        content:
          'Began excavating Mohenjo-daro in Sindh, recognizing that its seals and brick structures belonged to the same ancient culture as Harappa.',
      },
      {
        heading: '1924 — John Marshall’s Announcement',
        content:
          'As Director-General of the Archaeological Survey of India (ASI), John Marshall formally announced the discovery of the Indus Valley Civilization in 1924.',
      },
    ],
    questions: [
      {
        id: 's4-q1',
        question: 'Who led the excavations at Harappa in 1921 and Mohenjo-daro in 1922 respectively?',
        options: [
          'Daya Ram Sahni at Harappa (1921) and R. D. Banerji at Mohenjo-daro (1922)',
          'John Marshall at Harappa (1921) and Alexander Cunningham at Mohenjo-daro (1922)',
          'R. D. Banerji at Lothal (1921) and Daya Ram Sahni at Dholavira (1922)',
          'Howard Carter at Harappa (1921) and Heinrich Schliemann at Mohenjo-daro (1922)',
        ],
        correctIndex: 0,
        explanation:
          'Daya Ram Sahni led excavations at Harappa in 1921, and R. D. Banerji began excavations at Mohenjo-daro in 1922.',
      },
      {
        id: 's4-q2',
        question: 'What important announcement did Sir John Marshall make in 1924?',
        options: [
          'That he had completely deciphered the Indus script',
          'That the excavations at Harappa and Mohenjo-daro revealed a major ancient urban civilization in the Indus region',
          'That all Harappan cities were built during the British period',
          'That no further excavations would ever be needed',
        ],
        correctIndex: 1,
        explanation:
          'In 1924, John Marshall, Director-General of the ASI, announced the discovery of the Indus Valley Civilization to the world.',
      },
    ],
  },
  {
    id: 'section-5',
    number: 5,
    shortTitle: 'Important Sites',
    title: 'Important Archaeological Sites',
    readMinutes: 7,
    leadParagraph:
      'Over 1,000 Harappan settlements have been identified across Pakistan and India. They ranged from huge metropolitan cities and fortified coastal ports to specialized craft villages and farming towns.',
    paragraphs: [
      'A settlement’s historical importance depends on the archaeological evidence preserved there. Not every Harappan settlement was a giant city, and different settlements played different roles depending on their local environment and resources. Studying multiple sites together gives us a balanced picture of the civilization.',
      'Harappa (Punjab, Pakistan), situated near an old channel of the Ravi River, was a major urban hub and the first site excavated in 1921. Even though many bricks were removed by 19th-century railway builders, excavations revealed fortified mounds, brick working platforms, a large multi-room storage building, craft workshops for shell and stone beads, and cemeteries that help archaeologists study Harappan burial customs and health.',
      'Mohenjo-daro (Sindh, Pakistan), located on the Indus plain, is famous for its remarkably preserved baked-brick architecture. Its raised western mound ("Citadel") contains the Great Bath—a watertight brick pool—alongside large pillared and storage buildings, while its wide Lower Town features planned streets, covered drains, over 700 wells, and the famous bronze "Dancing Girl" and stone "Priest-King" sculptures.',
      'Dholavira (Kachchh, Gujarat, India), located on Khadir Bet island in the Rann of Kachchh, is a UNESCO World Heritage Site renowned for its water engineering and stone architecture. Unlike brick-dominated cities on the alluvial plains, Dholavira used locally quarried sandstone and mud bricks, organized its city into three distinct divisions, built huge rock-cut reservoirs to capture seasonal stream water, and preserved a remarkable signboard with ten large inlaid symbols.',
      'Lothal (Gujarat, India), near the Gulf of Khambhat, was a vital centre of craft manufacturing and maritime trade. Archaeologists uncovered a large rectangular baked-brick basin connected to a channel—widely interpreted as a tidal dockyard for boats—alongside a warehouse containing clay sealings and a bustling bead-making factory with kilns, stone drills, and carnelian beads.',
      'Kalibangan (Rajasthan, India), on the banks of the dried Ghaggar River, preserved both Early and Mature Harappan levels. Its most famous discovery is an Early Harappan ploughed field with criss-cross furrows running at right angles, showing how farmers planted two crops in the same field. It also yielded fortified mud-brick enclosures and rows of clay fire installations containing ash and terracotta cakes.',
      'Rakhigarhi (Haryana, India), situated in the Ghaggar-Hakra plain, spans seven mounds and is one of the largest known Harappan settlement areas. Excavations at Rakhigarhi show a continuous sequence from the Early Harappan to the Mature Harappan phase, with planned streets, drainage, and workshops for steatite, shell, and metal crafts. Finally, Mehrgarh (Balochistan, Pakistan) is an earlier farming and herding settlement (beginning c. 7000 BCE) near the Bolan Pass; while it predates the Mature Harappan cities, its mud-brick storage structures, wheat and barley cultivation, and craft evolution explain the long regional background that made urban civilization possible.',
    ],
    visualType: 'sites-table',
    questions: [
      {
        id: 's5-q1',
        question: 'Which Harappan site in Gujarat is famous for its rock-cut water reservoirs, extensive use of stone, and a three-part city layout?',
        options: ['Kalibangan', 'Dholavira', 'Harappa', 'Mehrgarh'],
        correctIndex: 1,
        explanation:
          'Dholavira in Kachchh (Gujarat, India) is famous for its interconnected reservoirs, stone and mud-brick architecture, three-part city division, and ten-sign inscription.',
      },
      {
        id: 's5-q2',
        question: 'At which site in Rajasthan did archaeologists uncover direct evidence of an Early Harappan ploughed agricultural field with criss-cross furrows?',
        options: ['Mohenjo-daro', 'Lothal', 'Kalibangan', 'Rakhigarhi'],
        correctIndex: 2,
        explanation:
          'Kalibangan in Rajasthan preserved an Early Harappan ploughed field with two sets of furrows at right angles, suggesting mixed cropping.',
      },
      {
        id: 's5-q3',
        question: 'Why is Mehrgarh (in Balochistan, Pakistan) studied alongside Harappan sites?',
        options: [
          'It was a Late Harappan iron-making city built in 500 BCE',
          'It is an important earlier farming and herding settlement (from c. 7000 BCE) that helps explain the long agricultural background to urban life in the region',
          'It is where the Great Bath and the "Dancing Girl" bronze figurine were found',
          'It was a coastal port on the Bay of Bengal',
        ],
        correctIndex: 1,
        explanation:
          'Mehrgarh is an earlier Neolithic/Chalcolithic farming settlement that reveals how agriculture, animal domestication, and craft skills developed in the wider region before Harappan cities emerged.',
      },
    ],
  },
  {
    id: 'section-6',
    number: 6,
    shortTitle: 'Town Planning',
    title: 'Town Planning and Architecture',
    readMinutes: 6,
    leadParagraph:
      'Walking through a Mature Harappan city like Mohenjo-daro or Dholavira would have immediately revealed careful planning, practical engineering, and shared standards of construction.',
    paragraphs: [
      'In several major Harappan settlements, archaeologists identify two or more distinct sectors. Often, a smaller but higher section stood on the west—built atop massive platforms of mud and brick—which archaeologists call the "Citadel" or raised town, while a larger residential and workshop sector lay to the east, called the "Lower Town." However, layouts were not identical everywhere: at Lothal, the whole settlement was enclosed within a single wall, while at Dholavira the city was divided into three main parts (Citadel, Middle Town, and Lower Town) surrounded by stone fortifications.',
      'Main streets in planned areas often ran roughly north-south and east-west, intersecting at right angles and dividing the town into residential blocks, though smaller lanes wound between house clusters. One of the most remarkable signs of Harappan engineering was their brickwork. Builders used both sun-dried mud bricks and kiln-fired baked bricks, and across many sites these bricks followed a standardized proportion where the length was four times the height and the width was twice the height (a 1 : 2 : 4 ratio, such as 7 × 14 × 28 cm). Standardized bricks made walls stronger and easier to build and repair.',
      'Residential houses varied in size from simple two-room dwellings to large two-story mansions, yet many shared a practical design suited to a warm climate. Rooms were typically arranged around an open central courtyard where families cooked, wove, and worked in daylight. For privacy and protection from street dust, ground-floor walls facing the main street rarely had windows, and main doorways opened onto side lanes rather than directly into view of the courtyard. Many homes had their own brick-paved bathing area and sometimes a private brick-lined well, while brick staircases led up to a second floor or flat roof.',
      'Raised city sectors contained notable public structures. At Mohenjo-daro, the most famous structure is the Great Bath: a rectangular brick tank measuring about 12 metres long, 7 metres wide, and 2.4 metres deep. Steps led down into the water from the north and south ends. Its floor and walls were made watertight using finely fitted bricks set on edge in gypsum mortar, backed by a thick damp-proof layer of natural bitumen (tar). Rooms and a large well stood nearby to fill the tank, and a large corbelled brick drain allowed the water to be emptied. At Dholavira, massive stone-lined reservoirs and water structures occupied a major portion of the walled city.',
      'What does this architectural evidence prove? Shared brick ratios, planned streets, and drainage systems show strong civic organization, technical skill, and communication between communities. However, archaeologists emphasize that shared building practices do not prove that every city was ruled identically by a single king or emperor; local councils, merchant guilds, or regional leaders may have organized different cities.',
    ],
    visualType: 'town-planning',
    historianNote: {
      title: 'Shared Standards Without Assuming One Identical Government',
      text: 'While baked bricks in a 1:2:4 ratio and planned streets appear at many sites, settlements adapted to local materials (such as dressed sandstone at Dholavira) and varied in layout. Archaeological evidence demonstrates civic planning and coordination, without proving a single centralized monarchy.',
    },
    questions: [
      {
        id: 's6-q1',
        question: 'What was the typical proportion (height : width : length) of standardized Harappan bricks found at many sites?',
        options: ['1 : 1 : 1', '1 : 2 : 4', '1 : 5 : 10', '2 : 3 : 9'],
        correctIndex: 1,
        explanation:
          'Many Mature Harappan mud bricks and baked bricks followed a standardized 1 : 2 : 4 ratio (height : width : length), making interlocking bond patterns strong and consistent.',
      },
      {
        id: 's6-q2',
        question: 'How did Harappan builders make the Great Bath at Mohenjo-daro watertight?',
        options: [
          'By lining the tank with sheets of modern plastic and steel',
          'By carving the entire pool out of a single piece of glass',
          'By using finely fitted baked bricks set in gypsum mortar with a damp-proof layer of natural bitumen (tar)',
          'By freezing the water year-round',
        ],
        correctIndex: 2,
        explanation:
          'The Great Bath was made watertight using closely fitted baked bricks laid on edge with gypsum mortar and sealed behind with a layer of natural bitumen.',
      },
      {
        id: 's6-q3',
        question: 'What does the comparison between Mohenjo-daro, Lothal, and Dholavira teach us about Harappan town planning?',
        options: [
          'Every single Harappan settlement had the exact same blueprint and size',
          'Many towns shared practical planning principles, but layouts and materials varied across sites and environments',
          'Only Mohenjo-daro had planned streets, while all other sites had no buildings',
          'Dholavira had no walls or water systems',
        ],
        correctIndex: 1,
        explanation:
          'While Mature Harappan towns shared engineering principles, their layouts (two-part vs. three-part at Dholavira) and building materials (baked brick vs. dressed stone) varied by site.',
      },
    ],
  },
  {
    id: 'section-7',
    number: 7,
    shortTitle: 'Drainage & Water',
    title: 'Drainage and Water Management',
    readMinutes: 5,
    leadParagraph:
      'Among all ancient civilizations, the Harappans stand out for their extraordinary attention to clean water supply, household bathing, and covered municipal drainage.',
    paragraphs: [
      'Water management began right inside the home. Most houses in cities like Mohenjo-daro and Harappa contained a dedicated bathing platform paved with smoothly rubbed, tightly fitted baked bricks. The floor was built with a gentle slope toward one corner so that bathwater and household wastewater flowed through a terracotta pipe or brick chute in the outer wall.',
      'Outside the house wall, the domestic drain emptied into a settling sump or directly into a brick-lined street drain running alongside the lane. Crucially, main street drains were not left open: they were covered with flat baked bricks or stone slabs that could be lifted off whenever municipal workers needed to clear out accumulated silt and prevent blockages. At regular intervals along longer drains, deeper brick sump pits trapped heavy sediment while allowing liquid water to flow onward out of the residential quarter.',
      'To supply clean fresh water, Harappan engineers dug deep, circular wells lined with wedge-shaped baked bricks that locked tightly against the pressure of the surrounding earth. Archaeologists estimate that Mohenjo-daro alone had around 700 wells—meaning almost every household or small neighbourhood block had direct access to clean groundwater.',
      'In drier environments, water management took a different form. At Dholavira in Kachchh (Gujarat), where annual rainfall was low and groundwater was often brackish (salty), there were very few wells. Instead, Dholavira’s engineers built stone bunds across two seasonal streams—the Manhar and Mansar—that flowed past the walled city after monsoon rains. Channels directed this precious runoff through siltation chambers into a chain of massive rock-cut and stone-lined reservoirs that encircled the city inside its outer fortification walls.',
      'Why does this matter? Reliable water supply and covered wastewater drainage allowed Harappan cities to support dense urban populations while keeping living quarters and streets far cleaner and healthier than would otherwise be possible.',
    ],
    visualType: 'dholavira-water',
    questions: [
      {
        id: 's7-q1',
        question: 'Why were Harappan street drains covered with removable brick or stone slabs?',
        options: [
          'So that the drains remained covered during daily use but could be opened periodically to clean out silt and prevent blockages',
          'To hide gold coins stored inside the drains',
          'Because the Harappans never allowed water to enter the drains',
          'To use the drains as underground railway tunnels',
        ],
        correctIndex: 0,
        explanation:
          'Covering street drains kept streets clean and hygienic, while removable slabs and sump pits allowed workers to inspect and clear sediment.',
      },
      {
        id: 's7-q2',
        question: 'How did the people of Dholavira adapt their water management to the semi-arid environment of Kachchh?',
        options: [
          'They imported bottled water from Mesopotamia',
          'They built stone bunds and channels to divert seasonal stream water (from the Manhar and Mansar) into large rock-cut reservoirs',
          'They lived without storing any water',
          'They melted glaciers directly inside the city',
        ],
        correctIndex: 1,
        explanation:
          'Because Kachchh had scarce rainfall and salty groundwater, Dholavira engineered stone dams, channels, and rock-cut reservoirs to harvest and store seasonal rainwater.',
      },
    ],
  },
  {
    id: 'section-8',
    number: 8,
    shortTitle: 'Agriculture & Food',
    title: 'Agriculture, Animals, and Food',
    readMinutes: 5,
    leadParagraph:
      'Every Harappan craftsperson, builder, and trader depended on the farmers, herders, and fisherfolk who produced the food and natural fibres that sustained urban life.',
    paragraphs: [
      'How do archaeologists know what Harappan people ate over 4,000 years ago? Specialists called archaeobotanists sieve soil from ancient hearths, storage bins, and trash pits to recover microscopic plant remains—especially seeds and grains that were accidentally charred (burnt into carbon) during cooking or parching and therefore survived in the soil without rotting.',
      'These plant remains show that Harappan communities cultivated a wide variety of crops suited to different seasons and regions. Key winter (rabi) crops in the Indus and Ghaggar-Hakra plains included wheat and barley, along with pulses such as lentils, chickpeas (gram), and field peas, and oilseeds such as sesame and mustard. In regions with summer monsoon rainfall—especially in Gujarat—communities also cultivated millets (such as ragi, bajra, and jowar), and evidence of rice has been found at sites such as Lothal and Rangpur. Archaeologists emphasize that crop choices varied across regions: wheat and barley dominated the northern river plains, whereas drought-hardy millets were especially important in parts of Gujarat.',
      'One of the most famous agricultural discoveries comes from Kalibangan in Rajasthan, where archaeologists uncovered an Early Harappan ploughed field preserving two sets of furrows intersecting at right angles—one spaced closely together and the other spaced wider apart. Even today, farmers in Rajasthan and Haryana use a similar pattern to grow two crops together in the same field, such as mustard and horse gram. Because real wooden ploughshares decay in the soil, archaeologists know Harappans used ploughs from both the Kalibangan furrows and miniature terracotta models of ploughs found at sites like Banawali and Cholistan.',
      'Animal husbandry was equally central to the economy. Zooarchaeologists studying animal bones have identified domesticated cattle (both humped zebu and humpless cattle), water buffalo, sheep, and goats, which provided milk, meat, leather, wool, and traction power for pulling ploughs and carts. People also supplemented their diet with fish, waterfowl, and wild animals such as deer and boar, and gathered wild fruits like jujube (ber) and dates.',
      'Finally, the Indus region holds a special place in the global history of textiles as one of the earliest centres of cotton cultivation. Because organic cloth decays rapidly in warm, damp soil, actual ancient textiles rarely survive; however, archaeologists found tiny fragments of woven cotton cloth preserved by metallic salts stuck to the lid of a silver vase at Mohenjo-daro, along with terracotta spindle whorls used throughout Harappan homes to spin cotton and wool fibres into thread.',
    ],
    subtopics: [
      {
        heading: 'Evidence from Kalibangan’s Ploughed Field',
        content:
          'Criss-cross furrows at right angles show that Early Harappan farmers used animal-drawn ploughs and likely practiced intercropping (growing two crops together in one field).',
      },
      {
        heading: 'Direct vs. Indirect Evidence for Cotton',
        content:
          'Actual cloth rarely survives in South Asian soil, so archaeologists rely on rare mineralized cloth impressions (such as on a silver vessel at Mohenjo-daro), cotton seeds/pollen, and clay/faience spindle whorls.',
      },
    ],
    questions: [
      {
        id: 's8-q1',
        question: 'Which crops are well-documented in Harappan archaeological sites, keeping in mind that their importance varied by region?',
        options: [
          'Potatoes, tomatoes, maize, and cocoa',
          'Wheat, barley, pulses, sesame, mustard, cotton, and regional millets/rice',
          'Only coconuts and pineapples',
          'Coffee beans and rubber trees',
        ],
        correctIndex: 1,
        explanation:
          'Archaeobotanical evidence confirms wheat, barley, pulses, sesame, mustard, cotton, and (in regions like Gujarat) millets and rice.',
      },
      {
        id: 's8-q2',
        question: 'Why is archaeological evidence for Harappan cotton textiles often indirect?',
        options: [
          'Because cotton was never grown in ancient South Asia',
          'Because organic cloth decays easily over thousands of years, so archaeologists rely on rare mineralized cloth traces on metal objects, seeds, and spindle whorls',
          'Because the Harappans wore only solid bronze armour',
          'Because spindle whorls were used only as coins',
        ],
        correctIndex: 1,
        explanation:
          'Natural cloth fibres decay in most soils, so textile production is reconstructed from spindle whorls, cotton seeds, and rare cloth impressions preserved on metal artifacts.',
      },
    ],
  },
  {
    id: 'section-9',
    number: 9,
    shortTitle: 'Crafts & Technology',
    title: 'Crafts and Technology',
    readMinutes: 6,
    leadParagraph:
      'Harappan craftspeople combined artistic creativity with high-temperature pyrotechnology, chemical glazing, precision drilling, and metallurgy to create both everyday tools and prized luxury goods.',
    paragraphs: [
      'In Harappan towns and cities, specialized artisans worked in dedicated workshops. Potters shaped fine alluvial clay on fast-spinning wheels, coated vessels with a smooth red slip, painted geometric and natural motifs in black mineral pigment, and fired them in temperature-controlled kilns.',
      'Bead-making was one of the most sophisticated Harappan industries, especially at Chanhudaro and Lothal. Bead-makers worked with semi-precious stones such as carnelian, agate, jasper, crystal, and lapis lazuli, as well as steatite, shell, copper, and gold. To make long barrel-cylinder carnelian beads, artisans heated yellowish stone nodules in kilns to turn them a deep, glowing red, chipped and ground them smooth, and drilled tiny central holes from both ends using specialized stone micro-drills made of hard Ernestite. They also created "etched carnelian" beads by painting white alkaline patterns onto the red stone and firing them so the design fused permanently into the surface.',
      'Harappan metallurgists smelted copper and alloyed it with tin or arsenic to make bronze, which was harder and held a sharper edge than pure copper. They cast and hammered flat axes, chisels, knives, saws, razors, fishhooks, mirrors, and vessels, and crafted ornaments of gold and silver. Coastal craft centres like Nageshwar and Balakot specialized in cutting hard marine conch shells into polished bangles, ladles, and decorative inlays. Artisans also manufactured faience—an artificial paste of ground quartz mixed with gum and mineral glazes that turned a lustrous sky-blue or sea-green when fired.',
      'Equally important for commerce were carved steatite seals and cubical chert weights, which required precise stone cutting and polishing. Meanwhile, terracotta workers pinched and moulded clay into animal figures, human figurines, rattles, whistles, and miniature wheeled carts.',
      'Two of the most famous works of art from Mohenjo-daro are a small bronze figurine (about 10.5 cm tall) popularly called the "Dancing Girl", cast using the lost-wax technique and shown wearing numerous bangles on her left arm, and a carved steatite stone bust (about 17.5 cm tall) popularly called the "Priest-King", shown with a neatly trimmed beard, headband, armband, and a cloak decorated with trefoil (three-lobed) patterns. Historians emphasize that "Dancing Girl" and "Priest-King" are modern nicknames coined by 20th-century archaeologists; their actual names, identities, and social roles in Harappan times remain unknown.',
    ],
    visualType: 'crafts-gallery',
    historianNote: {
      title: 'Why "Dancing Girl" and "Priest-King" Are Modern Labels',
      text: 'When archaeologists in the 1920s excavated the bronze figurine and the bearded stone bust at Mohenjo-daro, they gave them vivid nicknames based on their posture and clothing. Because there are no deciphered inscriptions naming them, we do not know whether the woman was a dancer or whether the bearded man was a priest, a ruler, a clan elder, or an ancestor figure.',
    },
    questions: [
      {
        id: 's9-q1',
        question: 'What was "faience" in Harappan craft production?',
        options: [
          'A type of wild wheat grown in Balochistan',
          'An artificially manufactured material made from ground quartz/sand and glaze, fired to create shiny blue or sea-green beads, bangles, and tiny pots',
          'A natural iron ore mined in southern India',
          'A type of wooden boat used on the Indus River',
        ],
        correctIndex: 1,
        explanation:
          'Faience was an artificial, high-skill glazed material made from powdered quartz/sand and mineral colourants, used for delicate ornaments and miniature vessels.',
      },
      {
        id: 's9-q2',
        question: 'Why do historians caution students about the names "Dancing Girl" and "Priest-King" given to the famous Mohenjo-daro sculptures?',
        options: [
          'Because both sculptures were actually made in the 20th century CE',
          'Because those names are modern labels invented by archaeologists, and the figures’ actual identities and roles in Harappan society are unknown',
          'Because both sculptures were found in Rome, not Mohenjo-daro',
          'Because their names are written in English on the base of the statues',
        ],
        correctIndex: 1,
        explanation:
          '"Dancing Girl" and "Priest-King" are modern nicknames; without deciphered texts, their true identities and functions remain unknown.',
      },
      {
        id: 's9-q3',
        question: 'Which metalworking technique was used to cast the famous bronze figurine from Mohenjo-daro?',
        options: [
          'The lost-wax (cire perdue) bronze casting technique',
          '3D laser printing with titanium',
          'Blast-furnace steel rolling',
          'Cold hammering of solid iron',
        ],
        correctIndex: 0,
        explanation:
          'Harappan bronze smiths used the lost-wax casting method: sculpting a wax model, coating it in clay, melting out the wax, and pouring molten bronze into the hollow mould.',
      },
    ],
  },
  {
    id: 'section-10',
    number: 10,
    shortTitle: 'Seals & Script',
    title: 'Seals and the Indus Script',
    readMinutes: 5,
    leadParagraph:
      'Thousands of small, exquisitely carved seals and inscribed objects survive from Harappan sites, offering tantalizing glimpses of a writing system that remains one of archaeology’s greatest unsolved puzzles.',
    paragraphs: [
      'Most Harappan seals are small square or rectangular stamps, typically measuring 2 to 3 centimetres across, carved from steatite (a soft soapstone). After carving the design in sunken relief with fine tools, artisans coated the seal with an alkali and heated it in a kiln, which whitened and hardened its surface so it could withstand repeated use. A raised boss with a hole on the back allowed a cord to be threaded through so the owner could wear or carry the seal safely.',
      'A typical seal features two main elements: across the top, a short row of engraved symbols from the Indus script; and below, a finely carved animal motif, often standing before an object variously described as a feeding trough, brazier, or cult standard. The most frequent animal motif is a mythical one-horned creature popularly called the "unicorn", followed by the short-horned bull, the humped zebu bull, the elephant, the Indian rhinoceros, the tiger, and the water buffalo. Some seals also depict human or composite figures and narrative scenes.',
      'How were seals used? Archaeological discoveries of clay "sealings" (lumps of dried or baked clay, such as those found in the warehouse at Lothal) provide an important clue. When a bundle of trade goods was tied with rope or a jar was stoppered with cloth and clay, the sender pressed a carved seal into the wet clay. If the clay sealing arrived at its destination unbroken, the buyer knew the package had not been tampered with during transit, and the seal impression identified the sender or authority. Seals and copper/terracotta tokens may also have served as badges of identity, workshop marks, or amulets.',
      'The symbols carved on seals—as well as scratched onto pottery jars, stamped on clay tags, and inlaid on the famous ten-sign signboard at Dholavira—belong to the Indus script. Researchers have catalogued around 400 distinct signs, written mostly from right to left. Most inscriptions are extremely short, averaging only about 5 signs, with the longest known inscription containing 26 signs.',
      'Historians emphasize a crucial rule of historical accuracy: the Indus script has NOT been conclusively deciphered. Although more than a hundred scholars and computer scientists have proposed different readings (some suggesting Dravidian roots, others Indo-Aryan or another ancient language family, and some debating whether the signs represent words, syllables, or non-linguistic symbols), no proposed decipherment has been proven or accepted by scholarly consensus, largely because the inscriptions are very short and no bilingual text (like Egypt’s Rosetta Stone) has yet been discovered.',
    ],
    subtopics: [
      {
        heading: 'How Clay Sealings Protected Trade Goods',
        content:
          'Pressing a steatite seal into wet clay over the knot of a cargo bundle left a raised impression on the front and rope/cloth marks on the back—acting like an ancient security lock and sender label.',
      },
      {
        heading: 'Why the Script Remains Undeciphered',
        content:
          'Inscriptions are very short (averaging ~5 signs), we do not know for certain which underlying language(s) the Harappans spoke, and no bilingual inscription translating the Indus script into a known ancient script has been found.',
      },
    ],
    questions: [
      {
        id: 's10-q1',
        question: 'What is the current scholarly status of the Indus script?',
        options: [
          'It was completely deciphered in 1924 using a bilingual tablet from Harappa',
          'It has not been conclusively deciphered, and there is no widely accepted decoding',
          'It is identical to modern English',
          'It consists of 500-page books written on papyrus scrolls',
        ],
        correctIndex: 1,
        explanation:
          'The Indus script remains undeciphered; historians treat all proposed translations cautiously because no bilingual inscription has been discovered and inscriptions are very short.',
      },
      {
        id: 's10-q2',
        question: 'What do clay "sealings" with cord and cloth marks on the back (such as those found at Lothal) suggest about one practical use of Harappan seals?',
        options: [
          'Seals were pressed into wet clay on tied bundles or jars to secure goods and identify the sender during trade',
          'Seals were used only as heavy anchors for ocean ships',
          'Seals were melted down to make bronze swords',
          'Seals were used as bricks to build city walls',
        ],
        correctIndex: 0,
        explanation:
          'Clay sealings bearing rope and cloth impressions on the reverse show that seals were stamped onto wet clay over knotted packages to verify that cargo remained unopened.',
      },
    ],
  },
  {
    id: 'section-11',
    number: 11,
    shortTitle: 'Trade & Economy',
    title: 'Trade and the Economy',
    readMinutes: 5,
    leadParagraph:
      'Because the fertile alluvial plains of the Indus and Ghaggar-Hakra rivers lacked stone, timber, and metal ores, Harappan cities built extensive local, regional, and international trade networks.',
    paragraphs: [
      'Trade operated at multiple levels. At the local level, villages supplied nearby cities with grain, pulses, milk, meat, and cotton, while city craftspeople provided villagers with wheel-made pottery, metal tools, and ornaments. At the regional level, bullock carts following overland tracks and flat-bottomed river boats carried bulky goods along the Indus and its tributaries.',
      'To make tools, beads, and ornaments, Harappan workshops obtained raw materials from specific resource regions across South Asia and beyond: copper was sourced from the Khetri mines of Rajasthan and from Oman across the Arabian Sea; carnelian and agate came from Gujarat (especially Bharuch/Ratanpur); marine conch shells came from coastal Gujarat (Nageshwar) and the Makran coast (Balakot); fine timber such as deodar cedar was floated down rivers from the Himalayan foothills; gold came from river sands or southern India (Karnataka); steatite came from Rajasthan, Gujarat, and Balochistan; and prized blue lapis lazuli came from Badakhshan in north-eastern Afghanistan (near the Harappan outpost of Shortughai).',
      'Trade was supported by remarkable standardization. Across Harappan settlements, merchants used polished cubical weights made of banded chert stone. Smaller weights followed a binary progression (1, 2, 4, 8, 16, 32, 64), while heavier weights followed decimal multiples—allowing accurate weighing of high-value goods like beads, metals, and aromatics. Steatite seals and clay sealings helped merchants and administrators identify and secure consignments.',
      'Long-distance maritime and overland trade linked the Harappan world with Iran, Afghanistan, Bahrain (ancient Dilmun), Oman (ancient Magan), and Mesopotamia (modern Iraq). Archaeologists have found Harappan etched carnelian beads, shell inlays, cubical weights, and Indus-style seals in Mesopotamian cities such as Ur, Kish, Susa, and Nippur, as well as Harappan pottery and metal goods in Oman and the Persian Gulf.',
      'Furthermore, Mesopotamian cuneiform clay tablets from the time of Sargon of Akkad (c. 2350 BCE) refer to ships arriving from a distant seafaring land called "Meluhha", bringing carnelian, lapis lazuli, ivory, timber, gold, copper, and exotic birds (such as peacocks). Many scholars associate "Meluhha" with the Indus Valley Civilization, while continuing to study how merchants from both regions organized these voyages.',
    ],
    subtopics: [
      {
        heading: 'Key Raw Material Sources',
        content:
          'Copper: Khetri (Rajasthan) & Oman · Carnelian: Gujarat · Shell: Nageshwar & Balakot · Lapis Lazuli: Shortughai/Badakhshan (Afghanistan) · Timber: Himalayan foothills.',
      },
      {
        heading: 'The Mesopotamian Link & "Meluhha"',
        content:
          'Harappan carnelian beads, weights, and seals found in Iraq/Oman—together with Mesopotamian texts mentioning "Meluhha"—provide strong evidence of Arabian Sea and Persian Gulf trade.',
      },
    ],
    questions: [
      {
        id: 's11-q1',
        question: 'Which term in ancient Mesopotamian cuneiform texts is widely associated by scholars with the Indus region?',
        options: ['Atlantis', 'Meluhha', 'Olympus', 'Sparta'],
        correctIndex: 1,
        explanation:
          'Mesopotamian cuneiform inscriptions mention maritime trade with "Meluhha", a land rich in carnelian, ivory, timber, and copper that many scholars identify with the Indus region.',
      },
      {
        id: 's11-q2',
        question: 'How did standardized cubical chert weights support the Harappan economy?',
        options: [
          'They provided a shared, accurate system for weighing and measuring goods across distant settlements',
          'They were used as sling stones in naval battles',
          'They were ground into flour for bread',
          'They were used only to build house roofs',
        ],
        correctIndex: 0,
        explanation:
          'Uniform cubical chert weights following consistent binary and decimal ratios allowed merchants across the Harappan region to measure goods fairly and accurately.',
      },
    ],
  },
  {
    id: 'section-12',
    number: 12,
    shortTitle: 'Daily Life & Beliefs',
    title: 'Daily Life, Society, Art, and Beliefs',
    readMinutes: 6,
    leadParagraph:
      'Beyond grand city walls and reservoirs, archaeological finds bring us close to the everyday lives of Harappan families—their homes, ornaments, children’s toys, burials, and artistic traditions.',
    paragraphs: [
      'Harappan cities were home to a diverse population: farmers, potters, brick-makers, masons, bead-drillers, shell-cutters, copper-smiths, seal-carvers, boat-builders, and merchants. People lived in courtyard houses of varying sizes, cooked on brick or clay hearths using terracotta and copper vessels, ground grain on saddle querns (grinding stones), and spun cotton and wool with spindle whorls.',
      'Both men and women wore ornaments. Wealthier residents wore fillets, necklaces, finger rings, and armlets of gold, silver, copper, faience, and polished carnelian or jade beads, while people of all backgrounds wore bangles and beads made of shell and baked clay. Figurines and stone sculptures suggest that people wore draped garments and styled their hair in braids, buns, or woven fillets, and used copper mirrors and ivory or bone combs.',
      'Children’s lives are vividly preserved through hundreds of terracotta toys excavated from houses and lanes: miniature wheeled bullock carts, small clay birds that whistle when blown, hollow clay rattles filled with pellets, movable-head animal figures, marbles, and game boards with dice and gaming pieces carved from stone or ivory.',
      'When archaeologists examine Harappan burials (at sites like Harappa, Rakhigarhi, Kalibangan, and Lothal), they find that the most common practice was extended inhumation: placing the deceased in an oval or rectangular pit, usually with the head pointing north, accompanied by everyday pottery vessels (perhaps once holding food or water) and simple ornaments like shell bangles or beads. Unlike the royal tombs of Egypt or Ur in Mesopotamia, Harappan graves rarely contain lavish hoards of gold or weapons—and burial practices also varied, including symbolic burials (pots without bones) and fractional burials.',
      'Reconstructing Harappan religious beliefs requires special historical care because the script is undeciphered. Some scholars have suggested that ornate terracotta female figurines represent a fertility or Mother Goddess, that a horned figure seated in a posture on certain seals (sometimes called the "Pashupati" seal) represents a deity, that peepal tree and animal motifs had sacred meanings, that clay structures at Kalibangan and Lothal were fire altars, and that the Great Bath was used for ritual purification. However, historians stress that these are hypotheses and interpretations rather than proven certainties. A key habit of historical thinking is separating what archaeologists physically found from what scholars think those objects might have meant.',
    ],
    visualType: 'evidence-vs-hypothesis',
    questions: [
      {
        id: 's12-q1',
        question: 'What doHarappan burials (such as those at Harappa and Rakhigarhi) typically contain?',
        options: [
          'Enormous golden chariots, iron suits of armour, and hundreds of servants',
          'Simple grave goods such as everyday pottery vessels and modest ornaments like shell bangles or stone beads',
          'Printed books written in Latin',
          'No pottery or objects of any kind',
        ],
        correctIndex: 1,
        explanation:
          'Harappan burials typically placed the body in a pit with everyday pottery vessels and simple personal ornaments, rather than extravagant royal treasure hoards.',
      },
      {
        id: 's12-q2',
        question: 'Which statement best distinguishes archaeological evidence from historical interpretation regarding the Great Bath at Mohenjo-daro?',
        options: [
          'It is a proven fact that only kings swam in the Great Bath on Sundays',
          'The watertight brick tank, steps, well, and drain are physical archaeological evidence, whereas the idea that it was used for religious ritual bathing is a plausible hypothesis',
          'The Great Bath was never excavated and is only a legend',
          'An inscription on the steps states the exact rules of the bath in English',
        ],
        correctIndex: 1,
        explanation:
          'The brick structure, bitumen waterproofing, steps, well, and drain are physical facts; its exact ritual or communal function remains a hypothesis because we have no deciphered texts.',
      },
    ],
  },
  {
    id: 'section-13',
    number: 13,
    shortTitle: 'Transformation & Decline',
    title: 'Transformation and Decline (After c. 1900 BCE)',
    readMinutes: 5,
    leadParagraph:
      'Beginning around 1900 BCE, the great urban centres of the Mature Harappan phase underwent a gradual transformation. Rather than vanishing overnight in a single disaster, Harappan society adapted to changing environmental and economic conditions.',
    paragraphs: [
      'What changed after approximately 1900 BCE? In large cities like Mohenjo-daro, Harappa, and Dholavira, civic maintenance of public drains and wide streets gradually broke down. Large public buildings went out of use, and people subdivided older courtyards into smaller dwellings or reused old bricks. Most noticeably, the distinctive markers of Mature Harappan urban administration and long-distance commerce—carved steatite seals, the Indus script, standardized cubical chert weights, and specialized carnelian bead factories—gradually disappeared.',
      'Why did this urban transformation happen? Today, historians and scientists agree that no single cause explains changes across every part of such a vast region. Instead, several interconnected factors worked together over centuries:',
      '1. Climate and Monsoon Changes: Geological and paleoclimate studies (measuring ancient pollen and lake sediments) indicate a gradual weakening of the summer monsoon and a trend toward greater aridity (drier conditions) in parts of north-western South Asia after c. 2200–1900 BCE, which affected rain-fed and flood-plain agriculture.',
      '2. Shifting and Drying Rivers: Changes in river flow—including shifts in the courses of the Indus and its tributaries, river flooding at some sites in Sindh, and the gradual drying of channels in the Ghaggar-Hakra river system—reduced reliable water supplies and fertile silt for large urban populations.',
      '3. Changes in Long-Distance Trade: Around the same period, political and economic shifts in Mesopotamia and the Persian Gulf reduced the overseas demand for Harappan luxury crafts, weakening the trade networks that had supported specialized urban workshops and coastal ports.',
      '4. Population Movement and Regional Adaptation: As sustaining huge, densely packed cities became harder in the drier western plains, many families migrated toward smaller villages and towns in regions with more reliable monsoon rainfall—such as eastern Punjab, Haryana, western Uttar Pradesh (the Ganga-Yamuna Doab), and Saurashtra in Gujarat. Therefore, it is historically inaccurate to say that the civilization "suddenly disappeared." People continued living in the region, farming, making pottery, and carrying forward everyday cultural practices in smaller Late Harappan communities.',
    ],
    visualType: 'transition-timeline',
    historianNote: {
      title: 'Why Single-Cause "Sudden Collapse" Theories Were Revised',
      text: 'Earlier 20th-century writers sometimes suggested a sudden invasion or a single catastrophic flood destroyed the entire civilization at once. Modern archaeological evidence across hundreds of sites shows instead a gradual, multi-century transformation driven by climate shifts, river changes, trade realignment, and regional migration.',
    },
    questions: [
      {
        id: 's13-q1',
        question: 'Which statement accurately describes the changes in the Harappan Civilization after approximately 1900 BCE?',
        options: [
          'Every single person and village vanished overnight in a single day',
          'Urban transformation was gradual and varied by region, influenced by factors such as climate/rainfall changes, shifting rivers, changing trade networks, and population movement',
          'The cities grew ten times larger and began building steel skyscrapers',
          'The Indus script became the official writing system of Rome',
        ],
        correctIndex: 1,
        explanation:
          'Historians emphasize that the transformation after c. 1900 BCE was gradual, varied across regions, and involved multiple environmental and economic factors rather than a single sudden disappearance.',
      },
      {
        id: 's13-q2',
        question: 'Which features of the Mature Harappan phase gradually ceased during the Late Harappan transformation?',
        options: [
          'All farming of wheat, barley, and millets',
          'Carved steatite seals, the Indus script, standardized cubical weights, and large-scale urban civic maintenance',
          'The making of clay pots and living in villages',
          'Domestication of cattle and goats',
        ],
        correctIndex: 1,
        explanation:
          'While farming, herding, and pottery continued in smaller Late Harappan settlements, urban hallmarks such as steatite seals, the Indus script, standardized weights, and monumental civic upkeep faded.',
      },
    ],
  },
  {
    id: 'section-14',
    number: 14,
    shortTitle: 'Legacy & Importance',
    title: 'Legacy and Historical Importance',
    readMinutes: 4,
    leadParagraph:
      'The Indus Valley Civilization left an enduring mark on the history of South Asia and stands as a milestone in human engineering, urban design, and peaceful commercial exchange.',
    paragraphs: [
      'First, the Harappans pioneered urban planning and civil engineering in South Asia. Their emphasis on baked-brick construction, neighbourhood wells, domestic bathing areas, and covered street drains with inspection sumps demonstrated that public hygiene and access to clean water are foundational to healthy city life.',
      'Second, their water conservation systems—especially the rock-cut reservoirs and stormwater channels at Dholavira—show remarkable ingenuity in adapting to semi-arid climates, offering lessons in sustainable rainwater harvesting that remain relevant today.',
      'Third, Harappan craftspeople and merchants developed enduring technological traditions: lost-wax bronze casting, stone bead drilling and etching, shell bangle carving, cotton spinning and weaving, and a standardized system of weights and measures that facilitated fair commerce across vast distances.',
      'Fourth, the civilization’s resilience—adapting diverse crops (wheat, barley, pulses, millets, cotton) to different ecological zones and shifting settlement patterns when rivers and rainfall changed—helps modern scientists and historians understand how human societies respond to environmental change.',
      'Finally, the Harappan Civilization remains one of the most active and exciting fields of archaeological research in the world. Every new excavation, archaeobotanical sample, and scientific analysis deepens our understanding of South Asia’s earliest urban ancestors—and the undeciphered Indus script continues to invite future generations of young scholars to study the past with curiosity and rigour.',
    ],
    questions: [
      {
        id: 's14-q1',
        question: 'Which of the following is a major historical achievement demonstrated by the Harappan Civilization?',
        options: [
          'Practical urban water management, including neighbourhood wells, covered street drains, and rainwater reservoirs',
          'Invention of gunpowder and steam locomotives',
          'Construction of stone amphitheatres for gladiatorial combat',
          'Decipherment of Egyptian hieroglyphs',
        ],
        correctIndex: 0,
        explanation:
          'Harappan urban planning, baked-brick drainage, wells, and reservoirs represent one of the ancient world’s finest achievements in civic water engineering.',
      },
      {
        id: 's14-q2',
        question: 'Why does the Indus Valley Civilization remain an important subject of active archaeological research today?',
        options: [
          'Because no Harappan site has ever been excavated yet',
          'Because new excavations, scientific analyses, and ongoing research into ancient rivers and the undeciphered script continue to expand our knowledge',
          'Because all archaeological sites were moved to Europe',
          'Because historians no longer study ancient objects',
        ],
        correctIndex: 1,
        explanation:
          'Many Harappan mounds remain unexcavated, the script is still undeciphered, and modern scientific tools continually yield fresh insights into diet, trade, and climate adaptation.',
      },
    ],
  },
  {
    id: 'section-15',
    number: 15,
    shortTitle: 'Chapter Summary',
    title: 'Chapter Summary and Quick Revision',
    readMinutes: 5,
    leadParagraph:
      'Review the core concepts, dates, sites, and historical thinking skills from this chapter before completing your GyanQuest stages.',
    paragraphs: [
      'The Indus Valley Civilization—also called the Harappan Civilization after Harappa, the first site excavated in 1921—developed across a broad region of present-day Pakistan and north-western and western India. Growing out of earlier farming and herding communities (such as Mehrgarh, from c. 7000 BCE) and the Early Harappan phase (c. 3300–2600 BCE), it reached its Mature Harappan urban peak between approximately 2600 BCE and 1900 BCE.',
      'Major sites reveal different facets of Harappan life: Harappa (Punjab, Pakistan) and Mohenjo-daro (Sindh, Pakistan) showcase planned streets, baked-brick buildings, wells, covered drains, and the Great Bath; Dholavira (Gujarat, India) demonstrates rock-cut water reservoirs and a three-part stone-and-brick layout; Lothal (Gujarat, India) highlights bead-making workshops, warehouse sealings, and a basin often interpreted as a dockyard; Kalibangan (Rajasthan, India) preserves an Early Harappan ploughed field and fire installations; and Rakhigarhi (Haryana, India) represents one of the largest settlement areas in the Ghaggar-Hakra plain.',
      'Harappan communities grew wheat, barley, pulses, sesame, mustard, cotton, and regional millets/rice, and domesticated cattle, water buffalo, sheep, and goats. Craftspeople excelled in wheel-made pottery, carnelian bead drilling, copper/bronze metallurgy, shell working, and faience glazing. Traders used standardized cubical chert weights and carved steatite seals across networks reaching Afghanistan, Iran, Oman, and Mesopotamia (where texts refer to "Meluhha").',
      'Because the Indus script has not been conclusively deciphered, historians carefully separate physical archaeological evidence from uncertain interpretations (such as modern labels like "Dancing Girl" and "Priest-King" or religious hypotheses). After about 1900 BCE (the Late Harappan phase, c. 1900–1300 BCE), major cities transformed gradually as climate, river systems, and trade networks shifted, and people adapted by moving toward smaller settlements across the region.',
    ],
    visualType: 'quick-revision',
    questions: [
      {
        id: 's15-q1',
        question: 'Match the site with its well-known archaeological feature: (1) Mohenjo-daro, (2) Dholavira, (3) Kalibangan, (4) Lothal.',
        options: [
          '(1) Great Bath · (2) Rock-cut reservoirs · (3) Ploughed field · (4) Bead factory & dockyard basin',
          '(1) Ploughed field · (2) Great Bath · (3) Dockyard basin · (4) Rock-cut reservoirs',
          '(1) Iron pillar · (2) Colosseum · (3) Great Wall · (4) Pyramid',
          '(1) Rock-cut reservoirs · (2) Ploughed field · (3) Great Bath · (4) Cave paintings',
        ],
        correctIndex: 0,
        explanation:
          'Mohenjo-daro is known for the Great Bath, Dholavira for rock-cut reservoirs, Kalibangan for its Early Harappan ploughed field, and Lothal for its bead factory and basin interpreted as a dockyard.',
      },
      {
        id: 's15-q2',
        question: 'Which habit of mind is most important when studying Harappan society and beliefs?',
        options: [
          'Assuming every modern nickname for a statue is its ancient historical title',
          'Separating physical archaeological evidence from interpretations that remain uncertain while the script is undeciphered',
          'Claiming that a single sudden event caused every person in the Indus region to vanish in one day',
          'Ignoring plant seeds, animal bones, and pottery shards',
        ],
        correctIndex: 1,
        explanation:
          'Separating proven physical evidence from uncertain hypotheses is essential when studying a civilization whose script has not yet been deciphered.',
      },
    ],
  },
  {
    id: 'section-16',
    number: 16,
    shortTitle: 'Glossary',
    title: 'Chapter Glossary (12 Essential Terms)',
    readMinutes: 4,
    leadParagraph:
      'Master the 12 core historical and archaeological terms of the Indus Valley Civilization. Use the search and category filters below to review each definition and example.',
    paragraphs: [
      'Understanding historical vocabulary helps you read textbooks, analyse archaeological discoveries, and answer examination questions with precision. Review all twelve terms below and test your knowledge with the final check.',
    ],
    visualType: 'glossary',
    questions: [
      {
        id: 's16-q1',
        question: 'Which glossary term refers to a small carved object (usually made of fired steatite) bearing animal motifs and short script symbols, used to make impressions on wet clay?',
        options: ['Reservoir', 'Faience', 'Seal', 'Drainage'],
        correctIndex: 2,
        explanation:
          'A seal is a small carved stamp—usually of fired steatite—featuring animal motifs and signs of the Indus script, used to stamp wet clay on bundles or containers.',
      },
      {
        id: 's16-q2',
        question: 'What is the difference between "Archaeology" and an "Artifact"?',
        options: [
          'Archaeology is the scientific study of the past through physical remains, while an artifact is a portable object made or used by humans in the past',
          'Archaeology is a type of glazed blue stone, while an artifact is a water tank',
          'They mean the exact opposite of excavation',
          'An artifact is a scientist who studies modern computers',
        ],
        correctIndex: 0,
        explanation:
          'Archaeology is the scientific discipline that studies past human life through physical remains, whereas an artifact is an individual human-made object (like a pot, bead, tool, or seal).',
      },
    ],
  },
];
