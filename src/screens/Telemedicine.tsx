import { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, Text, TextInput, Pressable, TouchableOpacity, RefreshControl, Modal, Platform, PermissionsAndroid, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Header, Button, Card, Badge } from "../components/Shell";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import type { Screen, AppUser } from "../types";
import { getManilaDate, getManilaTime, normalizeDate, formatTime12 } from "../utils/philippineTime";

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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("Morning (8AM - 12PM)");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  const getRoomId = (rawUrl?: string, reqId?: string) => {
    if (rawUrl) {
      const match = rawUrl.match(/CURA-Telemed-[a-zA-Z0-9_-]+/i);
      if (match) return match[0];
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
      const targetUrl = `https://cura-bice.vercel.app/call/${roomId}?role=patient&redirect_url=${encodeURIComponent(redirectUrl)}`;

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

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!background) setIsLoading(true);

    const executeFetch = async (retries = 1): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`, {
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const myRequests = data.filter((r: any) => r.patient === user.id);
            setRequests(myRequests);
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
        await fetchRequests(true);
        if (isMounted) {
          timerId = setTimeout(poll, 4000);
        }
      };

      timerId = setTimeout(poll, 4000);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeTab, fetchRequests]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          preferred_date: date, // format should be YYYY-MM-DD for Django DateField
          preferred_time: time,
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        setIsPending(true);
        // Reset form
        setDate("");
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
        <Header title="Telemedicine" onBack={goBack} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-6">⏳</Text>
          <Text className="text-xl font-bold text-white text-center mb-2" style={{ fontFamily: "Outfit" }}>
            Request Sent
          </Text>
          <Text className="text-sm text-white/80 text-center mb-8 px-4 leading-relaxed">
            Your telemedicine request has been sent to the clinic. Please wait for a doctor or admin to approve your request.
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
          {/* Info Banner */}
          <View
            className="bg-white rounded-[28px] p-4 flex-row items-center gap-3.5 border border-sky-100 mb-6 shadow-xs"
          >
            <View className="w-11 h-11 rounded-2xl bg-sky-50 items-center justify-center">
              <Text className="text-xl">📹</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-cura-900 mb-0.5" style={{ fontFamily: "Outfit" }}>
                Online Video Consultation
              </Text>
              <Text className="text-xs text-slate-500 leading-relaxed">
                Request an online video consultation. The clinic will review your request and provide a meeting link if approved.
              </Text>
            </View>
          </View>

          <View className="flex-col gap-6">
            {/* Preferred Date */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Preferred Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
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
                    <Text className="text-base">📅</Text>
                  </View>
                  <Text className={`text-sm ${date ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
                    {date
                      ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Select consultation date..."}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-slate-100">
                  <Text className="text-[11px] font-bold text-slate-600">Choose</Text>
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date + "T00:00:00") : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
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
                    value: "Morning (8AM - 12PM)",
                  },
                  {
                    label: "Afternoon",
                    timeRange: "1:00 PM - 5:00 PM",
                    icon: "☀️",
                    value: "Afternoon (1PM - 5PM)",
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
                        borderColor: isSelected ? "#1E3A9E" : "#E2E8F0",
                        borderWidth: isSelected ? 2 : 1,
                        elevation: isSelected ? 3 : 1,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.12 : 0.04,
                        shadowRadius: 6,
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
                      {isSelected && (
                        <View className="absolute top-0 left-0 right-0 h-1 bg-sky-400" />
                      )}
                      <Text className="text-xl mb-1">{slot.icon}</Text>
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

            {/* Reason for Consult */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Reason for Consult
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
                  placeholder="Describe what you are feeling..."
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
                disabled={!date.trim() || !reason.trim()}
              >
                📹 Submit Request
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
              <Text className="text-white/80 text-center">No telemedicine requests found.</Text>
            </View>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="p-5 border border-slate-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-sm font-bold text-slate-800 mb-1">{req.preferred_date}</Text>
                    <Text className="text-xs text-slate-500">{formatTime12(req.preferred_time)}</Text>
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                <Text className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  "{req.reason}"
                </Text>

                {req.status === "Approved" && (() => {
                  const scheduledDate = req.scheduled_date || req.preferred_date;
                  const scheduledTime = req.scheduled_time || req.preferred_time;
                  const access = getScheduleAccess(scheduledDate, scheduledTime);

                  return (
                    <View className="bg-emerald-50 rounded-xl p-4 mt-2 border border-emerald-100">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-emerald-800">✅ CONSULTATION APPROVED</Text>
                        {access.canJoin ? (
                          <View className="flex-row items-center gap-1.5 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <View className="w-2 h-2 rounded-full bg-emerald-500" />
                            <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Live Now</Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Text className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Locked</Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-xs text-emerald-700 mb-1">
                        <Text className="font-bold">Scheduled:</Text> {scheduledDate} at {formatTime12(scheduledTime)}
                      </Text>

                      {!access.canJoin && (
                        <View className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 my-2">
                          <Text className="text-xs text-amber-900 font-medium">
                            🔒 {access.reason}
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
                          className="bg-slate-200/80 rounded-xl py-3 px-4 mt-2 items-center justify-center border border-slate-300"
                          onPress={() => Alert.alert("Consultation Locked", access.reason)}
                        >
                          <Text className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                            🔒 Video Call Locked Until Scheduled Time
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
              </Card>
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
              source={{ uri: `https://cura-bice.vercel.app/call/${activeCallRoom}?role=patient&embedded=true` }}
              style={{ flex: 1, backgroundColor: "#0B1C33" }}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={["*"]}
              cameraEnabled={true}
              microphoneEnabled={true}
              mediaCapturePermissionGrantType="grant"
              androidHardwareAccelerationDisabled={false}
              androidLayerType="hardware"
              onPermissionRequest={(request: any) => {
                request.grant(request.resources);
              }}
              onNavigationStateChange={(navState: any) => {
                if (navState.url.startsWith("curamobile://") || (!navState.url.includes("/call/") && !navState.loading)) {
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
    </View>
  );
}
