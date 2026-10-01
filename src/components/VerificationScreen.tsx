import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, LogOut, ExternalLink, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, sendUserEmailVerification } from '../lib/firebase';

export const VerificationScreen: React.FC = () => {
  const { user, refreshUser, signOutUser } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Automated background verification detection (auto sign-in upon email link click)
  useEffect(() => {
    let intervalId: any;

    const checkVerification = async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setStatusMessage({
              type: 'success',
              text: 'Email verified! Taking you to your dashboard...',
            });
            await refreshUser();
          }
        }
      } catch (err) {
        // silent check
      }
    };

    // Check periodically every 3 seconds
    intervalId = setInterval(checkVerification, 3000);

    // Also check immediately when student returns to this browser tab
    window.addEventListener('focus', checkVerification);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('focus', checkVerification);
    };
  }, [refreshUser]);

  const getEmailProviderUrl = (email?: string | null) => {
    if (!email) return 'https://mail.google.com';
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com';
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') return 'https://outlook.live.com';
    if (domain === 'yahoo.com') return 'https://mail.yahoo.com';
    return `mailto:${email}`;
  };

  const handleCheckEmail = () => {
    const url = getEmailProviderUrl(user?.email);
    window.open(url, '_blank', 'noopener,noreferrer');
    setStatusMessage({
      type: 'success',
      text: `Opening your email provider for ${user?.email}. Once you click the link, you will be signed in automatically.`,
    });
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);
    setStatusMessage(null);
    try {
      await sendUserEmailVerification(auth.currentUser);
      setStatusMessage({
        type: 'success',
        text: `A new verification email has been sent to ${user?.email}.`,
      });
    } catch (err: any) {
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setStatusMessage({
        type: 'error',
        text: msg || 'Failed to resend verification email. Please wait a moment and try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        id="verification-card"
        className="w-full max-w-lg rounded-[32px] border p-8 sm:p-10 shadow-sm text-center relative transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-xs border"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron)',
          }}
        >
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          Verify Your Email
        </h2>

        <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          To access the Gyan Quest dashboard, please verify your email address. We sent a verification link to{' '}
          <strong className="font-semibold break-all" style={{ color: 'var(--text-primary)' }}>
            {user?.email || 'your email'}
          </strong>.
        </p>

        {/* Real-time auto-sign-in listener badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-medium border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
          <span>Listening for verification — you will be automatically signed in</span>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2.5 text-left border ${
              statusMessage.type === 'success'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Check Email */}
          <button
            type="button"
            id="btn-check-email"
            onClick={handleCheckEmail}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Check Email</span>
          </button>

          {/* Resend Verification Email */}
          <button
            type="button"
            id="btn-resend-verification"
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
          >
            <Send className="w-4 h-4" />
            <span>{isResending ? 'Sending...' : 'Resend Verification Email'}</span>
          </button>

          {/* Sign Out */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-verification-signout"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors hover:text-red-500"
              style={{ color: 'var(--text-secondary)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
