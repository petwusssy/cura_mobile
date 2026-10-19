import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Polyline, Path, Line, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";
import type { Screen } from "../types";
import { Badge, Header } from "../components/Shell";
import { MEDICATIONS } from "../data";
import { formatTime12 } from "../utils/philippineTime";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  medications?: any[];
  onIntake?: (id: string) => void;
}

type Filter = "all" | "to-intake" | "intaked";

function parseNextDoseTime(nextDoseStr?: string | null): Date | null {
  if (!nextDoseStr) return null;
  const str = String(nextDoseStr).trim();
  if (!str) return null;

  const dateMatch = str.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (dateMatch) {
    const [_, datePart, hh, mm, ss] = dateMatch;
    const [y, m, d] = datePart.split("-").map(Number);
    return new Date(y, m - 1, d, parseInt(hh, 10), parseInt(mm, 10), ss ? parseInt(ss, 10) : 0);
  }

  const time24Match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (time24Match) {
    const now = new Date();
    const hh = parseInt(time24Match[1], 10);
    const mm = parseInt(time24Match[2], 10);
    const ss = time24Match[3] ? parseInt(time24Match[3], 10) : 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, ss);
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function MedicinePillIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Defs>
        <SvgLinearGradient id="medPillCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#00A3FF" />
        </SvgLinearGradient>
        <SvgLinearGradient id="medPillBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0056B3" />
          <Stop offset="100%" stopColor="#002D72" />
        </SvgLinearGradient>
      </Defs>
      <G transform="rotate(-45 20 20)">
        <Path d="M14 11a6 6 0 0 1 12 0v8H14v-8z" fill="url(#medPillCyan)" />
        <Path d="M14 19h12v8a6 6 0 0 1-12 0v-8z" fill="url(#medPillBlue)" />
        <Line x1="14" y1="19" x2="26" y2="19" stroke="#FFFFFF" strokeWidth="1.5" />
        <Rect x="16" y="11" width="2" height="6" rx="1" fill="#FFFFFF" opacity="0.7" />
      </G>
    </Svg>
  );
}

const statusConfig: Record<string, { badge: "success" | "warning" | "error" | "info" | "neutral"; label: string; dot: string; bg: string; icon: string }> = {
  "next-intake": { badge: "info",    label: "To Take",     dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "to-intake":   { badge: "info",    label: "To Take",     dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "intaked":     { badge: "success", label: "Taken",       dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  "due-now":     { badge: "warning", label: "Due Now",     dot: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
  "upcoming":    { badge: "info",    label: "To Take",     dot: "#0994E8", bg: "#EFF8FF", icon: "⏰" },
  "taken":       { badge: "success", label: "Taken",       dot: "#10B981", bg: "#ECFDF5", icon: "✅" },
  "missed":      { badge: "error",   label: "Missed",      dot: "#F43F5E", bg: "#FFF1F2", icon: "❌" },
};

export function MedicationsScreen({ navigate: _navigate, goBack, medications = [], onIntake }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localIntakedIds, setLocalIntakedIds] = useState<Set<string>>(() => new Set());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const notifiedMedsRef = useRef<Set<string>>(new Set());
  const notifiedUpcomingMedsRef = useRef<Set<string>>(new Set());

  // 1-second interval for real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Normalize incoming list and sync with intaked state
  const normalizedMeds = useMemo(() => {
    const rawList = medications.length > 0 ? medications : MEDICATIONS;
    return rawList.map((m) => {
      const isServerIntaked = Boolean(
        (m.rawRemarks && m.rawRemarks.includes('[INTAKED]')) ||
        (m.instructions && m.instructions.includes('[INTAKED]'))
      );
      const hasNextDose = Boolean(
        m.nextDose &&
        String(m.nextDose).trim() &&
        String(m.nextDose).toLowerCase() !== "none" &&
        String(m.nextDose).toLowerCase() !== "null"
      );
      const isMarkedIntaked = localIntakedIds.has(m.id) || (m.treatmentId && localIntakedIds.has(m.treatmentId)) || isServerIntaked || !hasNextDose;
      const isAlreadyIntaked = m.status === "intaked" || m.status === "taken";
      const status = (isMarkedIntaked || isAlreadyIntaked) ? "intaked" : "next-intake";
      return {
        ...m,
        status,
      };
    });
  }, [medications, localIntakedIds]);

  const handleIntake = useCallback((id: string) => {
    setLocalIntakedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem('@cura_intaked_meds', JSON.stringify([...next])).catch(() => {});
      return next;
    });
    onIntake?.(id);

    // Patch directly to server so it never reverts across devices
    const targetMed = normalizedMeds.find((m) => m.id === id);
    const uuidMatch = (targetMed?.treatmentId || id).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const resolvedTreatmentId = uuidMatch ? uuidMatch[0] : null;

    if (resolvedTreatmentId) {
      const currentRemarks = targetMed?.rawRemarks || targetMed?.instructions || "";
      const cleanRemarks = currentRemarks.replace(/\[INTAKED\]/g, "").trim();
      const updatedRemarks = cleanRemarks ? `${cleanRemarks} [INTAKED]` : "[INTAKED]";

      fetch(`https://cura-backend-dtfj.onrender.com/api/treatments/${resolvedTreatmentId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: updatedRemarks }),
      }).catch(() => {});
    }
  }, [normalizedMeds, onIntake]);

  const toTakeList = useMemo(() => {
    return normalizedMeds.filter((m) => m.status !== "intaked");
  }, [normalizedMeds]);

  const intakedList = useMemo(() => {
    return normalizedMeds.filter((m) => m.status === "intaked");
  }, [normalizedMeds]);

  // Notify user when a pending medication is upcoming (<= 30 mins) or due (<= 0s)
  useEffect(() => {
    toTakeList.forEach((med) => {
      if (!med.nextDose) return;
      const target = parseNextDoseTime(med.nextDose);
      if (!target) return;
      const diffSec = Math.floor((target.getTime() - currentTime) / 1000);

      // Approaching reminder (within 30 mins)
      if (diffSec > 0 && diffSec <= 1800 && !notifiedUpcomingMedsRef.current.has(med.id)) {
        notifiedUpcomingMedsRef.current.add(med.id);
        const minsLeft = Math.max(1, Math.ceil(diffSec / 60));
        Alert.alert(
          "Paalala sa Gamot ⏰",
          `Malapit na ang oras ng iyong gamot (${minsLeft} minuto na lang): ${med.name} (${med.dose}). Ihanda na ang iyong gamot at tubig.`
        );
      }

      // Due now reminder
      if (diffSec <= 0 && !notifiedMedsRef.current.has(med.id)) {
        notifiedMedsRef.current.add(med.id);
        Alert.alert(
          "Oras na Para Uminom! ⏰",
          `Oras na para inumin ang iyong gamot: ${med.name} (${med.dose}). Mangyaring i-click ang 'Taken' pagkatapos inumin.`
        );
      }
    });
  }, [toTakeList, currentTime]);

  const statusItems = [
    { id: "to-intake" as const, label: "To Take", count: toTakeList.length, dot: "#0994E8" },
    { id: "intaked" as const,   label: "Taken",   count: intakedList.length, dot: "#10B981" },
    { id: "all" as const,       label: "Total Meds", count: normalizedMeds.length, dot: "#0B2136" },
  ];

  const renderMedCard = (med: any, isToIntakeSection: boolean) => {
    const targetDate = med.nextDose ? parseNextDoseTime(med.nextDose) : null;
    const diffSec = targetDate ? Math.floor((targetDate.getTime() - currentTime) / 1000) : null;
    const isDue = diffSec !== null && diffSec <= 0;

    let timeRemainingText = "";
    if (diffSec !== null) {
      if (diffSec > 0) {
        const hrs = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        if (hrs > 0) {
          timeRemainingText = `${hrs}h ${mins}m ${secs}s`;
        } else {
          timeRemainingText = `${mins}m ${secs}s`;
        }
      } else {
        timeRemainingText = "Due Now";
      }
    }

    const cfg = isDue && isToIntakeSection
      ? statusConfig["due-now"]
      : (statusConfig[med.status] || (isToIntakeSection ? statusConfig["next-intake"] : statusConfig["intaked"]));
    const isExpanded = expanded === med.id;

    return (
      <View
        key={med.id}
        className="rounded-[24px] overflow-hidden mb-3 bg-white border border-sky-100/70"
        style={{
          shadowColor: isDue && isToIntakeSection ? "#D97706" : "#0A2472",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDue && isToIntakeSection ? 0.16 : 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Top Header Section: Blue Gradient */}
        <Pressable
          onPress={() => setExpanded(isExpanded ? null : med.id)}
          className="relative overflow-hidden p-4 active:opacity-95"
          style={{
            borderBottomWidth: (isExpanded || isToIntakeSection) ? 1 : 0,
            borderBottomColor: "rgba(255, 255, 255, 0.25)",
          }}
        >
          <LinearGradient
            colors={ADMIN_PORTAL_GRADIENT.colors}
            start={ADMIN_PORTAL_GRADIENT.start}
            end={ADMIN_PORTAL_GRADIENT.end}
            style={StyleSheet.absoluteFill}
          />
          <View className="flex-row items-start gap-3">
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-white/20 border border-white/30">
              <MedicinePillIcon size={26} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between gap-2 mb-0.5">
                <Text
                  className="text-base font-black text-white flex-1"
                  numberOfLines={1}
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {med.name}
                </Text>
                <Badge variant={cfg.badge}>
                  {isDue && isToIntakeSection
                    ? "⚠️ Due Now"
                    : isToIntakeSection && diffSec !== null && diffSec > 0
                    ? `⏳ In ${timeRemainingText}`
                    : cfg.label}
                </Badge>
              </View>
              <Text className="text-xs font-semibold text-white/80">{med.dose}</Text>
              {med.nextDose && med.status !== "intaked" && med.status !== "taken" && (
                <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                  <Text className="text-xs font-bold text-sky-200">
                    Next: {formatTime12(med.nextDose)}
                  </Text>
                  {isDue ? (
                    <View className="bg-amber-400 px-1.5 py-0.5 rounded-md">
                      <Text className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                        DUE TO TAKE
                      </Text>
                    </View>
                  ) : timeRemainingText ? (
                    <View className="bg-white/20 px-1.5 py-0.5 rounded-md">
                      <Text className="text-[10px] font-black text-white">
                        ⏳ {timeRemainingText} left
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
            <View className="mt-1" style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}>
              <Svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <Polyline points="6 9 12 15 18 9"/>
              </Svg>
            </View>
          </View>
        </Pressable>

        {/* Timer & Due Status Section for To Intake */}
        {isToIntakeSection && (
          <View className="px-4 pt-3">
            {isDue ? (
              <View className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <Text className="text-lg">⚠️</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-amber-900" style={{ fontFamily: "Outfit" }}>
                      Time to take your medication!
                    </Text>
                    <Text className="text-[10px] text-amber-700 font-medium">
                      Scheduled time: {formatTime12(med.nextDose)}
                    </Text>
                  </View>
                </View>
                <View className="bg-amber-500 px-2.5 py-1 rounded-xl">
                  <Text className="text-[10px] font-black text-white">DUE</Text>
                </View>
              </View>
            ) : timeRemainingText ? (
              <View className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base">⏳</Text>
                  <View>
                    <Text className="text-xs font-bold text-[#002D72]" style={{ fontFamily: "Outfit" }}>
                      Oras bago itake ang gamot:
                    </Text>
                    <Text className="text-[10px] text-slate-500 font-medium">
                      Schedule: {formatTime12(med.nextDose)}
                    </Text>
                  </View>
                </View>
                <View className="bg-white border border-sky-300 px-2.5 py-1 rounded-xl shadow-xs">
                  <Text className="text-xs font-black text-[#002D72]" style={{ fontFamily: "Outfit" }}>
                    {timeRemainingText}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Bottom Section: White background */}
        {isExpanded && (
          <View className="bg-white p-4 pt-3 flex-col gap-2.5">
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
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Dose</Text>
                <Text className="text-xs font-bold text-[#0994E8] mt-0.5">{formatTime12(med.nextDose)}</Text>
              </View>
            ) : null}
            {!isToIntakeSection && (
              <View
                className="mt-1 rounded-xl py-2 px-3 items-center border"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.16)",
                  borderColor: "rgba(16, 185, 129, 0.38)",
                }}
              >
                <Text className="text-xs font-bold" style={{ color: "#047857" }}>✓ Completed / Taken</Text>
              </View>
            )}
          </View>
        )}

        {/* Intake button for To Intake section */}
        {isToIntakeSection && (
          <View className={`bg-white px-4 pb-4 ${isExpanded ? "pt-2" : "pt-3"}`}>
            <Pressable
              onPress={() => handleIntake(med.id)}
              className="w-full py-3 rounded-xl flex-row items-center justify-center gap-1.5 border active:opacity-80"
              style={{
                backgroundColor: isDue ? "rgba(245, 158, 11, 0.16)" : "rgba(16, 185, 129, 0.16)",
                borderColor: isDue ? "rgba(245, 158, 11, 0.38)" : "rgba(16, 185, 129, 0.38)",
                shadowColor: isDue ? "#D97706" : "#059669",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text
                className="text-xs font-bold tracking-wide"
                style={{
                  color: isDue ? "#B45309" : "#047857",
                }}
              >
                {isDue ? "✓ Take Now (Due)" : "✓ Taken"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-transparent">
      <Header title="Medications" onBack={goBack} />

      {/* Status overview and Filter controls */}
      <View className="px-4 pt-1 pb-3">
        {/* Status metric cards */}
        <View className="flex-row gap-2.5">
          {statusItems.map((s) => {
            const isSelected = filter === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setFilter(isSelected ? "all" : s.id)}
                className="flex-1 rounded-[22px] py-3.5 px-1 items-center justify-center relative overflow-hidden active:opacity-90"
                style={{
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? "#FFFFFF" : undefined,
                  borderTopColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.45)",
                  borderLeftColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)",
                  borderRightColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.2)",
                  borderBottomColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.15)",
                  shadowColor: "#0A2472",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={ADMIN_PORTAL_GRADIENT.colors}
                  start={ADMIN_PORTAL_GRADIENT.start}
                  end={ADMIN_PORTAL_GRADIENT.end}
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  className="text-[24px] font-black text-white leading-none"
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.35)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {s.count}
                </Text>
                <Text
                  className="text-[11px] font-bold text-white mt-1.5 tracking-tight text-center"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}>
        {/* Section 1: TO TAKE */}
        {(filter === "all" || filter === "to-intake") && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-black" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  To Take
                </Text>
                <View className="bg-sky-500/25 border border-sky-400/40 rounded-full px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-sky-200">{toTakeList.length}</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500 font-medium" style={{ fontFamily: "Outfit" }}>Pending medications</Text>
            </View>

            {toTakeList.length === 0 ? (
              <View className="bg-white/80 rounded-2xl p-5 items-center justify-center border border-sky-200/80 mb-2">
                <Text className="text-sm font-bold" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  No medications to take
                </Text>
                <Text className="text-xs text-center mt-0.5" style={{ color: "rgba(0, 45, 114, 0.65)" }}>
                  All scheduled medications are taken.
                </Text>
              </View>
            ) : (
              toTakeList.map((med) => renderMedCard(med, true))
            )}
          </View>
        )}

        {/* Section 2: TAKEN */}
        {(filter === "all" || filter === "intaked") && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 mt-3 px-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-black" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Taken
                </Text>
                <View className="bg-emerald-500/25 border border-emerald-400/40 rounded-full px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-emerald-200">{intakedList.length}</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500 font-medium" style={{ fontFamily: "Outfit" }}>Completed</Text>
            </View>

            {intakedList.length === 0 ? (
              <View className="bg-white/80 rounded-2xl p-5 items-center justify-center border border-sky-200/80 mb-2">
                <View className="mb-1">
                  <MedicinePillIcon size={32} />
                </View>
                <Text className="text-sm font-bold" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  No taken medications yet
                </Text>
                <Text className="text-xs text-center mt-0.5" style={{ color: "rgba(0, 45, 114, 0.65)" }}>
                  Medications you mark as taken will appear here.
                </Text>
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
