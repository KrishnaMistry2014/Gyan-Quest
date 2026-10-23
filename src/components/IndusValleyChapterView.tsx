import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Compass,
  Headphones,
  Brain,
  ClipboardCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Award,
  Layers,
  MapPin,
  Droplets,
  Hammer,
  Clock,
  HelpCircle,
  Check,
  X,
  ArrowLeft,
  Printer
} from 'lucide-react';
import {
  INDUS_CHAPTER_META,
  INDUS_CHAPTER_SECTIONS,
  TIMELINE_PHASES,
  ARCHAEOLOGICAL_SITES,
  HARAPPAN_CRAFTS,
  KEY_FACT_CARDS,
  EVIDENCE_SORTING_ITEMS,
  GLOSSARY_TERMS,
  PRACTICE_QUESTIONS,
  IndusChapterSection,
  ArchaeologicalSiteEntry,
} from '../data/indusValleyData';
import { SavedChapter } from '../lib/chapters';
import { SCRIPTURES } from '../lib/scriptureData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { claimChapterStageReward } from '../lib/firebase';

interface IndusValleyChapterViewProps {
  onNavigateDashboard?: () => void;
  onNavigateVidya?: (chapter: SavedChapter) => void;
  onNavigateShravan?: (chapter: SavedChapter) => void;
  onNavigateManan?: (chapter: SavedChapter) => void;
  onNavigatePariksha?: (chapter: SavedChapter) => void;
}

interface StoredIndusProgress {
  completedSections: number[];
  answeredQuestions: Record<string, number>;
  reviewedFactCards: string[];
  evidenceAnswers: Record<string, 'evidence' | 'interpretation'>;
  chapterXpClaimed?: boolean;
}

const DEFAULT_PROGRESS: StoredIndusProgress = {
  completedSections: [],
  answeredQuestions: {},
  reviewedFactCards: [],
  evidenceAnswers: {},
  chapterXpClaimed: false,
};

export const IndusValleyChapterView: React.FC<IndusValleyChapterViewProps> = ({
  onNavigateDashboard,
  onNavigateVidya,
  onNavigateShravan,
  onNavigateManan,
  onNavigatePariksha,
}) => {
  const { user, profile, updateProfileXp, recordStreakActivity } = useAuth();
  const { showToast } = useToast();

  const storageKey = useMemo(
    () => `gq_indus_valley_progress_${user?.uid || 'guest'}`,
    [user?.uid]
  );

  const [progress, setProgress] = useState<StoredIndusProgress>(() => {
    try {
      const raw = localStorage.getItem(`gq_indus_valley_progress_${user?.uid || 'guest'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          completedSections: Array.isArray(parsed.completedSections) ? parsed.completedSections : [],
          answeredQuestions: parsed.answeredQuestions && typeof parsed.answeredQuestions === 'object' ? parsed.answeredQuestions : {},
          reviewedFactCards: Array.isArray(parsed.reviewedFactCards) ? parsed.reviewedFactCards : [],
          evidenceAnswers: parsed.evidenceAnswers && typeof parsed.evidenceAnswers === 'object' ? parsed.evidenceAnswers : {},
          chapterXpClaimed: Boolean(parsed.chapterXpClaimed),
        };
      }
    } catch (_) {}
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProgress({
          completedSections: Array.isArray(parsed.completedSections) ? parsed.completedSections : [],
          answeredQuestions: parsed.answeredQuestions && typeof parsed.answeredQuestions === 'object' ? parsed.answeredQuestions : {},
          reviewedFactCards: Array.isArray(parsed.reviewedFactCards) ? parsed.reviewedFactCards : [],
          evidenceAnswers: parsed.evidenceAnswers && typeof parsed.evidenceAnswers === 'object' ? parsed.evidenceAnswers : {},
          chapterXpClaimed: Boolean(parsed.chapterXpClaimed),
        });
      }
    } catch (_) {}
  }, [storageKey]);

  const saveProgress = (updater: (prev: StoredIndusProgress) => StoredIndusProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Navigation & Reading mode states
  const [activeSectionNumber, setActiveSectionNumber] = useState<number>(1);
  const [readingMode, setReadingMode] = useState<'all' | 'focused'>('all');
  const [activeBottomTab, setActiveBottomTab] = useState<'chapter' | 'key-facts' | 'glossary' | 'revision'>('chapter');
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);

  // Interactive visual states
  const [selectedTimelinePhaseId, setSelectedTimelinePhaseId] = useState<string>('mature-harappan');
  const [selectedMapSite, setSelectedMapSite] = useState<ArchaeologicalSiteEntry>(ARCHAEOLOGICAL_SITES[1]); // Mohenjo-daro default
  const [siteFilter, setSiteFilter] = useState<'all' | 'india' | 'pakistan' | 'precursor'>('all');
  const [selectedTownHotspot, setSelectedTownHotspot] = useState<number>(0);
  const [selectedDholaviraStep, setSelectedDholaviraStep] = useState<number>(0);
  const [selectedCraftId, setSelectedCraftId] = useState<string>('beads');
  const [factCategoryFilter, setFactCategoryFilter] = useState<string>('All');
  const [flippedFactCards, setFlippedFactCards] = useState<Record<string, boolean>>({});
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('All');
  const [openPracticeIds, setOpenPracticeIds] = useState<Record<string, boolean>>({});

  const indusChapterObj: SavedChapter = SCRIPTURES.indus_valley;

  const totalQuestionsCount = useMemo(
    () => INDUS_CHAPTER_SECTIONS.reduce((acc, sec) => acc + sec.questions.length, 0),
    []
  );

  const correctQuestionsCount = useMemo(() => {
    let count = 0;
    for (const sec of INDUS_CHAPTER_SECTIONS) {
      for (const q of sec.questions) {
        if (progress.answeredQuestions[q.id] === q.correctIndex) {
          count += 1;
        }
      }
    }
    return count;
  }, [progress.answeredQuestions]);

  const completionPercentage = Math.round(
    (progress.completedSections.length / INDUS_CHAPTER_SECTIONS.length) * 100
  );

  const handleSelectSection = (sectionNum: number) => {
    setActiveSectionNumber(sectionNum);
    setActiveBottomTab('chapter');
    setMobileTocOpen(false);
    if (readingMode === 'all') {
      const el = document.getElementById(`indus-section-${sectionNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 240, behavior: 'smooth' });
    }
  };

  const handleToggleSectionComplete = async (sectionNum: number) => {
    const isAlreadyDone = progress.completedSections.includes(sectionNum);
    const updatedSections = isAlreadyDone
      ? progress.completedSections.filter((n) => n !== sectionNum)
      : [...progress.completedSections, sectionNum].sort((a, b) => a - b);

    saveProgress((prev) => ({
      ...prev,
      completedSections: updatedSections,
    }));

    if (!isAlreadyDone) {
      recordStreakActivity('indus_valley_section_read').catch(() => {});
      if (updatedSections.length === INDUS_CHAPTER_SECTIONS.length && !progress.chapterXpClaimed) {
        try {
          const reward = await claimChapterStageReward(indusChapterObj, 'manan', user, 15);
          saveProgress((prev) => ({ ...prev, chapterXpClaimed: true }));
          if (reward.awarded) {
            updateProfileXp(reward.newTotal);
            showToast('Completed all 16 sections of The Indus Valley Civilization! +15 XP awarded.', 'success');
          } else {
            showToast('All 16 sections marked complete!', 'success');
          }
        } catch {
          showToast('Section marked as completed!', 'info');
        }
      } else {
        showToast(`Section ${sectionNum} marked as completed (${updatedSections.length}/16)`, 'info');
      }
    }
  };

  const handleAnswerQuestion = (questionId: string, optionIdx: number, correctIdx: number, sectionNum: number) => {
    saveProgress((prev) => {
      const nextAnswered = { ...prev.answeredQuestions, [questionId]: optionIdx };
      // Automatically mark section complete if all questions in this section are answered correctly
      const sectionObj = INDUS_CHAPTER_SECTIONS.find((s) => s.number === sectionNum);
      let nextCompleted = prev.completedSections;
      if (
        sectionObj &&
        sectionObj.questions.every((q) => nextAnswered[q.id] === q.correctIndex) &&
        !prev.completedSections.includes(sectionNum)
      ) {
        nextCompleted = [...prev.completedSections, sectionNum].sort((a, b) => a - b);
      }
      return {
        ...prev,
        answeredQuestions: nextAnswered,
        completedSections: nextCompleted,
      };
    });
    if (optionIdx === correctIdx) {
      recordStreakActivity('indus_valley_quiz').catch(() => {});
    }
  };

  const handleResetSectionQuiz = (section: IndusChapterSection) => {
    saveProgress((prev) => {
      const copy = { ...prev.answeredQuestions };
      for (const q of section.questions) {
        delete copy[q.id];
      }
      return { ...prev, answeredQuestions: copy };
    });
  };

  const handleToggleFactCard = (cardId: string) => {
    setFlippedFactCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    if (!progress.reviewedFactCards.includes(cardId)) {
      saveProgress((prev) => ({
        ...prev,
        reviewedFactCards: [...prev.reviewedFactCards, cardId],
      }));
    }
  };

  const handleEvidenceChoice = (itemId: string, choice: 'evidence' | 'interpretation') => {
    saveProgress((prev) => ({
      ...prev,
      evidenceAnswers: {
        ...prev.evidenceAnswers,
        [itemId]: choice,
      },
    }));
  };

  // Filtered sites for Section 5 comparison table
  const filteredSites = useMemo(() => {
    return ARCHAEOLOGICAL_SITES.filter((site) => {
      if (siteFilter === 'all') return true;
      if (siteFilter === 'precursor') return site.id === 'mehrgarh';
      if (siteFilter === 'india') return site.presentLocation.includes('India');
      if (siteFilter === 'pakistan') return site.presentLocation.includes('Pakistan');
      return true;
    });
  }, [siteFilter]);

  // Filtered Key Fact Cards
  const filteredFactCards = useMemo(() => {
    if (factCategoryFilter === 'All') return KEY_FACT_CARDS;
    return KEY_FACT_CARDS.filter((c) => c.category === factCategoryFilter);
  }, [factCategoryFilter]);

  // Filtered Glossary Terms
  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesCat = glossaryCategory === 'All' || item.category === glossaryCategory;
      const q = glossarySearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.exampleInChapter.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [glossaryCategory, glossarySearch]);

  const TOWN_HOTSPOTS = [
    {
      title: '1. Courtyard House & Standardized 1:2:4 Bricks',
      detail:
        'Rooms surrounded an open central courtyard for light and ventilation. Walls used sun-dried mud bricks and kiln-fired baked bricks made in a consistent 1 : 2 : 4 ratio (height : width : length). Outer walls facing main streets avoided ground-floor windows for privacy and dust control.',
    },
    {
      title: '2. Private & Neighbourhood Brick-Lined Wells',
      detail:
        'Deep circular wells built with wedge-shaped baked bricks provided clean groundwater right inside larger houses or shared neighbourhood lanes. Mohenjo-daro alone had roughly 700 wells.',
    },
    {
      title: '3. Sloped Brick Bathing Platform',
      detail:
        'Almost every house had a dedicated bathing area paved with smoothly rubbed, tightly fitted bricks set in gypsum mortar. The floor sloped toward a corner outlet channel in the house wall.',
    },
    {
      title: '4. Domestic Drain & Sediment Sump Pit',
      detail:
        'Wastewater flowed from the house bathing floor through a terracotta pipe or brick chute into a settling sump pit outside, which trapped solid silt and sand before water entered the main street drain.',
    },
    {
      title: '5. Covered Street Drain with Removable Slabs',
      detail:
        'Street drains ran along both sides of planned lanes and were covered with flat bricks or stone slabs. Municipal workers could lift the slabs periodically to scoop out sediment and keep the system flowing.',
    },
  ];

  const DHOLAVIRA_STEPS = [
    {
      step: 'Stage 01',
      title: 'Seasonal Monsoon Streams (Manhar & Mansar)',
      description:
        'Dholavira sits on Khadir Bet island in the semi-arid Rann of Kachchh, where annual rainfall is scarce and groundwater is brackish. Two seasonal streams—Mansar on the north and Manhar on the south—flowed past the settlement after monsoon rains.',
    },
    {
      step: 'Stage 02',
      title: 'Stone Check-Dams (Bunds) & Diversion Channels',
      description:
        'Harappan engineers constructed strong stone bunds across the seasonal streams to slow down flash-flood runoff and divert the fresh water through stone-lined intake channels into the walled city.',
    },
    {
      step: 'Stage 03',
      title: 'Siltation Chambers & Desilting Basins',
      description:
        'Before entering the main storage tanks, water passed through stepped siltation basins where heavy sand, mud, and pebbles settled to the bottom, keeping the main reservoirs clean.',
    },
    {
      step: 'Stage 04',
      title: 'Interconnected Rock-Cut & Stone-Masonry Reservoirs',
      description:
        'At least 16 massive reservoirs—some cut directly into vertical bedrock and lined with dressed sandstone blocks, with steps leading down as water levels dropped—stored tens of thousands of cubic metres of fresh water for the dry months.',
    },
  ];

  // Visual renderers embedded inside sections
  const renderSectionVisual = (visualType?: IndusChapterSection['visualType']) => {
    if (!visualType) return null;

    switch (visualType) {
      case 'timeline': {
        const activePhase = TIMELINE_PHASES.find((p) => p.id === selectedTimelinePhaseId) || TIMELINE_PHASES[2];
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono tabular-nums text-teal-800 dark:text-teal-300 font-semibold">
                  Interactive Chronological Timeline · Click a phase to explore
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  From Early Farming Communities to the Harappan Phases
                </h4>
              </div>
              <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                Note: All BCE dates are approximate and vary by site
              </span>
            </div>

            {/* Phase Selector Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TIMELINE_PHASES.map((phase, idx) => {
                const isSelected = phase.id === activePhase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setSelectedTimelinePhaseId(phase.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected ? 'shadow-sm ring-2 ring-teal-700 dark:ring-amber-500' : 'hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                      borderColor: isSelected ? '#0F766E' : 'var(--border-warm)',
                    }}
                  >
                    <div>
                      <div className="text-[11px] font-mono tabular-nums font-semibold text-teal-800 dark:text-teal-300">
                        Phase 0{idx + 1} · {phase.eraTag}
                      </div>
                      <div className="text-sm font-bold font-serif-heading mt-1" style={{ color: 'var(--text-primary)' }}>
                        {phase.phase}
                      </div>
                    </div>
                    <div className="text-xs font-mono tabular-nums mt-2 pt-2 border-t font-semibold" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
                      {phase.dates}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Phase Detail Panel */}
            <div
              className="rounded-xl border p-4 sm:p-5 space-y-3"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h5 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  {activePhase.phase}
                </h5>
                <span className="text-xs font-mono tabular-nums font-bold text-teal-800 dark:text-teal-300">
                  {activePhase.dates}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activePhase.summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Key Historical Developments:
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activePhase.keyDevelopments.map((dev, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">{i + 1}.</span>
                        <span>{dev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Representative Archaeological Sites:
                  </div>
                  <div className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {activePhase.keySites.join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'map': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  Educational Schematic Map Illustration · Click any site marker
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  Geographical Distribution of Key Sites Across Present-Day Pakistan and India
                </h4>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Schematic illustration · Ancient river courses are approximate
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left: SVG Schematic Map */}
              <div className="lg:col-span-7 rounded-xl border overflow-hidden flex flex-col justify-between bg-[#1E293B] border-stone-700 p-3">
                <svg
                  viewBox="0 0 540 500"
                  className="w-full h-auto max-h-[400px] select-none"
                  role="img"
                  aria-label="Schematic educational map showing approximate locations of Mehrgarh, Harappa, Mohenjo-daro, Rakhigarhi, Kalibangan, Dholavira, and Lothal"
                >
                  {/* Background Land & Sea */}
                  <rect width="540" height="500" fill="#F4EBD9" />
                  {/* Arabian Sea (Bottom Left) */}
                  <path
                    d="M 0 365 Q 95 365 155 390 Q 190 405 220 395 Q 200 420 245 430 Q 280 425 295 450 Q 260 470 290 500 L 0 500 Z"
                    fill="#0F766E"
                    opacity="0.85"
                  />
                  <text x="28" y="455" fill="#E6FFFA" fontSize="13" fontWeight="bold" fontFamily="Georgia, serif">
                    ARABIAN SEA
                  </text>
                  <text x="28" y="472" fill="#CCFBF1" fontSize="10" fontFamily="sans-serif">
                    (Maritime routes toward Oman &amp; Mesopotamia)
                  </text>

                  {/* Northwestern Hills / Balochistan Highlands */}
                  <path
                    d="M 0 0 L 210 0 Q 175 110 140 200 Q 110 280 75 365 L 0 365 Z"
                    fill="#E6CCB2"
                  />
                  <text x="22" y="135" fill="#57534E" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">
                    BALOCHISTAN HIGHLANDS
                  </text>

                  {/* Himalayan Foothills (Top Right) */}
                  <path
                    d="M 210 0 L 540 0 L 540 120 Q 410 95 290 45 Z"
                    fill="#D6C5B3"
                  />
                  <text x="355" y="45" fill="#44403C" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">
                    HIMALAYAN FOOTHILLS
                  </text>

                  {/* Indus River & Punjab Tributaries (Schematic) */}
                  <path
                    d="M 320 50 Q 265 130 235 215 Q 205 275 165 385"
                    stroke="#0D9488"
                    strokeWidth="4"
                    fill="none"
                  />
                  {/* Jhelum / Chenab / Ravi / Sutlej schematic branches */}
                  <path d="M 355 75 Q 300 135 250 195" stroke="#0D9488" strokeWidth="2.2" fill="none" />
                  <path d="M 385 95 Q 325 155 250 195" stroke="#0D9488" strokeWidth="2.2" fill="none" />
                  <path d="M 415 115 Q 355 180 242 210" stroke="#0D9488" strokeWidth="2.2" fill="none" />

                  {/* Ghaggar-Hakra / Saraswati Zone (Dashed to indicate seasonal/studied ancient channels) */}
                  <path
                    d="M 430 135 Q 365 205 305 265 Q 255 315 215 380"
                    stroke="#B45309"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    fill="none"
                  />

                  {/* River & Region Labels */}
                  <text x="165" y="255" fill="#0F766E" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    Indus River
                  </text>
                  <text x="315" y="275" fill="#9A3412" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                    Ghaggar-Hakra Zone (dashed)
                  </text>
                  <text x="260" y="125" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    PUNJAB PLAINS
                  </text>
                  <text x="150" y="340" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    SINDH
                  </text>
                  <text x="265" y="390" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    GUJARAT
                  </text>
                  <text x="385" y="250" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    RAJASTHAN &amp; HARYANA
                  </text>

                  {/* Site Pins */}
                  {ARCHAEOLOGICAL_SITES.map((site) => {
                    const isSelected = selectedMapSite.id === site.id;
                    return (
                      <g
                        key={site.id}
                        onClick={() => setSelectedMapSite(site)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx={site.mapCoords.x}
                            cy={site.mapCoords.y}
                            r="15"
                            fill="#B45309"
                            opacity="0.25"
                          />
                        )}
                        <circle
                          cx={site.mapCoords.x}
                          cy={site.mapCoords.y}
                          r={isSelected ? 8 : 6}
                          fill={site.id === 'mehrgarh' ? '#1E293B' : isSelected ? '#9A3412' : '#0F766E'}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <rect
                          x={site.mapCoords.x + 10}
                          y={site.mapCoords.y - 11}
                          width={site.name.length * 7.2 + 12}
                          height="20"
                          rx="4"
                          fill={isSelected ? '#1E293B' : '#FBF7EE'}
                          stroke={isSelected ? '#F59E0B' : '#78350F'}
                          strokeWidth="1"
                        />
                        <text
                          x={site.mapCoords.x + 16}
                          y={site.mapCoords.y + 3}
                          fill={isSelected ? '#FDE68A' : '#1C1917'}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {site.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="text-[11px] text-stone-300 px-2 pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span>● Teal pins: Harappan cities/towns · ● Indigo pin: Earlier farming settlement (Mehrgarh)</span>
                  <span>Dashed line: Ghaggar-Hakra research zone</span>
                </div>
              </div>

              {/* Right: Selected Site Detail Card */}
              <div
                className="lg:col-span-5 rounded-xl border p-4 sm:p-5 flex flex-col justify-between space-y-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="space-y-3">
                  <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                    Selected Site Profile · {selectedMapSite.presentLocation}
                  </div>
                  <h5 className="text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {selectedMapSite.name}
                  </h5>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <strong>Setting:</strong> {selectedMapSite.regionRiver} · <strong>Period:</strong> {selectedMapSite.phaseHighlight}
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-warm)' }}>
                    <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Significant Archaeological Discoveries:
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {selectedMapSite.discoveries.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400">·</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-warm)' }}>
                    <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Historical Importance:
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {selectedMapSite.historicalImportance}
                    </p>
                  </div>
                </div>

                {/* Quick site selector buttons */}
                <div className="pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--border-warm)' }}>
                  {ARCHAEOLOGICAL_SITES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedMapSite(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        selectedMapSite.id === s.id
                          ? 'bg-teal-800 text-white border-teal-800'
                          : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
                      }`}
                      style={
                        selectedMapSite.id === s.id
                          ? undefined
                          : { borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }
                      }
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'sites-table': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  Comparative Archaeological Reference Table
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  Comparison of Major Archaeological Sites
                </h4>
              </div>

              {/* Interactive Filter Controls */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}>
                {[
                  { id: 'all', label: 'All Sites (7)' },
                  { id: 'india', label: 'Present-Day India (4)' },
                  { id: 'pakistan', label: 'Present-Day Pakistan (3)' },
                  { id: 'precursor', label: 'Early Farming Precursor (1)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSiteFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      siteFilter === tab.id ? 'bg-teal-800 text-white shadow-2xs' : 'hover:opacity-80'
                    }`}
                    style={siteFilter === tab.id ? undefined : { color: 'var(--text-primary)' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}>
                    <th className="py-3 px-3 font-bold">Site</th>
                    <th className="py-3 px-3 font-bold">Present-Day Location &amp; River/Region</th>
                    <th className="py-3 px-3 font-bold">Significant Discoveries</th>
                    <th className="py-3 px-3 font-bold">Historical Importance</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-warm)' }}>
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="align-top hover:bg-amber-500/5 transition-colors">
                      <td className="py-3.5 px-3 font-bold font-serif-heading whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        <div>{site.name}</div>
                        <div className="text-[11px] font-sans font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {site.phaseHighlight}
                        </div>
                      </td>
                      <td className="py-3.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{site.presentLocation}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{site.regionRiver}</div>
                      </td>
                      <td className="py-3.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                        <ul className="space-y-1">
                          {site.discoveries.map((d, idx) => (
                            <li key={idx}>· {d}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3.5 px-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {site.historicalImportance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'town-planning': {
        const activeHotspot = TOWN_HOTSPOTS[selectedTownHotspot] || TOWN_HOTSPOTS[0];
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  Educational Architectural Illustration · Interactive Cross-Section
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  How Harappan Houses, Wells, and Covered Street Drains Worked Together
                </h4>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Click numbered markers (1–5) to inspect each engineering feature
              </span>
            </div>

            {/* SVG Architectural Diagram */}
            <div className="rounded-xl border overflow-hidden bg-[#1E293B] border-stone-700 p-3">
              <svg
                viewBox="0 0 760 320"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Architectural cross-section illustration showing a Harappan courtyard house, brick well, sloped bathing platform, sump pit, and covered street drain"
              >
                {/* Sky & Background */}
                <rect width="760" height="210" fill="#F4EBD9" />
                {/* Underground Soil Layer */}
                <rect y="210" width="760" height="110" fill="#C29B61" />
                <line x1="0" y1="210" x2="760" y2="210" stroke="#78350F" strokeWidth="3" />

                {/* House Courtyard & Brick Walls (Left-Center) */}
                <rect x="45" y="55" width="380" height="155" fill="#E6CCB2" stroke="#9A3412" strokeWidth="4" />
                {/* Standardized Brick Course Lines */}
                <rect x="45" y="55" width="28" height="155" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                <rect x="397" y="55" width="28" height="155" fill="#B45309" stroke="#78350F" strokeWidth="2" />

                {/* Courtyard Open Sky Area */}
                <rect x="115" y="55" width="140" height="115" fill="#FDFBF7" stroke="#D8C7B0" strokeWidth="1.5" />
                <text x="135" y="95" fill="#57534E" fontSize="12" fontWeight="bold" fontFamily="Georgia, serif">
                  Open Central
                </text>
                <text x="145" y="112" fill="#57534E" fontSize="12" fontWeight="bold" fontFamily="Georgia, serif">
                  Courtyard
                </text>

                {/* Brick-Lined Well Shaft going deep underground */}
                <rect x="155" y="145" width="48" height="160" fill="#0F766E" stroke="#9A3412" strokeWidth="6" />
                <rect x="149" y="140" width="60" height="12" fill="#78350F" />
                <text x="152" y="295" fill="#E6FFFA" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                  Deep Well
                </text>

                {/* Bathing Platform with Sloped Brick Floor */}
                <polygon points="285,180 397,192 397,210 285,210" fill="#9A3412" />
                <text x="290" y="168" fill="#1C1917" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Sloped Bathing Floor
                </text>

                {/* Wall Outlet Chute -> Sump Pit */}
                <rect x="395" y="192" width="52" height="10" fill="#0D9488" />
                <rect x="442" y="195" width="44" height="58" fill="#0F766E" stroke="#78350F" strokeWidth="3" />
                <text x="435" y="268" fill="#1C1917" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                  Sump Pit
                </text>

                {/* Connecting Pipe to Covered Main Street Drain */}
                <rect x="486" y="208" width="65" height="12" fill="#0D9488" />

                {/* Covered Main Street Drain (Right) */}
                <rect x="548" y="198" width="150" height="65" fill="#0F766E" stroke="#78350F" strokeWidth="4" />
                {/* Removable Inspection Stone/Brick Slabs on Top of Street Drain */}
                <rect x="544" y="186" width="36" height="12" fill="#D6C5B3" stroke="#78350F" strokeWidth="2" />
                <rect x="583" y="186" width="36" height="12" fill="#D6C5B3" stroke="#78350F" strokeWidth="2" />
                <rect x="622" y="176" width="36" height="12" fill="#FDE68A" stroke="#9A3412" strokeWidth="2" />
                <rect x="661" y="186" width="36" height="12" fill="#D6C5B3" stroke="#78350F" strokeWidth="2" />
                <text x="550" y="155" fill="#1C1917" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Removable Cleaning Slabs
                </text>
                <text x="568" y="236" fill="#E6FFFA" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                  Covered Street Drain
                </text>

                {/* Interactive Hotspot Number Buttons (1-5) */}
                {[
                  { idx: 0, cx: 95, cy: 85 },
                  { idx: 1, cx: 179, cy: 195 },
                  { idx: 2, cx: 340, cy: 190 },
                  { idx: 3, cx: 464, cy: 222 },
                  { idx: 4, cx: 622, cy: 190 },
                ].map((node) => {
                  const active = selectedTownHotspot === node.idx;
                  return (
                    <g
                      key={node.idx}
                      onClick={() => setSelectedTownHotspot(node.idx)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={active ? 16 : 13}
                        fill={active ? '#B45309' : '#1E293B'}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                      />
                      <text
                        x={node.cx}
                        y={node.cy + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.idx + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hotspot Selector Tabs & Explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {TOWN_HOTSPOTS.map((spot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTownHotspot(idx)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    selectedTownHotspot === idx ? 'ring-2 ring-teal-700 dark:ring-amber-500 font-bold' : 'hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: selectedTownHotspot === idx ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                    borderColor: selectedTownHotspot === idx ? '#0F766E' : 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {spot.title}
                </button>
              ))}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="text-sm font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
                {activeHotspot.title}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activeHotspot.detail}
              </p>
            </div>
          </div>
        );
      }

      case 'dholavira-water': {
        const currentStep = DHOLAVIRA_STEPS[selectedDholaviraStep] || DHOLAVIRA_STEPS[0];
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  Educational Engineering Diagram · Dholavira (Kachchh, Gujarat)
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  How Water Was Collected, Filtered, and Stored in Rock-Cut Reservoirs at Dholavira
                </h4>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Step-by-step arid-zone water harvesting system
              </span>
            </div>

            {/* SVG Flow Diagram of Dholavira Water Harvesting */}
            <div className="rounded-xl border overflow-hidden bg-[#1E293B] border-stone-700 p-3">
              <svg
                viewBox="0 0 760 220"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Schematic diagram showing how seasonal streams at Dholavira were diverted by stone bunds through siltation chambers into rock-cut reservoirs"
              >
                <rect width="760" height="220" fill="#F4EBD9" />

                {/* Box 1: Seasonal Streams */}
                <g onClick={() => setSelectedDholaviraStep(0)} className="cursor-pointer">
                  <rect
                    x="20"
                    y="35"
                    width="155"
                    height="150"
                    rx="12"
                    fill={selectedDholaviraStep === 0 ? '#0F766E' : '#E6CCB2'}
                    stroke="#1E293B"
                    strokeWidth="2.5"
                  />
                  <text x="35" y="65" fill={selectedDholaviraStep === 0 ? '#FDE68A' : '#78350F'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    STAGE 01
                  </text>
                  <text x="35" y="90" fill={selectedDholaviraStep === 0 ? '#FFFFFF' : '#1C1917'} fontSize="13" fontWeight="bold" fontFamily="Georgia, serif">
                    Seasonal Streams
                  </text>
                  <text x="35" y="112" fill={selectedDholaviraStep === 0 ? '#E2E8F0' : '#44403C'} fontSize="11" fontFamily="sans-serif">
                    Manhar &amp; Mansar
                  </text>
                  <text x="35" y="132" fill={selectedDholaviraStep === 0 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    Carry brief monsoon
                  </text>
                  <text x="35" y="148" fill={selectedDholaviraStep === 0 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    rainwater runoff
                  </text>
                </g>

                {/* Arrow 1 -> 2 */}
                <path d="M 178 110 L 204 110" stroke="#0F766E" strokeWidth="4" />
                <polygon points="202,103 214,110 202,117" fill="#0F766E" />

                {/* Box 2: Stone Bunds & Channels */}
                <g onClick={() => setSelectedDholaviraStep(1)} className="cursor-pointer">
                  <rect
                    x="215"
                    y="35"
                    width="155"
                    height="150"
                    rx="12"
                    fill={selectedDholaviraStep === 1 ? '#0F766E' : '#E6CCB2'}
                    stroke="#1E293B"
                    strokeWidth="2.5"
                  />
                  <text x="230" y="65" fill={selectedDholaviraStep === 1 ? '#FDE68A' : '#78350F'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    STAGE 02
                  </text>
                  <text x="230" y="90" fill={selectedDholaviraStep === 1 ? '#FFFFFF' : '#1C1917'} fontSize="13" fontWeight="bold" fontFamily="Georgia, serif">
                    Stone Check-Dams
                  </text>
                  <text x="230" y="112" fill={selectedDholaviraStep === 1 ? '#E2E8F0' : '#44403C'} fontSize="11" fontFamily="sans-serif">
                    Bunds &amp; Channels
                  </text>
                  <text x="230" y="132" fill={selectedDholaviraStep === 1 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    Slow stream flow &amp;
                  </text>
                  <text x="230" y="148" fill={selectedDholaviraStep === 1 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    guide water inward
                  </text>
                </g>

                {/* Arrow 2 -> 3 */}
                <path d="M 373 110 L 399 110" stroke="#0F766E" strokeWidth="4" />
                <polygon points="397,103 409,110 397,117" fill="#0F766E" />

                {/* Box 3: Siltation Chambers */}
                <g onClick={() => setSelectedDholaviraStep(2)} className="cursor-pointer">
                  <rect
                    x="410"
                    y="35"
                    width="155"
                    height="150"
                    rx="12"
                    fill={selectedDholaviraStep === 2 ? '#0F766E' : '#E6CCB2'}
                    stroke="#1E293B"
                    strokeWidth="2.5"
                  />
                  <text x="425" y="65" fill={selectedDholaviraStep === 2 ? '#FDE68A' : '#78350F'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    STAGE 03
                  </text>
                  <text x="425" y="90" fill={selectedDholaviraStep === 2 ? '#FFFFFF' : '#1C1917'} fontSize="13" fontWeight="bold" fontFamily="Georgia, serif">
                    Siltation Basins
                  </text>
                  <text x="425" y="112" fill={selectedDholaviraStep === 2 ? '#E2E8F0' : '#44403C'} fontSize="11" fontFamily="sans-serif">
                    Settling Chambers
                  </text>
                  <text x="425" y="132" fill={selectedDholaviraStep === 2 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    Trap heavy sand &amp;
                  </text>
                  <text x="425" y="148" fill={selectedDholaviraStep === 2 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    silt before storage
                  </text>
                </g>

                {/* Arrow 3 -> 4 */}
                <path d="M 568 110 L 594 110" stroke="#0F766E" strokeWidth="4" />
                <polygon points="592,103 604,110 592,117" fill="#0F766E" />

                {/* Box 4: Rock-Cut Reservoirs */}
                <g onClick={() => setSelectedDholaviraStep(3)} className="cursor-pointer">
                  <rect
                    x="605"
                    y="35"
                    width="138"
                    height="150"
                    rx="12"
                    fill={selectedDholaviraStep === 3 ? '#0F766E' : '#E6CCB2'}
                    stroke="#1E293B"
                    strokeWidth="2.5"
                  />
                  <text x="618" y="65" fill={selectedDholaviraStep === 3 ? '#FDE68A' : '#78350F'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    STAGE 04
                  </text>
                  <text x="618" y="90" fill={selectedDholaviraStep === 3 ? '#FFFFFF' : '#1C1917'} fontSize="13" fontWeight="bold" fontFamily="Georgia, serif">
                    Rock-Cut Tanks
                  </text>
                  <text x="618" y="112" fill={selectedDholaviraStep === 3 ? '#E2E8F0' : '#44403C'} fontSize="11" fontFamily="sans-serif">
                    Deep Reservoirs
                  </text>
                  <text x="618" y="132" fill={selectedDholaviraStep === 3 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    Year-round water
                  </text>
                  <text x="618" y="148" fill={selectedDholaviraStep === 3 ? '#E2E8F0' : '#44403C'} fontSize="10.5" fontFamily="sans-serif">
                    inside city walls
                  </text>
                </g>
              </svg>
            </div>

            {/* Step Controls & Description */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {DHOLAVIRA_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setSelectedDholaviraStep(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      selectedDholaviraStep === idx ? 'bg-teal-800 text-white border-teal-800' : 'hover:opacity-85'
                    }`}
                    style={
                      selectedDholaviraStep === idx
                        ? undefined
                        : { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }
                    }
                  >
                    {s.step}: {s.title.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-bold">
                {currentStep.step}
              </div>
              <h5 className="text-base font-bold font-serif-heading mt-0.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {currentStep.title}
              </h5>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {currentStep.description}
              </p>
            </div>
          </div>
        );
      }

      case 'crafts-gallery': {
        const selectedCraft = HARAPPAN_CRAFTS.find((c) => c.id === selectedCraftId) || HARAPPAN_CRAFTS[0];
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  Visual Comparison of Harappan Crafts &amp; Artefacts
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  Materials, Techniques, and Archaeological Evidence Across 8 Craft Traditions
                </h4>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Select any craft category to inspect techniques &amp; cautions
              </span>
            </div>

            {/* Category Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HARAPPAN_CRAFTS.map((craft) => {
                const active = craft.id === selectedCraft.id;
                return (
                  <button
                    key={craft.id}
                    type="button"
                    onClick={() => setSelectedCraftId(craft.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active ? 'ring-2 ring-teal-700 dark:ring-amber-500 font-bold shadow-2xs' : 'hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: active ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                      borderColor: active ? '#0F766E' : 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="text-xs font-serif-heading line-clamp-1">{craft.category}</div>
                    <div className="text-[11px] truncate mt-0.5 font-normal" style={{ color: 'var(--text-muted)' }}>
                      {craft.materialsUsed}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Highlighted Craft Card */}
            <div
              className="rounded-xl border p-4 sm:p-5 space-y-3"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h5 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  {selectedCraft.category}
                </h5>
                <span className="text-xs font-mono text-teal-800 dark:text-teal-300">
                  Materials: {selectedCraft.materialsUsed}
                </span>
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Representative Examples:</strong> {selectedCraft.examples}
              </div>
              <div className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Manufacturing &amp; Craftsmanship:</strong> {selectedCraft.techniquesAndSignificance}
              </div>
              <div
                className="p-3 rounded-lg border text-xs sm:text-sm leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <strong>Archaeological Note:</strong> {selectedCraft.archaeologicalNote}
              </div>
            </div>
          </div>
        );
      }

      case 'evidence-vs-hypothesis': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Interactive Historian Activity · Thinking Like an Archaeologist
              </div>
              <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                Separate Proven Archaeological Evidence from Uncertain Interpretation
              </h4>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                For each statement below, decide whether it is a <strong>Proven Archaeological Fact</strong> or an <strong>Uncertain Historical Interpretation</strong>.
              </p>
            </div>

            <div className="space-y-3">
              {EVIDENCE_SORTING_ITEMS.map((item, idx) => {
                const userChoice = progress.evidenceAnswers[item.id];
                const isCorrect = userChoice === item.type;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border p-4 space-y-2.5"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                        <span className="font-mono font-bold mr-1.5">{idx + 1}.</span>
                        {item.statement}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEvidenceChoice(item.id, 'evidence')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            userChoice === 'evidence'
                              ? 'bg-teal-800 text-white border-teal-800'
                              : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
                          }`}
                          style={
                            userChoice === 'evidence'
                              ? undefined
                              : { borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }
                          }
                        >
                          Archaeological Evidence
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEvidenceChoice(item.id, 'interpretation')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            userChoice === 'interpretation'
                              ? 'bg-amber-700 text-white border-amber-700'
                              : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
                          }`}
                          style={
                            userChoice === 'interpretation'
                              ? undefined
                              : { borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }
                          }
                        >
                          Uncertain Interpretation
                        </button>
                      </div>
                    </div>

                    {userChoice && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                          isCorrect
                            ? 'bg-emerald-950/10 border-emerald-700/40 text-emerald-900 dark:text-emerald-300'
                            : 'bg-amber-950/10 border-amber-700/40 text-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {isCorrect ? (
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong>{isCorrect ? 'Correct! ' : 'Not quite: '}</strong>
                          {item.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'transition-timeline': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Long-Term Historical Transition Diagram
              </div>
              <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                From Early Farming Villages to Urban Peak and Later Regional Continuity
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                {
                  stage: '1. Village Roots (Before c. 3300 BCE)',
                  title: 'Early Farming & Herding',
                  points: 'Mehrgarh & early communities domesticate wheat, barley, cattle, sheep, and goats; mud-brick storage & early crafts.',
                },
                {
                  stage: '2. Regional Towns (c. 3300–2600 BCE)',
                  title: 'Early Harappan Expansion',
                  points: 'Towns spread across Indus & Ghaggar-Hakra plains; wheel-made pottery, fortified settlements, and regional exchange.',
                },
                {
                  stage: '3. Urban Peak (c. 2600–1900 BCE)',
                  title: 'Mature Harappan Cities',
                  points: 'Mohenjo-daro, Harappa, Dholavira, Rakhigarhi, Lothal, Kalibangan; covered drains, seals, script, chert weights, Meluhha trade.',
                },
                {
                  stage: '4. Regional Shift (c. 1900–1300 BCE)',
                  title: 'Late Harappan Transformation',
                  points: 'Gradual climate/river/trade shifts; large cities shrink, seals & script end, but farming villages continue in Punjab, Haryana, UP & Gujarat.',
                },
              ].map((col, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                  }}
                >
                  <div>
                    <div className="text-[11px] font-mono tabular-nums font-bold text-teal-800 dark:text-teal-300">
                      {col.stage}
                    </div>
                    <h5 className="text-sm font-bold font-serif-heading mt-1 mb-2" style={{ color: 'var(--text-primary)' }}>
                      {col.title}
                    </h5>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {col.points}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'quick-revision': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Quick Revision Table &amp; Practice Questions
              </div>
              <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                Essential Facts to Remember
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}>
                    <th className="py-2.5 px-3 font-bold">Revision Question</th>
                    <th className="py-2.5 px-3 font-bold">Core Answer</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>What are the two common names of the civilization?</td>
                    <td className="py-2.5 px-3">Indus Valley Civilization and Harappan Civilization (named after Harappa).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>When was the Mature Harappan urban phase?</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">Approximately 2600–1900 BCE (dates vary by site).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Who excavated Harappa (1921) and Mohenjo-daro (1922), and who announced the discovery (1924)?</td>
                    <td className="py-2.5 px-3">Daya Ram Sahni (Harappa, 1921), R. D. Banerji (Mohenjo-daro, 1922), and Sir John Marshall (1924 announcement).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Which site is famous for the Great Bath, and which for rock-cut reservoirs?</td>
                    <td className="py-2.5 px-3">Mohenjo-daro (Great Bath) and Dholavira (rock-cut reservoirs).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Which site preserved an Early Harappan ploughed field, and which had a bead factory &amp; dockyard basin?</td>
                    <td className="py-2.5 px-3">Kalibangan (ploughed field in Rajasthan) and Lothal (bead factory &amp; basin in Gujarat).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Which fibre crop is especially notable in the history of early textiles?</td>
                    <td className="py-2.5 px-3">Cotton (evidenced by spindle whorls and mineralized cloth traces at Mohenjo-daro).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Has the Indus script been conclusively deciphered?</td>
                    <td className="py-2.5 px-3">No. There is no widely accepted decipherment.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Was the urban transformation after c. 1900 BCE sudden everywhere?</td>
                    <td className="py-2.5 px-3">No; it was gradual, varied by region, and involved multiple factors (climate, rivers, trade, migration).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Long-Answer Practice Questions with Model Answers */}
            <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-sm font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                NCERT-Style Practice Questions (Click to compare with model answer)
              </div>
              {PRACTICE_QUESTIONS.map((pq, idx) => {
                const isOpen = Boolean(openPracticeIds[pq.id]);
                return (
                  <div
                    key={pq.id}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPracticeIds((prev) => ({ ...prev, [pq.id]: !prev[pq.id] }))}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:opacity-90"
                    >
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Q{idx + 1}. {pq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        className="px-3.5 pb-3.5 pt-2 border-t text-xs sm:text-sm leading-relaxed"
                        style={{
                          borderColor: 'var(--border-warm)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-card-subtle)',
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Model Answer: </strong>
                        {pq.modelAnswer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'glossary': {
        return (
          <div
            className="my-6 rounded-2xl border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
              <div>
                <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                  12 Core Chapter Vocabulary Terms
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  Interactive Chapter Glossary
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Filter glossary terms..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item) => (
                <div
                  key={item.term}
                  className="rounded-xl border p-4 space-y-1.5"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h5 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                      {item.term}
                    </h5>
                    <span className="text-[11px] font-mono text-teal-800 dark:text-teal-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.definition}
                  </p>
                  <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                    <strong>In Context:</strong> {item.exampleInChapter}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Render an individual section block
  const renderSectionBlock = (section: IndusChapterSection) => {
    const isCompleted = progress.completedSections.includes(section.number);

    return (
      <article
        key={section.id}
        id={`indus-section-${section.number}`}
        className="rounded-3xl border p-6 sm:p-8 lg:p-10 shadow-2xs space-y-6 scroll-mt-24"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Section Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              <span className="font-bold text-teal-800 dark:text-teal-300">
                Section {String(section.number).padStart(2, '0')} of 16
              </span>
              <span aria-hidden="true">·</span>
              <span>{section.shortTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{section.readMinutes} min read</span>
            </div>
            <h2
              className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-heading mt-1 tracking-tight"
              style={{ color: 'var(--text-primary)', textWrap: 'balance' }}
            >
              {section.number}. {section.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleToggleSectionComplete(section.number)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isCompleted
                ? 'bg-teal-800 text-white border-teal-800'
                : 'hover:border-teal-700'
            }`}
            style={
              isCompleted
                ? undefined
                : {
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }
            }
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Mark as Read</span>
              </>
            )}
          </button>
        </div>

        {/* Lead Paragraph */}
        <p
          className="text-base sm:text-lg font-medium leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {section.leadParagraph}
        </p>

        {/* Main Narrative Paragraphs */}
        <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {section.paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Subtopics Grid (if any) */}
        {section.subtopics && section.subtopics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {section.subtopics.map((sub, idx) => (
              <div
                key={idx}
                className="rounded-2xl border p-4 space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <h3 className="text-sm sm:text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  {sub.heading}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {sub.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Historian's Caution / Method Note */}
        {section.historianNote && (
          <div
            className="rounded-2xl border p-4 sm:p-5 space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-xs font-mono font-bold text-teal-800 dark:text-teal-300">
              Historian’s Note · Archaeological Method
            </div>
            <h4 className="text-sm sm:text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {section.historianNote.title}
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {section.historianNote.text}
            </p>
          </div>
        )}

        {/* Interactive Visual Learning Element */}
        {renderSectionVisual(section.visualType)}

        {/* Check Your Understanding (Section Questions) */}
        <div
          className="rounded-2xl border p-5 sm:p-6 space-y-4 mt-4"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
            <div>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Check Your Understanding · Section {String(section.number).padStart(2, '0')}
              </div>
              <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Test Your Grasp of {section.shortTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleResetSectionQuiz(section)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold hover:opacity-80 cursor-pointer whitespace-nowrap"
              style={{ borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-5">
            {section.questions.map((q, qIdx) => {
              const selectedOption = progress.answeredQuestions[q.id];
              const isAnswered = selectedOption !== undefined;
              const isCorrect = selectedOption === q.correctIndex;

              return (
                <div key={q.id} className="space-y-2.5">
                  <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isThisSelected = selectedOption === optIdx;
                      const isThisCorrect = optIdx === q.correctIndex;

                      let borderStyle = 'var(--border-warm)';
                      let bgStyle = 'var(--bg-card)';
                      if (isAnswered) {
                        if (isThisCorrect) {
                          borderStyle = '#0F766E';
                          bgStyle = 'rgba(15, 118, 110, 0.1)';
                        } else if (isThisSelected && !isThisCorrect) {
                          borderStyle = '#B91C1C';
                          bgStyle = 'rgba(185, 28, 28, 0.08)';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleAnswerQuestion(q.id, optIdx, q.correctIndex, section.number)}
                          className="w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start justify-between gap-3 cursor-pointer hover:opacity-95"
                          style={{
                            backgroundColor: bgStyle,
                            borderColor: borderStyle,
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span>
                            <strong className="font-mono mr-2">{String.fromCharCode(65 + optIdx)}.</strong>
                            {opt}
                          </span>
                          {isAnswered && isThisCorrect && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 dark:text-teal-300 shrink-0">
                              <Check className="w-4 h-4" />
                              <span>Correct</span>
                            </span>
                          )}
                          {isAnswered && isThisSelected && !isThisCorrect && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 shrink-0">
                              <X className="w-4 h-4" />
                              <span>Try again</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className="p-3 rounded-xl border text-xs leading-relaxed"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {isCorrect ? 'Well done! ' : 'Explanation: '}
                      </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Focused Mode Prev / Next Navigation Footer */}
        {readingMode === 'focused' && (
          <div
            className="flex items-center justify-between gap-4 pt-4 border-t"
            style={{ borderColor: 'var(--border-warm)' }}
          >
            <button
              type="button"
              disabled={section.number <= 1}
              onClick={() => handleSelectSection(section.number - 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold disabled:opacity-40 cursor-pointer"
              style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Section</span>
            </button>
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              Section {section.number} / 16
            </span>
            <button
              type="button"
              disabled={section.number >= INDUS_CHAPTER_SECTIONS.length}
              onClick={() => handleSelectSection(section.number + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-saffron)' }}
            >
              <span>Next Section</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </article>
    );
  };

  const activeSectionObj =
    INDUS_CHAPTER_SECTIONS.find((s) => s.number === activeSectionNumber) || INDUS_CHAPTER_SECTIONS[0];

  return (
    <div id="indus-valley-chapter-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Top Breadcrumb & 4-Stage GyanQuest Integration Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-85 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{INDUS_CHAPTER_META.targetAudience}</span>
            <span aria-hidden="true">·</span>
            <span>{INDUS_CHAPTER_META.subjectTag}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Code #{INDUS_CHAPTER_META.uniqueCode}</span>
          </div>
        </div>

        {/* GyanQuest 4-Stage Quest Actions for this Chapter */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateVidya && (
            <button
              type="button"
              onClick={() => onNavigateVidya(indusChapterObj)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Vidya Notes</span>
            </button>
          )}
          {onNavigateShravan && (
            <button
              type="button"
              onClick={() => onNavigateShravan(indusChapterObj)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <Headphones className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Shravan Audio</span>
            </button>
          )}
          {onNavigateManan && (
            <button
              type="button"
              onClick={() => onNavigateManan(indusChapterObj)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <Brain className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Manan Puzzles</span>
            </button>
          )}
          {onNavigatePariksha && (
            <button
              type="button"
              onClick={() => onNavigatePariksha(indusChapterObj)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:opacity-95 cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: 'var(--accent-saffron)' }}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Pariksha Exam (50 XP)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-85 cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title="Print chapter"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Textbook Cover Hero */}
      <section
        className="rounded-3xl border overflow-hidden shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Title, Subtitle, Chapter Question & Learning Goals */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-mono tracking-wide text-teal-800 dark:text-teal-300 font-semibold">
                NCERT Classes 6–8 · History Digital Textbook Chapter · 16 Complete Sections
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight leading-tight"
                style={{ color: 'var(--text-primary)', textWrap: 'balance' }}
              >
                {INDUS_CHAPTER_META.title}
              </h1>

              <p className="text-sm sm:text-base lg:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {INDUS_CHAPTER_META.subtitle}
              </p>

              {/* Guiding Chapter Question */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="text-xs font-mono font-bold text-teal-800 dark:text-teal-300">
                  Guiding Chapter Question
                </div>
                <p className="text-sm sm:text-base font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {INDUS_CHAPTER_META.chapterQuestion}
                </p>
              </div>

              {/* Learning Goals */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Chapter Learning Goals
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {INDUS_CHAPTER_META.learningGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-teal-800 dark:text-teal-300">{idx + 1}.</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chapter Progress Metrics Row */}
            <div
              className="pt-5 border-t grid grid-cols-3 gap-4"
              style={{ borderColor: 'var(--border-warm)' }}
            >
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sections Read</div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {progress.completedSections.length} / 16 ({completionPercentage}%)
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Check Questions</div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {correctQuestionsCount} / {totalQuestionsCount}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Key-Fact Cards</div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {progress.reviewedFactCards.length} / {KEY_FACT_CARDS.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Educational Cover Illustration */}
          <div className="lg:col-span-5 bg-[#1E293B] flex flex-col justify-between p-4 sm:p-6 border-t lg:border-t-0 lg:border-l" style={{ borderColor: 'var(--border-warm)' }}>
            <div className="rounded-2xl overflow-hidden border border-stone-700 bg-[#141E2B] flex-1 flex items-center justify-center">
              <img
                src="/assets/scriptures/indus_valley_harappan.svg"
                alt="Educational illustration of a Mature Harappan planned city and the Great Bath at Mohenjo-daro"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-3 text-xs text-stone-300 leading-relaxed">
              <strong className="text-amber-300">Educational Illustration (Artistic Reconstruction):</strong> A visual overview of Mature Harappan (c. 2600–1900 BCE) urban architecture showing baked-brick buildings, the Great Bath, covered street drains, and a brick-lined neighbourhood well.
            </div>
          </div>
        </div>
      </section>

      {/* Primary Workspace Mode Switcher (Full Chapter, Key-Fact Cards, Glossary, Quick Revision) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {[
            { id: 'chapter', label: '16 Chapter Sections' },
            { id: 'key-facts', label: `Key-Fact Cards (${KEY_FACT_CARDS.length})` },
            { id: 'glossary', label: `Glossary (${GLOSSARY_TERMS.length})` },
            { id: 'revision', label: 'Summary & Revision' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveBottomTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeBottomTab === tab.id ? 'bg-teal-800 text-white shadow-2xs' : 'hover:opacity-85'
              }`}
              style={activeBottomTab === tab.id ? undefined : { color: 'var(--text-primary)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeBottomTab === 'chapter' && (
          <div
            className="inline-flex items-center gap-1 p-1.5 rounded-2xl border self-start"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <button
              type="button"
              onClick={() => setReadingMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                readingMode === 'all' ? 'bg-amber-700 text-white' : 'hover:opacity-85'
              }`}
              style={readingMode === 'all' ? undefined : { color: 'var(--text-primary)' }}
            >
              Continuous Textbook View
            </button>
            <button
              type="button"
              onClick={() => setReadingMode('focused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                readingMode === 'focused' ? 'bg-amber-700 text-white' : 'hover:opacity-85'
              }`}
              style={readingMode === 'focused' ? undefined : { color: 'var(--text-primary)' }}
            >
              Focused Section Reader
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: MAIN CHAPTER SECTIONS + CLICKABLE TABLE OF CONTENTS */}
      {activeBottomTab === 'chapter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Mobile Table of Contents Dropdown */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="w-full p-4 rounded-2xl border flex items-center justify-between font-bold text-sm cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <span>
                Table of Contents ({progress.completedSections.length}/16 Completed)
              </span>
              {mobileTocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {mobileTocOpen && (
              <div
                className="mt-2 rounded-2xl border p-3 space-y-1 max-h-80 overflow-y-auto"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                {INDUS_CHAPTER_SECTIONS.map((sec) => {
                  const done = progress.completedSections.includes(sec.number);
                  const current = activeSectionNumber === sec.number;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleSelectSection(sec.number)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer ${
                        current ? 'font-bold bg-teal-900/10' : ''
                      }`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="truncate">
                        <strong className="font-mono tabular-nums mr-1.5">{String(sec.number).padStart(2, '0')}.</strong>
                        {sec.shortTitle}
                      </span>
                      {done && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sticky Table of Contents Sidebar */}
          <aside
            aria-label="Chapter Table of Contents"
            className="hidden lg:block lg:col-span-3 sticky top-6 rounded-3xl border p-5 space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Table of Contents
              </div>
              <div className="text-sm font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                16 Chapter Sections
              </div>
              {/* Progress Bar */}
              <div className="mt-2.5 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-subtle)' }}>
                <div
                  className="h-full bg-teal-700 transition-all duration-200"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-[11px] font-mono tabular-nums mt-1" style={{ color: 'var(--text-muted)' }}>
                {progress.completedSections.length} of 16 sections completed
              </div>
            </div>

            <nav className="space-y-1">
              {INDUS_CHAPTER_SECTIONS.map((sec) => {
                const isDone = progress.completedSections.includes(sec.number);
                const isCurrent = activeSectionNumber === sec.number;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSection(sec.number)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isCurrent ? 'font-bold border' : 'hover:bg-amber-500/10'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? 'var(--bg-main)' : 'transparent',
                      borderColor: isCurrent ? '#0F766E' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="truncate">
                      <span className="font-mono tabular-nums mr-1.5" style={{ color: 'var(--text-muted)' }}>
                        {String(sec.number).padStart(2, '0')}.
                      </span>
                      {sec.shortTitle}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 opacity-30 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Chapter Reader Column */}
          <div className="lg:col-span-9 space-y-8">
            {readingMode === 'all'
              ? INDUS_CHAPTER_SECTIONS.map((section) => renderSectionBlock(section))
              : renderSectionBlock(activeSectionObj)}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE KEY-FACT CARDS DECK */}
      {activeBottomTab === 'key-facts' && (
        <section
          className="rounded-3xl border p-6 sm:p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
            <div>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Interactive Study Deck · {progress.reviewedFactCards.length} / {KEY_FACT_CARDS.length} Cards Reviewed
              </div>
              <h2 className="text-2xl font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                Key-Fact Revision Cards
              </h2>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Click any card to reveal its full historical explanation and mark it as reviewed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}>
              {['All', 'Dates', 'People', 'Places', 'Artefacts', 'Concepts'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFactCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    factCategoryFilter === cat ? 'bg-teal-800 text-white' : 'hover:opacity-80'
                  }`}
                  style={factCategoryFilter === cat ? undefined : { color: 'var(--text-primary)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFactCards.map((card) => {
              const isFlipped = Boolean(flippedFactCards[card.id]);
              const isReviewed = progress.reviewedFactCards.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => handleToggleFactCard(card.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleFactCard(card.id);
                    }
                  }}
                  className="rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md min-h-[210px]"
                  style={{
                    backgroundColor: isFlipped ? 'var(--bg-card-subtle)' : 'var(--bg-main)',
                    borderColor: isReviewed ? '#0F766E' : 'var(--border-warm)',
                  }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      <span>{card.category} · Section {String(card.sectionRef).padStart(2, '0')}</span>
                      {isReviewed && (
                        <span className="text-teal-800 dark:text-teal-300 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Reviewed</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                      {card.title}
                    </h3>

                    {!isFlipped ? (
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {card.frontSummary}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {card.backDetail}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-warm)' }}>
                    <span className="font-semibold text-teal-800 dark:text-teal-300">
                      {isFlipped ? 'Click to show summary' : 'Click to reveal explanation'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSection(card.sectionRef);
                      }}
                      className="underline hover:opacity-80 cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Go to Section {card.sectionRef}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: GLOSSARY VIEW */}
      {activeBottomTab === 'glossary' && (
        <section
          className="rounded-3xl border p-6 sm:p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
            <div>
              <div className="text-xs font-mono text-teal-800 dark:text-teal-300 font-semibold">
                Section 16 · Complete Historical Vocabulary
              </div>
              <h2 className="text-2xl font-bold font-serif-heading mt-0.5" style={{ color: 'var(--text-primary)' }}>
                Glossary of the Indus Valley Civilization (12 Essential Terms)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Core Concept', 'Archaeology', 'Urban Life & Craft', 'Economy & Writing'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlossaryCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    glossaryCategory === cat ? 'bg-teal-800 text-white border-teal-800' : 'hover:opacity-80'
                  }`}
                  style={glossaryCategory === cat ? undefined : { borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {renderSectionVisual('glossary')}
        </section>
      )}

      {/* TAB 4: SUMMARY & REVISION VIEW */}
      {activeBottomTab === 'revision' && (
        <section
          className="rounded-3xl border p-6 sm:p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {renderSectionBlock(INDUS_CHAPTER_SECTIONS[14])}
        </section>
      )}
    </div>
  );
};
