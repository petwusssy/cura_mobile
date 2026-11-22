import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, ScrollView, Text, TextInput, Pressable, TouchableOpacity, RefreshControl, Modal, Platform, PermissionsAndroid, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Header, Button, Card, Badge, ComingSoonView } from "../components/Shell";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, WEB_APP_URL, apiFetch, isAppForeground, getTelemedicineCallUrl } from "../services/api";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";
import { LiquidGlassDatePickerModal } from "../components/LiquidGlassDatePickerModal";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { LiquidGlassTimePickerModal, TELEMEDICINE_TIME_SLOTS } from "../components/LiquidGlassTimePickerModal";
import { RequestConfirmationModal } from "../components/RequestConfirmationModal";
import type { Screen, AppUser } from "../types";
import { getManilaDate, getManilaTime, normalizeDate, formatTime12 } from "../utils/philippineTime";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="gLockBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#0056B3" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Rect
        x="4"
        y="10"
        width="16"
        height="12"
        rx="3"
        fill="url(#gLockBlue)"
      />
      <Circle cx="12" cy="15" r="1.5" fill="#FFFFFF" />
      <Path d="M12 16.5v2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function parseSingleTime(t: string): number | null {
  const match = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridian = match[3] ? match[3].toLowerCase() : null;

  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function parseTimeSlot(timeStr?: string): { startMinutes: number; endMinutes: number } {
  if (!timeStr) return { startMinutes: 8 * 60, endMinutes: 17 * 60 };
  const s = timeStr.trim();

  if (/morning/i.test(s) || /8\s*am\s*-\s*12\s*pm/i.test(s)) {
    return { startMinutes: 8 * 60, endMinutes: 12 * 60 };
  }
  if (/afternoon/i.test(s) || /1\s*pm\s*-\s*5\s*pm/i.test(s)) {
    return { startMinutes: 13 * 60, endMinutes: 17 * 60 };
  }

  const rangeMatch = s.match(/(.+?)\s*(?:-|to)\s*(.+)/i);
  if (rangeMatch) {
    const startM = parseSingleTime(rangeMatch[1]);
    const endM = parseSingleTime(rangeMatch[2]);
    if (startM !== null && endM !== null) {
      return { startMinutes: startM, endMinutes: endM };
    }
  }

  const singleM = parseSingleTime(s);
  if (singleM !== null) {
    return { startMinutes: singleM, endMinutes: singleM + 60 };
  }

  return { startMinutes: 8 * 60, endMinutes: 17 * 60 };
}

function formatMinutes(m: number): string {
  let h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  } catch (e) { }
  return dateStr;
}

export function getScheduleAccess(scheduledDateRaw?: string, scheduledTimeRaw?: string): { canJoin: boolean; reason: string } {
  const normDate = normalizeDate(scheduledDateRaw);
  const today = getManilaDate();

  if (!normDate) {
    return { canJoin: true, reason: "" };
  }

  const timeLabel = scheduledTimeRaw ? scheduledTimeRaw.trim() : "";

  if (normDate > today) {
    return {
      canJoin: false,
      reason: `Upcoming consultation. You can join on ${normDate}${timeLabel ? ` at ${timeLabel}` : ""}.`,
    };
  }

  if (normDate < today) {
    return {
      canJoin: false,
      reason: `Consultation date has passed (${normDate}).`,
    };
  }

  // Today in Manila
  const timeParts = getManilaTime().split(":").map(Number);
  const nowMinutes = timeParts[0] * 60 + (timeParts[1] || 0);

  const { startMinutes, endMinutes } = parseTimeSlot(timeLabel);
  const earlyBuffer = 10;
  const lateBuffer = 20;

  if (nowMinutes < startMinutes - earlyBuffer) {
    const minsWait = (startMinutes - earlyBuffer) - nowMinutes;
    return {
      canJoin: false,
      reason: `Call opens at ${formatMinutes(startMinutes)}${minsWait > 0 && minsWait <= 60 ? ` (in ${minsWait} min${minsWait === 1 ? "" : "s"})` : ""}.`,
    };
  }

  if (nowMinutes > endMinutes + lateBuffer) {
    return {
      canJoin: false,
      reason: `Scheduled time slot (${timeLabel || `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`}) has ended.`,
    };
  }

  return {
    canJoin: true,
    reason: "Consultation is active now.",
  };
}

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function TelemedicineScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [, setTimeTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTimeTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Book Form State
  const [date, setDate] = useState(() => getManilaDate());
  const [time, setTime] = useState("");
  const [caseCategory, setCaseCategory] = useState("");
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseRules, setCaseRules] = useState<Record<string, "routine" | "urgent" | "in_person_only">>({
    "Fever": "urgent",
    "Dengue Fever": "urgent",
    "Asthma": "urgent",
    "Hypertension": "urgent",
    "Hypotension": "urgent",
    "Hypoglycemia": "urgent",
    "Vomiting": "urgent",
    "Diarrhea/LBM": "urgent",
    "Acute Resp. Tract Infection": "urgent",
    "Allergy": "urgent",
    "Vertigo": "urgent",
    "Hyperventilation": "urgent",
    "UTI (urinary tract infection)": "urgent",
    "Heat stress": "urgent",
    "Headache": "routine",
    "Dizziness": "routine",
    "Cough": "routine",
    "Colds": "routine",
    "Sore throat": "routine",
    "Nausea": "routine",
    "Abdominal Pain/Stomachache": "routine",
    "Dysmenorrhea": "routine",
    "Rashes": "routine",
    "Back Pain": "routine",
    "Body pain": "routine",
    "Eye irritation/Sore eyes": "routine",
    "Ear pain": "routine",
    "Stiff neck": "routine",
    "Allergic Rhinitis": "routine",
    "Anxiety": "routine",
    "Body weakness/malaise": "routine",
    "Dyspepsia": "routine",
    "Gastritis/Hyperacidity/epigastric pain/heartburn": "routine",
    "Joint pain": "routine",
    "Lack of sleep": "routine",
    "Migraine": "routine",
    "Mouth sore": "routine",
    "Muscle pain": "routine",
    "Pruritus/skin irritation/skin condition": "routine",
    "Lab works reading": "routine",
    "Constipation": "routine",
    "Indigestion": "routine",
    "Sinusitis": "routine",
    "Others": "routine",
    "Chest pain/tightness/Palpitation": "in_person_only",
    "Difficulty of breathing": "in_person_only",
    "Fainting": "in_person_only",
    "Seizure": "in_person_only",
    "Accidents": "in_person_only",
    "Burns": "in_person_only",
    "Dislocation/Fracture": "in_person_only",
    "Fracture": "in_person_only",
    "Wounds (abrasion,laceration,puncture)": "in_person_only",
    "Sprain": "in_person_only",
    "Dog bite/scratch": "in_person_only",
    "Cat bite/scratch": "in_person_only",
    "Nose bleeding (epistaxis)": "in_person_only",
    "Pain Right lower quadrant (T/C Appendicitis)": "in_person_only",
    "Toothache": "in_person_only",
    "Acute Gingivitis": "in_person_only",
  });
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ caseCategory?: boolean; date?: boolean; time?: boolean; reason?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [allTelemedRequests, setAllTelemedRequests] = useState<any[]>([]);

  // Remove legacy clinic-wide cache if present
  useEffect(() => {
    AsyncStorage.removeItem("@cura_cached_telemed_all_requests").catch(() => { });
  }, []);

  const fetchAvailability = async () => {
    try {
      const availRes = await fetch(`${API_URL}/telemedicine/availability/?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" }
      });

      if (availRes.ok) {
        const data = await availRes.json();
        if (Array.isArray(data.unavailable_dates)) {
          setUnavailableDates(data.unavailable_dates);
        }
        if (Array.isArray(data.unavailable_times)) {
          setUnavailableTimes(data.unavailable_times);
        }
        if (typeof data.is_locked === "boolean") {
          setIsLocked(data.is_locked);
        }
        if (Array.isArray(data.booked_slots)) {
          setAllTelemedRequests(data.booked_slots);
        }
        if (data.case_rules && typeof data.case_rules === "object") {
          setCaseRules((prev) => ({ ...prev, ...data.case_rules }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch telemedicine availability:", err);
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(() => {
      if (isAppForeground()) fetchAvailability();
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDatePicker = () => {
    fetchAvailability();
    setShowDatePicker(true);
  };

  const handleOpenTimePicker = () => {
    if (!date) {
      setDate(getManilaDate());
    }
    fetchAvailability();
    setShowTimePicker(true);
  };

  // Dynamically compute booked/locked times for the selected date
  const bookedTimesForSelectedDate = useMemo(() => {
    if (!date) return [];
    const targetDate = normalizeDate(date);
    if (!targetDate) return [];
    const booked = new Set<string>();

    allTelemedRequests.forEach((req: any) => {
      const st = String(req.status || "").toLowerCase();
      // Only Pending and Approved requests lock the slot
      if (st === "rejected" || st === "completed" || st === "cancelled") {
        return;
      }

      const rawReqDate = req.scheduled_date || req.preferred_date || "";
      const reqDate = normalizeDate(rawReqDate);
      if (reqDate && reqDate === targetDate) {
        const reqTime = String(req.scheduled_time || req.preferred_time || "").trim();
        if (reqTime) {
          booked.add(reqTime);
        }
      }
    });

    return Array.from(booked);
  }, [date, allTelemedRequests]);

  // Combined unavailable times for the time picker (Manual clinic overrides + Auto-booked slots)
  const activeUnavailableTimes = useMemo(() => {
    return Array.from(new Set([...unavailableTimes, ...bookedTimesForSelectedDate]));
  }, [unavailableTimes, bookedTimesForSelectedDate]);

  // If a date has all slots booked, mark the date as unavailable too
  const fullyBookedDates = useMemo(() => {
    const dateCounts: Record<string, Set<string>> = {};
    allTelemedRequests.forEach((req: any) => {
      const st = String(req.status || "").toLowerCase();
      if (st === "rejected" || st === "completed" || st === "cancelled") return;
      const rawReqDate = req.scheduled_date || req.preferred_date || "";
      const reqDate = normalizeDate(rawReqDate);
      const reqTime = String(req.scheduled_time || req.preferred_time || "").trim();
      if (reqDate && reqTime) {
        if (!dateCounts[reqDate]) dateCounts[reqDate] = new Set();
        dateCounts[reqDate].add(reqTime);
      }
    });

    const fullDates: string[] = [];
    Object.entries(dateCounts).forEach(([d, slots]) => {
      if (slots.size >= TELEMEDICINE_TIME_SLOTS.length) {
        fullDates.push(d);
      }
    });
    return Array.from(new Set([...unavailableDates, ...fullDates]));
  }, [unavailableDates, allTelemedRequests]);

  // Auto-reset time if patient changes date to a date where the selected time is already booked
  useEffect(() => {
    if (time && date && activeUnavailableTimes.length > 0) {
      const normSlot = (s: string) => s.split("-")[0].trim().toLowerCase().replace(/\s+/g, "");
      const cleanTime = normSlot(time);
      const isBooked = activeUnavailableTimes.some((b) => normSlot(b) === cleanTime);
      if (isBooked) {
        setTime("");
        Alert.alert(
          "Slot Already Booked",
          `The time slot "${time}" on ${formatDisplayDate(date)} is already taken. Please choose another time.`
        );
      }
    }
  }, [date, activeUnavailableTimes, time]);


  const getRoomId = (rawUrl?: string, reqId?: string) => {
    if (rawUrl) {
      const match = rawUrl.match(/CURA-Telemed-[a-zA-Z0-9_-]+/i);
      if (match) return match[0];
    }
    if (reqId && /^CURA-Telemed-[a-zA-Z0-9_-]+$/i.test(reqId)) {
      return reqId;
    }
    const cleanId = (reqId || 'room').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `CURA-Telemed-${cleanId}`;
  };

  const handleJoinMeeting = async (rawUrl?: string, reqId?: string, access?: { canJoin: boolean; reason: string }) => {
    if (access && !access.canJoin) {
      Alert.alert("Consultation Locked", access.reason);
      return;
    }
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      } catch (err) {
        console.warn('Android permissions request error:', err);
      }
    }
    const roomId = getRoomId(rawUrl, reqId);
    setActiveCallRoom(roomId);
  };

  const handleOpenExternalBrowser = async (rawUrl?: string, reqId?: string, access?: { canJoin: boolean; reason: string }) => {
    if (access && !access.canJoin) {
      Alert.alert("Consultation Locked", access.reason);
      return;
    }
    try {
      const roomId = getRoomId(rawUrl, reqId);
      const redirectUrl = Linking.createURL('telemedicine');
      const targetUrl = getTelemedicineCallUrl(roomId, `role=patient&redirect_url=${encodeURIComponent(redirectUrl)}`);

      // Open in real external browser (Chrome / Safari) so WebRTC microphone and camera work natively
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        await WebBrowser.openBrowserAsync(targetUrl);
      }
      fetchRequests(true);
    } catch (err) {
      console.warn("Could not open in-app call browser:", err);
    }
  };
  // History State
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);

  // Instantly hydrate cached telemedicine requests
  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(`@cura_cached_telemedicine_${user.id}`).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRequests(parsed);
          }
        } catch (e) { }
      }
    }).catch(() => { });
  }, [user?.id]);

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!background) setIsLoading(true);

    const executeFetch = async (retries = 1): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await apiFetch(`${API_URL}/telemedicine/?patient=${encodeURIComponent(String(user.id))}`, {
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const uIds = [
              String(user?.id || ""),
              String((user as any)?.id_number || ""),
              String((user as any)?.patient_id || ""),
              String(user?.email || "")
            ].map(s => s.trim().toLowerCase()).filter(Boolean);
            const myRequests = data.filter((r: any) => {
              const pId = String(r.patient?.id ?? r.patient ?? "").trim().toLowerCase();
              return uIds.includes(pId);
            });
            setRequests(myRequests);
            AsyncStorage.setItem(`@cura_cached_telemedicine_${user.id}`, JSON.stringify(myRequests)).catch(() => { });
          }
        }
      } catch (err: any) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          return executeFetch(retries - 1);
        }
        if (background) {
          console.warn("Telemedicine background fetch notice:", err?.message || err);
        } else {
          console.warn("Failed to fetch telemedicine requests:", err?.message || err);
        }
      }
    };

    try {
      await executeFetch(1);
    } finally {
      isFetchingRef.current = false;
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    let timerId: any;

    if (activeTab === "history") {
      fetchRequests(false);

      const poll = async () => {
        if (!isMounted) return;
        if (isAppForeground()) {
          await fetchRequests(true);
        }
        if (isMounted) {
          timerId = setTimeout(poll, 15000);
        }
      };

      timerId = setTimeout(poll, 15000);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeTab, fetchRequests]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!user?.id) {
      Alert.alert("Session Required", "Please sign in again to submit a telemedicine request.");
      return;
    }

    const newErrors: { caseCategory?: boolean; date?: boolean; time?: boolean; reason?: boolean } = {};
    if (!caseCategory.trim()) newErrors.caseCategory = true;
    if (!date.trim()) newErrors.date = true;
    if (!time.trim()) newErrors.time = true;
    if (!reason.trim()) newErrors.reason = true;

    if (caseCategory && caseRules[caseCategory] === "in_person_only") {
      Alert.alert(
        "In-Person Visit Required",
        `"${caseCategory}" requires physical clinic examination.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Book In-Person", onPress: () => navigate("appointment") },
        ]
      );
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const missingList: string[] = [];
      if (newErrors.caseCategory) missingList.push("Case / Chief Complaint");
      if (newErrors.date) missingList.push("Preferred Date");
      if (newErrors.time) missingList.push("Preferred Time");
      if (newErrors.reason) missingList.push("Reason for Consult");

      Alert.alert(
        "Incomplete Request",
        `Please fill in the required field(s):\n• ${missingList.join("\n• ")}`
      );
      return;
    }

    if (date && fullyBookedDates.includes(date)) {
      Alert.alert("Date Fully Booked", "The selected date is fully booked for telemedicine consultations. Please select another date.");
      return;
    }

    const normSlot = (s: string) => s.split("-")[0].trim().toLowerCase().replace(/\s+/g, "");
    const cleanTime = normSlot(time);
    const isSlotTaken = activeUnavailableTimes.some((b) => normSlot(b) === cleanTime);

    if (isSlotTaken) {
      Alert.alert(
        "Time Slot Locked",
        "This time slot has already been booked by another patient. Please choose an available time."
      );
      setTime("");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch(`${API_URL}/telemedicine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          preferred_date: date, // format should be YYYY-MM-DD for Django DateField
          preferred_time: time,
          case_category: caseCategory,
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        const createdReq = await res.json();
        if (createdReq && createdReq.id) {
          setAllTelemedRequests((prev) => [createdReq, ...prev]);
          setRequests((prev) => {
            const updated = [createdReq, ...prev.filter((r) => r.id !== createdReq.id)];
            if (user?.id) {
              AsyncStorage.setItem(`@cura_cached_telemedicine_${user.id}`, JSON.stringify(updated)).catch(() => { });
            }
            return updated;
          });
        }
        setConfirmedDetails({ date, time });
        setShowConfirmation(true);
        // Keep date selected so the newly booked slot remains visible as locked
        setTime("");
        setReason("");
        setErrors({});
        fetchRequests(true);
      } else {
        console.error("Failed to submit request", await res.text());
        Alert.alert("Submission Failed", "Could not submit telemedicine request. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting request", err);
      Alert.alert("Connection Error", "Network error while submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <View className="flex-row items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-xs font-bold text-emerald-800">Approved</Text>
          </View>
        );
      case "Rejected":
        return (
          <View className="flex-row items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-rose-800">Rejected</Text>
          </View>
        );
      case "Completed":
        return (
          <View className="flex-row items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-slate-700">Completed</Text>
          </View>
        );
      default:
        return (
          <View className="flex-row items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <Text className="text-xs font-bold text-amber-800">Pending</Text>
          </View>
        );
    }
  };

  if (isLocked) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Telemedicine" onBack={goBack} />
        <ComingSoonView title="Telemedicine is Coming Soon" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Telemedicine" onBack={goBack} />

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 mt-2">
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "book" ? "border-cura-900" : "border-transparent"}`}
          onPress={() => setActiveTab("book")}
        >
          <Text className={`font-bold text-sm ${activeTab === "book" ? "text-cura-900" : "text-slate-400"}`}>Book Call</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-cura-900" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold text-sm ${activeTab === "history" ? "text-cura-900" : "text-slate-400"}`}>My Requests</Text>
        </Pressable>
      </View>

      {activeTab === "book" ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View className="flex-col gap-6">
            {/* Case / Chief Complaint */}
            <View className="flex-col gap-1.5">
              <View className="flex-row items-center justify-between pl-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Case / Chief Complaint
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCasePicker(true)}
                activeOpacity={0.75}
                className="w-full bg-white rounded-[24px] px-5 py-4 flex-row items-center justify-between"
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.caseCategory ? "#F87171" : "#E2E8F0",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                }}
              >
                <Text
                  className="text-sm font-bold flex-1 pr-3"
                  style={{ color: "#002D72", fontFamily: "Outfit" }}
                >
                  {caseCategory ? caseCategory : "Select clinic case..."}
                </Text>
                <View className="px-3 py-1 rounded-full bg-slate-100">
                  <Text className="text-[11px] font-bold text-slate-600">Select</Text>
                </View>
              </TouchableOpacity>

              <Modal
                visible={showCasePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCasePicker(false)}
              >
                <View className="flex-1 bg-black/50 justify-end">
                  <View className="bg-white rounded-t-[28px] p-5 max-h-[75%]">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                        Select Clinic Case
                      </Text>
                      <TouchableOpacity onPress={() => setShowCasePicker(false)} className="px-3 py-1 rounded-full bg-slate-100">
                        <Text className="text-xs font-bold text-slate-600">Close</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      placeholder="Search cases..."
                      placeholderTextColor="#94A3B8"
                      value={caseSearch}
                      onChangeText={setCaseSearch}
                      className="bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-800 mb-3"
                    />
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {Object.entries(caseRules)
                        .filter(([name, mode]) => mode !== "in_person_only" && (!caseSearch.trim() || name.toLowerCase().includes(caseSearch.trim().toLowerCase())))
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([name]) => (
                          <TouchableOpacity
                            key={name}
                            onPress={() => {
                              setCaseCategory(name);
                              setErrors((prev) => ({ ...prev, caseCategory: false }));
                              if (!reason.trim()) setReason(name);
                              setShowCasePicker(false);
                            }}
                            className="py-3.5 px-3 border-b border-slate-100 flex-row items-center justify-between"
                          >
                            <Text className="text-sm font-semibold text-slate-800 flex-1 pr-2">{name}</Text>
                            {caseCategory === name ? (
                              <View className="px-2.5 py-0.5 rounded-full bg-sky-100">
                                <Text className="text-[10px] font-bold text-sky-700 uppercase">Selected</Text>
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Preferred Date */}
            <View className="flex-col gap-1.5">
              <View className="flex-row items-center justify-between pl-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferred Date
                </Text>
                {date ? (
                  <TouchableOpacity
                    onPress={() => {
                      setDate("");
                      setErrors((prev) => ({ ...prev, date: true }));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text className="text-[11px] font-semibold text-rose-500">Reset Date</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleOpenDatePicker}
                activeOpacity={0.75}
                className="w-full bg-white rounded-[24px] px-5 py-4 flex-row items-center justify-between"
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.date ? "#F87171" : "#E2E8F0",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-sky-50 items-center justify-center">
                    <Svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                      <Defs>
                        <SvgLinearGradient id="gDateTelemed" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#00A3FF" />
                          <Stop offset="100%" stopColor="#0056B3" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect x="5" y="9" width="30" height="25" rx="6" fill="url(#gDateTelemed)" />
                      <Rect x="11" y="5" width="3" height="7" rx="1.5" fill="#38BDF8" />
                      <Rect x="26" y="5" width="3" height="7" rx="1.5" fill="#38BDF8" />
                      <Line x1="5" y1="16" x2="35" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" />
                      <Polyline points="14 24 18 28 26 20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color: "#002D72",
                      fontFamily: "Outfit",
                    }}
                  >
                    {date
                      ? formatDisplayDate(date)
                      : "Select consultation date..."}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-slate-100">
                  <Text className="text-[11px] font-bold text-slate-600">Choose</Text>
                </View>
              </TouchableOpacity>
              <LiquidGlassDatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={date}
                onSelectDate={(newDate) => {
                  setDate(newDate);
                  setErrors((prev) => ({ ...prev, date: false }));
                }}
                title="Select Consultation Date"
                unavailableDates={fullyBookedDates}
              />
            </View>

            {/* Preferred Time */}
            <View className="flex-col gap-1.5">
              <View className="flex-row items-center justify-between pl-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferred Time
                </Text>
                {time ? (
                  <TouchableOpacity
                    onPress={() => {
                      setTime("");
                      setErrors((prev) => ({ ...prev, time: true }));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text className="text-[11px] font-semibold text-rose-500">Reset Time</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleOpenTimePicker}
                activeOpacity={0.75}
                className="w-full bg-white rounded-[24px] px-5 py-4 flex-row items-center justify-between"
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.time ? "#F87171" : "#E2E8F0",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-sky-50 items-center justify-center">
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="9" stroke="#00A3FF" strokeWidth="2.2" />
                      <Polyline points="12 7 12 12 15 15" stroke="#0056B3" strokeWidth="2.2" strokeLinecap="round" />
                    </Svg>
                  </View>
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color: "#002D72",
                      fontFamily: "Outfit",
                    }}
                  >
                    {time ? time : "Select consultation time..."}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-slate-100">
                  <Text className="text-[11px] font-bold text-slate-600">Choose</Text>
                </View>
              </TouchableOpacity>
              <LiquidGlassTimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                selectedTime={time}
                onSelectTime={(newTime) => {
                  setTime(newTime);
                  setErrors((prev) => ({ ...prev, time: false }));
                }}
                title="Select Consultation Time"
                unavailableTimes={activeUnavailableTimes}
                selectedDate={date ? formatDisplayDate(date) : undefined}
              />
            </View>

            {/* Reason for Consult */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Reason for Consult
              </Text>
              <View
                className="bg-white rounded-[24px] px-4 py-3.5"
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.reason ? "#F87171" : "#E2E8F0",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                }}
              >
                <TextInput
                  placeholder="Describe what you are feeling..."
                  placeholderTextColor="#94A3B8"
                  value={reason}
                  onChangeText={(text) => {
                    setReason(text);
                    if (errors.reason && text.trim()) {
                      setErrors((prev) => ({ ...prev, reason: false }));
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  className="text-sm text-slate-800 leading-relaxed"
                  style={{ minHeight: 85, textAlignVertical: "top" }}
                />
              </View>
            </View>

            {/* Submit Button */}
            <View className="mt-8">
              <Button
                variant="blue"
                fullWidth
                onPress={handleSubmit}
                loading={isSubmitting}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Outfit" }}>
                  Submit Request
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRequests} />}
        >
          {isLoading && requests.length === 0 ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="small" color="#002D72" />
            </View>
          ) : requests.length === 0 ? (
            <View className="items-center justify-center py-16 px-4">
              <Text
                className="text-slate-600 text-sm font-semibold text-center"
                style={{ fontFamily: "Outfit" }}
              >
                No telemedicine requests found.
              </Text>
            </View>
          ) : (
            requests.map((req) => (
              <View
                key={req.id}
                className="p-5 rounded-[24px] relative overflow-hidden"
                style={{
                  borderWidth: 1,
                  borderTopColor: "rgba(255, 255, 255, 0.45)",
                  borderLeftColor: "rgba(255, 255, 255, 0.3)",
                  borderRightColor: "rgba(255, 255, 255, 0.2)",
                  borderBottomColor: "rgba(255, 255, 255, 0.15)",
                  shadowColor: "#0A2472",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={ADMIN_PORTAL_GRADIENT.colors}
                  start={ADMIN_PORTAL_GRADIENT.start}
                  end={ADMIN_PORTAL_GRADIENT.end}
                  style={StyleSheet.absoluteFill}
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-sm font-bold text-white mb-1" style={{ fontFamily: "Outfit" }}>{req.preferred_date}</Text>
                    <Text className="text-xs text-white/80">{formatTime12(req.preferred_time)}</Text>
                    {req.case_category ? (
                      <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
                        <View className="bg-white/20 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-semibold text-white">{req.case_category}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                <Text className="text-sm text-white/95 mb-4 bg-white/10 p-3 rounded-xl border border-white/15">
                  "{req.reason}"
                </Text>

                {req.status === "Approved" && (() => {
                  const scheduledDate = req.scheduled_date || req.preferred_date;
                  const scheduledTime = req.scheduled_time || req.preferred_time;
                  const access = getScheduleAccess(scheduledDate, scheduledTime);

                  return (
                    <View className="bg-emerald-50 rounded-2xl p-4 mt-2 border border-emerald-100">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-emerald-800">✅ CONSULTATION APPROVED</Text>
                        {access.canJoin ? (
                          <View className="flex-row items-center gap-1.5 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <View className="w-2 h-2 rounded-full bg-emerald-500" />
                            <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Live Now</Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1.5 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <LockIcon size={12} />
                            <Text className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Locked</Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-xs text-emerald-700 mb-1">
                        <Text className="font-bold">Scheduled:</Text> {scheduledDate} at {formatTime12(scheduledTime)}
                      </Text>

                      {!access.canJoin && (
                        <View className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 my-2 flex-row items-center gap-2">
                          <LockIcon size={16} />
                          <Text className="text-xs text-amber-900 font-medium flex-1">
                            {access.reason}
                          </Text>
                        </View>
                      )}

                      {access.canJoin ? (
                        <>
                          <Pressable
                            className="bg-emerald-600 active:bg-emerald-700 rounded-xl py-3 px-4 mt-2 items-center justify-center shadow-sm"
                            onPress={() => handleOpenExternalBrowser(req.meeting_link, req.id, access)}
                          >
                            <Text className="text-white text-xs font-bold tracking-wider uppercase">
                              🎥 Join Video Call (Recommended)
                            </Text>
                          </Pressable>

                          <Pressable
                            className="bg-slate-800 active:bg-slate-700 rounded-xl py-2.5 px-4 mt-2 items-center justify-center shadow-2xs"
                            onPress={() => handleJoinMeeting(req.meeting_link, req.id, access)}
                          >
                            <Text className="text-slate-300 text-xs font-semibold">
                              📱 Join In-App (Modal WebView)
                            </Text>
                          </Pressable>

                          {req.secondary_link ? (
                            <Pressable
                              className="bg-white border border-emerald-200 rounded-xl py-2.5 px-4 mt-2 items-center justify-center shadow-2xs active:bg-emerald-50"
                              onPress={() => Linking.openURL(req.secondary_link)}
                            >
                              <Text className="text-emerald-700 text-xs font-semibold">
                                🌐 Join via Google Meet Backup
                              </Text>
                            </Pressable>
                          ) : null}
                        </>
                      ) : (
                        <Pressable
                          className="bg-slate-200/80 rounded-xl py-3 px-4 mt-2 flex-row items-center justify-center gap-2 border border-slate-300"
                          onPress={() => Alert.alert("Consultation Locked", access.reason)}
                        >
                          <LockIcon size={16} />
                          <Text className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                            Video Call Locked Until Scheduled Time
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })()}

                {req.status === "Rejected" && (
                  <View className="bg-rose-50 rounded-xl p-4 mt-2 border border-rose-100">
                    <Text className="text-xs font-bold text-rose-800">❌ REQUEST REJECTED</Text>
                    <Text className="text-xs text-rose-700 mt-1">Please contact the clinic for more information or book an in-person appointment.</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* In-App Embedded Video Call Modal (Messenger style) */}
      <Modal
        visible={!!activeCallRoom}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveCallRoom(null)}
      >
        <SafeAreaView className="flex-1 bg-[#0B1C33]" edges={["top", "bottom"]}>
          {/* Header Bar */}
          <View className="flex-row items-center justify-between px-4 py-3 bg-[#0B2136] border-b border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <View>
                <Text className="text-white font-bold text-sm">CURA Telemedicine</Text>
                <Text className="text-[10px] text-slate-400">Encrypted Consultation</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  const room = activeCallRoom;
                  setActiveCallRoom(null);
                  if (room) handleOpenExternalBrowser(undefined, room);
                }}
                className="bg-slate-700 active:bg-slate-600 px-2.5 py-1.5 rounded-lg flex-row items-center"
              >
                <Text className="text-emerald-300 text-[11px] font-bold">🌐 Switch to Chrome</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveCallRoom(null)}
                className="bg-rose-600 active:bg-rose-700 px-3 py-1.5 rounded-lg flex-row items-center gap-1 shadow-sm"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">✕ Leave</Text>
              </Pressable>
            </View>
          </View>

          {/* Embedded WebRTC Call via WebView */}
          {activeCallRoom && (
            <WebView
              source={{ uri: getTelemedicineCallUrl(activeCallRoom, 'role=patient&embedded=true') }}
              style={{ flex: 1, backgroundColor: "#0B1C33" }}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={[WEB_APP_URL, 'curamobile://*']}
              cameraEnabled={true}
              microphoneEnabled={true}
              mediaCapturePermissionGrantType="grant"
              androidHardwareAccelerationDisabled={false}
              androidLayerType="hardware"
              onPermissionRequest={(request: any) => {
                try {
                  const reqOrigin = request?.origin ? new URL(request.origin).origin : '';
                  const allowedOrigin = new URL(WEB_APP_URL).origin;
                  if (reqOrigin === allowedOrigin) {
                    request.grant(request.resources);
                    return;
                  }
                } catch {}
                request.deny?.();
              }}
              onNavigationStateChange={(navState: any) => {
                if (navState.url.startsWith("curamobile://")) {
                  setActiveCallRoom(null);
                }
              }}
              onMessage={(event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data?.type === "END_CALL") {
                    setActiveCallRoom(null);
                  }
                } catch {
                  if (event.nativeEvent.data === "END_CALL") {
                    setActiveCallRoom(null);
                  }
                }
              }}
              injectedJavaScript={`
                (function() {
                  var notifyEnd = function() {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'END_CALL' }));
                    }
                  };
                  var origPushState = history.pushState;
                  history.pushState = function() {
                    origPushState.apply(this, arguments);
                    if (!window.location.pathname.includes('/call/')) {
                      notifyEnd();
                    }
                  };
                  window.addEventListener('popstate', function() {
                    if (!window.location.pathname.includes('/call/')) {
                      notifyEnd();
                    }
                  });
                })();
                true;
              `}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Confirmation Modal */}
      <RequestConfirmationModal
        visible={showConfirmation}
        type="telemed"
        date={confirmedDetails.date}
        time={confirmedDetails.time}
        onClose={() => {
          setShowConfirmation(false);
          setActiveTab("history");
        }}
        onViewRequests={() => {
          setShowConfirmation(false);
          setActiveTab("history");
        }}
      />
    </View>
  );
}
