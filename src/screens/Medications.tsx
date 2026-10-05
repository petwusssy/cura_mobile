import { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Polyline } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, Header } from "../components/Shell";
import { MEDICATIONS } from "../data";
import { formatTime12 } from "../utils/philippineTime";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  medications?: any[];
  onIntake?: (id: string) => void;
}

type Filter = "all" | "to-intake" | "intaked";

const statusConfig: Record<string, { badge: "success" | "warning" | "error" | "info" | "neutral"; label: string; dot: string; bg: string; icon: string }> = {
  "next-intake": { badge: "info",    label: "Next Intake", dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "to-intake":   { badge: "info",    label: "Next Intake", dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "intaked":     { badge: "success", label: "Intaked",     dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  "due-now":     { badge: "warning", label: "Due Now",     dot: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
  "upcoming":    { badge: "info",    label: "Next Intake", dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "taken":       { badge: "success", label: "Intaked",     dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  "missed":      { badge: "error",   label: "Missed",      dot: "#F43F5E", bg: "#FFF1F2", icon: "❌" },
};

export function MedicationsScreen({ navigate: _navigate, goBack, medications = [], onIntake }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localIntakedIds, setLocalIntakedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    AsyncStorage.getItem('@cura_intaked_meds')
      .then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              setLocalIntakedIds(new Set(parsed));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleIntake = useCallback((id: string) => {
    setLocalIntakedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem('@cura_intaked_meds', JSON.stringify([...next])).catch(() => {});
      return next;
    });
    onIntake?.(id);
  }, [onIntake]);

  // Normalize incoming list and sync with intaked state
  const normalizedMeds = useMemo(() => {
    const rawList = medications.length > 0 ? medications : MEDICATIONS;
    return rawList.map((m) => {
      const isMarkedIntaked = localIntakedIds.has(m.id);
      const isBackendIntaked = (m.rawRemarks && m.rawRemarks.includes('[INTAKED]')) || (m.instructions && m.instructions.includes('[INTAKED]'));
      const isAlreadyIntaked = m.status === "intaked" || m.status === "taken" || isBackendIntaked;
      const status = (isMarkedIntaked || isAlreadyIntaked) ? "intaked" : "next-intake";
      const cleanInstructions = (m.instructions || '').replace('[INTAKED]', '').trim();
      return {
        ...m,
        instructions: cleanInstructions || (m.instructions === '' ? '' : m.instructions),
        status,
      };
    });
  }, [medications, localIntakedIds]);

  const toTakeList = useMemo(() => {
    return normalizedMeds.filter((m) => m.status !== "intaked");
  }, [normalizedMeds]);

  const intakedList = useMemo(() => {
    return normalizedMeds.filter((m) => m.status === "intaked");
  }, [normalizedMeds]);

  const statusItems = [
    { id: "to-intake" as const, label: "To Intake", count: toTakeList.length, dot: "#0994E8" },
    { id: "intaked" as const,   label: "Intaked",   count: intakedList.length, dot: "#10B981" },
    { id: "all" as const,       label: "Total Meds", count: normalizedMeds.length, dot: "#0B2136" },
  ];

  const tabCounts = {
    all: normalizedMeds.length,
    "to-intake": toTakeList.length,
    intaked: intakedList.length,
  };

  const renderMedCard = (med: any, isToIntakeSection: boolean) => {
    const cfg = statusConfig[med.status] || (isToIntakeSection ? statusConfig["next-intake"] : statusConfig["intaked"]);
    const isExpanded = expanded === med.id;

    return (
      <Card key={med.id} onPress={() => setExpanded(isExpanded ? null : med.id)} className="relative overflow-hidden mb-3">
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
            {med.nextDose && med.status !== "intaked" && med.status !== "taken" && (
              <Text className="text-xs font-semibold mt-0.5" style={{ color: cfg.dot }}>
                Next: {formatTime12(med.nextDose)}
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
          <View className="mt-3 pt-3 border-t border-sky-100 flex-col gap-2.5 pl-2">
            {med.instructions ? (
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions / Remarks</Text>
                <Text className="text-xs text-slate-600 leading-relaxed mt-0.5">{med.instructions}</Text>
              </View>
            ) : null}
            {med.timeGiven ? (
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Given</Text>
                <Text className="text-xs text-slate-600 mt-0.5">{formatTime12(med.timeGiven)}</Text>
              </View>
            ) : null}
            {med.nextDose ? (
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Intake</Text>
                <Text className="text-xs font-bold text-[#0994E8] mt-0.5">{formatTime12(med.nextDose)}</Text>
              </View>
            ) : null}
            {!isToIntakeSection && (
              <View className="mt-1 bg-emerald-50 border border-emerald-200/60 rounded-xl py-2 px-3 items-center">
                <Text className="text-xs font-bold text-emerald-700">✓ Completed / Intaked</Text>
              </View>
            )}
          </View>
        )}

        {/* Intake button for To Intake section */}
        {isToIntakeSection && (
          <View className="mt-3 pt-2.5 border-t border-slate-100 pl-2">
            <Pressable
              onPress={() => handleIntake(med.id)}
              className="w-full bg-emerald-600 active:bg-emerald-700 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 shadow-sm"
              style={{
                elevation: 2,
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <Text className="text-xs font-bold text-white tracking-wide">✓ Intake</Text>
            </Pressable>
          </View>
        )}
      </Card>
    );
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
          {(["all", "to-intake", "intaked"] as const).map((f) => {
            const isSelected = filter === f;
            const tabLabel = f === "all" ? "All" : f === "to-intake" ? "To Intake" : "Intaked";
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
                <Text className={`text-xs font-bold ${isSelected ? "text-[#0B2136]" : "text-white/80"}`}>
                  {tabLabel}
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
        {/* Section 1: TO INTAKE */}
        {(filter === "all" || filter === "to-intake") && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-black text-white" style={{ fontFamily: "Outfit" }}>
                  To Intake
                </Text>
                <View className="bg-sky-500/25 border border-sky-400/40 rounded-full px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-sky-200">{toTakeList.length}</Text>
                </View>
              </View>
              <Text className="text-xs text-white/50">Pending medications</Text>
            </View>

            {toTakeList.length === 0 ? (
              <View className="bg-white/10 rounded-2xl p-5 items-center justify-center border border-white/10 mb-2">
                <Text className="text-2xl mb-1">🎉</Text>
                <Text className="text-sm font-bold text-white">No medications to intake</Text>
                <Text className="text-xs text-white/60 text-center mt-0.5">All scheduled medication intakes are completed.</Text>
              </View>
            ) : (
              toTakeList.map((med) => renderMedCard(med, true))
            )}
          </View>
        )}

        {/* Section 2: INTAKED */}
        {(filter === "all" || filter === "intaked") && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 mt-3 px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-black text-white" style={{ fontFamily: "Outfit" }}>
                  Intaked
                </Text>
                <View className="bg-emerald-500/25 border border-emerald-400/40 rounded-full px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-emerald-200">{intakedList.length}</Text>
                </View>
              </View>
              <Text className="text-xs text-white/50">Completed</Text>
            </View>

            {intakedList.length === 0 ? (
              <View className="bg-white/10 rounded-2xl p-5 items-center justify-center border border-white/10">
                <Text className="text-2xl mb-1">💊</Text>
                <Text className="text-sm font-bold text-white">No intaked medications yet</Text>
                <Text className="text-xs text-white/60 text-center mt-0.5">Medications you mark as intaked will appear here.</Text>
              </View>
            ) : (
              intakedList.map((med) => renderMedCard(med, false))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
