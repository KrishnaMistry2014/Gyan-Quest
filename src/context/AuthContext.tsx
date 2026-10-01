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
  claimUserStreak
} from '../lib/firebase';
import { getLocalDateString } from '../lib/streak';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isEmailUnverified: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  isStreakModalOpen: boolean;
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
  updateName: (newName: string) => Promise<void>;
  claimDailyStreak: () => Promise<boolean>;
  recordStreakActivity: (reason?: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isEmailUnverified: false,
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  isStreakModalOpen: false,
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
  updateName: async () => {},
  claimDailyStreak: async () => false,
  recordStreakActivity: async () => false,
  refreshUser: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(() => getGuestProfile());
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

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
                setProfile((prev) => ({
                  name: data.name ?? prev?.name ?? 'Learner',
                  email: data.email ?? (currentUser.isAnonymous ? null : currentUser.email),
                  streak: typeof data.streak === 'number' ? data.streak : (prev?.streak ?? 1),
                  lastActiveDate: data.lastActiveDate ?? prev?.lastActiveDate ?? getLocalDateString(),
                  longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : (prev?.longestStreak ?? 1),
                  activeDays: Array.isArray(data.activeDays) ? data.activeDays : (prev?.activeDays ?? [getLocalDateString()]),
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

  const updateName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (user) {
      await updateUserName(user.uid, trimmed);
    }
    setProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
  };

  const claimDailyStreak = useCallback(async (): Promise<boolean> => {
    try {
      const updated = await claimUserStreak(user);
      setProfile(updated);
      return true;
    } catch (e) {
      console.error('Error claiming streak:', e);
      return false;
    }
  }, [user]);

  const recordStreakActivity = useCallback(async (_reason?: string): Promise<boolean> => {
    if (isStreakActiveToday) return false;
    return await claimDailyStreak();
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
      setUser(null);
      setProfile(getGuestProfile());
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isEmailUnverified,
        isAuthModalOpen,
        isProfileModalOpen,
        isStreakModalOpen,
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
        updateName,
        claimDailyStreak,
        recordStreakActivity,
        refreshUser,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
