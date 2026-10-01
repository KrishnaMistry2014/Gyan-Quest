import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle, loginAsGuest, loginWithEmail, registerWithEmail } from '../lib/firebase';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
        setSuccessMsg('Account created! A verification email has been sent.');
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg('Signed in successfully!');
      }
      setTimeout(() => {
        closeAuthModal();
        setSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setError(msg || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Guest Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md rounded-[32px] border p-6 sm:p-8 shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        <button
          id="auth-modal-close"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--bg-icon)' }}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-current" />
        </button>

        <div>
          <div className="mb-6 text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ backgroundColor: 'var(--accent-saffron-light)', color: 'var(--accent-saffron-text)' }}
            >
              Gyan Quest Portal
            </div>
            <h2 className="text-2xl font-bold">
              {isRegister ? 'Begin Your Quest' : 'Welcome Back'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isRegister
                ? 'Create an account to track your chapters, XP, and streak.'
                : 'Sign in to resume your 5-stage learning progression.'}
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium border"
              style={{
                backgroundColor: '#FEF2F2',
                borderColor: '#FCA5A5',
                color: '#991B1B',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium border"
              style={{
                backgroundColor: '#F0FDF4',
                borderColor: '#86EFAC',
                color: '#166534',
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Auth Options: Google & Guest */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              id="btn-google-signin"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              id="btn-guest-signin"
              onClick={handleGuestAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-icon)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <UserIcon className="w-4 h-4" />
              <span>Continue as Guest</span>
            </button>
          </div>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border-warm)' }}></div>
            </div>
            <span
              className="relative px-3 text-xs uppercase tracking-wider font-medium"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              or with email
            </span>
          </div>

          {/* Email & Password Form (No Forgot Password) */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-email-auth"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between Create Account and Sign In (Strictly No Forgot Password) */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--accent-saffron-text)' }}
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
