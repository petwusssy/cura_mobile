import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, TextInput, Pressable, TouchableOpacity, RefreshControl, Modal, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Header, Button, Card, Badge } from "../components/Shell";
import { LiquidGlassDatePickerModal } from "../components/LiquidGlassDatePickerModal";
import type { Screen, AppUser } from "../types";
import { formatTime12 } from "../utils/philippineTime";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

function MorningIcon({ selected }: { selected?: boolean }) {
  const gradId = selected ? "gMornApptSel" : "gMornAppt";
  return (
    <Svg width="26" height="26" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={selected ? "#FFFFFF" : "#00A3FF"} />
          <Stop offset="100%" stopColor={selected ? "#BAE6FD" : "#0056B3"} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M10 20a6 6 0 0 1 12 0H10z" fill={`url(#${gradId})`} />
      <Line x1="5" y1="21" x2="27" y2="21" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="9" x2="16" y2="12" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9.5" y1="12" x2="11.5" y2="14" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="22.5" y1="12" x2="20.5" y2="14" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="17" x2="9" y2="17.5" stroke={selected ? "#BAE6FD" : "#38BDF8"} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="25" y1="17" x2="23" y2="17.5" stroke={selected ? "#BAE6FD" : "#38BDF8"} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function AfternoonIcon({ selected }: { selected?: boolean }) {
  const gradId = selected ? "gAftApptSel" : "gAftAppt";
  return (
    <Svg width="26" height="26" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={selected ? "#FFFFFF" : "#00A3FF"} />
          <Stop offset="100%" stopColor={selected ? "#BAE6FD" : "#0056B3"} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="16" cy="16" r="6" fill={`url(#${gradId})`} />
      <Line x1="16" y1="5" x2="16" y2="8" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="24" x2="16" y2="27" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="5" y1="16" x2="8" y2="16" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="24" y1="16" x2="27" y2="16" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.2" y1="8.2" x2="10.3" y2="10.3" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="21.7" y1="21.7" x2="23.8" y2="23.8" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.2" y1="23.8" x2="10.3" y2="21.7" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Line x1="21.7" y1="10.3" x2="23.8" y2="8.2" stroke={selected ? "#BAE6FD" : "#00A3FF"} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="14" cy="14" r="1.5" fill="#FFFFFF" opacity={selected ? 0.9 : 0.8} />
    </Svg>
  );
}

function MedicalIcon({ selected }: { selected?: boolean }) {
  const gradId = selected ? "gMedVisSel" : "gMedVis";
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={selected ? "#FFFFFF" : "#00A3FF"} />
          <Stop offset="100%" stopColor={selected ? "#BAE6FD" : "#0056B3"} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M9 7v5a7 7 0 0 0 14 0V7" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="1.5" fill={selected ? "#BAE6FD" : "#00A3FF"} />
      <Circle cx="23" cy="7" r="1.5" fill={selected ? "#BAE6FD" : "#00A3FF"} />
      <Path d="M16 19v4a3 3 0 0 0 3 3h2" stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="23" cy="26" r="3.5" fill={`url(#${gradId})`} stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="1.5" />
      <Circle cx="23" cy="26" r="1" fill="#FFFFFF" />
    </Svg>
  );
}

function DentalIcon({ selected }: { selected?: boolean }) {
  const gradId = selected ? "gDentSel" : "gDent";
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={selected ? "#FFFFFF" : "#00A3FF"} />
          <Stop offset="100%" stopColor={selected ? "#BAE6FD" : "#0056B3"} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M10 6c-3 0-5 3-5 7 0 4 2 8 3 13 1 1 2.5 1 3.5 0l2.5-7h4l2.5 7c1 1 2.5 1 3.5 0 1-5 3-9 3-13 0-4-2-7-5-7-2 0-3.5 1.5-5 3-1.5-1.5-3-3-5-3z"
        fill={`url(#${gradId})`}
        stroke={selected ? "#FFFFFF" : "#38BDF8"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path d="M9 10c0-1.5 1-2.5 2.5-2.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
    </Svg>
  );
}

function ClearanceIcon({ selected }: { selected?: boolean }) {
  const gradId = selected ? "gClearSel" : "gClear";
  return (
    <Svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={selected ? "#FFFFFF" : "#00A3FF"} />
          <Stop offset="100%" stopColor={selected ? "#BAE6FD" : "#0056B3"} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="7" y="6" width="18" height="22" rx="4" fill={`url(#${gradId})`} stroke={selected ? "#FFFFFF" : "#38BDF8"} strokeWidth="1.5" />
      <Rect x="12" y="4" width="8" height="4" rx="1.5" fill={selected ? "#FFFFFF" : "#38BDF8"} />
      <Polyline points="11 17 14 20 21 13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="23" x2="20" y2="23" stroke={selected ? "rgba(255,255,255,0.7)" : "#38BDF8"} strokeWidth="1.5" strokeLinecap="round" />
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

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function AppointmentsScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [visitType, setVisitType] = useState("medical");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/appointments/`);
      if (res.ok) {
        const data = await res.json();
        const myRequests = data.filter((r: any) => r.patient === user.id);
        setRequests(myRequests);
        AsyncStorage.setItem(`@cura_cached_appointments_${user.id}`, JSON.stringify(myRequests)).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to fetch appointment requests", err);
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRequests(false);
      const interval = setInterval(() => fetchRequests(true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchRequests]);

  const handleOpenDatePicker = () => {
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
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          visit_type: visitType,
          preferred_date: date,
          preferred_time: time === "morning" ? "Morning (8AM - 12PM)" : time === "afternoon" ? "Afternoon (1PM - 5PM)" : "",
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        setIsPending(true);
        setDate("");
        setTime("");
        setReason("");
      } else {
        console.error("Failed to submit request", await res.text());
      }
    } catch (err) {
      console.error("Error submitting request", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Appointment" onBack={goBack} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-6">📅</Text>
          <Text className="text-xl font-bold text-cura-900 text-center mb-2" style={{ fontFamily: "Outfit" }}>
            Booking Sent
          </Text>
          <Text className="text-sm text-slate-600 text-center mb-8 px-4 leading-relaxed">
            Your appointment request for {date || "the selected date"} has been sent. Please wait for confirmation from the clinic admin.
          </Text>
          <Button fullWidth onPress={() => { setIsPending(false); setActiveTab("history"); }}>
            View My Requests
          </Button>
        </View>
      </View>
    );
  }

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
          {/* Info Banner */}
          <View
            className="bg-white rounded-[28px] p-4 flex-row items-center gap-3.5 border border-sky-100 mb-6 shadow-xs"
          >
            <View className="w-11 h-11 rounded-2xl bg-sky-50 items-center justify-center">
              <Svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <Defs>
                  <SvgLinearGradient id="gClinicBanner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#00A3FF" />
                    <Stop offset="100%" stopColor="#0056B3" />
                  </SvgLinearGradient>
                </Defs>
                <Rect x="6" y="8" width="20" height="20" rx="4" fill="url(#gClinicBanner)" />
                <Rect x="10" y="5" width="12" height="3" rx="1.5" fill="#38BDF8" />
                <Rect x="14.5" y="11" width="3" height="8" rx="1" fill="#FFFFFF" />
                <Rect x="12" y="13.5" width="8" height="3" rx="1" fill="#FFFFFF" />
                <Rect x="13" y="21" width="6" height="7" rx="1.5" fill="#38BDF8" />
              </Svg>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-cura-900 mb-0.5" style={{ fontFamily: "Outfit" }}>
                In-Person Clinic Visit
              </Text>
              <Text className="text-xs text-slate-500 leading-relaxed">
                Schedule an in-person appointment at the clinic. Your request will be reviewed for confirmation.
              </Text>
            </View>
          </View>

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
                      onPress={() => setVisitType(item.value)}
                      activeOpacity={0.75}
                      className="flex-1 rounded-[22px] py-3 px-1 items-center justify-center relative overflow-hidden"
                      style={{
                        backgroundColor: isSelected ? "transparent" : "#FFFFFF",
                        borderWidth: 1,
                        borderTopColor: isSelected ? "rgba(255, 255, 255, 0.45)" : "#E2E8F0",
                        borderLeftColor: isSelected ? "rgba(255, 255, 255, 0.3)" : "#E2E8F0",
                        borderRightColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "#E2E8F0",
                        borderBottomColor: isSelected ? "rgba(255, 255, 255, 0.15)" : "#E2E8F0",
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
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Preferred Date
              </Text>
              <TouchableOpacity
                onPress={handleOpenDatePicker}
                activeOpacity={0.75}
                className="w-full bg-white rounded-[24px] px-5 py-4 flex-row items-center justify-between"
                style={{
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
                onSelectDate={(newDate) => setDate(newDate)}
                title="Select Appointment Date"
              />
            </View>

            {/* Preferred Time */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Preferred Time
              </Text>
              <View className="flex-row gap-3">
                {[
                  {
                    label: "Morning",
                    timeRange: "8:00 AM - 12:00 PM",
                    icon: "🌅",
                    value: "morning",
                  },
                  {
                    label: "Afternoon",
                    timeRange: "1:00 PM - 5:00 PM",
                    icon: "☀️",
                    value: "afternoon",
                  },
                ].map((slot) => {
                  const isSelected = time === slot.value;
                  return (
                    <TouchableOpacity
                      key={slot.value}
                      onPress={() => setTime(slot.value)}
                      activeOpacity={0.75}
                      className="flex-1 rounded-[24px] p-3.5 items-center justify-center relative overflow-hidden"
                      style={{
                        backgroundColor: isSelected ? "transparent" : "#FFFFFF",
                        borderWidth: 1,
                        borderTopColor: isSelected ? "rgba(255, 255, 255, 0.45)" : "#E2E8F0",
                        borderLeftColor: isSelected ? "rgba(255, 255, 255, 0.3)" : "#E2E8F0",
                        borderRightColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "#E2E8F0",
                        borderBottomColor: isSelected ? "rgba(255, 255, 255, 0.15)" : "#E2E8F0",
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
                      {slot.value === "morning" ? (
                        <MorningIcon selected={isSelected} />
                      ) : (
                        <AfternoonIcon selected={isSelected} />
                      )}
                      <Text
                        className="text-sm font-black"
                        style={{
                          color: isSelected ? "#FFFFFF" : "#0B2136",
                          fontFamily: "Outfit",
                        }}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        className="text-[10px] font-semibold mt-0.5"
                        style={{
                          color: isSelected ? "rgba(255, 255, 255, 0.75)" : "#64748B",
                        }}
                      >
                        {slot.timeRange}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Reason for Visit */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Reason for Visit
              </Text>
              <View
                className="bg-white rounded-[24px] px-4 py-3.5"
                style={{
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
                  onChangeText={setReason}
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
                variant="white"
                fullWidth
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!date.trim() || !time || !reason.trim()}
              >
                <Text style={{ color: "#002D72", fontFamily: "Outfit" }}>
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
          {requests.length === 0 && !isLoading ? (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-white/80 text-center">No appointment requests found.</Text>
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
    </View>
  );
}
