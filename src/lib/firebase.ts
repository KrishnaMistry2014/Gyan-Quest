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
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';

const isValidFirebaseApiKey = (key: unknown): boolean =>
  typeof key === 'string' && key.startsWith('AIza') && key.trim().length >= 30;

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const effectiveApiKey = isValidFirebaseApiKey(rawApiKey)
  ? (rawApiKey as string).trim()
  : "AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU";

export const firebaseConfig = {
  apiKey: effectiveApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gyanquest-edu.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gyanquest-edu",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gyanquest-edu.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1056592118463",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1056592118463:web:0f60a0638d3df51edcfc0a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YTJLM3QSNW"
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
  xp?: number;
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
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
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
    xp: 0,
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
  
  // Inherit guest streak and XP if user just logged in with existing guest progress
  let streak = local?.streak ?? (guest.streak > 1 ? guest.streak : 1);
  let xp = typeof local?.xp === 'number' ? local.xp : (guest.xp || 0);
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
    xp,
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
      if (typeof data.xp === 'number') {
        xp = Math.max(data.xp, xp);
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
      xp,
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

export interface ClaimStreakResult {
  profile: UserProfileData;
  newStreak: number;
  xpBonus: number;
  newTotalXp: number;
  alreadyClaimed: boolean;
  activitySource?: string;
}

/**
 * Maintains and advances daily streaks for learning activities in Cloud Firestore.
 * Keeps streak tracking active without check-in bonus XP.
 */
export async function claimUserStreak(
  user: User | null,
  activitySource: string = 'activity'
): Promise<ClaimStreakResult> {
  const today = getLocalDateString();

  if (!user) {
    const guest = getGuestProfile();
    const diffDays = getDateDiffInDays(guest.lastActiveDate, today);

    let newStreak = guest.streak;
    const activeDays = Array.from(new Set([...(guest.activeDays || []), today])).slice(-30);

    if (guest.lastActiveDate === today && guest.streak > 0) {
      // Already active today
      return {
        profile: guest,
        newStreak: guest.streak,
        xpBonus: 0,
        newTotalXp: guest.xp || 0,
        alreadyClaimed: true,
        activitySource,
      };
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
    return {
      profile: updatedGuest,
      newStreak,
      xpBonus: 0,
      newTotalXp: updatedGuest.xp || 0,
      alreadyClaimed: false,
      activitySource,
    };
  }

  // Authenticated user
  const local = getLocalProfile(user.uid) || {
    name: user.displayName || (user.isAnonymous ? 'Guest' : (user.email ? user.email.split('@')[0] : 'Learner')),
    email: user.isAnonymous ? null : (user.email || null),
    streak: 0,
    lastActiveDate: '',
    longestStreak: 0,
    activeDays: [],
    xp: 0,
  };

  const diffDays = getDateDiffInDays(local.lastActiveDate, today);
  let newStreak = local.streak;
  const activeDays = Array.from(new Set([...(local.activeDays || []), today])).slice(-30);

  if (local.lastActiveDate === today && local.streak > 0) {
    // Already active today
    return {
      profile: local,
      newStreak: local.streak,
      xpBonus: 0,
      newTotalXp: local.xp || 0,
      alreadyClaimed: true,
      activitySource,
    };
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
    await setDoc(userRef, {
      streak: newStreak,
      lastActiveDate: today,
      longestStreak: updatedProfile.longestStreak,
      activeDays,
    }, { merge: true });
    console.log(`[Firestore] Daily streak secured for user ${user.uid}: Day ${newStreak} (${activitySource}).`);
  } catch (err) {
    console.debug('Failed to sync streak to Firestore (offline):', err);
  }

  return {
    profile: updatedProfile,
    newStreak,
    xpBonus: 0,
    newTotalXp: updatedProfile.xp || 0,
    alreadyClaimed: false,
    activitySource,
  };
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

export async function addUserXp(user: User | null, amount: number): Promise<UserProfileData> {
  if (!user) {
    const guest = getGuestProfile();
    const currentXp = typeof guest.xp === 'number' ? guest.xp : 0;
    const updated = { ...guest, xp: currentXp + amount };
    saveGuestProfile(updated);
    return updated;
  }
  const local = getLocalProfile(user.uid) || {
    name: user.displayName || 'Learner',
    email: user.isAnonymous ? null : (user.email || null),
    streak: 1,
    lastActiveDate: getLocalDateString(),
    longestStreak: 1,
    activeDays: [getLocalDateString()],
    xp: 0,
  };
  const currentXp = typeof local.xp === 'number' ? local.xp : 0;
  const updated = { ...local, xp: currentXp + amount };
  saveLocalProfile(user.uid, updated);
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { xp: updated.xp }, { merge: true });
  } catch (err) {
    console.debug('Failed to sync XP to Firestore:', err);
  }
  return updated;
}

export interface ChapterRewardResult {
  awarded: boolean;
  xpAdded: number;
  newTotal: number;
  message: string;
}

/**
 * Claim stage XP reward (Shravan 10 XP, Manan 5 XP) for a chapter.
 * Enforces per-user separation and prevents duplicate rewards even across sessions and cache clears.
 */
export async function claimChapterStageReward(
  chapter: {
    id: string;
    uniqueCode?: string;
    title?: string;
    fileName?: string;
    shravanXpClaimed?: boolean;
    mananXpClaimed?: boolean;
  },
  stage: 'shravan' | 'manan',
  user: User | null
): Promise<ChapterRewardResult> {
  const xpToAdd = stage === 'shravan' ? 10 : 5;
  const stageLabel = stage === 'shravan' ? 'Shravan (10 XP)' : 'Manan (5 XP)';

  // Determine user identifier
  let effectiveUserId = user?.uid;
  if (!effectiveUserId && auth.currentUser) {
    effectiveUserId = auth.currentUser.uid;
  }
  if (!effectiveUserId) {
    try {
      const anon = await signInAnonymously(auth);
      effectiveUserId = anon.user.uid;
    } catch {
      effectiveUserId = 'guest_session';
    }
  }

  // Ensure chapter has a valid 10-digit uniqueCode (from 0000000000 to 9999999999)
  let uniqueCode = chapter.uniqueCode;
  if (!uniqueCode || typeof uniqueCode !== 'string' || uniqueCode.length !== 10) {
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += Math.floor(Math.random() * 10).toString();
    }
    uniqueCode = generated;
    chapter.uniqueCode = uniqueCode;
  }

  // 1. Fast check: in-memory state
  if (stage === 'shravan' && chapter.shravanXpClaimed) {
    const local = effectiveUserId ? getLocalProfile(effectiveUserId) : getGuestProfile();
    return {
      awarded: false,
      xpAdded: 0,
      newTotal: local?.xp || 0,
      message: `${stageLabel} has already been claimed for this chapter.`,
    };
  }
  if (stage === 'manan' && chapter.mananXpClaimed) {
    const local = effectiveUserId ? getLocalProfile(effectiveUserId) : getGuestProfile();
    return {
      awarded: false,
      xpAdded: 0,
      newTotal: local?.xp || 0,
      message: `${stageLabel} has already been claimed for this chapter.`,
    };
  }

  // 2. Definitive check in Cloud Firestore database (survives cache clears and cross-device sessions)
  try {
    // Check individual user claimed reward doc
    const rewardDocRef = doc(db, 'users', effectiveUserId, 'claimedRewards', `${uniqueCode}_${stage}`);
    const rewardSnap = await getDoc(rewardDocRef);
    if (rewardSnap.exists()) {
      if (stage === 'shravan') chapter.shravanXpClaimed = true;
      if (stage === 'manan') chapter.mananXpClaimed = true;
      const userDocSnap = await getDoc(doc(db, 'users', effectiveUserId));
      const currentXp = userDocSnap.exists() && typeof userDocSnap.data()?.xp === 'number' ? userDocSnap.data().xp : 0;
      return {
        awarded: false,
        xpAdded: 0,
        newTotal: currentXp,
        message: `${stageLabel} was already claimed for this chapter.`,
      };
    }

    // Check dedicated /chapterCodes/{code} collection
    const chapterCodeDocRef = doc(db, 'chapterCodes', uniqueCode);
    const chapterCodeSnap = await getDoc(chapterCodeDocRef);
    if (chapterCodeSnap.exists()) {
      const data = chapterCodeSnap.data();
      const claimedArray = (data?.[`${stage}ClaimedBy`] as string[]) || [];
      const stageObj = data?.rewards?.[stage];
      if (claimedArray.includes(effectiveUserId) || (stageObj?.claimed && stageObj?.userId === effectiveUserId)) {
        if (stage === 'shravan') chapter.shravanXpClaimed = true;
        if (stage === 'manan') chapter.mananXpClaimed = true;
        const userDocSnap = await getDoc(doc(db, 'users', effectiveUserId));
        const currentXp = userDocSnap.exists() && typeof userDocSnap.data()?.xp === 'number' ? userDocSnap.data().xp : 0;
        return {
          awarded: false,
          xpAdded: 0,
          newTotal: currentXp,
          message: `${stageLabel} was already claimed for this chapter.`,
        };
      }
    }
  } catch (checkErr) {
    console.warn('Firestore reward verification notice:', checkErr);
  }

  // 3. User is eligible! Fetch current XP from Firestore and add reward
  let currentTotalXp = 0;
  try {
    const userDocRef = doc(db, 'users', effectiveUserId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && typeof userSnap.data()?.xp === 'number') {
      currentTotalXp = userSnap.data().xp;
    } else {
      const local = getLocalProfile(effectiveUserId) || getGuestProfile();
      currentTotalXp = typeof local?.xp === 'number' ? local.xp : 0;
    }
  } catch {
    const local = getLocalProfile(effectiveUserId) || getGuestProfile();
    currentTotalXp = typeof local?.xp === 'number' ? local.xp : 0;
  }

  const newTotal = currentTotalXp + xpToAdd;

  // Mark chapter flags in memory
  if (stage === 'shravan') chapter.shravanXpClaimed = true;
  if (stage === 'manan') chapter.mananXpClaimed = true;

  // Update local profile
  const localProf = getLocalProfile(effectiveUserId) || getGuestProfile();
  const updatedProfile: UserProfileData = { ...localProf, xp: newTotal };
  saveLocalProfile(effectiveUserId, updatedProfile);
  if (effectiveUserId === 'guest_session') {
    saveGuestProfile(updatedProfile);
  }

  // Update local chapters list in localStorage
  try {
    const localKey = `gyan_quest_chapters_${effectiveUserId}`;
    const rawChs = localStorage.getItem(localKey);
    if (rawChs) {
      const parsed = JSON.parse(rawChs);
      if (Array.isArray(parsed)) {
        const mod = parsed.map((c: any) =>
          c.id === chapter.id || c.uniqueCode === uniqueCode
            ? { ...c, uniqueCode, [`${stage}XpClaimed`]: true }
            : c
        );
        localStorage.setItem(localKey, JSON.stringify(mod));
      }
    }
  } catch {}

  // 4. Persist reward atomically to Cloud Firestore:
  try {
    // A. Update user document with new XP balance
    await setDoc(doc(db, 'users', effectiveUserId), { xp: newTotal }, { merge: true });

    // B. Register claim in /chapterCodes/{code} collection
    await setDoc(
      doc(db, 'chapterCodes', uniqueCode),
      {
        code: uniqueCode,
        chapterId: chapter.id,
        fileName: chapter.fileName || 'document.pdf',
        title: chapter.title || 'Chapter Notes',
        [`${stage}ClaimedBy`]: arrayUnion(effectiveUserId),
        rewards: {
          [stage]: {
            claimed: true,
            claimedAt: new Date().toISOString(),
            userId: effectiveUserId,
            xp: xpToAdd,
          },
        },
      },
      { merge: true }
    );

    // C. Write to user's claimedRewards subcollection
    await setDoc(
      doc(db, 'users', effectiveUserId, 'claimedRewards', `${uniqueCode}_${stage}`),
      {
        code: uniqueCode,
        chapterId: chapter.id,
        stage,
        xp: xpToAdd,
        claimedAt: new Date().toISOString(),
        userId: effectiveUserId,
      },
      { merge: true }
    );

    // D. Update chapter document in user's chapters subcollection
    if (chapter.id) {
      await setDoc(
        doc(db, 'users', effectiveUserId, 'chapters', chapter.id),
        {
          uniqueCode,
          [`${stage}XpClaimed`]: true,
        },
        { merge: true }
      );
    }

    console.log(`[Firestore] Awarded ${xpToAdd} XP for ${stage} on chapter code ${uniqueCode}. Total: ${newTotal} XP.`);
  } catch (firestoreErr) {
    console.warn('Failed to persist reward to Firestore:', firestoreErr);
  }

  return {
    awarded: true,
    xpAdded: xpToAdd,
    newTotal,
    message: `+${xpToAdd} XP added to your balance!`,
  };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, sendEmailVerification, onSnapshot, doc, getLocalProfile, saveLocalProfile };
export type { User };
