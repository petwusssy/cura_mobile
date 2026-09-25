import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Text, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header, Input, Button, Select, Card, Badge, EmptyState } from "../components/Shell";
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Screen, AppUser } from "../types";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user?: Partial<AppUser>;
}

const PURPOSES = [
  { label: "Class Absence", value: "Excuse from Class / School Absence" },
  { label: "Fit to Return", value: "Fit to Return to School / Work" },
  { label: "P.E. Exemption", value: "Physical Education (P.E.) Exemption" },
  { label: "OJT / Internship", value: "OJT / Internship Requirement" },
  { label: "Activity Clearance", value: "Travel / School Activity Clearance" },
  { label: "Other", value: "Other Medical Purpose" },
];

export function RequestMedCertScreen({ navigate, goBack, user }: Props) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"request" | "history">("request");
  const [purpose, setPurpose] = useState("Excuse from Class / School Absence");
  const [complaint, setComplaint] = useState("");
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }));
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchRequests = useCallback(async (background = false) => {
    if (!user?.id) return;
    if (!background) setIsLoadingHistory(true);
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/medcert-requests/`);
      if (res.ok) {
        const data = await res.json();
        const myRequests = data.filter((r: any) => r.patient === user.id);
        setRequests(myRequests);
      }
    } catch (err) {
      console.error("Failed to fetch medcert requests:", err);
    } finally {
      if (!background) setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRequests(false);
      const interval = setInterval(() => fetchRequests(true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchRequests]);

  const onStartDateChange = (_: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }
  };

  const onEndDateChange = (_: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setEndDate(`${year}-${month}-${day}`);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setErrorMessage("Patient profile not found. Please re-login.");
      return;
    }
    if (!complaint.trim()) {
      setErrorMessage("Please describe your medical reason or symptoms.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/medcert-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: user.id,
          purpose: purpose,
          complaint: complaint.trim(),
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          remarks: remarks.trim() || undefined,
          status: "Pending",
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setComplaint("");
        setRemarks("");
        fetchRequests(true);
      } else {
        const errText = await res.text().catch(() => "");
        setErrorMessage("Failed to submit request. Please try again.");
        console.error("Submit request error:", errText);
      }
    } catch (err) {
      console.error("Error submitting medcert request:", err);
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Request Certificate" onBack={goBack} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
            <Text className="text-4xl">📄</Text>
          </View>
          <Text className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: "Outfit" }}>
            Request Submitted!
          </Text>
          <Text className="text-sm text-white/80 text-center mb-8 max-w-[280px]">
            Your medical certificate request has been sent to the University Clinic for review and approval.
          </Text>
          <View className="w-full gap-3">
            <Button
              variant="white"
              fullWidth
              onPress={() => {
                setIsSuccess(false);
                setActiveTab("history");
              }}
            >
              View My Requests
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onPress={goBack}
            >
              Done
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Medical Certificate" onBack={goBack} />

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 gap-3">
        <Pressable
          onPress={() => setActiveTab("request")}
          className={`flex-1 py-3 items-center rounded-2xl ${
            activeTab === "request" ? "bg-white" : "bg-white/20"
          }`}
          style={activeTab === "request" ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } : {}}
        >
          <Text className={`text-xs font-bold ${activeTab === "request" ? "text-cura-900" : "text-white"}`}>
            New Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("history")}
          className={`flex-1 py-3 items-center rounded-2xl flex-row justify-center gap-1.5 ${
            activeTab === "history" ? "bg-white" : "bg-white/20"
          }`}
          style={activeTab === "history" ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } : {}}
        >
          <Text className={`text-xs font-bold ${activeTab === "history" ? "text-cura-900" : "text-white"}`}>
            My Requests
          </Text>
          {requests.filter(r => r.status === 'Pending').length > 0 && (
            <View className="bg-amber-400 rounded-full px-1.5 py-0.2">
              <Text className="text-[10px] font-bold text-slate-900">
                {requests.filter(r => r.status === 'Pending').length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "request" ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 24) + 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage ? (
            <View className="bg-rose-500/20 border border-rose-400/40 rounded-2xl p-4">
              <Text className="text-white text-xs font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Purpose selection */}
          <Select
            label="Purpose of Certificate"
            value={purpose}
            options={PURPOSES}
            onValueChange={setPurpose}
          />

          {/* Medical Complaint */}
          <Input
            label="Reason / Symptoms / Diagnosis"
            placeholder="e.g., High fever, persistent cough, and body weakness for 2 days"
            value={complaint}
            onChangeText={setComplaint}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 14 }}
          />

          {/* Start Date */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">Date of Illness / Start Date</Text>
            <Pressable
              onPress={() => setShowStartDatePicker(true)}
              className="w-full bg-white rounded-[32px] px-5 py-4 flex-row items-center justify-between"
            >
              <Text className={`text-sm ${startDate ? "text-slate-800 font-bold" : "text-slate-400"}`}>
                {startDate || "Select start date..."}
              </Text>
              <Text>📅</Text>
            </Pressable>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate ? new Date(startDate) : new Date()}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}

          {/* End Date (Optional) */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">End / Recovery Date (Optional)</Text>
            <Pressable
              onPress={() => setShowEndDatePicker(true)}
              className="w-full bg-white rounded-[32px] px-5 py-4 flex-row items-center justify-between"
            >
              <Text className={`text-sm ${endDate ? "text-slate-800 font-bold" : "text-slate-400"}`}>
                {endDate || "Select end date (if applicable)..."}
              </Text>
              <Text>📅</Text>
            </Pressable>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}

          {/* Additional Notes */}
          <Input
            label="Additional Notes (Optional)"
            placeholder="Any additional details or instructions..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={2}
            style={{ height: 60, textAlignVertical: "top", paddingTop: 12 }}
          />

          <View className="mt-2">
            <Button
              variant="white"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
            >
              Submit Certificate Request
            </Button>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 24) + 24, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingHistory}
              onRefresh={() => fetchRequests(false)}
              tintColor="#ffffff"
            />
          }
        >
          {requests.length === 0 ? (
            <EmptyState
              emoji="📋"
              title="No Requests Yet"
              message="You haven't submitted any medical certificate requests yet."
            />
          ) : (
            requests.map((req) => {
              const statusCfg = {
                Pending: { variant: "warning" as const, label: "Under Review" },
                Approved: { variant: "success" as const, label: "Approved & Issued" },
                Rejected: { variant: "error" as const, label: "Declined" },
              }[req.status as 'Pending' | 'Approved' | 'Rejected'] || { variant: "neutral" as const, label: req.status };

              return (
                <Card key={req.id} className="relative">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
                        {req.purpose}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {req.start_date ? `Date: ${req.start_date}${req.end_date ? ` to ${req.end_date}` : ''}` : `Requested on ${new Date(req.created_at).toLocaleDateString()}`}
                      </Text>
                    </View>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </View>

                  <View className="bg-slate-50 rounded-2xl p-3 mb-2">
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Symptoms / Reason:
                    </Text>
                    <Text className="text-xs text-slate-700 font-medium">
                      {req.complaint}
                    </Text>
                  </View>

                  {req.status === 'Approved' && (
                    <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex-row items-center justify-between mt-1">
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-emerald-800">Certificate is Ready!</Text>
                        <Text className="text-[11px] text-emerald-600">Available in your Documents tab.</Text>
                      </View>
                      <Pressable
                        onPress={() => navigate("documents", { tab: "certificates" })}
                        className="bg-emerald-600 px-3 py-1.5 rounded-full"
                      >
                        <Text className="text-white text-xs font-bold">View</Text>
                      </Pressable>
                    </View>
                  )}

                  {req.status === 'Rejected' && req.remarks && (
                    <View className="bg-rose-50 border border-rose-100 rounded-2xl p-3 mt-1">
                      <Text className="text-[11px] font-bold text-rose-700 uppercase">Clinic Remarks:</Text>
                      <Text className="text-xs text-rose-600 mt-0.5">{req.remarks}</Text>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
