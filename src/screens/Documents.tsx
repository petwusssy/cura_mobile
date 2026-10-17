import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Screen } from "../types";
import { Card, Badge, Header, EmptyState } from "../components/Shell";
import { PRESCRIPTIONS, CERTIFICATES, TRANSFERS } from "../data";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  params?: { tab?: string; id?: string; cert?: any };
  certificates?: any[];
}

type Tab = "prescriptions" | "certificates" | "transfers";

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 190,
  mass: 0.8,
};

const TAP_SPRING = {
  damping: 12,
  stiffness: 350,
};

interface TabItemData {
  id: Tab;
  label: string;
  count: number;
}

function TabItemButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItemData;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, TAP_SPRING),
      withSpring(1.0, { damping: 14, stiffness: 220 })
    );

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isActive ? "#FFFFFF" : "#007AFF";

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className="flex-1 items-center justify-center py-2.5 relative z-10 rounded-2xl"
      style={{
        backgroundColor: isHovered && !isActive ? "rgba(0, 122, 255, 0.08)" : "transparent",
        borderColor: isHovered && !isActive ? "rgba(0, 122, 255, 0.18)" : "transparent",
        borderWidth: 1,
      }}
    >
      <Animated.View style={[{ alignItems: "center" }, animatedStyle]}>
        <View className="relative">
          {tab.id === "prescriptions" && (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <Path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
              <Circle cx="20" cy="10" r="2" />
            </Svg>
          )}
          {tab.id === "certificates" && (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <Polyline points="14 2 14 8 20 8" />
              <Line x1="16" y1="13" x2="8" y2="13" />
              <Line x1="16" y1="17" x2="8" y2="17" />
              <Polyline points="10 9 9 9 8 9" />
            </Svg>
          )}
          {tab.id === "transfers" && (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M10 17h4V5H2v12h3" />
              <Path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
              <Circle cx="7.5" cy="17.5" r="2.5" />
              <Circle cx="17.5" cy="17.5" r="2.5" />
              <Line x1="6" y1="9" x2="10" y2="9" />
              <Line x1="8" y1="7" x2="8" y2="11" />
            </Svg>
          )}

          {/* Badge with Visits Gradient */}
          <View
            className="absolute -top-1.5 -right-3 rounded-full items-center justify-center overflow-hidden"
            style={{
              width: 17,
              height: 17,
              backgroundColor: isActive ? "#FFFFFF" : undefined,
              shadowColor: "#0A2472",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            {!isActive && (
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={{
                fontSize: 8.5,
                fontWeight: "800",
                color: isActive ? "#0A2472" : "#FFFFFF",
                fontFamily: "Outfit",
              }}
            >
              {tab.count}
            </Text>
          </View>
        </View>

        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            fontWeight: isActive ? "800" : "600",
            color: isActive ? "#FFFFFF" : isHovered ? "#007AFF" : "#0B2136",
            fontFamily: "Outfit",
            textShadowColor: isActive ? "rgba(0, 0, 0, 0.3)" : "transparent",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function DocumentsScreen({ navigate, goBack, params, certificates }: Props) {
  const [tab, setTab] = useState<Tab>((params?.tab as Tab) || "prescriptions");
  const [containerWidth, setContainerWidth] = useState(0);

  const tabs: TabItemData[] = [
    { id: "prescriptions", label: "Prescriptions", count: PRESCRIPTIONS.length },
    { id: "certificates",  label: "Certificates",  count: (certificates && certificates.length > 0) ? certificates.length : CERTIFICATES.length },
    { id: "transfers",     label: "Transfers",     count: TRANSFERS.length },
  ];

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === tab));
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (containerWidth > 0 && tabs.length > 0) {
      const tabWidth = (containerWidth - 8) / tabs.length;
      const targetX = 4 + activeIndex * tabWidth;
      indicatorX.value = withSpring(targetX, SPRING_CONFIG);
    }
  }, [activeIndex, containerWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth > 0 && tabs.length > 0 ? (containerWidth - 8) / tabs.length : 0;
    return {
      transform: [{ translateX: indicatorX.value }],
      width: Math.max(0, tabWidth),
    };
  });

  return (
    <View className="flex-1 bg-transparent">
      <Header title="My Documents" onBack={goBack} />

      {/* Tabs with Visits Blue Gradient Hover / Active Spring Slider */}
      <View
        className="bg-white border-b border-sky-100 px-2 py-2"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== containerWidth) {
            setContainerWidth(w);
            const tabWidth = (w - 8) / tabs.length;
            indicatorX.value = 4 + activeIndex * tabWidth;
          }
        }}
      >
        <View className="flex-row relative items-center" style={{ minHeight: 56 }}>
          {/* Sliding Pill with Visits Blue Gradient */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 2,
                  bottom: 2,
                  borderRadius: 16,
                  overflow: "hidden",
                  shadowColor: "#0A2472",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.45)",
                },
                animatedIndicatorStyle,
              ]}
            >
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {tabs.map((t) => (
            <TabItemButton
              key={t.id}
              tab={t}
              isActive={tab === t.id}
              onPress={() => setTab(t.id)}
            />
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        {tab === "prescriptions" && <PrescriptionList navigate={navigate} />}
        {tab === "certificates"  && <CertificateList navigate={navigate} certificates={certificates} />}
        {tab === "transfers"     && <TransferList />}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

function PrescriptionList({ navigate }: { navigate: Props["navigate"] }) {
  if (PRESCRIPTIONS.length === 0) {
    return (
      <View className="flex-col items-center justify-center py-14 px-6 gap-3">
        <Svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <Path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <Circle cx="20" cy="10" r="2" />
        </Svg>
        <Text className="text-base font-bold text-center" style={{ color: "#64748B", fontFamily: "Outfit" }}>
          No Prescriptions
        </Text>
        <Text className="text-sm text-center max-w-[220px]" style={{ color: "#94A3B8", fontFamily: "Outfit" }}>
          You don't have any medical prescriptions yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-col gap-3">
      {PRESCRIPTIONS.map((p) => (
        <Card key={p.id} onPress={() => navigate("prescription-detail", { id: p.id })}>
          <View className="flex-row gap-3">
            <View className="w-14 rounded-xl overflow-hidden bg-sky-50 border border-sky-100" style={{ height: 70 }}>
              <Image source={{ uri: p.imageUrl }} className="w-full h-full opacity-80" resizeMode="cover" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1.5">
                <Badge variant="info">Prescription</Badge>
                <Text className="text-[10px] font-medium text-slate-400">{p.date}</Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 mb-1.5">{p.doctor}</Text>
              <View className="flex-col gap-0.5">
                {p.medications.map((m) => (
                  <Text key={m} className="text-[11px] text-slate-400">• {m}</Text>
                ))}
              </View>
            </View>
            <View className="mt-1">
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6"/>
              </Svg>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function CertificateList({ navigate, certificates = [] }: { navigate: Props["navigate"], certificates?: any[] }) {
  const certsToDisplay = (certificates && certificates.length > 0) ? certificates : CERTIFICATES;

  return (
    <View className="flex-col gap-3">
      {/* Request Med Certificate Action Banner */}
      <Pressable
        onPress={() => navigate("request-med-cert")}
        className="bg-white rounded-[28px] p-4 flex-row items-center justify-between shadow-sm active:opacity-90 mb-1"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-sky-50 items-center justify-center border border-sky-100">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <Polyline points="14 2 14 8 20 8" />
              <Line x1="12" y1="18" x2="12" y2="12" />
              <Line x1="9" y1="15" x2="15" y2="15" />
            </Svg>
          </View>
          <View>
            <Text className="text-slate-800 font-bold text-sm">Request Medical Certificate</Text>
            <Text className="text-slate-400 text-xs">Submit request for clinic validation</Text>
          </View>
        </View>
        <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="9 18 15 12 9 6"/>
          </Svg>
        </View>
      </Pressable>

      {certsToDisplay.length === 0 ? (
        <View className="pt-4">
          <EmptyState emoji="📄" title="No Issued Certificates" message="You don't have any issued medical certificates yet. Tap above to request one." />
        </View>
      ) : (
        certsToDisplay.map((c) => (
        <Card key={c.id} onPress={() => navigate("cert-detail", { id: c.id, cert: c })}>
          <View className="flex-row items-start gap-3">
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-sky-50 border border-sky-100">
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Polyline points="14 2 14 8 20 8" />
                <Line x1="16" y1="13" x2="8" y2="13" />
                <Line x1="16" y1="17" x2="8" y2="17" />
              </Svg>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Badge variant="info">Medical Certificate</Badge>
                <Text className="text-[10px] font-medium text-slate-400">{c.date}</Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 mb-0.5 leading-tight">{c.purpose}</Text>
              <Text className="text-xs text-slate-400">{c.doctor || "Clinic Physician"}</Text>
              <Text className="text-xs text-slate-500 mt-1 italic" numberOfLines={1}>{c.diagnosis || "No diagnosis specified"}</Text>
            </View>
            <View className="mt-1">
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6"/>
              </Svg>
            </View>
          </View>
        </Card>
      )))}
    </View>
  );
}

function TransferList() {
  if (TRANSFERS.length === 0) {
    return (
      <View className="flex-col items-center justify-center py-14 px-6 gap-3">
        <Svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10 17h4V5H2v12h3" />
          <Path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
          <Circle cx="7.5" cy="17.5" r="2.5" />
          <Circle cx="17.5" cy="17.5" r="2.5" />
          <Line x1="6" y1="9" x2="10" y2="9" />
          <Line x1="8" y1="7" x2="8" y2="11" />
        </Svg>
        <Text className="text-base font-bold text-center" style={{ color: "#64748B", fontFamily: "Outfit" }}>
          No Transfers
        </Text>
        <Text className="text-sm text-center max-w-[220px]" style={{ color: "#94A3B8", fontFamily: "Outfit" }}>
          You don't have any hospital transfer records yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-col gap-3">
      {TRANSFERS.map((t) => {
        const statusCfg = {
          completed:    { badge: "success" as const, label: "Completed" },
          "in-transit": { badge: "warning" as const, label: "In Transit" },
          pending:      { badge: "neutral" as const, label: "Pending" },
        };
        const cfg = statusCfg[t.status];
        return (
          <Card key={t.id} className="relative">
            <LinearGradient
              colors={['#0A2472', '#72caec']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            />
            <View className="flex-row items-start justify-between mb-3 mt-1">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-sky-50 items-center justify-center border border-sky-100">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M10 17h4V5H2v12h3" />
                    <Path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
                    <Circle cx="7.5" cy="17.5" r="2.5" />
                    <Circle cx="17.5" cy="17.5" r="2.5" />
                    <Line x1="6" y1="9" x2="10" y2="9" />
                    <Line x1="8" y1="7" x2="8" y2="11" />
                  </Svg>
                </View>
                <Text className="text-xs font-bold text-[#007AFF] uppercase tracking-wide">Hospital Transfer</Text>
              </View>
              <Badge variant={cfg.badge}>{cfg.label}</Badge>
            </View>
            <Text className="text-base font-bold text-slate-800 mb-1">{t.receivingHospital}</Text>
            <Text className="text-xs text-slate-400 mb-2">
              {t.date} · {t.time} · {t.transport}
            </Text>
            <View className="bg-sky-50 rounded-xl p-3 border border-sky-100">
              <Text className="text-xs text-slate-600 leading-relaxed">{t.reason}</Text>
            </View>
            <Text className="text-xs text-slate-400 mt-2">Attended by {t.attendingDoctor}</Text>
          </Card>
        );
      })}
    </View>
  );
}

// ── Prescription Detail ───────────────────────────────────────────────────────

export function PrescriptionDetailScreen({ goBack, params }: Props) {
  const insets = useSafeAreaInsets();
  const prescription = PRESCRIPTIONS.find((p) => p.id === params?.id);
  const [zoomed, setZoomed] = useState(false);

  if (!prescription) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Prescription Details" onBack={goBack} />
        <View className="flex-1 justify-center">
          <EmptyState emoji="🔍" title="Not Found" message="The prescription could not be found." />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View
        className="flex-row items-center gap-3 px-4 pb-3"
        style={{ backgroundColor: "#0F172A", paddingTop: Math.max(insets.top, 12) + 8 }}
      >
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-base font-bold" style={{ fontFamily: "Outfit" }}>Prescription</Text>
          <Text className="text-slate-400 text-xs">{prescription.date}</Text>
        </View>
        <Pressable
          onPress={() => setZoomed(!zoomed)}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
        >
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {zoomed ? (
              <>
                <Polyline points="4 14 10 14 10 20"/>
                <Polyline points="20 10 14 10 14 4"/>
                <Line x1="14" y1="10" x2="21" y2="3"/>
                <Line x1="3" y1="21" x2="10" y2="14"/>
              </>
            ) : (
              <>
                <Polyline points="15 3 21 3 21 9"/>
                <Polyline points="9 21 3 21 3 15"/>
                <Line x1="21" y1="3" x2="14" y2="10"/>
                <Line x1="3" y1="21" x2="10" y2="14"/>
              </>
            )}
          </Svg>
        </Pressable>
      </View>

      {/* Main content */}
      <View className="flex-1">
        <View className={`${zoomed ? "flex-1" : ""} items-center justify-center p-4`} style={!zoomed ? { elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 32 } : undefined}>
          <Image
            source={{ uri: prescription.imageUrl }}
            className={`rounded-2xl ${zoomed ? "w-full h-full" : "w-full"}`}
            style={!zoomed ? { height: 256 } : undefined}
            resizeMode="contain"
          />
        </View>

        {!zoomed && (
          <ScrollView className="flex-1 bg-white rounded-t-3xl p-5 mt-auto">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>Prescription Details</Text>
              <Badge variant="neutral">View-only</Badge>
            </View>
            <View className="mb-4">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issued by</Text>
              <Text className="text-sm font-semibold text-slate-700">{prescription.doctor}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Medications prescribed</Text>
              {prescription.medications.map((m, i) => (
                <View key={m} className={`flex-row items-center gap-2.5 py-2 ${i > 0 ? "border-t border-sky-50" : ""}`}>
                  <View className="w-7 h-7 rounded-lg bg-sky-50 items-center justify-center">
                    <Text className="text-sm">💊</Text>
                  </View>
                  <Text className="text-sm text-slate-700 font-medium">{m}</Text>
                </View>
              ))}
            </View>
            <View className="h-8" />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ── Certificate Detail ────────────────────────────────────────────────────────

export function CertificateDetailScreen({ goBack, params, certificates = [] }: Props) {
  const insets = useSafeAreaInsets();
  const cert = params?.cert || (certificates && certificates.find((c: any) => c.id === params?.id)) || CERTIFICATES.find((c) => c.id === params?.id);

  if (!cert) {
    return (
      <View className="flex-1 bg-transparent">
        <Header title="Medical Certificate" onBack={goBack} />
        <View className="flex-1 justify-center">
          <EmptyState emoji="🔍" title="Not Found" message="The medical certificate could not be found." />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <LinearGradient
        colors={['#EFF8FF', '#DEF0FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-row items-center gap-3 px-4 pb-3"
        style={{ paddingTop: Math.max(insets.top, 12) + 8 }}
      >
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm" style={{ elevation: 2 }}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002D72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <View>
          <Text className="text-slate-800 text-base font-bold" style={{ fontFamily: "Outfit" }}>Medical Certificate</Text>
          <Text className="text-slate-400 text-xs">View-only document</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 p-4">
        <View
          className="bg-white rounded-3xl overflow-hidden"
          style={{ elevation: 8, shadowColor: '#0A2472', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: "#DEF0FF" }}
        >
          {/* Certificate header */}
          <View className="relative overflow-hidden px-6 py-6 items-center">
            <LinearGradient
              colors={ADMIN_PORTAL_GRADIENT.colors}
              start={ADMIN_PORTAL_GRADIENT.start}
              end={ADMIN_PORTAL_GRADIENT.end}
              style={StyleSheet.absoluteFill}
            />
            <View
              className="w-14 h-14 rounded-2xl bg-white items-center justify-center p-2 mb-3 shadow-md"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Image
                source={require("../../assets/images/cura-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase mb-1">University Clinic · CURA</Text>
            <Text
              className="text-white text-xl font-black"
              style={{
                fontFamily: "Outfit",
                textShadowColor: "rgba(0, 0, 0, 0.25)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              Medical Certificate
            </Text>
            <Text className="text-white/80 text-xs mt-1 font-semibold">Date issued: {cert.date}</Text>
          </View>

          <View className="px-5 py-5 flex-col gap-4">
            <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-row items-start gap-2">
              <Text>⚠️</Text>
              <Text className="flex-1 text-xs text-amber-700 font-medium leading-relaxed">This document is view-only and cannot be downloaded or printed from this app.</Text>
            </View>

            {[
              { label: "Purpose", value: cert.purpose },
              { label: "Diagnosis", value: cert.diagnosis || "—" },
              { label: "Recommendations", value: cert.recommendation || cert.recommendations || "—" },
            ].map((item, i) => (
              <View key={item.label} className={`pb-3 ${i < 2 ? "border-b border-sky-50" : ""}`}>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{
                    color: "#002D72",
                    fontFamily: "Outfit",
                  }}
                >
                  {item.label}
                </Text>
                <Text className="text-sm text-slate-700 leading-relaxed">{item.value}</Text>
              </View>
            ))}

            <View className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{
                  color: "#002D72",
                  fontFamily: "Outfit",
                }}
              >
                Attending Physician
              </Text>
              <Text className="text-sm font-bold text-slate-800">{cert.doctor || "Clinic Physician"}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">{cert.licenseNo || "UA Clinic Health Services"}</Text>
            </View>
          </View>
        </View>
        <View className="h-12" />
      </ScrollView>
    </View>
  );
}
