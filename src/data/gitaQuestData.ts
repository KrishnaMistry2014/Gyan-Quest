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
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    sentence: 'He who is _____ in his habits of eating, sleeping, recreation, and work can mitigate all material pains.',
    sanskritShloka: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥',
    translation: 'He who is regulated in his habits of eating, sleeping, recreation, and work can mitigate all material pains by practicing the yoga system.',
    wordMeaning: 'yukta = regulated, balanced, disciplined. ahara = eating; vihara = recreation; cestasya = of one who works; karmasu = in discharging duties; swapna-avbodhasya = sleep & wakefulness.',
    studentWisdom: 'Prioritization and moderation! Just like a computer with too many open tabs slows down, an unregulated schedule leads to burnout. By balancing study, sleep, food, and play, you complete work properly without rushing.',
    hint: 'Sanskrit term for "regulated" or "balanced", starting with Y and ending with A.'
  },
  {
    id: 2,
    word: 'KARMA',
    chapter: 2,
    verse: '2.47',
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    sentence: 'You have a right to perform your prescribed _____, but never to the fruits of your actions.',
    sanskritShloka: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    translation: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction.',
    wordMeaning: 'karma = prescribed duty, focused action without anxious fixation on reward.',
    studentWisdom: 'Give 100% devotion to the effort right in front of you—whether homework or exam prep. Worrying obsessively about grades creates exam anxiety; immersing yourself in deep work ensures success.',
    hint: 'The universal principle of cause, effect, and dutiful action (5 letters).'
  },
  {
    id: 3,
    word: 'ATMAN',
    chapter: 2,
    verse: '2.23',
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    sentence: 'The eternal _____ cannot be pierced by weapons, burned by fire, moistened by water, nor withered by wind.',
    sanskritShloka: 'नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः।\nन चैनं क्लेदयन्त्यापो न शोषयति मारुतः॥',
    translation: 'The soul can never be cut to pieces by any weapon, nor burned by fire, nor moistened by water, nor withered by the wind.',
    wordMeaning: 'atman = the immortal self, pure inner consciousness beyond physical limitations.',
    studentWisdom: 'Your self-worth is not defined by temporary setbacks, low marks, or peer pressure. Your inner core is indestructible, resilient, and always capable of rising again.',
    hint: 'Sanskrit word for the inner soul / true immortal self.'
  },
  {
    id: 4,
    word: 'JNANA',
    chapter: 4,
    verse: '4.38',
    chapterName: 'Jnana Karma Sanyasa Yoga',
    sentence: 'In this world, there is nothing so sublime and purifying as transcendental _____.',
    sanskritShloka: 'न हि ज्ञानेन सदृशं पवित्रमिह विद्यते।\nतत्स्वयं योगसंसिद्धः कालेनात्मनि विन्दति॥',
    translation: 'In this world, there is nothing so sublime and pure as transcendental knowledge. One who has become accomplished in yoga finds that knowledge within the self in due course of time.',
    wordMeaning: 'jnana = sacred knowledge, deep experiential understanding and clarity.',
    studentWisdom: 'Never study merely for superficial rote memorization. Cultivate genuine curiosity and thirst for knowledge; true understanding purifies your perspective and lasts for a lifetime.',
    hint: 'Sanskrit word for profound knowledge or spiritual wisdom, begins with J.'
  },
  {
    id: 5,
    word: 'DHYAN',
    chapter: 6,
    verse: '6.12',
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    sentence: 'One should practice _____ by keeping the mind undisturbed, peaceful, and centered upon the self.',
    sanskritShloka: 'तत्रैकाग्रं मनः कृत्वा यतचित्तेन्द्रियक्रियः।\nउपविश्यासने युञ्ज्याद्योगमात्मविशुद्धये॥',
    translation: 'There, having made the mind one-pointed and controlling the actions of the senses, sitting firmly on one\'s seat, one should practice yoga for the purification of the heart.',
    wordMeaning: 'dhyana / dhyan = deep meditation, unfluctuating contemplative focus.',
    studentWisdom: 'Take 5 to 10 quiet minutes every morning before opening textbooks or phones. Centering your breathing stills the mind and trains your attention span.',
    hint: 'The practice of meditation and mental stillness (5 letters).'
  },
  {
    id: 6,
    word: 'PEACE',
    chapter: 2,
    verse: '2.71',
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    sentence: 'One who renounces all selfish desires and lives free from false ego attains supreme _____.',
    sanskritShloka: 'विहाय कामान्यः सर्वान्पुमांश्चरति निःस्पृहः।\nनिर्ममो निरहङ्कारः स शान्तिमधिगच्छति॥',
    translation: 'A person who has given up all desires for sense gratification, who lives free from desires, who has given up all sense of proprietorship and is devoid of false ego—he alone attains real peace.',
    wordMeaning: 'shanti = supreme inner peace, equanimity amidst life\'s storms.',
    studentWisdom: 'True mental calm comes when you stop comparing yourself with classmates and stop dwelling on past regrets. Simplicity and gratitude unlock deep peace.',
    hint: 'State of calm tranquility (English 5 letters).'
  },
  {
    id: 7,
    word: 'FOCUS',
    chapter: 6,
    verse: '6.19',
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    sentence: 'With unwavering _____, the disciplined mind of a yogi is likened to a lamp flame that does not flicker in a windless place.',
    sanskritShloka: 'यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता।\nयोगिनो यतचित्तस्य युञ्जतो योगमात्मनः॥',
    translation: 'As a lamp in a windless place does not waver, so the disciplined mind of a yogi engaged in meditation remains steady and undisturbed.',
    wordMeaning: 'ekagrata = single-pointed focus and devotion to the task at hand.',
    studentWisdom: 'Eliminate multitasking while studying. Put away notifications and social feeds. When you direct your full attention to one problem, you solve it in a fraction of the time.',
    hint: 'Unwavering single-pointed attention (English 5 letters).'
  },
  {
    id: 8,
    word: 'SLEEP',
    chapter: 6,
    verse: '6.17',
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    sentence: 'For one who observes disciplined _____ and timely waking, yoga mitigates all worldly suffering.',
    sanskritShloka: 'युक्तस्वप्नावबोधस्य योगो भवति दुःखहा।',
    translation: 'For one who is regulated in sleep and wakefulness, the practice of yoga diminishes all miseries.',
    wordMeaning: 'swapna = sleep and rest. Early to bed, early to rise maintains circadian vitality.',
    studentWisdom: 'Kids need 9-12 hours and teenagers need 8-10 hours of night sleep. Staying up all night to cram reduces cognitive reaction time and short-term memory. Consistent rest keeps the internal clock sharp.',
    hint: 'Vital resting habit for students (English 5 letters).'
  },
  {
    id: 9,
    word: 'HABIT',
    chapter: 6,
    verse: '6.35',
    chapterName: 'Dhyana Yoga & Student Guidance',
    sentence: 'Through dedicated practice and constant _____, even the restless and turbulent mind can be conquered.',
    sanskritShloka: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥',
    translation: 'The mind is undoubtedly very restless and difficult to curb, O mighty-armed Arjuna; but by constant practice (abhyasa) and detachment, it can be mastered.',
    wordMeaning: 'abhyasa = disciplined repetition leading to positive habit formation.',
    studentWisdom: 'The 21-Day Rule: If you perform the same constructive study routine at the same time every day for 21 days, a neural habit is cemented, saving decision fatigue and willpower.',
    hint: 'A regular routine repeated over 21 days becomes a second nature (5 letters).'
  },
  {
    id: 10,
    word: 'HEART',
    chapter: 18,
    verse: '18.61',
    chapterName: 'Moksha Sanyasa Yoga',
    sentence: 'The Supreme Divine dwells in the _____ of every living being, guiding their journey.',
    sanskritShloka: 'ईश्वरः सर्वभूतानां हृद्देशेऽर्जुन तिष्ठति।\nभ्रामयन्सर्वभूतानि यन्त्रारूढानि मायया॥',
    translation: 'The Supreme Lord is situated in everyone\'s heart, O Arjuna, and is directing the wanderings of all living entities as if they are seated on a machine made of material energy.',
    wordMeaning: 'hridaya = the spiritual heart, the inner sanctum of consciousness and intuition.',
    studentWisdom: 'Listen to your quiet conscience when faced with peer pressure or moral choices. Study not just with your intellect, but with heartfelt purpose to serve the greater good.',
    hint: 'The inner sanctum of intuition and compassion (English 5 letters).'
  },
  {
    id: 11,
    word: 'LIGHT',
    chapter: 11,
    verse: '11.12',
    chapterName: 'Vishwarupa Darshana Yoga',
    sentence: 'If the radiance of a thousand suns burst forth at once in the sky, it might resemble that cosmic _____.',
    sanskritShloka: 'दिवि सूर्यसहस्रस्य भवेद्युगपदुत्थिता।\nयदि भाः सदृशी सा स्याद्भासस्तस्य महात्मनः॥',
    translation: 'If hundreds of thousands of suns were to rise at once into the sky, their brilliance might resemble the radiance of that Supreme Universal Form.',
    wordMeaning: 'prakasha / jyoti = celestial divine light that dispels the darkness of ignorance.',
    studentWisdom: 'Education is the lamp that dispels darkness. When you master a difficult concept, you experience that burst of inner illumination. Never let despair eclipse your inner flame.',
    hint: 'Illumination that dispels darkness (English 5 letters).'
  },
  {
    id: 12,
    word: 'FAITH',
    chapter: 17,
    verse: '17.3',
    chapterName: 'Shraddhatraya Vibhaga Yoga',
    sentence: 'Every person\'s character is shaped by their _____; whatever one deeply believes in, that one becomes.',
    sanskritShloka: 'सत्त्वानुरूपा सर्वस्य श्रद्धा भवति भारत।\nश्रद्धामयोऽयं पुरुषो यो यच्छ्रद्धः स एव सः॥',
    translation: 'The faith of each person conforms to their mental disposition, O descendant of Bharata. A human being is constituted of faith; whatever faith one holds, that verily one is.',
    wordMeaning: 'shraddha = heartfelt faith, conviction, and alignment of purpose.',
    studentWisdom: 'Believe in your capacity to learn and evolve. If you believe you are incapable of mastering math or science, that belief holds you back; if you cultivate growth faith, effort creates mastery.',
    hint: 'Deep belief and conviction (English 5 letters).'
  },
  {
    id: 13,
    word: 'SATVA',
    chapter: 14,
    verse: '14.17',
    chapterName: 'Gunatraya Vibhaga Yoga',
    sentence: 'From the quality of _____ arises true illumination, knowledge, and inner clarity.',
    sanskritShloka: 'सत्त्वात्सञ्जायते ज्ञानं रजसो लोभ एव च।\nप्रमादमोहौ तमसो भवतोऽज्ञानमेव च॥',
    translation: 'From the mode of goodness (sattva), real knowledge develops; from the mode of passion, grief and greed; and from ignorance, folly, madness and darkness.',
    wordMeaning: 'sattva / satva = purity, harmony, clarity, wholesome vegetarian nourishment and serene thoughts.',
    studentWisdom: 'Eat wholesome, vibrant foods with fresh fruits, pulses, and vegetables. Avoid processed junk food that slows your body and causes mental lethargy.',
    hint: 'The pure mode of goodness and harmony in Vedic philosophy (5 letters).'
  },
  {
    id: 14,
    word: 'TYAGA',
    chapter: 18,
    verse: '18.2',
    chapterName: 'Moksha Sanyasa Yoga',
    sentence: 'The wise declare that true _____ is relinquishing the selfish craving for the fruits of all activities.',
    sanskritShloka: 'काम्यानां कर्मणां न्यासं संन्यासं कवयो विदुः।\nसर्वकर्मफलत्यागं प्राहुस्त्यागं विचक्षणाः॥',
    translation: 'Giving up activities that are based on material desire is what great sages call renunciation (sannyasa). And abandoning the fruits of all activities is what the wise call tyaga.',
    wordMeaning: 'tyaga = renunciation of selfish greed while cheerfully fulfilling one\'s obligations.',
    studentWisdom: 'Let go of unnecessary distractions—scrolling mindlessly, gaming during study hours, or procrastinating. Sacrificing momentary impulse unlocks lifelong excellence.',
    hint: 'Sanskrit term for noble sacrifice and renunciation of selfish cravings.'
  },
  {
    id: 15,
    word: 'YOGIS',
    chapter: 6,
    verse: '6.47',
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    sentence: 'Of all _____, one who always abides in Me with great faith is held by Me to be the highest.',
    sanskritShloka: 'योगिनामपि सर्वेषां मद्गतेनान्तरात्मना।\nश्रद्धावान्भजते यो मां स मे युक्ततमो मतः॥',
    translation: 'And of all yogis, the one who with great faith always abides in Me, thinks of Me within himself, and renders transcendental loving service to Me—he is the most intimately united with Me in yoga and is the highest of all.',
    wordMeaning: 'yogis = disciplined practitioners who unify mind, body, and spiritual awareness.',
    studentWisdom: 'A student who studies with devotion and gratitude is also a yogi. Treat your desk as your sacred altar, your books as instruments of discovery, and your exams as your test of character.',
    hint: 'Plural term for dedicated seekers of spiritual union (5 letters).'
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
    { sanskrit: 'yukta-cestasya', english: 'regulated in actions for livelihood' },
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
