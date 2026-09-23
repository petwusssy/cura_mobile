import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header, Input, Button, Select, Card, Badge } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Screen, AppUser } from "../types";

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
      const res = await fetch(`http://127.0.0.1:8000/api/appointments/`);
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
      const res = await fetch(`http://127.0.0.1:8000/api/appointments/`, {
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

        <View className="mb-6">
          <Text className="text-sm text-white/80 mb-2">
            Schedule an in-person visit at our clinic by filling out the details below.
          </Text>
        </View>

        <View className="flex-col gap-6">
          <Select
            label="Type of Visit"
            value={visitType}
            onValueChange={setVisitType}
            options={[
              { label: "Medical", value: "medical" },
              { label: "Dental", value: "dental" },
              { label: "Clearance", value: "clearance" },
            ]}
          />

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
              { label: "Morning (8AM - 12PM)", value: "morning" },
              { label: "Afternoon (1PM - 5PM)", value: "afternoon" },
            ]}
          />

          <View className="flex-col gap-1.5">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Visit</Text>
            <Input
              label=""
              placeholder="Briefly describe why you are visiting..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View className="mt-8">
            <Button
              fullWidth
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!date.trim() || !reason.trim()}
            >
              Request Appointment
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
                    <Text className="text-xs text-slate-500">{req.preferred_time}</Text>
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
                      <Text className="font-bold">Scheduled:</Text> {req.scheduled_date || req.preferred_date} at {req.scheduled_time || req.preferred_time}
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
