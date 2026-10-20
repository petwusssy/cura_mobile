import { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, Text, TextInput, Pressable, TouchableOpacity, RefreshControl, Modal, Platform, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Header, Button, Card, Badge } from "../components/Shell";
import { LiquidGlassDatePickerModal } from "../components/LiquidGlassDatePickerModal";
import { LiquidGlassTimePickerModal } from "../components/LiquidGlassTimePickerModal";
import { RequestConfirmationModal } from "../components/RequestConfirmationModal";
import type { Screen, AppUser } from "../types";
import { getManilaDate, normalizeDate, formatTime12 } from "../utils/philippineTime";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

function MedicalIcon({ selected }: { selected?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id="gMedVis" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#0056B3" />
        </SvgLinearGradient>
      </Defs>
      {/* Medical Cross badge with solid presence */}
      <Rect
        x="14"
        y="6"
        width="4"
        height="10"
        rx="1.5"
        fill={selected ? "#FFFFFF" : "url(#gMedVis)"}
      />
      <Rect
        x="11"
        y="9"
        width="10"
        height="4"
        rx="1.5"
        fill={selected ? "#FFFFFF" : "url(#gMedVis)"}
      />
      {/* Stethoscope binaural tubes */}
      <Path
        d="M8.5 5.5v5.5c0 4.8 3.3 7.5 7.5 7.5s7.5-2.7 7.5-7.5V5.5"
        stroke={selected ? "#FFFFFF" : "#0284C7"}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Ear tips */}
      <Circle cx="8.5" cy="5.5" r="2" fill={selected ? "#FFFFFF" : "#0284C7"} />
      <Circle cx="23.5" cy="5.5" r="2" fill={selected ? "#FFFFFF" : "#0284C7"} />
      {/* Lower flexible tubing */}
      <Path
        d="M16 18.5v3.2c0 2.4 1.8 4.3 4.2 4.3h1.8"
        stroke={selected ? "#FFFFFF" : "#0284C7"}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Chestpiece diaphragm */}
      <Circle
        cx="23.5"
        cy="26"
        r="4.5"
        fill={selected ? "#FFFFFF" : "url(#gMedVis)"}
        stroke={selected ? "#0A2472" : "#0284C7"}
        strokeWidth="1.2"
      />
      <Circle cx="23.5" cy="26" r="1.8" fill={selected ? "#002D72" : "#FFFFFF"} />
    </Svg>
  );
}

function DentalIcon({ selected }: { selected?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id="gDent" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#0056B3" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M10 6c-3 0-5 3-5 7 0 4 2 8 3 13 1 1 2.5 1 3.5 0l2.5-7h4l2.5 7c1 1 2.5 1 3.5 0 1-5 3-9 3-13 0-4-2-7-5-7-2 0-3.5 1.5-5 3-1.5-1.5-3-3-5-3z"
        fill={selected ? "#FFFFFF" : "url(#gDent)"}
        stroke={selected ? "#FFFFFF" : "#0284C7"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path
        d="M9 10c0-1.5 1-2.5 2.5-2.5"
        stroke={selected ? "#002D72" : "#FFFFFF"}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={selected ? 0.35 : 0.8}
      />
    </Svg>
  );
}

function ClearanceIcon({ selected }: { selected?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id="gClear" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#0056B3" />
        </SvgLinearGradient>
      </Defs>
      <Rect
        x="7"
        y="6"
        width="18"
        height="22"
        rx="4"
        fill={selected ? "rgba(255, 255, 255, 0.25)" : "url(#gClear)"}
        stroke={selected ? "#FFFFFF" : "#0284C7"}
        strokeWidth="1.8"
      />
      <Rect x="12" y="4" width="8" height="4" rx="1.5" fill={selected ? "#FFFFFF" : "#0284C7"} />
      <Polyline points="11 17 14 20 21 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="23" x2="20" y2="23" stroke={selected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)"} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
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
  } catch (e) {}
  return dateStr;
}

function BlueMailboxIcon({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none" style={{ marginBottom: 12 }}>
      <Defs>
        <SvgLinearGradient id="gMailboxBlueAppt" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </SvgLinearGradient>
        <SvgLinearGradient id="gMailboxPostAppt" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0369A1" />
          <Stop offset="100%" stopColor="#0B2136" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="20" y="30" width="4" height="10" rx="1.5" fill="url(#gMailboxPostAppt)" />
      <Path
        d="M10 17 C10 10.5 15.5 6 22 6 C28.5 6 34 10.5 34 17 L34 29 C34 30.1 33.1 31 32 31 L12 31 C10.9 31 10 30.1 10 29 Z"
        fill="url(#gMailboxBlueAppt)"
      />
      <Path
        d="M13 18 C13 13 17 9.5 22 9.5 C27 9.5 31 13 31 18 L31 28 C31 29 30 29.5 29 29.5 L15 29.5 C14 29.5 13 29 13 28 Z"
        fill="#002D72"
        opacity={0.85}
      />
      <Rect x="34" y="16" width="6" height="2.5" rx="1" fill="#BAE6FD" />
      <Rect x="37" y="18.5" width="4" height="6" rx="1" fill="#38BDF8" />
      <Path
        d="M14 15 C15.5 11 18.5 8.5 22 8.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function AppointmentsScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [visitType, setVisitType] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ visitType?: boolean; date?: boolean; time?: boolean; reason?: boolean }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const [allAppointmentRequests, setAllAppointmentRequests] = useState<any[]>([]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/appointments/availability/?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.unavailable_dates)) {
          setUnavailableDates(data.unavailable_dates);
        }
        if (Array.isArray(data.unavailable_times)) {
          setUnavailableTimes(data.unavailable_times);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch appointment availability:", err);
    }
  };


  useEffect(() => {
    fetchAvailability();
  }, []);


  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Instantly hydrate cached appointments
  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(`@cura_cached_appointments_${user.id}`).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRequests(parsed);
          }
        } catch (e) {}
      }
    }).catch(() => {});
  }, [user?.id]);

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id) return;
    if (!background) setIsLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/appointments/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllAppointmentRequests(data);
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
          AsyncStorage.setItem(`@cura_cached_appointments_${user.id}`, JSON.stringify(myRequests)).catch(() => {});
        }
      }
    } catch (err) {
      if (!background) console.warn("Failed to fetch appointment requests", err);
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAvailability();
    fetchRequests(true);
  }, [fetchRequests]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRequests(false);
      const interval = setInterval(() => fetchRequests(true), 6000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchRequests]);

  // Dynamically compute booked/locked times for the selected date
  const bookedTimesForSelectedDate = useMemo(() => {
    if (!date) return [];
    const targetDate = normalizeDate(date);
    if (!targetDate) return [];
    const booked = new Set<string>();

    allAppointmentRequests.forEach((req: any) => {
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
  }, [date, allAppointmentRequests]);

  // Combined unavailable times for the time picker (Manual clinic overrides + Auto-booked slots)
  const activeUnavailableTimes = useMemo(() => {
    return Array.from(new Set([...unavailableTimes, ...bookedTimesForSelectedDate]));
  }, [unavailableTimes, bookedTimesForSelectedDate]);

  // Auto-reset time if patient changes date to a date where the selected time is already booked or closed
  useEffect(() => {
    if (time && date && activeUnavailableTimes.length > 0) {
      const cleanTime = time.toLowerCase().replace(/[\s:-]/g, "");
      const isUnavailable = activeUnavailableTimes.some((b) => {
        const cleanB = b.toLowerCase().replace(/[\s:-]/g, "");
        return cleanB === cleanTime || cleanTime.includes(cleanB) || cleanB.includes(cleanTime);
      });
      if (isUnavailable) {
        setTime("");
      }
    }
  }, [date, activeUnavailableTimes]);

  const handleOpenTimePicker = () => {
    if (!date) {
      Alert.alert("Select Date First", "Please pick an appointment date before choosing a time window.");
      return;
    }
    fetchAvailability();
    setShowTimePicker(true);
  };

  const handleOpenDatePicker = () => {
    fetchAvailability();
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    const newErrors: { visitType?: boolean; date?: boolean; time?: boolean; reason?: boolean } = {};
    if (!visitType) newErrors.visitType = true;
    if (!date.trim()) newErrors.date = true;
    if (!time.trim()) newErrors.time = true;
    if (!reason.trim()) newErrors.reason = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const missingList: string[] = [];
      if (newErrors.visitType) missingList.push("Type of Visit");
      if (newErrors.date) missingList.push("Preferred Date");
      if (newErrors.time) missingList.push("Preferred Time");
      if (newErrors.reason) missingList.push("Reason for Visit");

      Alert.alert(
        "Incomplete Request",
        `Please fill in the required field(s):\n• ${missingList.join("\n• ")}`
      );
      return;
    }

    if (date && unavailableDates.includes(date)) {
      Alert.alert("Date Unavailable", "The selected date is currently unavailable for in-person appointments. Please select an available date.");
      return;
    }
    const cleanTime = time.toLowerCase().replace(/[\s:-]/g, "");
    if (activeUnavailableTimes.some(b => {
      const cleanB = b.toLowerCase().replace(/[\s:-]/g, "");
      return cleanB === cleanTime || cleanTime.includes(cleanB) || cleanB.includes(cleanTime);
    })) {
      Alert.alert("Time Unavailable", "The selected time window is no longer available. Please choose another time.");
      setTime("");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          visit_type: visitType,
          preferred_date: date,
          preferred_time: time,
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        setConfirmedDetails({ date, time });
        setShowConfirmation(true);
        setVisitType("");
        setDate("");
        setTime("");
        setReason("");
        setErrors({});
        fetchRequests(true);
      } else {
        console.error("Failed to submit request", await res.text());
      }
    } catch (err) {
      console.error("Error submitting request", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return <Badge variant="success">Approved</Badge>;
      case "Rejected": return <Badge variant="error">Rejected</Badge>;
      case "Completed": return <Badge variant="neutral">Completed</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Appointments" onBack={goBack} />

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 mt-2">
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "book" ? "border-cura-900" : "border-transparent"}`}
          onPress={() => setActiveTab("book")}
        >
          <Text className={`font-bold ${activeTab === "book" ? "text-cura-900" : "text-slate-400"}`}>Book Visit</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-cura-900" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold ${activeTab === "history" ? "text-cura-900" : "text-slate-400"}`}>My Requests</Text>
        </Pressable>
      </View>

      {activeTab === "book" ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View className="flex-col gap-6">
            {/* Type of Visit */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Type of Visit
              </Text>
              <View className="flex-row gap-2.5">
                {[
                  { label: "Medical", icon: "🩺", value: "medical" },
                  { label: "Dental", icon: "🦷", value: "dental" },
                  { label: "Clearance", icon: "📋", value: "clearance" },
                ].map((item) => {
                  const isSelected = visitType === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setVisitType(item.value);
                        setErrors((prev) => ({ ...prev, visitType: false }));
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label} visit`}
                      accessibilityState={{ selected: isSelected }}
                      className="flex-1 rounded-[22px] py-3 px-1 items-center justify-center relative overflow-hidden"
                      style={{
                        backgroundColor: isSelected ? "transparent" : "#FFFFFF",
                        borderWidth: isSelected ? 1 : 1.5,
                        borderTopColor: isSelected ? "rgba(255, 255, 255, 0.45)" : errors.visitType ? "#F87171" : "#E2E8F0",
                        borderLeftColor: isSelected ? "rgba(255, 255, 255, 0.3)" : errors.visitType ? "#F87171" : "#E2E8F0",
                        borderRightColor: isSelected ? "rgba(255, 255, 255, 0.2)" : errors.visitType ? "#F87171" : "#E2E8F0",
                        borderBottomColor: isSelected ? "rgba(255, 255, 255, 0.15)" : errors.visitType ? "#F87171" : "#E2E8F0",
                        elevation: isSelected ? 4 : 1,
                        shadowColor: isSelected ? "#0A2472" : "#000",
                        shadowOffset: isSelected ? { width: 0, height: 6 } : { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.22 : 0.04,
                        shadowRadius: isSelected ? 12 : 6,
                      }}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={ADMIN_PORTAL_GRADIENT.colors}
                          start={ADMIN_PORTAL_GRADIENT.start}
                          end={ADMIN_PORTAL_GRADIENT.end}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      {item.value === "medical" && <MedicalIcon selected={isSelected} />}
                      {item.value === "dental" && <DentalIcon selected={isSelected} />}
                      {item.value === "clearance" && <ClearanceIcon selected={isSelected} />}
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: isSelected ? "#FFFFFF" : "#0B2136",
                          fontFamily: "Outfit",
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                      setTime("");
                      setErrors((prev) => ({ ...prev, date: true, time: false }));
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
                        <SvgLinearGradient id="gDateAppt" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#00A3FF" />
                          <Stop offset="100%" stopColor="#0056B3" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect x="5" y="9" width="30" height="25" rx="6" fill="url(#gDateAppt)" />
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
                      : "Select appointment date..."}
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
                title="Select Appointment Date"
                unavailableDates={unavailableDates}
              />
            </View>

            {/* Preferred Time Window */}
            <View className="flex-col gap-1.5">
              <View className="flex-row items-center justify-between pl-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferred Appointment Time
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
                    <Svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                      <Defs>
                        <SvgLinearGradient id="gTimeAppt" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#00A3FF" />
                          <Stop offset="100%" stopColor="#0056B3" />
                        </SvgLinearGradient>
                      </Defs>
                      <Circle cx="20" cy="20" r="14" fill="url(#gTimeAppt)" />
                      <Circle cx="20" cy="20" r="14" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.3" />
                      <Polyline points="20 12 20 20 25 23" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color: "#002D72",
                      fontFamily: "Outfit",
                    }}
                  >
                    {time ? time : "Select appointment time..."}
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
                title="Select Appointment Time"
                unavailableTimes={activeUnavailableTimes}
                selectedDate={date ? formatDisplayDate(date) : undefined}
              />
            </View>

            {/* Reason for Visit */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Reason for Visit
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
                  placeholder="Briefly describe your symptoms or reason for visit..."
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
                  Request Appointment
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
                No appointment requests found.
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
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                <Text className="text-sm text-white/95 mb-4 bg-white/10 p-3 rounded-xl border border-white/15">
                  <Text className="font-bold capitalize">{req.visit_type}:</Text> "{req.reason}"
                </Text>

                {req.status === "Approved" && (
                  <View className="bg-emerald-50 rounded-2xl p-4 mt-2 border border-emerald-100">
                    <Text className="text-xs font-bold text-emerald-800 mb-2">✅ APPOINTMENT APPROVED</Text>
                    <Text className="text-xs text-emerald-700 mb-1">
                      <Text className="font-bold">Scheduled:</Text> {req.scheduled_date || req.preferred_date} at {formatTime12(req.scheduled_time || req.preferred_time)}
                    </Text>
                  </View>
                )}

                {req.status === "Rejected" && (
                  <View className="bg-rose-50 rounded-xl p-4 mt-2 border border-rose-100">
                    <Text className="text-xs font-bold text-rose-800">❌ REQUEST REJECTED</Text>
                    <Text className="text-xs text-rose-700 mt-1">Please contact the clinic for more information.</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <RequestConfirmationModal
        visible={showConfirmation}
        type="appointment"
        date={confirmedDetails.date}
        time={confirmedDetails.time}
        onClose={() => setShowConfirmation(false)}
        onViewRequests={() => {
          setShowConfirmation(false);
          setActiveTab("history");
        }}
      />
    </View>
  );
}
