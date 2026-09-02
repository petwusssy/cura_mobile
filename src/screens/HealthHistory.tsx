import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, VitalItem, Header, EmptyState } from "../components/Shell";
import { CONSULTATIONS } from "../data";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  params?: { id?: string };
  consultations?: any[];
}

export function HealthHistoryScreen({ navigate, consultations = [] }: Props) {
  return (
    <View className="flex-1" style={{ backgroundColor: "#F0F9FF" }}>
      <Header
        title="Health History"
        right={
          <View className="w-9 h-9 rounded-full bg-sky-100 items-center justify-center">
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0994E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="11" cy="11" r="8"/><Line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </Svg>
          </View>
        }
      />

      <ScrollView className="flex-1 px-4 py-4">
        {/* Summary row */}
        <View className="flex-row gap-2 mb-5 flex-wrap">
          {[
            { label: `${consultations.length} Total visits`, icon: "🩺", bg: "#EFF8FF", color: "#0994E8" },
            { label: "2026 · 3 visits", icon: "📅", bg: "#ECFDF5", color: "#059669" },
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
          {consultations.length > 0 ? consultations.map((c, i) => {
            const diff = (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
            const badge = diff < 7 ? { variant: "info" as const, label: "Recent" } : { variant: "neutral" as const, label: "Past" };

            return (
              <View key={c.id} className="flex-row gap-3">
                {/* Timeline */}
                <View className="flex-col items-center w-9">
                  <LinearGradient
                    colors={['#0994E8', '#06B6D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-9 h-9 rounded-full items-center justify-center z-10 mt-3.5"
                    style={{ borderWidth: 3, borderColor: "#DEF0FF" }}
                  >
                    <Text className="text-white text-xs font-extrabold">{consultations.length - i}</Text>
                  </LinearGradient>
                  {i < consultations.length - 1 && (
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
                        <Text className="text-sm font-bold text-slate-800 leading-tight">{c.complaint}</Text>
                      </View>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </View>
                    <View className="flex-row items-center gap-3 flex-wrap mt-1">
                      <Text className="text-xs text-slate-400">⏱ {c.timeIn} – {c.timeOut || "Ongoing"}</Text>
                      {c.followUp && (
                        <Text className="text-xs text-amber-600 font-medium">
                          📅 Follow-up {c.followUp}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2 mt-3">
                      <View className="w-5 h-5 rounded-full bg-sky-100 items-center justify-center">
                        <Text className="text-xs">👩‍⚕️</Text>
                      </View>
                      <Text className="text-xs text-slate-500">{c.doctorName || "Consultation"}</Text>
                    </View>
                  </Card>
                </View>
              </View>
            );
          }) : (
            <View className="pt-4">
              <EmptyState emoji="📋" title="No Health History" message="You haven't had any clinic visits yet." />
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
      <View className="flex-1" style={{ backgroundColor: "#F0F9FF" }}>
        <Header title="Consultation Record" onBack={goBack} />
        <View className="flex-1 justify-center">
          <EmptyState emoji="🔍" title="Not Found" message="The consultation record could not be found." />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#F0F9FF" }}>
      <Header title="Consultation Record" onBack={goBack} />

      <ScrollView className="flex-1 px-4 py-4">
        <View className="flex-col gap-3 pb-8">
          {/* Hero card */}
          <LinearGradient
            colors={['#0994E8', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-4"
            style={{ elevation: 8, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 }}
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
                { label: "Time In", val: consult.timeIn },
                { label: "Time Out", val: consult.timeOut || "Ongoing" },
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
              <View className="w-6 h-6 rounded-lg bg-sky-100 items-center justify-center">
                <Text className="text-sm">📊</Text>
              </View>
              <Text className="text-sm font-bold text-slate-700">Vital Signs</Text>
            </View>
            <View className="flex-row flex-wrap justify-between">
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="📏" label="Height" value={consult.vitals?.height || "—"} /></View>
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="⚖️" label="Weight" value={consult.vitals?.weight || "—"} /></View>
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="🌡️" label="Temp" value={consult.vitals?.temp || "—"} /></View>
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="💉" label="BP" value={consult.vitals?.bp || "—"} /></View>
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="❤️" label="Heart Rate" value={consult.vitals?.hr || "—"} /></View>
              <View style={{ width: '31%', marginBottom: 8 }}><VitalItem icon="🫁" label="O₂ Sat" value={consult.vitals?.o2 || "—"} /></View>
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
