import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  enableIndexedDbPersistence,
  writeBatch,
} from 'firebase/firestore';
import {
  SchoolProfile,
  SubjectItem,
  LearningObjective,
  UserAccount,
  Student,
  ClassJournalEntry,
  StarAward,
  CaseRecord,
  PaiAssessment,
  ChatMessage,
  SchoolAnnouncement,
  InternalGradeRecord,
} from '../types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_SUBJECTS,
  INITIAL_LEARNING_OBJECTIVES,
  INITIAL_STUDENTS,
  INITIAL_USERS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_STAR_AWARDS,
  INITIAL_CASE_RECORDS,
  INITIAL_PAI_ASSESSMENTS,
  INITIAL_MESSAGES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_INTERNAL_GRADES,
} from './mockData';

// User's exact Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDv6DTgcc2xVteqMq-D4k7sQ7KLCFzrp8Q",
  authDomain: "onlineclassjournalyuliono.firebaseapp.com",
  databaseURL: "https://onlineclassjournalyuliono-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onlineclassjournalyuliono",
  storageBucket: "onlineclassjournalyuliono.firebasestorage.app",
  messagingSenderId: "989086411927",
  appId: "1:989086411927:web:f33933aa059c7c2122cdd2",
  measurementId: "G-B2QVVJ6ZCN"
};

// Initialize Firebase App instance
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp);

export interface FirebaseSyncState {
  isConnected: boolean;
  projectId: string;
  lastSyncTime: Date | null;
  error: string | null;
  syncedCollectionsCount: number;
}

let syncState: FirebaseSyncState = {
  isConnected: false,
  projectId: firebaseConfig.projectId,
  lastSyncTime: null,
  error: null,
  syncedCollectionsCount: 0,
};

const listeners: ((state: FirebaseSyncState) => void)[] = [];

export function subscribeFirebaseStatus(listener: (state: FirebaseSyncState) => void) {
  listeners.push(listener);
  listener(syncState);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

let syncStateTimeout: ReturnType<typeof setTimeout> | null = null;
function updateSyncStatus(partial: Partial<FirebaseSyncState>) {
  syncState = { ...syncState, ...partial };
  if (!syncStateTimeout) {
    syncStateTimeout = setTimeout(() => {
      syncStateTimeout = null;
      listeners.forEach((l) => l(syncState));
    }, 60);
  }
}

// LocalStorage helpers to coordinate with store.ts
const STORAGE_PREFIX = 'edujournal_sd_v1_';

let storageDispatchTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleStorageDispatch() {
  if (storageDispatchTimeout) return;
  storageDispatchTimeout = setTimeout(() => {
    storageDispatchTimeout = null;
    window.dispatchEvent(new Event('edujournal_storage_change'));
  }, 40);
}

function saveLocal<T>(key: string, data: T) {
  try {
    const serialized = JSON.stringify(data);
    const existing = localStorage.getItem(STORAGE_PREFIX + key);
    if (existing === serialized) {
      // Data is unchanged; skip writing and dispatching to avoid redundant re-renders
      return;
    }
    localStorage.setItem(STORAGE_PREFIX + key, serialized);
    scheduleStorageDispatch();
  } catch (err) {
    console.error('Failed saving to localStorage', key, err);
  }
}

// Flag to prevent echo loops when remote snapshot updates local storage
let isRemoteUpdating = false;

/**
 * Real-time Two-Way Synchronizer:
 * Sets up Firestore real-time onSnapshot listeners on all collections.
 * Automatically seeds Firestore if collections are newly initialized.
 */
let isInitialized = false;

export function initFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    updateSyncStatus({ isConnected: true, lastSyncTime: new Date(), error: null });

    // 1. School Profile
    const profileDocRef = doc(db, 'settings', 'school_profile');
    onSnapshot(
      profileDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          isRemoteUpdating = true;
          saveLocal('school_profile', snapshot.data() as SchoolProfile);
          isRemoteUpdating = false;
          updateSyncStatus({ lastSyncTime: new Date(), isConnected: true });
        } else {
          // Seed profile
          setDoc(profileDocRef, INITIAL_SCHOOL_PROFILE, { merge: true }).catch((e) =>
            console.warn('Seed profile failed', e)
          );
        }
      },
      (err) => {
        console.warn('Firestore profile sync error:', err.message);
        updateSyncStatus({ error: err.message });
      }
    );

    // Helper for syncing array collections
    function syncCollection<T extends { id: string }>(
      collectionName: string,
      storageKey: string,
      initialData: T[]
    ) {
      const colRef = collection(db, collectionName);
      let hasAttemptedSeed = false;
      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: T[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ ...(docSnap.data() as T), id: docSnap.id });
            });
            isRemoteUpdating = true;
            saveLocal(storageKey, items);
            isRemoteUpdating = false;
            updateSyncStatus({
              lastSyncTime: new Date(),
              isConnected: true,
              syncedCollectionsCount: syncState.syncedCollectionsCount + 1,
            });
          } else if (!hasAttemptedSeed) {
            hasAttemptedSeed = true;
            try {
              const batch = writeBatch(db);
              initialData.forEach((item) => {
                batch.set(doc(db, collectionName, item.id), item, { merge: true });
              });
              batch.commit().catch((e) =>
                console.warn(`Seed batch for ${collectionName} error:`, e)
              );
            } catch (seedErr) {
              console.warn(`Seed batch error for ${collectionName}:`, seedErr);
            }
          }
        },
        (err) => {
          console.warn(`Firestore sync error for ${collectionName}:`, err.message);
          updateSyncStatus({ error: err.message });
        }
      );
    }

    // Sync all key educational collections
    syncCollection<Student>('students', 'students', INITIAL_STUDENTS);
    syncCollection<ClassJournalEntry>('journal_entries', 'journal_entries', INITIAL_JOURNAL_ENTRIES);
    syncCollection<InternalGradeRecord>('internal_grades', 'internal_grades', INITIAL_INTERNAL_GRADES);
    syncCollection<StarAward>('star_awards', 'star_awards', INITIAL_STAR_AWARDS);
    syncCollection<CaseRecord>('case_records', 'case_records', INITIAL_CASE_RECORDS);
    syncCollection<PaiAssessment>('pai_assessments', 'pai_assessments', INITIAL_PAI_ASSESSMENTS);
    syncCollection<UserAccount>('users', 'users', INITIAL_USERS);
    syncCollection<ChatMessage>('messages', 'messages', INITIAL_MESSAGES);
    syncCollection<SubjectItem>('subjects', 'subjects', INITIAL_SUBJECTS);
    syncCollection<LearningObjective>('learning_objectives', 'learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    syncCollection<SchoolAnnouncement>('announcements', 'announcements', INITIAL_ANNOUNCEMENTS);

  } catch (error: any) {
    console.error('Firebase initialization error:', error);
    updateSyncStatus({ isConnected: false, error: error?.message || 'Gagal tersambung ke Firebase' });
  }
}

/**
 * Direct write helper to persist any document change directly to Firestore
 */
export async function writeFirestoreDoc(collectionName: string, id: string, data: any) {
  if (isRemoteUpdating) return;
  try {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
    updateSyncStatus({ lastSyncTime: new Date(), isConnected: true, error: null });
  } catch (err: any) {
    console.warn(`Write to Firestore [${collectionName}/${id}] failed:`, err);
    updateSyncStatus({ error: err.message });
  }
}

/**
 * Direct delete helper to remove a document in Firestore
 */
export async function deleteFirestoreDoc(collectionName: string, id: string) {
  if (isRemoteUpdating) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
    updateSyncStatus({ lastSyncTime: new Date(), isConnected: true, error: null });
  } catch (err: any) {
    console.warn(`Delete from Firestore [${collectionName}/${id}] failed:`, err);
    updateSyncStatus({ error: err.message });
  }
}
