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

/**
 * Converts any time string (e.g., "22:08:00", "22:08", "08:30:00", "14:15")
 * or Date or timestamp into standard 12-hour format with AM/PM (e.g. "10:08 PM", "8:30 AM").
 */
export const formatTime12 = (raw?: string | Date | number | null): string => {
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'object' && raw instanceof Date) {
    return formatManilaDateTime(raw);
  }
  const str = String(raw).trim();
  if (!str || str === '—' || str === '-' || str === '(current)' || str === 'Ongoing' || str === 'Present') {
    return str;
  }
  // Check if already 12-hour format: e.g. "10:08 PM" or "8:30 AM" or "10:08:00 PM"
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    return `${h}:${m} ${period}`;
  }
  // Check if "HH:mm" or "HH:mm:ss" (24-hour)
  const time24Match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (time24Match) {
    let hours = parseInt(time24Match[1], 10);
    const minutes = time24Match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  // Check if it's an ISO string or datetime
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return formatManilaDateTime(dateObj);
  }
  return str;
};

/**
 * Formats a start and end time range in 12-hour format
 * e.g., "10:08 PM – 10:11 PM" or "10:08 PM – Present"
 */
export const formatTimeRange12 = (start?: string | null, end?: string | null, fallback = '—'): string => {
  const startFmt = formatTime12(start);
  const endFmt = end ? formatTime12(end) : fallback;
  if (!startFmt && !endFmt) return fallback;
  if (!startFmt) return endFmt;
  return `${startFmt} – ${endFmt}`;
};

