import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Polyline } from "react-native-svg";
import type { Screen, AppUser } from "../types";
import { AvatarBadge, Select } from "../components/Shell";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MASCOTS } from "../data";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user: Partial<AppUser>;
  resetApp: () => void;
  consultations?: any[];
  medications?: any[];
  certificates?: any[];
  theme?: string;
  setTheme?: (theme: string) => void;
}

export function ProfileScreen({ user, resetApp, consultations = [], medications = [], certificates = [], theme, setTheme }: Props) {
  const insets = useSafeAreaInsets();
  const mascot = MASCOTS.find((m) => m.id === user.avatarId) || MASCOTS[0];

  const myInfoItems = [
    { icon: "🪪", label: "ID", sub: (user as any).id || user.id_number || "—", color: "#F3F4F6" },
    { icon: "📞", label: "Contact Details", sub: user.phone || (user as any).contact || "—", color: "#ECFEFF" },
    { icon: "📧", label: "Email", sub: user.email || "—", color: "#EFF8FF" },
    { icon: "🆘", label: "Emergency Contact", sub: `${user.emergencyName || (user as any).emergencyContact || "—"} (${user.emergencyPhone || "—"})`, color: "#FFF7ED" },
  ];

  const cat = user.category?.toLowerCase() || "";
  if (cat === 'student') {
    if ((user as any).studentCategory) {
      myInfoItems.push({ icon: "📋", label: "Category", sub: (user as any).studentCategory, color: "#FEE2E2" });
    }
    if ((user as any).gradeLevel) {
      myInfoItems.push({ icon: "📈", label: "Grade Level", sub: `Grade ${(user as any).gradeLevel}`, color: "#FEF3C7" });
    }
    if (user.course) {
      myInfoItems.push({ icon: "🎓", label: "Course", sub: user.course, color: "#ECFDF5" });
    }
    if (user.yearLevel) {
      myInfoItems.push({ icon: "📊", label: "Year Level", sub: user.yearLevel, color: "#F5F3FF" });
    }
  } else if (cat === 'employee') {
    myInfoItems.push({ icon: "💼", label: "Position", sub: user.position || "—", color: "#ECFDF5" });
    myInfoItems.push({ icon: "🏢", label: "Department", sub: user.department || "—", color: "#F5F3FF" });
  } else if (cat === 'outsider') {
    myInfoItems.push({ icon: "📍", label: "Address", sub: user.address || "—", color: "#FEE2E2" });
  }

  const sections = [
    {
      title: "My Information",
      items: myInfoItems,
    },
    {
      title: "Preferences",
      items: [
        { icon: "🔔", label: "Notification Preferences", sub: "Reminders, updates", color: "#EFF8FF" },
        { icon: "🎨", label: "Mascot & Display Name", sub: `${mascot.name} · ${(user.displayName || "").toUpperCase()}`, color: "#F5F3FF" },
        { icon: "🔒", label: "Privacy & Security", sub: "Password, data sharing", color: "#ECFDF5" },
        { icon: "ℹ️", label: "About CURA", sub: "Version 1.0.0", color: "#F8FAFC" },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-transparent">
      {/* Profile header */}
      <View
        className="px-5 pb-7"
        style={{ paddingTop: Math.max(insets.top, 24) + 16 }}
      >
        <Text className="text-white text-[22px] font-black tracking-tight mb-5" style={{ fontFamily: "Outfit" }}>Profile</Text>

        <View className="flex-row items-center gap-4">
          <View className="relative">
            <AvatarBadge emoji={mascot.emoji} color={mascot.color} bg={mascot.bg} size={66} />
            <Pressable
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
              style={{ backgroundColor: "#0B2136", elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 }}
            >
              <Svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </Svg>
            </Pressable>
          </View>
          <View>
            <Text className="text-xl font-black text-white" style={{ fontFamily: "Outfit" }}>
              {(user.firstName || "").toUpperCase()} {(user.lastName || "").toUpperCase()}
            </Text>
            <Text className="text-xs text-white/70 mt-0.5">{user.email}</Text>
            <View className="flex-row items-center gap-2 mt-1.5">
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: "#0B2136" }}
              >
                <Text className="text-[10px] font-bold text-white capitalize">{user.category || "patient"}</Text>
              </View>
              {user.category?.toLowerCase() === "student" && (
                <Text className="text-[10px] text-white/70 font-medium">
                  {[(user as any).studentCategory, user.course, (user as any).gradeLevel ? `Grade ${(user as any).gradeLevel}` : null, user.yearLevel].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mt-5">
          {[
            { label: "Visits", value: consultations.length.toString(), icon: "🩺" },
            { label: "Medications", value: medications.length.toString(), icon: "💊" },
            { label: "Documents", value: certificates.length.toString(), icon: "📄" },
          ].map((s) => (
            <View
              key={s.label}
              className="flex-1 bg-white rounded-[32px] px-3 py-4 items-center"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}
            >
              <Text className="text-base mb-1">{s.icon}</Text>
              <Text className="text-xl font-black text-[#0B2136]" style={{ fontFamily: "Outfit" }}>{s.value}</Text>
              <Text className="text-[10px] text-slate-400 font-medium">{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        <View className="flex-col gap-4 pb-12">
          {sections.map((section) => (
            <View key={section.title}>
              <Text className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2 px-1">{section.title}</Text>
              <View
                className="bg-white rounded-[32px] overflow-hidden p-2"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}
              >
                {section.items.map((item, i) => (
                  <Pressable
                    key={item.label}
                    className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-sky-50" : ""}`}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      <Text className="text-base">{item.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-800">{item.label}</Text>
                      <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>{item.sub}</Text>
                    </View>
                    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points="9 18 15 12 9 6"/>
                    </Svg>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Appearance Summary */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2 px-1">Appearance</Text>
            <View className="bg-white rounded-2xl p-4" style={{ elevation: 1, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
              <Select
                label="Theme"
                value={theme || 'light'}
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Ocean', value: 'ocean' },
                ]}
                onValueChange={(val) => setTheme && setTheme(val)}
              />
            </View>
          </View>

          {/* Health Summary */}
          <View>
            <Text className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2 px-1">Health Summary</Text>
            <View className="bg-white rounded-2xl p-4" style={{ elevation: 1, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
              <View className="flex-row flex-wrap justify-between">
                {[
                  { label: "Blood Type", value: user.bloodType || "—", bg: "#FFF1F2", color: "#F43F5E" },
                  { label: "Gender", value: user.gender || (user as any).sex || "—", bg: "#EFF8FF", color: "#0994E8" },
                  { label: "Date of Birth", value: user.dob || (user as any).birthday ? new Date(user.dob || (user as any).birthday).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—", bg: "#ECFDF5", color: "#059669" },
                  { label: "Emergency", value: user.emergencyName || (user as any).emergencyContact ? `${user.emergencyName || (user as any).emergencyContact}` : "—", bg: "#FFFBEB", color: "#D97706" },
                ].map((item, idx) => (
                  <View key={item.label} className="rounded-xl p-3 mb-2" style={{ backgroundColor: item.bg, width: '48%' }}>
                    <Text className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: item.color }}>{item.label}</Text>
                    <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Logout */}
          <Pressable
            onPress={resetApp}
            className="flex-row items-center gap-3 bg-white rounded-2xl px-4 py-4 mt-1 border border-rose-100"
            style={{ elevation: 2, shadowColor: '#F43F5E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
          >
            <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center">
              <Text className="text-base">🚪</Text>
            </View>
            <Text className="text-sm font-bold text-rose-500">Sign Out</Text>
            <View className="flex-1 items-end">
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDA4AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6"/>
              </Svg>
            </View>
          </Pressable>

          <View className="items-center flex-col gap-0.5 mt-4">
            <Text className="text-[11px] text-white/60 font-medium">CURA · University Clinic Patient App</Text>
            <Text className="text-[10px] text-white/50">v1.0.0 · Your health, our priority 💙</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

