import { useEffect, useState, useRef } from "react";
import { View, Text, Animated, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  
  // Basic react-native animation values
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    const t1 = setTimeout(() => setPhase("hold"), 500);
    const t2 = setTimeout(() => {
      setPhase("out");
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 1200);
    const t3 = setTimeout(() => onDoneRef.current?.(), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <Pressable onPress={() => onDoneRef.current?.()} className="flex-1">
      <LinearGradient
        colors={['#0B2136', '#0B2136']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center relative"
      >
      <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center">
        <View className="relative mb-5">
          <View
            className="w-24 h-24 rounded-[30px] bg-white items-center justify-center p-3"
            style={{ elevation: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 36 }}
          >
            <Image
              source={require("../../assets/images/cura-logo.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
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
  </Pressable>
);
}
