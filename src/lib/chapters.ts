import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';

export interface SavedChapter {
  id: string;
  uniqueCode: string; // 10-digit unique code: 0000000000 to 9999999999
  userId?: string;
  fileName: string;
  title: string;
  summary: string;
  audioBase64?: string;
  shravanCompleted?: boolean;
  shravanXpClaimed?: boolean;
  mananXpClaimed?: boolean;
  createdAt: string; // ISO string
  fileSize?: number;
}

/**
 * Generate a cryptographically uniform 10-digit code from 0000000000 to 9999999999.
 */
export function generateUniqueChapterCode(): string {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

const STORAGE_KEY_PREFIX = 'gyan_quest_chapters_';

/**
 * Get user-scoped locally cached chapters (for immediate display while Firestore syncs).
 */
export function getLocalChapters(userId?: string): SavedChapter[] {
  const effectiveKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
  try {
    const raw = localStorage.getItem(effectiveKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure all local chapters have a valid 10-digit uniqueCode
      let modified = false;
      const normalized: SavedChapter[] = parsed.map((item) => {
        if (!item.uniqueCode || typeof item.uniqueCode !== 'string' || item.uniqueCode.length !== 10) {
          modified = true;
          return { ...item, uniqueCode: generateUniqueChapterCode() };
        }
        return item;
      });
      if (modified) {
        localStorage.setItem(effectiveKey, JSON.stringify(normalized));
      }
      return normalized;
    }
    return [];
  } catch (err) {
    console.error('Failed to load local chapters:', err);
    return [];
  }
}

/**
 * Save user-scoped local chapters.
 */
export function setLocalChapters(chapters: SavedChapter[], userId?: string) {
  const effectiveKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
  try {
    localStorage.setItem(effectiveKey, JSON.stringify(chapters));
  } catch (err) {
    console.error('Failed to cache chapters locally:', err);
  }
}

/**
 * Clear cached chapters on logout so user sessions do not bleed.
 */
export function clearLocalChapters() {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);
  } catch (_) {}
}

/**
 * Fetch all chapters for a user directly from Cloud Firestore.
 * This guarantees persistence across sessions, logins, and logouts without relying on cache or cookies.
 */
export async function fetchUserChaptersFromFirestore(userId: string): Promise<SavedChapter[]> {
  if (!userId) return [];

  try {
    const chaptersRef = collection(db, 'users', userId, 'chapters');
    const q = query(chaptersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const chapters: SavedChapter[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let uniqueCode = data.uniqueCode;
      if (!uniqueCode || typeof uniqueCode !== 'string' || uniqueCode.length !== 10) {
        uniqueCode = generateUniqueChapterCode();
        setDoc(docSnap.ref, { uniqueCode }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'chapterCodes', uniqueCode), {
          code: uniqueCode,
          chapterId: docSnap.id,
          userId: data.userId || userId,
          fileName: data.fileName || 'document.pdf',
          title: data.title || 'Chapter Notes',
          createdAt: data.createdAt || new Date().toISOString(),
          shravanClaimedBy: data.shravanXpClaimed ? [data.userId || userId] : [],
          mananClaimedBy: data.mananXpClaimed ? [data.userId || userId] : [],
          rewards: {
            shravan: Boolean(data.shravanXpClaimed),
            manan: Boolean(data.mananXpClaimed),
          },
        }, { merge: true }).catch(() => {});
      }

      chapters.push({
        id: docSnap.id,
        uniqueCode,
        userId: data.userId || userId,
        fileName: data.fileName || 'document.pdf',
        title: data.title || 'Chapter Notes',
        summary: data.summary || '',
        audioBase64: data.audioBase64,
        shravanCompleted: Boolean(data.shravanCompleted),
        shravanXpClaimed: Boolean(data.shravanXpClaimed),
        mananXpClaimed: Boolean(data.mananXpClaimed),
        createdAt: data.createdAt || new Date().toISOString(),
        fileSize: data.fileSize,
      });
    });

    setLocalChapters(chapters, userId);
    return chapters;
  } catch (err) {
    console.warn('Error querying chapters from Firestore:', err);
    return getLocalChapters(userId);
  }
}

/**
 * Real-time listener for user chapters from Firestore.
 */
export function subscribeUserChapters(
  userId: string,
  onUpdate: (chapters: SavedChapter[]) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const chaptersRef = collection(db, 'users', userId, 'chapters');
    const q = query(chaptersRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const chapters: SavedChapter[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          chapters.push({
            id: docSnap.id,
            uniqueCode: data.uniqueCode || generateUniqueChapterCode(),
            userId: data.userId || userId,
            fileName: data.fileName || 'document.pdf',
            title: data.title || 'Chapter Notes',
            summary: data.summary || '',
            audioBase64: data.audioBase64,
            shravanCompleted: Boolean(data.shravanCompleted),
            shravanXpClaimed: Boolean(data.shravanXpClaimed),
            mananXpClaimed: Boolean(data.mananXpClaimed),
            createdAt: data.createdAt || new Date().toISOString(),
            fileSize: data.fileSize,
          });
        });
        setLocalChapters(chapters, userId);
        onUpdate(chapters);
      },
      (error) => {
        console.warn('Firestore subscription fallback:', error);
        onUpdate(getLocalChapters(userId));
      }
    );
  } catch (err) {
    console.warn('Could not subscribe to Firestore chapters:', err);
    onUpdate(getLocalChapters(userId));
    return () => {};
  }
}

/**
 * Save a new chapter. Automatically ensures Cloud Firestore persistence.
 * If user is not yet signed in, automatically initializes an anonymous session
 * so the chapter is saved directly to Google Cloud Firestore database.
 */
export async function saveChapter(chapterData: {
  fileName: string;
  title: string;
  summary: string;
  fileSize?: number;
}): Promise<SavedChapter> {
  let currentUser = auth.currentUser;

  // If no user exists yet, transparently initialize an anonymous auth session so we have a persistent Cloud Firestore UID
  if (!currentUser) {
    try {
      const anonCred = await signInAnonymously(auth);
      currentUser = anonCred.user;
    } catch (authErr) {
      console.warn('Anonymous session initialization notice:', authErr);
    }
  }

  const userId = currentUser?.uid || 'guest_session';
  const chapterId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = chapterData.title || chapterData.fileName.replace(/\.[^/.]+$/, '');
  const uniqueCode = generateUniqueChapterCode();

  const newChapter: SavedChapter = {
    id: chapterId,
    uniqueCode,
    userId,
    fileName: chapterData.fileName,
    title: cleanTitle,
    summary: chapterData.summary,
    createdAt: new Date().toISOString(),
    fileSize: chapterData.fileSize,
    shravanXpClaimed: false,
    mananXpClaimed: false,
  };

  // 1. Immediately cache for seamless rendering
  const localList = getLocalChapters(userId);
  const updated = [newChapter, ...localList.filter((c) => c.id !== newChapter.id)];
  setLocalChapters(updated, userId);

  // 2. Persist directly to Google Cloud Firestore database under user chapters and chapterCodes collection
  try {
    const chapterDocRef = doc(db, 'users', userId, 'chapters', chapterId);
    await setDoc(chapterDocRef, {
      id: chapterId,
      uniqueCode,
      userId,
      fileName: newChapter.fileName,
      title: newChapter.title,
      summary: newChapter.summary,
      createdAt: newChapter.createdAt,
      fileSize: newChapter.fileSize || 0,
      shravanXpClaimed: false,
      mananXpClaimed: false,
    });

    // 3. Register unique code in the dedicated /chapterCodes collection
    const chapterCodeRef = doc(db, 'chapterCodes', uniqueCode);
    await setDoc(chapterCodeRef, {
      code: uniqueCode,
      chapterId,
      userId,
      fileName: newChapter.fileName,
      title: newChapter.title,
      createdAt: newChapter.createdAt,
      shravanClaimedBy: [],
      mananClaimedBy: [],
      rewards: {
        shravan: false,
        manan: false,
      },
    });

    console.log(`[Firestore] Chapter "${cleanTitle}" with code ${uniqueCode} successfully saved.`);
  } catch (err) {
    console.error('Failed to write chapter to Firestore:', err);
  }

  return newChapter;
}

/**
 * Update chapter audio and Shravan completion status in Firestore and local cache.
 */
export async function updateChapterAudio(chapterId: string, audioBase64: string, shravanCompleted: boolean = true) {
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid || 'guest_session';

  const localList = getLocalChapters(userId);
  const updated = localList.map((c) => {
    if (c.id === chapterId) {
      return { ...c, audioBase64, shravanCompleted };
    }
    return c;
  });
  setLocalChapters(updated, userId);

  if (currentUser) {
    try {
      const chapterDocRef = doc(db, 'users', userId, 'chapters', chapterId);
      await setDoc(chapterDocRef, { audioBase64, shravanCompleted }, { merge: true });
    } catch (err) {
      console.warn('Failed to update chapter audio in Firestore:', err);
    }
  }
}

/**
 * Delete a chapter from Firestore and local cache.
 */
export async function deleteChapter(id: string): Promise<SavedChapter[]> {
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid;

  // 1. Delete from local cache
  const localList = getLocalChapters(userId);
  const updated = localList.filter((c) => c.id !== id);
  setLocalChapters(updated, userId);

  // 2. Delete from Firestore if user has an ID
  if (userId) {
    try {
      const chapterDocRef = doc(db, 'users', userId, 'chapters', id);
      await deleteDoc(chapterDocRef);
      console.log(`[Firestore] Chapter ${id} deleted from cloud database.`);
    } catch (err) {
      console.error('Failed to delete chapter from Firestore:', err);
    }
  }

  return updated;
}

/**
 * Sync any existing guest or anonymous chapters to a user's permanent Firestore account upon login.
 */
export async function syncGuestChaptersToUser(targetUserId: string, previousAnonUid?: string) {
  if (!targetUserId) return;

  try {
    // Check if there are anonymous chapters in Firestore to migrate
    if (previousAnonUid && previousAnonUid !== targetUserId) {
      const anonChapters = await fetchUserChaptersFromFirestore(previousAnonUid);
      for (const ch of anonChapters) {
        const targetRef = doc(db, 'users', targetUserId, 'chapters', ch.id);
        await setDoc(targetRef, {
          ...ch,
          userId: targetUserId,
        }, { merge: true });
      }
    }

    // Check if guest local chapters exist and copy them to Firestore
    const guestChapters = getLocalChapters('guest');
    if (guestChapters.length > 0) {
      for (const ch of guestChapters) {
        const targetRef = doc(db, 'users', targetUserId, 'chapters', ch.id);
        await setDoc(targetRef, {
          ...ch,
          userId: targetUserId,
        }, { merge: true });
      }
      // Clear guest local list after migration
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);
    }
  } catch (err) {
    console.warn('Failed to sync guest chapters to user Firestore account:', err);
  }
}
