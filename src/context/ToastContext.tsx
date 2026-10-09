import React, { createContext, useContext, useState, useCallback } from 'react';
import { Zap, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastOptions {
  id?: string;
  title: string;
  message?: string;
  type?: 'xp' | 'success' | 'info' | 'error';
  xpAmount?: number;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  dismissToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { ...options, id };

    setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 3 toasts

    const duration = options.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast container */}
      <aside
        id="global-toast-container"
        aria-live="polite"
        className="fixed top-20 right-4 sm:right-8 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
      >
        {toasts.map((toast) => {
          const isXp = toast.type === 'xp' || (typeof toast.xpAmount === 'number' && toast.xpAmount > 0);

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-3 duration-300 ${
                isXp
                  ? 'border-amber-400 bg-amber-50/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 ring-2 ring-amber-400/30'
                  : toast.type === 'error'
                  ? 'border-red-400 bg-red-50/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100'
                  : 'border-warm bg-card/95 text-primary'
              }`}
              style={{
                borderColor: isXp ? '#F59E0B' : undefined,
                boxShadow: isXp ? '0 10px 25px -5px rgba(245, 158, 11, 0.25), 0 8px 10px -6px rgba(245, 158, 11, 0.2)' : undefined,
              }}
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isXp
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-600'
                    : toast.type === 'error'
                    ? 'bg-red-500 text-white'
                    : toast.type === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {isXp ? (
                  <Zap className="w-5 h-5 fill-current animate-bounce" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                    {toast.title}
                  </div>
                  {toast.xpAmount && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                      +{toast.xpAmount} XP
                    </span>
                  )}
                </div>
                {toast.message && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Dismiss X */}
              <button
                type="button"
                onClick={() => toast.id && dismissToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
