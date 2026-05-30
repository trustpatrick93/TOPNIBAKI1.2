import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

// Support overriding Firebase configurations cleanly through Vercel/GitHub pages environment variables
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
// Required scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let bypassUser: AppUser | null = null;
let bypassToken: string = "simulated_developer_bypass_token";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Memory listener for auth changes
let authCallback: ((user: AppUser | null, token: string | null) => void) | null = null;

// Initialize auth state listener.
export const initAuth = (
  callback: (user: AppUser | null, token: string | null) => void
) => {
  authCallback = callback;

  // Let check if we have a saved bypass session
  const storedBypass = localStorage.getItem('cogwheel_bypass_user');
  if (storedBypass) {
    try {
      const u = JSON.parse(storedBypass);
      bypassUser = u;
      cachedAccessToken = bypassToken;
      callback(u, bypassToken);
      return () => {};
    } catch (e) {
      localStorage.removeItem('cogwheel_bypass_user');
    }
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    // If we have a bypass user active, don't override with null
    if (bypassUser) {
      callback(bypassUser, bypassToken);
      return;
    }

    if (firebaseUser) {
      // In Firebase Auth, the popup result is where we get the accessToken.
      // If the page is reloaded, the standard onAuthStateChanged does not supply the provider access token automatically.
      // Thus, we retrieve any previously stored cached token.
      const savedToken = localStorage.getItem('cogwheel_gcal_access_token');
      if (savedToken) {
        cachedAccessToken = savedToken;
      }

      callback(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        cachedAccessToken
      );
    } else {
      callback(null, null);
    }
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<{ user: AppUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    bypassUser = null;
    localStorage.removeItem('cogwheel_bypass_user');

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google.');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('cogwheel_gcal_access_token', credential.accessToken);

    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    if (authCallback) {
      authCallback(appUser, cachedAccessToken);
    }

    return { user: appUser, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Bypass Login for developer fallback/emergency testing
export const developerBypassSignIn = (customEmail: string = "developer@cogwheel.retro"): AppUser => {
  const mockUid = "bypass_" + customEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const user: AppUser = {
    uid: mockUid,
    email: customEmail,
    displayName: "⚙️ Retro Architect (Bypass)",
    photoURL: null,
  };
  bypassUser = user;
  cachedAccessToken = bypassToken;
  localStorage.setItem('cogwheel_bypass_user', JSON.stringify(user));
  
  if (authCallback) {
    authCallback(user, bypassToken);
  }
  return user;
};

// Logout
export const logoutUser = async () => {
  bypassUser = null;
  cachedAccessToken = null;
  localStorage.removeItem('cogwheel_bypass_user');
  localStorage.removeItem('cogwheel_gcal_access_token');
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Sign out err:", e);
  }
  if (authCallback) {
    authCallback(null, null);
  }
};
