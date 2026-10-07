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
 * Renders 4 large animated blurred blue smoke/fog gradient blobs (#4DA3FF, #007AFF, #BFE0FF)
 * drifting gently across a clean #FFFFFF base with smooth 8-12s 60fps loops.
 */
export const FogBackground = memo(function FogBackground({
  baseColor = "#FFFFFF",
  opacity = 1,
  children,
  style,
}: FogBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Blob 1: Top-Left (#4DA3FF) ~9.5s cycle
  const b1Tx = useSharedValue(0);
  const b1Ty = useSharedValue(0);
  const b1Scale = useSharedValue(1);

  // Blob 2: Top-Right (#007AFF) ~11.2s cycle
  const b2Tx = useSharedValue(0);
  const b2Ty = useSharedValue(0);
  const b2Scale = useSharedValue(1);

  // Blob 3: Bottom-Left / Mid-Flank (#BFE0FF) ~10.0s cycle
  const b3Tx = useSharedValue(0);
  const b3Ty = useSharedValue(0);
  const b3Scale = useSharedValue(1);

  // Blob 4: Bottom-Right (#007AFF / #4DA3FF) ~8.8s cycle
  const b4Tx = useSharedValue(0);
  const b4Ty = useSharedValue(0);
  const b4Scale = useSharedValue(1);

  const isRunningRef = useRef(false);

  const startAnimations = () => {
    if (reduceMotion || isRunningRef.current) return;
    isRunningRef.current = true;

    // Blob 1: Top-Left drift (9.5s)
    b1Tx.value = withRepeat(
      withTiming(38, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b1Ty.value = withRepeat(
      withTiming(28, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b1Scale.value = withRepeat(
      withTiming(1.10, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Blob 2: Top-Right counter-drift (11.2s)
    b2Tx.value = withRepeat(
      withTiming(-36, { duration: 11200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b2Ty.value = withRepeat(
      withTiming(32, { duration: 10500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b2Scale.value = withRepeat(
      withTiming(0.92, { duration: 11200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Blob 3: Bottom-Left swell and glide (10.0s)
    b3Tx.value = withRepeat(
      withTiming(42, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b3Ty.value = withRepeat(
      withTiming(-26, { duration: 9600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b3Scale.value = withRepeat(
      withTiming(1.12, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Blob 4: Bottom-Right counter-drift (8.8s)
    b4Tx.value = withRepeat(
      withTiming(-34, { duration: 8800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b4Ty.value = withRepeat(
      withTiming(-30, { duration: 8400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    b4Scale.value = withRepeat(
      withTiming(0.94, { duration: 8800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  };

  const stopAnimations = () => {
    isRunningRef.current = false;
    cancelAnimation(b1Tx);
    cancelAnimation(b1Ty);
    cancelAnimation(b1Scale);
    cancelAnimation(b2Tx);
    cancelAnimation(b2Ty);
    cancelAnimation(b2Scale);
    cancelAnimation(b3Tx);
    cancelAnimation(b3Ty);
    cancelAnimation(b3Scale);
    cancelAnimation(b4Tx);
    cancelAnimation(b4Ty);
    cancelAnimation(b4Scale);
  };

  useEffect(() => {
    if (reduceMotion) {
      b1Tx.value = 0;
      b1Ty.value = 0;
      b1Scale.value = 1;
      b2Tx.value = 0;
      b2Ty.value = 0;
      b2Scale.value = 1;
      b3Tx.value = 0;
      b3Ty.value = 0;
      b3Scale.value = 1;
      b4Tx.value = 0;
      b4Ty.value = 0;
      b4Scale.value = 1;
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

  // Animated styles for the 4 blobs
  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: b1Tx.value },
      { translateY: b1Ty.value },
      { scale: b1Scale.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: b2Tx.value },
      { translateY: b2Ty.value },
      { scale: b2Scale.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: b3Tx.value },
      { translateY: b3Ty.value },
      { scale: b3Scale.value },
    ],
  }));

  const blob4Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: b4Tx.value },
      { translateY: b4Ty.value },
      { scale: b4Scale.value },
    ],
  }));

  // Sizing calibrated to fill viewport edges with ~80-120 blur plume
  const blob1Size = Math.max(screenWidth * 1.15, 380);
  const blob2Size = Math.max(screenWidth * 1.05, 350);
  const blob3Size = Math.max(screenWidth * 1.25, 420);
  const blob4Size = Math.max(screenWidth * 1.10, 370);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor: baseColor, opacity },
        style,
      ]}
    >
      {/* ── Blob 1: Top-Left Mist (#4DA3FF, opacity ~0.35, blur ~100) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: -blob1Size * 0.28,
            left: -blob1Size * 0.22,
            width: blob1Size,
            height: blob1Size,
          },
          blob1Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogBlob1"
              cx="50%"
              cy="50%"
              r="50%"
              fx="48%"
              fy="48%"
            >
              <Stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.36" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.26" />
              <Stop offset="55%" stopColor="#BFE0FF" stopOpacity="0.16" />
              <Stop offset="78%" stopColor="#BFE0FF" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlob1)" />
        </Svg>
      </Animated.View>

      {/* ── Blob 2: Top-Right Smoke (#007AFF, opacity ~0.30, blur ~110) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            top: -blob2Size * 0.24,
            right: -blob2Size * 0.26,
            width: blob2Size,
            height: blob2Size,
          },
          blob2Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogBlob2"
              cx="50%"
              cy="50%"
              r="50%"
              fx="52%"
              fy="48%"
            >
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.32" />
              <Stop offset="28%" stopColor="#4DA3FF" stopOpacity="0.22" />
              <Stop offset="60%" stopColor="#BFE0FF" stopOpacity="0.12" />
              <Stop offset="82%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlob2)" />
        </Svg>
      </Animated.View>

      {/* ── Blob 3: Bottom-Left Haze (#BFE0FF, opacity ~0.38, blur ~120) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            bottom: -blob3Size * 0.22,
            left: -blob3Size * 0.25,
            width: blob3Size,
            height: blob3Size,
          },
          blob3Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogBlob3"
              cx="50%"
              cy="50%"
              r="50%"
              fx="48%"
              fy="52%"
            >
              <Stop offset="0%" stopColor="#BFE0FF" stopOpacity="0.38" />
              <Stop offset="32%" stopColor="#4DA3FF" stopOpacity="0.25" />
              <Stop offset="62%" stopColor="#007AFF" stopOpacity="0.14" />
              <Stop offset="84%" stopColor="#BFE0FF" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlob3)" />
        </Svg>
      </Animated.View>

      {/* ── Blob 4: Bottom-Right Mist (#007AFF / #4DA3FF, opacity ~0.28, blur ~95) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBase,
          {
            bottom: -blob4Size * 0.26,
            right: -blob4Size * 0.22,
            width: blob4Size,
            height: blob4Size,
          },
          blob4Style,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogBlob4"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.28" />
              <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="0.20" />
              <Stop offset="58%" stopColor="#BFE0FF" stopOpacity="0.11" />
              <Stop offset="80%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogBlob4)" />
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
