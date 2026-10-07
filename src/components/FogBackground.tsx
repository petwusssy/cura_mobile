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
 * Fills the ENTIRE background with seamless ambient blue smoke, fog gradients,
 * and 5 drifting animated cloud plumes (#4DA3FF, #007AFF, #BFE0FF, #7DD3FC)
 * with continuous 8-12s 60fps organic drift & breathing loops.
 */
export const FogBackground = memo(function FogBackground({
  baseColor = "#FFFFFF",
  opacity = 1,
  children,
  style,
}: FogBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Cloud 1: Upper-Left Swirl (~9.5s)
  const c1Tx = useSharedValue(0);
  const c1Ty = useSharedValue(0);
  const c1Scale = useSharedValue(1);

  // Cloud 2: Upper-Right Swirl (~11.2s)
  const c2Tx = useSharedValue(0);
  const c2Ty = useSharedValue(0);
  const c2Scale = useSharedValue(1);

  // Cloud 3: Center Core Fog Swirl (~10.4s) - covers central hero area
  const c3Tx = useSharedValue(0);
  const c3Ty = useSharedValue(0);
  const c3Scale = useSharedValue(1);

  // Cloud 4: Mid-Lower Left Haze (~10.0s)
  const c4Tx = useSharedValue(0);
  const c4Ty = useSharedValue(0);
  const c4Scale = useSharedValue(1);

  // Cloud 5: Bottom-Right Mist (~8.8s)
  const c5Tx = useSharedValue(0);
  const c5Ty = useSharedValue(0);
  const c5Scale = useSharedValue(1);

  const isRunningRef = useRef(false);

  const startAnimations = () => {
    if (reduceMotion || isRunningRef.current) return;
    isRunningRef.current = true;

    // Cloud 1: Upper-Left (9.5s)
    c1Tx.value = withRepeat(
      withTiming(45, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Ty.value = withRepeat(
      withTiming(36, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c1Scale.value = withRepeat(
      withTiming(1.12, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 2: Upper-Right (11.2s)
    c2Tx.value = withRepeat(
      withTiming(-42, { duration: 11200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Ty.value = withRepeat(
      withTiming(38, { duration: 10600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c2Scale.value = withRepeat(
      withTiming(0.92, { duration: 11200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 3: Center Core (10.4s)
    c3Tx.value = withRepeat(
      withTiming(35, { duration: 10400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Ty.value = withRepeat(
      withTiming(-32, { duration: 9800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c3Scale.value = withRepeat(
      withTiming(1.14, { duration: 10400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 4: Mid-Lower Left (10.0s)
    c4Tx.value = withRepeat(
      withTiming(40, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Ty.value = withRepeat(
      withTiming(-28, { duration: 9600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c4Scale.value = withRepeat(
      withTiming(1.10, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cloud 5: Bottom-Right (8.8s)
    c5Tx.value = withRepeat(
      withTiming(-38, { duration: 8800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Ty.value = withRepeat(
      withTiming(-34, { duration: 8400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    c5Scale.value = withRepeat(
      withTiming(0.94, { duration: 8800, easing: Easing.inOut(Easing.ease) }),
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

  // Animated styles for each smoke cloud
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

  // Sizing calibrated to overlap seamlessly across the whole screen
  const cloud1Size = Math.max(screenWidth * 1.35, 460);
  const cloud2Size = Math.max(screenWidth * 1.30, 440);
  const cloud3Size = Math.max(screenWidth * 1.45, 500);
  const cloud4Size = Math.max(screenWidth * 1.35, 460);
  const cloud5Size = Math.max(screenWidth * 1.40, 480);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor: baseColor, opacity },
        style,
      ]}
    >
      {/* ── 1) Full-Screen Ambient Fog Mist (Seamlessly fills the entire background) ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="fullScreenFogMesh" x1="0.2" y1="0" x2="0.8" y2="1">
              <Stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.55" />
              <Stop offset="25%" stopColor="#EFF8FF" stopOpacity="0.35" />
              <Stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.45" />
              <Stop offset="75%" stopColor="#DBEAFE" stopOpacity="0.40" />
              <Stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.50" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#fullScreenFogMesh)" />
        </Svg>
      </View>

      {/* ── 2) Cloud 1: Upper-Left Smoke Swirl (#4DA3FF / #BFE0FF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: -cloud1Size * 0.18,
            left: -cloud1Size * 0.20,
            width: cloud1Size,
            height: cloud1Size,
          },
          cloud1Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCloud1" cx="50%" cy="50%" r="50%" fx="46%" fy="46%">
              <Stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.40" />
              <Stop offset="28%" stopColor="#4DA3FF" stopOpacity="0.28" />
              <Stop offset="56%" stopColor="#BFE0FF" stopOpacity="0.18" />
              <Stop offset="80%" stopColor="#BAE6FD" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCloud1)" />
        </Svg>
      </Animated.View>

      {/* ── 3) Cloud 2: Upper-Right Fog Billow (#007AFF / #4DA3FF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: -cloud2Size * 0.15,
            right: -cloud2Size * 0.22,
            width: cloud2Size,
            height: cloud2Size,
          },
          cloud2Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCloud2" cx="50%" cy="50%" r="50%" fx="54%" fy="46%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.36" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.25" />
              <Stop offset="62%" stopColor="#BFE0FF" stopOpacity="0.14" />
              <Stop offset="84%" stopColor="#BAE6FD" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCloud2)" />
        </Svg>
      </Animated.View>

      {/* ── 4) Cloud 3: Center Core Smoke Swirl (#BFE0FF / #4DA3FF / #007AFF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: screenHeight * 0.22,
            left: (screenWidth - cloud3Size) / 2,
            width: cloud3Size,
            height: cloud3Size,
          },
          cloud3Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCloud3" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.42" />
              <Stop offset="26%" stopColor="#4DA3FF" stopOpacity="0.28" />
              <Stop offset="55%" stopColor="#007AFF" stopOpacity="0.15" />
              <Stop offset="80%" stopColor="#BAE6FD" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCloud3)" />
        </Svg>
      </Animated.View>

      {/* ── 5) Cloud 4: Mid-Lower Left Fog (#BFE0FF / #4DA3FF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            bottom: screenHeight * 0.12,
            left: -cloud4Size * 0.24,
            width: cloud4Size,
            height: cloud4Size,
          },
          cloud4Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCloud4" cx="50%" cy="50%" r="50%" fx="48%" fy="52%">
              <Stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.40" />
              <Stop offset="32%" stopColor="#4DA3FF" stopOpacity="0.26" />
              <Stop offset="62%" stopColor="#007AFF" stopOpacity="0.14" />
              <Stop offset="85%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCloud4)" />
        </Svg>
      </Animated.View>

      {/* ── 6) Cloud 5: Bottom-Right Smoke Mist (#007AFF / #4DA3FF) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            bottom: -cloud5Size * 0.18,
            right: -cloud5Size * 0.20,
            width: cloud5Size,
            height: cloud5Size,
          },
          cloud5Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient id="fogCloud5" cx="50%" cy="50%" r="50%" fx="52%" fy="48%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.34" />
              <Stop offset="28%" stopColor="#4DA3FF" stopOpacity="0.22" />
              <Stop offset="58%" stopColor="#BFE0FF" stopOpacity="0.12" />
              <Stop offset="82%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogCloud5)" />
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
