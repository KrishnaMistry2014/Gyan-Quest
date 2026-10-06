import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'guru';
  text: string;
  timestamp: number;
}

const LOCAL_STORAGE_KEY_PREFIX = 'gyan_quest_guru_chat_';

/**
 * Helper to determine if user is permanently signed in with Google or Email (not guest/anonymous)
 */
export function isPermanentUser(user: User | null | undefined): boolean {
  return Boolean(user && !user.isAnonymous && user.uid);
}

/**
 * Get locally cached chat messages for instant rendering
 */
export function getLocalGuruChat(userId?: string): ChatMessage[] {
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save chat messages to local cache
 */
export function setLocalGuruChat(messages: ChatMessage[], userId?: string) {
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to cache guru chat locally:', err);
  }
}

/**
 * Load chat history:
 * - Permanent users (Google / Email): loaded from Firestore (with local cache fallback)
 * - Guest users: loaded strictly from local session storage, NEVER from Firestore
 */
export async function loadGuruChatFromFirestore(user: User | null | undefined): Promise<ChatMessage[]> {
  // Guest users or signed-out visitors: strictly local cache, NEVER touch Firestore
  if (!isPermanentUser(user)) {
    return getLocalGuruChat(user?.uid || 'guest');
  }

  const uid = user!.uid;

  try {
    const chatDocRef = doc(db, 'users', uid, 'guruChat', 'session');
    const snapshot = await getDoc(chatDocRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.messages)) {
        setLocalGuruChat(data.messages, uid);
        return data.messages;
      }
    }

    return getLocalGuruChat(uid);
  } catch (err) {
    console.warn('[Guru Chat] Error reading from Firestore, using local cache:', err);
    return getLocalGuruChat(uid);
  }
}

/**
 * Save chat messages:
 * - Permanent users (Google / Email): saved to Firestore
 * - Guest users: strictly saved to local session storage, NEVER to Firestore
 */
export async function saveGuruChatToFirestore(messages: ChatMessage[], user: User | null | undefined): Promise<void> {
  const effectiveKey = user?.uid || 'guest';
  // Update local cache
  setLocalGuruChat(messages, effectiveKey);

  // If user is guest or not signed in, DO NOT save to Firestore
  if (!isPermanentUser(user)) {
    return;
  }

  const uid = user!.uid;

  try {
    const chatDocRef = doc(db, 'users', uid, 'guruChat', 'session');
    await setDoc(chatDocRef, {
      userId: uid,
      messages: messages.slice(-50), // keep latest 50 messages for optimal performance
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Guru Chat] Failed to persist chat to Firestore:', err);
  }
}

/**
 * Clear chat history:
 * - Permanent users: purged from Firestore and local cache
 * - Guest users: purged strictly from local cache
 */
export async function clearGuruChatInFirestore(user: User | null | undefined): Promise<void> {
  const effectiveKey = user?.uid || 'guest';
  setLocalGuruChat([], effectiveKey);

  // If guest, no Firestore record exists to delete
  if (!isPermanentUser(user)) {
    return;
  }

  const uid = user!.uid;

  try {
    const chatDocRef = doc(db, 'users', uid, 'guruChat', 'session');
    await deleteDoc(chatDocRef);
  } catch (err) {
    console.warn('[Guru Chat] Failed to delete chat doc from Firestore:', err);
  }
}
