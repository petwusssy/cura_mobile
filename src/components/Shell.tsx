import { type ReactNode } from "react";
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import type { Screen } from "../types";

// ── Mobile shell wrapper ────────────────────────────────────────────────────
// In a real mobile app, we don't need the fake device frame.
// We just render the children in a flexible container.
interface MobileShellProps { children: ReactNode }

export function MobileShell({ children }: MobileShellProps) {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Screen content */}
      <View className="flex-1">{children}</View>
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
    screen: "health-history", // mapped to Calendar in ref
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
              className={`w-12 h-12 rounded-full items-center justify-center ${isActive ? 'bg-cura-500' : 'bg-transparent'}`}
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
  return (
    <View className="bg-white border-b border-sky-100 flex-row items-center px-4 py-3" style={{ minHeight: 56 }}>
      {onBack && (
        <Pressable
          onPress={onBack}
          className="w-9 h-9 rounded-full items-center justify-center bg-sky-50 mr-3"
        >
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0994E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
      )}
      <Text className="flex-1 text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>{title}</Text>
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
}

export function Input({ label, error, icon, ...props }: InputProps) {
  return (
    <View className="flex-col gap-1.5">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</Text>
      <View className="relative justify-center">
        {icon && <View className="absolute left-3.5 z-10">{icon}</View>}
        <TextInput
          {...props}
          placeholderTextColor="#cbd5e1"
          className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-slate-800 ${icon ? "pl-10" : ""} ${error ? "border-rose-300 bg-rose-50" : "border-sky-200"}`}
        />
      </View>
      {error && <Text className="text-xs text-rose-500">{error}</Text>}
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Button({ variant = "primary", loading, fullWidth, children, onPress, disabled, className = "" }: ButtonProps) {
  const variants = {
    primary:   "bg-cura-500",
    secondary: "bg-sky-50 border border-sky-200",
    ghost:     "",
    danger:    "bg-rose-50 border border-rose-100",
  };
  
  const textVariants = {
    primary:   "text-white",
    secondary: "text-cura-700",
    ghost:     "text-cura-600",
    danger:    "text-rose-600",
  };

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={loading || disabled}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !disabled && !loading ? 0.96 : 1 }],
        opacity: pressed && !disabled && !loading ? 0.85 : (disabled || loading ? 0.5 : 1)
      })}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? 'white' : '#0994E8'} />}
      <Text className={`font-semibold text-sm ${textVariants[variant]}`}>
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
      className={`bg-white rounded-2xl p-4 overflow-hidden ${className}`}
      style={{ shadowColor: '#0994E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 }}
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
      <Text className="text-sm font-bold text-slate-700">{title}</Text>
      {action && (
        <Pressable onPress={onAction} className="bg-sky-50 px-3 py-1 rounded-full">
          <Text className="text-xs font-semibold text-cura-500">{action}</Text>
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
      <Text className="text-base font-bold text-slate-700 text-center">{title}</Text>
      <Text className="text-sm text-slate-400 text-center max-w-[200px]">{message}</Text>
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
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onValueChange(opt.value)}
              className={`px-4 py-2.5 rounded-2xl border ${active ? 'bg-cura-500 border-cura-500' : 'bg-white border-slate-200'}`}
              style={active ? { shadowColor: '#0994E8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 } : {}}
            >
              <Text className={`font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
