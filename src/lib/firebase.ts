import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU",
  authDomain: "gyanquest-edu.firebaseapp.com",
  projectId: "gyanquest-edu",
  storageBucket: "gyanquest-edu.firebasestorage.app",
  messagingSenderId: "1056592118463",
  appId: "1:1056592118463:web:0f60a0638d3df51edcfc0a",
  measurementId: "G-YTJLM3QSNW"
};

// Singleton initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Force pure long polling to bypass WebChannel stream disconnects and Listen RPC errors in iframes/proxies
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

import { getLocalDateString, getDateDiffInDays } from './streak';

export interface UserProfileData {
  name: string;
  email: string | null;
  streak: number;
  lastActiveDate: string;
  longestStreak?: number;
  activeDays?: string[];
}

const GUEST_STORAGE_KEY = 'gq_guest_profile';

export const getGuestProfile = (): UserProfileData => {
  const today = getLocalDateString();
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || 'Learner',
        email: null,
        streak: typeof parsed.streak === 'number' ? parsed.streak : 1,
        lastActiveDate: parsed.lastActiveDate || today,
        longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 1,
        activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays : [today],
      };
    }
  } catch {
    // fallback below
  }
  const defaultGuest: UserProfileData = {
    name: 'Learner',
    email: null,
    streak: 1,
    lastActiveDate: today,
    longestStreak: 1,
    activeDays: [today],
  };
  saveGuestProfile(defaultGuest);
  return defaultGuest;
};

export const saveGuestProfile = (data: UserProfileData) => {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage error
  }
};

const getLocalProfile = (uid: string): UserProfileData | null => {
  try {
    const raw = localStorage.getItem(`gq_profile_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage error
  }
  return null;
};

const saveLocalProfile = (uid: string, data: UserProfileData) => {
  try {
    localStorage.setItem(`gq_profile_${uid}`, JSON.stringify(data));
  } catch {
    // ignore storage error
  }
};

/**
 * Synchronize user profile & streak with Firestore.
 * Strictly stores:
 * - name
 * - email (null for Guest)
 * - streak
 * - lastActiveDate
 * - longestStreak
 * - activeDays
 */
export async function syncUserAndStreak(user: User): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const today = getLocalDateString();

  const local = getLocalProfile(user.uid);
  const guest = getGuestProfile();

  let name = local?.name || user.displayName || (user.isAnonymous ? 'Guest' : (user.email ? user.email.split('@')[0] : 'Learner'));
  const email = user.isAnonymous ? null : (user.email || null);
  
  // Inherit guest streak if user just logged in with existing guest progress
  let streak = local?.streak ?? (guest.streak > 1 ? guest.streak : 1);
  let lastActiveDate = local?.lastActiveDate || guest.lastActiveDate || today;
  let longestStreak = Math.max(local?.longestStreak || 1, guest.longestStreak || 1, streak);
  let activeDays = Array.isArray(local?.activeDays) ? [...local.activeDays] : (guest.activeDays || [today]);
  if (!activeDays.includes(lastActiveDate)) {
    activeDays.push(lastActiveDate);
  }

  // Validate streak continuity based on last active date
  if (lastActiveDate) {
    const diffDays = getDateDiffInDays(lastActiveDate, today);
    if (diffDays === 0) {
      // Active today
      if (!activeDays.includes(today)) activeDays.push(today);
    } else if (diffDays === 1) {
      // Last active yesterday - streak preserved and ready to extend today
      streak = Math.max(1, streak);
    } else if (diffDays > 1) {
      // Missed more than 1 day - streak reset
      streak = 0;
    }
  }

  const currentProfile: UserProfileData = {
    name,
    email,
    streak,
    lastActiveDate,
    longestStreak,
    activeDays: activeDays.slice(-30),
  };
  saveLocalProfile(user.uid, currentProfile);

  // Sync to Firestore in background / online
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.name) {
        name = data.name;
      }
      const remoteLastActive = data.lastActiveDate || lastActiveDate;
      const remoteStreak = typeof data.streak === 'number' ? data.streak : streak;
      const remoteLongest = typeof data.longestStreak === 'number' ? data.longestStreak : longestStreak;
      const remoteActiveDays = Array.isArray(data.activeDays) ? data.activeDays : activeDays;

      const diffDays = getDateDiffInDays(remoteLastActive, today);
      if (diffDays === 0) {
        streak = Math.max(remoteStreak, streak);
        lastActiveDate = today;
      } else if (diffDays === 1) {
        streak = Math.max(remoteStreak, streak);
        lastActiveDate = remoteLastActive;
      } else if (diffDays > 1) {
        streak = 0;
        lastActiveDate = remoteLastActive;
      }

      longestStreak = Math.max(remoteLongest, longestStreak, streak);
      activeDays = Array.from(new Set([...activeDays, ...remoteActiveDays])).slice(-30);
    }

    const profileData: UserProfileData = {
      name,
      email,
      streak,
      lastActiveDate,
      longestStreak,
      activeDays,
    };

    saveLocalProfile(user.uid, profileData);
    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  } catch (err) {
    // Offline or connection pending: proceed with locally computed profile
    return currentProfile;
  }
}

/**
 * Claims or advances daily streak for today.
 * Works for both authenticated users and guests.
 */
export async function claimUserStreak(user: User | null): Promise<UserProfileData> {
  const today = getLocalDateString();

  if (!user) {
    const guest = getGuestProfile();
    const diffDays = getDateDiffInDays(guest.lastActiveDate, today);

    let newStreak = guest.streak;
    const activeDays = Array.from(new Set([...(guest.activeDays || []), today])).slice(-30);

    if (guest.lastActiveDate === today && guest.streak > 0) {
      // Already claimed today
      return guest;
    } else if (diffDays === 1) {
      // Consecutive day!
      newStreak = (guest.streak || 0) + 1;
    } else {
      // First day or restarted
      newStreak = 1;
    }

    const updatedGuest: UserProfileData = {
      ...guest,
      streak: newStreak,
      lastActiveDate: today,
      longestStreak: Math.max(guest.longestStreak || 0, newStreak),
      activeDays,
    };
    saveGuestProfile(updatedGuest);
    return updatedGuest;
  }

  // Authenticated user
  const local = getLocalProfile(user.uid) || {
    name: user.displayName || (user.isAnonymous ? 'Guest' : (user.email ? user.email.split('@')[0] : 'Learner')),
    email: user.isAnonymous ? null : (user.email || null),
    streak: 0,
    lastActiveDate: '',
    longestStreak: 0,
    activeDays: [],
  };

  const diffDays = getDateDiffInDays(local.lastActiveDate, today);
  let newStreak = local.streak;
  const activeDays = Array.from(new Set([...(local.activeDays || []), today])).slice(-30);

  if (local.lastActiveDate === today && local.streak > 0) {
    // Already claimed today
    return local;
  } else if (diffDays === 1) {
    newStreak = (local.streak || 0) + 1;
  } else {
    newStreak = 1;
  }

  const updatedProfile: UserProfileData = {
    ...local,
    streak: newStreak,
    lastActiveDate: today,
    longestStreak: Math.max(local.longestStreak || 0, newStreak),
    activeDays,
  };

  saveLocalProfile(user.uid, updatedProfile);

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, updatedProfile, { merge: true });
  } catch (err) {
    console.debug('Failed to sync claimed streak to Firestore (offline):', err);
  }

  return updatedProfile;
}

export async function updateUserName(uid: string, newName: string): Promise<void> {
  const local = getLocalProfile(uid);
  if (local) {
    saveLocalProfile(uid, { ...local, name: newName });
  }
  const userRef = doc(db, 'users', uid);
  try {
    await setDoc(userRef, { name: newName }, { merge: true });
  } catch {
    // Will sync when reconnected
  }
}

export async function sendUserEmailVerification(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function loginAsGuest(): Promise<User> {
  const cred = await signInAnonymously(auth);
  await syncUserAndStreak(cred.user);
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await syncUserAndStreak(cred.user);
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserAndStreak(cred.user);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  try {
    await sendEmailVerification(cred.user);
  } catch (e) {
    console.warn('Email verification send notice:', e);
  }
  await syncUserAndStreak(cred.user);
  return cred.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, sendEmailVerification, onSnapshot, doc };
export type { User };
