/**
 * Philippine Time (Asia/Manila - UTC+8) Utilities for Mobile
 * Ensures all dates and times across CURA Mobile are consistently evaluated
 * in Philippine Time regardless of device timezone settings.
 */

export const PH_TIMEZONE = 'Asia/Manila';

/**
 * Returns YYYY-MM-DD in Asia/Manila
 */
export const getManilaDate = (d: Date | string | number = new Date()): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Returns HH:mm (24-hour) in Asia/Manila
 */
export const getManilaTime = (d: Date | string | number = new Date()): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: PH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
};

/**
 * Returns the hour (0-23) in Asia/Manila
 */
export const getManilaHour = (d: Date | string | number = new Date()): number => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return 0;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    hour12: false
  }).format(dateObj);
  const hourNum = parseInt(parts, 10);
  return hourNum === 24 ? 0 : hourNum;
};

/**
 * Returns YYYY-MM-DD of yesterday in Asia/Manila
 */
export const getManilaYesterday = (fromDate: Date | string | number = new Date()): string => {
  return getManilaDaysAgo(1, fromDate);
};

/**
 * Returns YYYY-MM-DD of N days ago relative to Asia/Manila
 */
export const getManilaDaysAgo = (days: number, fromDate: Date | string | number = new Date()): string => {
  const baseStr = getManilaDate(fromDate);
  if (!baseStr) return '';
  const [year, month, day] = baseStr.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
};

/**
 * Format date for display in Philippine Time
 */
export const formatManilaDate = (
  d: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    ...options
  }).format(dateObj);
};

/**
 * Format datetime for display in Philippine Time
 */
export const formatManilaDateTime = (d: Date | string | number): string => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

/**
 * Normalizes any date input into a clean 'YYYY-MM-DD' string in Asia/Manila.
 */
export const normalizeDate = (raw?: string | Date | number | null): string => {
  if (!raw) return '';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return getManilaDate(parsed);
    }
    return trimmed;
  }
  return getManilaDate(raw);
};

