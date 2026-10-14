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

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "289437991360-4ge9cgmpvjmr68pfprsvfimau1i4batr.apps.googleusercontent.com";

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
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            borderWidth: 1.5,
            borderColor: error ? "rgba(248, 113, 113, 0.7)" : "rgba(255, 255, 255, 0.30)",
            paddingHorizontal: 14,
            paddingVertical: multiline ? 10 : 0,
          }}
        >
          {icon ? <View style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} pointerEvents="none">{icon}</View> : null}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
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
            editable={true}
            style={{
              flex: 1,
              color: "#FFFFFF",
              fontSize: 14,
              fontFamily: "Outfit",
              paddingVertical: 0,
              height: multiline ? undefined : "100%",
              minHeight: multiline ? 52 : undefined,
            }}
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
  if (!clean) return "";
  if (clean.includes(".student@ua.edu.ph") || clean.endsWith(".student@ua.edu.ph")) {
    return "Student";
  }
  if (clean.includes("@ua.edu.ph") || clean.endsWith("@ua.edu.ph")) {
    return "Employee";
  }
  if (clean.includes("@gmail.com") || clean.endsWith("@gmail.com")) {
    return "Outsider";
  }
  if (clean.includes("@") && clean.includes(".")) {
    return "Outsider";
  }
  return "";
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
  onSuccessSignIn: (userEmail: string, userName: string, accessToken: string) => void;
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
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
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
        const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/check-email/`, {
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
        const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/check-email/`, {
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
      onClose();
    });
  }, [animVal, onClose]);

  const switchAuthMode = useCallback((newMode: "signin" | "create_account") => {
    triggerHaptic();
    Animated.sequence([
      Animated.timing(contentFadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
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
    }, 110);
  }, [triggerHaptic, contentFadeAnim]);

  // Step Transition Animator
  const goToCreateStep = useCallback((targetStep: 1 | 2 | 3 | 4, direction: "next" | "back") => {
    triggerHaptic();
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(stepFadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(stepSlideAnim, { toValue: direction === "next" ? -25 : 25, duration: 110, useNativeDriver: true }),
    ]).start(() => {
      setCreateStep(targetStep);
      setRegErrors({});
      setRegGeneralError("");
      stepSlideAnim.setValue(direction === "next" ? 25 : -25);
      Animated.parallel([
        Animated.timing(stepFadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(stepSlideAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    });
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
      const loginRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/login/`, {
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
        onSuccessSignIn(userEmail, userName, loginData.access || "");
      } else {
        setSignInGeneralError(loginData.detail || loginData.error || "Invalid username/email or password.");
      }
    } catch (e) {
      setSignInGeneralError("Network error. Please check your connection.");
    } finally {
      setSignInLoading(false);
    }
  }, [signInIdentifier, signInPassword, onSuccessSignIn]);

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
      const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerHaptic();
        setSignInOtpSent(true);
        setSignInOtpMode(true);
        setSignInOtpCooldown(30);
        setSignInOtp("");
      } else {
        setSignInGeneralError(data.error || "Failed to send OTP code.");
      }
    } catch {
      setSignInGeneralError("Network error. Please try again.");
    } finally {
      setSignInOtpLoading(false);
    }
  }, [signInIdentifier, triggerHaptic]);

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
      const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        triggerHaptic();
        if (data.access) {
          onSuccessSignIn(cleanEmail, data.user?.name || cleanEmail.split("@")[0], data.access);
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
    } catch {
      setSignInGeneralError("Network error. Please try again.");
    } finally {
      setSignInOtpLoading(false);
    }
  }, [signInOtp, signInIdentifier, signInDetectedPatient, triggerHaptic, onSuccessSignIn]);

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
    if (!detected && !createDetectedPatient) {
      errs.email = "Please enter a valid student, employee, or outsider email";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    setRegErrors({});
    setEmailChecking(true);

    try {
      const cleanEmail = trimmedEmail.toLowerCase();
      let checkData: any = createDetectedPatient;
      if (!checkData) {
        const checkRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/check-email/`, {
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
        const otpRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/request-otp/`, {
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
        setCreateForm((f) => ({ ...f, email: cleanEmail, category: detected || (createDetectedPatient?.category as any) || "Student" }));
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
      setCreateForm((f) => ({ ...f, email: cleanEmail, category: detected }));
      goToCreateStep(2, "next");
    } catch (err) {
      setRegErrors({
        email: "Unable to verify email with clinic servers. Please try again.",
      });
    } finally {
      setEmailChecking(false);
    }
  }, [createForm.email, createDetectedPatient, goToCreateStep, triggerHaptic]);

  // Step 2 Validation & Next: Basic Information
  const handleStep2Next = useCallback(() => {
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

    goToCreateStep(3, "next");
  }, [createForm.fullName, createForm.dob, createForm.sex, createForm.contact, createForm.emergencyName, createForm.emergencyPhone, goToCreateStep]);

  // Step 3 Validation & Next: Category-Specific Details
  const handleStep3Next = useCallback(() => {
    const errs: Record<string, string> = {};
    const { category } = createForm;

    if (category === "Student") {
      if (!createForm.studentId.trim()) {
        errs.studentId = "Student ID is required";
      }
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
      if (!createForm.employeeId.trim()) errs.employeeId = "Employee ID is required";
      if (!createForm.position.trim()) errs.position = "Position is required";
      if (!createForm.department.trim()) errs.department = "Department is required";
    } else if (category === "Outsider") {
      if (!createForm.address.trim()) errs.address = "Home address is required";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    goToCreateStep(4, "next");
  }, [
    createForm.category,
    createForm.studentId,
    createForm.studentCategory,
    createForm.course,
    createForm.yearLevel,
    createForm.gradeLevel,
    createForm.guardianName,
    createForm.employeeId,
    createForm.position,
    createForm.department,
    createForm.address,
    goToCreateStep,
  ]);

  // Step 4 Validation & Submit: Password & Complete Registration
  const handleGetStarted = useCallback(async () => {
    const errs: Record<string, string> = {};

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

      // Step A: Register API call
      const regRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: createForm.password,
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
        await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/complete-profile/`, {
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
      const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
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
  }, [claimOtp, createForm.email, triggerHaptic]);

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
      const digits = (claimMissingData.contact || "").replace(/\D/g, "");
      if (!digits) {
        errs.contact = "Contact number is required";
      } else if (!isValidPHPhone(claimMissingData.contact) && !/^09\d{9}$/.test(digits)) {
        errs.contact = "Must be valid PH mobile (09XX-XXX-XXXX)";
      }
    }
    if (claimMissingFields.includes("emergencyPhone")) {
      const emDigits = (claimMissingData.emergencyPhone || "").replace(/\D/g, "");
      if (!emDigits) {
        errs.emergencyPhone = "Emergency phone is required";
      } else if (!isValidPHPhone(claimMissingData.emergencyPhone) && !/^09\d{9}$/.test(emDigits)) {
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

    try {
      const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: claimPassword }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.access) {
        const token = resData.access;
        const userName = (resData.user?.name || cleanEmail.split("@")[0]).toUpperCase();

        if (claimMissingFields.length > 0) {
          const profilePayload: any = {};
          if (claimMissingData.contact) profilePayload.contact = claimMissingData.contact;
          if (claimMissingData.dob) profilePayload.birthday = claimMissingData.dob;
          if (claimMissingData.sex) profilePayload.sex = claimMissingData.sex;
          if (claimMissingData.emergencyName) profilePayload.emergencyContact = claimMissingData.emergencyName;
          if (claimMissingData.emergencyPhone) profilePayload.emergencyPhone = claimMissingData.emergencyPhone;
          if (claimMissingData.course) profilePayload.course = claimMissingData.course;
          if (claimMissingData.yearLevel) profilePayload.yearLevel = claimMissingData.yearLevel;
          if (claimMissingData.address) profilePayload.address = claimMissingData.address;

          await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/complete-profile/`, {
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

        onSuccessRegister(
          cleanEmail,
          userName,
          token,
          resData.user?.id || "",
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
  }, [claimPassword, claimConfirmPassword, claimMissingFields, claimMissingData, createForm.email, onSuccessRegister, showAlert]);

  const handleResendClaimOTP = useCallback(async () => {
    if (claimResendCooldown > 0 || claimLoading) return;
    setClaimLoading(true);
    setClaimErrors({});
    try {
      const cleanEmail = createForm.email.trim().toLowerCase();
      const res = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
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
  }, [claimResendCooldown, claimLoading, createForm.email, showAlert]);

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
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingRight: 40 }}>
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
                {authMode === "signin" ? (
                  // Sign In Content
                  <View>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 24,
                        fontWeight: "700",
                        fontFamily: "Outfit",
                        letterSpacing: 0.3,
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
                          paddingVertical: 8,
                          marginBottom: 14,
                        }}
                      >
                        <Text style={{ color: "#FEE2E2", fontSize: 13, fontFamily: "Outfit" }}>
                          {signInGeneralError}
                        </Text>
                      </View>
                    ) : null}

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

                    {/* Real-time Email Check Status */}
                    {signInCheckingEmail ? (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 8, paddingLeft: 4 }}>
                        <ActivityIndicator size="small" color="#93C5FD" />
                        <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 12, fontFamily: "Outfit", marginLeft: 8 }}>
                          Checking clinic records...
                        </Text>
                      </View>
                    ) : null}

                    {/* Detected Clinic Record Badge */}
                    {signInDetectedPatient ? (
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
                            Clinic Record Found
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
                            {signInDetectedPatient.name} • {signInDetectedPatient.category}
                          </Text>
                        </View>
                        {!signInDetectedPatient.claimed && (
                          <View
                            style={{
                              backgroundColor: "#059669",
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>NEW</Text>
                          </View>
                        )}
                      </View>
                    ) : null}

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
                            <GlassInput
                              icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="6-Digit OTP Code"
                              value={signInOtp}
                              onChangeText={(t) => {
                                setSignInOtp(t);
                                if (signInErrors.otp) setSignInErrors((e) => ({ ...e, otp: "" }));
                              }}
                              keyboardType="number-pad"
                              maxLength={6}
                              error={signInErrors.otp}
                              returnKeyType="done"
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
                      /* Case B: Claimed account chose OTP sign in */
                      <>
                        <GlassInput
                          icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                          placeholder="6-Digit OTP Code"
                          value={signInOtp}
                          onChangeText={(t) => {
                            setSignInOtp(t);
                            if (signInErrors.otp) setSignInErrors((e) => ({ ...e, otp: "" }));
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                          error={signInErrors.otp}
                          returnKeyType="done"
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
                            onPress={() => setSignInOtpMode(false)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 12.5, fontFamily: "Outfit" }}>
                              Use Password
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
                          paddingVertical: 8,
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ color: "#FEE2E2", fontSize: 13, fontFamily: "Outfit" }}>
                          {regGeneralError}
                        </Text>
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
                                  {createForm.fullName || "Patient Record"} • {createForm.category}
                                </Text>
                              </View>
                            </View>

                            <GlassInput
                              icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="6-Digit OTP"
                              value={claimOtp}
                              onChangeText={(t) => {
                                setClaimOtp(t);
                                if (claimErrors.otp) setClaimErrors((e) => ({ ...e, otp: "" }));
                              }}
                              keyboardType="number-pad"
                              maxLength={6}
                              error={claimErrors.otp}
                              returnKeyType="done"
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
                              total={4}
                              title="Account Email"
                              subtitle="Enter your email to identify your account"
                            />

                            <GlassInput
                              ref={emailRef}
                              icon={<MailIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                              placeholder="Email address (e.g. name.student@ua.edu.ph)"
                              value={createForm.email}
                              onChangeText={(t) => {
                                const detected = detectCategoryFromEmail(t);
                                setCreateForm((f) => ({ ...f, email: t, category: detected }));
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
                                    {createDetectedPatient.name} • {createDetectedPatient.category}
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
                            ) : createForm.category ? (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  padding: 14,
                                  borderRadius: 14,
                                  backgroundColor: "rgba(30, 79, 216, 0.35)",
                                  borderWidth: 1.5,
                                  borderColor: "#60A5FA",
                                  marginBottom: 12,
                                  shadowColor: "#1E4FD8",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 6,
                                }}
                              >
                                <Text style={{ fontSize: 26, marginRight: 12 }}>
                                  {createForm.category === "Student" ? "🎓" : createForm.category === "Employee" ? "💼" : "🌐"}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 11, fontFamily: "Outfit", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Identified Category
                                  </Text>
                                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: "Outfit", marginTop: 2 }}>
                                    {createForm.category}
                                  </Text>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.72)", fontSize: 12, fontFamily: "Outfit", marginTop: 2 }}>
                                    {createForm.category === "Student"
                                      ? "University of the Assumption Student"
                                      : createForm.category === "Employee"
                                      ? "UA Faculty & Personnel"
                                      : "External Guest / Outsider"}
                                  </Text>
                                </View>
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    backgroundColor: "#1E4FD8",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <CheckIcon color="#FFFFFF" size={12} />
                                </View>
                              </View>
                            ) : (
                              <View
                                style={{
                                  padding: 12,
                                  borderRadius: 12,
                                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                                  borderWidth: 1,
                                  borderColor: "rgba(255, 255, 255, 0.15)",
                                  marginBottom: 12,
                                }}
                              >
                                <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 12, fontFamily: "Outfit", lineHeight: 18 }}>
                                  💡 Category is automatically identified:{"\n"}
                                  • <Text style={{ color: "#93C5FD", fontWeight: "600" }}>.student@ua.edu.ph</Text> → Student{"\n"}
                                  • <Text style={{ color: "#93C5FD", fontWeight: "600" }}>@ua.edu.ph</Text> → Employee{"\n"}
                                  • <Text style={{ color: "#93C5FD", fontWeight: "600" }}>@gmail.com</Text> → Outsider
                                </Text>
                              </View>
                            )}

                            {regErrors.category ? (
                              <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "Outfit", marginBottom: 10, marginLeft: 4 }}>
                                {regErrors.category}
                              </Text>
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

                    {/* Step 2: Basic Information */}
                    {createStep === 2 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={2}
                          total={4}
                          title="Basic Information"
                          subtitle="Personal and emergency details"
                          onBack={() => goToCreateStep(1, "back")}
                        />

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
                          onPress={handleStep2Next}
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

                    {/* Step 3: Category-Specific Details */}
                    {createStep === 3 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={3}
                          total={4}
                          title="Category Details"
                          subtitle="Complete your specific requirements"
                          onBack={() => goToCreateStep(2, "back")}
                        />

                        {/* Student Fields */}
                        {createForm.category === "Student" && (
                          <View>
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
                            />

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
                            />

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

                    {/* Step 4: Security & Password (Last Step) */}
                    {createStep === 4 && (
                      <Animated.View
                        style={{
                          opacity: stepFadeAnim,
                          transform: [{ translateX: stepSlideAnim }],
                        }}
                      >
                        <GlassStepHeader
                          step={4}
                          total={4}
                          title="Security & Password"
                          subtitle="Set a secure password for your account"
                          onBack={() => goToCreateStep(3, "back")}
                        />

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
                              Create Account
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

  const handleSignInSuccess = useCallback((userEmail: string, userName: string, accessToken: string) => {
    if (setUser) {
      setUser((prev: any) => ({
        ...prev,
        email: userEmail,
        firstName: userName,
        displayName: userName,
        lastName: "",
        accessToken,
      }));
    }
    if (accessToken) {
      AsyncStorage.setItem("@cura_access_token", accessToken).catch(() => {});
    }
    if (loadUserData) {
      loadUserData(userEmail);
    }
    closeAuthModal();
    navigate("home");
  }, [setUser, loadUserData, navigate, closeAuthModal]);

  const handleRegisterSuccess = useCallback((userEmail: string, userName: string, accessToken: string, idNumber: string, fullName: string, finalUser?: any) => {
    if (setUser) {
      if (finalUser) {
        setUser(finalUser);
      } else {
        setUser((prev: any) => ({
          ...prev,
          id: idNumber,
          id_number: idNumber,
          email: userEmail,
          name: fullName,
          firstName: userName,
          displayName: userName,
          lastName: "",
          accessToken,
        }));
      }
    }
    if (accessToken) {
      AsyncStorage.setItem("@cura_access_token", accessToken).catch(() => {});
    }
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
        const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/auth/check-email/?email=${encodeURIComponent(trimmed)}`);
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

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("Please enter your email first.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/auth/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.access) {
          const userEmail = data.user?.email || email.trim();
          const userName = (data.user?.name || userEmail.split('@')[0]).toUpperCase();
          if (setUser) {
            setUser((prev: any) => ({ ...prev, email: userEmail, firstName: userName, displayName: userName, lastName: '', accessToken: data.access }));
          }
          AsyncStorage.setItem('@cura_access_token', data.access).catch(() => {});
          if (loadUserData) loadUserData(userEmail);
          navigate("home");
        } else {
          navigate("register");
        }
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch {
      setError("Network error verifying code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const mockGoogleSignIn = async () => {
    setLoading(true);
    if (loadUserData) {
      await loadUserData("jdelacruz.student@ua.edu.ph");
    }
    setLoading(false);
    navigate("home");
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const loginRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/login/`, {
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
        
        if (setUser) {
          setUser((prev: any) => ({ ...prev, email: userEmail, firstName: userName, displayName: userName, lastName: '', accessToken: loginData.access }));
        }
        if (loginData.access) {
          AsyncStorage.setItem('@cura_access_token', loginData.access).catch(() => {});
        }
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
          <View className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex-row items-center gap-2">
            <Text>⚠️</Text><Text className="text-sm text-rose-600 flex-1">{error}</Text>
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
            {otpSent ? (
              <Text className="text-[11px] text-emerald-600 font-medium text-center">
                Code generated. Ready to verify!
              </Text>
            ) : null}
            <Button fullWidth onPress={handleVerifyOTP} loading={otpLoading} className="mt-1">
              Verify & Sign In
            </Button>
            {detectedPatient?.claimed ? (
              <Pressable onPress={() => setOtpMode(false)} className="py-1 items-center">
                <Text className="text-xs font-semibold text-slate-400">Use password instead</Text>
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
          <Text className="text-xs text-slate-300 font-medium">or</Text>
          <View className="flex-1 h-px bg-sky-100" />
        </View>

        <Button 
          fullWidth 
          variant="secondary" 
          onPress={mockGoogleSignIn} 
          className="mb-4"
        >
          <Text className="text-cura-500 font-bold text-sm">Continue with Google (Mock)</Text>
        </Button>

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

export function ForgotPasswordScreen({ navigate, goBack }: NavProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://cura-backend-dvj5.onrender.com/api";

  const handleRequestOTP = async () => {
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/request-otp/`, {
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
      const res = await fetch(`${API_URL}/auth/verify-otp/`, {
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
      const res = await fetch(`${API_URL}/auth/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (res.ok) {
        setStep(4);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to reset password.");
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

