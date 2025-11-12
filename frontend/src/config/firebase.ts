/**
 * Firebase Configuration
 * Initializes Firebase SDK with environment variables
 * Supports both emulator mode (development) and production
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// ============================================================================
// FIREBASE CONFIG
// ============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !import.meta.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.warn(
    'Missing Firebase environment variables:',
    missingEnvVars.join(', '),
    '\nPlease configure your .env.local file'
  );
}

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// ============================================================================
// EMULATOR SETUP (Development Only)
// ============================================================================

const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

if (useEmulator) {
  try {
    // Auth Emulator
    const authEmulatorPort = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 9099;
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, `http://localhost:${authEmulatorPort}`, {
        disableWarnings: true,
      });
      console.log(`🔥 Connected to Auth Emulator (port ${authEmulatorPort})`);
    }

    // Firestore Emulator
    const firestoreEmulatorPort = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080;
    if (!(db as any)._firestoreClient?.settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', firestoreEmulatorPort);
      console.log(`🔥 Connected to Firestore Emulator (port ${firestoreEmulatorPort})`);
    }

    // Storage Emulator
    const storageEmulatorPort = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199;
    if (!(storage as any).host?.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', storageEmulatorPort);
      console.log(`🔥 Connected to Storage Emulator (port ${storageEmulatorPort})`);
    }
  } catch (error: any) {
    // Emulators might already be connected
    if (error.code !== 'auth/emulator-config-failed') {
      console.warn('Emulator connection warning:', error.message);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { app, auth, db, storage, useEmulator };

