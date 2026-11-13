import { AppState } from 'react-native';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://cura-backend-dvj5.onrender.com/api'
).replace(/\/+$/, '');

export function isAppForeground(): boolean {
  if (typeof document !== 'undefined' && typeof document.hidden === 'boolean') {
    return !document.hidden;
  }
  return AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
}
