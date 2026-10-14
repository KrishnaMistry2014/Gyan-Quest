import React, { useState } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface StoreViewProps {
  onNavigateMyBooks?: () => void;
  onNavigateDashboard?: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  onNavigateMyBooks,
  onNavigateDashboard,
}) => {
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey((prev) => prev + 1);
    showToast({
      title: 'Store Reloaded',
      message: 'Refreshed gyanquest-pariksha-store.ai.studio successfully.',
      type: 'success',
    });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleOpenNewTab = () => {
    window.open('https://gyanquest-pariksha-store.ai.studio', '_blank');
  };

  return (
    <div id="gyan-store-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div
        className="rounded-3xl border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="p-2.5 rounded-2xl"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  color: 'var(--accent-saffron-text)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Integrated Store • gyanquest-pariksha-store.ai.studio</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight mt-1"
                style={{ color: 'var(--text-primary)' }}
              >
                GyanQuest Pariksha Store
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Embedded gyanquest-pariksha-store.ai.studio store portal in the main window.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Reload Store</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </button>

          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
              }}
            >
              <span>Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Store Iframe Window */}
      <div
        className="rounded-3xl border overflow-hidden shadow-sm relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          height: '75vh',
          minHeight: '600px',
        }}
      >
        <iframe
          key={iframeKey}
          src="https://gyanquest-pariksha-store.ai.studio"
          title="GyanQuest Pariksha Store Portal"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
