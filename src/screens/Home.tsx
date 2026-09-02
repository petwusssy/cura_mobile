import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import Svg, { Path, Polyline, Circle, Rect, Line } from "react-native-svg";
import type { Screen, AppUser } from "../types";
import { Card, SectionHeader, Badge, AvatarBadge } from "../components/Shell";
import { CONSULTATIONS, MEDICATIONS, NOTIFICATIONS, BED_ASSIGNMENT, MASCOTS } from "../data";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  user: Partial<AppUser>;
  consultations?: any[];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function HomeScreen({ navigate, user, consultations = [] }: Props) {
  const mascot = MASCOTS.find((m) => m.id === user.avatarId) || MASCOTS[0];
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;
  const latestConsult = consultations.length > 0 ? consultations[0] : null;
  
  // Find a due medication from treatments of recent consultations
  let dueMed = null;
  for (const consult of consultations) {
    if (consult.treatments) {
      dueMed = consult.treatments.find((t: any) => t.nextDose); // Simplified check
      if (dueMed) break;
    }
  }

  // Bed Timer Logic
  const hasBed = !!BED_ASSIGNMENT;
  const totalSecs = hasBed ? (BED_ASSIGNMENT.allottedMinutes * 60) : 0;
  const elapsed = hasBed ? Math.floor((Date.now() - new Date(BED_ASSIGNMENT.startTime).getTime()) / 1000) : 0;
  const [secs, setSecs] = useState(Math.max(totalSecs - elapsed, 0));

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [secs]);

  const mins = Math.floor(secs / 60);
  const sec = secs % 60;
  const isBedActive = secs > 0 && hasBed;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 pt-12 pb-32" showsVerticalScrollIndicator={false}>
        
        {/* 1. Header Section */}
        <View className="px-6 flex-row items-center justify-between mb-6 mt-4">
          <View className="flex-row items-center gap-3">
            <AvatarBadge emoji={mascot.emoji} color={mascot.color} bg={mascot.bg} size={48} />
            <View>
              <Text className="text-slate-800 text-base font-bold" style={{ fontFamily: "Outfit" }}>
                Hi, {user.displayName || user.firstName || "Patient"}
              </Text>
              <Text className="text-slate-400 text-xs font-medium">{getGreeting()}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigate("notifications")}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white items-center justify-center relative"
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </Svg>
            {unread > 0 && (
              <View className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </Pressable>
        </View>

        {/* 2. Search Bar */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center bg-white rounded-full p-1.5 shadow-sm border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
            <View className="flex-row items-center gap-1 pl-3 pr-2 border-r border-slate-200">
              <Text className="text-sm">📍</Text>
              <Text className="text-xs font-bold text-slate-700">UA Clinic</Text>
            </View>
            <TextInput
              placeholder="Search here..."
              placeholderTextColor="#94A3B8"
              className="flex-1 px-3 text-sm text-slate-800"
            />
            <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="11" cy="11" r="8"/><Line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </Svg>
            </View>
          </View>
        </View>

        {/* 3. Categories (Horizontal Scroll) */}
        <View className="mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {[
              { label: "Medical", icon: "🩺", bg: "#EFF6FF", screen: "health-history" as Screen },
              { label: "Dental", icon: "🦷", bg: "#FDF4FF", screen: "health-history" as Screen },
              { label: "Meds", icon: "💊", bg: "#ECFDF5", screen: "medications" as Screen },
              { label: "Certs", icon: "📄", bg: "#FFFBEB", screen: "documents" as Screen },
            ].map((c) => (
              <Pressable key={c.label} onPress={() => navigate(c.screen)} className="items-center gap-2">
                <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: c.bg }}>
                  <Text className="text-2xl">{c.icon}</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-600">{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 4. Hero Card (Most Urgent Action) */}
        <View className="px-6 mb-8">
          <SectionHeader title={isBedActive ? "Active Rest" : dueMed ? "Medication Due" : latestConsult ? "Next Follow-up" : "All Caught Up!"} action={latestConsult ? "See all" : undefined} onAction={latestConsult ? () => navigate("health-history") : undefined} />
          
          <Pressable 
            onPress={() => isBedActive ? {} : dueMed ? navigate("medications") : latestConsult ? navigate("health-history") : {}}
            className="w-full bg-cura-500 rounded-[32px] p-6 relative overflow-hidden mt-2"
            style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 }}
          >
            {/* Background Decorations */}
            <View className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
            <View className="absolute right-12 -bottom-10 w-24 h-24 rounded-full bg-white/10" />

            <View className="flex-row items-start justify-between mb-4">
              <View className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                <Text className="text-white text-xs font-bold">
                  {isBedActive ? "🛏️ Timer" : dueMed ? "💊 Alert" : latestConsult ? "📅 Soon" : "✨ Great"}
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                  <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </Svg>
              </View>
            </View>

            <View className="mb-6 z-10 w-2/3">
              <Text className="text-white/80 text-sm font-medium mb-1">
                {isBedActive ? BED_ASSIGNMENT?.reason : dueMed ? dueMed.instructions || "Take medication" : latestConsult ? latestConsult.complaint : "You have no pending actions"}
              </Text>
              <Text className="text-white text-2xl font-bold" style={{ fontFamily: "Outfit" }}>
                {isBedActive ? `${String(mins).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : dueMed ? dueMed.medicineName : latestConsult ? latestConsult.doctorName || "Doctor" : "Stay Healthy!"}
              </Text>
              {isBedActive && <Text className="text-white/80 text-xs mt-1">Remaining time</Text>}
            </View>

            { (isBedActive || dueMed || latestConsult) && (
              <View className="bg-white px-5 py-2.5 rounded-full self-start z-10">
                <Text className="text-cura-600 text-xs font-bold">
                  {isBedActive ? "View Status" : dueMed ? "Take Meds" : "View Details"}
                </Text>
              </View>
            )}

            {/* Giant illustrative emoji on the right */}
            <View className="absolute -right-4 bottom-2 opacity-90">
              <Text style={{ fontSize: 96, transform: [{ rotate: '-10deg' }] }}>
                {isBedActive ? "😴" : dueMed ? "💊" : latestConsult ? "👨‍⚕️" : "🌟"}
              </Text>
            </View>
          </Pressable>
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
                <Text className="text-xs font-bold text-slate-800">{latestConsult.timeIn}</Text>
                <Text className="text-[10px] font-semibold text-slate-400">
                  {new Date(latestConsult.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

export function NotificationsScreen({ navigate, goBack }: { navigate: Props["navigate"]; goBack: () => void }) {
  const icons: Record<string, string> = { medication: "💊", appointment: "📅", result: "📋", info: "ℹ️" };
  const bgs: Record<string, string> = { medication: "#ECFDF5", appointment: "#EFF6FF", result: "#FDF4FF", info: "#F8FAFC" };

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-100 flex-row items-center px-6 py-4 gap-4 mt-8">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full border border-slate-200 items-center justify-center">
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-slate-800" style={{ fontFamily: "Outfit" }}>Notifications</Text>
        <View className="bg-cura-500 rounded-full px-2.5 py-1">
          <Text className="text-white text-[11px] font-bold">
            {NOTIFICATIONS.filter((n) => !n.read).length} new
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-6 py-4">
        <View className="flex-col gap-3 pb-8">
          {NOTIFICATIONS.length > 0 ? NOTIFICATIONS.map((n) => (
            <View
              key={n.id}
              className="bg-white rounded-[24px] p-4 flex-row items-start gap-4"
              style={{
                elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
                opacity: n.read ? 0.6 : 1,
                borderWidth: 1,
                borderColor: !n.read ? "#EFF6FF" : "#F8FAFC",
              }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: bgs[n.type] }}>
                <Text className="text-2xl">{icons[n.type]}</Text>
              </View>
              <View className="flex-1 pt-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-bold text-slate-800">{n.title}</Text>
                  {!n.read && <View className="w-2 h-2 rounded-full bg-cura-500" />}
                </View>
                <Text className="text-xs text-slate-500 leading-relaxed">{n.message}</Text>
                <Text className="text-[10px] text-slate-400 mt-2 font-medium">{n.time}</Text>
              </View>
            </View>
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
