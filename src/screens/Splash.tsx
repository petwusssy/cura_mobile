import { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect, Path } from "react-native-svg";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  
  // Basic react-native animation values
  const scale = new Animated.Value(0.7);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    const t1 = setTimeout(() => setPhase("hold"), 700);
    const t2 = setTimeout(() => {
      setPhase("out");
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 2200);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <LinearGradient
      colors={['#EFF8FF', '#DEF0FF', '#BAE6FD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center relative"
    >
      <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center">
        <View className="relative mb-5">
          <LinearGradient
            colors={['#0994E8', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-3xl items-center justify-center"
            style={{ elevation: 12, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 48 }}
          >
            <Svg width="46" height="46" viewBox="0 0 46 46" fill="none">
              <Rect x="18" y="4" width="10" height="38" rx="5" fill="white"/>
              <Rect x="4" y="18" width="38" height="10" rx="5" fill="white"/>
            </Svg>
          </LinearGradient>
          <View
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
            style={{ backgroundColor: "#06B6D4", elevation: 4 }}
          >
            <Text className="text-white text-xs font-bold">✦</Text>
          </View>
        </View>

        <Text className="text-5xl font-extrabold tracking-tight mb-1" style={{ fontFamily: "Outfit", color: "#0A4171" }}>
          CURA
        </Text>
        <Text className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#0994E8" }}>
          University Clinic
        </Text>
      </Animated.View>

      {phase === "hold" && (
        <View className="absolute bottom-12">
          <Text className="text-xs font-medium text-center" style={{ color: "#0994E8" }}>
            Your health, our priority
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
