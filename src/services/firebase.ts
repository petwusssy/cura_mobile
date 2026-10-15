import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBMyeH2m3aiW56fdaGb4Wei-cfcodDmAYA",
  authDomain: "cura-clinic-65b94.firebaseapp.com",
  projectId: "cura-clinic-65b94",
  storageBucket: "cura-clinic-65b94.firebasestorage.app",
  messagingSenderId: "289437991360",
  appId: "1:289437991360:web:b2724194929ac22cf18825",
  measurementId: "G-XQE03EE00L",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface GoogleAuthResult {
  idToken: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export async function signInWithGooglePopup(): Promise<GoogleAuthResult> {
  const result: UserCredential = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const googleIdToken = credential?.idToken;
  const firebaseIdToken = await result.user.getIdToken();
  const idToken = googleIdToken || firebaseIdToken;

  return {
    idToken,
    email: result.user.email || "",
    displayName: result.user.displayName || "",
    photoURL: result.user.photoURL || undefined,
  };
}

/**
 * Exchanges Google or Firebase ID token with CURA backend JWT
 */
export async function authenticateWithCuraBackend(
  idToken: string,
  fallbackEmail?: string,
  fallbackName?: string
): Promise<{
  access: string;
  refresh: string;
  user: any;
  roles?: string[];
  username?: string;
}> {
  const response = await fetch("https://cura-backend-dvj5.onrender.com/api/auth/google/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_token: idToken }),
  });

  const resText = await response.text();
  let data: any = {};
  try {
    data = resText ? JSON.parse(resText) : {};
  } catch {}

  if (!response.ok || !data.access) {
    const errorMsg = data.error || data.details || "Backend authentication failed.";
    throw new Error(errorMsg);
  }

  return data;
}
