import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { JournalEntry, UserProfile } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore targeting the specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Utility: Sanitizes an object by recursively stripping any `undefined` keys
 * to strictly ensure Firestore payload hygiene.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Anonymous Explorer',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

// Firestore Isolated User Interactions Helpers
export function getUserInteractionsRef(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

export async function saveJournalEntry(entry: JournalEntry): Promise<string> {
  if (!entry.userId) {
    throw new Error('User ID is required to save journal entry');
  }

  const interactionsRef = getUserInteractionsRef(entry.userId);
  const docRef = entry.id ? doc(interactionsRef, entry.id) : doc(interactionsRef);
  const entryId = docRef.id;

  const payload: JournalEntry = {
    ...entry,
    id: entryId,
    updatedAt: Date.now(),
    createdAt: entry.createdAt || Date.now(),
  };

  const cleanPayload = sanitizeFirestorePayload(payload);
  await setDoc(docRef, cleanPayload, { merge: true });
  return entryId;
}

export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  const interactionsRef = getUserInteractionsRef(userId);
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data() as JournalEntry;
    entries.push({
      ...data,
      id: docSnapshot.id,
    });
  });

  return entries;
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, 'users', userId, 'interactions', entryId);
  await deleteDoc(docRef);
}
