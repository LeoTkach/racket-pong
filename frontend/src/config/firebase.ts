/// <reference types="vite/client" />
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDoNHKg3-VeGX2G_z5LudtMSLCA1Nz-dEc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "racket-pong.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "racket-pong",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "racket-pong.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "610845291211",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:610845291211:web:25a8bb26e5730fbd52e14e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SCP2GSBTLH"
};

// Initialize Firebase with error handling for offline mode
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let firebaseAnalytics: Analytics | null = null;

try {
  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }
  
  // Initialize Firebase Authentication (doesn't require immediate internet connection)
  firebaseAuth = getAuth(firebaseApp);
  
  // Initialize Firebase Storage (doesn't require immediate internet connection)
  firebaseStorage = getStorage(firebaseApp);
  
  // Initialize Analytics lazily - only in browser and when online
  // Analytics requires internet, so we initialize it asynchronously
  if (typeof window !== 'undefined') {
    // Initialize analytics asynchronously to not block app loading
    isSupported().then((supported) => {
      if (supported && navigator.onLine && firebaseApp) {
        try {
          firebaseAnalytics = getAnalytics(firebaseApp);
        } catch (error) {
          console.warn('Firebase Analytics initialization failed (OK in offline mode):', error);
        }
      }
    }).catch(() => {
      // Analytics not supported or offline - this is fine
      console.debug('Firebase Analytics not available (offline mode or not supported)');
    });
  }
} catch (error) {
  // Firebase initialization failed - log warning but don't crash
  // The app can still work with local API in offline mode
  console.warn('Firebase initialization error (app may work in offline mode with local API):', error);
  // Continue without Firebase - app will use local API only
}

// Export Firebase instances
export const auth = firebaseAuth;
export const storage = firebaseStorage;
export const analytics = firebaseAnalytics;
export default firebaseApp;
