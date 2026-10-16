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
 * Parses Google ID Token payload to safely extract email, name, etc.
 */
export function parseGoogleIdToken(token: string): {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    if (typeof atob === "function") {
      const decoded = atob(base64);
      try {
        return JSON.parse(decodeURIComponent(escape(decoded)));
      } catch {
        return JSON.parse(decoded);
      }
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = "";
    for (let i = 0; i < base64.length; i += 4) {
      const b0 = chars.indexOf(base64.charAt(i));
      const b1 = chars.indexOf(base64.charAt(i + 1));
      const b2 = chars.indexOf(base64.charAt(i + 2));
      const b3 = chars.indexOf(base64.charAt(i + 3));
      const c1 = (b0 << 2) | (b1 >> 4);
      const c2 = ((b1 & 15) << 4) | (b2 >> 2);
      const c3 = ((b2 & 3) << 6) | b3;
      str += String.fromCharCode(c1);
      if (b2 !== 64 && b2 !== -1) str += String.fromCharCode(c2);
      if (b3 !== 64 && b3 !== -1) str += String.fromCharCode(c3);
    }
    try {
      return JSON.parse(decodeURIComponent(escape(str)));
    } catch {
      return JSON.parse(str);
    }
  } catch {
    return null;
  }
}

/**
 * Exchanges Google or Firebase ID token with CURA backend JWT (with mode: signin | register)
 */
export async function authenticateWithCuraBackend(
  idToken: string,
  fallbackEmail?: string,
  fallbackName?: string,
  otp?: string,
  mode: "signin" | "register" | "login" = "signin"
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
  code?: string;
  is_new?: boolean;
  error?: string;
  details?: string;
  category?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  verified?: boolean;
  already_exists?: boolean;
  patient?: any;
}> {
  let lastError: any = null;
  const normalizedAction = (mode === "login" || mode === "signin") ? "signin" : "register";

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
          mode: normalizedAction,
          action: normalizedAction,
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
        const customErr: any = new Error(errorMsg);
        customErr.code = data.code;
        customErr.status = response.status;
        customErr.data = data;
        customErr.not_found = Boolean(data.not_found || response.status === 404 || data.code === "ACCOUNT_NOT_FOUND");
        customErr.already_exists = Boolean(data.already_exists || data.code === "ACCOUNT_ALREADY_EXISTS");
        throw customErr;
      }

      return data;
    } catch (err: any) {
      lastError = err;
      if (
        err?.code ||
        err?.status ||
        err?.not_found ||
        err?.already_exists ||
        (err?.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError"))
      ) {
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

