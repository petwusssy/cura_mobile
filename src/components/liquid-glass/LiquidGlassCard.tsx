import React from "react";
import { Pressable, StyleSheet, View, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { LiquidGlassCardProps } from "./types";

const SPRING_PRESS_IN = {
  damping: 14,
  stiffness: 320,
};

const SPRING_PRESS_OUT = {
  damping: 14,
  stiffness: 240,
};

export function LiquidGlassCard({
  children,
  onPress,
  isDark = false,
  className = "",
  style,
}: LiquidGlassCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING_PRESS_IN);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, SPRING_PRESS_OUT);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const webGlassStyle: ViewStyle = Platform.OS === "web" ? {
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    boxShadow: isDark
      ? "0 16px 36px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(255, 255, 255, 0.06)"
      : "0 16px 36px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(255, 255, 255, 0.2)",
  } as ViewStyle : {};

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? "rgba(28, 28, 30, 0.65)" : "rgba(255, 255, 255, 0.65)",
    borderColor: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.60)",
    borderTopColor: isDark ? "rgba(255, 255, 255, 0.38)" : "rgba(255, 255, 255, 0.85)",
  };

  const content = (
    <>
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 65}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isDark
            ? ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.02)", "transparent"]
            : ["rgba(255, 255, 255, 0.45)", "rgba(255, 255, 255, 0.10)", "transparent"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={{ position: "relative", zIndex: 1 }}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View
          className={className}
          style={[styles.card, cardStyle, webGlassStyle, animatedStyle, style]}
        >
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View
      className={className}
      style={[styles.card, cardStyle, webGlassStyle, animatedStyle, style]}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    position: "relative",
  },
});
