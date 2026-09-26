import { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, Text, Pressable, RefreshControl, Modal, Platform, PermissionsAndroid, Alert } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Header, Input, Button, Card, Badge } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import type { Screen, AppUser } from "../types";
import { getManilaDate, normalizeDate, formatManilaDate } from "../utils/philippineTime";
import { TELEMEDICINE_TIME_SLOTS, checkMeetingJoinable } from "../utils/telemedicineSchedule";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function TelemedicineScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);

  // Book Form State - Default to today in Manila time
  const todayManila = getManilaDate();
  const [date, setDate] = useState(todayManila);
  const [time, setTime] = useState<string>(TELEMEDICINE_TIME_SLOTS[0]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // History & Clinic Availability State
  const [requests, setRequests] = useState<any[]>([]);
  const [allClinicRequests, setAllClinicRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`);
      if (res.ok) {
        const data = await res.json();
        setAllClinicRequests(data);
        if (user?.id) {
          const myRequests = data.filter((r: any) => r.patient === user.id);
          setRequests(myRequests);
        }
      }
    } catch (err) {
      console.error("Failed to fetch telemedicine requests", err);
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(true), 3500);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Determine booked slots for the chosen date across the entire clinic
  const bookedSlotsForDate = useMemo(() => {
    if (!date) return new Set<string>();
    const normalized = normalizeDate(date);
    const booked = new Set<string>();
    allClinicRequests.forEach((r: any) => {
      if (r.status === 'Rejected') return;
      const rDate = normalizeDate(r.scheduled_date || r.preferred_date);
      if (rDate === normalized) {
        const t = r.scheduled_time || r.preferred_time;
        if (t) booked.add(t);
      }
    });
    return booked;
  }, [date, allClinicRequests]);

  // List of all scheduled/booked consultations on this date for patient visibility
  const scheduledListForDate = useMemo(() => {
    if (!date) return [];
    const normalized = normalizeDate(date);
    return allClinicRequests.filter((r: any) => {
      if (r.status === 'Rejected') return false;
      const rDate = normalizeDate(r.scheduled_date || r.preferred_date);
      return rDate === normalized;
    });
  }, [date, allClinicRequests]);

  // Auto-switch to first available slot if currently selected slot is booked
  useEffect(() => {
    if (bookedSlotsForDate.has(time)) {
      const firstAvailable = TELEMEDICINE_TIME_SLOTS.find(s => !bookedSlotsForDate.has(s));
      if (firstAvailable) {
        setTime(firstAvailable);
      }
    }
  }, [bookedSlotsForDate, time]);

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

  const setRelativeDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDate(getManilaDate(d));
  };

  const getRoomId = (rawUrl?: string, reqId?: string) => {
    if (rawUrl) {
      const match = rawUrl.match(/CURA-Telemed-[a-zA-Z0-9_-]+/i);
      if (match) return match[0];
    }
    const cleanId = (reqId || 'room').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `CURA-Telemed-${cleanId}`;
  };

  const handleJoinMeeting = async (rawUrl?: string, reqId?: string, schedDate?: string, schedTime?: string) => {
    const schedule = checkMeetingJoinable(schedDate, schedTime);
    if (!schedule.canJoin) {
      Alert.alert(
        schedule.status === 'ended' ? "Consultation Ended" : "Meeting Room Locked",
        schedule.status === 'ended'
          ? "This consultation schedule has concluded."
          : `This meeting is scheduled for ${schedDate || 'your appointment'} at ${schedTime || 'the designated time'}.\n\nThe meeting room opens 15 minutes before the session starts.`
      );
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

  const handleOpenExternalBrowser = async (rawUrl?: string, reqId?: string, schedDate?: string, schedTime?: string) => {
    const schedule = checkMeetingJoinable(schedDate, schedTime);
    if (!schedule.canJoin) {
      Alert.alert(
        schedule.status === 'ended' ? "Consultation Ended" : "Meeting Room Locked",
        schedule.status === 'ended'
          ? "This consultation schedule has concluded."
          : `This meeting is scheduled for ${schedDate || 'your appointment'} at ${schedTime || 'the designated time'}.\n\nThe meeting room opens 15 minutes before the session starts.`
      );
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

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (bookedSlotsForDate.has(time)) {
      Alert.alert(
        "Time Slot Unavailable",
        `The ${time} slot is already booked on ${date}. Please select an available time slot.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          preferred_date: date,
          preferred_time: time,
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        setIsPending(true);
        setReason("");
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
            Your telemedicine appointment for {date} at {time} has been submitted. The clinic doctor will review and approve your schedule.
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
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "book" ? "border-white" : "border-transparent"}`}
          onPress={() => setActiveTab("book")}
        >
          <Text className={`font-bold text-sm ${activeTab === "book" ? "text-white" : "text-white/50"}`}>Book Call</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-white" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold text-sm ${activeTab === "history" ? "text-white" : "text-white/50"}`}>My Requests</Text>
        </Pressable>
      </View>

      {activeTab === "book" ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="mb-5 bg-white/10 p-4 rounded-2xl border border-white/15">
            <Text className="text-sm font-bold text-white mb-1">
              📅 Online Consultation Scheduling
            </Text>
            <Text className="text-xs text-white/80 leading-relaxed">
              Select your consultation date and pick an available 1-hour time slot. Scheduled meetings can only be joined during the designated appointment window.
            </Text>
          </View>

          <View className="flex-col gap-5">
            {/* Preferred Date Selector */}
            <View className="flex-col gap-1.5">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-bold text-slate-200 uppercase tracking-wider">Select Date</Text>
                <View className="flex-row gap-1.5">
                  <Pressable
                    onPress={() => setRelativeDate(0)}
                    className={`px-2.5 py-1 rounded-lg border ${date === todayManila ? 'bg-emerald-500/30 border-emerald-400' : 'bg-white/10 border-white/20'}`}
                  >
                    <Text className="text-[11px] font-bold text-white">Today</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRelativeDate(1)}
                    className="px-2.5 py-1 rounded-lg border bg-white/10 border-white/20"
                  >
                    <Text className="text-[11px] font-bold text-white">Tomorrow</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <Input
                    label=""
                    placeholder="YYYY-MM-DD"
                    value={date}
                    editable={false}
                  />
                </View>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onValueChange={onDateChange}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>

            {/* Time Slot Availability Grid */}
            <View className="flex-col gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Available Time Slots
                </Text>
                <View className="flex-row items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-[11px] font-bold text-emerald-300">
                    {TELEMEDICINE_TIME_SLOTS.length - bookedSlotsForDate.size} of {TELEMEDICINE_TIME_SLOTS.length} Available
                  </Text>
                </View>
              </View>

              <Text className="text-[11px] text-white/70 mb-1">
                Select your preferred 1-hour slot for {date || 'this date'}:
              </Text>

              {/* Slot Cards */}
              <View className="flex-col gap-2">
                {TELEMEDICINE_TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlotsForDate.has(slot);
                  const isSelected = time === slot && !isBooked;

                  return (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        if (isBooked) {
                          Alert.alert(
                            "Time Slot Occupied",
                            `The slot "${slot}" is already booked on ${date}. Please select an available slot.`
                          );
                          return;
                        }
                        setTime(slot);
                      }}
                      className={`p-3 rounded-xl border flex-row items-center justify-between transition-all ${
                        isBooked
                          ? "bg-slate-900/40 border-slate-700/60 opacity-60"
                          : isSelected
                          ? "bg-emerald-600 border-emerald-400 shadow-md"
                          : "bg-white/10 border-white/20 active:bg-white/20"
                      }`}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Text className="text-sm">
                          {isBooked ? "🔒" : isSelected ? "✅" : "🕒"}
                        </Text>
                        <View>
                          <Text
                            className={`text-xs font-bold ${
                              isBooked
                                ? "text-slate-400 line-through"
                                : isSelected
                                ? "text-white"
                                : "text-white"
                            }`}
                          >
                            {slot}
                          </Text>
                          <Text
                            className={`text-[10px] ${
                              isBooked ? "text-rose-400" : isSelected ? "text-emerald-100" : "text-white/60"
                            }`}
                          >
                            {isBooked ? "Already scheduled with doctor" : "Open for booking"}
                          </Text>
                        </View>
                      </View>

                      <View
                        className={`px-2 py-0.5 rounded-full border ${
                          isBooked
                            ? "bg-rose-500/20 border-rose-500/40"
                            : isSelected
                            ? "bg-white/25 border-white/40"
                            : "bg-emerald-500/20 border-emerald-400/30"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isBooked ? "text-rose-300" : isSelected ? "text-white" : "text-emerald-300"
                          }`}
                        >
                          {isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Daily Schedule Overview Widget */}
            <View className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/70">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-white flex-row items-center">
                  📋 Clinic Schedule for {date}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  {scheduledListForDate.length} Booked Session{scheduledListForDate.length === 1 ? '' : 's'}
                </Text>
              </View>

              {scheduledListForDate.length === 0 ? (
                <Text className="text-xs text-emerald-400 italic">
                  ✨ No consultations booked yet on this date. All hours are open!
                </Text>
              ) : (
                <View className="flex-col gap-1.5 mt-1">
                  {scheduledListForDate.map((sched: any, idx: number) => {
                    const schedTimeDisplay = sched.scheduled_time || sched.preferred_time;
                    const isMyOwn = sched.patient === user?.id;
                    return (
                      <View
                        key={sched.id || idx}
                        className={`flex-row items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                          isMyOwn ? 'bg-blue-500/20 border-blue-400/30' : 'bg-slate-800/80 border-slate-700/50'
                        }`}
                      >
                        <Text className="text-xs font-semibold text-slate-300">
                          ⏰ {schedTimeDisplay}
                        </Text>
                        <Text className={`text-[10px] font-bold ${isMyOwn ? 'text-blue-300' : 'text-slate-400'}`}>
                          {isMyOwn ? "Your Booking" : "Reserved"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Reason Input */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-200 uppercase tracking-wider">Reason for Consult</Text>
              <Input
                label=""
                placeholder="Describe your medical concerns or symptoms..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            <View className="mt-2">
              <Button
                fullWidth
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!date.trim() || !reason.trim() || bookedSlotsForDate.has(time)}
              >
                {bookedSlotsForDate.has(time) ? "Selected Slot is Booked" : "Confirm & Submit Request"}
              </Button>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchRequests(false)} />}
        >
          {requests.length === 0 && !isLoading ? (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-white/80 text-center font-semibold">No telemedicine requests found.</Text>
              <Text className="text-white/50 text-xs text-center mt-1">Book your first video call in the "Book Call" tab.</Text>
            </View>
          ) : (
            requests.map((req) => {
              const schedDate = req.scheduled_date || req.preferred_date;
              const schedTime = req.scheduled_time || req.preferred_time;
              const schedule = checkMeetingJoinable(schedDate, schedTime);

              return (
                <Card key={req.id} className="p-5 border border-slate-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-sm font-bold text-slate-800 mb-0.5">{schedDate}</Text>
                      <Text className="text-xs font-semibold text-emerald-700">{schedTime}</Text>
                    </View>
                    {renderStatusBadge(req.status)}
                  </View>

                  <Text className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{req.reason}"
                  </Text>

                  {req.status === "Approved" && (
                    <View className="bg-emerald-50 rounded-xl p-4 mt-1 border border-emerald-100">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-emerald-900">
                          {schedule.canJoin ? "🟢 CALL WINDOW ACTIVE" : schedule.status === 'ended' ? "⏹️ CONSULTATION ENDED" : "🔒 SCHEDULED CONSULTATION"}
                        </Text>
                        <View className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          schedule.canJoin ? 'bg-emerald-200 text-emerald-900' : schedule.status === 'ended' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Text className="text-[10px] font-bold">
                            {schedule.canJoin ? 'Live Now' : schedule.status === 'ended' ? 'Concluded' : 'Locked'}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-xs text-emerald-800 mb-1">
                        <Text className="font-bold">Scheduled Time:</Text> {schedDate} at {schedTime}
                      </Text>

                      {!schedule.canJoin && schedule.status === 'upcoming' && (
                        <View className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 my-2">
                          <Text className="text-[11px] font-bold text-amber-900">
                            🔒 Meeting Room Locked
                          </Text>
                          <Text className="text-[11px] text-amber-800 mt-0.5">
                            You can only join when the schedule arrives. Access opens 15 minutes before your time ({schedule.opensAt || schedTime}).
                          </Text>
                        </View>
                      )}

                      {!schedule.canJoin && schedule.status === 'ended' && (
                        <View className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 my-2">
                          <Text className="text-[11px] font-semibold text-slate-700">
                            This appointment's scheduled consultation window has ended.
                          </Text>
                        </View>
                      )}

                      {/* Video Call Join Button */}
                      <Pressable
                        className={`rounded-xl py-3 px-4 mt-2 items-center justify-center shadow-sm ${
                          schedule.canJoin
                            ? "bg-emerald-600 active:bg-emerald-700"
                            : "bg-slate-300"
                        }`}
                        onPress={() => handleOpenExternalBrowser(req.meeting_link, req.id, schedDate, schedTime)}
                      >
                        <Text className={`text-xs font-bold tracking-wider uppercase ${
                          schedule.canJoin ? "text-white" : "text-slate-600"
                        }`}>
                          {schedule.canJoin
                            ? "🎥 Join Video Call (Active Now)"
                            : schedule.status === 'ended'
                            ? "Consultation Ended"
                            : `🔒 Join Video Call (Opens at ${schedule.opensAt || schedTime})`}
                        </Text>
                      </Pressable>

                      {/* In-App WebView Button */}
                      <Pressable
                        className={`rounded-xl py-2.5 px-4 mt-2 items-center justify-center ${
                          schedule.canJoin
                            ? "bg-slate-800 active:bg-slate-700 shadow-2xs"
                            : "bg-slate-100 border border-slate-200"
                        }`}
                        onPress={() => handleJoinMeeting(req.meeting_link, req.id, schedDate, schedTime)}
                      >
                        <Text className={`text-xs font-semibold ${
                          schedule.canJoin ? "text-slate-200" : "text-slate-400"
                        }`}>
                          📱 Join In-App (Modal WebView)
                        </Text>
                      </Pressable>

                      {req.secondary_link && schedule.canJoin ? (
                        <Pressable
                          className="bg-white border border-emerald-200 rounded-xl py-2.5 px-4 mt-2 items-center justify-center shadow-2xs active:bg-emerald-50"
                          onPress={() => Linking.openURL(req.secondary_link)}
                        >
                          <Text className="text-emerald-700 text-xs font-semibold">
                            🌐 Join via Google Meet Backup
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )}

                  {req.status === "Rejected" && (
                    <View className="bg-rose-50 rounded-xl p-4 mt-2 border border-rose-100">
                      <Text className="text-xs font-bold text-rose-800">❌ REQUEST REJECTED</Text>
                      <Text className="text-xs text-rose-700 mt-1">Please contact the clinic for more information or book an in-person appointment.</Text>
                    </View>
                  )}
                </Card>
              );
            })
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
