import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Zap,
  Gem,
  Sparkles,
  Shield,
  Palette,
  Volume2,
  Check,
  Lock,
  Gift,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Compass,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { getLocalDateString } from '../lib/streak';

interface StoreViewProps {
  onNavigateMyBooks?: () => void;
  onNavigateDashboard?: () => void;
}

interface StoreItem {
  id: string;
  name: string;
  hindiName: string;
  category: 'Avatars' | 'Power-Ups' | 'Practice Packs';
  costXp: number;
  costAmethysts: number;
  description: string;
  hindiDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  gradeRecommendation: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'young_scholar_ring',
    name: 'Young Scholar Golden Crest',
    hindiName: 'युवा विद्वान स्वर्ण किरीट',
    category: 'Avatars',
    costXp: 25,
    costAmethysts: 2,
    description: 'An inspiring golden solar halo around your student avatar celebrating dedication.',
    hindiDescription: 'आपकी प्रोफ़ाइल के चारों ओर एक तेजस्वी स्वर्ण आभा चक्र।',
    icon: Sparkles,
    tag: 'Grade 4–8 Favorite',
    gradeRecommendation: 'Grades 2–8',
  },
  {
    id: 'arjuna_focus_badge',
    name: "Arjuna's Arrow of Focus Badge",
    hindiName: 'अर्जुन एकाग्रता बाण बैज',
    category: 'Avatars',
    costXp: 35,
    costAmethysts: 3,
    description: 'Special student profile crest inspired by Arjuna’s laser-sharp focus and aim.',
    hindiDescription: 'अर्जुन के एकाग्र लक्ष्य संधान से प्रेरित विशेष प्रोफ़ाइल बैज।',
    icon: Award,
    tag: 'Popular',
    gradeRecommendation: 'Grades 4–10',
  },
  {
    id: 'saraswati_lotus_frame',
    name: 'Saraswati Lotus Frame',
    hindiName: 'सरस्वती कमल फ्रेम',
    category: 'Avatars',
    costXp: 45,
    costAmethysts: 4,
    description: 'Sacred white and saffron lotus border awarded to diligent young scholars.',
    hindiDescription: 'विद्या की देवी माँ सरस्वती के श्वेत कमल से सुसज्जित अवतार फ्रेम।',
    icon: Star,
    gradeRecommendation: 'Grades 3–8',
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield Protection',
    hindiName: 'दैनिक स्ट्रीक रक्षा कवच',
    category: 'Power-Ups',
    costXp: 30,
    costAmethysts: 2,
    description: 'Protects your learning streak if you ever miss a single day of study.',
    hindiDescription: 'यदि किसी दिन अध्ययन छूट जाए तो आपकी स्ट्रीक को टूटने से बचाता है।',
    icon: Shield,
    tag: 'Essential',
    gradeRecommendation: 'All Grades',
  },
  {
    id: 'wisdom_hint_compass',
    name: 'Wisdom Compass (Crossword Boost)',
    hindiName: 'ज्ञान दिशा-सूचक (क्रॉसवर्ड संकेत)',
    category: 'Power-Ups',
    costXp: 20,
    costAmethysts: 2,
    description: 'Unlocks a special compass hint in your Pariksha crossword whenever you get stuck.',
    hindiDescription: 'कठिन क्रॉसवर्ड प्रश्नों में सही दिशा और संकेत प्राप्त करने का साधन।',
    icon: Compass,
    gradeRecommendation: 'Grades 4–8',
  },
  {
    id: 'mindful_chime_bell',
    name: 'Golden Temple Chime Sound',
    hindiName: 'स्वर्ण मंदिर घंटी ध्वनि',
    category: 'Power-Ups',
    costXp: 25,
    costAmethysts: 2,
    description: 'Pleasant harmonic brass bell audio signaling break times in Focus Mode.',
    hindiDescription: 'एकाग्रता मोड के 3 मिनट के विश्राम के समय बजने वाली मधुर मंदिर घंटी।',
    icon: Volume2,
    gradeRecommendation: 'All Grades',
  },
  {
    id: 'science_explorer_pack',
    name: 'Junior Science & Vedic Explorer Cards',
    hindiName: 'जूनियर विज्ञान एवं वैदिक अन्वेषक कार्ड',
    category: 'Practice Packs',
    costXp: 40,
    costAmethysts: 3,
    description: 'Bite-sized revision flashcards connecting modern school science with ancient Indian discovery.',
    hindiDescription: 'आधुनिक स्कूल विज्ञान और प्राचीन भारतीय आविष्कारों को समझाने वाले त्वरित कार्ड।',
    icon: BookOpen,
    tag: 'Grade 5–8',
    gradeRecommendation: 'Grades 4–8',
  },
  {
    id: 'maths_tricks_pack',
    name: 'Vedic Math Speed Calculator Pack',
    hindiName: 'वैदिक गणित गति गणना पैक',
    category: 'Practice Packs',
    costXp: 35,
    costAmethysts: 3,
    description: 'Fast mental math shortcuts for multiplication and squaring that make school homework breezy.',
    hindiDescription: 'कक्षा 4 से 8 के छात्रों के लिए तेज़ मानसिक गणित सूत्र और आसान ट्रिक्स।',
    icon: Zap,
    gradeRecommendation: 'Grades 4–9',
  },
];

export const StoreView: React.FC<StoreViewProps> = ({
  onNavigateMyBooks,
  onNavigateDashboard,
}) => {
  const { user, profile, updateProfileXp, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [filter, setFilter] = useState<'All' | 'Avatars' | 'Power-Ups' | 'Practice Packs'>('All');
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gyanquest_unlocked_store_items');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Amethysts balance (defaults to 6 for student welcoming, stored locally)
  const [amethysts, setAmethysts] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gyanquest_amethysts');
      return saved !== null ? parseInt(saved, 10) : 6;
    } catch (_) {
      return 6;
    }
  });

  // Check-in tracking
  const todayStr = getLocalDateString();
  const [lastCheckin, setLastCheckin] = useState<string>(() => {
    try {
      return localStorage.getItem('gyanquest_store_last_checkin') || '';
    } catch (_) {
      return '';
    }
  });
  const hasCheckedInToday = lastCheckin === todayStr;

  // Auto-prompt sign in if user visits store signed out
  useEffect(() => {
    if (!user) {
      openAuthModal();
    }
  }, [user]);

  const currentXp = profile?.xp || 0;

  // Claim Daily Check-In: Strictly 2 Amethysts and 5 XP!
  const handleClaimDailyCheckin = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (hasCheckedInToday) {
      showToast({
        title: language === 'hi' ? 'आज का उपहार लिया जा चुका है' : 'Already Claimed Today',
        message: language === 'hi' ? 'कल फिर आएं और 2 नीलम + 5 XP प्राप्त करें!' : 'Come back tomorrow to claim another 2 Amethysts & 5 XP!',
        type: 'info',
      });
      return;
    }

    const nextAmethysts = amethysts + 2;
    const nextXp = currentXp + 5;

    setAmethysts(nextAmethysts);
    setLastCheckin(todayStr);
    try {
      localStorage.setItem('gyanquest_amethysts', String(nextAmethysts));
      localStorage.setItem('gyanquest_store_last_checkin', todayStr);
    } catch (_) {}

    updateProfileXp(nextXp);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#9333ea', '#eab308'],
    });

    showToast({
      title: language === 'hi' ? 'दैनिक उपहार प्राप्त हुआ!' : 'Daily Check-In Claimed!',
      message: language === 'hi' ? '+2 नीलम और +5 विद्या XP आपके खाते में जोड़ दिए गए हैं!' : '+2 Amethysts and +5 Vidya XP added to your balance!',
      type: 'success',
    });
  };

  // Purchase / Redeem item
  const handleRedeem = (item: StoreItem) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (unlockedItems.includes(item.id)) {
      showToast({
        title: language === 'hi' ? 'पहले से अनलॉक है' : 'Already Unlocked',
        message: language === 'hi' ? `${item.hindiName} पहले से आपकी इन्वेंट्री में उपलब्ध है!` : `${item.name} is already active in your scholar profile!`,
        type: 'info',
      });
      return;
    }

    if (currentXp < item.costXp) {
      showToast({
        title: language === 'hi' ? 'अपर्याप्त विद्या XP' : 'Need More Vidya XP',
        message: language === 'hi'
          ? `${item.hindiName} के लिए ${item.costXp - currentXp} XP और चाहिए। अध्याय पढ़कर XP कमाएं!`
          : `You need ${item.costXp - currentXp} more XP to unlock ${item.name}. Read chapters to earn XP!`,
        type: 'info',
      });
      return;
    }

    // Deduct XP and unlock
    const newXp = currentXp - item.costXp;
    updateProfileXp(newXp);

    const updatedUnlocked = [...unlockedItems, item.id];
    setUnlockedItems(updatedUnlocked);
    try {
      localStorage.setItem('gyanquest_unlocked_store_items', JSON.stringify(updatedUnlocked));
    } catch (_) {}

    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });

    showToast({
      title: language === 'hi' ? 'सफलतापूर्वक अनलॉक हुआ!' : 'Unlocked Successfully!',
      message: language === 'hi' ? `${item.hindiName} अब आपके छात्र प्रोफ़ाइल में जुड़ गया है!` : `${item.name} has been added to your inventory!`,
      type: 'success',
    });
  };

  const filteredItems = filter === 'All'
    ? STORE_ITEMS
    : STORE_ITEMS.filter((i) => i.category === filter);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div
          className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-md"
          style={{ backgroundColor: 'var(--accent-saffron-light)', color: 'var(--accent-saffron-text)' }}
        >
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
          {language === 'hi' ? 'स्टोर में प्रवेश के लिए साइन इन करें' : 'Sign In to Access the Store'}
        </h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          {t.mustSignInStore}
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-md cursor-pointer hover:scale-102 transition-transform"
          style={{ backgroundColor: 'var(--accent-saffron)' }}
        >
          {t.signIn}
        </button>
      </div>
    );
  }

  return (
    <div id="gyan-store-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Hero Store Header & Balances */}
      <div
        className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-2 max-w-xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'ज्ञान क्वेस्ट विद्यार्थी स्टोर' : 'Gyan Quest Student Store • Grades 4–8'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            {t.storeTitle}
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t.storeSubtitle}
          </p>
        </div>

        {/* Currency Display Cards */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Vidya XP Card (Directly from Firestore) */}
          <div
            className="flex-1 md:flex-initial p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[130px] text-center shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>{t.xp}</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums" style={{ color: 'var(--accent-saffron-text)' }}>
              {currentXp}
            </div>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'विद्या शेष' : 'Live Balance'}
            </span>
          </div>

          {/* Amethysts Gems Card */}
          <div
            className="flex-1 md:flex-initial p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[130px] text-center shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5 text-purple-600 dark:text-purple-400">
              <Gem className="w-3.5 h-3.5 fill-current" />
              <span>{t.amethysts}</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">
              {amethysts}
            </div>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {language === 'hi' ? 'नीलम रत्न' : 'Gems Balance'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Check-In Banner: Strictly 2 Amethysts and 5 XP */}
      <div
        className="p-5 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: hasCheckedInToday ? 'var(--bg-card-subtle)' : 'var(--accent-saffron-light)',
              color: hasCheckedInToday ? 'var(--text-muted)' : 'var(--accent-saffron-text)',
            }}
          >
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {language === 'hi' ? 'दैनिक विद्या हाजिरी उपहार' : 'Daily Study Check-In Reward'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {language === 'hi'
                ? 'प्रतिदिन चेक-इन करें और 2 नीलम (Amethysts) तथा 5 विद्या XP प्राप्त करें!'
                : 'Claim your daily attendance bonus of strictly 2 Amethysts + 5 Vidya XP!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClaimDailyCheckin}
          disabled={hasCheckedInToday}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
            hasCheckedInToday
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:scale-102 active:scale-98'
          }`}
          style={{
            backgroundColor: hasCheckedInToday ? 'var(--bg-card-subtle)' : 'var(--accent-saffron)',
            color: hasCheckedInToday ? 'var(--text-muted)' : '#FFFFFF',
          }}
        >
          {hasCheckedInToday ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t.dailyRewardClaimed}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{language === 'hi' ? '2 नीलम + 5 XP लें' : 'Claim 2 Gems + 5 XP'}</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['All', 'Avatars', 'Power-Ups', 'Practice Packs'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === cat ? 'shadow-xs border font-bold' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: filter === cat ? 'var(--accent-saffron)' : 'var(--bg-card)',
              borderColor: filter === cat ? 'var(--accent-saffron)' : 'var(--border-warm)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-primary)',
            }}
          >
            {cat === 'All' ? t.all : cat === 'Avatars' ? t.avatars : cat === 'Power-Ups' ? t.powerups : t.practicePacks}
          </button>
        ))}
      </div>

      {/* Items Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const isUnlocked = unlockedItems.includes(item.id);
          const canAfford = currentXp >= item.costXp;
          const displayName = language === 'hi' ? item.hindiName : item.name;
          const displayDesc = language === 'hi' ? item.hindiDescription : item.description;

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-101 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: 'var(--accent-saffron-light)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <IconComponent className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.tag && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: 'var(--bg-card-subtle)',
                          color: 'var(--accent-saffron-text)',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                    <span
                      className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono tabular-nums flex items-center gap-1 border"
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-warm)',
                        color: 'var(--accent-saffron-text)',
                      }}
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-current" />
                      <span>{item.costXp} XP</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {item.gradeRecommendation}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {displayDesc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-warm)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {isUnlocked
                    ? (language === 'hi' ? 'सक्रिय है' : 'Unlocked & Active')
                    : canAfford
                    ? (language === 'hi' ? 'उपलब्ध है' : 'Ready to unlock')
                    : (language === 'hi' ? `${item.costXp - currentXp} XP कम` : `Need ${item.costXp - currentXp} XP`)}
                </span>

                <button
                  type="button"
                  onClick={() => handleRedeem(item)}
                  disabled={isUnlocked}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isUnlocked
                      ? 'bg-emerald-600 text-white opacity-90'
                      : canAfford
                      ? 'hover:scale-103 active:scale-98 shadow-xs'
                      : 'opacity-70'
                  }`}
                  style={{
                    backgroundColor: isUnlocked
                      ? '#10b981'
                      : canAfford
                      ? 'var(--accent-saffron)'
                      : 'var(--bg-card-subtle)',
                    color: isUnlocked || canAfford ? '#FFFFFF' : 'var(--text-muted)',
                    border: isUnlocked || canAfford ? 'none' : '1px solid var(--border-warm)',
                  }}
                >
                  {isUnlocked ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'अनलॉक' : 'Active'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>{t.redeem}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Bottom Bar */}
      <div
        className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            {language === 'hi' ? 'विद्या XP कैसे अर्जित करें?' : 'How to Earn More Vidya XP?'}
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {language === 'hi'
              ? 'विद्या अध्याय पढ़कर +10 XP, श्रवण सुनकर +5 XP और मनन व परीक्षा हल करके +15 और +50 XP प्राप्त करें!'
              : 'Read chapter notes (+10 XP), listen to narration (+5 XP), and conquer Manan reflection (+15 XP) and Pariksha exams (+50 XP)!'}
          </p>
        </div>

        {onNavigateMyBooks && (
          <button
            type="button"
            onClick={onNavigateMyBooks}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'hi' ? 'अध्याय खोलें' : 'Open My Chapters'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
