import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polyline, Rect, Line } from "react-native-svg";
import type { Screen } from "../types";
import { Card, Badge, Header, EmptyState } from "../components/Shell";
import { PRESCRIPTIONS, CERTIFICATES, TRANSFERS } from "../data";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  params?: { tab?: string; id?: string; cert?: any };
  certificates?: any[];
}

type Tab = "prescriptions" | "certificates" | "transfers";

// ── Documents ─────────────────────────────────────────────────────────────────

export function DocumentsScreen({ navigate, goBack, params, certificates }: Props) {
  const [tab, setTab] = useState<Tab>((params?.tab as Tab) || "prescriptions");

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "prescriptions", label: "Prescriptions", icon: "🩺", count: PRESCRIPTIONS.length },
    { id: "certificates",  label: "Certificates",  icon: "📄", count: (certificates && certificates.length > 0) ? certificates.length : CERTIFICATES.length },
    { id: "transfers",     label: "Transfers",     icon: "🚑", count: TRANSFERS.length },
  ];

  return (
    <View className="flex-1 bg-transparent">
      <Header title="My Documents" onBack={goBack} />

      {/* Tabs */}
      <View className="bg-white border-b border-sky-100">
        <View className="flex-row">
          {tabs.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              className="flex-1 items-center gap-1 py-3 relative"
            >
              <View className="relative">
                <Text className="text-lg">{t.icon}</Text>
                <View
                  className="absolute -top-1 -right-2 rounded-full items-center justify-center"
                  style={{ backgroundColor: tab === t.id ? "#0B2136" : "#CBD5E1", width: 16, height: 16 }}
                >
                  <Text className="text-white font-extrabold" style={{ fontSize: 8 }}>{t.count}</Text>
                </View>
              </View>
              <Text 
                className={`mt-0.5 text-[10px] font-bold ${tab === t.id ? "text-[#0B2136]" : "text-slate-400"}`}
              >
                {t.label}
              </Text>
              {tab === t.id && (
                <LinearGradient
                  colors={['#0B2136', '#0B2136']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                />
              )}
            </Pressable>
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
      <View className="pt-8">
        <EmptyState emoji="🩺" title="No Prescriptions" message="You don't have any medical prescriptions yet." />
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
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  if (certsToDisplay.length === 0) {
    return (
      <View className="pt-8">
        <EmptyState emoji="📄" title="No Certificates" message="You don't have any medical certificates yet." />
      </View>
    );
  }

  return (
    <View className="flex-col gap-3">
      {certsToDisplay.map((c) => (
        <Card key={c.id} onPress={() => navigate("cert-detail", { id: c.id, cert: c })}>
          <View className="flex-row items-start gap-3">
            <LinearGradient
              colors={['#ECFEFF', '#BAE6FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-11 h-11 rounded-xl items-center justify-center"
            >
              <Text className="text-xl">📄</Text>
            </LinearGradient>
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
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6"/>
              </Svg>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function TransferList() {
  if (TRANSFERS.length === 0) {
    return (
      <View className="pt-8">
        <EmptyState emoji="🚑" title="No Transfers" message="You don't have any hospital transfer records yet." />
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
              colors={['#F43F5E', '#FB7185']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            />
            <View className="flex-row items-start justify-between mb-3 mt-1">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-rose-50 items-center justify-center">
                  <Text className="text-lg">🚑</Text>
                </View>
                <Text className="text-xs font-bold text-rose-500 uppercase tracking-wide">Hospital Transfer</Text>
              </View>
              <Badge variant={cfg.badge}>{cfg.label}</Badge>
            </View>
            <Text className="text-base font-bold text-slate-800 mb-1">{t.receivingHospital}</Text>
            <Text className="text-xs text-slate-400 mb-2">
              {t.date} · {t.time} · {t.transport}
            </Text>
            <View className="bg-rose-50 rounded-xl p-3 border border-rose-100">
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
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0994E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <View>
          <Text className="text-slate-800 text-base font-bold">Medical Certificate</Text>
          <Text className="text-slate-400 text-xs">View-only document</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 p-4">
        <View
          className="bg-white rounded-3xl overflow-hidden"
          style={{ elevation: 8, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: "#DEF0FF" }}
        >
          {/* Certificate header */}
          <LinearGradient
            colors={['#0994E8', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 py-6 items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mb-3">
              <Svg width="24" height="24" viewBox="0 0 46 46" fill="none">
                <Rect x="18" y="4" width="10" height="38" rx="5" fill="white"/>
                <Rect x="4" y="18" width="38" height="10" rx="5" fill="white"/>
              </Svg>
            </View>
            <Text className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-1">University Clinic · CURA</Text>
            <Text className="text-white text-xl font-bold" style={{ fontFamily: "Outfit" }}>Medical Certificate</Text>
            <Text className="text-white/60 text-xs mt-1">Date issued: {cert.date}</Text>
          </LinearGradient>

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
                <Text className="text-[10px] font-bold text-cura-500 uppercase tracking-wider mb-1">{item.label}</Text>
                <Text className="text-sm text-slate-700 leading-relaxed">{item.value}</Text>
              </View>
            ))}

            <View className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attending Physician</Text>
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
