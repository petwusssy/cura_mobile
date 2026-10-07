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
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
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
  /** Base background color (defaults to pristine white #FFFFFF) */
  baseColor?: string;
  /** Primary fog color sampled from logo (defaults to approx. #2AA8E0) */
  fogColor?: string;
  /** Overall opacity multiplier (defaults to 1) */
  opacity?: number;
  /** Optional children to wrap */
  children?: React.ReactNode;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

export const FogBackground = memo(function FogBackground({
  baseColor = "#FFFFFF",
  fogColor = "#2AA8E0",
  opacity = 1,
  children,
  style,
}: FogBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Cloud 1: Top-Left Mist (loop cycle: 18.5s)
  const c1Tx = useSharedValue(0);
  const c1Ty = useSharedValue(0);
  const c1Scale = useSharedValue(1);

  // Cloud 2: Top-Right Mist (loop cycle: 15.2s)
  const c2Tx = useSharedValue(0);
  const c2Ty = useSharedValue(0);
  const c2Scale = useSharedValue(1);

  // Cloud 3: Upper-Left / Mid-Edge Flank Mist (loop cycle: 19.8s)
  const c3Tx = useSharedValue(0);
  const c3Ty = useSharedValue(0);
  const c3Scale = useSharedValue(1);

  // Cloud 4: Center-Top Diffuse Mist (loop cycle: 13.6s)
  const c4Tx = useSharedValue(0);
  const c4Ty = useSharedValue(0);
  const c4Scale = useSharedValue(1);

  // Cloud 5: Bottom-Left Mist (loop cycle: 16.4s)
  const c5Tx = useSharedValue(0);
  const c5Ty = useSharedValue(0);
  const c5Scale = useSharedValue(1);

  // Cloud 6: Bottom-Right Mist (loop cycle: 14.2s)
  const c6Tx = useSharedValue(0);
  const c6Ty = useSharedValue(0);
  const c6Scale = useSharedValue(1);

  // Cloud 7: Bottom-Center Diffuse Haze behind tab bar (loop cycle: 17.6s)
  const c7Tx = useSharedValue(0);
  const c7Ty = useSharedValue(0);
  const c7Scale = useSharedValue(1);

  const isRunningRef = useRef(false);

  const startAnimations = () => {
    if (reduceMotion || isRunningRef.current) return;
    isRunningRef.current = true;

    // Cloud 1: Top-Left diagonal drift (~18.5s)
    c1Tx.value = withRepeat(
      withTiming(36, { duration: 18500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c1Ty.value = withRepeat(
      withTiming(26, { duration: 16200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c1Scale.value = withRepeat(
      withTiming(1.12, { duration: 17400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 2: Top-Right counter-drift (~15.2s)
    c2Tx.value = withRepeat(
      withTiming(-34, { duration: 15200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c2Ty.value = withRepeat(
      withTiming(22, { duration: 14100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c2Scale.value = withRepeat(
      withTiming(0.92, { duration: 15800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 3: Upper-Left flank drift (~19.8s)
    c3Tx.value = withRepeat(
      withTiming(28, { duration: 19800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c3Ty.value = withRepeat(
      withTiming(-32, { duration: 18200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c3Scale.value = withRepeat(
      withTiming(1.08, { duration: 19100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 4: Center-Top diffuse haze (~13.6s)
    c4Tx.value = withRepeat(
      withTiming(-24, { duration: 13600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c4Ty.value = withRepeat(
      withTiming(18, { duration: 12800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c4Scale.value = withRepeat(
      withTiming(1.06, { duration: 13200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 5: Bottom-Left gentle swell and glide (~16.4s)
    c5Tx.value = withRepeat(
      withTiming(30, { duration: 16400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c5Ty.value = withRepeat(
      withTiming(-22, { duration: 15100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c5Scale.value = withRepeat(
      withTiming(1.10, { duration: 16800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 6: Bottom-Right counter-drift (~14.2s)
    c6Tx.value = withRepeat(
      withTiming(-32, { duration: 14200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c6Ty.value = withRepeat(
      withTiming(24, { duration: 13800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c6Scale.value = withRepeat(
      withTiming(0.93, { duration: 14600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Cloud 7: Bottom-Center diffuse mist under tab bar (~17.6s)
    c7Tx.value = withRepeat(
      withTiming(26, { duration: 17600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c7Ty.value = withRepeat(
      withTiming(-16, { duration: 16900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    c7Scale.value = withRepeat(
      withTiming(1.05, { duration: 17200, easing: Easing.inOut(Easing.sin) }),
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
    cancelAnimation(c6Tx);
    cancelAnimation(c6Ty);
    cancelAnimation(c6Scale);
    cancelAnimation(c7Tx);
    cancelAnimation(c7Ty);
    cancelAnimation(c7Scale);
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
      c6Tx.value = 0;
      c6Ty.value = 0;
      c6Scale.value = 1;
      c7Tx.value = 0;
      c7Ty.value = 0;
      c7Scale.value = 1;
      return;
    }

    startAnimations();

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        startAnimations();
      } else {
        stopAnimations();
      }
    });

    return () => {
      sub.remove();
      stopAnimations();
    };
  }, [reduceMotion]);

  const cloud1AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c1Tx.value },
      { translateY: c1Ty.value },
      { scale: c1Scale.value },
    ],
  }));

  const cloud2AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c2Tx.value },
      { translateY: c2Ty.value },
      { scale: c2Scale.value },
    ],
  }));

  const cloud3AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c3Tx.value },
      { translateY: c3Ty.value },
      { scale: c3Scale.value },
    ],
  }));

  const cloud4AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c4Tx.value },
      { translateY: c4Ty.value },
      { scale: c4Scale.value },
    ],
  }));

  const cloud5AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c5Tx.value },
      { translateY: c5Ty.value },
      { scale: c5Scale.value },
    ],
  }));

  const cloud6AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c6Tx.value },
      { translateY: c6Ty.value },
      { scale: c6Scale.value },
    ],
  }));

  const cloud7AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: c7Tx.value },
      { translateY: c7Ty.value },
      { scale: c7Scale.value },
    ],
  }));

  // Proportional cloud dimensions tailored to device size
  const cloud1Size = Math.max(screenWidth * 1.15, 460);
  const cloud2Size = Math.max(screenWidth * 1.25, 520);
  const cloud3Size = Math.max(screenWidth * 1.05, 420);
  const cloud4Width = Math.max(screenWidth * 1.45, 580);
  const cloud4Height = Math.max(screenHeight * 0.42, 340);

  // Bottom clouds dimensions
  const cloud5Size = Math.max(screenWidth * 1.20, 480);
  const cloud6Size = Math.max(screenWidth * 1.25, 500);
  const cloud7Width = Math.max(screenWidth * 1.45, 580);
  const cloud7Height = Math.max(screenHeight * 0.38, 300);

  const backgroundLayer = (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: baseColor, overflow: "hidden", opacity },
      ]}
    >
      {/* ── TOP FOG CLOUDS ────────────────────────────────────────── */}

      {/* Cloud 1: Top-Left Sky-Blue Mist (22% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -cloud1Size * 0.28,
            left: -cloud1Size * 0.22,
            width: cloud1Size,
            height: cloud1Size,
          },
          cloud1AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogGrad1"
              cx="50%"
              cy="50%"
              r="50%"
              fx="48%"
              fy="48%"
            >
              <Stop offset="0%" stopColor={fogColor} stopOpacity="0.22" />
              <Stop offset="30%" stopColor="#38BDF8" stopOpacity="0.16" />
              <Stop offset="62%" stopColor="#7DD3FC" stopOpacity="0.08" />
              <Stop offset="85%" stopColor="#BAE6FD" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogGrad1)" />
        </Svg>
      </Animated.View>

      {/* Cloud 2: Top-Right Cyan Mist (19% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -cloud2Size * 0.22,
            right: -cloud2Size * 0.26,
            width: cloud2Size,
            height: cloud2Size,
          },
          cloud2AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogGrad2"
              cx="50%"
              cy="50%"
              r="50%"
              fx="52%"
              fy="48%"
            >
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.19" />
              <Stop offset="28%" stopColor={fogColor} stopOpacity="0.14" />
              <Stop offset="58%" stopColor="#38BDF8" stopOpacity="0.07" />
              <Stop offset="82%" stopColor="#E0F2FE" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogGrad2)" />
        </Svg>
      </Animated.View>

      {/* Cloud 3: Upper-Left / Mid-Edge Flank Mist (16% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: screenHeight * 0.20,
            left: -cloud3Size * 0.38,
            width: cloud3Size,
            height: cloud3Size,
          },
          cloud3AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogGrad3"
              cx="50%"
              cy="50%"
              r="50%"
              fx="46%"
              fy="50%"
            >
              <Stop offset="0%" stopColor={fogColor} stopOpacity="0.16" />
              <Stop offset="35%" stopColor="#7DD3FC" stopOpacity="0.10" />
              <Stop offset="68%" stopColor="#BAE6FD" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogGrad3)" />
        </Svg>
      </Animated.View>

      {/* Cloud 4: Center-Top Wide Diffuse Haze (15% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -cloud4Height * 0.24,
            left: (screenWidth - cloud4Width) / 2,
            width: cloud4Width,
            height: cloud4Height,
          },
          cloud4AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 600 350">
          <Defs>
            <RadialGradient
              id="fogGrad4"
              cx="50%"
              cy="35%"
              r="55%"
              fx="50%"
              fy="30%"
            >
              <Stop offset="0%" stopColor={fogColor} stopOpacity="0.15" />
              <Stop offset="35%" stopColor="#38BDF8" stopOpacity="0.09" />
              <Stop offset="70%" stopColor="#E0F2FE" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="600" height="350" fill="url(#fogGrad4)" />
        </Svg>
      </Animated.View>

      {/* ── BOTTOM FOG CLOUDS ─────────────────────────────────────── */}

      {/* Cloud 5: Bottom-Left Sky-Blue Mist (21% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: -cloud5Size * 0.28,
            left: -cloud5Size * 0.24,
            width: cloud5Size,
            height: cloud5Size,
          },
          cloud5AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogGrad5"
              cx="50%"
              cy="50%"
              r="50%"
              fx="48%"
              fy="52%"
            >
              <Stop offset="0%" stopColor={fogColor} stopOpacity="0.21" />
              <Stop offset="32%" stopColor="#38BDF8" stopOpacity="0.15" />
              <Stop offset="64%" stopColor="#7DD3FC" stopOpacity="0.07" />
              <Stop offset="84%" stopColor="#BAE6FD" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogGrad5)" />
        </Svg>
      </Animated.View>

      {/* Cloud 6: Bottom-Right Mist (18% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: -cloud6Size * 0.25,
            right: -cloud6Size * 0.28,
            width: cloud6Size,
            height: cloud6Size,
          },
          cloud6AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 500 500">
          <Defs>
            <RadialGradient
              id="fogGrad6"
              cx="50%"
              cy="50%"
              r="50%"
              fx="52%"
              fy="52%"
            >
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.18" />
              <Stop offset="28%" stopColor={fogColor} stopOpacity="0.14" />
              <Stop offset="60%" stopColor="#38BDF8" stopOpacity="0.07" />
              <Stop offset="84%" stopColor="#E0F2FE" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="500" height="500" fill="url(#fogGrad6)" />
        </Svg>
      </Animated.View>

      {/* Cloud 7: Bottom-Center Diffuse Haze behind tab bar (16% peak opacity) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: -cloud7Height * 0.26,
            left: (screenWidth - cloud7Width) / 2,
            width: cloud7Width,
            height: cloud7Height,
          },
          cloud7AnimStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 600 350">
          <Defs>
            <RadialGradient
              id="fogGrad7"
              cx="50%"
              cy="65%"
              r="55%"
              fx="50%"
              fy="70%"
            >
              <Stop offset="0%" stopColor={fogColor} stopOpacity="0.16" />
              <Stop offset="35%" stopColor="#38BDF8" stopOpacity="0.10" />
              <Stop offset="70%" stopColor="#E0F2FE" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="600" height="350" fill="url(#fogGrad7)" />
        </Svg>
      </Animated.View>
    </View>
  );

  if (children) {
    return (
      <View style={[{ flex: 1 }, style]}>
        {backgroundLayer}
        <View style={{ flex: 1, zIndex: 1 }}>{children}</View>
      </View>
    );
  }

  return backgroundLayer;
});
