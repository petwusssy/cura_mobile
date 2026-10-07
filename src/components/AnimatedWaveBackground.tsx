import React, { useEffect, memo } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

export interface AnimatedWaveBackgroundProps {
  /** Top color of the gradient (defaults to Cura logo cyan #2AA8E0) */
  topColor?: string;
  /** Bottom color of the gradient (defaults to pure white #FFFFFF) */
  bottomColor?: string;
  /** Vertical position of the wave transition (0 to 1 fraction of screen height, default 0.38) */
  wavePosition?: number;
  /** Height of the wave transition band in pixels (default 220) */
  waveHeight?: number;
  /** Overall opacity multiplier (default 1) */
  opacity?: number;
  /** Optional child elements to wrap */
  children?: React.ReactNode;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

export const AnimatedWaveBackground = memo(function AnimatedWaveBackground({
  topColor = "#2AA8E0",
  bottomColor = "#FFFFFF",
  wavePosition = 0.38,
  waveHeight = 220,
  opacity = 1,
  children,
  style,
}: AnimatedWaveBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = Boolean(useReducedMotion());

  // Wave 1: Slow, gentle back wave (loop cycle ~9.2s)
  const wave1Tx = useSharedValue(0);
  const wave1Ty = useSharedValue(0);

  // Wave 2: Counter-directional middle wave (loop cycle ~7.6s)
  const wave2Tx = useSharedValue(0);
  const wave2Ty = useSharedValue(0);

  // Wave 3: Front soft crest wave (loop cycle ~6.4s)
  const wave3Tx = useSharedValue(0);
  const wave3Ty = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      wave1Tx.value = 0;
      wave1Ty.value = 0;
      wave2Tx.value = 0;
      wave2Ty.value = 0;
      wave3Tx.value = 0;
      wave3Ty.value = 0;
      return;
    }

    // 1) Layer 1: Back Wave - 9.2s horizontal, 7.4s vertical undulation
    wave1Tx.value = withRepeat(
      withTiming(32, {
        duration: 9200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    wave1Ty.value = withRepeat(
      withTiming(5, {
        duration: 7400,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // 2) Layer 2: Mid Wave - 7.6s horizontal counter-glide, 6.2s vertical float
    wave2Tx.value = withRepeat(
      withTiming(-38, {
        duration: 7600,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    wave2Ty.value = withRepeat(
      withTiming(-6, {
        duration: 6200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // 3) Layer 3: Front Wave - 6.4s horizontal flow, 5.2s vertical swell
    wave3Tx.value = withRepeat(
      withTiming(28, {
        duration: 6400,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    wave3Ty.value = withRepeat(
      withTiming(4, {
        duration: 5200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [reduceMotion]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave1Tx.value }, { translateY: wave1Ty.value }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave2Tx.value }, { translateY: wave2Ty.value }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave3Tx.value }, { translateY: wave3Ty.value }],
  }));

  // Wave container sizing: wider than screen (1.8x) to prevent edge clipping during horizontal translation
  const waveSvgWidth = Math.max(screenWidth * 1.8, 680);
  const waveHorizontalOffset = -(waveSvgWidth - screenWidth) / 2;
  const waveTop = Math.round(screenHeight * wavePosition);

  const backgroundLayer = (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { overflow: "hidden", opacity },
      ]}
    >
      {/* 1. Base Vertical Gradient from logo teal-cyan (#2AA8E0) fading into soft sky & white */}
      <LinearGradient
        colors={[
          topColor,
          "#3CB5E9",
          "#66C4EF",
          "#9ED8F5",
          "#DCF1FC",
          bottomColor,
        ]}
        locations={[0, 0.16, 0.32, 0.48, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Wave Transition Container (positioned at the gradient transition zone) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: waveTop,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Layer 1: Back Wave (Soft Sky-Cyan, 35% opacity, broad undulation) */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: waveHorizontalOffset,
              width: waveSvgWidth,
              height: waveHeight,
            },
            wave1Style,
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGradient id="wave1Grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                <Stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.30" />
                <Stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.15" />
              </SvgGradient>
            </Defs>
            <Path
              d="M 0,65 C 240,25 480,105 720,65 C 960,25 1200,105 1440,65 L 1440,220 L 0,220 Z"
              fill="url(#wave1Grad)"
            />
          </Svg>
        </Animated.View>

        {/* Layer 2: Mid Wave (Layered soft foam tint, 55% opacity, counter-phase) */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 8,
              left: waveHorizontalOffset,
              width: waveSvgWidth,
              height: waveHeight,
            },
            wave2Style,
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGradient id="wave2Grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.65" />
                <Stop offset="45%" stopColor="#E0F2FE" stopOpacity="0.50" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.40" />
              </SvgGradient>
            </Defs>
            <Path
              d="M 0,85 C 240,125 480,45 720,85 C 960,125 1200,45 1440,85 L 1440,220 L 0,220 Z"
              fill="url(#wave2Grad)"
            />
          </Svg>
        </Animated.View>

        {/* Layer 3: Front Wave (Clean crest transitioning seamlessly into white bottom) */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 18,
              left: waveHorizontalOffset,
              width: waveSvgWidth,
              height: waveHeight,
            },
            wave3Style,
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGradient id="wave3Grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.88" />
                <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.96" />
                <Stop offset="100%" stopColor={bottomColor} stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Path
              d="M 0,95 C 200,60 440,130 680,95 C 920,60 1160,130 1440,95 L 1440,220 L 0,220 Z"
              fill="url(#wave3Grad)"
            />
          </Svg>
        </Animated.View>

        {/* 3. Solid White continuation filling the remaining screen down to bottom */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: waveHeight + 15,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: bottomColor,
          }}
        />
      </View>
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
