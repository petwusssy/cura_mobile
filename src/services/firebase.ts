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
 * Exchanges Google or Firebase ID token with CURA backend JWT (with Gmail OTP)
 */
export async function authenticateWithCuraBackend(
  idToken: string,
  fallbackEmail?: string,
  fallbackName?: string,
  otp?: string,
  action: "login" | "register" = "login"
): Promise<{
  require_otp?: boolean;
  message?: string;
  email?: string;
  access?: string;
  refresh?: string;
  user?: any;
  roles?: string[];
  username?: string;
  not_found?: boolean;
  error?: string;
  details?: string;
  category?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  verified?: boolean;
  already_exists?: boolean;
}> {
  let lastError: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://cura-backend-dvj5.onrender.com/api/auth/google/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_token: idToken,
          otp: otp || "",
          action: action,
          email: fallbackEmail || "",
          name: fallbackName || "",
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {}

      if (!response.ok) {
        const errorMsg = data.error || data.details || "Backend authentication failed.";
        const customError: any = new Error(errorMsg);
        customError.data = data;
        customError.status = response.status;
        customError.not_found = Boolean(data.not_found || response.status === 404);
        customError.already_exists = Boolean(data.already_exists);
        throw customError;
      }

      return data;
    } catch (err: any) {
      lastError = err;
      if (err?.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        // Business logic error from server (e.g. not_found, invalid OTP, expired) -> don't retry
        throw err;
      }
      // If network failure / cold-start, wait and retry
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(lastError?.message || "Server connection failed. Please check connection and try again.");
}
