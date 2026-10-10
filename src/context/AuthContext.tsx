import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  User,
  logOut,
  syncUserAndStreak,
  updateUserName,
  UserProfileData,
  onSnapshot,
  doc,
  getGuestProfile,
  claimUserStreak,
  ClaimStreakResult,
  UserSettingsData,
  DEFAULT_USER_SETTINGS,
  saveUserSettings,
  getUserSettings
} from '../lib/firebase';
import { getLocalDateString } from '../lib/streak';
import { clearLocalChapters } from '../lib/chapters';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  settings: UserSettingsData;
  loading: boolean;
  isEmailUnverified: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  isStreakModalOpen: boolean;
  isSettingsModalOpen: boolean;
  streak: number;
  longestStreak: number;
  isStreakActiveToday: boolean;
  activeDays: string[];
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openStreakModal: () => void;
  closeStreakModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  updateName: (newName: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettingsData>) => Promise<UserSettingsData>;
  claimDailyStreak: (activitySource?: string) => Promise<ClaimStreakResult>;
  recordStreakActivity: (reason?: string) => Promise<ClaimStreakResult | null>;
  refreshUser: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileXp: (newXp: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  settings: DEFAULT_USER_SETTINGS,
  loading: true,
  isEmailUnverified: false,
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  isStreakModalOpen: false,
  isSettingsModalOpen: false,
  streak: 1,
  longestStreak: 1,
  isStreakActiveToday: false,
  activeDays: [],
  openAuthModal: () => {},
  closeAuthModal: () => {},
  openProfileModal: () => {},
  closeProfileModal: () => {},
  openStreakModal: () => {},
  closeStreakModal: () => {},
  openSettingsModal: () => {},
  closeSettingsModal: () => {},
  updateName: async () => {},
  updateSettings: async () => DEFAULT_USER_SETTINGS,
  claimDailyStreak: async () => ({
    profile: getGuestProfile(),
    newStreak: 1,
    xpBonus: 0,
    newTotalXp: 0,
    alreadyClaimed: true,
  }),
  recordStreakActivity: async () => null,
  refreshUser: async () => {},
  signOutUser: async () => {},
  updateProfileXp: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(() => getGuestProfile());
  const [settings, setSettings] = useState<UserSettingsData>(() => {
    try {
      const speed = localStorage.getItem('gyanquest_audio_speed') || '1.0';
      const autoplay = localStorage.getItem('gyanquest_autoplay_audio') === 'true';
      const focus = localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
      return {
        ...DEFAULT_USER_SETTINGS,
        audioSpeed: speed,
        autoplayAudio: autoplay,
        focusModeMinutes: focus,
        streakAlerts: true,
      };
    } catch (_) {
      return DEFAULT_USER_SETTINGS;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Determine if this user is an unverified email/password user
  const isEmailUnverified = Boolean(
    user &&
    !user.isAnonymous &&
    !user.emailVerified &&
    user.providerData.some((p) => p.providerId === 'password')
  );

  const todayStr = getLocalDateString();
  const streak = typeof profile?.streak === 'number' ? profile.streak : 1;
  const longestStreak = Math.max(typeof profile?.longestStreak === 'number' ? profile.longestStreak : 1, streak);
  const isStreakActiveToday = Boolean(profile?.lastActiveDate === todayStr && streak > 0);
  const activeDays = Array.isArray(profile?.activeDays) ? profile.activeDays : [todayStr];

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const initialProfile = await syncUserAndStreak(currentUser);
          setProfile(initialProfile);

          // Realtime listener on Firestore user doc
          const userDocRef = doc(db, 'users', currentUser.uid);
          unsubscribeDoc = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as Partial<UserProfileData>;
                if (data.settings) {
                  const s: UserSettingsData = {
                    ...DEFAULT_USER_SETTINGS,
                    ...data.settings,
                    streakAlerts: true,
                  };
                  setSettings(s);
                  try {
                    localStorage.setItem(`gq_settings_${currentUser.uid}`, JSON.stringify(s));
                    if (s.audioSpeed) localStorage.setItem('gyanquest_audio_speed', s.audioSpeed);
                    if (typeof s.autoplayAudio === 'boolean') {
                      localStorage.setItem('gyanquest_autoplay_audio', String(s.autoplayAudio));
                    }
                    if (s.focusModeMinutes) {
                      const eff = s.focusModeMinutes === 'custom' && s.customMinutes ? String(s.customMinutes) : s.focusModeMinutes;
                      localStorage.setItem('gyanquest_focus_mode_minutes', eff);
                    }
                    localStorage.setItem('gyanquest_streak_alerts', 'true');
                  } catch (_) {}
                }
                setProfile((prev) => ({
                  name: data.name ?? prev?.name ?? 'Learner',
                  email: data.email ?? (currentUser.isAnonymous ? null : currentUser.email),
                  streak: typeof data.streak === 'number' ? data.streak : (prev?.streak ?? 1),
                  xp: typeof data.xp === 'number' ? data.xp : (prev?.xp ?? 0),
                  lastActiveDate: data.lastActiveDate ?? prev?.lastActiveDate ?? getLocalDateString(),
                  longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : (prev?.longestStreak ?? 1),
                  activeDays: Array.isArray(data.activeDays) ? data.activeDays : (prev?.activeDays ?? [getLocalDateString()]),
                  settings: data.settings ? { ...DEFAULT_USER_SETTINGS, ...data.settings, streakAlerts: true } : prev?.settings,
                }));
              }
            },
            (error) => {
              // Gracefully handle offline or reconnecting state without throwing uncaught exceptions
              console.debug('Firestore listener status (offline/reconnecting):', error.message);
            }
          );
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        // Unauthenticated visitor: restore guest profile
        const guest = getGuestProfile();
        setProfile(guest);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const openStreakModal = () => setIsStreakModalOpen(true);
  const closeStreakModal = () => setIsStreakModalOpen(false);

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  const updateName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (user) {
      await updateUserName(user.uid, trimmed);
    }
    setProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
  };

  const claimDailyStreak = useCallback(async (activitySource: string = 'check_in'): Promise<ClaimStreakResult> => {
    try {
      const res = await claimUserStreak(user, activitySource);
      setProfile(res.profile);
      return res;
    } catch (e) {
      console.error('Error claiming streak:', e);
      const fallbackProf = profile || getGuestProfile();
      return {
        profile: fallbackProf,
        newStreak: fallbackProf.streak || 1,
        xpBonus: 0,
        newTotalXp: fallbackProf.xp || 0,
        alreadyClaimed: true,
        activitySource,
      };
    }
  }, [user, profile]);

  const recordStreakActivity = useCallback(async (activitySource: string = 'activity'): Promise<ClaimStreakResult | null> => {
    if (isStreakActiveToday) return null;
    return await claimDailyStreak(activitySource);
  }, [isStreakActiveToday, claimDailyStreak]);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
      clearLocalChapters();
      setUser(null);
      setProfile(getGuestProfile());
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const updateProfileXp = useCallback((newXp: number) => {
    setProfile((prev) => (prev ? { ...prev, xp: newXp } : null));
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettingsData>): Promise<UserSettingsData> => {
    const targetUid = user ? user.uid : 'guest';
    const saved = await saveUserSettings(targetUid, newSettings);
    setSettings(saved);
    setProfile((prev) => (prev ? { ...prev, settings: saved } : null));
    return saved;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        loading,
        isEmailUnverified,
        isAuthModalOpen,
        isProfileModalOpen,
        isStreakModalOpen,
        isSettingsModalOpen,
        streak,
        longestStreak,
        isStreakActiveToday,
        activeDays,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        openStreakModal,
        closeStreakModal,
        openSettingsModal,
        closeSettingsModal,
        updateName,
        updateSettings,
        claimDailyStreak,
        recordStreakActivity,
        refreshUser,
        signOutUser,
        updateProfileXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
