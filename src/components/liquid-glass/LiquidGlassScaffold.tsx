import React, { type ReactNode } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiquidGlassTabBar } from "./LiquidGlassTabBar";
import { LiquidGlassHeader, LiquidGlassLargeTitle } from "./LiquidGlassHeader";
import type { TabItem } from "./types";

interface LiquidGlassScaffoldProps {
  tabs: TabItem[];
  activeKey: string;
  onSelectTab: (key: string) => void;
  title: string;
  subtitle?: string;
  isDark?: boolean;
  headerRightAction?: ReactNode;
  children: ReactNode;
}

export function LiquidGlassScaffold({
  tabs,
  activeKey,
  onSelectTab,
  title,
  subtitle,
  isDark = false,
  headerRightAction,
  children,
}: LiquidGlassScaffoldProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerHeight = Math.max(insets.top, 20) + 48;

  return (
    <View
      style={[
        styles.container,
        {
          // Requirement 8: Background ng screen ay #F2F2F7 (light) at #000 (dark)
          backgroundColor: isDark ? "#000000" : "#F2F2F7",
        },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top sticky blur header */}
      <LiquidGlassHeader
        title={title}
        subtitle={subtitle}
        scrollY={scrollY}
        isDark={isDark}
        rightAction={headerRightAction}
      />

      {/* Scrollable screen content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: 110, // Safe padding for bottom floating capsule tab bar
        }}
        showsVerticalScrollIndicator={false}
      >
        <LiquidGlassLargeTitle
          title={title}
          subtitle={subtitle}
          isDark={isDark}
          rightAction={headerRightAction}
        />
        {children}
      </Animated.ScrollView>

      {/* Floating capsule tab bar */}
      <LiquidGlassTabBar
        tabs={tabs}
        activeKey={activeKey}
        onSelect={onSelectTab}
        isDark={isDark}
        scrollY={scrollY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
