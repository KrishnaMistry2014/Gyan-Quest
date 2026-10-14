import React, { useState } from 'react';
import {
  ShoppingBag,
  Zap,
  Flame,
  Sparkles,
  Shield,
  Palette,
  Volume2,
  Lock,
  ArrowRight,
  BookOpen,
  ExternalLink
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
}

const STORE_ITEMS: StoreItem[] = [
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

  const currentXp = profile?.xp || 0;

  const handleOpenNewStore = () => {
    window.open('https://gyanquest-pariksha-store.ai.studio', '_blank');
  };

  const handleAttemptRedeem = (item: StoreItem) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (currentXp < item.costXp) {
      showToast({
        title: 'Insufficient Vidya XP',
        message: `You need ${item.costXp - currentXp} more XP to unlock ${item.name}. Complete Vidya and Shravan stages to earn XP!`,
        type: 'info',
      });
      return;
    }

    showToast({
      title: 'Redirecting to New Store',
      message: `Opening gyanquest-pariksha-store.ai.studio to redeem ${item.name} with your ${currentXp} XP!`,
      type: 'success',
    });
    setTimeout(() => {
      window.open('https://gyanquest-pariksha-store.ai.studio', '_blank');
    }, 800);
  };

  const filteredItems = filter === 'All'
    ? STORE_ITEMS
    : STORE_ITEMS.filter((i) => i.category === filter);

  return (
    <div id="gyan-store-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Hero Store Card - Upgraded to gyanquest-pariksha-store.ai.studio */}
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
            <span>Official Pariksha Store • gyanquest-pariksha-store.ai.studio</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Gyan Quest Pariksha Store
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Welcome to the newly upgraded dedicated store portal at <strong className="font-mono text-amber-600 dark:text-amber-400">gyanquest-pariksha-store.ai.studio</strong>. Redeem your Vidya XP for exclusive perks, Vedic audio, avatars, and exam prep bundles.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenNewStore}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Launch gyanquest-pariksha-store.ai.studio</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live User XP Display Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col items-center justify-center min-w-[200px] text-center shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            <Zap className="w-4 h-4 text-amber-500 fill-current" />
            <span>Scholar Balance</span>
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums" style={{ color: 'var(--accent-saffron-text)' }}>
            {currentXp} <span className="text-base font-bold">XP</span>
          </div>
          <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {user ? 'Authenticated Scholar' : 'Guest Learner'}
          </span>
          <a
            href="https://gyanquest-pariksha-store.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Visit Pariksha Store</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['All', 'Perks', 'Avatars', 'Themes', 'Audio'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === cat
                ? 'shadow-xs border'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: filter === cat ? 'var(--accent-saffron)' : 'var(--bg-card)',
              borderColor: filter === cat ? 'var(--accent-saffron)' : 'var(--border-warm)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-primary)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const canAfford = currentXp >= item.costXp;

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
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span>{item.costXp} XP</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </h3>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {item.category}
                  </span>
                  <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-warm)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {canAfford ? 'Ready in Pariksha Store' : `Need ${item.costXp - currentXp} more XP`}
                </span>

                <button
                  type="button"
                  onClick={() => handleAttemptRedeem(item)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-103 active:scale-98 shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <span>Redeem</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA to earn XP */}
      <div
        className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Explore Full Catalog at gyanquest-pariksha-store.ai.studio
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Redeem rewards, sync your student profile, and unlock premium pariksha materials instantly.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewStore}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
          style={{
            backgroundColor: 'var(--accent-saffron)',
            color: '#FFFFFF',
          }}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Pariksha Store</span>
        </button>
      </div>
    </div>
  );
};
