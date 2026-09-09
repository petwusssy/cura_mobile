import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, Pressable, RefreshControl, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header, Input, Button, Select, Card, Badge } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import type { Screen, AppUser } from "../types";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function TelemedicineScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

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

  const handleJoinMeeting = async (rawUrl?: string, reqId?: string) => {
    try {
      let roomId = '';
      if (rawUrl) {
        const match = rawUrl.match(/CURA-Telemed-[a-zA-Z0-9_-]+/i);
        if (match) {
          roomId = match[0];
        }
      }
      if (!roomId) {
        const cleanId = (reqId || 'room').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
        roomId = `CURA-Telemed-${cleanId}`;
      }

      const targetUrl = `https://cura-bice.vercel.app/call/${roomId}?role=patient`;
      
      await WebBrowser.openBrowserAsync(targetUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: '#0B2136',
        secondaryToolbarColor: '#0B2136',
        controlsColor: '#FFFFFF',
        showTitle: false,
        enableBarCollapsing: false,
      });
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
      case "Approved": return <Badge variant="success">Approved</Badge>;
      case "Rejected": return <Badge variant="error">Rejected</Badge>;
      case "Completed": return <Badge variant="neutral">Completed</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
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
          <Text className={`font-bold ${activeTab === "book" ? "text-[#0B2136]" : "text-slate-400"}`}>Book Call</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-[#0B2136]" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold ${activeTab === "history" ? "text-[#0B2136]" : "text-slate-400"}`}>My Requests</Text>
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
                      onPress={() => handleJoinMeeting(req.meeting_link, req.id)}
                    >
                      <Text className="text-white text-xs font-bold tracking-wider uppercase">
                        🎥 Join Video Call (In-App)
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
    </View>
  );
}
