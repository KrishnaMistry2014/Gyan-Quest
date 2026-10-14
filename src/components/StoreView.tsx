import React, { useState } from 'react';
import {
  ShoppingBag,
  Zap,
  Flame,
  Sparkles,
  Shield,
  Palette,
  Volume2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface StoreViewProps {
  onNavigateMyBooks?: () => void;
  onNavigateDashboard?: () => void;
}

interface StoreItem {
  id: string;
  name: string;
  category: 'Avatars' | 'Perks' | 'Themes' | 'Audio';
  costXp: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  unlocked?: boolean;
}

const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'streak_shield',
    name: 'Streak Shield Protection',
    category: 'Perks',
    costXp: 300,
    description: 'Forgives one missed day of study without resetting your learning streak counter to zero.',
    icon: Shield,
    tag: 'Popular',
  },
  {
    id: 'avatar_frame',
    name: 'Vedic Scholar Avatar Ring',
    category: 'Avatars',
    costXp: 500,
    description: 'An ornate brass and saffron halo frame displayed proudly around your student profile.',
    icon: Sparkles,
    tag: 'Exclusive',
  },
  {
    id: 'parchment_gold_theme',
    name: 'Kashi Temple Gold Theme',
    category: 'Themes',
    costXp: 400,
    description: 'Exclusive golden radiance theme accent with polished bronze borders and classical styling.',
    icon: Palette,
  },
  {
    id: 'sanskrit_chants',
    name: 'Vedic Chanting Focus Audio',
    category: 'Audio',
    costXp: 600,
    description: 'Soothing background Gayatri and Shanti mantra instrumental ambience for deep focus sessions.',
    icon: Volume2,
  },
  {
    id: 'guru_sage_persona',
    name: 'Guru AI Sage Persona Pass',
    category: 'Perks',
    costXp: 850,
    description: 'Unlocks deeper philosophical commentary and traditional Upanishadic analogies during Guru AI chats.',
    icon: Zap,
    tag: 'Scholar',
  },
  {
    id: 'chime_pack',
    name: 'Tibetan Singing Bowl Chimes',
    category: 'Audio',
    costXp: 250,
    description: 'Harmonic bronze chime sounds to signal the beginning and end of your Focus Mode walking breaks.',
    icon: Volume2,
  },
];

export const StoreView: React.FC<StoreViewProps> = ({
  onNavigateMyBooks,
  onNavigateDashboard,
}) => {
  const { profile, user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'All' | 'Perks' | 'Avatars' | 'Themes' | 'Audio'>('All');
  const [items, setItems] = useState<StoreItem[]>(INITIAL_STORE_ITEMS);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const currentXp = profile?.xp || 1250; // default demo XP if guest

  const handleRedeem = (item: StoreItem) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (currentXp < item.costXp) {
      showToast({
        title: 'Insufficient Vidya XP',
        message: `You need ${item.costXp - currentXp} more XP to unlock ${item.name}. Complete Vidya chapters and Pariksha tests to earn XP!`,
        type: 'info',
      });
      return;
    }

    setRedeemingId(item.id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, unlocked: true } : i))
      );
      setRedeemingId(null);
      showToast({
        title: 'Artifact Unlocked Successfully!',
        message: `You have successfully redeemed ${item.name} for ${item.costXp} XP from gyanquest-pariksha-store.ai.studio.`,
        type: 'success',
      });
    }, 600);
  };

  const filteredItems = filter === 'All'
    ? items
    : items.filter((i) => i.category === filter);

  return (
    <div id="gyan-store-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Hero Store Card */}
      <div
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-3 max-w-xl">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>GyanQuest Pariksha Store • gyanquest-pariksha-store.ai.studio</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-extrabold font-serif-heading tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Scholar Treasury & Rewards
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Exchange hard-earned Vidya XP and Pariksha mastery points for sacred themes, avatar rings, streak shields, and divine focus focus audio.
          </p>
        </div>

        {/* XP Balance Badge */}
        <div
          className="p-5 rounded-2xl border flex items-center gap-4 shadow-2xs shrink-0"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Available Balance
            </div>
            <div className="text-2xl font-extrabold font-serif-heading" style={{ color: 'var(--accent-saffron)' }}>
              {currentXp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['All', 'Perks', 'Avatars', 'Themes', 'Audio'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
              filter === cat ? 'shadow-xs text-white' : 'hover:opacity-100 opacity-75'
            }`}
            style={{
              backgroundColor: filter === cat ? 'var(--accent-saffron)' : 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-primary)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Store Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const isAffordable = currentXp >= item.costXp;
          const isRedeeming = redeemingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-3xl border p-6 flex flex-col justify-between gap-6 transition-all hover:shadow-md relative overflow-hidden group"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="p-3.5 rounded-2xl transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'var(--accent-saffron-light)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    {item.tag && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: 'var(--accent-saffron-light)',
                          color: 'var(--accent-saffron-text)',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-warm)',
                        color: 'var(--accent-saffron)',
                        borderWidth: '1px',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {item.costXp} XP
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3
                    className="text-lg font-bold font-serif-heading"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-warm)' }}>
                {item.unlocked ? (
                  <div
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'rgb(22, 163, 74)',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unlocked & Active</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRedeem(item)}
                    disabled={isRedeeming}
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:opacity-90 active:scale-[0.98]"
                    style={{
                      backgroundColor: isAffordable ? 'var(--accent-saffron)' : 'var(--bg-main)',
                      color: isAffordable ? '#FFFFFF' : 'var(--text-muted)',
                      border: isAffordable ? 'none' : '1px solid var(--border-warm)',
                    }}
                  >
                    {isRedeeming ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Redeeming...</span>
                      </span>
                    ) : isAffordable ? (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Redeem Artifact</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Needs {item.costXp - currentXp} More XP</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--border-warm)' }}>
        {onNavigateMyBooks && (
          <button
            type="button"
            onClick={onNavigateMyBooks}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Books</span>
          </button>
        )}

        {onNavigateDashboard && (
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer ml-auto"
            style={{
              backgroundColor: 'var(--accent-saffron)',
            }}
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
