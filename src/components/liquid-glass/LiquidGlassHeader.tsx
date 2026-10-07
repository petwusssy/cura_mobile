import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiquidGlassHeaderProps } from "./types";

export function LiquidGlassHeader({
  title,
  subtitle,
  scrollY,
  isDark = false,
  rightAction,
}: LiquidGlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = Math.max(insets.top, 20) + 48;

  // Requirement 7: Navigation bar na may title na nagiging blur header pag nag-scroll
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [20, 60],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const animatedInlineTitleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [20, 60],
      [8, 0],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [30, 60],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.headerContainer,
        {
          height: headerHeight,
          paddingTop: insets.top,
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedHeaderStyle]}>
        <BlurView
          intensity={90}
          tint={isDark ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            styles.blurBackdrop,
            {
              borderBottomColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.08)",
              backgroundColor: isDark
                ? "rgba(20, 20, 22, 0.72)"
                : "rgba(248, 248, 250, 0.72)",
            },
          ]}
        />
      </Animated.View>

      <View style={styles.contentRow}>
        <View style={styles.spacer} />
        <Animated.View style={[styles.titleWrapper, animatedInlineTitleStyle]}>
          <Text
            numberOfLines={1}
            style={[
              styles.inlineTitle,
              { color: isDark ? "#FFFFFF" : "#000000" },
            ]}
          >
            {title}
          </Text>
        </Animated.View>
        <View style={styles.rightActionWrapper}>
          {rightAction}
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Large Title Component to put inside the ScrollView at the top
 */
export function LiquidGlassLargeTitle({
  title,
  subtitle,
  isDark = false,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  isDark?: boolean;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.largeTitleSection}>
      <View style={styles.largeTitleRow}>
        <View style={styles.titleColumn}>
          {subtitle ? (
            <Text
              style={[
                styles.subtitleText,
                { color: isDark ? "#8E8E93" : "#6E6E73" },
              ]}
            >
              {subtitle.toUpperCase()}
            </Text>
          ) : null}
          <Text
            style={[
              styles.largeTitleText,
              { color: isDark ? "#FFFFFF" : "#000000" },
            ]}
          >
            {title}
          </Text>
        </View>
        {rightAction ? <View>{rightAction}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 900,
  },
  blurBackdrop: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  spacer: {
    width: 44,
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
  },
  inlineTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
    fontFamily: Platform.select({ ios: "System", default: undefined }),
  },
  rightActionWrapper: {
    width: 44,
    alignItems: "flex-end",
  },
  largeTitleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  largeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  titleColumn: {
    flex: 1,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: "System", default: undefined }),
  },
  largeTitleText: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: "System", default: undefined }),
  },
});
