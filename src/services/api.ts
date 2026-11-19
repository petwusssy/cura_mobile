import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://cura-backend-dvj5.onrender.com/api'
).replace(/\/+$/, '');

export const WEB_APP_URL = (
  process.env.EXPO_PUBLIC_WEB_URL || 'https://cura-bice.vercel.app'
).replace(/\/+$/, '');

export const PUBLIC_PRIVACY_URL = `${WEB_APP_URL}/privacy`;

export function getTelemedicineCallUrl(roomId: string, query: string): string {
  return `${WEB_APP_URL}/call/${roomId}?${query}`;
}

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = typeof atob === 'function' ? atob(pad) : '';
    if (!json) return false;
    const payload = JSON.parse(json);
    if (typeof payload?.exp === 'number') {
      return payload.exp * 1000 <= Date.now() + 10_000;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('@cura_access_token');
    if (!token || isJwtExpired(token)) return null;
    return token;
  } catch {
    return null;
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...auth,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export function isAppForeground(): boolean {
  if (typeof document !== 'undefined' && typeof document.hidden === 'boolean') {
    return !document.hidden;
  }
  return AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
}
