import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, closeProfileModal, profile, updateName } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile]);

  if (!isProfileModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await updateName(name.trim());
      closeProfileModal();
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeProfileModal();
      }}
    >
      <div
        id="profile-modal-card"
        className="w-full max-w-md rounded-[32px] border p-6 sm:p-8 shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        <button
          id="profile-modal-close"
          onClick={closeProfileModal}
          className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--bg-icon)' }}
          aria-label="Close profile modal"
        >
          <X className="w-5 h-5 text-current" />
        </button>

        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="profile-name-input"
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Name
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            id="profile-submit-btn"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 px-5 rounded-2xl text-sm font-bold shadow-xs transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};
