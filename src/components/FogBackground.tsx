import React, { useEffect, useRef, memo } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  AppState,
  type AppStateStatus,
  StyleProp,
  ViewStyle,
} from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";

export interface FogBackgroundProps {
  /** Base background color (defaults to #FFFFFF) */
  baseColor?: string;
  /** Overall opacity multiplier (defaults to 1) */
  opacity?: number;
  /** Optional children to wrap inside */
  children?: React.ReactNode;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable FogBackground Component
 * - Top ~20% is clean pure white (#FFFFFF).
 * - Bottom ~80% (mula sa taas ng shield logo pababa) is filled with large animated
 *   blue smoke/fog plumes (#4DA3FF, #007AFF, #BFE0FF) drifting in 10-14s 60fps loops.
 */
export const FogBackground = memo(function FogBackground({
  baseColor = "#FFFFFF",
  opacity = 1,
  children,
  style,
}: FogBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Cloud 0: Above Shield Logo Crown Plume (~10.2s loop, starts at ~18-20% height directly above shield)
  const c0Tx = useSharedValue(0);
  const c0Ty = useSharedValue(0);
  const c0Scale = useSharedValue(1);

  // Cloud 1: Center-Upper Smoke Plume (~10.8s loop, around 24% height)
  const c1Tx = useSharedValue(0);
  const c1Ty = useSharedValue(0);
  const c1Scale = useSharedValue(1);

  // Cloud 2: Mid-Right Fog Billow (~12.2s loop, ~34% height)
  const c2Tx = useSharedValue(0);
  const c2Ty = useSharedValue(0);
  const c2Scale = useSharedValue(1);

  // Cloud 3: Mid-Left Smoke Billow (~11.0s loop, ~46% height)
  const c3Tx = useSharedValue(0);
  const c3Ty = useSharedValue(0);
  const c3Scale = useSharedValue(1);

  // Cloud 4: Lower-Center Large Cloud (~13.0s loop, ~58% height)
  const c4Tx = useSharedValue(0);
  const c4Ty = useSharedValue(0);
  const c4Scale = useSharedValue(1);

  // Cloud 5: Bottom Haze Mist (~9.8s loop, bottom safe area)
  const c5Tx = useSharedValue(0);
  const c5Ty = useSharedValue(0);
  const c5Scale = useSharedValue(1);

  const isRunningRef = useRef(false);

  const startAnimations = () => {
    if (reduceMotion || isRunningRef.current) return;
    isRunningRef.current = true;

    // Cloud 0: Above Shield drift
    c0Tx.value = withRepeat(
      withTiming(36, { duration: 10200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c0Ty.value = withRepeat(
      withTiming(24, { duration: 9600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c0Scale.value = withRepeat(
      withTiming(1.10, { duration: 10200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 1: Center-Upper drift
    c1Tx.value = withRepeat(
      withTiming(-38, { duration: 10800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Ty.value = withRepeat(
      withTiming(28, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Scale.value = withRepeat(
      withTiming(1.12, { duration: 10800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 2: Mid-Right counter-drift
    c2Tx.value = withRepeat(
      withTiming(-40, { duration: 12200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Ty.value = withRepeat(
      withTiming(30, { duration: 11400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Scale.value = withRepeat(
      withTiming(0.92, { duration: 12200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 3: Mid-Left swell
    c3Tx.value = withRepeat(
      withTiming(42, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Ty.value = withRepeat(
      withTiming(-28, { duration: 10400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Scale.value = withRepeat(
      withTiming(1.12, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 4: Lower-Center drift
    c4Tx.value = withRepeat(
      withTiming(-36, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Ty.value = withRepeat(
      withTiming(26, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Scale.value = withRepeat(
      withTiming(1.14, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 5: Bottom Haze
    c5Tx.value = withRepeat(
      withTiming(36, { duration: 9800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Ty.value = withRepeat(
      withTiming(-24, { duration: 9200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Scale.value = withRepeat(
      withTiming(0.94, { duration: 9800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  };

  const stopAnimations = () => {
    isRunningRef.current = false;
    cancelAnimation(c0Tx);
    cancelAnimation(c0Ty);
    cancelAnimation(c0Scale);
    cancelAnimation(c1Tx);
    cancelAnimation(c1Ty);
    cancelAnimation(c1Scale);
    cancelAnimation(c2Tx);
    cancelAnimation(c2Ty);
    cancelAnimation(c2Scale);
    cancelAnimation(c3Tx);
    cancelAnimation(c3Ty);
    cancelAnimation(c3Scale);
    cancelAnimation(c4Tx);
    cancelAnimation(c4Ty);
    cancelAnimation(c4Scale);
    cancelAnimation(c5Tx);
    cancelAnimation(c5Ty);
    cancelAnimation(c5Scale);
  };

  useEffect(() => {
    if (reduceMotion) {
      c0Tx.value = 0;
      c0Ty.value = 0;
      c0Scale.value = 1;
      c1Tx.value = 0;
      c1Ty.value = 0;
      c1Scale.value = 1;
      c2Tx.value = 0;
      c2Ty.value = 0;
      c2Scale.value = 1;
      c3Tx.value = 0;
      c3Ty.value = 0;
      c3Scale.value = 1;
      c4Tx.value = 0;
      c4Ty.value = 0;
      c4Scale.value = 1;
      c5Tx.value = 0;
      c5Ty.value = 0;
      c5Scale.value = 1;
      return;
    }

    startAnimations();

    const sub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          startAnimations();
        } else {
          stopAnimations();
        }
      }
    );

    return () => {
      sub.remove();
      stopAnimations();
    };
  }, [reduceMotion]);

  // Animated styles
  const cloud0Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c0Tx.value },
      { translateY: c0Ty.value },
      { scale: c0Scale.value },
    ],
  }));

  const cloud1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c1Tx.value },
      { translateY: c1Ty.value },
      { scale: c1Scale.value },
    ],
  }));

  const cloud2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c2Tx.value },
      { translateY: c2Ty.value },
      { scale: c2Scale.value },
    ],
  }));

  const cloud3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c3Tx.value },
      { translateY: c3Ty.value },
      { scale: c3Scale.value },
    ],
  }));

  const cloud4Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c4Tx.value },
      { translateY: c4Ty.value },
      { scale: c4Scale.value },
    ],
  }));

  const cloud5Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: c5Tx.value },
      { translateY: c5Ty.value },
      { scale: c5Scale.value },
    ],
  }));

  // Sizing calibrated for billowing smoke across 80% of screen
  const cloud0Size = Math.max(screenWidth * 1.35, 450);
  const cloud1Size = Math.max(screenWidth * 1.40, 480);
  const cloud2Size = Math.max(screenWidth * 1.35, 450);
  const cloud3Size = Math.max(screenWidth * 1.40, 470);
  const cloud4Size = Math.max(screenWidth * 1.45, 500);
  const cloud5Size = Math.max(screenWidth * 1.35, 450);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor: baseColor, opacity },
        style,
      ]}
    >
      {/* ── Top ~20% is left pure white #FFFFFF (clean header space) ── */}

      {/* ── 0) Cloud 0: Above Shield Logo Crown Mist (positioned high, well above the shield) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: Math.max(screenHeight * 0.06, 36),
            left: (screenWidth - cloud0Size) / 2,
            width: cloud0Size,
            height: cloud0Size,
          },
          cloud0Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCrown0" cx="50%" cy="50%" r="50%" fx="50%" fy="48%">
              <Stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.46" />
              <Stop offset="28%" stopColor="#BFE0FF" stopOpacity="0.32" />
              <Stop offset="58%" stopColor="#007AFF" stopOpacity="0.16" />
              <Stop offset="82%" stopColor="#BAE6FD" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCrown0)" />
        </Svg>
      </Animated.View>

      {/* ── 1) Cloud 1: Upper-Left Smoke Plume (higher above shield shoulders) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.14,
            left: -cloud1Size * 0.16,
            width: cloud1Size,
            height: cloud1Size,
          },
          cloud1Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogPlume1" cx="50%" cy="50%" r="50%" fx="48%" fy="48%">
              <Stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.48" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.32" />
              <Stop offset="60%" stopColor="#007AFF" stopOpacity="0.16" />
              <Stop offset="84%" stopColor="#BAE6FD" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogPlume1)" />
        </Svg>
      </Animated.View>

      {/* ── 2) Cloud 2: Upper-Right Smoke Billow (~22% height) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.22,
            right: -cloud2Size * 0.18,
            width: cloud2Size,
            height: cloud2Size,
          },
          cloud2Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogPlume2" cx="50%" cy="50%" r="50%" fx="52%" fy="48%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.42" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.28" />
              <Stop offset="62%" stopColor="#BFE0FF" stopOpacity="0.14" />
              <Stop offset="84%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogPlume2)" />
        </Svg>
      </Animated.View>

      {/* ── 3) Cloud 3: Mid-Left Smoke Billow (~36% height) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.36,
            left: -cloud3Size * 0.20,
            width: cloud3Size,
            height: cloud3Size,
          },
          cloud3Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogPlume3" cx="50%" cy="50%" r="50%" fx="48%" fy="52%">
              <Stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.46" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.28" />
              <Stop offset="62%" stopColor="#007AFF" stopOpacity="0.14" />
              <Stop offset="85%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogPlume3)" />
        </Svg>
      </Animated.View>

      {/* ── 4) Cloud 4: Center-Lower Large Cloud (~48% height) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.48,
            left: (screenWidth - cloud4Size) / 2,
            width: cloud4Size,
            height: cloud4Size,
          },
          cloud4Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogPlume4" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.40" />
              <Stop offset="30%" stopColor="#007AFF" stopOpacity="0.26" />
              <Stop offset="60%" stopColor="#BFE0FF" stopOpacity="0.14" />
              <Stop offset="82%" stopColor="#BAE6FD" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogPlume4)" />
        </Svg>
      </Animated.View>

      {/* ── 5) Cloud 5: Bottom Haze Mist (covers bottom safe area & sheet) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            bottom: -cloud5Size * 0.14,
            right: -cloud5Size * 0.18,
            width: cloud5Size,
            height: cloud5Size,
          },
          cloud5Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogPlume5" cx="50%" cy="50%" r="50%" fx="52%" fy="48%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.36" />
              <Stop offset="28%" stopColor="#BFE0FF" stopOpacity="0.24" />
              <Stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.10" />
              <Stop offset="82%" stopColor="#BAE6FD" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogPlume5)" />
        </Svg>
      </Animated.View>

      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    zIndex: 0,
  },
  blobBase: {
    position: "absolute",
  },
});
