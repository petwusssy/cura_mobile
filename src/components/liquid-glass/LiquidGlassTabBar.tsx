import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Platform, StyleSheet, LayoutChangeEvent } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  useDerivedValue,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiquidGlassTabBarProps, TabItem } from "./types";

interface TabButtonProps {
  tab: TabItem;
  index: number;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  tabWidth: number;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 190,
  mass: 0.8,
};

const TAP_SPRING = {
  damping: 12,
  stiffness: 350,
};

function TabButton({ tab, isActive, onPress, isDark }: TabButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Requirement 5: Scale 1.0 -> 0.9 -> 1.0 gamit ang spring + light haptic feedback
    scale.value = withSequence(
      withSpring(0.9, TAP_SPRING),
      withSpring(1.0, { damping: 14, stiffness: 220 })
    );

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    onPress();
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const activeColor = "#007AFF"; // iOS blue
  const inactiveColor = isDark ? "#98989D" : "#8E8E93"; // iOS gray
  const color = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabButton}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
        {tab.icon({ active: isActive, color, size: 23 })}
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color,
            fontWeight: isActive ? "600" : "500",
          },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export function LiquidGlassTabBar({
  tabs,
  activeKey,
  onSelect,
  isDark = false,
  scrollY,
  autoHideOnScroll = true,
}: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === activeKey)
  );

  const indicatorX = useSharedValue(0);

  // Requirement 4: Glass pill highlight sliding spring animation
  useEffect(() => {
    if (containerWidth > 0 && tabs.length > 0) {
      const tabWidth = (containerWidth - 8) / tabs.length;
      const targetX = 4 + activeIndex * tabWidth;
      indicatorX.value = withSpring(targetX, SPRING_CONFIG);
    }
  }, [activeIndex, containerWidth, tabs.length]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth > 0 && tabs.length > 0 ? (containerWidth - 8) / tabs.length : 0;
    return {
      transform: [{ translateX: indicatorX.value }],
      width: Math.max(0, tabWidth),
    };
  });

  // Requirement 6: Scroll behavior (fade/shrink on scroll down, return on scroll up)
  const prevScrollY = useSharedValue(0);
  const isHidden = useSharedValue(0); // 0 = visible, 1 = hidden

  if (scrollY && autoHideOnScroll) {
    useDerivedValue(() => {
      const currentY = scrollY.value;
      const diff = currentY - prevScrollY.value;

      if (currentY > 60 && diff > 10) {
        // Scrolling down
        isHidden.value = withSpring(1, { damping: 20, stiffness: 180 });
      } else if (diff < -8 || currentY <= 20) {
        // Scrolling up or at the top
        isHidden.value = withSpring(0, { damping: 20, stiffness: 180 });
      }

      prevScrollY.value = currentY;
      return currentY;
    });
  }

  const animatedContainerStyle = useAnimatedStyle(() => {
    const hidden = isHidden.value;
    return {
      transform: [
        { translateY: hidden * 84 },
        { scale: 1 - hidden * 0.08 },
      ],
      opacity: 1 - hidden * 0.85,
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
      const tabWidth = (width - 8) / tabs.length;
      indicatorX.value = 4 + activeIndex * tabWidth;
    }
  };

  const bottomMargin = Math.max(insets.bottom, 16);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper,
        {
          bottom: bottomMargin,
        },
        animatedContainerStyle,
      ]}
    >
      {/* Outer soft shadow container */}
      <View
        style={[
          styles.shadowContainer,
          {
            shadowColor: "#000000",
            shadowOpacity: isDark ? 0.38 : 0.12,
          },
        ]}
      >
        {/* Requirement 1 & 2: Frosted glass capsule blur + thin white border */}
        <BlurView
          intensity={85}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.blurCapsule,
            {
              borderColor: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.35)",
              backgroundColor: isDark
                ? "rgba(28, 28, 30, 0.65)"
                : "rgba(255, 255, 255, 0.62)",
            },
          ]}
          onLayout={onLayout}
        >
          {/* Requirement 4: Glass pill highlight behind active icon */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 122, 255, 0.09)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 122, 255, 0.18)",
                },
                animatedIndicatorStyle,
              ]}
            />
          )}

          {/* Requirement 3: 5 tabs with icon & 10-11px labels */}
          <View style={styles.tabsRow}>
            {tabs.map((tab, idx) => {
              const isActive = tab.key === activeKey;
              const tabWidth = containerWidth > 0 ? (containerWidth - 8) / tabs.length : 0;
              return (
                <TabButton
                  key={tab.key}
                  tab={tab}
                  index={idx}
                  isActive={isActive}
                  onPress={() => onSelect(tab.key)}
                  isDark={isDark}
                  tabWidth={tabWidth}
                />
              );
            })}
          </View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  shadowContainer: {
    borderRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 12,
  },
  blurCapsule: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 7,
    paddingHorizontal: 4,
    height: 64,
    justifyContent: "center",
  },
  slidingPill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: 26,
    borderWidth: 1,
    zIndex: 1,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  iconWrapper: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.2,
    fontFamily: Platform.select({ ios: "System", default: undefined }),
  },
});
