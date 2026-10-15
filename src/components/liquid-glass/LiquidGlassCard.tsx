import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
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
    // Requirement 8: press animation na scale 0.96 gamit ang spring
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

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
  };

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View
          className={className}
          style={[styles.card, cardStyle, animatedStyle, style]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View
      className={className}
      style={[styles.card, cardStyle, animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20, // Requirement 8: radius 20
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
  },
});
