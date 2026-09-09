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
      colors={['#0B2136', '#0B2136']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center relative"
    >
      <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center">
        <View className="relative mb-5">
          <LinearGradient
            colors={['#ffffff', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-[32px] items-center justify-center"
            style={{ elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 48 }}
          >
            <Svg width="46" height="46" viewBox="0 0 46 46" fill="none">
              <Rect x="18" y="4" width="10" height="38" rx="5" fill="#0B2136"/>
              <Rect x="4" y="18" width="38" height="10" rx="5" fill="#0B2136"/>
            </Svg>
          </LinearGradient>
          <View
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
            style={{ backgroundColor: "#E4F4FB", elevation: 4 }}
          >
            <Text className="text-[#0B2136] text-xs font-black">✦</Text>
          </View>
        </View>

        <Text className="text-5xl font-black tracking-tight mb-1" style={{ fontFamily: "Outfit", color: "#ffffff" }}>
          CURA
        </Text>
        <Text className="text-sm font-black tracking-widest uppercase" style={{ color: "#E4F4FB" }}>
          University Clinic
        </Text>
      </Animated.View>

      {phase === "hold" && (
        <View className="absolute bottom-12">
          <Text className="text-xs font-bold text-center" style={{ color: "#E4F4FB" }}>
            Your health, our priority
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
