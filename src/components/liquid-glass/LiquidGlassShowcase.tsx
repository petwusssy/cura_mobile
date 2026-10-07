import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Svg, { Path, Rect, Circle, Polyline } from "react-native-svg";
import { LiquidGlassScaffold } from "./LiquidGlassScaffold";
import { LiquidGlassCard } from "./LiquidGlassCard";
import type { TabItem } from "./types";

export function LiquidGlassShowcase() {
  const [activeTab, setActiveTab] = useState("today");
  const [isDark, setIsDark] = useState(false);

  // Requirement 3: 5 tabs, bawat isa may icon at maikling label (10-11px)
  const tabs: TabItem[] = [
    {
      key: "today",
      label: "Today",
      icon: ({ color, size }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
      ),
    },
    {
      key: "games",
      label: "Games",
      icon: ({ color, size }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="6" width="20" height="12" rx="4" />
          <Path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
        </Svg>
      ),
    },
    {
      key: "apps",
      label: "Apps",
      icon: ({ color, size }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
        </Svg>
      ),
    },
    {
      key: "arcade",
      label: "Arcade",
      icon: ({ color, size }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      ),
    },
    {
      key: "search",
      label: "Search",
      icon: ({ color, size }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="11" cy="11" r="7" />
          <Path d="M21 21l-4.35-4.35" />
        </Svg>
      ),
    },
  ];

  const headerRightAction = (
    <Pressable
      onPress={() => setIsDark((prev) => !prev)}
      style={[
        styles.themeToggle,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#FFFFFF" : "#000000" }}>
        {isDark ? "Light" : "Dark"}
      </Text>
    </Pressable>
  );

  return (
    <LiquidGlassScaffold
      tabs={tabs}
      activeKey={activeTab}
      onSelectTab={setActiveTab}
      title="Today"
      subtitle="Wednesday, October 7"
      isDark={isDark}
      headerRightAction={headerRightAction}
    >
      {/* Featured Hero Card */}
      <LiquidGlassCard
        isDark={isDark}
        onPress={() => {}}
      >
        <Text style={[styles.cardSubtitle, { color: isDark ? "#8E8E93" : "#6E6E73" }]}>
          MAJOR UPDATE
        </Text>
        <Text style={[styles.cardTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          iOS 26 Liquid Glass Design
        </Text>
        <Text style={[styles.cardDescription, { color: isDark ? "#AEAEB2" : "#3C3C43" }]}>
          Ultra-smooth frosted glass capsule navigation with dynamic spring animations and fluid gestures.
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.appIconMock} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.appMockName, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              Cura Mobile Health
            </Text>
            <Text style={[styles.appMockCat, { color: isDark ? "#8E8E93" : "#8E8E93" }]}>
              Medical & Teleconsult
            </Text>
          </View>
          <View style={styles.getButton}>
            <Text style={styles.getButtonText}>GET</Text>
          </View>
        </View>
      </LiquidGlassCard>

      {/* Card 2 */}
      <LiquidGlassCard
        isDark={isDark}
        onPress={() => {}}
      >
        <Text style={[styles.cardSubtitle, { color: isDark ? "#8E8E93" : "#6E6E73" }]}>
          NOW TRENDING
        </Text>
        <Text style={[styles.cardTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          Floating Blur Navigation
        </Text>
        <Text style={[styles.cardDescription, { color: isDark ? "#AEAEB2" : "#3C3C43" }]}>
          Pindutin ang card para maranasan ang spring scale 0.96 effect, at i-scroll pababa para makita ang auto-fade ng tab bar.
        </Text>
      </LiquidGlassCard>

      {/* Card 3 */}
      <LiquidGlassCard
        isDark={isDark}
        onPress={() => {}}
      >
        <Text style={[styles.cardSubtitle, { color: isDark ? "#8E8E93" : "#6E6E73" }]}>
          DESIGN SPECS
        </Text>
        <Text style={[styles.cardTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          Apple App Store Aesthetics
        </Text>
        <Text style={[styles.cardDescription, { color: isDark ? "#AEAEB2" : "#3C3C43" }]}>
          • Radius 32 floating capsule{"\n"}
          • Sliding spring glass pill highlight{"\n"}
          • 1.0 → 0.9 → 1.0 tap spring + haptics{"\n"}
          • Top large title collapsing blur header
        </Text>
      </LiquidGlassCard>

      {/* Additional filler card for scroll demonstration */}
      <LiquidGlassCard
        isDark={isDark}
        onPress={() => {}}
      >
        <Text style={[styles.cardSubtitle, { color: isDark ? "#8E8E93" : "#6E6E73" }]}>
          SCROLL TEST
        </Text>
        <Text style={[styles.cardTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          Seamless 60fps Physics
        </Text>
        <Text style={[styles.cardDescription, { color: isDark ? "#AEAEB2" : "#3C3C43" }]}>
          Reanimated native thread driver para sa buttery smooth 60fps transitions.
        </Text>
      </LiquidGlassCard>
    </LiquidGlassScaffold>
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(142, 142, 147, 0.2)",
  },
  appIconMock: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },
  appMockName: {
    fontSize: 15,
    fontWeight: "600",
  },
  appMockCat: {
    fontSize: 12,
  },
  getButton: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
  },
  getButtonText: {
    color: "#007AFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
