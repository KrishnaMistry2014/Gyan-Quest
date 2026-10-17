import fs from 'fs';
import path from 'path';
import { buildValidCrosswordLayout, hasNoLetterCollisions } from '../src/lib/crosswordGenerator.ts';

const GITA_WORDS = [
  { answer: 'AHARA', clue: 'Nutritious diet fueling the physical body like clean machinery' },
  { answer: 'FOCUS', clue: 'Single-minded mental concentration without distractions' },
  { answer: 'SLEEP', clue: 'Restorative 8 to 10 hours of rest essential for cognitive sharpness' },
  { answer: 'HABIT', clue: 'Behavior forged by repeating disciplined routines for 21 days' },
  { answer: 'ENERGY', clue: 'Vital physical fuel cultivated through wholesome lifestyle' },
  { answer: 'YUKTA', clue: 'Balanced and regulated in daily duties, rest, and food' },
  { answer: 'WORK', clue: 'Dedicated discharge of academic responsibilities and tasks' },
  { answer: 'YOGA', clue: 'Disciplined practice harmonizing mind, body, and action' },
  { answer: 'MEDITATION', clue: 'Dhyana practice stilling the restless fluctuations of mind' },
  { answer: 'BALANCE', clue: 'Equilibrium preventing extremes of exhaustion and idleness' },
  { answer: 'PRANA', clue: 'Vital life breath and energy current coursing through the body' },
  { answer: 'DHYANA', clue: 'Deep meditation that cultivates serenity and spiritual clarity' },
  { answer: 'KARMA', clue: 'Law of action and consequence teaching mindful duty' },
  { answer: 'SATYA', clue: 'Steadfast truthfulness aligned with ethical living' },
  { answer: 'SHANTI', clue: 'Profound peace and tranquility of the calm intellect' },
  { answer: 'MIND', clue: 'Subtle faculty that can be a friend or foe through discipline' },
  { answer: 'DUTY', clue: 'Righteous obligation carried out without anxious clinging' },
  { answer: 'PEACE', clue: 'Equanimous state free from agitation and worry' },
  { answer: 'REST', clue: 'Rejuvenation period restoring mental vigor and memory recall' },
  { answer: 'DIET', clue: 'Sattvic food intake nourishing clarity and vitality' },
  { answer: 'HEALTH', clue: 'Wholeness of body and mental clarity through good habits' },
  { answer: 'ROUTINE', clue: 'Daily scheduled practice fostering effortless consistency' },
  { answer: 'WISDOM', clue: 'Experiential understanding guiding noble life decisions' },
  { answer: 'CALM', clue: 'Undisturbed emotional equilibrium in joy and sorrow' },
  { answer: 'ACTION', clue: 'Righteous effort performed with devotion and skill' }
];

const RAMAYANA_WORDS = [
  { answer: 'RAMA', clue: 'Maryada Purushottama representing truth and duty' },
  { answer: 'SITA', clue: 'Princess of Mithila personifying devotion and purity' },
  { answer: 'DHARMA', clue: 'Cosmic law of righteousness and moral order' },
  { answer: 'SATYA', clue: 'Truthfulness honoring King Dasharatha sacred word' },
  { answer: 'LAKSHMANA', clue: 'Devoted brother accompanying Rama into exile' },
  { answer: 'HANUMAN', clue: 'Mighty vanara hero exemplar of selfless devotion and courage' },
  { answer: 'BHARATA', clue: 'Noble brother who placed Rama sandals on the Ayodhya throne' },
  { answer: 'VALMIKI', clue: 'First poet and sage who authored the sacred Ramayana' },
  { answer: 'AYODHYA', clue: 'Ancient capital city ruled wisely by King Dasharatha' },
  { answer: 'EXILE', clue: 'Fourteen-year forest journey accepted with calm honor' },
  { answer: 'COURAGE', clue: 'Fearless bravery in confronting adversity and injustice' },
  { answer: 'HONOR', clue: 'Integrity upheld above personal comfort or convenience' },
  { answer: 'NATURE', clue: 'Revered forests, rivers, and living creatures of Panchavati' },
  { answer: 'DEVOTION', clue: 'Pure selfless love exemplified by Hanuman bhakti' },
  { answer: 'LOYALTY', clue: 'Unbreakable bond uniting the royal brothers of Ayodhya' },
  { answer: 'BOW', clue: 'Divine bow of Shiva stringed effortlessly by Rama' },
  { answer: 'JANAKA', clue: 'Wise scholar-king of Mithila and father of Sita' },
  { answer: 'JATAYU', clue: 'Valiant king of birds who fought bravely to rescue Sita' },
  { answer: 'SUGRIVA', clue: 'Vanara ruler befriended by Rama in Kishkindha' },
  { answer: 'TRUTH', clue: 'Eternal foundation of ethical character and noble life' },
  { answer: 'PROMISE', clue: 'Sacred word upheld at all costs across generations' },
  { answer: 'VIRTUE', clue: 'Moral excellence practiced consistently in daily deeds' },
  { answer: 'HUMILITY', clue: 'Absence of pride displayed by Rama toward all beings' },
  { answer: 'WISDOM', clue: 'Discernment distinguishing righteous action from delusion' },
  { answer: 'PEACE', clue: 'Righteous harmony restored upon the victory of truth' }
];

const MAHABHARATA_WORDS = [
  { answer: 'KRISHNA', clue: 'Divine avatar and charioteer who taught the Bhagavad Gita' },
  { answer: 'ARJUNA', clue: 'Master Pandava archer who wove unbroken concentration' },
  { answer: 'BHISHMA', clue: 'Grand sire of Kurus renowned for his terrible vow of celibacy' },
  { answer: 'DHARMA', clue: 'Cosmic order and righteousness: Yato Dharmas Tato Jayah' },
  { answer: 'YUDHISTHIRA', clue: 'Eldest Pandava known as Dharmaraja for his unyielding truth' },
  { answer: 'BHIMA', clue: 'Second Pandava wielder of the mace and colossal physical strength' },
  { answer: 'GANDIVA', clue: 'Celestial divine bow wielded by Arjuna in battle' },
  { answer: 'VYASA', clue: 'Revered sage Krishna Dvaipayana who compiled Mahabharata' },
  { answer: 'HASTINAPUR', clue: 'Ancient capital city of the Kuru dynasty' },
  { answer: 'INDRAPRASTHA', clue: 'Magnificent golden capital built by the Pandavas' },
  { answer: 'KARNA', clue: 'Generous warrior hero and master archer son of Surya' },
  { answer: 'DRONA', clue: 'Royal guru and weapons preceptor to Kurus and Pandavas' },
  { answer: 'DRAUPADI', clue: 'Princess born of holy sacrificial fire and Pandava queen' },
  { answer: 'KURUKSHETRA', clue: 'Sacred battlefield where the war of righteousness was fought' },
  { answer: 'VOW', clue: 'Solemn oath taken by Bhishma to preserve royal lineage' },
  { answer: 'DISCIPLINE', clue: 'Rigorous self-control demonstrated by archer and scholar' },
  { answer: 'CONCENTRATION', clue: 'Unbroken gaze seeing only the bird eye on the branch' },
  { answer: 'WISDOM', clue: 'Profound ethical knowledge imparted in Shanti Parva' },
  { answer: 'CHARIOT', clue: 'Golden vehicle guided by Krishna between the opposing armies' },
  { answer: 'DUTY', clue: 'Action performed without anxious attachment to the fruits' },
  { answer: 'TRUTH', clue: 'Pillar upheld by King Yudhisthira across all tribulations' },
  { answer: 'VALOR', clue: 'Courageous fighting spirit defending the righteous cause' },
  { answer: 'VICTORY', clue: 'Triumph inevitably resting where moral order reigns' },
  { answer: 'JUSTICE', clue: 'Fair governance and protection of the vulnerable' },
  { answer: 'LIBERATION', clue: 'Moksha: ultimate spiritual release from cycle of rebirth' }
];

const gitaPuzzle = buildValidCrosswordLayout(GITA_WORDS, {
  id: 'gita-6-17',
  title: 'Bhagavad Gita: Dhyana Yoga (Verse 6.17)',
  theme: 'Daily prioritization, balanced habits, eating, sleeping, and mindful action.',
  summary: 'Exploration of Bhagavad Gita Chapter 6 Verse 6.17 on how regulated habits in eating, sleeping, recreation, and work eliminate stress and bring success.',
});

const ramayanaPuzzle = buildValidCrosswordLayout(RAMAYANA_WORDS, {
  id: 'ramayana-dharma',
  title: 'Ramayana: Truth, Courage & Righteous Duty',
  theme: 'Timeless principles of Satya, brotherly loyalty, courage, and moral duty from Sage Valmiki epic.',
  summary: 'The life journey of Sri Rama of Ayodhya, exemplifying Maryada Purushottama and the path of steadfast truth.',
});

const mahabharataPuzzle = buildValidCrosswordLayout(MAHABHARATA_WORDS, {
  id: 'mahabharata-epic',
  title: 'Mahabharata: The Great Epic of Dharma',
  theme: 'Moral duty, single-minded concentration, selflessness, and the eternal supremacy of righteousness.',
  summary: 'Sage Vyasa monumental epic depicting the Kuru lineage, the battle of Kurukshetra, and eternal lessons in character.',
});

console.log('Gita words count:', gitaPuzzle.words.length, 'Valid collisions:', hasNoLetterCollisions(gitaPuzzle.words));
console.log('Ramayana words count:', ramayanaPuzzle.words.length, 'Valid collisions:', hasNoLetterCollisions(ramayanaPuzzle.words));
console.log('Mahabharata words count:', mahabharataPuzzle.words.length, 'Valid collisions:', hasNoLetterCollisions(mahabharataPuzzle.words));

const output = `import { CrosswordData } from '../types';

export const SAMPLE_CROSSWORDS: CrosswordData[] = ${JSON.stringify(
  [gitaPuzzle, ramayanaPuzzle, mahabharataPuzzle],
  null,
  2
)};
`;

fs.writeFileSync(path.resolve('src/lib/sampleCrosswords.ts'), output);
console.log('Successfully wrote src/lib/sampleCrosswords.ts with 25-word puzzles!');
