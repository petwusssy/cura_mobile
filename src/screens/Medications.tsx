import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, Header } from "../components/Shell";
import { MEDICATIONS } from "../data";
import { formatTime12 } from "../utils/philippineTime";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  medications?: any[];
}

type Filter = "all" | "active" | "due-now" | "upcoming" | "taken" | "missed";

const statusConfig = {
  "due-now": { badge: "warning" as const, label: "Due Now",  dot: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
  upcoming:  { badge: "info" as const,    label: "Upcoming", dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  taken:     { badge: "success" as const, label: "Taken",    dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  missed:    { badge: "error" as const,   label: "Missed",   dot: "#F43F5E", bg: "#FFF1F2", icon: "❌" },
};

export function MedicationsScreen({ navigate: _navigate, goBack, medications = [] }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeMeds = medications.length > 0 ? medications : MEDICATIONS;

  const filtered = activeMeds.filter((m) => {
    if (filter === "active")   return m.status === "due-now" || m.status === "upcoming";
    if (filter === "due-now")  return m.status === "due-now";
    if (filter === "upcoming") return m.status === "upcoming";
    if (filter === "taken")    return m.status === "taken";
    if (filter === "missed")   return m.status === "missed";
    return true;
  });

  const statusItems = (["due-now", "upcoming", "taken", "missed"] as const).map((s) => ({
    id: s,
    ...statusConfig[s],
    count: activeMeds.filter((m) => m.status === s).length,
  }));

  const tabCounts = {
    all: activeMeds.length,
    active: activeMeds.filter((m) => m.status === "due-now" || m.status === "upcoming").length,
    taken: activeMeds.filter((m) => m.status === "taken").length,
    missed: activeMeds.filter((m) => m.status === "missed").length,
  };

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Medications" onBack={goBack} />

      {/* Status overview and Filter controls */}
      <View className="px-4 pt-1 pb-3">
        {/* Status metric cards */}
        <View className="flex-row gap-2">
          {statusItems.map((s) => {
            const isSelected = filter === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setFilter(isSelected ? "all" : s.id)}
                className={`flex-1 bg-white rounded-2xl pt-2.5 pb-2 px-1 items-center relative overflow-hidden active:opacity-90 ${
                  isSelected ? "border-2 border-[#0B2136]" : "border border-slate-100"
                }`}
                style={{
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                }}
              >
                <View className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.dot }} />
                <View className="flex-row items-center gap-1 mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                  <Text className="text-[10px] font-bold text-slate-500" numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
                <Text className="text-xl font-black text-[#0B2136] mt-0.5" style={{ fontFamily: "Outfit" }}>
                  {s.count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Filter segmented tabs */}
        <View className="flex-row bg-white/10 rounded-full p-1 border border-white/10 mt-2.5">
          {(["all", "active", "taken", "missed"] as const).map((f) => {
            const isSelected = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`flex-1 py-2 rounded-full items-center justify-center flex-row gap-1.5 ${
                  isSelected ? "bg-white" : "bg-transparent active:bg-white/5"
                }`}
                style={isSelected ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}}
              >
                <Text className={`text-xs font-bold capitalize ${isSelected ? "text-[#0B2136]" : "text-white/80"}`}>
                  {f}
                </Text>
                <View
                  className={`rounded-full px-1.5 py-0.5 items-center justify-center ${
                    isSelected ? "bg-slate-100" : "bg-white/15"
                  }`}
                >
                  <Text
                    className={`font-black ${isSelected ? "text-[#0B2136]" : "text-white"}`}
                    style={{ fontSize: 9 }}
                  >
                    {tabCounts[f]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}>
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
                    <Text className="text-xs text-slate-400">{med.dose}</Text>
                    {med.nextDose && med.status !== "taken" && med.status !== "missed" && (
                      <Text className="text-xs font-semibold mt-0.5" style={{ color: cfg.dot }}>
                        Next: {med.nextDose}
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
                    <View>
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time given</Text>
                      <Text className="text-xs text-slate-600 mt-0.5">{formatTime12(med.timeGiven)}</Text>
                    </View>
                    {med.status === "due-now" && (
                      <LinearGradient
                        colors={['#0994E8', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-xl overflow-hidden"
                      >
                        <Pressable className="w-full py-3 items-center">
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
