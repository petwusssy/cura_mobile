import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, Pressable, RefreshControl, Modal, Platform, PermissionsAndroid } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Header, Input, Button, Select, Card, Badge } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import type { Screen, AppUser } from "../types";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function TelemedicineScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);

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

  const handleJoinMeeting = async (rawUrl?: string, reqId?: string) => {
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

  const handleOpenExternalBrowser = async (rawUrl?: string, reqId?: string) => {
    try {
      const roomId = getRoomId(rawUrl, reqId);
      const redirectUrl = Linking.createURL('telemedicine');
      const targetUrl = `https://cura-bice.vercel.app/call/${roomId}?role=patient&redirect_url=${encodeURIComponent(redirectUrl)}`;

      try {
        const res = await WebBrowser.openAuthSessionAsync(targetUrl, redirectUrl);
        if (res.type === 'success' || res.type === 'dismiss') {
          fetchRequests(true);
          return;
        }
      } catch {
        await WebBrowser.openBrowserAsync(targetUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          toolbarColor: '#0B2136',
          secondaryToolbarColor: '#0B2136',
          controlsColor: '#FFFFFF',
          showTitle: false,
          enableBarCollapsing: false,
        });
      }
    } catch (err) {
      console.warn("Could not open in-app call browser:", err);
    }
  };
  // History State
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id) return;
    if (!background) setIsLoading(true);
    try {
      // NOTE: Make sure your backend is deployed with the new Telemedicine endpoints!
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/telemedicine/`);
      if (res.ok) {
        const data = await res.json();
        // Filter for this patient
        const myRequests = data.filter((r: any) => r.patient === user.id);
        setRequests(myRequests);
      }
    } catch (err) {
      console.error("Failed to fetch telemedicine requests", err);
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history") {
      setTimeout(() => fetchRequests(false), 0);
      const interval = setInterval(() => fetchRequests(true), 3000);
      return () => clearInterval(interval);
    }
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
          <Text className="text-xl font-bold text-slate-800 text-center mb-2" style={{ fontFamily: "Outfit" }}>
            Request Sent
          </Text>
          <Text className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">
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
    <View className="flex-1 bg-[#F8FAFC]">
      <Header title="Telemedicine" onBack={goBack} />

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 mt-2">
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "book" ? "border-[#0B2136]" : "border-transparent"}`}
          onPress={() => setActiveTab("book")}
        >
          <Text className={`font-bold text-sm ${activeTab === "book" ? "text-[#0B2136]" : "text-slate-400"}`}>Book Call</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-[#0B2136]" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold text-sm ${activeTab === "history" ? "text-[#0B2136]" : "text-slate-400"}`}>My Requests</Text>
        </Pressable>
      </View>

      {activeTab === "book" ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View className="mb-6">
            <Text className="text-sm text-slate-500 mb-2">
              Request an online video consultation. The clinic will review your request and provide a meeting link if approved.
            </Text>
          </View>

          <View className="flex-col gap-6">
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Date</Text>
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
                  onValueChange={onDateChange}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>

            <Select
              label="Preferred Time"
              value={time}
              onValueChange={setTime}
              options={[
                { label: "Morning (8AM - 12PM)", value: "Morning (8AM - 12PM)" },
                { label: "Afternoon (1PM - 5PM)", value: "Afternoon (1PM - 5PM)" },
              ]}
            />

            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Consult</Text>
              <Input
                label=""
                placeholder="Describe what you are feeling..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>

            <View className="mt-8">
              <Button
                fullWidth
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!date.trim() || !reason.trim()}
              >
                Submit Request
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
              <Text className="text-slate-500 text-center">No telemedicine requests found.</Text>
            </View>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="p-5 border border-slate-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-sm font-bold text-slate-800 mb-1">{req.preferred_date}</Text>
                    <Text className="text-xs text-slate-500">{req.preferred_time}</Text>
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                <Text className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  "{req.reason}"
                </Text>

                {req.status === "Approved" && (
                  <View className="bg-emerald-50 rounded-xl p-4 mt-2 border border-emerald-100">
                    <Text className="text-xs font-bold text-emerald-800 mb-2">✅ CONSULTATION APPROVED</Text>
                    <Text className="text-xs text-emerald-700 mb-1">
                      <Text className="font-bold">Scheduled:</Text> {req.scheduled_date || req.preferred_date} at {req.scheduled_time || req.preferred_time}
                    </Text>
                    <Pressable
                      className="bg-emerald-600 active:bg-emerald-700 rounded-xl py-3 px-4 mt-3 items-center justify-center shadow-sm"
                      onPress={() => handleOpenExternalBrowser(req.meeting_link, req.id)}
                    >
                      <Text className="text-white text-xs font-bold tracking-wider uppercase">
                        🎥 Join Video Call (Recommended)
                      </Text>
                    </Pressable>

                    <Pressable
                      className="bg-slate-800 active:bg-slate-700 rounded-xl py-2.5 px-4 mt-2 items-center justify-center shadow-2xs"
                      onPress={() => handleJoinMeeting(req.meeting_link, req.id)}
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
                  </View>
                )}

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
                <Text className="text-white text-xs font-bold uppercase tracking-wider">✕ Exit</Text>
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
