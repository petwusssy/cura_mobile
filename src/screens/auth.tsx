import React, { useState, useEffect, useRef, useCallback, useMemo, memo, forwardRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  useWindowDimensions,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useReducedMotion,
  Easing as ReanimatedEasing,
} from "react-native-reanimated";
import Svg, { Path, Polyline, Circle, Rect, Defs, LinearGradient as SvgGradient, RadialGradient as SvgRadialGradient, Stop, Text as SvgText, TSpan, Mask, Image as SvgImage } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { Screen, AppUser, PatientCategory } from "../types";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  PH_REGIONS,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
} from "../constants/phLocations";
import { MASCOTS } from "../data";
import { useAlert } from "../components/AlertProvider";
import { Button, Input } from "../components/Shell";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

import { signInWithGooglePopup, authenticateWithCuraBackend, parseGoogleIdToken } from "../services/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "289437991360-4ge9cgmpvjmr68pfprsvfimau1i4batr.apps.googleusercontent.com";

function GoogleLogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

interface NavProps {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  setUser?: (val: any) => void;
  loadUserData?: (email: string) => Promise<void>;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, delayMs = 1500): Promise<Response> {
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        return res;
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr || new Error("Network request failed");
}

// ── Welcome Screen Icons ──────────────────────────────────────────────────────

function PersonIcon({ color = "#FFFFFF", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        fill={color}
      />
      <Path
        d="M12 14.5C6.99 14.5 2.73 17.86 2.08 22.5C2.04 22.78 2.26 23 2.54 23H21.46C21.74 23 21.96 22.78 21.92 22.5C21.27 17.86 17.01 14.5 12 14.5Z"
        fill={color}
      />
    </Svg>
  );
}

function PencilIcon({ color = "#1E4FD8", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <Path d="M15 5l4 4" />
    </Svg>
  );
}

function ArrowRightIcon({ color = "#FFFFFF", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

function CloseIcon({ color = "#FFFFFF", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function UserIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function MailIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="20" height="16" x="2" y="4" rx="2" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  );
}

function LockIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

function IdCardIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="20" height="14" x="2" y="5" rx="2" />
      <Path d="M6 10h4" />
      <Path d="M6 14h8" />
      <Path d="M16 10h2" />
    </Svg>
  );
}

function EyeIcon({ open, color = "#FFFFFF", size = 18 }: { open: boolean; color?: string; size?: number }) {
  if (open) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <Circle cx="12" cy="12" r="3" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <Path d="M2 2l20 20" />
    </Svg>
  );
}

// ── Additional Glass Icons ───────────────────────────────────────────────────

function PhoneIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

function CalendarIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function MapPinIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

function ChevronLeftIcon({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

function ChevronDownIcon({ color = "#FFFFFF", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

function CheckIcon({ color = "#FFFFFF", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

// ── Glassmorphism Input Component ────────────────────────────────────────────

interface GlassInputProps {
  label?: string;
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}

const GlassInput = memo(
  forwardRef<TextInput, GlassInputProps>(function GlassInput(
    {
      label,
      icon,
      placeholder,
      value,
      onChangeText,
      onFocus,
      onBlur,
      editable = true,
      secureTextEntry = false,
      showPasswordToggle = false,
      error,
      keyboardType = "default",
      autoCapitalize = "none",
      returnKeyType,
      onSubmitEditing,
      blurOnSubmit = false,
      maxLength,
      multiline = false,
      numberOfLines,
    },
    ref
  ) {
    const [isSecured, setIsSecured] = useState(secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={{ marginBottom: 12 }}>
        {label ? (
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: 11.5,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontFamily: "Outfit",
              marginBottom: 5,
            }}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: multiline ? "flex-start" : "center",
            height: multiline ? undefined : 48,
            minHeight: multiline ? 72 : undefined,
            borderRadius: 12,
            backgroundColor: isFocused ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.18)",
            borderWidth: 1.5,
            borderColor: error
              ? "rgba(248, 113, 113, 0.75)"
              : isFocused
              ? "rgba(147, 197, 253, 0.65)"
              : "rgba(255, 255, 255, 0.30)",
            paddingHorizontal: 14,
            paddingVertical: multiline ? 10 : 0,
            opacity: editable ? 1 : 0.75,
          }}
        >
          {icon ? <View style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} pointerEvents="none">{icon}</View> : null}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.62)"
            secureTextEntry={isSecured}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            maxLength={maxLength}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? "top" : "center"}
            editable={editable}
            style={[
              {
                flex: 1,
                color: "#FFFFFF",
                fontSize: 14,
                fontFamily: "Outfit",
                paddingVertical: 0,
                height: multiline ? undefined : "100%",
                minHeight: multiline ? 52 : undefined,
              },
              Platform.OS === "web"
                ? ({
                    outline: "none",
                    outlineStyle: "none",
                    outlineWidth: 0,
                    boxShadow: "none",
                  } as any)
                : null,
            ]}
          />
          {showPasswordToggle ? (
            <TouchableOpacity
              onPress={() => setIsSecured((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <EyeIcon open={!isSecured} color="rgba(255, 255, 255, 0.85)" size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? (
          <Text
            style={{
              color: "#FCA5A5",
              fontSize: 12,
              fontFamily: "Outfit",
              marginTop: 4,
              marginLeft: 4,
              textShadowColor: "rgba(0, 0, 0, 0.4)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  })
);

// ── Glass 6-Box OTP Input Field ─────────────────────────────────────────────

function GlassOtpInput({
  value,
  onChangeText,
  error,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  onSubmitEditing?: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = (value || "").split("").slice(0, 6);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.78)",
          fontSize: 12,
          fontFamily: "Outfit",
          fontWeight: "500",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Enter the 6-digit verification code sent to your email
      </Text>

      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.9}
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = digits[index] || "";
          const isActive = isFocused && (index === digits.length || (digits.length === 6 && index === 5));
          return (
            <View
              key={index}
              style={{
                width: 46,
                height: 54,
                borderRadius: 14,
                backgroundColor: char
                  ? "rgba(255, 255, 255, 0.20)"
                  : isActive
                  ? "rgba(56, 189, 248, 0.15)"
                  : "rgba(255, 255, 255, 0.08)",
                borderWidth: 1.5,
                borderColor: error
                  ? "rgba(248, 113, 113, 0.85)"
                  : isActive
                  ? "#38BDF8"
                  : char
                  ? "rgba(56, 189, 248, 0.45)"
                  : "rgba(255, 255, 255, 0.20)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: isActive ? "#38BDF8" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 24,
                  fontWeight: "700",
                  fontFamily: "Outfit",
                  textAlign: "center",
                }}
              >
                {char}
              </Text>
            </View>
          );
        })}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const cleaned = text.replace(/\D/g, "").slice(0, 6);
          onChangeText(cleaned);
        }}
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: "absolute",
          top: 26,
          left: 0,
          width: "100%",
          height: 54,
          opacity: 0,
        }}
        caretHidden={true}
      />

      {error ? (
        <Text
          style={{
            color: "#F87171",
            fontSize: 12,
            fontFamily: "Outfit",
            fontWeight: "500",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Glass DatePicker Field ───────────────────────────────────────────────────

function GlassDatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = "Select Birthday",
}: {
  label: string;
  value: string;
  onChange: (dateStr: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value) {
      const p = new Date(value);
      if (!isNaN(p.getTime())) return p;
    }
    return new Date(2000, 0, 1);
  });

  const handleAndroidChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type !== "dismissed" && selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleIOSDone = () => {
    setShowPicker(false);
    const y = tempDate.getFullYear();
    const m = String(tempDate.getMonth() + 1).padStart(2, "0");
    const d = String(tempDate.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: 11.5,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontFamily: "Outfit",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.75}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          borderRadius: 12,
          backgroundColor: "rgba(255, 255, 255, 0.18)",
          borderWidth: 1.5,
          borderColor: error ? "rgba(248, 113, 113, 0.7)" : "rgba(255, 255, 255, 0.30)",
          paddingHorizontal: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Text
          style={{
            color: value ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
            fontSize: 14,
            fontWeight: "500",
            fontFamily: "Outfit",
          }}
        >
          {value || placeholder}
        </Text>
        <CalendarIcon color="rgba(255, 255, 255, 0.85)" size={18} />
        {Platform.OS === "web" && (
          <input
            type="date"
            value={value || ""}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e: any) => onChange(e.target.value)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        )}
      </TouchableOpacity>

      {error ? (
        <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "Outfit", marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}

      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(3, 10, 26, 0.70)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
            <View style={{ width: "100%", maxWidth: 380, backgroundColor: "rgba(10, 24, 58, 0.96)", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.3)", padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700", fontFamily: "Outfit" }}>Select Birthday</Text>
                <TouchableOpacity onPress={handleIOSDone} style={{ backgroundColor: "#1E4FD8", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontFamily: "Outfit" }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                themeVariant="dark"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  if (d) setTempDate(d);
                }}
                style={{ height: 180, width: "100%" }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const GRADE_LEVELS: Record<"Elementary" | "Junior High School" | "Senior High School", string[]> = {
  Elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};

const STUDENT_CATEGORIES = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"];

function formatPHPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

function isValidPHPhone(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  return /^09\d{9}$/.test(digits);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function detectCategoryFromEmail(email: string): "" | "Student" | "Employee" | "Outsider" {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) return "";
  if (clean.endsWith("ua.edu.ph") && clean.includes("student")) {
    return "Student";
  }
  if (clean.endsWith("@ua.edu.ph") || clean.endsWith(".ua.edu.ph")) {
    return "Employee";
  }
  return "Outsider";
}

function GlassSelectionModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (opt: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(3, 10, 26, 0.70)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            maxHeight: "80%",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.30)",
            backgroundColor: "rgba(10, 24, 58, 0.96)",
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 12,
          }}
          onStartShouldSetResponder={() => true}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.15)", marginBottom: 10 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700", fontFamily: "Outfit" }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600", fontFamily: "Outfit" }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const isSel = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: isSel ? "rgba(30, 79, 216, 0.4)" : "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: isSel ? "#60A5FA" : "rgba(255, 255, 255, 0.12)",
                    marginVertical: 3,
                  }}
                >
                  <Text style={{ color: isSel ? "#60A5FA" : "#FFFFFF", fontSize: 14, fontWeight: isSel ? "700" : "500", fontFamily: "Outfit" }}>
                    {opt}
                  </Text>
                  {isSel && <CheckIcon color="#60A5FA" size={14} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Glass Location Modal Picker ──────────────────────────────────────────────

function GlassLocationModalPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (item: { label: string; value: string }) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(3, 10, 26, 0.70)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            maxHeight: "80%",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.30)",
            backgroundColor: "rgba(10, 24, 58, 0.96)",
            overflow: "hidden",
            paddingTop: 18,
            paddingBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.12)" }}>
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", fontFamily: "Outfit" }}>{title}</Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontFamily: "Outfit" }}>{options.length} options available</Text>
            </View>
            <TouchableOpacity onPress={() => { setSearch(""); onClose(); }} style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600", fontFamily: "Outfit" }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.12)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.20)", paddingHorizontal: 12, height: 42 }}>
              <Text style={{ marginRight: 8, fontSize: 13 }}>🔍</Text>
              <TextInput
                placeholder="Search..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, color: "#FFFFFF", fontSize: 13.5, fontFamily: "Outfit", paddingVertical: 0 }}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Options List */}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            {filtered.map((item: any) => {
              const isSel = item.value === selected || item.label === selected;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    onSelect(item);
                    setSearch("");
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    marginTop: 6,
                    backgroundColor: isSel ? "rgba(30, 79, 216, 0.55)" : "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: isSel ? "#60A5FA" : "rgba(255, 255, 255, 0.12)",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: isSel ? "700" : "500", fontFamily: "Outfit", flex: 1, paddingRight: 8 }} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {isSel && <CheckIcon color="#FFFFFF" size={16} />}
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, fontFamily: "Outfit" }}>No matches found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Glass Select Row (Dropdown trigger) ───────────────────────────────────────

function GlassSelectRow({
  label,
  value,
  placeholder,
  onPress,
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: 11.5,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontFamily: "Outfit",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          borderRadius: 12,
          backgroundColor: "rgba(255, 255, 255, 0.18)",
          borderWidth: 1.5,
          borderColor: error ? "rgba(248, 113, 113, 0.7)" : "rgba(255, 255, 255, 0.30)",
          paddingHorizontal: 14,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: value ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
            fontSize: 14,
            fontWeight: "500",
            fontFamily: "Outfit",
            paddingRight: 8,
          }}
        >
          {value || placeholder}
        </Text>
        <ChevronDownIcon color="rgba(255, 255, 255, 0.7)" size={16} />
      </TouchableOpacity>
      {error ? (
        <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "Outfit", marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Glass Sex Chips ──────────────────────────────────────────────────────────

function GlassSexChips({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const options = ["Female", "Male", "Other"];
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: 11.5,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontFamily: "Outfit",
          marginBottom: 6,
        }}
      >
        Sex
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "#1E4FD8" : "rgba(255, 255, 255, 0.14)",
                borderWidth: 1.5,
                borderColor: isSelected ? "#60A5FA" : "rgba(255, 255, 255, 0.25)",
                shadowColor: isSelected ? "#1E4FD8" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.35 : 0,
                shadowRadius: 6,
                elevation: isSelected ? 3 : 0,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                  fontSize: 13.5,
                  fontWeight: isSelected ? "700" : "500",
                  fontFamily: "Outfit",
                }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? (
        <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "Outfit", marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Glass Step Header with 4 Progress Bars + Back Button ─────────────────────

function GlassStepHeader({
  step,
  total = 4,
  title,
  subtitle,
  onBack,
}: {
  step: number;
  total?: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {/* Progress Bars Row + Optional Back Button */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingRight: 40 }}>
        {step > 1 && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "rgba(255, 255, 255, 0.16)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.28)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeftIcon color="#FFFFFF" size={16} />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i + 1 <= step;
            return (
              <View
                key={i}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 2,
                  backgroundColor: isActive ? "#38BDF8" : "rgba(255, 255, 255, 0.20)",
                  shadowColor: isActive ? "#38BDF8" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isActive ? 0.6 : 0,
                  shadowRadius: 3,
                }}
              />
            );
          })}
        </View>
      </View>

      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 22,
          fontWeight: "700",
          fontFamily: "Outfit",
          letterSpacing: 0.3,
          textShadowColor: "rgba(0, 0, 0, 0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.82)",
          fontSize: 13,
          fontFamily: "Outfit",
          marginTop: 3,
          textShadowColor: "rgba(0, 0, 0, 0.3)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

// ── Standalone Glassmorphism Auth Modal ──────────────────────────────────────

interface AuthModalProps {
  visible: boolean;
  initialMode: "signin" | "create_account";
  onClose: () => void;
  onSuccessSignIn: (userEmail: string, userName: string, accessToken: string, patientId?: string) => void;
  onSuccessRegister: (
    userEmail: string,
    userName: string,
    accessToken: string,
    idNumber: string,
    fullName: string,
    finalUser?: any
  ) => void;
  onNavigateToRegister?: () => void;
}

const AuthModal = memo(function AuthModal({
  visible,
  initialMode,
  onClose,
  onSuccessSignIn,
  onSuccessRegister,
  onNavigateToRegister,
}: AuthModalProps) {
  const { showAlert } = useAlert();
  const [authMode, setAuthMode] = useState<"signin" | "create_account">(initialMode);
  const animVal = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInGeneralError, setSignInGeneralError] = useState("");

  // Create Account Multi-Step Shared State
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;

  const [createForm, setCreateForm] = useState({
    // Step 1: Category Selection
    category: "" as "" | "Student" | "Employee" | "Outsider",
    // Step 2: Account
    email: "",
    password: "",
    confirmPassword: "",
    // Step 3: Basic Info
    fullName: "",
    dob: "",
    sex: "",
    contact: "",
    emergencyName: "",
    emergencyPhone: "",
    // Step 4: Category Specific
    studentId: "",
    studentCategory: "" as "" | "Elementary" | "Junior High School" | "Senior High School" | "College",
    gradeLevel: "",
    guardianName: "",
    course: "",
    yearLevel: "",
    employeeId: "",
    position: "",
    department: "",
    outsiderId: "",
    address: "",
  });

  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regGeneralError, setRegGeneralError] = useState("");

  // Web Cura Account Detection & OTP Claim State
  const [emailChecking, setEmailChecking] = useState(false);
  const [isClaimingWebAccount, setIsClaimingWebAccount] = useState(false);
  const [claimStep, setClaimStep] = useState<1 | 2>(1); // 1 = OTP, 2 = Set Password
  const [claimOtp, setClaimOtp] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimConfirmPassword, setClaimConfirmPassword] = useState("");
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResendCooldown, setClaimResendCooldown] = useState(0);

  // Real-time detection for Sign In
  const [signInCheckingEmail, setSignInCheckingEmail] = useState(false);
  const [signInDetectedPatient, setSignInDetectedPatient] = useState<{
    id: string;
    name: string;
    category: string;
    claimed: boolean;
  } | null>(null);
  const [signInOtpMode, setSignInOtpMode] = useState(false);
  const [signInOtp, setSignInOtp] = useState("");
  const [signInOtpLoading, setSignInOtpLoading] = useState(false);
  const [signInOtpSent, setSignInOtpSent] = useState(false);
  const [signInOtpCooldown, setSignInOtpCooldown] = useState(0);

  // Real-time detection & missing fields for Create Account
  const [createDetectedPatient, setCreateDetectedPatient] = useState<{
    id: string;
    name: string;
    category: string;
    claimed: boolean;
    missing_fields?: string[];
  } | null>(null);
  const [claimMissingFields, setClaimMissingFields] = useState<string[]>([]);
  const [isCategoryLocked, setIsCategoryLocked] = useState(false);
  const [isGooglePrefilled, setIsGooglePrefilled] = useState(false);
  const [claimMissingData, setClaimMissingData] = useState({
    contact: "",
    dob: "",
    sex: "",
    emergencyName: "",
    emergencyPhone: "",
    course: "",
    yearLevel: "",
    gradeLevel: "",
    guardianName: "",
    address: "",
  });

  // Forgot Password Multi-Step State (1 = Email, 2 = 6-digit OTP, 3 = New Password)
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Forgot Password OTP resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [forgotCooldown]);

  // OTP resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (claimResendCooldown > 0) {
      timer = setInterval(() => {
        setClaimResendCooldown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [claimResendCooldown]);

  // Sign In OTP resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (signInOtpCooldown > 0) {
      timer = setInterval(() => {
        setSignInOtpCooldown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [signInOtpCooldown]);

  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  }, []);

  // Debounced email check for Sign In while user is typing
  useEffect(() => {
    const trimmed = signInIdentifier.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setSignInDetectedPatient(null);
      setSignInCheckingEmail(false);
      return;
    }

    setSignInCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.exists && data.patient) {
          triggerHaptic();
          setSignInDetectedPatient({
            id: data.patient.id,
            name: data.patient.name,
            category: data.patient.category,
            claimed: Boolean(data.claimed),
          });
        } else {
          setSignInDetectedPatient(null);
        }
      } catch {
        setSignInDetectedPatient(null);
      } finally {
        setSignInCheckingEmail(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [signInIdentifier, triggerHaptic]);

  // Debounced email check for Create Account while user is typing
  useEffect(() => {
    const trimmed = createForm.email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setCreateDetectedPatient(null);
      setEmailChecking(false);
      return;
    }

    setEmailChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.exists && data.patient) {
          triggerHaptic();
          const p = data.patient;
          const missing = data.missing_fields || [];
          setCreateDetectedPatient({
            id: p.id,
            name: p.name,
            category: p.category,
            claimed: Boolean(data.claimed),
            missing_fields: missing,
          });
          setClaimMissingFields(missing);

          const detectedCat = p.category || detectCategoryFromEmail(trimmed);
          setCreateForm((prev) => ({
            ...prev,
            category: detectedCat,
            fullName: p.name || prev.fullName,
            contact: p.contact || prev.contact,
            dob: p.birthday || prev.dob,
            sex: p.sex || prev.sex,
            emergencyName: p.emergencyContact || prev.emergencyName,
            emergencyPhone: p.emergencyPhone || prev.emergencyPhone,
            studentId: p.id || prev.studentId,
            employeeId: p.id || prev.employeeId,
            studentCategory: p.studentCategory || prev.studentCategory,
            gradeLevel: p.gradeLevel || prev.gradeLevel,
            guardianName: p.guardianName || prev.guardianName,
            course: p.course || prev.course,
            yearLevel: p.yearLevel || prev.yearLevel,
            position: p.position || prev.position,
            department: p.department || prev.department,
            address: p.address || prev.address,
          }));
          setClaimMissingData({
            contact: p.contact || "",
            dob: p.birthday || "",
            sex: p.sex || "",
            emergencyName: p.emergencyContact || "",
            emergencyPhone: p.emergencyPhone || "",
            course: p.course || "",
            yearLevel: p.yearLevel || "",
            gradeLevel: p.gradeLevel || "",
            guardianName: p.guardianName || "",
            address: p.address || "",
          });
        } else {
          setCreateDetectedPatient(null);
          setClaimMissingFields([]);
        }
      } catch {
        setCreateDetectedPatient(null);
      } finally {
        setEmailChecking(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [createForm.email, triggerHaptic]);

  // Debounced ID check for Step 2 while user is typing ID
  useEffect(() => {
    if (createStep !== 2) return;
    const currentId = (
      createForm.category === "Student" ? createForm.studentId :
      createForm.category === "Employee" ? createForm.employeeId :
      createForm.outsiderId || ""
    ).trim();

    if (currentId.length < 3) {
      if (createDetectedPatient && !createDetectedPatient.id) {
        setCreateDetectedPatient(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: createForm.email.trim().toLowerCase(), id: currentId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.exists && data.patient) {
          triggerHaptic();
          const p = data.patient;
          const missing = data.missing_fields || [];
          setCreateDetectedPatient({
            id: p.id,
            name: p.name,
            category: p.category,
            claimed: Boolean(data.claimed),
            missing_fields: missing,
          });
          setClaimMissingFields(missing);
          setCreateForm((prev) => ({
            ...prev,
            category: p.category || prev.category,
            fullName: p.name || prev.fullName,
            contact: p.contact || prev.contact,
            dob: p.birthday || prev.dob,
            sex: p.sex || prev.sex,
            emergencyName: p.emergencyContact || prev.emergencyName,
            emergencyPhone: p.emergencyPhone || prev.emergencyPhone,
            studentId: p.category === "Student" ? p.id : prev.studentId,
            employeeId: p.category === "Employee" ? p.id : prev.employeeId,
            studentCategory: p.studentCategory || prev.studentCategory,
            gradeLevel: p.gradeLevel || prev.gradeLevel,
            guardianName: p.guardianName || prev.guardianName,
            course: p.course || prev.course,
            yearLevel: p.yearLevel || prev.yearLevel,
            position: p.position || prev.position,
            department: p.department || prev.department,
            address: p.address || prev.address,
          }));
          setClaimMissingData({
            contact: p.contact || "",
            dob: p.birthday || "",
            sex: p.sex || "",
            emergencyName: p.emergencyContact || "",
            emergencyPhone: p.emergencyPhone || "",
            course: p.course || "",
            yearLevel: p.yearLevel || "",
            gradeLevel: p.gradeLevel || "",
            guardianName: p.guardianName || "",
            address: p.address || "",
          });
        } else {
          setCreateDetectedPatient(null);
        }
      } catch {
        setCreateDetectedPatient(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [createStep, createForm.category, createForm.studentId, createForm.employeeId, createForm.outsiderId, createForm.email, triggerHaptic]);

  // Category select modals (Student Classification, Grade Level, Year Level)
  const [selectModalType, setSelectModalType] = useState<"studentCategory" | "gradeLevel" | "yearLevel" | null>(null);

  // Input refs for keyboard navigation
  const signInPasswordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const regPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const fullNameRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);
  const emergencyNameRef = useRef<TextInput>(null);
  const emergencyPhoneRef = useRef<TextInput>(null);
  const studentIdRef = useRef<TextInput>(null);
  const courseRef = useRef<TextInput>(null);
  const guardianNameRef = useRef<TextInput>(null);
  const employeeIdRef = useRef<TextInput>(null);
  const positionRef = useRef<TextInput>(null);
  const departmentRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setAuthMode(initialMode);
      setSignInErrors({});
      setSignInGeneralError("");
      setRegErrors({});
      setRegGeneralError("");
      setCreateStep(1);
      setIsClaimingWebAccount(false);
      setClaimStep(1);
      setClaimOtp("");
      setClaimPassword("");
      setClaimConfirmPassword("");
      setClaimErrors({});
      setClaimLoading(false);
      setEmailChecking(false);
      setSignInOtpMode(false);
      setSignInOtpSent(false);
      setSignInOtp("");
      setIsCategoryLocked(false);
      setIsGooglePrefilled(false);
      setIsForgotPassword(false);
      setForgotStep(1);
      setForgotOtp("");
      setForgotPassword("");
      setForgotConfirmPassword("");
      setForgotErrors({});
      setForgotLoading(false);
      stepFadeAnim.setValue(1);
      stepSlideAnim.setValue(0);
      contentFadeAnim.setValue(1);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialMode]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(animVal, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsClaimingWebAccount(false);
      setClaimStep(1);
      setClaimOtp("");
      setClaimErrors({});
      setSignInOtpMode(false);
      setSignInOtpSent(false);
      setSignInOtp("");
      setIsCategoryLocked(false);
      setIsGooglePrefilled(false);
      setIsForgotPassword(false);
      setForgotStep(1);
      setForgotOtp("");
      setForgotPassword("");
      setForgotConfirmPassword("");
      setForgotErrors({});
      onClose();
    });
  }, [animVal, onClose]);

  const switchAuthMode = useCallback((newMode: "signin" | "create_account") => {
    triggerHaptic();
    setAuthMode(newMode);
    setSignInErrors({});
    setSignInGeneralError("");
    setRegErrors({});
    setRegGeneralError("");
    setCreateStep(1);
    setIsClaimingWebAccount(false);
    setClaimStep(1);
    setClaimOtp("");
    setClaimErrors({});
    setSignInOtpMode(false);
    setSignInOtpSent(false);
    setSignInOtp("");
    setIsCategoryLocked(false);
    setIsGooglePrefilled(false);
    setIsGoogleSignup(false);
    setIsForgotPassword(false);
    setForgotStep(1);
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setForgotErrors({});
    setGoogleVerifiedEmail("");
    setModalGooglePendingToken("");

    if (Platform.OS === "web") {
      contentFadeAnim.setValue(1);
      stepFadeAnim.setValue(1);
      stepSlideAnim.setValue(0);
    } else {
      contentFadeAnim.setValue(0);
      stepFadeAnim.setValue(1);
      stepSlideAnim.setValue(0);
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }).start();
    }
  }, [triggerHaptic, contentFadeAnim, stepFadeAnim, stepSlideAnim]);

  // Step Transition Animator: Immediately switches step and guarantees visibility
  const goToCreateStep = useCallback((targetStep: 1 | 2 | 3 | 4 | 5, direction: "next" | "back") => {
    triggerHaptic();
    Keyboard.dismiss();
    setCreateStep(targetStep);
    setRegErrors({});
    setRegGeneralError("");

    if (Platform.OS === "web") {
      stepFadeAnim.setValue(1);
      stepSlideAnim.setValue(0);
      return;
    }

    stepSlideAnim.setValue(direction === "next" ? 20 : -20);
    stepFadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(stepFadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }),
      Animated.timing(stepSlideAnim, { toValue: 0, duration: 170, useNativeDriver: true }),
    ]).start();
  }, [triggerHaptic, stepFadeAnim, stepSlideAnim]);

  // Sign In Handlers
  const handleSignIn = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!signInIdentifier.trim()) errs.identifier = "Username or email is required";
    if (!signInPassword) errs.password = "Password is required";
    if (Object.keys(errs).length > 0) {
      setSignInErrors(errs);
      return;
    }
    setSignInErrors({});
    setSignInGeneralError("");
    setSignInLoading(true);

    try {
      const loginRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: signInIdentifier.trim(), password: signInPassword }),
      });
      const resText = await loginRes.text();
      let loginData: any = {};
      try { loginData = resText ? JSON.parse(resText) : {}; } catch {}

      if (loginRes.ok) {
        const userEmail = loginData.user?.email || signInIdentifier.trim();
        const userName = (loginData.user?.name || userEmail.split("@")[0]).toUpperCase();
        onSuccessSignIn(userEmail, userName, loginData.access || "", loginData.user?.id || loginData.user?.patient_id);
      } else {
        setSignInGeneralError(loginData.detail || loginData.error || "Invalid username/email or password.");
      }
    } catch (e) {
      setSignInGeneralError("Network error. Please check your connection.");
    } finally {
      setSignInLoading(false);
    }
  }, [signInIdentifier, signInPassword, onSuccessSignIn]);

  const [modalGoogleLoading, setModalGoogleLoading] = useState(false);
  const [modalGooglePendingToken, setModalGooglePendingToken] = useState("");
  const [modalGoogleTargetMode, setModalGoogleTargetMode] = useState<"signin" | "create_account">("signin");
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [googleVerifiedEmail, setGoogleVerifiedEmail] = useState("");
  const [, modalGoogleResponse, modalGooglePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  const onModalGoogleSuccess = useCallback(async (
    idToken: string,
    fallbackEmail?: string,
    fallbackName?: string,
    modeOverride?: "signin" | "create_account"
  ) => {
    const targetMode = modeOverride || modalGoogleTargetMode || authMode || "signin";
    try {
      setSignInGeneralError("");
      setRegGeneralError("");

      // 1. Resolve email and name from token or fallback parameters
      let cleanEmail = (fallbackEmail || "").trim().toLowerCase();
      let cleanName = (fallbackName || "").trim();
      if (!cleanEmail) {
        const parsed = parseGoogleIdToken(idToken);
        if (parsed?.email) cleanEmail = parsed.email.trim().toLowerCase();
        if (parsed?.name && !cleanName) cleanName = parsed.name.trim();
      }

      // 2. Check email against database
      let checkData: any = null;
      if (cleanEmail) {
        try {
          const checkRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail }),
          });
          checkData = await checkRes.json().catch(() => ({}));
        } catch (e) {}
      }

      // =========================================================================
      // CASE 1: SIGN IN MODE ("ito ay sa sign in ah")
      // If no account exists for this Google email:
      // Tell user no account found, do NOT log in, do NOT create account.
      // =========================================================================
      if (targetMode === "signin") {
        if (checkData && !checkData.claimed) {
          const msg = `No account found for this Google account (${cleanEmail || "unregistered"}). Please create an account first.`;
          setSignInGeneralError(msg);
          showAlert("Account Not Found", msg);
          setModalGoogleLoading(false);
          return;
        }

        const data = await authenticateWithCuraBackend(idToken, cleanEmail, cleanName, undefined, "signin");
        if (data.require_otp) {
          setModalGooglePendingToken(idToken);
          if (data.email) {
            setSignInIdentifier(data.email);
          }
          setAuthMode("signin");
          setSignInOtpMode(true);
          setSignInOtpSent(true);
          setSignInOtpCooldown(60);
          setSignInGeneralError("");
          setRegGeneralError("");
          setModalGoogleLoading(false);
          return;
        }

        const userEmail = data.user?.email || cleanEmail || "user@ua.edu.ph";
        const userName = (data.user?.first_name || data.user?.name || cleanName || userEmail.split("@")[0]).toUpperCase();

        if (data.access) {
          await AsyncStorage.setItem("@cura_access_token", data.access).catch(() => {});
        }
        const sessionUser = {
          email: userEmail,
          firstName: userName,
          displayName: userName,
          lastName: data.user?.last_name || "",
          accessToken: data.access,
          role: data.user?.category || "Student",
          id: data.user?.patient_id,
        };
        await AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});

        onSuccessSignIn(userEmail, userName, data.access || "", data.user?.patient_id || data.user?.id);
        return;
      }

      // =========================================================================
      // CASE 2: CREATE ACCOUNT MODE ("tapos pag sa create account naman")
      // If user continues with Google and has no account:
      // Fill up the registration form based on Google account (Student, Employee, Outsider),
      // do NOT automatically finish/create the account without filling the form!
      // =========================================================================
      if (targetMode === "create_account") {
        if (checkData?.claimed) {
          const msg = `This Google account (${cleanEmail}) is already registered. Please sign in instead.`;
          setRegGeneralError(msg);
          setRegErrors({ email: msg });
          showAlert("Account Already Registered", msg);
          setModalGoogleLoading(false);
          return;
        }

        // Auto-infer category based on email domain
        let detectedCat: any = detectCategoryFromEmail(cleanEmail);
        if (!detectedCat && checkData?.patient?.category) {
          detectedCat = checkData.patient.category;
        }
        if (!detectedCat) {
          detectedCat = "Outsider";
        }

        const displayName = (cleanName || checkData?.patient?.name || cleanEmail.split("@")[0]).toUpperCase();

        // Populate createForm with Google details + any existing clinic masterlist data
        setCreateForm((prev) => ({
          ...prev,
          email: cleanEmail,
          fullName: displayName,
          category: detectedCat,
          studentId: checkData?.patient?.studentId || checkData?.patient?.id || prev.studentId,
          studentCategory: checkData?.patient?.studentCategory || prev.studentCategory,
          course: checkData?.patient?.course || prev.course,
          yearLevel: checkData?.patient?.yearLevel || prev.yearLevel,
          gradeLevel: checkData?.patient?.gradeLevel || prev.gradeLevel,
          guardianName: checkData?.patient?.guardianName || prev.guardianName,
          employeeId: checkData?.patient?.employeeId || checkData?.patient?.id || prev.employeeId,
          position: checkData?.patient?.position || prev.position,
          department: checkData?.patient?.department || prev.department,
          contact: checkData?.patient?.contact || prev.contact,
          dob: checkData?.patient?.birthday || prev.dob,
          sex: checkData?.patient?.sex || prev.sex,
          address: checkData?.patient?.address || prev.address,
          emergencyName: checkData?.patient?.emergencyContact || prev.emergencyName,
          emergencyPhone: checkData?.patient?.emergencyPhone || prev.emergencyPhone,
        }));

        setIsGoogleSignup(true);
        setGoogleVerifiedEmail(cleanEmail);
        setModalGooglePendingToken(idToken);
        setRegErrors({});
        setRegGeneralError("");
        goToCreateStep(2, "next");
      }
    } catch (err: any) {
      const isNotFound = Boolean(err?.not_found || err?.code === "ACCOUNT_NOT_FOUND" || err?.status === 404);
      const isAlreadyExists = Boolean(err?.already_exists || err?.code === "ACCOUNT_ALREADY_EXISTS");
      const msg = err?.message || "Google authentication failed. Please try again.";

      if (targetMode === "signin") {
        const notFoundMsg = isNotFound
          ? "No account found for this Google account. Please create an account first."
          : msg;
        setSignInGeneralError(notFoundMsg);
        showAlert("Account Not Found", notFoundMsg);
      } else {
        const existsMsg = isAlreadyExists
          ? "This Google account is already registered. Please sign in."
          : msg;
        setRegGeneralError(existsMsg);
        showAlert(isAlreadyExists ? "Account Already Registered" : "Registration Failed", existsMsg);
      }
    } finally {
      setModalGoogleLoading(false);
    }
  }, [modalGoogleTargetMode, authMode, onSuccessSignIn, goToCreateStep, showAlert, switchAuthMode]);

  useEffect(() => {
    if (modalGoogleResponse?.type === "success" && modalGoogleResponse.params?.id_token) {
      onModalGoogleSuccess(modalGoogleResponse.params.id_token, undefined, undefined, modalGoogleTargetMode);
    }
  }, [modalGoogleResponse, onModalGoogleSuccess, modalGoogleTargetMode]);

  const handleModalGoogleSignIn = async (targetMode: "signin" | "create_account" = authMode || "signin") => {
    setModalGoogleTargetMode(targetMode);
    setSignInGeneralError("");
    setRegGeneralError("");
    if (Platform.OS === "web") {
      setModalGoogleLoading(true);
      try {
        const res = await signInWithGooglePopup();
        await onModalGoogleSuccess(res.idToken, res.email, res.displayName, targetMode);
      } catch (err: any) {
        if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
          let msg = err?.message || "Google Sign-In failed. Please try again.";
          if (err?.code === "auth/unauthorized-domain") {
            msg = `Domain (${window?.location?.hostname}) is not authorized in Firebase. Please add it to Firebase Authorized Domains.`;
          }
          if (targetMode === "signin") {
            setSignInGeneralError(msg);
          } else {
            setRegGeneralError(msg);
          }
        }
      } finally {
        setModalGoogleLoading(false);
      }
    } else {
      if (modalGooglePromptAsync) {
        modalGooglePromptAsync();
      }
    }
  };

  const handleSendSignInOTP = useCallback(async () => {
    const cleanEmail = signInIdentifier.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setSignInErrors({ identifier: "Enter a valid email address." });
      return;
    }
    setSignInErrors({});
    setSignInGeneralError("");
    setSignInOtpLoading(true);

    try {
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, is_google: Boolean(modalGooglePendingToken) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerHaptic();
        setSignInOtpSent(true);
        setSignInOtpMode(true);
        setSignInOtpCooldown(60);
        setSignInOtp("");
      } else {
        setSignInGeneralError(data.error || "Failed to send OTP code.");
      }
    } catch {
      setSignInGeneralError("Network error. Please try again.");
    } finally {
      setSignInOtpLoading(false);
    }
  }, [signInIdentifier, triggerHaptic, modalGooglePendingToken]);

  const handleVerifySignInOTP = useCallback(async () => {
    const cleanOtp = signInOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setSignInErrors({ otp: "Enter 6-digit OTP code" });
      return;
    }
    const cleanEmail = signInIdentifier.trim().toLowerCase();
    setSignInErrors({});
    setSignInGeneralError("");
    setSignInOtpLoading(true);

    try {
      if (modalGooglePendingToken) {
        const data = await authenticateWithCuraBackend(modalGooglePendingToken, cleanEmail, undefined, cleanOtp);
        if (data.access) {
          triggerHaptic();
          const userEmail = data.user?.email || cleanEmail;
          const userName = (data.user?.first_name || data.user?.name || userEmail.split("@")[0]).toUpperCase();
          await AsyncStorage.setItem("@cura_access_token", data.access).catch(() => {});
          await AsyncStorage.setItem("@cura_user_session", JSON.stringify({
            email: userEmail,
            firstName: userName,
            displayName: userName,
            lastName: data.user?.last_name || "",
            accessToken: data.access,
            role: data.user?.category || "Student",
            id: data.user?.patient_id,
          })).catch(() => {});
          onSuccessSignIn(userEmail, userName, data.access, data.user?.patient_id || data.user?.id);
          return;
        }
      }

      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        triggerHaptic();
        if (data.access) {
          onSuccessSignIn(cleanEmail, data.user?.name || cleanEmail.split("@")[0], data.access, data.user?.id || data.user?.patient_id);
        } else {
          setCreateForm((f) => ({
            ...f,
            email: cleanEmail,
            fullName: data.user?.name || signInDetectedPatient?.name || "",
            category: (signInDetectedPatient?.category as any) || "Student",
          }));
          setIsClaimingWebAccount(true);
          setClaimStep(2);
          setAuthMode("create_account");
        }
      } else {
        setSignInErrors({ otp: data.error || "Invalid or expired OTP." });
      }
    } catch (err: any) {
      setSignInErrors({ otp: err?.message || "Invalid verification code." });
    } finally {
      setSignInOtpLoading(false);
    }
  }, [signInOtp, signInIdentifier, signInDetectedPatient, triggerHaptic, onSuccessSignIn, modalGooglePendingToken]);

  // Step 1 Validation & Next: Account Email & Auto Category Identification (with Web Cura Detection)
  const handleStep1Next = useCallback(async () => {
    const errs: Record<string, string> = {};
    const trimmedEmail = createForm.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email address is required";
    } else if (!isValidEmail(trimmedEmail)) {
      errs.email = "Please enter a valid email address";
    }

    const detected = detectCategoryFromEmail(trimmedEmail);
    const chosenCategory = detected || (createDetectedPatient?.category as any) || "Outsider";

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    if (isGoogleSignup && googleVerifiedEmail && trimmedEmail.toLowerCase() === googleVerifiedEmail.toLowerCase()) {
      setCreateForm((f) => ({ ...f, email: trimmedEmail.toLowerCase(), category: chosenCategory }));
      goToCreateStep(2, "next");
      return;
    }

    setRegErrors({});
    setEmailChecking(true);

    try {
      const cleanEmail = trimmedEmail.toLowerCase();
      let checkData: any = createDetectedPatient;
      if (!checkData) {
        const checkRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        checkData = await checkRes.json().catch(() => ({}));
      }

      if (checkData?.exists || createDetectedPatient) {
        if (checkData?.claimed || createDetectedPatient?.claimed) {
          setRegErrors({
            email: "This account is already registered. Please sign in.",
          });
          setEmailChecking(false);
          return;
        }

        // Account is already in Web CURA! Request OTP from Render backend
        const otpRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const otpData = await otpRes.json().catch(() => ({}));

        if (!otpRes.ok) {
          setRegErrors({
            email: otpData.error || "Failed to send verification code. Please try again.",
          });
          setEmailChecking(false);
          return;
        }

        triggerHaptic();
        setCreateForm((f) => ({ ...f, email: cleanEmail, category: chosenCategory }));
        setIsClaimingWebAccount(true);
        setClaimStep(1);
        setClaimOtp("");
        setClaimPassword("");
        setClaimConfirmPassword("");
        setClaimErrors({});
        setClaimResendCooldown(30);
        setEmailChecking(false);
        return;
      }

      // Not yet added in Web CURA: proceed with normal multi-step registration
      setCreateForm((f) => ({ ...f, email: cleanEmail, category: chosenCategory }));
      goToCreateStep(2, "next");
    } catch (err) {
      setRegErrors({
        email: "Unable to verify email with clinic servers. Please try again.",
      });
    } finally {
      setEmailChecking(false);
    }
  }, [createForm.email, createForm.category, isCategoryLocked, createDetectedPatient, goToCreateStep, triggerHaptic, isGoogleSignup, googleVerifiedEmail]);

  // Step 2 Validation & Next: ID Verification & Clinic Record Detection
  const handleStep2Next = useCallback(async () => {
    const errs: Record<string, string> = {};
    const { category } = createForm;
    const enteredId = (
      category === "Student" ? createForm.studentId :
      category === "Employee" ? createForm.employeeId :
      createForm.outsiderId || ""
    ).trim();

    const errKey = category === "Student" ? "studentId" : category === "Employee" ? "employeeId" : "outsiderId";

    if (category === "Student" && !enteredId) {
      errs.studentId = "Student ID is required";
    } else if (category === "Employee" && !enteredId) {
      errs.employeeId = "Employee ID is required";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    if (!enteredId) {
      // Outsider without ID: proceed to basic info
      goToCreateStep(3, "next");
      return;
    }

    setRegLoading(true);
    setRegErrors({});

    try {
      const cleanEmail = createForm.email.trim().toLowerCase();
      let checkData: any = createDetectedPatient;

      if (!checkData || checkData.id !== enteredId) {
        const checkRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, id: enteredId }),
        });
        checkData = await checkRes.json().catch(() => ({}));
      }

      if (checkData?.exists && checkData?.patient) {
        if (checkData.claimed) {
          setRegErrors({
            [errKey]: "This ID is already linked to an active account. Please sign in.",
          });
          setRegLoading(false);
          return;
        }

        // Unclaimed clinic record found in database! Send OTP to user's email to claim account
        const otpRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, id: enteredId }),
        });
        const otpData = await otpRes.json().catch(() => ({}));

        if (!otpRes.ok) {
          setRegErrors({
            [errKey]: otpData.error || "Failed to send verification code to your email. Please try again.",
          });
          setRegLoading(false);
          return;
        }

        triggerHaptic();
        const p = checkData.patient;
        const missing = checkData.missing_fields || [];
        setCreateDetectedPatient({
          id: p.id,
          name: p.name || "",
          category: p.category || category,
          claimed: false,
          missing_fields: missing,
        });
        setClaimMissingFields(missing);
        setCreateForm((prev) => ({
          ...prev,
          category: p.category || prev.category,
          fullName: p.name || prev.fullName,
          contact: p.contact || prev.contact,
          dob: p.birthday || prev.dob,
          sex: p.sex || prev.sex,
          emergencyName: p.emergencyContact || prev.emergencyName,
          emergencyPhone: p.emergencyPhone || prev.emergencyPhone,
          studentId: p.category === "Student" ? p.id : prev.studentId,
          employeeId: p.category === "Employee" ? p.id : prev.employeeId,
          studentCategory: p.studentCategory || prev.studentCategory,
          gradeLevel: p.gradeLevel || prev.gradeLevel,
          guardianName: p.guardianName || prev.guardianName,
          course: p.course || prev.course,
          yearLevel: p.yearLevel || prev.yearLevel,
          position: p.position || prev.position,
          department: p.department || prev.department,
          address: p.address || prev.address,
        }));
        setClaimMissingData({
          contact: p.contact || "",
          dob: p.birthday || "",
          sex: p.sex || "",
          emergencyName: p.emergencyContact || "",
          emergencyPhone: p.emergencyPhone || "",
          course: p.course || "",
          yearLevel: p.yearLevel || "",
          gradeLevel: p.gradeLevel || "",
          guardianName: p.guardianName || "",
          address: p.address || "",
        });

        setIsClaimingWebAccount(true);
        setClaimStep(1);
        setClaimOtp("");
        setClaimPassword("");
        setClaimConfirmPassword("");
        setClaimErrors({});
        setClaimResendCooldown(30);
        setRegLoading(false);
        return;
      }

      // Not found in clinic records: proceed to Step 3 (Basic Information)
      goToCreateStep(3, "next");
    } catch (err) {
      console.warn("Clinic ID check warning:", err);
      goToCreateStep(3, "next");
    } finally {
      setRegLoading(false);
    }
  }, [
    createForm.category,
    createForm.studentId,
    createForm.employeeId,
    createForm.outsiderId,
    createForm.email,
    createDetectedPatient,
    goToCreateStep,
    triggerHaptic,
  ]);

  // Step 3 Validation & Next: Basic Information
  const handleStep3Next = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!createForm.fullName.trim()) {
      errs.fullName = "Full name is required";
    }

    if (!createForm.dob) {
      errs.dob = "Birthday is required";
    } else {
      const bDate = new Date(createForm.dob);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate > today) {
        errs.dob = "Birthday cannot be in the future";
      }
    }

    if (!createForm.sex) {
      errs.sex = "Please select sex";
    }

    const contactDigits = createForm.contact.replace(/\D/g, "");
    if (!contactDigits) {
      errs.contact = "Contact number is required";
    } else if (!isValidPHPhone(createForm.contact) && !/^09\d{9}$/.test(contactDigits)) {
      errs.contact = "Must be valid PH mobile (09XX-XXX-XXXX)";
    }

    if (!createForm.emergencyName.trim()) {
      errs.emergencyName = "Emergency contact name is required";
    }

    const emDigits = createForm.emergencyPhone.replace(/\D/g, "");
    if (!emDigits) {
      errs.emergencyPhone = "Emergency contact number is required";
    } else if (!isValidPHPhone(createForm.emergencyPhone) && !/^09\d{9}$/.test(emDigits)) {
      errs.emergencyPhone = "Must be valid PH mobile (09XX-XXX-XXXX)";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    goToCreateStep(4, "next");
  }, [createForm.fullName, createForm.dob, createForm.sex, createForm.contact, createForm.emergencyName, createForm.emergencyPhone, goToCreateStep]);

  // Step 4 Validation & Submit: Password & Complete Registration
  const handleGetStarted = useCallback(async () => {
    const errs: Record<string, string> = {};

    if (!isGooglePrefilled) {
      if (!createForm.password) {
        errs.password = "Password is required";
      } else if (createForm.password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }

      if (!createForm.confirmPassword) {
        errs.confirmPassword = "Confirm password is required";
      } else if (createForm.confirmPassword !== createForm.password) {
        errs.confirmPassword = "Passwords do not match";
      }
    } else {
      if (createForm.password) {
        if (createForm.password.length < 6) {
          errs.password = "Password must be at least 6 characters";
        }
        if (createForm.confirmPassword && createForm.confirmPassword !== createForm.password) {
          errs.confirmPassword = "Passwords do not match";
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    setRegErrors({});
    setRegGeneralError("");
    setRegLoading(true);

    try {
      const { category } = createForm;
      const trimmedEmail = createForm.email.trim().toLowerCase();
      const trimmedName = createForm.fullName.trim().toUpperCase();
      const selectedId = category === "Student" ? createForm.studentId.trim() : category === "Employee" ? createForm.employeeId.trim() : "";
      const finalPassword = createForm.password || `Ggl_${Math.random().toString(36).slice(2)}${Date.now()}!`;

      // Step A: Register API call
      const regRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: finalPassword,
          username: trimmedEmail,
          name: trimmedName,
          id_number: selectedId,
          role: category,
        }),
      });

      const resText = await regRes.text();
      let regData: any = {};
      try { regData = resText ? JSON.parse(resText) : {}; } catch {}

      if (!regRes.ok && !regData.access) {
        const msg = regData.error || regData.detail || (typeof regData === "object" ? Object.values(regData)[0] : "Registration failed.");
        setRegGeneralError(String(msg));
        showAlert("Registration Failed", String(msg));
        setRegLoading(false);
        return;
      }

      const token = regData.access || "";

      // Calculate age
      let age = 0;
      if (createForm.dob) {
        const bdate = new Date(createForm.dob);
        if (!isNaN(bdate.getTime())) {
          const now = new Date();
          age = now.getFullYear() - bdate.getFullYear();
          const m = now.getMonth() - bdate.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < bdate.getDate())) age--;
        }
      }

      // Step B: Complete profile payload
      const profilePayload: Record<string, any> = {
        name: trimmedName,
        category: category,
        contact: createForm.contact.replace(/\D/g, ""),
        birthday: createForm.dob,
        age: Math.max(0, age),
        sex: createForm.sex,
        emergencyContact: createForm.emergencyName.trim().toUpperCase(),
        emergencyPhone: createForm.emergencyPhone.replace(/\D/g, ""),
      };

      if (category === "Student") {
        profilePayload.id = createForm.studentId.trim();
        profilePayload.studentCategory = createForm.studentCategory;
        if (createForm.studentCategory === "College") {
          profilePayload.course = createForm.course.trim();
          profilePayload.yearLevel = createForm.yearLevel.trim();
        } else {
          profilePayload.gradeLevel = createForm.gradeLevel.trim();
          profilePayload.guardianName = createForm.guardianName.trim().toUpperCase();
        }
      } else if (category === "Employee") {
        profilePayload.id = createForm.employeeId.trim();
        profilePayload.position = createForm.position.trim();
        profilePayload.department = createForm.department.trim();
      } else if (category === "Outsider") {
        profilePayload.address = createForm.address.trim();
      }

      if (token) {
        await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/complete-profile/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(profilePayload),
        }).catch((err) => {
          console.warn("Complete profile warning:", err);
        });
      }

      // Step C: Build final AppUser object
      const assignedId = selectedId || regData.user?.id || `OUT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const finalUser: any = {
        id: assignedId,
        id_number: assignedId,
        name: trimmedName,
        firstName: trimmedName.split(" ")[0] || "",
        lastName: trimmedName.split(" ").slice(1).join(" ") || "",
        displayName: trimmedName,
        email: trimmedEmail,
        phone: createForm.contact.trim(),
        dob: createForm.dob,
        gender: createForm.sex,
        category: category.toLowerCase() as PatientCategory,
        studentCategory: category === "Student" ? createForm.studentCategory : undefined,
        gradeLevel: category === "Student" ? createForm.gradeLevel : undefined,
        guardianName: category === "Student" ? createForm.guardianName.trim().toUpperCase() : undefined,
        course: category === "Student" ? createForm.course.trim() : undefined,
        yearLevel: category === "Student" ? createForm.yearLevel : undefined,
        position: category === "Employee" ? createForm.position.trim() : undefined,
        department: category === "Employee" ? createForm.department.trim() : undefined,
        address: category === "Outsider" ? createForm.address.trim() : undefined,
        emergencyName: createForm.emergencyName.trim().toUpperCase(),
        emergencyPhone: createForm.emergencyPhone.trim(),
        accessToken: token,
      };

      await AsyncStorage.setItem("@cura_user_session", JSON.stringify(finalUser)).catch(() => {});
      if (token) {
        await AsyncStorage.setItem("@cura_access_token", token).catch(() => {});
      }

      onSuccessRegister(
        trimmedEmail,
        finalUser.displayName,
        token,
        assignedId,
        finalUser.name,
        finalUser
      );
    } catch (e: any) {
      const msg = e?.message || "Network error. Please check your connection and try again.";
      setRegGeneralError(msg);
      showAlert("Error", msg);
    } finally {
      setRegLoading(false);
    }
  }, [createForm, onSuccessRegister, showAlert]);

  // Step 4 Validation & Next: Category-Specific Details
  const handleStep4Next = useCallback(() => {
    const errs: Record<string, string> = {};
    const { category } = createForm;

    if (category === "Student") {
      if (!createForm.studentCategory) {
        errs.studentCategory = "Student classification is required";
      }
      if (createForm.studentCategory === "College") {
        if (!createForm.course.trim()) errs.course = "Course / Program is required";
        if (!createForm.yearLevel.trim()) errs.yearLevel = "Year Level is required";
      } else if (createForm.studentCategory) {
        if (!createForm.gradeLevel.trim()) errs.gradeLevel = "Grade level is required";
        if (!createForm.guardianName.trim()) errs.guardianName = "Guardian name is required";
      }
    } else if (category === "Employee") {
      if (!createForm.position.trim()) errs.position = "Position is required";
      if (!createForm.department.trim()) errs.department = "Department is required";
    } else if (category === "Outsider") {
      if (!createForm.address.trim()) errs.address = "Home address is required";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    if (isGooglePrefilled) {
      handleGetStarted();
      return;
    }

    goToCreateStep(5, "next");
  }, [
    createForm,
    isGooglePrefilled,
    goToCreateStep,
    handleGetStarted,
  ]);

  // Web Cura OTP Claim Handlers
  const handleVerifyClaimOTP = useCallback(async () => {
    const cleanOtp = claimOtp.trim();
    if (!cleanOtp) {
      setClaimErrors({ otp: "Please enter the 6-digit OTP." });
      return;
    }
    if (cleanOtp.length < 6) {
      setClaimErrors({ otp: "OTP must be 6 digits." });
      return;
    }

    setClaimErrors({});
    setClaimLoading(true);

    try {
      const cleanEmail = createForm.email.trim().toLowerCase();
      const targetId = createDetectedPatient?.id || createForm.studentId.trim() || createForm.employeeId.trim() || createForm.outsiderId?.trim() || "";
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, id: targetId }),
      });

      if (res.ok) {
        triggerHaptic();
        setClaimStep(2);
      } else {
        const errData = await res.json().catch(() => ({}));
        setClaimErrors({ otp: errData.error || "Invalid or expired OTP." });
      }
    } catch (err) {
      setClaimErrors({ otp: "Network error. Please try again." });
    } finally {
      setClaimLoading(false);
    }
  }, [claimOtp, createForm.email, createForm.studentId, createForm.employeeId, createForm.outsiderId, createDetectedPatient, triggerHaptic]);

  const handleSetClaimPassword = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!claimPassword) {
      errs.password = "Password is required";
    } else if (claimPassword.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (!claimConfirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (claimConfirmPassword !== claimPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (claimMissingFields.includes("contact")) {
      const digits = (claimMissingData.contact || createForm.contact || "").replace(/\D/g, "");
      if (!digits) {
        errs.contact = "Contact number is required";
      } else if (!isValidPHPhone(claimMissingData.contact || createForm.contact) && !/^09\d{9}$/.test(digits)) {
        errs.contact = "Must be valid PH mobile (09XX-XXX-XXXX)";
      }
    }
    if (claimMissingFields.includes("emergencyPhone")) {
      const emDigits = (claimMissingData.emergencyPhone || createForm.emergencyPhone || "").replace(/\D/g, "");
      if (!emDigits) {
        errs.emergencyPhone = "Emergency phone is required";
      } else if (!isValidPHPhone(claimMissingData.emergencyPhone || createForm.emergencyPhone) && !/^09\d{9}$/.test(emDigits)) {
        errs.emergencyPhone = "Must be valid PH mobile";
      }
    }

    if (Object.keys(errs).length > 0) {
      setClaimErrors(errs);
      return;
    }

    setClaimErrors({});
    setClaimLoading(true);
    const cleanEmail = createForm.email.trim().toLowerCase();
    const targetId = createDetectedPatient?.id || createForm.studentId.trim() || createForm.employeeId.trim() || createForm.outsiderId?.trim() || "";

    try {
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: claimPassword, id: targetId }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.access) {
        const token = resData.access;
        const userName = (resData.user?.name || createForm.fullName || cleanEmail.split("@")[0]).toUpperCase();

        const profilePayload: any = {};
        if (claimMissingData.contact || createForm.contact) profilePayload.contact = claimMissingData.contact || createForm.contact;
        if (claimMissingData.dob || createForm.dob) profilePayload.birthday = claimMissingData.dob || createForm.dob;
        if (claimMissingData.sex || createForm.sex) profilePayload.sex = claimMissingData.sex || createForm.sex;
        if (claimMissingData.emergencyName || createForm.emergencyName) profilePayload.emergencyContact = claimMissingData.emergencyName || createForm.emergencyName;
        if (claimMissingData.emergencyPhone || createForm.emergencyPhone) profilePayload.emergencyPhone = claimMissingData.emergencyPhone || createForm.emergencyPhone;
        if (claimMissingData.course || createForm.course) profilePayload.course = claimMissingData.course || createForm.course;
        if (claimMissingData.yearLevel || createForm.yearLevel) profilePayload.yearLevel = claimMissingData.yearLevel || createForm.yearLevel;
        if (claimMissingData.address || createForm.address) profilePayload.address = claimMissingData.address || createForm.address;
        if (createForm.position) profilePayload.position = createForm.position;
        if (createForm.department) profilePayload.department = createForm.department;
        if (createForm.studentCategory) profilePayload.studentCategory = createForm.studentCategory;
        if (createForm.gradeLevel) profilePayload.gradeLevel = createForm.gradeLevel;
        if (createForm.guardianName) profilePayload.guardianName = createForm.guardianName;

        if (Object.keys(profilePayload).length > 0) {
          await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/complete-profile/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(profilePayload),
          }).catch(() => {});
        }

        if (token) {
          await AsyncStorage.setItem("@cura_access_token", token).catch(() => {});
        }

        const assignedId = targetId || resData.user?.id || "";
        onSuccessRegister(
          cleanEmail,
          userName,
          token,
          assignedId,
          userName
        );
        showAlert("Account Activated! 🎉", "Your Web CURA clinic record has been successfully verified and activated.");
      } else {
        setClaimErrors({ password: resData.error || "Failed to set password. Please try again." });
      }
    } catch (err) {
      setClaimErrors({ password: "Network error. Please try again." });
    } finally {
      setClaimLoading(false);
    }
  }, [claimPassword, claimConfirmPassword, claimMissingFields, claimMissingData, createForm, createDetectedPatient, onSuccessRegister, showAlert]);

  const handleResendClaimOTP = useCallback(async () => {
    if (claimResendCooldown > 0 || claimLoading) return;
    setClaimLoading(true);
    setClaimErrors({});
    try {
      const cleanEmail = createForm.email.trim().toLowerCase();
      const targetId = createDetectedPatient?.id || createForm.studentId.trim() || createForm.employeeId.trim() || createForm.outsiderId?.trim() || "";
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, id: targetId }),
      });
      if (res.ok) {
        setClaimResendCooldown(30);
        showAlert("Code Sent", "A new 6-digit OTP has been sent to your email.");
      } else {
        const err = await res.json().catch(() => ({}));
        setClaimErrors({ otp: err.error || "Failed to resend OTP." });
      }
    } catch {
      setClaimErrors({ otp: "Network error. Please try again." });
    } finally {
      setClaimLoading(false);
    }
  }, [claimResendCooldown, claimLoading, createForm.email, createForm.studentId, createForm.employeeId, createForm.outsiderId, createDetectedPatient, showAlert]);

  // ── Forgot Password Handlers (Same OTP Flow as Account Claim) ───────────────
  const handleStartForgotPassword = useCallback(() => {
    triggerHaptic();
    setForgotErrors({});
    const currentId = signInIdentifier.trim();
    if (currentId) {
      setForgotEmail(currentId);
    }
    setForgotStep(1);
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setIsForgotPassword(true);
  }, [signInIdentifier, triggerHaptic]);

  const handleCancelForgotPassword = useCallback(() => {
    triggerHaptic();
    setIsForgotPassword(false);
    setForgotStep(1);
    setForgotErrors({});
  }, [triggerHaptic]);

  const handleRequestForgotOTP = useCallback(async () => {
    const cleanInput = forgotEmail.trim();
    if (!cleanInput) {
      setForgotErrors({ email: "Please enter your email or username." });
      return;
    }
    setForgotErrors({});
    setForgotLoading(true);

    try {
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanInput.toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerHaptic();
        if (data.email) {
          setForgotEmail(data.email);
        }
        setForgotCooldown(60);
        setForgotStep(2);
      } else {
        setForgotErrors({ email: data.error || "No account found matching this email." });
      }
    } catch {
      setForgotErrors({ email: "Network error. Please try again." });
    } finally {
      setForgotLoading(false);
    }
  }, [forgotEmail, triggerHaptic]);

  const handleVerifyForgotOTP = useCallback(async () => {
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp) {
      setForgotErrors({ otp: "Please enter the 6-digit OTP." });
      return;
    }
    if (cleanOtp.length < 6) {
      setForgotErrors({ otp: "OTP must be 6 digits." });
      return;
    }

    setForgotErrors({});
    setForgotLoading(true);

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        triggerHaptic();
        setForgotStep(3);
      } else {
        setForgotErrors({ otp: data.error || "Invalid or expired OTP." });
      }
    } catch {
      setForgotErrors({ otp: "Network error. Please try again." });
    } finally {
      setForgotLoading(false);
    }
  }, [forgotOtp, forgotEmail, triggerHaptic]);

  const handleResendForgotOTP = useCallback(async () => {
    if (forgotCooldown > 0 || forgotLoading) return;
    setForgotLoading(true);
    setForgotErrors({});

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok) {
        setForgotCooldown(60);
        showAlert("Code Sent", "A new 6-digit OTP has been sent to your email.");
      } else {
        const err = await res.json().catch(() => ({}));
        setForgotErrors({ otp: err.error || "Failed to resend OTP." });
      }
    } catch {
      setForgotErrors({ otp: "Network error. Please try again." });
    } finally {
      setForgotLoading(false);
    }
  }, [forgotCooldown, forgotLoading, forgotEmail, showAlert]);

  const handleResetPasswordSubmit = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!forgotPassword) {
      errs.password = "New password is required";
    } else if (forgotPassword.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (!forgotConfirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (forgotConfirmPassword !== forgotPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    setForgotErrors({});
    setForgotLoading(true);
    const cleanEmail = forgotEmail.trim().toLowerCase();

    try {
      const res = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: forgotPassword }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.access) {
        const token = resData.access;
        const userName = (resData.user?.name || cleanEmail.split("@")[0]).toUpperCase();
        const patientId = resData.user?.id || "";

        if (token) {
          await AsyncStorage.setItem("@cura_access_token", token).catch(() => {});
        }

        const sessionUser = {
          email: cleanEmail,
          firstName: userName,
          displayName: userName,
          lastName: "",
          accessToken: token,
          id: patientId,
        };
        await AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});

        showAlert("Password Reset! 🎉", "Your password has been successfully updated. Welcome back!");
        setIsForgotPassword(false);
        onSuccessSignIn(cleanEmail, userName, token, patientId);
      } else {
        setForgotErrors({ password: resData.error || "Failed to reset password. Please try again." });
      }
    } catch {
      setForgotErrors({ password: "Network error. Please try again." });
    } finally {
      setForgotLoading(false);
    }
  }, [forgotPassword, forgotConfirmPassword, forgotEmail, onSuccessSignIn, showAlert]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        {/* 1) Backdrop (Tap outside to close and dismiss keyboard) */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            handleClose();
          }}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(3, 10, 26, 0.50)",
                opacity: animVal,
              },
            ]}
          />
        </Pressable>

        {/* 2) Centered Modal inside KeyboardAvoidingView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
          pointerEvents="box-none"
        >
          {/* 3) Modal Card */}
          <Animated.View
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "90%",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.32)",
              backgroundColor: "rgba(10, 24, 58, 0.94)",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 24,
              elevation: 10,
              opacity: animVal,
            }}
          >
            {/* Decorative gradient */}
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.16)", "rgba(255, 255, 255, 0.04)"]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Close Button X */}
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 30,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.22)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon color="#FFFFFF" size={15} />
            </TouchableOpacity>

            {/* Form Body inside ScrollView */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 22,
                paddingTop: 20,
                paddingBottom: 22,
              }}
            >
              {/* University Clinic Header + Logo inside Card */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Image
                  source={require("../../assets/images/ua-seal.png")}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  resizeMode="contain"
                />
                <View style={{ width: 1, height: 16, backgroundColor: "rgba(255, 255, 255, 0.4)", marginHorizontal: 8 }} />
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", fontFamily: "Outfit", letterSpacing: 0.3 }}>
                  University Clinic
                </Text>
              </View>

              <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
                {isForgotPassword ? (
                  // Forgot Password Multi-Step Flow (Email -> OTP -> New Password)
                  <View>
                    <GlassStepHeader
                      step={forgotStep}
                      total={3}
                      onBack={forgotStep === 1 ? handleCancelForgotPassword : () => setForgotStep((s) => (s - 1) as any)}
                      title={
                        forgotStep === 1
                          ? "Reset Password"
                          : forgotStep === 2
                          ? "Verify Code"
                          : "New Password"
                      }
                      subtitle={
                        forgotStep === 1
                          ? "Enter your email to receive a 6-digit code"
                          : forgotStep === 2
                          ? `Code sent to ${forgotEmail}`
                          : "Enter your new secure password"
                      }
                    />

                    {forgotStep === 1 && (
                      <View style={{ marginTop: 8 }}>
                        <GlassInput
                          icon={<MailIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="Registered Email or Username"
                          value={forgotEmail}
                          onChangeText={(t) => {
                            setForgotEmail(t);
                            if (forgotErrors.email) setForgotErrors((e) => ({ ...e, email: "" }));
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleRequestForgotOTP}
                          error={forgotErrors.email}
                        />

                        <TouchableOpacity
                          onPress={handleRequestForgotOTP}
                          disabled={forgotLoading || !forgotEmail.trim()}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: forgotEmail.trim() ? "#1E4FD8" : "rgba(30, 79, 216, 0.5)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 15,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.3,
                              }}
                            >
                              Send Reset Code →
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCancelForgotPassword}
                          activeOpacity={0.7}
                          style={{ marginTop: 14, alignItems: "center", paddingVertical: 4 }}
                        >
                          <Text
                            style={{
                              color: "rgba(255, 255, 255, 0.75)",
                              fontSize: 13,
                              fontFamily: "Outfit",
                              fontWeight: "600",
                            }}
                          >
                            ← Back to Sign In
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {forgotStep === 2 && (
                      <View style={{ marginTop: 8 }}>
                        <GlassOtpInput
                          value={forgotOtp}
                          onChangeText={(t) => {
                            setForgotOtp(t);
                            if (forgotErrors.otp) setForgotErrors((e) => ({ ...e, otp: "" }));
                          }}
                          error={forgotErrors.otp}
                          onSubmitEditing={handleVerifyForgotOTP}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginVertical: 4,
                          }}
                        >
                          <TouchableOpacity
                            onPress={handleResendForgotOTP}
                            disabled={forgotCooldown > 0 || forgotLoading}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: forgotCooldown > 0 ? "rgba(255, 255, 255, 0.4)" : "#60A5FA",
                                fontSize: 12.5,
                                fontFamily: "Outfit",
                                fontWeight: "600",
                              }}
                            >
                              {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : "Resend OTP"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setForgotStep(1)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: "#38BDF8",
                                fontSize: 12.5,
                                fontFamily: "Outfit",
                                fontWeight: "600",
                              }}
                            >
                              Change Email
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={handleVerifyForgotOTP}
                          disabled={forgotLoading || forgotOtp.trim().length < 6}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: forgotOtp.trim().length >= 6 ? "#1E4FD8" : "rgba(30, 79, 216, 0.5)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 15,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.3,
                              }}
                            >
                              Verify Code →
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCancelForgotPassword}
                          activeOpacity={0.7}
                          style={{ marginTop: 14, alignItems: "center", paddingVertical: 4 }}
                        >
                          <Text
                            style={{
                              color: "rgba(255, 255, 255, 0.75)",
                              fontSize: 13,
                              fontFamily: "Outfit",
                              fontWeight: "600",
                            }}
                          >
                            ← Back to Sign In
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {forgotStep === 3 && (
                      <View style={{ marginTop: 8 }}>
                        <GlassInput
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="New Password (min 6 chars)"
                          value={forgotPassword}
                          onChangeText={(t) => {
                            setForgotPassword(t);
                            if (forgotErrors.password) setForgotErrors((e) => ({ ...e, password: "" }));
                          }}
                          secureTextEntry
                          showPasswordToggle
                          returnKeyType="next"
                          error={forgotErrors.password}
                        />

                        <GlassInput
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="Confirm New Password"
                          value={forgotConfirmPassword}
                          onChangeText={(t) => {
                            setForgotConfirmPassword(t);
                            if (forgotErrors.confirmPassword) setForgotErrors((e) => ({ ...e, confirmPassword: "" }));
                          }}
                          secureTextEntry
                          showPasswordToggle
                          returnKeyType="done"
                          onSubmitEditing={handleResetPasswordSubmit}
                          error={forgotErrors.confirmPassword}
                        />

                        <TouchableOpacity
                          onPress={handleResetPasswordSubmit}
                          disabled={forgotLoading || forgotPassword.length < 6 || forgotConfirmPassword.length < 6}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: forgotPassword.length >= 6 && forgotConfirmPassword.length >= 6 ? "#1E4FD8" : "rgba(30, 79, 216, 0.5)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 15,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.3,
                              }}
                            >
                              Reset Password & Sign In →
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCancelForgotPassword}
                          activeOpacity={0.7}
                          style={{ marginTop: 14, alignItems: "center", paddingVertical: 4 }}
                        >
                          <Text
                            style={{
                              color: "rgba(255, 255, 255, 0.75)",
                              fontSize: 13,
                              fontFamily: "Outfit",
                              fontWeight: "600",
                            }}
                          >
                            ← Back to Sign In
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : authMode === "signin" ? (
                  // Sign In Content
                  <View>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 24,
                        fontWeight: "700",
                        fontFamily: "Outfit",
                        letterSpacing: 0.3,
                        textAlign: "center",
                        textShadowColor: "rgba(0, 0, 0, 0.35)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      Welcome Back
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255, 255, 255, 0.85)",
                        fontSize: 14,
                        fontFamily: "Outfit",
                        textAlign: "center",
                        marginTop: 4,
                        marginBottom: 20,
                        textShadowColor: "rgba(0, 0, 0, 0.3)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      Sign in to your university clinic portal
                    </Text>

                    {signInGeneralError ? (
                      <View
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.25)",
                          borderWidth: 1,
                          borderColor: "rgba(248, 113, 113, 0.5)",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          marginBottom: 14,
                        }}
                      >
                        <Text style={{ color: "#FEE2E2", fontSize: 13, fontFamily: "Outfit", lineHeight: 18 }}>
                          {signInGeneralError}
                        </Text>
                        {signInGeneralError.includes("No account found") && (
                          <TouchableOpacity
                            onPress={() => {
                              switchAuthMode("create_account");
                            }}
                            activeOpacity={0.8}
                            style={{
                              marginTop: 8,
                              paddingVertical: 7,
                              paddingHorizontal: 12,
                              backgroundColor: "#2563EB",
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13, fontFamily: "Outfit" }}>
                              Create Account Now →
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null}

                    {/* Small text above Username/Email input (no box) */}
                    {signInCheckingEmail ? (
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, paddingLeft: 2 }}>
                        <ActivityIndicator size="small" color="#93C5FD" style={{ transform: [{ scale: 0.7 }], marginRight: 6 }} />
                        <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 12, fontFamily: "Outfit" }}>
                          Checking clinic records...
                        </Text>
                      </View>
                    ) : signInDetectedPatient ? (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingLeft: 2 }}>
                        <Text style={{ color: "#6EE7B7", fontSize: 12, fontFamily: "Outfit", fontWeight: "600" }}>
                          ✓ Clinic Record: <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{signInDetectedPatient.name}</Text>
                        </Text>
                        {!signInDetectedPatient.claimed && (
                          <Text style={{ color: "#6EE7B7", fontSize: 10.5, fontFamily: "Outfit", fontWeight: "700", textTransform: "uppercase" }}>
                            • Unclaimed
                          </Text>
                        )}
                      </View>
                    ) : null}

                    {!signInOtpSent ? (
                      <GlassInput
                        icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                        placeholder="Username or Email"
                        value={signInIdentifier}
                        onChangeText={(t) => {
                          setSignInIdentifier(t);
                          if (signInErrors.identifier) setSignInErrors((e) => ({ ...e, identifier: "" }));
                        }}
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() => signInPasswordRef.current?.focus()}
                        blurOnSubmit={false}
                        error={signInErrors.identifier}
                      />
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "rgba(255, 255, 255, 0.12)",
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: "rgba(255, 255, 255, 0.20)",
                          paddingHorizontal: 14,
                          height: 48,
                          marginBottom: 12,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                          <MailIcon color="#38BDF8" size={17} />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13.5,
                              fontFamily: "Outfit",
                              fontWeight: "600",
                              marginLeft: 10,
                            }}
                            numberOfLines={1}
                          >
                            {signInIdentifier}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setSignInOtpSent(false);
                            setSignInOtp("");
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ color: "#38BDF8", fontSize: 12.5, fontFamily: "Outfit", fontWeight: "700" }}>
                            Change
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Case A: Unclaimed Clinic Record -> Direct OTP flow */}
                    {signInDetectedPatient && !signInDetectedPatient.claimed ? (
                      <>
                        {!signInOtpSent ? (
                          <TouchableOpacity
                            onPress={handleSendSignInOTP}
                            disabled={signInOtpLoading}
                            activeOpacity={0.85}
                            style={{
                              width: "100%",
                              height: 50,
                              borderRadius: 14,
                              backgroundColor: "#059669",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 4,
                              shadowColor: "#059669",
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.35,
                              shadowRadius: 8,
                              elevation: 4,
                            }}
                          >
                            {signInOtpLoading ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 15,
                                  fontWeight: "700",
                                  fontFamily: "Outfit",
                                  letterSpacing: 0.4,
                                }}
                              >
                                Verify via OTP to Sign In →
                              </Text>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <>
                            <GlassOtpInput
                              value={signInOtp}
                              onChangeText={(t) => {
                                setSignInOtp(t);
                                if (signInErrors.otp) setSignInErrors((e) => ({ ...e, otp: "" }));
                              }}
                              error={signInErrors.otp}
                              onSubmitEditing={handleVerifySignInOTP}
                            />

                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginVertical: 4,
                              }}
                            >
                              <TouchableOpacity
                                onPress={handleSendSignInOTP}
                                disabled={signInOtpCooldown > 0 || signInOtpLoading}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={{
                                    color: signInOtpCooldown > 0 ? "rgba(255, 255, 255, 0.4)" : "#60A5FA",
                                    fontSize: 12.5,
                                    fontFamily: "Outfit",
                                    fontWeight: "600",
                                  }}
                                >
                                  {signInOtpCooldown > 0 ? `Resend in ${signInOtpCooldown}s` : "Resend OTP"}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => {
                                  setSignInOtpSent(false);
                                  setSignInOtp("");
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 12.5, fontFamily: "Outfit" }}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                              onPress={handleVerifySignInOTP}
                              disabled={signInOtpLoading || signInOtp.trim().length < 6}
                              activeOpacity={0.85}
                              style={{
                                width: "100%",
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: signInOtp.trim().length >= 6 ? "#1E4FD8" : "rgba(30, 79, 216, 0.45)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 6,
                                shadowColor: "#1E4FD8",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 4,
                              }}
                            >
                              {signInOtpLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                              ) : (
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: 15,
                                    fontWeight: "700",
                                    fontFamily: "Outfit",
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  Verify & Sign In →
                                </Text>
                              )}
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    ) : signInOtpMode ? (
                      /* Case B: Claimed account chose OTP sign in OR Google OTP pending */
                      <>
                        {modalGooglePendingToken ? (
                          <View
                            style={{
                              backgroundColor: "rgba(56, 189, 248, 0.15)",
                              borderWidth: 1,
                              borderColor: "rgba(56, 189, 248, 0.4)",
                              borderRadius: 12,
                              padding: 10,
                              marginBottom: 10,
                            }}
                          >
                            <Text style={{ color: "#E0F2FE", fontSize: 12, fontFamily: "Outfit", textAlign: "center" }}>
                              📧 Verification code sent to {signInIdentifier}. Check your Gmail inbox or spam.
                            </Text>
                          </View>
                        ) : null}
                        <GlassOtpInput
                          value={signInOtp}
                          onChangeText={(t) => {
                            setSignInOtp(t);
                            if (signInErrors.otp) setSignInErrors((e) => ({ ...e, otp: "" }));
                          }}
                          error={signInErrors.otp}
                          onSubmitEditing={handleVerifySignInOTP}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginVertical: 4,
                          }}
                        >
                          <TouchableOpacity
                            onPress={handleSendSignInOTP}
                            disabled={signInOtpCooldown > 0 || signInOtpLoading}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: signInOtpCooldown > 0 ? "rgba(255, 255, 255, 0.4)" : "#60A5FA",
                                fontSize: 12.5,
                                fontFamily: "Outfit",
                                fontWeight: "600",
                              }}
                            >
                              {signInOtpCooldown > 0 ? `Resend in ${signInOtpCooldown}s` : "Resend OTP"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setSignInOtpMode(false);
                              setModalGooglePendingToken("");
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 12.5, fontFamily: "Outfit" }}>
                              {modalGooglePendingToken ? "Cancel" : "Use Password"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={handleVerifySignInOTP}
                          disabled={signInOtpLoading || signInOtp.trim().length < 6}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: signInOtp.trim().length >= 6 ? "#1E4FD8" : "rgba(30, 79, 216, 0.45)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 6,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {signInOtpLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 15,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.4,
                              }}
                            >
                              Verify & Sign In →
                            </Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      /* Case C: Standard Password Login */
                      <>
                        <GlassInput
                          ref={signInPasswordRef}
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="Password"
                          value={signInPassword}
                          onChangeText={(t) => {
                            setSignInPassword(t);
                            if (signInErrors.password) setSignInErrors((e) => ({ ...e, password: "" }));
                          }}
                          secureTextEntry
                          showPasswordToggle
                          returnKeyType="done"
                          onSubmitEditing={handleSignIn}
                          error={signInErrors.password}
                        />

                        {/* Forgot Password Link */}
                        <View style={{ width: "100%", alignItems: "flex-end", marginTop: 2, marginBottom: 8 }}>
                          <TouchableOpacity
                            onPress={handleStartForgotPassword}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: "#60A5FA",
                                fontSize: 13,
                                fontFamily: "Outfit",
                                fontWeight: "600",
                              }}
                            >
                              Forgot password?
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={handleSignIn}
                          disabled={signInLoading}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: "#1E4FD8",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 8,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {signInLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 16,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.4,
                              }}
                            >
                              Sign In
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 14,
                            marginBottom: 8,
                            gap: 10,
                          }}
                        >
                          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
                          <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 11, fontFamily: "Outfit", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            or
                          </Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
                        </View>

                        {/* Google Sign In Button in AuthModal */}
                        <TouchableOpacity
                          onPress={() => handleModalGoogleSignIn("signin")}
                          disabled={modalGoogleLoading || signInLoading}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: "#FFFFFF",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 6,
                            elevation: 3,
                          }}
                        >
                          {modalGoogleLoading ? (
                            <ActivityIndicator color="#0284c7" size="small" />
                          ) : (
                            <>
                              <GoogleLogoIcon size={20} />
                              <Text
                                style={{
                                  color: "#1E293B",
                                  fontSize: 15,
                                  fontWeight: "700",
                                  fontFamily: "Outfit",
                                  letterSpacing: 0.2,
                                }}
                              >
                                Continue with Google
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        {signInDetectedPatient?.claimed ? (
                          <TouchableOpacity
                            onPress={() => {
                              setSignInOtpMode(true);
                              handleSendSignInOTP();
                            }}
                            activeOpacity={0.7}
                            style={{ alignItems: "center", marginTop: 12, paddingVertical: 4 }}
                          >
                            <Text style={{ color: "#60A5FA", fontSize: 13, fontFamily: "Outfit", fontWeight: "600" }}>
                              Or Sign In with OTP Code
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </>
                    )}

                    {/* Switcher */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: 18,
                      }}
                    >
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.85)",
                          fontSize: 13.5,
                          fontFamily: "Outfit",
                          textShadowColor: "rgba(0, 0, 0, 0.3)",
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        No account?{" "}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          switchAuthMode("create_account");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            color: "#60A5FA",
                            fontSize: 13.5,
                            fontWeight: "700",
                            fontFamily: "Outfit",
                            textShadowColor: "rgba(0, 0, 0, 0.3)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                          }}
                        >
                          Create one
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Create Account Multi-Step Flow
                  <View>
                    {regGeneralError ? (
                      <View
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.25)",
                          borderWidth: 1,
                          borderColor: "rgba(248, 113, 113, 0.5)",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ color: "#FEE2E2", fontSize: 13, fontFamily: "Outfit", lineHeight: 18 }}>
                          {regGeneralError}
                        </Text>
                        {regGeneralError.includes("already registered") && (
                          <TouchableOpacity
                            onPress={() => {
                              setSignInIdentifier(createForm.email.trim() || googleVerifiedEmail);
                              switchAuthMode("signin");
                            }}
                            activeOpacity={0.8}
                            style={{
                              marginTop: 8,
                              paddingVertical: 7,
                              paddingHorizontal: 12,
                              backgroundColor: "#2563EB",
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13, fontFamily: "Outfit" }}>
                              Go to Sign In →
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null}

                    {/* Create Account Flow: Web Cura OTP Claim vs Normal Registration */}
                    {isClaimingWebAccount ? (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        {claimStep === 1 ? (
                          <>
                            <GlassStepHeader
                              step={1}
                              total={2}
                              title="Enter OTP Code"
                              subtitle={`Verification code sent to ${createForm.email.trim()}`}
                              onBack={() => {
                                setIsClaimingWebAccount(false);
                                setClaimOtp("");
                                setClaimErrors({});
                              }}
                            />

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: "rgba(16, 185, 129, 0.18)",
                                borderWidth: 1,
                                borderColor: "rgba(52, 211, 153, 0.45)",
                                marginBottom: 14,
                                gap: 10,
                              }}
                            >
                              <Text style={{ fontSize: 20 }}>🏥</Text>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    color: "#6EE7B7",
                                    fontSize: 10.5,
                                    fontFamily: "Outfit",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  Clinic Record Detected
                                </Text>
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: 13.5,
                                    fontFamily: "Outfit",
                                    fontWeight: "600",
                                    marginTop: 1,
                                  }}
                                >
                                  {createForm.fullName || "Patient Record"}
                                </Text>
                              </View>
                            </View>

                            <GlassOtpInput
                              value={claimOtp}
                              onChangeText={(t) => {
                                setClaimOtp(t);
                                if (claimErrors.otp) setClaimErrors((e) => ({ ...e, otp: "" }));
                              }}
                              error={claimErrors.otp}
                              onSubmitEditing={handleVerifyClaimOTP}
                            />

                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 4,
                                marginBottom: 16,
                              }}
                            >
                              <TouchableOpacity
                                onPress={handleResendClaimOTP}
                                disabled={claimResendCooldown > 0 || claimLoading}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={{
                                    color: claimResendCooldown > 0 ? "rgba(255, 255, 255, 0.45)" : "#60A5FA",
                                    fontSize: 13,
                                    fontFamily: "Outfit",
                                    fontWeight: "600",
                                  }}
                                >
                                  {claimResendCooldown > 0 ? `Resend code in ${claimResendCooldown}s` : "Resend OTP"}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => {
                                  setIsClaimingWebAccount(false);
                                  setClaimOtp("");
                                  setClaimErrors({});
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13, fontFamily: "Outfit" }}>
                                  Change email
                                </Text>
                              </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                              onPress={handleVerifyClaimOTP}
                              disabled={claimLoading || claimOtp.trim().length < 6}
                              activeOpacity={0.85}
                              style={{
                                width: "100%",
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: claimOtp.trim().length >= 6 ? "#1E4FD8" : "rgba(30, 79, 216, 0.45)",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#1E4FD8",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 4,
                              }}
                            >
                              {claimLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: 16,
                                    fontWeight: "700",
                                    fontFamily: "Outfit",
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  Verify OTP →
                                </Text>
                              )}
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <GlassStepHeader
                              step={2}
                              total={2}
                              title="Set Password"
                              subtitle="Create a secure password to activate your account"
                              onBack={() => {
                                setClaimStep(1);
                                setClaimErrors({});
                              }}
                            />

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: "rgba(30, 79, 216, 0.35)",
                                borderWidth: 1,
                                borderColor: "#60A5FA",
                                marginBottom: 14,
                                gap: 10,
                              }}
                            >
                              <Text style={{ fontSize: 20 }}>🔒</Text>
                              <Text
                                style={{
                                  color: "rgba(255, 255, 255, 0.9)",
                                  fontSize: 12.5,
                                  fontFamily: "Outfit",
                                  lineHeight: 18,
                                  flex: 1,
                                }}
                              >
                                Verified! Set your password to complete activation.
                              </Text>
                            </View>

                            {/* Missing Profile Fields (if nurse did not fill them on web) */}
                            {claimMissingFields.includes("contact") && (
                              <GlassInput
                                icon={<PhoneIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                                placeholder="Mobile Number (09XXXXXXXXX)"
                                value={claimMissingData.contact}
                                onChangeText={(t) => {
                                  setClaimMissingData((d) => ({ ...d, contact: t }));
                                  if (claimErrors.contact) setClaimErrors((e) => ({ ...e, contact: "" }));
                                }}
                                keyboardType="phone-pad"
                                maxLength={11}
                                error={claimErrors.contact}
                              />
                            )}

                            {claimMissingFields.includes("emergencyPhone") && (
                              <GlassInput
                                icon={<PhoneIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                                placeholder="Emergency Phone (09XXXXXXXXX)"
                                value={claimMissingData.emergencyPhone}
                                onChangeText={(t) => {
                                  setClaimMissingData((d) => ({ ...d, emergencyPhone: t }));
                                  if (claimErrors.emergencyPhone) setClaimErrors((e) => ({ ...e, emergencyPhone: "" }));
                                }}
                                keyboardType="phone-pad"
                                maxLength={11}
                                error={claimErrors.emergencyPhone}
                              />
                            )}

                            <GlassInput
                              icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="New Password (min 6 characters)"
                              value={claimPassword}
                              onChangeText={(t) => {
                                setClaimPassword(t);
                                if (claimErrors.password) setClaimErrors((e) => ({ ...e, password: "" }));
                              }}
                              secureTextEntry
                              showPasswordToggle
                              error={claimErrors.password}
                            />

                            <GlassInput
                              icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="Confirm New Password"
                              value={claimConfirmPassword}
                              onChangeText={(t) => {
                                setClaimConfirmPassword(t);
                                if (claimErrors.confirmPassword) setClaimErrors((e) => ({ ...e, confirmPassword: "" }));
                              }}
                              secureTextEntry
                              showPasswordToggle
                              error={claimErrors.confirmPassword}
                              returnKeyType="done"
                              onSubmitEditing={handleSetClaimPassword}
                            />

                            <TouchableOpacity
                              onPress={handleSetClaimPassword}
                              disabled={claimLoading}
                              activeOpacity={0.85}
                              style={{
                                width: "100%",
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: "#1E4FD8",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 8,
                                shadowColor: "#1E4FD8",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 4,
                              }}
                            >
                              {claimLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: 16,
                                    fontWeight: "700",
                                    fontFamily: "Outfit",
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  Activate & Sign In 🎉
                                </Text>
                              )}
                            </TouchableOpacity>
                          </>
                        )}
                      </Animated.View>
                    ) : (
                      <>
                        {/* Step 1: Account Email & Auto Category Identification */}
                        {createStep === 1 && (
                          <Animated.View
                            style={{
                              opacity: stepFadeAnim,
                              transform: [{ translateX: stepSlideAnim }],
                            }}
                          >
                            <GlassStepHeader
                              step={1}
                              total={5}
                              title="Account Email"
                              subtitle={isCategoryLocked ? `Category locked to ${createForm.category}` : "Enter your email to identify your account"}
                            />

                            {isCategoryLocked && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: "rgba(59, 130, 246, 0.20)",
                                  borderWidth: 1.5,
                                  borderColor: "rgba(96, 165, 250, 0.6)",
                                  borderRadius: 14,
                                  padding: 12,
                                  marginBottom: 12,
                                  gap: 10,
                                }}
                              >
                                <Text style={{ fontSize: 20 }}>🔒</Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      color: "#93C5FD",
                                      fontSize: 10.5,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Domain Verified • Category Locked
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: 13.5,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      marginTop: 1,
                                    }}
                                  >
                                    Category: {createForm.category}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "rgba(255, 255, 255, 0.75)",
                                      fontSize: 11.5,
                                      fontFamily: "Outfit",
                                      marginTop: 2,
                                    }}
                                  >
                                    Auto-detected from {createForm.email}
                                  </Text>
                                </View>
                              </View>
                            )}

                            <GlassInput
                              ref={emailRef}
                              icon={<MailIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="Email address (e.g. name.student@ua.edu.ph)"
                              value={createForm.email}
                              editable={!isCategoryLocked}
                              onChangeText={(t) => {
                                if (isCategoryLocked) return;
                                const detected = detectCategoryFromEmail(t);
                                setCreateForm((f) => ({
                                  ...f,
                                  email: t,
                                  category: detected,
                                }));
                                if (regErrors.email) setRegErrors((e) => ({ ...e, email: "" }));
                                if (regErrors.category) setRegErrors((e) => ({ ...e, category: "" }));
                              }}
                              keyboardType="email-address"
                              autoCapitalize="none"
                              returnKeyType="done"
                              onSubmitEditing={handleStep1Next}
                              error={regErrors.email}
                            />

                            {/* Real-time Email Check Status */}
                            {emailChecking ? (
                              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 8, paddingLeft: 4 }}>
                                <ActivityIndicator size="small" color="#93C5FD" />
                                <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 12, fontFamily: "Outfit", marginLeft: 8 }}>
                                  Checking clinic records...
                                </Text>
                              </View>
                            ) : null}

                            {/* Clinic Record Detected vs Category Indicator */}
                            {createDetectedPatient ? (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: "rgba(16, 185, 129, 0.18)",
                                  borderWidth: 1.5,
                                  borderColor: "rgba(52, 211, 153, 0.55)",
                                  borderRadius: 14,
                                  padding: 12,
                                  marginBottom: 12,
                                  gap: 10,
                                }}
                              >
                                <Text style={{ fontSize: 20 }}>🏥</Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      color: "#6EE7B7",
                                      fontSize: 10.5,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Clinic Record Detected
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: 13.5,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      marginTop: 1,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {createDetectedPatient.name}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "rgba(255, 255, 255, 0.7)",
                                      fontSize: 11.5,
                                      fontFamily: "Outfit",
                                      marginTop: 2,
                                    }}
                                  >
                                    {createDetectedPatient.claimed
                                      ? "Account already active. Please sign in."
                                      : "Registered at UA Clinic. Claim your account."}
                                  </Text>
                                </View>
                              </View>
                            ) : null}

                            {createDetectedPatient && createDetectedPatient.claimed ? (
                              <TouchableOpacity
                                onPress={() => {
                                  setSignInIdentifier(createForm.email.trim());
                                  switchAuthMode("signin");
                                }}
                                activeOpacity={0.85}
                                style={{
                                  width: "100%",
                                  height: 50,
                                  borderRadius: 14,
                                  backgroundColor: "#1E4FD8",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 6,
                                  shadowColor: "#1E4FD8",
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.35,
                                  shadowRadius: 8,
                                  elevation: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: 15,
                                    fontWeight: "700",
                                    fontFamily: "Outfit",
                                  }}
                                >
                                  Go to Sign In →
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={handleStep1Next}
                                disabled={emailChecking}
                                activeOpacity={0.85}
                                style={{
                                  width: "100%",
                                  height: 50,
                                  borderRadius: 14,
                                  backgroundColor: createDetectedPatient ? "#059669" : "#1E4FD8",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 6,
                                  shadowColor: createDetectedPatient ? "#059669" : "#1E4FD8",
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.35,
                                  shadowRadius: 8,
                                  elevation: 4,
                                }}
                              >
                                {emailChecking ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: 15,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      letterSpacing: 0.4,
                                    }}
                                  >
                                    {createDetectedPatient ? "Claim Account (Send OTP) →" : "Next →"}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            )}

                            {regErrors.email?.includes("already registered") ? (
                              <TouchableOpacity
                                onPress={() => {
                                  setSignInIdentifier(createForm.email.trim());
                                  switchAuthMode("signin");
                                }}
                                activeOpacity={0.7}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 10,
                                  paddingVertical: 9,
                                  borderRadius: 12,
                                  backgroundColor: "rgba(96, 165, 250, 0.18)",
                                  borderWidth: 1,
                                  borderColor: "#60A5FA",
                                }}
                              >
                                <Text style={{ color: "#93C5FD", fontSize: 13.5, fontFamily: "Outfit", fontWeight: "700" }}>
                                  Go to Sign In →
                                </Text>
                              </TouchableOpacity>
                            ) : null}

                            {/* Divider */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 14,
                                marginBottom: 8,
                                gap: 10,
                              }}
                            >
                              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
                              <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 11, fontFamily: "Outfit", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                or
                              </Text>
                              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
                            </View>

                            {/* Google Sign In/Up Button in Step 1 */}
                            <TouchableOpacity
                              onPress={() => handleModalGoogleSignIn("create_account")}
                              disabled={modalGoogleLoading || emailChecking}
                              activeOpacity={0.85}
                              style={{
                                width: "100%",
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: "#FFFFFF",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 6,
                                elevation: 3,
                              }}
                            >
                              {modalGoogleLoading ? (
                                <ActivityIndicator color="#0284c7" size="small" />
                              ) : (
                                <>
                                  <GoogleLogoIcon size={20} />
                                  <Text
                                    style={{
                                      color: "#1E293B",
                                      fontSize: 15,
                                      fontWeight: "700",
                                      fontFamily: "Outfit",
                                      letterSpacing: 0.2,
                                    }}
                                  >
                                    Continue with Google
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>

                        {/* Sign In Link (Only on step 1) */}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 18,
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "rgba(255, 255, 255, 0.85)",
                              fontSize: 13.5,
                              fontFamily: "Outfit",
                              textShadowColor: "rgba(0, 0, 0, 0.3)",
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 2,
                            }}
                          >
                            Already have an account?{" "}
                          </Text>
                          <TouchableOpacity onPress={() => switchAuthMode("signin")} activeOpacity={0.7}>
                            <Text
                              style={{
                                color: "#60A5FA",
                                fontSize: 13.5,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                textShadowColor: "rgba(0, 0, 0, 0.3)",
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                              }}
                            >
                              Sign In
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    )}

                    {/* Step 2: Identification (Student ID / Employee ID / Outsider ID) */}
                    {createStep === 2 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={2}
                          total={5}
                          title={
                            createForm.category === "Student"
                              ? "Student ID"
                              : createForm.category === "Employee"
                              ? "Employee ID"
                              : "Outsider / Patient ID"
                          }
                          subtitle="Enter your ID to check clinic records"
                          onBack={() => goToCreateStep(1, "back")}
                        />

                        {isGoogleSignup && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(59, 130, 246, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(147, 197, 253, 0.4)",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              marginBottom: 12,
                              gap: 8,
                            }}
                          >
                            <GoogleLogoIcon size={16} />
                            <Text style={{ color: "#BFDBFE", fontSize: 12, fontFamily: "Outfit", fontWeight: "600", flex: 1 }}>
                              Google Connected: {createForm.email} ({createForm.category})
                            </Text>
                          </View>
                        )}

                        {!isCategoryLocked && (
                          <View style={{ marginBottom: 14 }}>
                            <Text
                              style={{
                                color: "rgba(255, 255, 255, 0.75)",
                                fontSize: 11.5,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 0.6,
                                fontFamily: "Outfit",
                                marginBottom: 6,
                              }}
                            >
                              Account Category
                            </Text>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              {(["Student", "Employee", "Outsider"] as const).map((cat) => {
                                const isSelected = createForm.category === cat;
                                return (
                                  <TouchableOpacity
                                    key={cat}
                                    onPress={() => {
                                      setCreateForm((f) => ({ ...f, category: cat }));
                                      if (regErrors.studentId) setRegErrors((e) => ({ ...e, studentId: "" }));
                                      if (regErrors.employeeId) setRegErrors((e) => ({ ...e, employeeId: "" }));
                                      if (regErrors.outsiderId) setRegErrors((e) => ({ ...e, outsiderId: "" }));
                                    }}
                                    activeOpacity={0.8}
                                    style={{
                                      flex: 1,
                                      height: 42,
                                      borderRadius: 12,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: isSelected ? "#1E4FD8" : "rgba(255, 255, 255, 0.14)",
                                      borderWidth: 1.5,
                                      borderColor: isSelected ? "#60A5FA" : "rgba(255, 255, 255, 0.25)",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                                        fontSize: 13,
                                        fontWeight: isSelected ? "700" : "500",
                                        fontFamily: "Outfit",
                                      }}
                                    >
                                      {cat}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}

                        {createForm.category === "Student" && (
                          <GlassInput
                            ref={studentIdRef}
                            label="Student ID"
                            icon={<IdCardIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                            placeholder="e.g. 2024-00123"
                            value={createForm.studentId}
                            onChangeText={(t) => {
                              setCreateForm((f) => ({ ...f, studentId: t }));
                              if (regErrors.studentId) setRegErrors((e) => ({ ...e, studentId: "" }));
                            }}
                            error={regErrors.studentId}
                            returnKeyType="done"
                            onSubmitEditing={handleStep2Next}
                          />
                        )}

                        {createForm.category === "Employee" && (
                          <GlassInput
                            ref={employeeIdRef}
                            label="Employee ID"
                            icon={<IdCardIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                            placeholder="e.g. EMP-2024-042"
                            value={createForm.employeeId}
                            onChangeText={(t) => {
                              setCreateForm((f) => ({ ...f, employeeId: t }));
                              if (regErrors.employeeId) setRegErrors((e) => ({ ...e, employeeId: "" }));
                            }}
                            error={regErrors.employeeId}
                            returnKeyType="done"
                            onSubmitEditing={handleStep2Next}
                          />
                        )}

                        {createForm.category === "Outsider" && (
                          <GlassInput
                            label="Outsider / Patient ID (Optional)"
                            icon={<IdCardIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                            placeholder="e.g. OUT-2026-001 (Leave blank if new)"
                            value={createForm.outsiderId}
                            onChangeText={(t) => {
                              setCreateForm((f) => ({ ...f, outsiderId: t }));
                              if (regErrors.outsiderId) setRegErrors((e) => ({ ...e, outsiderId: "" }));
                            }}
                            error={regErrors.outsiderId}
                            returnKeyType="done"
                            onSubmitEditing={handleStep2Next}
                          />
                        )}

                        {/* Clinic Record Detected Notification Banner */}
                        {createDetectedPatient ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(16, 185, 129, 0.18)",
                              borderWidth: 1.5,
                              borderColor: "rgba(52, 211, 153, 0.55)",
                              borderRadius: 14,
                              padding: 12,
                              marginTop: 4,
                              marginBottom: 12,
                              gap: 10,
                            }}
                          >
                            <Text style={{ fontSize: 20 }}>🏥</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#6EE7B7",
                                  fontSize: 10.5,
                                  fontWeight: "700",
                                  fontFamily: "Outfit",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Clinic Record Detected
                              </Text>
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 13.5,
                                  fontWeight: "700",
                                  fontFamily: "Outfit",
                                  marginTop: 1,
                                }}
                                numberOfLines={1}
                              >
                                {createDetectedPatient.name}
                              </Text>
                              <Text
                                style={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: 11.5,
                                  fontFamily: "Outfit",
                                  marginTop: 2,
                                }}
                              >
                                {createDetectedPatient.claimed
                                  ? "Account already active. Please sign in."
                                  : "Registered in CURA Clinic! Tap below to claim account with OTP."}
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        <TouchableOpacity
                          onPress={handleStep2Next}
                          disabled={regLoading}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: createDetectedPatient ? "#059669" : "#1E4FD8",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: createDetectedPatient ? "#059669" : "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {regLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 16,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.4,
                              }}
                            >
                              {createDetectedPatient
                                ? createDetectedPatient.claimed
                                  ? "Go to Sign In →"
                                  : "Claim Account (Send OTP) →"
                                : "Next →"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    {/* Step 3: Basic Information */}
                    {createStep === 3 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={3}
                          total={5}
                          title="Basic Information"
                          subtitle="Personal and emergency details"
                          onBack={() => goToCreateStep(2, "back")}
                        />

                        {isGoogleSignup && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(59, 130, 246, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(147, 197, 253, 0.4)",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              marginBottom: 12,
                              gap: 8,
                            }}
                          >
                            <GoogleLogoIcon size={16} />
                            <Text style={{ color: "#BFDBFE", fontSize: 12, fontFamily: "Outfit", fontWeight: "600", flex: 1 }}>
                              Google Connected: {createForm.email} ({createForm.category})
                            </Text>
                          </View>
                        )}

                        <GlassInput
                          ref={fullNameRef}
                          label="Full Name"
                          icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="JUAN DELA CRUZ"
                          value={createForm.fullName}
                          autoCapitalize="characters"
                          onChangeText={(t) => {
                            setCreateForm((f) => ({ ...f, fullName: t.toUpperCase() }));
                            if (regErrors.fullName) setRegErrors((e) => ({ ...e, fullName: "" }));
                          }}
                          error={regErrors.fullName}
                        />

                        <GlassDatePickerField
                          label="Birthday"
                          value={createForm.dob}
                          onChange={(d) => {
                            setCreateForm((f) => ({ ...f, dob: d }));
                            if (regErrors.dob) setRegErrors((e) => ({ ...e, dob: "" }));
                          }}
                          error={regErrors.dob}
                        />

                        <GlassSexChips
                          value={createForm.sex}
                          onChange={(val) => {
                            setCreateForm((f) => ({ ...f, sex: val }));
                            if (regErrors.sex) setRegErrors((e) => ({ ...e, sex: "" }));
                          }}
                          error={regErrors.sex}
                        />

                        <GlassInput
                          ref={contactRef}
                          label="Contact Number"
                          icon={<PhoneIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="09XX-XXX-XXXX"
                          value={createForm.contact}
                          keyboardType="phone-pad"
                          maxLength={13}
                          onChangeText={(t) => {
                            const formatted = formatPHPhone(t);
                            setCreateForm((f) => ({ ...f, contact: formatted }));
                            if (regErrors.contact) setRegErrors((e) => ({ ...e, contact: "" }));
                          }}
                          error={regErrors.contact}
                        />

                        <GlassInput
                          ref={emergencyNameRef}
                          label="Emergency Contact Name"
                          icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="MARIA DELA CRUZ"
                          value={createForm.emergencyName}
                          autoCapitalize="characters"
                          onChangeText={(t) => {
                            setCreateForm((f) => ({ ...f, emergencyName: t.toUpperCase() }));
                            if (regErrors.emergencyName) setRegErrors((e) => ({ ...e, emergencyName: "" }));
                          }}
                          error={regErrors.emergencyName}
                        />

                        <GlassInput
                          ref={emergencyPhoneRef}
                          label="Emergency Contact Number"
                          icon={<PhoneIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="09XX-XXX-XXXX"
                          value={createForm.emergencyPhone}
                          keyboardType="phone-pad"
                          maxLength={13}
                          onChangeText={(t) => {
                            const formatted = formatPHPhone(t);
                            setCreateForm((f) => ({ ...f, emergencyPhone: formatted }));
                            if (regErrors.emergencyPhone) setRegErrors((e) => ({ ...e, emergencyPhone: "" }));
                          }}
                          error={regErrors.emergencyPhone}
                        />

                        <TouchableOpacity
                          onPress={handleStep3Next}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: "#1E4FD8",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 16,
                              fontWeight: "700",
                              fontFamily: "Outfit",
                              letterSpacing: 0.4,
                            }}
                          >
                            Next →
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    {/* Step 4: Category-Specific Details */}
                    {createStep === 4 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={4}
                          total={5}
                          title={
                            createForm.category === "Student"
                              ? "Student Information"
                              : createForm.category === "Employee"
                              ? "Employee Details"
                              : "Outsider Information"
                          }
                          subtitle={
                            createForm.category === "Student"
                              ? "Fill in your academic level & classification"
                              : createForm.category === "Employee"
                              ? "Fill in your department & position"
                              : "Fill in your complete home address"
                          }
                          onBack={() => goToCreateStep(3, "back")}
                        />

                        {isGoogleSignup && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(59, 130, 246, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(147, 197, 253, 0.4)",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              marginBottom: 12,
                              gap: 8,
                            }}
                          >
                            <GoogleLogoIcon size={16} />
                            <Text style={{ color: "#BFDBFE", fontSize: 12, fontFamily: "Outfit", fontWeight: "600", flex: 1 }}>
                              Google Connected: {createForm.email} ({createForm.category})
                            </Text>
                          </View>
                        )}

                        {/* Verified ID Badge */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "rgba(59, 130, 246, 0.18)",
                            borderWidth: 1,
                            borderColor: "rgba(147, 197, 253, 0.35)",
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginBottom: 12,
                            gap: 8,
                          }}
                        >
                          <IdCardIcon color="#60A5FA" size={18} />
                          <Text style={{ color: "#BFDBFE", fontSize: 13, fontFamily: "Outfit", fontWeight: "600", flex: 1 }}>
                            {createForm.category === "Student"
                              ? `Student ID: ${createForm.studentId || "Not set"}`
                              : createForm.category === "Employee"
                              ? `Employee ID: ${createForm.employeeId || "Not set"}`
                              : `ID: ${createForm.outsiderId || "N/A"}`}
                          </Text>
                        </View>

                        {/* Student Fields */}
                        {createForm.category === "Student" && (
                          <View>
                            <GlassSelectRow
                              label="Student Classification"
                              value={createForm.studentCategory}
                              placeholder="Select Classification"
                              onPress={() => setSelectModalType("studentCategory")}
                              error={regErrors.studentCategory}
                            />

                            {createForm.studentCategory === "College" && (
                              <View>
                                <GlassInput
                                  ref={courseRef}
                                  label="Course / Program"
                                  placeholder="e.g. BS Information Technology"
                                  value={createForm.course}
                                  onChangeText={(t) => {
                                    setCreateForm((f) => ({ ...f, course: t }));
                                    if (regErrors.course) setRegErrors((e) => ({ ...e, course: "" }));
                                  }}
                                  error={regErrors.course}
                                />

                                <GlassSelectRow
                                  label="Year Level"
                                  value={createForm.yearLevel}
                                  placeholder="Select Year Level"
                                  onPress={() => setSelectModalType("yearLevel")}
                                  error={regErrors.yearLevel}
                                />
                              </View>
                            )}

                            {(createForm.studentCategory === "Elementary" ||
                              createForm.studentCategory === "Junior High School" ||
                              createForm.studentCategory === "Senior High School") && (
                              <View>
                                <GlassSelectRow
                                  label="Grade Level"
                                  value={createForm.gradeLevel}
                                  placeholder="Select Grade Level"
                                  onPress={() => setSelectModalType("gradeLevel")}
                                  error={regErrors.gradeLevel}
                                />

                                <GlassInput
                                  ref={guardianNameRef}
                                  label="Parent / Guardian Name"
                                  icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                                  placeholder="MARIA DELA CRUZ"
                                  autoCapitalize="characters"
                                  value={createForm.guardianName}
                                  onChangeText={(t) => {
                                    setCreateForm((f) => ({ ...f, guardianName: t.toUpperCase() }));
                                    if (regErrors.guardianName) setRegErrors((e) => ({ ...e, guardianName: "" }));
                                  }}
                                  error={regErrors.guardianName}
                                />
                              </View>
                            )}
                          </View>
                        )}

                        {/* Employee Fields */}
                        {createForm.category === "Employee" && (
                          <View>
                            <GlassInput
                              ref={positionRef}
                              label="Position / Designation"
                              placeholder="e.g. Assistant Professor"
                              value={createForm.position}
                              onChangeText={(t) => {
                                setCreateForm((f) => ({ ...f, position: t }));
                                if (regErrors.position) setRegErrors((e) => ({ ...e, position: "" }));
                              }}
                              error={regErrors.position}
                            />

                            <GlassInput
                              ref={departmentRef}
                              label="Department"
                              placeholder="e.g. College of Computing Studies"
                              value={createForm.department}
                              onChangeText={(t) => {
                                setCreateForm((f) => ({ ...f, department: t }));
                                if (regErrors.department) setRegErrors((e) => ({ ...e, department: "" }));
                              }}
                              error={regErrors.department}
                            />
                          </View>
                        )}

                        {/* Outsider Fields */}
                        {createForm.category === "Outsider" && (
                          <View>
                            <GlassInput
                              ref={addressRef}
                              label="Home Address"
                              icon={<MapPinIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="Complete address (House No., Street, Barangay, City, Province)"
                              value={createForm.address}
                              multiline
                              numberOfLines={3}
                              onChangeText={(t) => {
                                setCreateForm((f) => ({ ...f, address: t }));
                                if (regErrors.address) setRegErrors((e) => ({ ...e, address: "" }));
                              }}
                              error={regErrors.address}
                            />
                          </View>
                        )}

                        <TouchableOpacity
                          onPress={handleStep4Next}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: "#1E4FD8",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {regLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 16,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.4,
                              }}
                            >
                              {isGooglePrefilled ? "Finalize Clinic Account 🎉" : "Next →"}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {isGooglePrefilled ? (
                          <TouchableOpacity
                            onPress={() => goToCreateStep(5, "next")}
                            activeOpacity={0.7}
                            style={{ alignItems: "center", marginTop: 10, paddingVertical: 4 }}
                          >
                            <Text style={{ color: "#93C5FD", fontSize: 13, fontFamily: "Outfit", fontWeight: "600" }}>
                              Or set a password (optional) →
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </Animated.View>
                    )}

                    {/* Step 5: Security & Password (Last Step) */}
                    {createStep === 5 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={5}
                          total={5}
                          title="Security & Password"
                          subtitle="Set a secure password for your account"
                          onBack={() => goToCreateStep(4, "back")}
                        />

                        {isGoogleSignup && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: "rgba(59, 130, 246, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(147, 197, 253, 0.4)",
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              marginBottom: 12,
                              gap: 8,
                            }}
                          >
                            <GoogleLogoIcon size={16} />
                            <Text style={{ color: "#BFDBFE", fontSize: 12, fontFamily: "Outfit", fontWeight: "600", flex: 1 }}>
                              Google Connected: {createForm.email} ({createForm.category})
                            </Text>
                          </View>
                        )}

                        <GlassInput
                          ref={regPasswordRef}
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="Password (min 6 characters)"
                          value={createForm.password}
                          onChangeText={(t) => {
                            setCreateForm((f) => ({ ...f, password: t }));
                            if (regErrors.password) setRegErrors((e) => ({ ...e, password: "" }));
                          }}
                          secureTextEntry
                          showPasswordToggle
                          returnKeyType="next"
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          blurOnSubmit={false}
                          error={regErrors.password}
                        />

                        <GlassInput
                          ref={confirmPasswordRef}
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="Confirm Password"
                          value={createForm.confirmPassword}
                          onChangeText={(t) => {
                            setCreateForm((f) => ({ ...f, confirmPassword: t }));
                            if (regErrors.confirmPassword) setRegErrors((e) => ({ ...e, confirmPassword: "" }));
                          }}
                          secureTextEntry
                          showPasswordToggle
                          returnKeyType="done"
                          onSubmitEditing={handleGetStarted}
                          error={regErrors.confirmPassword}
                        />

                        <TouchableOpacity
                          onPress={handleGetStarted}
                          disabled={regLoading}
                          activeOpacity={0.85}
                          style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 14,
                            backgroundColor: "#1E4FD8",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 10,
                            shadowColor: "#1E4FD8",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          {regLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 16,
                                fontWeight: "700",
                                fontFamily: "Outfit",
                                letterSpacing: 0.4,
                              }}
                            >
                              {isGooglePrefilled ? "Finalize Clinic Account 🎉" : "Create Account"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </>
                )}
              </View>
            )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      {/* Student Category Picker */}
      <GlassSelectionModal
        visible={selectModalType === "studentCategory"}
        title="Select Classification"
        options={STUDENT_CATEGORIES}
        selected={createForm.studentCategory}
        onSelect={(opt) => {
          setCreateForm((f) => ({
            ...f,
            studentCategory: opt as any,
            gradeLevel: "",
            guardianName: "",
            course: "",
            yearLevel: "",
          }));
          if (regErrors.studentCategory) setRegErrors((e) => ({ ...e, studentCategory: "" }));
        }}
        onClose={() => setSelectModalType(null)}
      />

      {/* Grade Level Picker */}
      <GlassSelectionModal
        visible={selectModalType === "gradeLevel"}
        title="Select Grade Level"
        options={
          createForm.studentCategory && GRADE_LEVELS[createForm.studentCategory as keyof typeof GRADE_LEVELS]
            ? GRADE_LEVELS[createForm.studentCategory as keyof typeof GRADE_LEVELS]
            : []
        }
        selected={createForm.gradeLevel}
        onSelect={(opt) => {
          setCreateForm((f) => ({ ...f, gradeLevel: opt }));
          if (regErrors.gradeLevel) setRegErrors((e) => ({ ...e, gradeLevel: "" }));
        }}
        onClose={() => setSelectModalType(null)}
      />

      {/* Year Level Picker */}
      <GlassSelectionModal
        visible={selectModalType === "yearLevel"}
        title="Select Year Level"
        options={YEAR_LEVELS}
        selected={createForm.yearLevel}
        onSelect={(opt) => {
          setCreateForm((f) => ({ ...f, yearLevel: opt }));
          if (regErrors.yearLevel) setRegErrors((e) => ({ ...e, yearLevel: "" }));
        }}
        onClose={() => setSelectModalType(null)}
      />
    </Modal>
  );
});

// ── Blue Gradient Background (Visits Palette: Light Blue at Top -> Dark Blue at Bottom) ──

const WelcomeBackground = memo(function WelcomeBackground({
  bgBlurAnim,
}: {
  bgBlurAnim: Animated.Value;
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: "hidden",
          width: "100%",
          height: "100%",
          minHeight: Platform.OS === "web" ? ("100dvh" as any) : "100%",
        },
      ]}
      pointerEvents="none"
    >
      {/* Blue Gradient: light blue at top, transitioning to dark blue at bottom */}
      <LinearGradient
        colors={["#72CAEC", "#123499", "#0A2472"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Modal dimming overlay when auth sheet is open */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            opacity: bgBlurAnim,
          },
        ]}
      />
    </View>
  );
});

const curaLogo1xSource = require("../../assets/images/cura-logo-1x.webp");
const curaLogo2xSource = require("../../assets/images/cura-logo-2x.webp");
const uaSeal1xSource = require("../../assets/images/ua-seal-1x.webp");
const uaSeal2xSource = require("../../assets/images/ua-seal-2x.webp");

const resolveAssetUri = (source: any): string => {
  if (typeof (Image as any).resolveAssetSource === "function") {
    return (Image as any).resolveAssetSource(source)?.uri || "";
  }
  return typeof source === "string" ? source : source?.uri || source?.default || "";
};

let MaskedView: any = null;
try {
  MaskedView = require("@react-native-masked-view/masked-view").default;
} catch (e) {
  MaskedView = null;
}

// ── Welcome ──────────────────────────────────────────────────────────────────

export function WelcomeScreen({
  navigate,
  goBack,
  setUser,
  loadUserData,
  initialAuthMode,
}: NavProps & { initialAuthMode?: "signin" | "create_account" | null }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive calculations calibrated for mobile web and native
  const logoSize = Math.min(width * 0.40, height < 700 ? 110 : 140);
  const wordmarkSize = width < 380 || height < 700 ? 46 : 56;
  const taglineSize = width < 380 || height < 700 ? 13 : 15;
  const logo1xUri = resolveAssetUri(curaLogo1xSource);
  const logo2xUri = resolveAssetUri(curaLogo2xSource);
  const uaSeal1xUri = resolveAssetUri(uaSeal1xSource);
  const uaSeal2xUri = resolveAssetUri(uaSeal2xSource);

  // Modal State & Background Blur Animation
  const [authMode, setAuthMode] = useState<"signin" | "create_account" | null>(initialAuthMode ?? null);
  const bgBlurAnim = useRef(new Animated.Value(initialAuthMode ? 1 : 0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // 5s infinite soft light band animation moving up and down
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
  }, [shineAnim]);

  // Dynamic Web Preload for both landing page logos (<link rel="preload" as="image">)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const urls = [logo2xUri, logo1xUri, uaSeal2xUri, uaSeal1xUri].filter(Boolean);
    const links: HTMLLinkElement[] = [];

    urls.forEach((url) => {
      const selector = `link[rel="preload"][as="image"][href="${url}"]`;
      if (!document.querySelector(selector)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
        links.push(link);
      }
    });

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [logo1xUri, logo2xUri, uaSeal1xUri, uaSeal2xUri]);

  // Reanimated Bottom Sheet Slide Down / Up
  const isModalOpen = authMode !== null;
  const sheetProgress = useSharedValue(initialAuthMode ? 1 : 0);
  const sheetHeightShared = useSharedValue(260);

  useEffect(() => {
    sheetProgress.value = withTiming(isModalOpen ? 1 : 0, {
      duration: 300,
      easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic),
    });
  }, [isModalOpen, sheetProgress]);

  const onSheetLayout = useCallback((e: any) => {
    const h = e.nativeEvent?.layout?.height;
    if (h && h > 0) {
      sheetHeightShared.value = h;
    }
  }, [sheetHeightShared]);

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    const targetDistance = sheetHeightShared.value + insets.bottom + 24;
    return {
      transform: [{ translateY: sheetProgress.value * targetDistance }],
      opacity: 1 - sheetProgress.value,
    };
  });

  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  }, []);

  const openAuthModal = useCallback((mode: "signin" | "create_account") => {
    triggerHaptic();
    setAuthMode(mode);
    Animated.timing(bgBlurAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [triggerHaptic, bgBlurAnim]);

  const closeAuthModal = useCallback(() => {
    Animated.timing(bgBlurAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setAuthMode(null);
      if (initialAuthMode && goBack) {
        goBack();
      }
    });
  }, [bgBlurAnim, initialAuthMode, goBack]);

  const handleSignInSuccess = useCallback((userEmail: string, userName: string, accessToken: string, patientId?: string) => {
    AsyncStorage.multiRemove([
      "@cura_cached_consultations",
      "@cura_cached_medications",
      "@cura_cached_certificates",
    ]).catch(() => {});
    const sessionUser = {
      ...(patientId ? { id: patientId, id_number: patientId } : {}),
      email: userEmail,
      firstName: userName,
      displayName: userName,
      lastName: "",
      accessToken,
    };
    if (setUser) {
      setUser(sessionUser);
    }
    if (accessToken) {
      AsyncStorage.setItem("@cura_access_token", accessToken).catch(() => {});
    }
    AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});
    if (loadUserData) {
      loadUserData(userEmail);
    }
    closeAuthModal();
    navigate("home");
  }, [setUser, loadUserData, navigate, closeAuthModal]);

  const handleRegisterSuccess = useCallback((userEmail: string, userName: string, accessToken: string, idNumber: string, fullName: string, finalUser?: any) => {
    AsyncStorage.multiRemove([
      "@cura_cached_consultations",
      "@cura_cached_medications",
      "@cura_cached_certificates",
    ]).catch(() => {});
    const sessionUser = finalUser || {
      id: idNumber,
      id_number: idNumber,
      email: userEmail,
      name: fullName,
      firstName: userName,
      displayName: userName,
      lastName: "",
      accessToken,
    };
    if (setUser) {
      setUser(sessionUser);
    }
    if (accessToken) {
      AsyncStorage.setItem("@cura_access_token", accessToken).catch(() => {});
    }
    AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});
    if (loadUserData) {
      loadUserData(userEmail);
    }
    closeAuthModal();
    navigate("home");
  }, [setUser, loadUserData, navigate, closeAuthModal]);

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: Platform.OS === "web" ? ("100dvh" as any) : "100%",
        backgroundColor: "transparent",
        overflow: "hidden",
        justifyContent: "space-between",
      }}
    >
      {/* FULL-BLEED Brand Background - continuous across full screen, behind header, hero, and bottom sheet */}
      <WelcomeBackground bgBlurAnim={bgBlurAnim} />



      {/* 1) Top Section (Header + Hero) */}
      <View style={{ flex: 1, width: "100%", position: "relative" }}>

        {/* 2) Header (Top-left) */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {Platform.OS === "web" ? (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={uaSeal1xUri || uaSeal2xUri}
                srcSet={`${uaSeal1xUri} 1x, ${uaSeal2xUri} 2x`}
                alt="University of the Assumption Seal"
                width={48}
                height={48}
                loading="eager"
                fetchPriority="high"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  objectFit: "contain",
                  display: "block",
                  animation: "logoFadeIn 0.25s ease-out forwards",
                }}
              />
            </div>
          ) : (
            <Image
              source={uaSeal2xSource}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="contain"
              fadeDuration={150}
            />
          )}
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: "600",
              letterSpacing: 0.5,
              fontFamily: "Outfit",
              marginLeft: 14,
              flexShrink: 1,
            }}
          >
            University of the Assumption
          </Text>
        </View>

        {/* 3) Hero (Center) */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          {/* CURA Shield Logo Icon with Masked Soft Light Band Shine (Strictly inside shape, no bottom lines) */}
          {Platform.OS === "web" ? (
            <div
              style={{
                position: "relative",
                width: logoSize,
                height: logoSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <style>{`
                @keyframes logoFadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes curaLogoShineSweep {
                  0%, 100% {
                    transform: translateY(-110%);
                  }
                  50% {
                    transform: translateY(220%);
                  }
                }
                @keyframes curaTextShineSweep {
                  0%, 100% {
                    background-position: 0% 0%;
                  }
                  50% {
                    background-position: 0% 100%;
                  }
                }
              `}</style>
              {/* Base Logo */}
              <img
                src={logo1xUri || logo2xUri}
                srcSet={`${logo1xUri} 1x, ${logo2xUri} 2x`}
                alt="CURA Logo"
                width={Math.round(logoSize)}
                height={Math.round(logoSize)}
                loading="eager"
                fetchPriority="high"
                style={{
                  width: logoSize,
                  height: logoSize,
                  objectFit: "contain",
                  display: "block",
                  animation: "logoFadeIn 0.25s ease-out forwards",
                }}
              />
              {/* Shine Overlay - strictly masked to the logo's WebP/PNG alpha */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  WebkitMaskImage: `url(${logo2xUri || logo1xUri})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: `url(${logo2xUri || logo1xUri})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: logoSize * 0.45,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(186,230,253,0.5) 30%, rgba(255,255,255,0.92) 50%, rgba(186,230,253,0.5) 70%, rgba(255,255,255,0) 100%)",
                    animation: "curaLogoShineSweep 5s ease-in-out infinite",
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            </div>
          ) : (
            <View
              style={{
                width: logoSize,
                height: logoSize,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {MaskedView ? (
                <MaskedView
                  style={{ width: logoSize, height: logoSize }}
                  maskElement={
                    <Image
                      source={curaLogo2xSource}
                      style={{ width: logoSize, height: logoSize }}
                      resizeMode="contain"
                    />
                  }
                >
                  <Image
                    source={curaLogo2xSource}
                    style={{ width: logoSize, height: logoSize }}
                    resizeMode="contain"
                    fadeDuration={150}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: logoSize * 0.45,
                      transform: [
                        {
                          translateY: shineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-logoSize * 0.55, logoSize * 1.15],
                          }),
                        },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0.88)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0)",
                      ]}
                      locations={[0, 0.3, 0.5, 0.7, 1]}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Animated.View>
                </MaskedView>
              ) : (
                <Image
                  source={curaLogo2xSource}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                  fadeDuration={150}
                />
              )}
            </View>
          )}

          {/* CURA Wordmark (Matching Shield Logo Shine Animation) */}
          {Platform.OS === "web" ? (
            <div
              style={{
                position: "relative",
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              <svg
                width={wordmarkSize * 3.8}
                height={wordmarkSize * 1.25}
                viewBox={`0 0 ${wordmarkSize * 3.8} ${wordmarkSize * 1.25}`}
                style={{ overflow: "hidden", display: "block" }}
              >
                <defs>
                  <mask id="curaWordmarkWebMask">
                    <text
                      x="50%"
                      y="75%"
                      textAnchor="middle"
                      fontSize={wordmarkSize}
                      fontWeight="800"
                      fontFamily="'Plus Jakarta Sans', Outfit, sans-serif"
                      letterSpacing={1.5}
                      fill="#FFFFFF"
                    >
                      CURA
                    </text>
                  </mask>
                  <linearGradient id="curaWordmarkWebShine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="30%" stopColor="#BAE6FD" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="70%" stopColor="#BAE6FD" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Base text: pure white */}
                <text
                  x="50%"
                  y="75%"
                  textAnchor="middle"
                  fontSize={wordmarkSize}
                  fontWeight="800"
                  fontFamily="'Plus Jakarta Sans', Outfit, sans-serif"
                  letterSpacing={1.5}
                  fill="#FFFFFF"
                >
                  CURA
                </text>
                {/* Sweeping soft light band identical to the shield logo */}
                <g mask="url(#curaWordmarkWebMask)">
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height={wordmarkSize * 0.45}
                    fill="url(#curaWordmarkWebShine)"
                    style={{
                      animation: "curaLogoShineSweep 5s ease-in-out infinite",
                      mixBlendMode: "screen",
                    }}
                  />
                </g>
              </svg>
            </div>
          ) : (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {MaskedView ? (
                <MaskedView
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  maskElement={
                    <View
                      style={{
                        backgroundColor: "transparent",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#000000",
                          fontSize: wordmarkSize,
                          fontWeight: "800",
                          letterSpacing: 1.5,
                          fontFamily: "Outfit",
                        }}
                      >
                        CURA
                      </Text>
                    </View>
                  }
                >
                  {/* Base text: pure white */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: wordmarkSize,
                        fontWeight: "800",
                        letterSpacing: 1.5,
                        fontFamily: "Outfit",
                      }}
                    >
                      CURA
                    </Text>
                  </View>

                  {/* Soft light band strictly matching shield logo */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: -40,
                      right: -40,
                      height: wordmarkSize * 0.45,
                      transform: [
                        {
                          translateY: shineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-wordmarkSize * 0.55, wordmarkSize * 1.15],
                          }),
                        },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0.92)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0)",
                      ]}
                      locations={[0, 0.3, 0.5, 0.7, 1]}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Animated.View>
                </MaskedView>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: wordmarkSize,
                      fontWeight: "800",
                      letterSpacing: 1.5,
                      fontFamily: "Outfit",
                    }}
                  >
                    CURA
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tagline */}
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: taglineSize,
              lineHeight: taglineSize + 8,
              fontWeight: "500",
              textAlign: "center",
              maxWidth: width * 0.78,
              marginTop: 12,
            }}
          >
            Your personal health companion for smarter, simpler campus care.
          </Text>
        </View>
      </View>

      {/* 4) Bottom Sheet */}
      <AnimatedReanimated.View
        pointerEvents={isModalOpen ? "none" : "auto"}
        onLayout={onSheetLayout}
        style={[
          {
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            overflow: "hidden",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            backgroundColor: "#FFFFFF",
            paddingTop: 28,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 20) + 8,
            shadowColor: "#0A2472",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          },
          sheetAnimatedStyle,
        ]}
      >
        {/* Primary: Sign In Button with Blue Gradient Background */}
        <TouchableOpacity
          onPress={() => openAuthModal("signin")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 9999,
            overflow: "hidden",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            shadowColor: "#0A2472",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <LinearGradient
            colors={ADMIN_PORTAL_GRADIENT.colors}
            start={ADMIN_PORTAL_GRADIENT.start}
            end={ADMIN_PORTAL_GRADIENT.end}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <PersonIcon color="#FFFFFF" size={20} />
            <Text
              style={{
                marginLeft: 12,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "Outfit",
              }}
            >
              Sign In
            </Text>
          </View>
          <ArrowRightIcon color="#FFFFFF" size={20} />
        </TouchableOpacity>

        {/* Secondary: Create Account Button with Blue Gradient Border */}
        <TouchableOpacity
          onPress={() => openAuthModal("create_account")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 9999,
            marginTop: 14,
            padding: 2,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={ADMIN_PORTAL_GRADIENT.colors}
            start={ADMIN_PORTAL_GRADIENT.start}
            end={ADMIN_PORTAL_GRADIENT.end}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 18,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <PencilIcon color="#0056B3" size={20} />
              <Text
                style={{
                  marginLeft: 12,
                  color: "#002D72",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: "Outfit",
                }}
              >
                Create Account
              </Text>
            </View>
            <ArrowRightIcon color="#0056B3" size={20} />
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#64748B",
              fontWeight: "500",
              fontFamily: "Outfit",
              textAlign: "center",
            }}
          >
            University Clinic
          </Text>
        </View>
      </AnimatedReanimated.View>

      {/* 5) Standalone Animated Glassmorphism Auth Modal */}
      {authMode !== null && (
        <AuthModal
          visible={authMode !== null}
          initialMode={authMode}
          onClose={closeAuthModal}
          onSuccessSignIn={handleSignInSuccess}
          onSuccessRegister={handleRegisterSuccess}
        />
      )}
    </View>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

export function LoginScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [detectedPatient, setDetectedPatient] = useState<any>(null);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Debounced email check for clinic patient records (380ms)
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setCheckingEmail(false);
      setDetectedPatient(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/?email=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setDetectedPatient(data);
            if (!data.claimed) {
              setOtpMode(true);
            }
          } else {
            setDetectedPatient(null);
          }
        }
      } catch (err) {
        // quiet error
      } finally {
        setCheckingEmail(false);
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [email]);

  // Cooldown countdown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googlePendingToken, setGooglePendingToken] = useState("");
  const [, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("Please enter your email first.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          is_google: Boolean(googlePendingToken)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCooldown(60);
      } else {
        setError(data.error || "Failed to send OTP code.");
      }
    } catch {
      setError("Failed to send verification code. Please check connection.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      if (googlePendingToken) {
        const data = await authenticateWithCuraBackend(googlePendingToken, email.trim(), undefined, cleanOtp);
        const userEmail = data.user?.email || email.trim();
        const userName = (data.user?.first_name || data.user?.name || userEmail.split('@')[0]).toUpperCase();

        if (data.access) {
          await AsyncStorage.setItem('@cura_access_token', data.access).catch(() => {});
        }
        const sessionUser = {
          email: userEmail,
          firstName: userName,
          displayName: userName,
          lastName: data.user?.last_name || '',
          accessToken: data.access,
          role: data.user?.category || 'Student',
          id: data.user?.patient_id,
        };
        await AsyncStorage.setItem('@cura_user_session', JSON.stringify(sessionUser)).catch(() => {});

        if (setUser) setUser(sessionUser);
        if (loadUserData) await loadUserData(userEmail);
        navigate("home");
        return;
      }

      const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.access) {
          const userEmail = data.user?.email || email.trim();
          const userName = (data.user?.name || userEmail.split('@')[0]).toUpperCase();
          const sessionUser = {
            email: userEmail,
            firstName: userName,
            displayName: userName,
            lastName: '',
            accessToken: data.access,
            id: data.user?.id || data.user?.patient_id,
          };
          if (setUser) {
            setUser((prev: any) => ({ ...prev, ...sessionUser }));
          }
          AsyncStorage.setItem('@cura_access_token', data.access).catch(() => {});
          AsyncStorage.setItem('@cura_user_session', JSON.stringify(sessionUser)).catch(() => {});
          if (loadUserData) loadUserData(userEmail);
          navigate("home");
        } else {
          navigate("register");
        }
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error verifying code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const onGoogleSuccess = useCallback(async (idToken: string, fallbackEmail?: string, fallbackName?: string) => {
    try {
      setGoogleLoading(true);
      setError("");

      let cleanEmail = (fallbackEmail || "").trim().toLowerCase();
      let cleanName = (fallbackName || "").trim();
      if (!cleanEmail) {
        const parsed = parseGoogleIdToken(idToken);
        if (parsed?.email) cleanEmail = parsed.email.trim().toLowerCase();
        if (parsed?.name && !cleanName) cleanName = parsed.name.trim();
      }

      // Check if user has an existing account
      if (cleanEmail) {
        try {
          const checkRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/check-email/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail }),
          });
          const checkData = await checkRes.json().catch(() => ({}));
          if (checkData && !checkData.claimed) {
            const notFoundMsg = `No account found for this Google account (${cleanEmail}). Please create an account first.`;
            setError(notFoundMsg);
            setGoogleLoading(false);
            return;
          }
        } catch (e) {}
      }

      const data = await authenticateWithCuraBackend(idToken, cleanEmail, cleanName, undefined, "signin");

      if (data?.require_otp) {
        setGooglePendingToken(idToken);
        if (data.email) setEmail(data.email);
        setOtpMode(true);
        setOtpSent(true);
        setOtpCooldown(60);
        setError("");
        return;
      }

      const userEmail = data.user?.email || cleanEmail || "user@ua.edu.ph";
      const userName = (data.user?.first_name || data.user?.name || cleanName || userEmail.split("@")[0]).toUpperCase();

      if (data.access) {
        await AsyncStorage.setItem("@cura_access_token", data.access).catch(() => {});
      }
      const sessionUser = {
        email: userEmail,
        firstName: userName,
        displayName: userName,
        lastName: data.user?.last_name || "",
        accessToken: data.access,
        role: data.user?.category || "Student",
        id: data.user?.patient_id,
      };
      await AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});

      if (setUser) {
        setUser(sessionUser);
      }
      if (loadUserData) {
        await loadUserData(userEmail);
      }
      navigate("home");
    } catch (err: any) {
      if (err?.not_found || err?.code === "ACCOUNT_NOT_FOUND" || err?.status === 404) {
        setError("No clinic account found for this Google email. Please create an account first.");
        return;
      }
      setError(err?.message || "Google authentication failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, [setUser, loadUserData, navigate]);

  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.params?.id_token) {
      onGoogleSuccess(googleResponse.params.id_token);
    }
  }, [googleResponse, onGoogleSuccess]);

  const handleGoogleSignIn = async () => {
    setError("");
    if (Platform.OS === "web") {
      setGoogleLoading(true);
      try {
        const res = await signInWithGooglePopup();
        await onGoogleSuccess(res.idToken, res.email, res.displayName);
      } catch (err: any) {
        if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
          setError(err?.message || "Google Sign-In failed. Please try again.");
        }
      } finally {
        setGoogleLoading(false);
      }
    } else {
      if (googlePromptAsync) {
        googlePromptAsync();
      }
    }
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const loginRes = await fetchWithRetry(`https://cura-backend-dtfj.onrender.com/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), password: password }),
      });
      
      const resText = await loginRes.text();
      let loginData: any = {};
      try { loginData = resText ? JSON.parse(resText) : {}; } catch {}
      
      if (loginRes.ok) {
        const userEmail = loginData.user?.email || email.trim();
        const userName = (loginData.user?.name || userEmail.split('@')[0]).toUpperCase();
        const sessionUser = {
          email: userEmail,
          firstName: userName,
          displayName: userName,
          lastName: '',
          accessToken: loginData.access,
          id: loginData.user?.id || loginData.user?.patient_id,
        };
        
        if (setUser) {
          setUser((prev: any) => ({ ...prev, ...sessionUser }));
        }
        if (loginData.access) {
          AsyncStorage.setItem('@cura_access_token', loginData.access).catch(() => {});
        }
        AsyncStorage.setItem('@cura_user_session', JSON.stringify(sessionUser)).catch(() => {});
        if (loadUserData) {
          loadUserData(userEmail);
        }
        navigate("home");
      } else {
        setError(loginData.detail || loginData.error || "Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      console.warn("Login Network Error:", err);
      setError("Network error. Please check your connection or try again in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#E4F4FB]">
      {/* Top light banner */}
      <View
        className="px-6 pb-6" style={{ paddingTop: Math.max(insets.top, 24) + 16 }}
      >
        <Pressable
          onPress={goBack}
          className="w-10 h-10 rounded-full bg-white items-center justify-center mb-5 shadow-sm"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2136" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>

        <View className="flex-row items-center gap-3 mb-4">
          <View
            className="w-12 h-12 rounded-[16px] bg-white items-center justify-center p-1.5"
            style={{
              elevation: 4,
              shadowColor: '#0284c7',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
            }}
          >
            <Image
              source={require("../../assets/images/cura-logo.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-[28px] font-black tracking-tight" style={{ color: "#0B2136", fontFamily: "Outfit" }}>CURA</Text>
        </View>
        <Text className="text-[28px] font-bold text-slate-800 mb-2" style={{ fontFamily: "Outfit" }}>Welcome back! 👋</Text>
        <Text className="text-base text-slate-500 font-medium">Sign in to your patient account</Text>
      </View>

      {/* Form */}
      <View className="flex-1 bg-[#F8FAFC] rounded-t-[40px] overflow-hidden" style={{ elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 24 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        {error ? (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 gap-2">
            <View className="flex-row items-center gap-2">
              <Text>⚠️</Text><Text className="text-sm text-rose-600 flex-1">{error}</Text>
            </View>
            {error.includes("No account found") && (
              <Pressable
                onPress={() => navigate("register")}
                className="bg-cura-500 rounded-xl py-2 px-3 items-center mt-1 active:opacity-80"
              >
                <Text className="text-white text-xs font-bold">Create an Account Instead →</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <View>
          <Input
            label="Email address"
            placeholder="you@university.edu"
            value={email}
            onChangeText={(val) => { setError(""); setEmail(val); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {checkingEmail ? (
            <View className="flex-row items-center gap-1.5 mt-1.5 ml-1">
              <ActivityIndicator size="small" color="#0284c7" />
              <Text className="text-[11px] text-sky-600 font-medium">Checking clinic records...</Text>
            </View>
          ) : detectedPatient ? (
            <View className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 mt-2 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs">🏥</Text>
                  <Text className="text-xs font-bold text-emerald-800">Clinic Record Found</Text>
                </View>
                <Text className="text-[11px] text-emerald-600 font-medium mt-0.5" numberOfLines={1}>
                  {detectedPatient.patient?.full_name ? `${detectedPatient.patient.full_name} (${detectedPatient.patient.patient_id})` : 'Linked to University Clinic'}
                </Text>
              </View>
              <View className="bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-emerald-700">
                  {detectedPatient.claimed ? 'Registered' : 'Unclaimed'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {otpMode ? (
          <View className="flex-col gap-2.5 bg-sky-50/70 border border-sky-100 rounded-2xl p-4 mt-1">
            {googlePendingToken ? (
              <View className="bg-sky-100/80 border border-sky-200 rounded-xl px-3 py-2 flex-row items-center gap-2 mb-1">
                <Text>📧</Text>
                <Text className="text-xs text-sky-900 font-medium flex-1">
                  We sent a 6-digit verification code to <Text className="font-bold">{email}</Text>. Please check your Gmail inbox or spam.
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-700">6-Digit OTP Code</Text>
              {otpCooldown > 0 ? (
                <Text className="text-xs text-slate-400 font-semibold">{otpCooldown}s</Text>
              ) : (
                <Pressable onPress={handleSendOTP} disabled={otpLoading}>
                  <Text className="text-xs font-bold text-cura-500">
                    {otpSent ? 'Resend Code' : 'Send Code'}
                  </Text>
                </Pressable>
              )}
            </View>
            <TextInput
              placeholder="000000"
              placeholderTextColor="#94A3B8"
              value={otp}
              onChangeText={(val) => { setError(""); setOtp(val); }}
              keyboardType="number-pad"
              maxLength={6}
              className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-slate-800"
            />
            {otpSent && !googlePendingToken ? (
              <Text className="text-[11px] text-emerald-600 font-medium text-center">
                Code generated. Ready to verify!
              </Text>
            ) : null}
            <Button fullWidth onPress={handleVerifyOTP} loading={otpLoading} className="mt-1">
              Verify & Sign In
            </Button>
            {detectedPatient?.claimed || googlePendingToken ? (
              <Pressable onPress={() => { setOtpMode(false); setGooglePendingToken(""); }} className="py-1 items-center">
                <Text className="text-xs font-semibold text-slate-400">
                  {googlePendingToken ? "Cancel" : "Use password instead"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  secureTextEntry={!showPass}
                  placeholder="••••••••"
                  placeholderTextColor="#CBD5E1"
                  value={password}
                  onChangeText={(val) => { setError(""); setPassword(val); }}
                  className="w-full bg-white border border-sky-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 pr-12"
                />
                <Pressable onPress={() => setShowPass(!showPass)} className="absolute right-4 p-2">
                  <Svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/>
                  </Svg>
                </Pressable>
              </View>
            </View>

            <View className="items-end">
              <Pressable onPress={() => navigate("forgot-password")} className="py-2">
                <Text className="text-sm text-cura-500 font-semibold">Forgot password?</Text>
              </Pressable>
            </View>

            <Button fullWidth onPress={handleLogin} loading={loading} className="mt-1">
              Sign In
            </Button>

            {detectedPatient ? (
              <Pressable onPress={() => { setOtpMode(true); if (!otpSent) handleSendOTP(); }} className="py-1 items-center">
                <Text className="text-xs font-bold text-cura-500">Sign in with OTP code instead →</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <View className="flex-row items-center gap-3 my-1">
          <View className="flex-1 h-px bg-sky-100" />
          <Text className="text-xs text-slate-400 font-medium uppercase tracking-wider">or continue with</Text>
          <View className="flex-1 h-px bg-sky-100" />
        </View>

        <Pressable 
          onPress={handleGoogleSignIn} 
          disabled={googleLoading || loading}
          className="w-full bg-white border border-slate-200 active:bg-slate-50 rounded-2xl py-3.5 px-4 flex-row items-center justify-center gap-3 mb-4 shadow-sm"
          style={{ elevation: 1 }}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#0284c7" />
          ) : (
            <>
              <GoogleLogoIcon size={20} />
              <Text className="text-slate-700 font-bold text-sm tracking-wide">Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View className="flex-row justify-center items-center pb-8">
          <Text className="text-sm text-slate-400">{"Don't have an account? "}</Text>
          <Pressable onPress={() => navigate("register")}>
            <Text className="text-sm text-cura-500 font-bold">Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

export function RegisterScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  return (
    <WelcomeScreen
      navigate={navigate}
      goBack={goBack}
      setUser={setUser}
      loadUserData={loadUserData}
      initialAuthMode="create_account"
    />
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export function ForgotPasswordScreen({ navigate, goBack, setUser }: NavProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://cura-backend-dtfj.onrender.com/api";

  const handleRequestOTP = async () => {
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok) {
        setStep(2);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();
    if (!cleanOtp) { setError("Please enter the OTP."); return; }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      if (res.ok) {
        setStep(3);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setError("");
    const cleanEmail = email.trim();
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.access) {
        await AsyncStorage.setItem("@cura_access_token", resData.access).catch(() => {});
        const userName = (resData.user?.name || cleanEmail.split("@")[0]).toUpperCase();
        const sessionUser = {
          email: cleanEmail,
          firstName: userName,
          displayName: userName,
          lastName: "",
          accessToken: resData.access,
          id: resData.user?.id || "",
        };
        await AsyncStorage.setItem("@cura_user_session", JSON.stringify(sessionUser)).catch(() => {});
        if (setUser) setUser(sessionUser);
        setStep(4);
      } else if (res.ok) {
        setStep(4);
      } else {
        setError(resData.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <LinearGradient
          colors={['#ECFDF5', '#D1FAE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
        >
          <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12"/>
          </Svg>
        </LinearGradient>
        <Text className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: "Outfit" }}>Password Reset! 🎉</Text>
        <Text className="text-slate-400 text-center text-sm mb-8">
          Your password has been changed successfully. You can now log in with your new password.
        </Text>
        <Button onPress={() => navigate("login")}>Back to Sign In</Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E4F4FB]">
      <View className="px-6 pb-6" style={{ paddingTop: Math.max(insets.top, 24) + 16 }}>
        <Pressable
          onPress={() => step === 1 ? goBack() : setStep((s) => (s - 1) as any)}
          className="w-10 h-10 rounded-full bg-white items-center justify-center mb-5 shadow-sm"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2136" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <Text className="text-[28px] font-black text-slate-800 mb-2 tracking-tight" style={{ fontFamily: "Outfit" }}>
          {step === 1 ? "Forgot password?" : step === 2 ? "Enter OTP" : "Set New Password"}
        </Text>
        <Text className="text-base font-medium text-slate-500">
          {step === 1 ? "We'll send a 6-digit code to your email" : step === 2 ? `Sent to ${email}` : "Enter your new secure password"}
        </Text>
      </View>
      
      <View className="flex-1 bg-[#F8FAFC] rounded-t-[40px] overflow-hidden" style={{ elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 24, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, gap: 16 }}>
        {error ? (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex-row items-center gap-2">
            <Text>⚠️</Text><Text className="text-sm text-rose-600 flex-1">{error}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <Input
            label="Email address"
            placeholder="you@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}

        {step === 2 && (
          <Input
            label="6-Digit OTP"
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        {step === 3 && (
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</Text>
            <View className="relative justify-center">
              <TextInput
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={setPassword}
                className="w-full bg-white border border-sky-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 pr-12"
              />
              <Pressable onPress={() => setShowPass(!showPass)} className="absolute right-4 p-2">
                <Svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/>
                </Svg>
              </Pressable>
            </View>
          </View>
        )}

        <Button
          fullWidth
          onPress={step === 1 ? handleRequestOTP : step === 2 ? handleVerifyOTP : handleSetPassword}
          loading={loading}
          disabled={step === 1 ? !email : step === 2 ? otp.length < 6 : password.length < 6}
        >
          {step === 1 ? "Send Reset Code" : step === 2 ? "Verify OTP" : "Reset Password"}
        </Button>
        
        {step === 1 && (
          <Pressable onPress={goBack} className="py-2 mt-1 items-center">
            <Text className="text-sm text-slate-400 font-medium">← Back to sign in</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

