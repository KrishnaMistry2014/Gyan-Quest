export interface GitaWordItem {
  id: number;
  word: string; // Strictly 5 uppercase letters
  chapter: number;
  verse: string;
  chapterName: string;
  sentence: string; // Contains '_____'
  sanskritShloka: string;
  translation: string;
  wordMeaning: string;
  studentWisdom: string;
  hint: string;
}

export const GITA_WORDS: GitaWordItem[] = [
  {
    id: 1,
    word: 'YUKTA',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'He who is _____ in his habits of eating, sleeping, recreation, and work can mitigate all material pains.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'He who is regulated in his habits of eating, sleeping, recreation, and work can mitigate all material pains by practicing the yoga system.',
    wordMeaning: 'yukta = regulated, balanced, disciplined. ahara = eating; vihara = recreation; cestasya = of one who works; karmasu = in discharging duties; swapna-avbodhasya = sleep & wakefulness.',
    studentWisdom: 'Prioritization and moderation! Just like a computer with too many open tabs slows down, an unregulated schedule leads to burnout. By balancing study, sleep, food, and play, you complete work properly without rushing.',
    hint: 'Sanskrit term for "regulated" or "balanced", starting with Y and ending with A.'
  },
  {
    id: 2,
    word: 'AHARA',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Regulated _____ (eating and diet) fuels physical energy and keeps the mind free from lethargy.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'He who is regulated in food and recreation, disciplined in work, and moderate in sleep and wakefulness destroys all sorrow through yoga.',
    wordMeaning: 'ahara = wholesome nourishment, food that gives clarity and sustained vitality.',
    studentWisdom: 'Eating fresh, nutritious meals at regular times prevents fatigue and boosts your concentration while studying.',
    hint: 'Sanskrit word for eating or dietary nourishment (5 letters, starts with A).'
  },
  {
    id: 3,
    word: 'VIHAR',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Mindful _____ (recreation and outdoor play) refreshes a student’s mind after hours of deep study.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Balanced recreation and constructive leisure activities rejuvenate the intellect and eliminate mental exhaustion.',
    wordMeaning: 'vihara = recreation, healthy play, and joyful physical movement.',
    studentWisdom: 'Taking structured outdoor breaks to play sports or stretch gives your brain space to absorb what you just learned.',
    hint: 'Sanskrit term for recreation and refreshing play (5 letters).'
  },
  {
    id: 4,
    word: 'CHEST',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Disciplined _____ (chesta / sincere effort) in daily work ensures steady progress without anxiety.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Through balanced effort and diligent application in all duties, one attains peace and clarity.',
    wordMeaning: 'chesta = regulated action, purposeful effort, avoiding both laziness and frantic overwork.',
    studentWisdom: 'Focus completely on doing your homework honestly one step at a time, rather than worrying about the outcome.',
    hint: 'Root word for regulated action or effort (5 letters).'
  },
  {
    id: 5,
    word: 'KARMA',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Being regulated in all _____ (duties, studies, and actions) leads to freedom from stress and sorrow.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'For one who performs prescribed actions with balance, yoga removes all affliction and suffering.',
    wordMeaning: 'karmasu = in discharging one\'s duties and school studies with balanced discipline.',
    studentWisdom: 'Commit your best effort to every subject. Daily consistent study routine brings confidence during exams.',
    hint: 'Universal principle of dutiful action and work (5 letters).'
  },
  {
    id: 6,
    word: 'SWAPN',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Regulated _____ (rest and sleep) restores brain power and consolidates daily learning.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'One who regulates both sleep and waking hours experiences enhanced memory and intellectual vitality.',
    wordMeaning: 'swapna = sleep and deep rest, keeping the circadian biological clock in perfect rhythm.',
    studentWisdom: 'Going to bed on time every night ensures you wake up alert, energized, and ready to learn in school.',
    hint: 'Sanskrit root for sleep and restful slumber (5 letters).'
  },
  {
    id: 7,
    word: 'BODHA',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Timely waking and keen _____ (alert wakefulness) makes every school morning productive and bright.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'A balanced cycle of wakefulness and rest enables the seeker to destroy all sorrow and stress.',
    wordMeaning: 'avabodha / bodha = wakefulness, sharp alertness, intellectual awareness.',
    studentWisdom: 'Waking up early gives you quiet time to review lessons calmly without morning rush or anxiety.',
    hint: 'Sanskrit term for alertness and awakening (5 letters).'
  },
  {
    id: 8,
    word: 'YOGAS',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Through disciplined habits, true _____ becomes the destroyer of all sorrow and mental distress.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Yoga practiced with regulated habits mitigates all material suffering and clarifies the intellect.',
    wordMeaning: 'yogo / yoga = balanced integration of body, breath, and concentrated mind.',
    studentWisdom: 'Yoga is not just exercise—it is living in balance so your mind stays happy, peaceful, and sharp.',
    hint: 'The sacred discipline of harmony and balance (5 letters).'
  },
  {
    id: 9,
    word: 'DUKHA',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'The ultimate promise of Verse 6.17 is the destruction of all _____ (grief, stress, and pain).',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Duḥkha-hā: that which destroys suffering and bestows enduring serenity and mastery.',
    wordMeaning: 'duhkha = sorrow, distress, and exam stress; ha = the destroyer or remover.',
    studentWisdom: 'Stress disappears naturally when you follow balanced habits of study, nutritious food, and sufficient sleep.',
    hint: 'Sanskrit word for sorrow or distress mitigated by balance (5 letters).'
  },
  {
    id: 10,
    word: 'SLEEP',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Healthy students prioritize 8 to 10 hours of peaceful _____ every single night.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'For one who maintains disciplined sleep and waking routines, yoga destroys all suffering.',
    wordMeaning: 'swapna = sleep discipline for optimal memory consolidation and neural regeneration.',
    studentWisdom: 'Sleeping adequately before test day protects your memory recall and keeps you calm under pressure.',
    hint: 'Essential nightly rest for students (English 5 letters).'
  },
  {
    id: 11,
    word: 'HABIT',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Verse 6.17 teaches that maintaining a steady daily _____ is the secret to lifelong success.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Consistency and regulation in daily practices leads to supreme clarity and well-being.',
    wordMeaning: 'abhyasa / yukta = regular disciplined routines repeated until they become second nature.',
    studentWisdom: 'Follow the 21-day rule: perform your homework and reading at the same time each day to build powerful habits.',
    hint: 'A regular routine repeated daily (English 5 letters).'
  },
  {
    id: 12,
    word: 'FOCUS',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'When recreation, food, and sleep are balanced, a student naturally develops laser-sharp _____.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Regulated living calms restlessness, allowing the intellect to concentrate effortlessly.',
    wordMeaning: 'ekagrata = undivided attention on the task at hand without digital distractions.',
    studentWisdom: 'Put away phones while studying. When you give 100% focus to one math problem, you solve it quickly.',
    hint: 'Undivided single-pointed attention (English 5 letters).'
  },
  {
    id: 13,
    word: 'PEACE',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Living in harmony with Verse 6.17 fills the young mind with profound calm and inner _____.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'By eliminating extreme habits, the mind settles into natural tranquility and peace.',
    wordMeaning: 'shanti = inner tranquility and freedom from worry.',
    studentWisdom: 'True calm comes when you do your duty cheerfully without comparing yourself to others.',
    hint: 'State of calm tranquility (English 5 letters).'
  },
  {
    id: 14,
    word: 'SHINE',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'With balanced living, your natural talents and academic skills begin to truly _____.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'A disciplined life illuminates one\'s intellect and allows inner potential to radiate.',
    wordMeaning: 'tejas = brilliant radiance and energetic enthusiasm for learning.',
    studentWisdom: 'When your body and mind are rested and well-fed, your genuine creativity and brilliance shine out.',
    hint: 'To radiate brightly with knowledge and vitality (5 letters).'
  },
  {
    id: 15,
    word: 'ORDER',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (Verse 6.17)',
    sentence: 'Establishing rhythm and _____ in your day eliminates confusion and makes learning fun.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'Orderly conduct in diet, work, rest, and play is the bedrock of yogic success.',
    wordMeaning: 'ritam = cosmic order and balanced personal discipline.',
    studentWisdom: 'Keep your study desk neat and organized. An orderly space creates a clear and peaceful mind.',
    hint: 'Harmony, structure, and neatness (English 5 letters).'
  }
];

export interface StudentWisdomArticle {
  title: string;
  subtitle: string;
  chapter: string;
  verse: string;
  shloka: string;
  translation: string;
  wordMeanings: { sanskrit: string; english: string }[];
  sections: {
    title: string;
    description: string;
    takeaway: string;
  }[];
  studentTraits: string[];
}

export const STUDENT_ARTICLE_DATA: StudentWisdomArticle = {
  title: 'Bhagavad Gita for Students',
  subtitle: 'Become the Architect of Your Own Success Through Timeless Ancient Wisdom',
  chapter: 'Chapter-6 Dhyana Yoga',
  verse: 'Verse 6.17',
  shloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
  translation: 'He who is regulated in his habits of eating, sleeping, recreation, and work can mitigate all material pains by practicing the yoga system.',
  wordMeanings: [
    { sanskrit: 'yukta', english: 'regulated, balanced, moderate' },
    { sanskrit: 'ahara', english: 'eating / nourishment' },
    { sanskrit: 'viharasya', english: 'recreation / healthy leisure' },
    { sanskrit: 'yukta-cestasya', english: 'regulated in actions for study & duty' },
    { sanskrit: 'karmasu', english: 'in discharging duties and study' },
    { sanskrit: 'swapna-avabodhasya', english: 'sleep and wakefulness cycle' },
    { sanskrit: 'yogo', english: 'practice of yoga and mental balance' },
    { sanskrit: 'bhavati', english: 'becomes' },
    { sanskrit: 'duhkha-ha', english: 'diminishing sorrow, pain, and stress' }
  ],
  sections: [
    {
      title: 'Regulated Resting (Sleep Discipline)',
      description: 'When students get overwhelmed with homework, staying up all night seems like the default instinct. But human bodies run on circadian rhythm: kids (6-13 yrs) need 9-12 hours of night sleep, and teenagers need 8-10 hours. Sleeping too little interferes with short-term memory, slowing reaction time and spiking stress.',
      takeaway: 'Stick to consistent sleep and wake hours. An early-to-bed routine preserves cognitive sharpness for morning classes.'
    },
    {
      title: 'Regulated Eating (Nutritional Fuel)',
      description: 'Junk foods are designed with chemicals and artificial flavor boosters for repeat sales, but they create mental fog. Our body is a sacred machine: eating wholesome fruits, vegetables, pulses, and grains fuels energy. Overeating or late eating causes sluggishness.',
      takeaway: 'Eat 3 timely, colourful meals a day. Always finish dinner at least 2 hours before bedtime.'
    },
    {
      title: 'Staying Active (Physical Health)',
      description: '"A healthy mind resides only in a healthy body." Lack of exercise triggers muscle atrophy, metabolic slowdown, and anxiety. Walk, run, cycle, swim, or do yoga at least 4 days a week. At the same time, avoid extreme over-exhaustion.',
      takeaway: 'Moderate physical movement sharpens neurotransmitters and uplifts mood throughout long study weeks.'
    },
    {
      title: 'Regulated Work (Focus & Devotion)',
      description: 'Work with undivided devotion, similar to a sacred Sankalp before a Yajna. Procrastinating leads to compounding stress and teacher reprimands. Sitting quietly and clarifying "Why am I doing this?" turns boring homework into mastery.',
      takeaway: 'Break large projects into manageable chunks. Do honest, balanced work with regular brief pauses.'
    },
    {
      title: 'Recreation for Our Mind (Preventing Burnout)',
      description: '"All work and no play makes Jack a dull boy." Our minds tire when doing the same task for too long. Healthy breaks with music, drawing, sports, or family time replenish brain energy before returning to study.',
      takeaway: 'Schedule intentional 10-15 minute recreation breaks between deep focus blocks.'
    },
    {
      title: 'Habit Formation (The 21-Day Rule)',
      description: 'When you lack established routines, energy gets drained debating what to do next. If you execute the same constructive schedule at the same time for 21 days, neural pathways consolidate into a lifelong habit.',
      takeaway: 'Make a morning mind map and daily checklist. Maintain it for 21 consecutive days to automate success.'
    }
  ],
  studentTraits: [
    'Gratitude',
    'Consciousness',
    'Attention-span',
    'Memory',
    'Focus',
    'Recall'
  ]
};
