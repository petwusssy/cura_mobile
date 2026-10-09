import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Animated, Easing, useWindowDimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Screen, AppUser } from "../types";
import { Card, SectionHeader, Badge, AvatarBadge, Header } from "../components/Shell";
import { CONSULTATIONS, MEDICATIONS, NOTIFICATIONS, BED_ASSIGNMENT, MASCOTS } from "../data";
import { getManilaHour, formatManilaDateTime, formatTime12 } from "../utils/philippineTime";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  user: Partial<AppUser>;
  consultations?: any[];
  notifications?: any[];
  medications?: any[];
}

function getGreeting() {
  const h = getManilaHour();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

export function HomeScreen({ navigate, user, consultations = [], notifications = [], medications = [] }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const mascot = MASCOTS.find((m) => m.id === user.avatarId) || MASCOTS[0];
  const unread = notifications.filter((n) => !n.read).length;
  const latestConsult = consultations.length > 0 ? consultations[0] : null;


  const [intakedIds, setIntakedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchIntaked = () => {
      AsyncStorage.getItem('@cura_intaked_meds')
        .then((data) => {
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                setIntakedIds(new Set(parsed));
              }
            } catch {}
          }
        })
        .catch(() => {});
    };

    fetchIntaked();
    const interval = setInterval(fetchIntaked, 2000);
    return () => clearInterval(interval);
  }, []);

  // Find a due medication from treatments that have NOT been intaked yet
  const dueMed = useMemo(() => {
    if (medications && medications.length > 0) {
      const pending = medications.filter(
        (m: any) =>
          m.status !== "intaked" &&
          m.status !== "taken" &&
          !intakedIds.has(String(m.id)) &&
          !intakedIds.has(m.id) &&
          !(m.rawRemarks && m.rawRemarks.includes('[INTAKED]')) &&
          !(m.instructions && m.instructions.includes('[INTAKED]'))
      );
      if (pending.length === 0) return null;
      return pending.find((m: any) => m.nextDose) || pending[0];
    }

    // Fallback: check consultations treatments
    for (const consult of consultations) {
      if (consult.treatments) {
        const found = consult.treatments.find((t: any, idx: number) => {
          const medId = t.id ? String(t.id) : `${consult.id}-${t.medicineName}-${t.nextDose || t.timeGiven || idx}`;
          if (intakedIds.has(medId) || (t.id && intakedIds.has(String(t.id)))) return false;
          if (t.remarks && t.remarks.includes('[INTAKED]')) return false;
          return true;
        });
        if (found) return found;
      }
    }
    return null;
  }, [medications, consultations, intakedIds]);

  // Bed Timer Logic
  const hasBed = !!BED_ASSIGNMENT;
  const totalSecs = BED_ASSIGNMENT ? (BED_ASSIGNMENT.allottedMinutes * 60) : 0;
  const elapsed = BED_ASSIGNMENT ? Math.floor((Date.now() - new Date(BED_ASSIGNMENT.startTime).getTime()) / 1000) : 0;
  const [secs, setSecs] = useState(Math.max(totalSecs - elapsed, 0));

  const mins = Math.floor(secs / 60);
  const sec = secs % 60;
  const isBedActive = secs > 0 && hasBed;

  const [queue, setQueue] = useState<any>(null);
  const [aheadCount, setAheadCount] = useState<number>(0);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const joiningRef = useRef(false);
  const cancelledQueueIdRef = useRef<string | null>(null);


  useEffect(() => {
    const fetchQueue = async () => {
      if (joiningRef.current) return;

      try {
        const res = await fetch('https://cura-backend-dvj5.onrender.com/api/queue/');
        if (!res.ok) return;
        const qs = await res.json();
        if (!Array.isArray(qs)) return;

        const currentPatientId = (user as any)?.id || (user as any)?.id_number;
        const currentPatientName = (
          (user as any)?.displayName || 
          (user as any)?.name || 
          `${user.firstName || ''} ${user.lastName || ''}`
        ).trim().toUpperCase();

        const activeTickets = qs.filter((q: any) => {
          if (q.status === 'done') return false;
          if (cancelledQueueIdRef.current && q.id === cancelledQueueIdRef.current) return false;
          if (currentPatientId && String(q.patient) === String(currentPatientId)) return true;
          if (currentPatientName && q.patient_name && q.patient_name.trim().toUpperCase() === currentPatientName) return true;
          return false;
        });

        if (activeTickets.length > 0) {
          activeTickets.sort((a: any, b: any) => a.queue_number - b.queue_number);
          const myQueue = activeTickets[activeTickets.length - 1];
          setQueue(myQueue);
          const ahead = qs.filter((q: any) => 
            (q.status === 'waiting' || q.status === 'called') && 
            q.queue_number < myQueue.queue_number
          ).length;
          setAheadCount(ahead);
        } else {
          setQueue(null);
          setAheadCount(0);
        }
      } catch (e) {}
    };

    fetchQueue();
    const t = setInterval(fetchQueue, 1500);
    return () => clearInterval(t);
  }, [(user as any)?.id, (user as any)?.id_number, user?.email]);

  const [advisory, setAdvisory] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    const fetchAdvisory = async () => {
      try {
        const res = await fetch('https://cura-backend-dvj5.onrender.com/api/advisory/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.status) {
            setAdvisory(data);
          }
        }
      } catch (e) {}
    };
    fetchAdvisory();
    const t = setInterval(fetchAdvisory, 2000);
    return () => clearInterval(t);
  }, []);


  const joinQueue = async () => {
    if (queue || joining || joiningRef.current) return;

    let patientId = (user as any)?.id || (user as any)?.id_number;

    if (!patientId && user?.email) {
      try {
        const pRes = await fetch('https://cura-backend-dvj5.onrender.com/api/patients/');
        if (pRes.ok) {
          const patients = await pRes.json();
          const p = patients.find((item: any) => item.email?.toLowerCase().trim() === user.email?.toLowerCase().trim());
          if (p?.id) patientId = p.id;
        }
      } catch (e) {}
    }

    if (!patientId) return;

    cancelledQueueIdRef.current = null;
    joiningRef.current = true;
    setJoining(true);
    try {
      const res = await fetch('https://cura-backend-dvj5.onrender.com/api/queue/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: String(patientId) })
      });
      if (res.ok) {
        const q = await res.json();
        setQueue(q);
      }
    } catch (e) {}
    setJoining(false);
    joiningRef.current = false;
  };

  const cancelQueue = async () => {
    if (!queue || cancelling) return;
    const targetId = queue.id;
    cancelledQueueIdRef.current = targetId;
    setCancelling(true);
    setQueue(null);
    setAheadCount(0);
    try {
      await fetch(`https://cura-backend-dvj5.onrender.com/api/queue/${targetId}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {}
    setCancelling(false);
  };

  const isQueueActive = !!queue;

  return (
    <View className="flex-1 bg-transparent">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header Section */}
        <View className="px-6 flex-row items-center justify-between mb-6 mt-4">
          <View className="flex-row items-center gap-3">
            <AvatarBadge emoji={mascot.emoji} color={mascot.color} bg={mascot.bg} size={48} />
            <View>
              <Text className="text-cura-900/75 text-xs font-semibold -mb-0.5">
                Hi, {getGreeting()}
              </Text>
              <Text className="text-cura-900 text-[22px] font-black tracking-tight" style={{ fontFamily: "Outfit" }}>
                {(user.displayName || user.firstName || "Patient").toUpperCase()}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigate("notifications")}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white items-center justify-center relative shadow-xs"
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </Svg>
            {unread > 0 && (
              <View className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </Pressable>
        </View>

        {/* Clinic Status Broadcast Banner */}
        {advisory && (
          <View className="px-6 mb-6">
            <View 
              className="bg-white rounded-[24px] p-5 border border-slate-100 relative overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base">📢</Text>
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinic Advisory</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${
                  advisory.status === 'Open' ? 'bg-emerald-100' :
                  advisory.status === 'Half Day' ? 'bg-amber-100' :
                  'bg-rose-100'
                }`}>
                  <Text className={`text-xs font-bold ${
                    advisory.status === 'Open' ? 'text-emerald-700' :
                    advisory.status === 'Half Day' ? 'text-amber-700' :
                    'text-rose-700'
                  }`}>
                    {advisory.status === 'Open' ? '🟢 Open' : advisory.status === 'Half Day' ? '🟡 Half Day' : '🔴 Closed'}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-semibold text-slate-800 leading-snug">
                {advisory.message}
              </Text>
            </View>
          </View>
        )}

        {/* 2. Hero Card (Most Urgent Action) */}
        {/* 2. Hero Card & Quick Actions (Attached GCash-Style Container) */}
        <View className="px-6 mb-8">
          <SectionHeader
            title={
              isQueueActive
                ? "Live Queue"
                : isBedActive
                ? "Active Rest"
                : "Medication Due"
            }
            action={!isQueueActive && !isBedActive ? "See all" : undefined}
            onAction={!isQueueActive && !isBedActive ? () => navigate("medications") : undefined}
          />
          
          <View 
            className="w-full bg-white rounded-[28px] overflow-hidden mt-2"
            style={{
              shadowColor: '#0A2540',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 22,
              elevation: 8,
              borderWidth: 1,
              borderColor: '#EEF2F6',
            }}
          >
            {/* Top: Blue Hero Section */}
            <Pressable 
              onPress={() => isQueueActive ? {} : isBedActive ? {} : navigate("medications")}
              className="w-full p-6 relative overflow-hidden"
            >
              {/* Admin Portal Gradient Background */}
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />

              <View className="flex-row items-start justify-between mb-4">
                <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${isQueueActive && queue.status === 'called' ? 'bg-green-500' : 'bg-white/20'}`}>
                  <Text className="text-white text-xs font-bold">
                    {isQueueActive
                      ? (queue.status === 'called' ? "🎫 Your Turn!" : "🎫 Waitlist")
                      : isBedActive
                      ? "🛏️ Timer"
                      : dueMed
                      ? "💊 Alert"
                      : "✨ All Intaked"}
                  </Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </Svg>
                </View>
              </View>

              <View className="mb-6 z-10 w-3/4">
                <Text className="text-white/80 text-sm font-medium mb-1">
                  {isQueueActive ? (
                    queue.status === 'called' 
                      ? "📢 It's your turn! Proceed to counter" 
                      : aheadCount === 0 
                        ? "🎉 You are next in line! (0 ahead)" 
                        : `⏳ ${aheadCount} ${aheadCount === 1 ? 'patient' : 'patients'} ahead of you`
                  ) : isBedActive ? (
                    BED_ASSIGNMENT?.reason
                  ) : dueMed ? (
                    dueMed.instructions || "Take medication"
                  ) : (
                    "No upcoming medications due"
                  )}
                </Text>
                <Text className="text-white text-2xl font-bold" style={{ fontFamily: "Outfit" }}>
                  {isQueueActive
                    ? `Queue #${queue.queue_number}`
                    : isBedActive
                    ? `${String(mins).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
                    : dueMed
                    ? (dueMed.name || dueMed.medicineName)
                    : "All Caught Up!"}
                </Text>
                {isBedActive && <Text className="text-white/80 text-xs mt-1">Remaining time</Text>}
                {!isQueueActive && !isBedActive && !dueMed && (
                  <Text className="text-white/70 text-xs mt-1">All scheduled medications are completed</Text>
                )}
              </View>

              <View className="flex-row items-center gap-2 z-10">
                <View className={`px-5 py-2.5 rounded-full ${isQueueActive && queue.status === 'called' ? 'bg-green-100' : 'bg-white'}`}>
                  <Text className={`${isQueueActive && queue.status === 'called' ? 'text-green-800' : 'text-cura-600'} text-xs font-bold`}>
                    {isQueueActive
                      ? (queue.status === 'called' ? "Ready Now" : aheadCount === 0 ? "You're Next" : "In Line")
                      : isBedActive
                      ? "View Status"
                      : dueMed
                      ? "Take Meds"
                      : "View Meds"}
                  </Text>
                </View>
                {isQueueActive && (
                  <Pressable 
                    onPress={cancelQueue}
                    disabled={cancelling}
                    className="px-4 py-2.5 rounded-full bg-white/20 active:bg-white/30"
                  >
                    <Text className="text-white/90 text-xs font-semibold">
                      {cancelling ? "Leaving..." : "Leave Queue"}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Giant illustrative emoji on the right */}
              <View className="absolute -right-4 bottom-2 opacity-90">
                <Text style={{ fontSize: 96, transform: [{ rotate: '-10deg' }] }}>
                  {isQueueActive ? "🎟️" : isBedActive ? "😴" : dueMed ? "💊" : "✨"}
                </Text>
              </View>
            </Pressable>

            {/* Bottom: Quick Actions (Nakatuglong sa Medication Due container tulad sa GCash) */}
            <View className="bg-white px-2 pt-3.5 pb-4 flex-row items-center justify-between">
              <Pressable 
                onPress={joinQueue} 
                className="items-center flex-1 active:opacity-75"
                style={{ opacity: joining ? 0.5 : 1 }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <Defs>
                    <SvgLinearGradient id="gQueue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#00A3FF" />
                      <Stop offset="100%" stopColor="#0056B3" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="4" y="9" width="32" height="22" rx="6" fill="url(#gQueue)" />
                  <Circle cx="4" cy="20" r="3.5" fill="#FFFFFF" />
                  <Circle cx="36" cy="20" r="3.5" fill="#FFFFFF" />
                  <Line x1="15" y1="10" x2="15" y2="30" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2,2" strokeOpacity="0.6" />
                  <Line x1="20" y1="15" x2="30" y2="15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <Line x1="20" y1="20" x2="28" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <Line x1="20" y1="25" x2="25" y2="25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="9.5" cy="20" r="2.5" fill="#38BDF8" />
                </Svg>
                <Text numberOfLines={1} className="text-[12px] font-semibold text-center mt-1.5" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Queue
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => navigate("telemedicine")} 
                className="items-center flex-1 active:opacity-75"
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <Defs>
                    <SvgLinearGradient id="gTelemed" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#00A3FF" />
                      <Stop offset="100%" stopColor="#0056B3" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="gLens" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#38BDF8" />
                      <Stop offset="100%" stopColor="#0284C7" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="4" y="10" width="22" height="20" rx="6" fill="url(#gTelemed)" />
                  <Path d="M26 16l8-4.5v17l-8-4.5v-8z" fill="url(#gLens)" />
                  <Rect x="13.5" y="15" width="3" height="10" rx="1" fill="#FFFFFF" />
                  <Rect x="10" y="18.5" width="10" height="3" rx="1" fill="#FFFFFF" />
                </Svg>
                <Text numberOfLines={1} className="text-[12px] font-semibold text-center mt-1.5" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Telemed
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => navigate("appointment")} 
                className="items-center flex-1 active:opacity-75"
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <Defs>
                    <SvgLinearGradient id="gAppoint" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#00A3FF" />
                      <Stop offset="100%" stopColor="#0056B3" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="5" y="9" width="30" height="25" rx="6" fill="url(#gAppoint)" />
                  <Rect x="11" y="5" width="3" height="7" rx="1.5" fill="#38BDF8" />
                  <Rect x="26" y="5" width="3" height="7" rx="1.5" fill="#38BDF8" />
                  <Line x1="5" y1="16" x2="35" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" />
                  <Polyline points="14 24 18 28 26 20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text numberOfLines={1} className="text-[12px] font-semibold text-center mt-1.5" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Appoint
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => navigate("medications")} 
                className="items-center flex-1 active:opacity-75"
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <Defs>
                    <SvgLinearGradient id="gMedCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#38BDF8" />
                      <Stop offset="100%" stopColor="#00A3FF" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="gMedBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#0056B3" />
                      <Stop offset="100%" stopColor="#002D72" />
                    </SvgLinearGradient>
                  </Defs>
                  <G transform="rotate(-45 20 20)">
                    <Path d="M14 11a6 6 0 0 1 12 0v8H14v-8z" fill="url(#gMedCyan)" />
                    <Path d="M14 19h12v8a6 6 0 0 1-12 0v-8z" fill="url(#gMedBlue)" />
                    <Line x1="14" y1="19" x2="26" y2="19" stroke="#FFFFFF" strokeWidth="1.5" />
                    <Rect x="16" y="11" width="2" height="6" rx="1" fill="#FFFFFF" opacity="0.7" />
                  </G>
                </Svg>
                <Text numberOfLines={1} className="text-[12px] font-semibold text-center mt-1.5" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Meds
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => navigate("documents")} 
                className="items-center flex-1 active:opacity-75"
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <Defs>
                    <SvgLinearGradient id="gCerts" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#00A3FF" />
                      <Stop offset="100%" stopColor="#0056B3" />
                    </SvgLinearGradient>
                  </Defs>
                  <Path d="M8 8a4 4 0 0 1 4-4h12l8 8v20a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8z" fill="url(#gCerts)" />
                  <Path d="M24 4v6a2 2 0 0 0 2 2h6l-8-8z" fill="#38BDF8" />
                  <Line x1="13" y1="16" x2="27" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <Line x1="13" y1="21" x2="23" y2="21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="23" cy="27" r="3.5" fill="#38BDF8" />
                  <Polyline points="21.5 27 22.5 28 24.5 26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text numberOfLines={1} className="text-[12px] font-semibold text-center mt-1.5" style={{ color: "#002D72", fontFamily: "Outfit" }}>
                  Certs
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 5. Bottom List (Recent Visits) */}
        <View className="px-6 pb-24">
          <SectionHeader title="Recent Visit" action={latestConsult ? "History" : undefined} onAction={latestConsult ? () => navigate("health-history") : undefined} />
          {latestConsult ? (
            <Pressable 
              onPress={() => navigate("health-detail", { id: latestConsult.id })}
              className="bg-white rounded-[24px] p-4 flex-row items-center gap-4 mt-2"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}
            >
              <View className="relative">
                <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center">
                  <Text className="text-2xl">👩‍⚕️</Text>
                </View>
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-800">{latestConsult.doctorName || "Consultation"}</Text>
                <Text className="text-xs text-slate-400 mt-0.5">{latestConsult.complaint}</Text>
              </View>
              <View className="items-end gap-1">
                <Text className="text-xs font-bold text-slate-800">{formatTime12(latestConsult.timeIn)}</Text>
                <Text className="text-[10px] font-semibold text-slate-400">
                  {new Date(latestConsult.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" })}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View className="bg-white rounded-[24px] p-6 items-center justify-center mt-2 border border-slate-100 shadow-sm shadow-slate-200">
              <Text className="text-3xl mb-2">🌿</Text>
              <Text className="text-sm font-bold text-slate-700">No recent visits</Text>
              <Text className="text-xs text-slate-400 text-center mt-1">Your consultation history will appear here.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

export function NotificationsScreen({ navigate, goBack, notifications = [], setNotifications }: { navigate: Props["navigate"]; goBack: () => void; notifications?: any[]; setNotifications?: any }) {
  const icons: Record<string, string> = { medication: "💊", appointment: "📅", result: "📋", info: "ℹ️", telemedicine_update: "📹", appointment_update: "📅" };
  const bgs: Record<string, string> = { medication: "#ECFDF5", appointment: "#EFF6FF", result: "#FDF4FF", info: "#F8FAFC", telemedicine_update: "#EFF6FF", appointment_update: "#FDF4FF" };

  const activeNotifs = notifications.filter(n => !n.read);

  const handlePress = async (n: any) => {
    // Mark as read in backend
    try {
      await fetch(`https://cura-backend-dvj5.onrender.com/api/notifications/${n.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      if (setNotifications) {
         setNotifications((prev: any[]) => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
      }
    } catch (e) {}

    // Navigate
    if (n.type.includes('telemedicine')) navigate('telemedicine');
    else if (n.type.includes('appointment')) navigate('appointment');
    else if (n.type === 'medication') navigate('medications');
    else if (n.type === 'result') navigate('documents');
  };

  return (
    <View className="flex-1 bg-transparent">
      <Header
        title="Notifications"
        onBack={goBack}
        right={
          <View className="bg-cura-500 rounded-full px-2.5 py-1">
            <Text className="text-white text-[11px] font-bold">
              {activeNotifs.length} new
            </Text>
          </View>
        }
      />
      
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        <View className="flex-col gap-3 pb-8">
          {activeNotifs.length > 0 ? activeNotifs.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => handlePress(n)}
              className="bg-white rounded-[24px] p-4 flex-row items-start gap-4"
              style={{
                elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
                borderWidth: 1,
                borderColor: "#EFF6FF",
              }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: bgs[n.type] || '#F8FAFC' }}>
                <Text className="text-2xl">{icons[n.type] || 'ℹ️'}</Text>
              </View>
              <View className="flex-1 pt-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-bold text-slate-800">{n.title || n.type}</Text>
                  <View className="w-2 h-2 rounded-full bg-cura-500" />
                </View>
                <Text className="text-xs text-slate-500 leading-relaxed">{n.message}</Text>
                <Text className="text-[10px] text-slate-400 mt-2 font-medium">{n.created_at ? formatManilaDateTime(n.created_at) : 'recently'}</Text>
              </View>
            </Pressable>
          )) : (
            <View className="bg-white rounded-[24px] p-8 items-center justify-center mt-4 border border-slate-100">
              <Text className="text-4xl mb-3">🔔</Text>
              <Text className="text-base font-bold text-slate-700">No Notifications</Text>
              <Text className="text-sm text-slate-400 text-center mt-1">You're all caught up!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
