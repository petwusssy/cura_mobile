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
import Svg, { Defs, RadialGradient, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";

export interface FogGradientBackgroundProps {
  /** Top color of the vertical gradient (defaults to #007AFF) */
  topColor?: string;
  /** Mid color of the vertical gradient (defaults to #87CEEB) */
  midColor?: string;
  /** Bottom color of the vertical gradient (defaults to #FFFFFF) */
  bottomColor?: string;
  /** Overall opacity multiplier (defaults to 1) */
  opacity?: number;
  /** Optional children to wrap inside */
  children?: React.ReactNode;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable FogGradientBackground Component
 * Vertical gradient pababa: Blue #007AFF (taas) -> Sky Blue #87CEEB (gitna) -> White #FFFFFF (baba)
 * with organic, animated blurred smoke/fog clouds (opacity 0.3-0.5, blur ~80-120)
 * softening the transitions with 10-14s 60fps drift animations.
 */
export const FogGradientBackground = memo(function FogGradientBackground({
  topColor = "#007AFF",
  midColor = "#87CEEB",
  bottomColor = "#FFFFFF",
  opacity = 1,
  children,
  style,
}: FogGradientBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Cloud 1: Upper Blend Zone Left (between #007AFF and #87CEEB) ~11.5s loop
  const c1Tx = useSharedValue(0);
  const c1Ty = useSharedValue(0);
  const c1Scale = useSharedValue(1);

  // Cloud 2: Upper Blend Zone Right (between #007AFF and #87CEEB) ~13.2s loop
  const c2Tx = useSharedValue(0);
  const c2Ty = useSharedValue(0);
  const c2Scale = useSharedValue(1);

  // Cloud 3: Mid Center Floating Fog Puff ~12.0s loop
  const c3Tx = useSharedValue(0);
  const c3Ty = useSharedValue(0);
  const c3Scale = useSharedValue(1);

  // Cloud 4: Lower Blend Zone Left (between #87CEEB and #FFFFFF) ~10.8s loop
  const c4Tx = useSharedValue(0);
  const c4Ty = useSharedValue(0);
  const c4Scale = useSharedValue(1);

  // Cloud 5: Lower Blend Zone Right (between #87CEEB and #FFFFFF) ~12.6s loop
  const c5Tx = useSharedValue(0);
  const c5Ty = useSharedValue(0);
  const c5Scale = useSharedValue(1);

  const isRunningRef = useRef(false);

  const startAnimations = () => {
    if (reduceMotion || isRunningRef.current) return;
    isRunningRef.current = true;

    // Cloud 1: Drift horizontal ±45px, vertical ±24px (11.5s)
    c1Tx.value = withRepeat(
      withTiming(45, { duration: 11500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Ty.value = withRepeat(
      withTiming(24, { duration: 10800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Scale.value = withRepeat(
      withTiming(1.10, { duration: 11500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 2: Drift horizontal -42px, vertical 28px (13.2s)
    c2Tx.value = withRepeat(
      withTiming(-42, { duration: 13200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Ty.value = withRepeat(
      withTiming(28, { duration: 12400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Scale.value = withRepeat(
      withTiming(0.92, { duration: 13200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 3: Drift horizontal 36px, vertical -30px (12.0s)
    c3Tx.value = withRepeat(
      withTiming(36, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Ty.value = withRepeat(
      withTiming(-30, { duration: 11400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Scale.value = withRepeat(
      withTiming(1.12, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 4: Drift horizontal -38px, vertical -26px (10.8s)
    c4Tx.value = withRepeat(
      withTiming(-38, { duration: 10800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Ty.value = withRepeat(
      withTiming(-26, { duration: 10200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Scale.value = withRepeat(
      withTiming(1.08, { duration: 10800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 5: Drift horizontal 40px, vertical 22px (12.6s)
    c5Tx.value = withRepeat(
      withTiming(40, { duration: 12600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Ty.value = withRepeat(
      withTiming(22, { duration: 11800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Scale.value = withRepeat(
      withTiming(0.94, { duration: 12600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  };

  const stopAnimations = () => {
    isRunningRef.current = false;
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

  // Sizing calibrated to fill transition zones with wide blur plumes (~80-120)
  const cloudSize1 = Math.max(screenWidth * 1.35, 450);
  const cloudSize2 = Math.max(screenWidth * 1.30, 430);
  const cloudSize3 = Math.max(screenWidth * 1.45, 480);
  const cloudSize4 = Math.max(screenWidth * 1.35, 450);
  const cloudSize5 = Math.max(screenWidth * 1.30, 430);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { opacity },
        style,
      ]}
    >
      {/* ── 1) Base Vertical Gradient: Blue (#007AFF) -> Sky Blue (#87CEEB) -> White (#FFFFFF) ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="baseVerticalGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={topColor} stopOpacity="1" />
              <Stop offset="28%" stopColor={topColor} stopOpacity="0.95" />
              <Stop offset="48%" stopColor={midColor} stopOpacity="0.92" />
              <Stop offset="72%" stopColor={midColor} stopOpacity="0.65" />
              <Stop offset="90%" stopColor={bottomColor} stopOpacity="0.95" />
              <Stop offset="100%" stopColor={bottomColor} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#baseVerticalGradient)" />
        </Svg>
      </View>

      {/* ── 2) Upper Fog Blend Cloud 1 (Left transition from #007AFF to #87CEEB) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.12,
            left: -cloudSize1 * 0.25,
            width: cloudSize1,
            height: cloudSize1,
          },
          cloud1Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogBlend1" cx="50%" cy="50%" r="50%" fx="46%" fy="48%">
              <Stop offset="0%" stopColor="#87CEEB" stopOpacity="0.48" />
              <Stop offset="30%" stopColor="#007AFF" stopOpacity="0.35" />
              <Stop offset="60%" stopColor="#87CEEB" stopOpacity="0.20" />
              <Stop offset="82%" stopColor="#87CEEB" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#87CEEB" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlend1)" />
        </Svg>
      </Animated.View>

      {/* ── 3) Upper Fog Blend Cloud 2 (Right transition from #007AFF to #87CEEB) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.16,
            right: -cloudSize2 * 0.22,
            width: cloudSize2,
            height: cloudSize2,
          },
          cloud2Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogBlend2" cx="50%" cy="50%" r="50%" fx="52%" fy="48%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.45" />
              <Stop offset="32%" stopColor="#87CEEB" stopOpacity="0.32" />
              <Stop offset="62%" stopColor="#87CEEB" stopOpacity="0.16" />
              <Stop offset="84%" stopColor="#87CEEB" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#87CEEB" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlend2)" />
        </Svg>
      </Animated.View>

      {/* ── 4) Mid-Section Diffuse Smoke Swirl (Center atmosphere) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.32,
            left: (screenWidth - cloudSize3) / 2,
            width: cloudSize3,
            height: cloudSize3,
          },
          cloud3Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogBlend3" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.46" />
              <Stop offset="28%" stopColor="#87CEEB" stopOpacity="0.34" />
              <Stop offset="58%" stopColor="#007AFF" stopOpacity="0.18" />
              <Stop offset="82%" stopColor="#87CEEB" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#87CEEB" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlend3)" />
        </Svg>
      </Animated.View>

      {/* ── 5) Lower Fog Blend Cloud 4 (Left transition from #87CEEB to #FFFFFF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.48,
            left: -cloudSize4 * 0.22,
            width: cloudSize4,
            height: cloudSize4,
          },
          cloud4Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogBlend4" cx="50%" cy="50%" r="50%" fx="48%" fy="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.50" />
              <Stop offset="32%" stopColor="#87CEEB" stopOpacity="0.36" />
              <Stop offset="64%" stopColor="#FFFFFF" stopOpacity="0.20" />
              <Stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlend4)" />
        </Svg>
      </Animated.View>

      {/* ── 6) Lower Fog Blend Cloud 5 (Right transition from #87CEEB to #FFFFFF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.52,
            right: -cloudSize5 * 0.24,
            width: cloudSize5,
            height: cloudSize5,
          },
          cloud5Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogBlend5" cx="50%" cy="50%" r="50%" fx="52%" fy="48%">
              <Stop offset="0%" stopColor="#87CEEB" stopOpacity="0.46" />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.38" />
              <Stop offset="62%" stopColor="#87CEEB" stopOpacity="0.18" />
              <Stop offset="84%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlend5)" />
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
