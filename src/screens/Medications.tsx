import { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, Header } from "../components/Shell";
import { MEDICATIONS } from "../data";
import { formatTime12, formatManilaDate, getManilaDate, normalizeDate } from "../utils/philippineTime";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  medications?: any[];
  onMarkTaken?: (id: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

type Filter = "all" | "active" | "taken" | "missed";

const statusConfig = {
  "due-now": { badge: "warning" as const, label: "Due Now",  dot: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
  upcoming:  { badge: "info" as const,    label: "Upcoming", dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  taken:     { badge: "success" as const, label: "Taken",    dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  missed:    { badge: "error" as const,   label: "Missed",   dot: "#F43F5E", bg: "#FFF1F2", icon: "❌" },
};

function formatNextDoseDisplay(nextDose?: string | null, date?: string | null) {
  if (!nextDose) return null;
  const timeFormatted = formatTime12(nextDose);
  if (!date) return timeFormatted;
  const today = getManilaDate();
  const normDate = normalizeDate(date);
  if (normDate === today) {
    return `Today at ${timeFormatted}`;
  }
  return `${formatManilaDate(date)} at ${timeFormatted}`;
}

export function MedicationsScreen({ navigate: _navigate, goBack, medications = [], onMarkTaken, onRefresh, refreshing = false }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeMeds = medications.length > 0 ? medications : MEDICATIONS;

  const filtered = activeMeds.filter((m) => {
    if (filter === "active")  return m.status === "due-now" || m.status === "upcoming";
    if (filter === "taken")   return m.status === "taken";
    if (filter === "missed")  return m.status === "missed";
    return true;
  });

  const dueMeds = activeMeds.filter((m) => m.status === "due-now");

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Medications" onBack={goBack} />

      {/* Status overview */}
      <View className="bg-white border-b border-sky-100 px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2.5">
          {(["due-now", "upcoming", "taken", "missed"] as const).map((s) => {
            const count = activeMeds.filter((m) => m.status === s).length;
            const cfg = statusConfig[s];
            return (
              <View
                key={s}
                className="flex-row items-center gap-2 px-4 py-2 rounded-full mr-2.5"
                style={{ backgroundColor: cfg.bg }}
              >
                <Text className="text-sm">{cfg.icon}</Text>
                <Text className="text-xs font-bold text-slate-700">{cfg.label}</Text>
                <View className="rounded-full w-4 h-4 items-center justify-center" style={{ backgroundColor: cfg.dot }}>
                  <Text className="text-white font-extrabold" style={{ fontSize: 9 }}>{count}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3 bg-white border-b border-sky-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {(["all","active","taken","missed"] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full mr-2 ${
                filter === f
                  ? "bg-cura-500"
                  : "bg-sky-50 border border-sky-100"
              }`}
              style={filter === f ? { elevation: 2, shadowColor: '#BAE6FD', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 } : {}}
            >
              <Text className={`text-xs font-bold capitalize ${filter === f ? "text-white" : "text-slate-500"}`}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0994E8"]} tintColor="#0994E8" />
          ) : undefined
        }
      >
        {/* Medicine Reminder Card if any due-now med */}
        {dueMeds.length > 0 && (
          <View className="mb-4">
            {dueMeds.map((dm) => (
              <View
                key={`reminder-${dm.id}`}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3"
                style={{ elevation: 2, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">⏰</Text>
                    <Text className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                      Medicine Reminder • Due Now
                    </Text>
                  </View>
                  <Badge variant="warning">Due Now</Badge>
                </View>

                <View className="mb-2">
                  <Text className="text-base font-black text-slate-900">{dm.name}</Text>
                  <Text className="text-xs font-bold text-amber-700 mt-0.5">
                    Dose: {dm.dose}
                    {dm.nextDose ? ` • Scheduled: ${formatTime12(dm.nextDose)}` : ''}
                  </Text>
                </View>

                <View className="bg-white/90 rounded-xl p-3 border border-amber-100 mb-3">
                  <Text className="text-[10px] font-bold text-amber-900/80 uppercase tracking-wider">
                    Instructions Given
                  </Text>
                  <Text className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
                    {dm.instructions || "Take as instructed by clinic staff."}
                  </Text>
                </View>

                <LinearGradient
                  colors={['#0994E8', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-xl overflow-hidden"
                >
                  <Pressable
                    onPress={() => onMarkTaken && onMarkTaken(dm.id)}
                    className="w-full py-3 items-center active:opacity-85"
                  >
                    <Text className="text-xs font-bold text-white tracking-wide">✓ Mark as Taken</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        <View className="flex-col gap-3 pb-8">
          {filtered.length === 0 && (
            <View className="items-center justify-center py-14 gap-3">
              <Text className="text-4xl">💊</Text>
              <Text className="text-sm font-medium text-slate-400">No medications in this category</Text>
            </View>
          )}

          {filtered.map((med) => {
            const cfg = statusConfig[med.status as keyof typeof statusConfig] || statusConfig["upcoming"];
            const isExpanded = expanded === med.id;

            return (
              <Card key={med.id} onPress={() => setExpanded(isExpanded ? null : med.id)} className="relative overflow-hidden">
                {/* Status accent line */}
                <View className="absolute top-0 left-0 w-1.5 h-full rounded-l-full z-10" style={{ backgroundColor: cfg.dot }} />
                
                <View className="flex-row items-start gap-3 pl-2">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Text className="text-xl">💊</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-2 mb-0.5">
                      <Text className="text-base font-black text-[#0B2136] flex-1" numberOfLines={1}>{med.name}</Text>
                      <Badge variant={cfg.badge}>{cfg.label}</Badge>
                    </View>
                    <Text className="text-xs text-slate-400 font-medium">{med.dose}</Text>
                    {med.nextDose && med.status !== "taken" && med.status !== "missed" && (
                      <Text className="text-xs font-semibold mt-0.5" style={{ color: cfg.dot }}>
                        Next Dose: {formatNextDoseDisplay(med.nextDose, med.date)}
                      </Text>
                    )}
                    {med.status === "taken" && (
                      <Text className="text-xs font-semibold mt-0.5 text-emerald-600">
                        Taken ✅
                      </Text>
                    )}
                  </View>
                  <View className="mt-1" style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}>
                    <Svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <Polyline points="6 9 12 15 18 9"/>
                    </Svg>
                  </View>
                </View>

                {isExpanded && (
                  <View className="mt-3 pt-3 border-t border-sky-100 flex-col gap-3 pl-2">
                    <View>
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions</Text>
                      <Text className="text-xs text-slate-600 leading-relaxed mt-0.5">{med.instructions}</Text>
                    </View>
                    {med.nextDose && (
                      <View>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled next intake</Text>
                        <Text className="text-xs text-slate-600 font-semibold mt-0.5">{formatNextDoseDisplay(med.nextDose, med.date)}</Text>
                      </View>
                    )}
                    <View>
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time given</Text>
                      <Text className="text-xs text-slate-600 mt-0.5">{med.date ? `${formatManilaDate(med.date)} at ` : ''}{formatTime12(med.timeGiven)}</Text>
                    </View>
                    {med.status !== "taken" && (
                      <LinearGradient
                        colors={['#0994E8', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-xl overflow-hidden mt-1"
                      >
                        <Pressable 
                          onPress={() => onMarkTaken && onMarkTaken(med.id)} 
                          className="w-full py-3 items-center active:opacity-85"
                        >
                          <Text className="text-xs font-bold text-white">✓ Mark as Taken</Text>
                        </Pressable>
                      </LinearGradient>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

