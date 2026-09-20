import { type ReactNode, useEffect, useRef } from "react";
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Animated, Easing } from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Screen } from "../types";

// ── Mobile shell wrapper ────────────────────────────────────────────────────
// In a real mobile app, we don't need the fake device frame.
// We just render the children in a flexible container.
interface MobileShellProps { children: ReactNode; theme?: string; }

function AnimatedBackground() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;
  const anim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim1, { toValue: 1, duration: 2640, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim1, { toValue: 2, duration: 2640, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim1, { toValue: 3, duration: 2720, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim2, { toValue: 1, duration: 3300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim2, { toValue: 2, duration: 3300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim2, { toValue: 3, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim3, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim3, { toValue: 2, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim3, { toValue: 3, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const loop4 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim4, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim4, { toValue: 2, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim4, { toValue: 3, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const loop5 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim5, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim5, { toValue: 2, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim5, { toValue: 3, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop1.start();
    loop2.start();
    loop3.start();
    loop4.start();
    loop5.start();
    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
      loop4.stop();
      loop5.stop();
    };
  }, [anim1, anim2, anim3, anim4, anim5]);

  // Primary large blobs
  const blob1X = anim1.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 30, -15, 0] });
  const blob1Y = anim1.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -15, 20, 0] });
  const blob1Scale = anim1.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 1.1, 0.95, 1] });

  const blob2X = anim2.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -35, 20, 0] });
  const blob2Y = anim2.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 15, -20, 0] });
  const blob2Scale = anim2.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 0.9, 1.1, 1] });

  // Secondary small blobs
  const blob3X = anim3.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -25, 15, 0] });
  const blob3Y = anim3.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 30, -15, 0] });
  const blob3Scale = anim3.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 1.15, 0.9, 1] });

  const blob4X = anim4.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 40, -20, 0] });
  const blob4Y = anim4.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -10, 25, 0] });
  const blob4Scale = anim4.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 0.85, 1.1, 1] });

  const blob5X = anim5.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -15, 30, 0] });
  const blob5Y = anim5.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -25, 20, 0] });
  const blob5Scale = anim5.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 1.2, 0.9, 1] });

  return (
    <View className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary large blobs */}
      <Animated.View
        className="absolute top-[10%] left-[-20%] w-[250px] h-[250px] bg-[#dbeafe]/10 rounded-full"
        style={{ transform: [{ translateX: blob1X }, { translateY: blob1Y }, { scale: blob1Scale }] }}
      />
      <Animated.View
        className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-[#bfdbfe]/10 rounded-full"
        style={{ transform: [{ translateX: blob2X }, { translateY: blob2Y }, { scale: blob2Scale }] }}
      />

      {/* Secondary bokeh blobs */}
      <Animated.View
        className="absolute top-[25%] right-[5%] w-[80px] h-[80px] bg-[#dbeafe]/5 rounded-full"
        style={{ transform: [{ translateX: blob3X }, { translateY: blob3Y }, { scale: blob3Scale }] }}
      />
      <Animated.View
        className="absolute bottom-[35%] left-[5%] w-[110px] h-[110px] bg-[#bfdbfe]/5 rounded-full"
        style={{ transform: [{ translateX: blob4X }, { translateY: blob4Y }, { scale: blob4Scale }] }}
      />
      <Animated.View
        className="absolute top-[45%] left-[55%] w-[60px] h-[60px] bg-[#dbeafe]/5 rounded-full"
        style={{ transform: [{ translateX: blob5X }, { translateY: blob5Y }, { scale: blob5Scale }] }}
      />
    </View>
  );
}

export function MobileShell({ children, theme = 'light' }: MobileShellProps) {
  return (
    <View
      className={`flex-1 ${theme === 'dark' ? 'dark' : theme === 'ocean' ? 'ocean' : ''}`}
      style={{ backgroundColor: '#1B3A6B' }}
    >
      <AnimatedBackground />

      {/* Screen content */}
      <View className="flex-1 z-10">{children}</View>
    </View>
  );
}

// ── Bottom navigation ───────────────────────────────────────────────────────

interface BottomNavProps {
  active: Screen;
  navigate: (screen: Screen) => void;
}

const tabs: { screen: Screen; icon: (a: boolean) => ReactNode }[] = [
  {
    screen: "home",
    icon: (a) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "white" : "none"} stroke={a ? "white" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/>
      </Svg>
    ),
  },
  {
    screen: "telemedicine",
    icon: (a) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "white" : "none"} stroke={a ? "white" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M23 7l-7 5 7 5V7z" /><Rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </Svg>
    ),
  },
  {
    screen: "appointment", 
    icon: (a) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "white" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line x1="16" y1="2" x2="16" y2="6"/><Line x1="8" y1="2" x2="8" y2="6"/><Line x1="3" y1="10" x2="21" y2="10"/>
      </Svg>
    ),
  },
  {
    screen: "medications", // mapped to Heart in ref
    icon: (a) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "white" : "none"} stroke={a ? "white" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </Svg>
    ),
  },
  {
    screen: "profile",
    icon: (a) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "white" : "none"} stroke={a ? "white" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/>
      </Svg>
    ),
  },
];

export function BottomNav({ active, navigate }: BottomNavProps) {
  return (
    <View className="absolute bottom-6 left-6 right-6">
      <View
        className="bg-white rounded-full flex-row items-center justify-around px-4 py-3"
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 10,
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.screen;
          return (
            <Pressable
              key={tab.screen}
              onPress={() => navigate(tab.screen)}
              className={`w-12 h-12 rounded-full items-center justify-center ${isActive ? 'bg-cura-900' : 'bg-transparent'}`}
            >
              {tab.icon(isActive)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function Header({ title, onBack, right }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-transparent flex-row items-center px-4" style={{ paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: 12 }}>
      {onBack && (
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center bg-white mr-3 shadow-sm"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2136" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
      )}
      <Text className="flex-1 text-[22px] font-black tracking-tight" style={{ color: "#FFFFFF", fontFamily: 'Outfit' }}>{title}</Text>
      {right && <View>{right}</View>}
    </View>
  );
}

// ── Avatar badge ─────────────────────────────────────────────────────────────

interface AvatarProps { emoji: string; color: string; bg: string; size?: number }

export function AvatarBadge({ emoji, color, bg, size = 40 }: AvatarProps) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size, height: size,
        backgroundColor: bg,
        borderColor: `${color}30`,
        borderWidth: 2.5,
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4
      }}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────

interface InputProps {
  label: string;
  error?: string;
  icon?: ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}

export function Input({ label, error, icon, ...props }: InputProps) {
  return (
    <View className="flex-col gap-1.5">
      <Text className="text-xs font-bold text-white/80 uppercase tracking-wider pl-1">{label}</Text>
      <View className="relative justify-center">
        {icon && <View className="absolute left-4 z-10">{icon}</View>}
        <TextInput
          {...props}
          placeholderTextColor="#94A3B8"
          className={`w-full bg-white rounded-[32px] px-5 py-4 text-sm text-slate-800 ${icon ? "pl-12" : ""} ${error ? "border border-rose-300 bg-rose-50" : ""}`}
        />
      </View>
      {error && <Text className="text-xs text-rose-500 pl-1">{error}</Text>}
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "white";
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Button({ variant = "primary", loading, fullWidth, children, onPress, disabled, className = "" }: ButtonProps) {
  const variants = {
    primary:   "bg-cura-900",
    secondary: "",
    white:     "bg-white",
    ghost:     "",
    danger:    "bg-rose-50 border border-rose-100",
  };
  
  const textVariants = {
    primary:   "text-white",
    secondary: "text-white",
    white:     "text-[#0B2136]",
    ghost:     "text-slate-600",
    danger:    "text-rose-600",
  };

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-full px-6 py-4 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={loading || disabled}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !disabled && !loading ? 0.96 : 1 }],
        opacity: pressed && !disabled && !loading ? 0.85 : (disabled || loading ? 0.5 : 1),
        ...(variant === 'secondary' ? { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' } : {}),
        ...(variant === 'white' ? { backgroundColor: '#ffffff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 } : {})
      })}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'secondary' ? 'white' : '#0B2136'} />}
      <Text className={`font-bold ${textVariants[variant]}`} style={{ fontSize: 15 }}>
        {children}
      </Text>
    </Pressable>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

export function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-emerald-100",
    warning: "bg-amber-100",
    error:   "bg-rose-100",
    info:    "bg-sky-100",
    neutral: "bg-slate-100",
  };
  
  const textStyles: Record<BadgeVariant, string> = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    error:   "text-rose-600",
    info:    "text-sky-700",
    neutral: "text-slate-500",
  };
  return (
    <View className={`self-start px-2.5 py-0.5 rounded-full ${styles[variant]}`}>
      <Text className={`text-[11px] font-semibold ${textStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = "", onPress }: { children: ReactNode; className?: string; onPress?: () => void }) {
  const CardView = onPress ? Pressable : View;
  return (
    <CardView
      onPress={onPress}
      className={`bg-white rounded-[32px] p-5 overflow-hidden ${className}`}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 }}
    >
      {children}
    </CardView>
  );
}

// ── Onboarding progress ───────────────────────────────────────────────────────

export function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-col gap-2 px-6 pt-4 bg-white">
      <View className="flex-row justify-between items-center">
        <Text className="text-[11px] font-semibold text-slate-400">Step {step} of {total}</Text>
        <Text className="text-[11px] font-bold text-cura-600">{Math.round((step / total) * 100)}% complete</Text>
      </View>
      <View className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
        <LinearGradient
          colors={['#0994E8', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${(step / total) * 100}%`, height: '100%' }}
        />
      </View>
    </View>
  );
}

// ── Vital item ────────────────────────────────────────────────────────────────

export function VitalItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-col gap-1 bg-sky-50 rounded-xl p-3">
      <Text className="text-lg">{icon}</Text>
      <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wide">{label}</Text>
      <Text className="text-sm font-bold text-slate-800">{value}</Text>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-black tracking-tight" style={{ color: "#FFFFFF", fontFamily: "Outfit" }}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} className="bg-white px-3 py-1.5 rounded-full" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
          <Text className="text-xs font-bold text-slate-700">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ emoji, title, message }: { emoji: string; title: string; message: string }) {
  return (
    <View className="flex-col items-center justify-center py-14 px-6 gap-3">
      <Text className="text-5xl text-center">{emoji}</Text>
      <Text className="text-base font-bold text-white text-center">{title}</Text>
      <Text className="text-sm text-white/70 text-center max-w-[200px]">{message}</Text>
    </View>
  );
}

// ── Select (Chips) ────────────────────────────────────────────────────────────

interface SelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onValueChange: (val: string) => void;
}

export function Select({ label, value, options, onValueChange }: SelectProps) {
  return (
    <View className="flex-col gap-1.5">
      <Text className="text-xs font-bold text-white/80 uppercase tracking-wider">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onValueChange(opt.value)}
              className={`px-4 py-2.5 rounded-full border ${active ? 'bg-cura-900 border-cura-900' : 'bg-white border-transparent'}`}
              style={active ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}
            >
              <Text className={`font-bold ${active ? 'text-white' : 'text-slate-600'}`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
