import { getManilaDate, getManilaTime, normalizeDate } from './philippineTime';

export const TELEMEDICINE_TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
] as const;

export type TelemedicineTimeSlot = typeof TELEMEDICINE_TIME_SLOTS[number];

/**
 * Converts a time string (e.g. "08:00 AM", "8:00 AM", "1:00 PM", "14:00", "8AM")
 * to total minutes from midnight (0-1439).
 */
export function parseTimeToMinutes(str: string): number | null {
  if (!str) return null;
  const s = str.trim().toUpperCase();

  const match12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const min = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toUpperCase();
    if (meridian === 'AM' && hour === 12) hour = 0;
    if (meridian === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + min;
  }

  const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const min = parseInt(match24[2], 10);
    return hour * 60 + min;
  }

  return null;
}

/**
 * Parses any time slot string into startMinutes and endMinutes.
 */
export function parseSlotRange(timeStr: string): { startMinutes: number; endMinutes: number } | null {
  if (!timeStr) return null;
  const s = timeStr.trim();

  if (/morning/i.test(s)) {
    return { startMinutes: 8 * 60, endMinutes: 12 * 60 };
  }
  if (/afternoon/i.test(s)) {
    return { startMinutes: 13 * 60, endMinutes: 17 * 60 };
  }

  const parts = s.split(/[-–—]|to/i).map(p => p.trim());
  if (parts.length === 2) {
    let startMin = parseTimeToMinutes(parts[0]);
    let endMin = parseTimeToMinutes(parts[1]);

    if (startMin === null) {
      const matchNum = parts[0].match(/^(\d{1,2})$/);
      if (matchNum) {
        let h = parseInt(matchNum[1], 10);
        if (endMin !== null) {
          if (endMin >= 12 * 60 && h < 12 && (h + 12) * 60 <= endMin) {
            h += 12;
          }
          startMin = h * 60;
        } else {
          if (h < 7) h += 12;
          startMin = h * 60;
        }
      }
    }

    if (endMin === null) {
      const matchNum = parts[1].match(/^(\d{1,2})$/);
      if (matchNum && startMin !== null) {
        let h = parseInt(matchNum[1], 10);
        const startH = Math.floor(startMin / 60);
        if (startH >= 12 && h < 12) {
          h += 12;
        } else if (startH < 12 && h < startH) {
          h += 12;
        }
        endMin = h * 60;
      }
    }

    if (startMin !== null && endMin !== null) {
      return { startMinutes: startMin, endMinutes: endMin };
    }
  }

  const single = parseTimeToMinutes(s);
  if (single !== null) {
    return { startMinutes: single, endMinutes: single + 60 };
  }

  return null;
}

export interface MeetingScheduleStatus {
  canJoin: boolean;
  status: 'upcoming' | 'open' | 'ended';
  message: string;
  opensAt?: string;
  scheduledDisplay?: string;
}

/**
 * Checks whether a telemedicine meeting is currently joinable based on Asia/Manila time.
 * - Allows early join 15 minutes before the slot start.
 * - Allows 30 minutes grace period after the slot end.
 * - Otherwise strictly prevents joining before or after the window.
 */
export function checkMeetingJoinable(
  scheduledDateRaw?: string | null,
  scheduledTimeRaw?: string | null
): MeetingScheduleStatus {
  if (!scheduledDateRaw) {
    return {
      canJoin: false,
      status: 'upcoming',
      message: 'Schedule awaiting clinic confirmation',
    };
  }

  const schedDate = normalizeDate(scheduledDateRaw);
  const now = new Date();
  const manilaToday = getManilaDate(now);
  const manilaTimeStr = getManilaTime(now); // "HH:mm" in 24hr format
  const [currH, currM] = manilaTimeStr.split(':').map(Number);
  const currentMinutes = currH * 60 + currM;

  if (manilaToday < schedDate) {
    return {
      canJoin: false,
      status: 'upcoming',
      message: `Scheduled for ${schedDate}${scheduledTimeRaw ? ` at ${scheduledTimeRaw}` : ''}`,
      scheduledDisplay: `${schedDate} • ${scheduledTimeRaw || 'Time TBD'}`.trim(),
    };
  }

  if (manilaToday > schedDate) {
    return {
      canJoin: false,
      status: 'ended',
      message: 'Consultation schedule has ended',
      scheduledDisplay: `${schedDate} • ${scheduledTimeRaw || ''}`.trim(),
    };
  }

  if (!scheduledTimeRaw) {
    return {
      canJoin: true,
      status: 'open',
      message: 'Consultation is active today',
      scheduledDisplay: `${schedDate} • Scheduled Today`,
    };
  }

  const range = parseSlotRange(scheduledTimeRaw);
  if (!range) {
    return {
      canJoin: true,
      status: 'open',
      message: 'Consultation is active today',
      scheduledDisplay: `${schedDate} • ${scheduledTimeRaw}`,
    };
  }

  const earlyBuffer = 15;
  const lateBuffer = 30;

  const joinStart = range.startMinutes - earlyBuffer;
  const joinEnd = range.endMinutes + lateBuffer;

  const startFormatted = scheduledTimeRaw.split(/[-–—]|to/i)[0]?.trim() || scheduledTimeRaw;

  if (currentMinutes < joinStart) {
    return {
      canJoin: false,
      status: 'upcoming',
      message: `Opens at ${startFormatted} (15m before session)`,
      opensAt: startFormatted,
      scheduledDisplay: `${schedDate} • ${scheduledTimeRaw}`,
    };
  }

  if (currentMinutes > joinEnd) {
    return {
      canJoin: false,
      status: 'ended',
      message: 'Consultation window has closed',
      scheduledDisplay: `${schedDate} • ${scheduledTimeRaw}`,
    };
  }

  return {
    canJoin: true,
    status: 'open',
    message: 'Consultation is active now',
    scheduledDisplay: `${schedDate} • ${scheduledTimeRaw}`,
  };
}
