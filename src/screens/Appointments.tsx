import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, TextInput, Pressable, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header, Button, Card, Badge } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Screen, AppUser } from "../types";
import { formatTime12 } from "../utils/philippineTime";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

export function AppointmentsScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [visitType, setVisitType] = useState("medical");
  const [time, setTime] = useState("morning");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [activeTab, setActiveTab] = useState<"book" | "history">("book");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id) return;
    if (!background) setIsLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/appointments/`);
      if (res.ok) {
        const data = await res.json();
        const myRequests = data.filter((r: any) => r.patient === user.id);
        setRequests(myRequests);
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
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
          preferred_time: time === "morning" ? "Morning (8AM - 12PM)" : "Afternoon (1PM - 5PM)",
          reason: reason,
          status: "Pending"
        }),
      });

      if (res.ok) {
        setIsPending(true);
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
        <Header title="Appointment" onBack={goBack} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-6">📅</Text>
          <Text className="text-xl font-bold text-white text-center mb-2" style={{ fontFamily: "Outfit" }}>
            Booking Sent
          </Text>
          <Text className="text-sm text-white/80 text-center mb-8 px-4 leading-relaxed">
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
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "book" ? "border-white" : "border-transparent"}`}
          onPress={() => setActiveTab("book")}
        >
          <Text className={`font-bold ${activeTab === "book" ? "text-white" : "text-white/50"}`}>Book Visit</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === "history" ? "border-white" : "border-transparent"}`}
          onPress={() => setActiveTab("history")}
        >
          <Text className={`font-bold ${activeTab === "history" ? "text-white" : "text-white/50"}`}>My Requests</Text>
        </Pressable>
      </View>

      {activeTab === "book" ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          {/* Info Banner */}
          <View
            className="bg-white/10 rounded-[28px] p-4 flex-row items-center gap-3.5 border border-white/10 mb-6"
          >
            <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
              <Text className="text-xl">🏥</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "Outfit" }}>
                In-Person Clinic Visit
              </Text>
              <Text className="text-xs text-white/70 leading-relaxed">
                Schedule an in-person appointment at the clinic. Your request will be reviewed for confirmation.
              </Text>
            </View>
          </View>

          <View className="flex-col gap-6">
            {/* Type of Visit */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">
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
                        backgroundColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.12)",
                        borderColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.18)",
                        borderWidth: isSelected ? 2 : 1,
                        elevation: isSelected ? 3 : 0,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.08 : 0,
                        shadowRadius: 6,
                      }}
                    >
                      {isSelected && (
                        <View className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                      )}
                      <Text className="text-lg mb-1">{item.icon}</Text>
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: isSelected ? "#0B2136" : "#FFFFFF",
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
              <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">
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
                      : "Select appointment date..."}
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
              <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">
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
                        backgroundColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.12)",
                        borderColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.18)",
                        borderWidth: isSelected ? 2 : 1,
                        elevation: isSelected ? 3 : 0,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.1 : 0,
                        shadowRadius: 6,
                      }}
                    >
                      {isSelected && (
                        <View className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                      )}
                      <Text className="text-xl mb-1">{slot.icon}</Text>
                      <Text
                        className="text-sm font-black"
                        style={{
                          color: isSelected ? "#0B2136" : "#FFFFFF",
                          fontFamily: "Outfit",
                        }}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        className="text-[10px] font-semibold mt-0.5"
                        style={{
                          color: isSelected ? "#64748B" : "rgba(255, 255, 255, 0.7)",
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
              <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">
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
                disabled={!date.trim() || !reason.trim()}
              >
                📅 Request Appointment
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
              <Card key={req.id} className="p-5 border border-slate-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-sm font-bold text-slate-800 mb-1">{req.preferred_date}</Text>
                    <Text className="text-xs text-slate-500">{formatTime12(req.preferred_time)}</Text>
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                <Text className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  <Text className="font-bold capitalize">{req.visit_type}:</Text> "{req.reason}"
                </Text>

                {req.status === "Approved" && (
                  <View className="bg-emerald-50 rounded-xl p-4 mt-2 border border-emerald-100">
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
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
