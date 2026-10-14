import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, VitalItem, Header, EmptyState } from "../components/Shell";
import { CONSULTATIONS } from "../data";
import { formatTime12, formatTimeRange12 } from "../utils/philippineTime";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  params?: { id?: string };
  consultations?: any[];
}

export function HealthHistoryScreen({ navigate, goBack, consultations = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"consultations" | "non-consultations">("consultations");

  const consultationList = consultations.filter((c: any) => c.status !== "Non-Consultation");
  const nonConsultationList = consultations.filter((c: any) => c.status === "Non-Consultation");

  const currentList = activeTab === "consultations" ? consultationList : nonConsultationList;

  return (
    <View className="flex-1 bg-transparent">
      <Header
        title="Health History"
        onBack={goBack}
        right={
          <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B2136" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="11" cy="11" r="8"/><Line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </Svg>
          </View>
        }
      />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        {/* Tabs for Consultation / Non-Consultation */}
        <View className="flex-row bg-white/10 rounded-full p-1 mb-5">
          <Pressable
            onPress={() => setActiveTab("consultations")}
            className={`flex-1 py-2.5 rounded-full items-center justify-center flex-row gap-1.5 ${
              activeTab === "consultations" ? "bg-white" : "bg-transparent"
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === "consultations" ? "text-[#0B2136]" : "text-white/80"}`}>
              🩺 Consultation ({consultationList.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("non-consultations")}
            className={`flex-1 py-2.5 rounded-full items-center justify-center flex-row gap-1.5 ${
              activeTab === "non-consultations" ? "bg-white" : "bg-transparent"
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === "non-consultations" ? "text-[#0B2136]" : "text-white/80"}`}>
              🏥 Non-Consultation ({nonConsultationList.length})
            </Text>
          </Pressable>
        </View>

        {/* Summary row */}
        <View className="flex-row gap-2 mb-5 flex-wrap">
          {[
            { label: `${currentList.length} ${activeTab === "consultations" ? "Consultation" : "Non-Consultation"} visits`, icon: activeTab === "consultations" ? "🩺" : "🏥", bg: "#EFF8FF", color: "#0994E8" },
          ].map((chip) => (
            <View
              key={chip.label}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-2 border border-white"
              style={{ backgroundColor: chip.bg, elevation: 1, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
            >
              <Text className="text-xs">{chip.icon}</Text>
              <Text className="text-xs font-bold" style={{ color: chip.color }}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View className="flex-col gap-0 pb-8">
          {currentList.length > 0 ? currentList.map((c, i) => {
            const diff = (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
            const badge = diff < 7 ? { variant: "info" as const, label: "Recent" } : { variant: "neutral" as const, label: "Past" };

            return (
              <View key={c.id} className="flex-row gap-3">
                {/* Timeline */}
                <View className="flex-col items-center w-9">
                  <LinearGradient
                    colors={['#0B2136', '#0B2136']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-9 h-9 rounded-full items-center justify-center z-10 mt-3.5"
                    style={{ borderWidth: 3, borderColor: "#DEF0FF" }}
                  >
                    <Text className="text-white text-xs font-extrabold">{currentList.length - i}</Text>
                  </LinearGradient>
                  {i < currentList.length - 1 && (
                    <View className="w-0.5 bg-sky-200 flex-1 mt-1 min-h-[28px]" />
                  )}
                </View>

                <View className="flex-1 pb-4">
                  <Card onPress={() => navigate("health-detail", { id: c.id })}>
                    <View className="flex-row items-start justify-between gap-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-cura-500 mb-0.5">
                          {new Date(c.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
                        </Text>
                        <Text className="text-sm font-black text-[#0B2136] leading-tight">{c.complaint}</Text>
                      </View>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </View>
                    <View className="flex-row items-center gap-3 flex-wrap mt-1">
                      <Text className="text-xs text-slate-400">⏱ {formatTimeRange12(c.timeIn, c.timeOut, "Ongoing")}</Text>
                      {c.followUp && (
                        <Text className="text-xs text-amber-600 font-medium">
                          📅 Follow-up {c.followUp}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2 mt-3">
                      <View className="w-5 h-5 rounded-full bg-sky-100 items-center justify-center">
                        <Text className="text-xs">{activeTab === "consultations" ? "👩‍⚕️" : "🏥"}</Text>
                      </View>
                      <Text className="text-xs text-slate-500">{c.doctorName || (activeTab === "consultations" ? "Consultation" : "Non-Consultation")}</Text>
                    </View>
                  </Card>
                </View>
              </View>
            );
          }) : (
            <View className="pt-4">
              <EmptyState
                emoji="📋"
                title={activeTab === "consultations" ? "No Consultation History" : "No Non-Consultation History"}
                message={activeTab === "consultations" ? "You haven't had any consultation visits yet." : "You haven't had any non-consultation visits yet."}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Health Detail ─────────────────────────────────────────────────────────────

export function HealthDetailScreen({ navigate: _navigate, goBack, params, consultations = [] }: Props) {
  const consult = consultations.find((c) => c.id === params?.id);

  if (!consult) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Consultation Record" onBack={goBack} />
        <View className="flex-1 justify-center">
          <EmptyState emoji="🔍" title="Not Found" message="The consultation record could not be found." />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Consultation Record" onBack={goBack} />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        <View className="flex-col gap-3 pb-8">
          {/* Hero card */}
          <LinearGradient
            colors={ADMIN_PORTAL_GRADIENT.colors}
            start={ADMIN_PORTAL_GRADIENT.start}
            end={ADMIN_PORTAL_GRADIENT.end}
            className="rounded-2xl p-4"
            style={{ elevation: 8, shadowColor: '#0A2472', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-white/20 rounded-full px-2.5 py-1">
                <Text className="text-white text-[10px] font-bold">#{consult.id.toUpperCase()}</Text>
              </View>
              <Text className="text-white/70 text-xs">
                {new Date(consult.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
              </Text>
            </View>
            <Text className="text-white text-lg font-bold mb-1" style={{ fontFamily: "Outfit" }}>{consult.complaint}</Text>
            <Text className="text-white/70 text-xs mb-4">{consult.doctorName} {consult.assistingNurse ? `· ${consult.assistingNurse}` : ''}</Text>
            <View className="flex-row gap-5">
              {[
                { label: "Time In", val: formatTime12(consult.timeIn) },
                { label: "Time Out", val: formatTime12(consult.timeOut) || "Ongoing" },
                ...(consult.followUp ? [{ label: "Follow-up", val: consult.followUp }] : []),
              ].map((item, i, arr) => (
                <View key={item.label} className={`flex-row gap-4 ${i < arr.length - 1 ? "border-r border-white/20 pr-5" : ""}`}>
                  <View>
                    <Text className="text-white/60 text-[10px] font-medium">{item.label}</Text>
                    <Text className="text-white font-bold text-sm mt-0.5">{item.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Vitals */}
          <Card>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-6 h-6 rounded-lg bg-[#002D72]/10 items-center justify-center">
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </Svg>
              </View>
              <Text className="text-sm font-bold text-slate-700">Vital Signs</Text>
            </View>
            <View className="flex-row flex-wrap justify-between">
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="5" y="2" width="14" height="20" rx="2" />
                      <Line x1="5" y1="7" x2="10" y2="7" />
                      <Line x1="5" y1="12" x2="13" y2="12" />
                      <Line x1="5" y1="17" x2="10" y2="17" />
                    </Svg>
                  }
                  label="Height"
                  value={consult.vitals?.height || "—"}
                />
              </View>
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Circle cx="12" cy="12" r="9" />
                      <Line x1="12" y1="12" x2="15" y2="9" />
                      <Circle cx="12" cy="12" r="1.5" fill="#002D72" />
                    </Svg>
                  }
                  label="Weight"
                  value={consult.vitals?.weight || "—"}
                />
              </View>
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                      <Circle cx="11.5" cy="17" r="1.5" fill="#002D72" />
                    </Svg>
                  }
                  label="Temp"
                  value={consult.vitals?.temp || "—"}
                />
              </View>
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </Svg>
                  }
                  label="BP"
                  value={consult.vitals?.bp || "—"}
                />
              </View>
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="#002D72" stroke="#002D72" strokeWidth="1">
                      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </Svg>
                  }
                  label="Heart Rate"
                  value={consult.vitals?.hr || "—"}
                />
              </View>
              <View style={{ width: '31%', marginBottom: 8 }}>
                <VitalItem
                  icon={
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </Svg>
                  }
                  label="O₂ Sat"
                  value={consult.vitals?.o2 || "—"}
                />
              </View>
            </View>
          </Card>

          {[
            { icon: "📝", title: "Nurse Notes", content: consult.nurseNotes || "—", bg: "#EFF8FF" },
            { icon: "✅", title: "Recommendations", content: consult.recommendations || "—", bg: "#ECFEFF" },
          ].map((section) => (
            <Card key={section.title}>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: section.bg }}>
                  <Text className="text-sm">{section.icon}</Text>
                </View>
                <Text className="text-sm font-bold text-slate-700">{section.title}</Text>
              </View>
              <Text className="text-sm text-slate-600 leading-relaxed">{section.content}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
