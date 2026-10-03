import React, { useState, useEffect, useRef, useCallback, memo, forwardRef } from "react";
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
import Svg, { Path, Polyline, Circle, Rect } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { Screen } from "../types";
import { useAlert } from "../components/AlertProvider";
import { Button, Input } from "../components/Shell";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// ── Glassmorphism Input Component ────────────────────────────────────────────

interface GlassInputProps {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

const GlassInput = memo(
  forwardRef<TextInput, GlassInputProps>(function GlassInput(
    {
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
    },
    ref
  ) {
    const [isSecured, setIsSecured] = useState(secureTextEntry);

    return (
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 48,
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            borderWidth: 1.5,
            borderColor: "rgba(255, 255, 255, 0.30)",
            paddingHorizontal: 14,
          }}
        >
          {icon ? <View style={{ marginRight: 10 }} pointerEvents="none">{icon}</View> : null}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.62)"
            secureTextEntry={isSecured}
            onFocus={() => {
              console.log(`[DEBUG] Input "${placeholder}" FOCUS`);
            }}
            onBlur={() => {
              console.log(`[DEBUG] Input "${placeholder}" BLUR`);
            }}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            editable={true}
            style={{
              flex: 1,
              color: "#FFFFFF",
              fontSize: 14.5,
              fontFamily: "Outfit",
              paddingVertical: 0,
              height: "100%",
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

// ── Standalone Glassmorphism Auth Modal ──────────────────────────────────────

interface AuthModalProps {
  visible: boolean;
  initialMode: "signin" | "create_account";
  onClose: () => void;
  onSuccessSignIn: (userEmail: string, userName: string, accessToken: string) => void;
  onSuccessRegister: (userEmail: string, userName: string, accessToken: string, idNumber: string, fullName: string) => void;
}

const AuthModal = memo(function AuthModal({
  visible,
  initialMode,
  onClose,
  onSuccessSignIn,
  onSuccessRegister,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"signin" | "create_account">(initialMode);
  const animVal = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInGeneralError, setSignInGeneralError] = useState("");

  // Create Account Form State
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regGeneralError, setRegGeneralError] = useState("");

  // Input refs for keyboard navigation
  const signInPasswordRef = useRef<TextInput>(null);
  const idNumberRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const regPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  }, []);

  useEffect(() => {
    console.log("[DEBUG] AuthModal MOUNT");
    return () => console.log("[DEBUG] AuthModal UNMOUNT");
  }, []);

  useEffect(() => {
    if (visible) {
      console.log("[DEBUG] Entrance animation START");
      setAuthMode(initialMode);
      setSignInErrors({});
      setSignInGeneralError("");
      setRegErrors({});
      setRegGeneralError("");
      contentFadeAnim.setValue(1);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(animVal, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
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
    }, 110);
  }, [triggerHaptic, contentFadeAnim]);

  // Sign In Handler
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

  // Create Account Handler
  const handleCreateAccount = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!idNumber.trim()) errs.idNumber = "Student / Employee ID is required";
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!username.trim()) errs.username = "Username is required";
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "At least 8 characters required";
    }
    if (password !== confirmPassword) {
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
      const regRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          username: username.trim(),
          name: fullName.trim(),
          id_number: idNumber.trim(),
        }),
      });
      const resText = await regRes.text();
      let regData: any = {};
      try { regData = resText ? JSON.parse(resText) : {}; } catch {}

      if (regRes.ok || regData.access) {
        const userEmail = regData.user?.email || email.trim();
        const userName = fullName.trim().toUpperCase() || (regData.user?.name || userEmail.split("@")[0]).toUpperCase();
        onSuccessRegister(userEmail, userName, regData.access || "", idNumber.trim(), fullName.trim());
      } else {
        setRegGeneralError(regData.error || regData.detail || "Registration failed. Account may already exist.");
      }
    } catch (e) {
      setRegGeneralError("Network error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }, [fullName, idNumber, email, username, password, confirmPassword, onSuccessRegister]);

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
            paddingHorizontal: 24,
          }}
          pointerEvents="box-none"
        >
          {/* 3) Modal Card - plain Animated.View without touchable wrapper */}
          <Animated.View
            style={{
              width: "100%",
              maxWidth: 400,
              maxHeight: "88%",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.32)",
              backgroundColor: "rgba(10, 24, 58, 0.92)",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 24,
              elevation: 10,
              opacity: animVal,
            }}
          >
            {/* Decorative gradient with pointerEvents="none" */}
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

            {/* Form Body wrapped in single ScrollView with keyboardShouldPersistTaps="handled" */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 22,
              }}
            >
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
                      <TouchableOpacity onPress={() => switchAuthMode("create_account")} activeOpacity={0.7}>
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
                  // Create Account Content
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
                      Create Account
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
                      Join the CURA clinic community
                    </Text>

                    {regGeneralError ? (
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
                          {regGeneralError}
                        </Text>
                      </View>
                    ) : null}

                    <GlassInput
                      icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                      placeholder="Full Name (e.g. Juan Dela Cruz)"
                      value={fullName}
                      onChangeText={(t) => {
                        setFullName(t);
                        if (regErrors.fullName) setRegErrors((e) => ({ ...e, fullName: "" }));
                      }}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => idNumberRef.current?.focus()}
                      blurOnSubmit={false}
                      error={regErrors.fullName}
                    />

                    <GlassInput
                      ref={idNumberRef}
                      icon={<IdCardIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                      placeholder="Student / Employee ID"
                      value={idNumber}
                      onChangeText={(t) => {
                        setIdNumber(t);
                        if (regErrors.idNumber) setRegErrors((e) => ({ ...e, idNumber: "" }));
                      }}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      blurOnSubmit={false}
                      error={regErrors.idNumber}
                    />

                    <GlassInput
                      ref={emailRef}
                      icon={<MailIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                      placeholder="Email address"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (regErrors.email) setRegErrors((e) => ({ ...e, email: "" }));
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => usernameRef.current?.focus()}
                      blurOnSubmit={false}
                      error={regErrors.email}
                    />

                    <GlassInput
                      ref={usernameRef}
                      icon={<UserIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                      placeholder="Username"
                      value={username}
                      onChangeText={(t) => {
                        setUsername(t);
                        if (regErrors.username) setRegErrors((e) => ({ ...e, username: "" }));
                      }}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => regPasswordRef.current?.focus()}
                      blurOnSubmit={false}
                      error={regErrors.username}
                    />

                    <GlassInput
                      ref={regPasswordRef}
                      icon={<LockIcon color="rgba(255, 255, 255, 0.85)" size={18} />}
                      placeholder="Password (min 8 characters)"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
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
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (regErrors.confirmPassword) setRegErrors((e) => ({ ...e, confirmPassword: "" }));
                      }}
                      secureTextEntry
                      showPasswordToggle
                      returnKeyType="done"
                      onSubmitEditing={handleCreateAccount}
                      error={regErrors.confirmPassword}
                    />

                    <TouchableOpacity
                      onPress={handleCreateAccount}
                      disabled={regLoading}
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

                    {/* Switcher */}
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
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

// ── Welcome Background ───────────────────────────────────────────────────────

const WelcomeBackground = memo(function WelcomeBackground({ bgBlurAnim }: { bgBlurAnim: Animated.Value }) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
      <Image
        source={require("../../assets/images/auth-bg.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          "rgba(20, 60, 140, 0.40)",
          "rgba(12, 36, 88, 0.70)",
          "rgba(8, 24, 60, 0.92)",
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(6, 18, 48, 0.60)",
            opacity: bgBlurAnim,
          },
        ]}
      />
    </View>
  );
});

// ── Welcome ──────────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigate, setUser, loadUserData }: NavProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Responsive calculations
  const logoSize = Math.min(width * 0.40, height < 700 ? 120 : 150);
  const wordmarkSize = width < 380 || height < 700 ? 50 : 60;
  const taglineSize = width < 380 ? 14 : 16;

  // Modal State & Background Blur Animation
  const [authMode, setAuthMode] = useState<"signin" | "create_account" | null>(null);
  const bgBlurAnim = useRef(new Animated.Value(0)).current;

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
    });
  }, [bgBlurAnim]);

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

  const handleRegisterSuccess = useCallback((userEmail: string, userName: string, accessToken: string, idNumber: string, fullName: string) => {
    if (setUser) {
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
    if (accessToken) {
      AsyncStorage.setItem("@cura_access_token", accessToken).catch(() => {});
    }
    if (loadUserData) {
      loadUserData(userEmail);
    }
    closeAuthModal();
    navigate("onboard-personal");
  }, [setUser, loadUserData, navigate, closeAuthModal]);

  return (
    <View style={{ flex: 1, backgroundColor: "#08183C" }}>
      {/* 1) Top Section with Campus Background Photo */}
      <View style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <WelcomeBackground bgBlurAnim={bgBlurAnim} />

        {/* 2) Header (Top-left) */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../assets/images/ua-seal.png")}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            resizeMode="contain"
          />
          <View
            style={{
              width: 1,
              height: 38,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              marginHorizontal: 14,
            }}
          />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: "500",
              letterSpacing: 0.5,
              fontFamily: "Outfit",
            }}
          >
            University Clinic
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
          {/* CURA Shield Logo Icon */}
          <Image
            source={require("../../assets/images/cura-logo.png")}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
            fadeDuration={0}
          />

          {/* CURA Wordmark (CU in #4FC3F7, RA in #FFFFFF) */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Text
              style={{
                color: "#4FC3F7",
                fontSize: wordmarkSize,
                fontWeight: "800",
                letterSpacing: 1.5,
                fontFamily: "Outfit",
              }}
            >
              CU
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: wordmarkSize,
                fontWeight: "800",
                letterSpacing: 1.5,
                fontFamily: "Outfit",
              }}
            >
              RA
            </Text>
          </View>

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
              textShadowColor: "rgba(0, 0, 0, 0.35)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            Your personal health companion for smarter, simpler campus care.
          </Text>
        </View>
      </View>

      {/* 4) Bottom Sheet */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingTop: 28,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 20) + 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* Primary: Sign In Button */}
        <TouchableOpacity
          onPress={() => openAuthModal("signin")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 16,
            backgroundColor: "#1E4FD8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            shadowColor: "#1E4FD8",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
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

        {/* Secondary: Create Account Button */}
        <TouchableOpacity
          onPress={() => openAuthModal("create_account")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            borderWidth: 1.5,
            borderColor: "#1E4FD8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginTop: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <PencilIcon color="#1E4FD8" size={20} />
            <Text
              style={{
                marginLeft: 12,
                color: "#1E4FD8",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "Outfit",
              }}
            >
              Create Account
            </Text>
          </View>
          <ArrowRightIcon color="#1E4FD8" size={20} />
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
            University of the Assumption
          </Text>
        </View>
      </View>

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

  const mockGoogleSignIn = async () => {
    setLoading(true);
    if (loadUserData) {
      await loadUserData("jdelacruz.student@ua.edu.ph"); // Using a sample email for mock
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

        <Input
          label="Email address"
          placeholder="you@university.edu"
          value={email}
          onChangeText={(val) => { setError(""); setEmail(val); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

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

// ── Register ──────────────────────────────────────────────────────────────────

export function RegisterScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 4 is OTP
  const [form, setForm] = useState({ email: "", role: "outsider", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const API_BASE = "https://cura-backend-dvj5.onrender.com/api/auth";

  const mockGoogleSignIn = async () => {
    setLoading(true);
    if (loadUserData) {
      await loadUserData("jdelacruz.student@ua.edu.ph"); // Using a sample email for mock
    }
    setLoading(false);
    navigate("home");
  };

  const isUAEmail = (email: string) => email.toLowerCase().endsWith("@ua.edu.ph");

  const handleNextStep1 = async () => {
    const cleanEmail = form.email.trim();
    if (!cleanEmail) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(cleanEmail)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    setErrors({});
    
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${API_BASE}/check-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      
      const resText = await res.text();
      let data: any = {};
      try { data = resText ? JSON.parse(resText) : {}; } catch {}
      
      if (data.exists) {
        if (data.claimed) {
          showAlert("Error", "This account has already been claimed! Please use Sign In instead.");
          setLoading(false);
          return;
        }
        // Patient exists, trigger OTP
        await fetchWithRetry(`${API_BASE}/request-otp/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        }).catch(() => {});
        setIsLinking(true);
        setStep(4); // Go to OTP
      } else {
        // New patient, continue standard registration
        setIsLinking(false);
        setStep(3); // Skip straight to password (category inferred automatically)
      }
    } catch (err) {
      console.warn("API Error:", err);
      showAlert("Error", "Cannot connect to backend! Please make sure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const validateFinal = () => {
    const e: Record<string, string> = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters required";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.trim();
    const cleanEmail = form.email.trim();
    if (cleanOtp.length !== 6) { setErrors({ otp: "Enter a 6-digit OTP" }); return; }
    setLoading(true);
    setErrors({});
    try {
      const res = await fetchWithRetry(`${API_BASE}/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      
      if (res.ok) {
        setStep(3); // OTP verified, go to set password
      } else {
        showAlert("Error", "Invalid OTP.");
      }
    } catch (err) {
      console.warn("OTP Network Error:", err);
      showAlert("Error", "Network Error: Could not verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const e = validateFinal();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const cleanEmail = form.email.trim();

    if (isLinking) {
      try {
        const res = await fetchWithRetry(`${API_BASE}/set-password/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: form.password }),
        });
        
        const resText = await res.text();
        let data: any = {};
        try { data = resText ? JSON.parse(resText) : {}; } catch {}
        
        if (res.ok || data.error?.includes("Email not verified")) {
          const userEmail = data.user?.email || cleanEmail;
          const userName = (data.user?.name || userEmail.split('@')[0]).toUpperCase();
          if (setUser) {
            setUser((prev: any) => ({ ...prev, email: userEmail, firstName: userName, displayName: userName, lastName: '', accessToken: data.access || data.refresh }));
          }
          if (loadUserData) {
            await loadUserData(userEmail);
          }
          navigate("home");
        } else {
          throw new Error("Trigger Fallback Login");
        }
      } catch (err) {
        console.warn("Set Password Error, attempting fallback login...");
        try {
          const loginRes = await fetchWithRetry(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: cleanEmail, password: form.password }),
          });
          
          const loginText = await loginRes.text();
          let loginData: any = {};
          try { loginData = loginText ? JSON.parse(loginText) : {}; } catch {}

          if (loginRes.ok) {
            const userEmail = loginData.user?.email || cleanEmail;
            const userName = (loginData.user?.name || userEmail.split('@')[0]).toUpperCase();
            if (setUser) {
              setUser((prev: any) => ({ ...prev, email: userEmail, firstName: userName, displayName: userName, lastName: '', accessToken: loginData.access }));
            }
            if (loadUserData) {
              await loadUserData(userEmail);
            }
            navigate("home");
          } else {
            setErrors({ password: "Network error or account could not be claimed. Please check your connection." });
          }
        } catch (fallbackErr) {
          console.warn("Fallback login failed:", fallbackErr);
          setErrors({ password: "Network error. Please check your internet connection and try again." });
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetchWithRetry(`${API_BASE}/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: form.password, role: form.role }),
        });
        
        const resText = await res.text();
        let data: any = {};
        try { data = resText ? JSON.parse(resText) : {}; } catch {}

        if (res.ok) {
          const userEmail = data.user?.email || form.email;
          const userName = (data.user?.name || userEmail.split('@')[0]).toUpperCase();
          const token = data.access || data.token;
          if (token) {
            await AsyncStorage.setItem('@cura_access_token', token).catch(() => {});
          }
          if (setUser) {
            setUser((prev: any) => ({
              ...prev,
              email: userEmail,
              firstName: userName,
              displayName: userName,
              lastName: '',
              category: (form.role || 'outsider').toLowerCase(),
              accessToken: token
            }));
          }
          if (loadUserData) {
            await loadUserData(userEmail);
          }
          if (data.user?.is_new) {
            navigate("onboard-personal");
          } else {
            navigate("home");
          }
        } else {
          showAlert("Error", data.error || data.detail || "Failed to create account. Please try again.");
        }
      } catch (err) {
        console.warn("Register Network Error:", err);
        showAlert("Error", "Network Error: Could not create account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const strength = form.password.length >= 16 ? 3 : form.password.length >= 12 ? 2 : form.password.length >= 8 ? 1 : 0;
  const strengthLabel = ["", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#F59E0B", "#0994E8", "#10B981"][strength];
  
  const handleBack = () => {
    if (step === 3) {
      setStep(1);
    } else {
      goBack();
    }
  };

  return (
    <View className="flex-1 bg-[#E4F4FB]">
      <View className="px-6 pb-6" style={{ paddingTop: Math.max(insets.top, 24) + 16 }}>
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-white items-center justify-center mb-5 shadow-sm"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2136" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6"/>
          </Svg>
        </Pressable>
        <Text className="text-[28px] font-black text-slate-800 mb-2 tracking-tight" style={{ fontFamily: "Outfit" }}>
          {step === 1 ? "Create your account ✨" : step === 4 ? "Verify your email 📬" : "Almost done 🔒"}
        </Text>
        <Text className="text-base font-medium text-slate-500">
          {step === 1 ? "Join CURA — University Clinic Patient Portal" : step === 4 ? "An account with this email already exists. Enter the OTP sent to your email to claim it." : "Secure your account with a password"}
        </Text>
      </View>

      <View className="flex-1 bg-[#F8FAFC] rounded-t-[40px] overflow-hidden" style={{ elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 24 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
          {step === 1 && (
          <View className="gap-4">
            <Input
              label="Email address"
              placeholder="you@domain.com or you@ua.edu.ph"
              value={form.email}
              error={errors.email}
              onChangeText={(val) => setForm((f) => ({ ...f, email: val }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button fullWidth onPress={handleNextStep1} loading={loading} className="mt-2">
              Continue
            </Button>

            <View className="flex-row items-center gap-3 my-2">
              <View className="flex-1 h-px bg-sky-100" />
              <Text className="text-xs text-slate-300 font-medium">or</Text>
              <View className="flex-1 h-px bg-sky-100" />
            </View>

            <Button fullWidth variant="secondary" onPress={mockGoogleSignIn}>
               <Text className="text-cura-500 font-bold">Continue with Google (Mock)</Text>
            </Button>

            <View className="flex-row justify-center items-center py-4">
              <Text className="text-sm text-slate-400">Already registered? </Text>
              <Pressable onPress={() => navigate("login")}>
                <Text className="text-sm text-cura-500 font-bold">Sign in</Text>
              </Pressable>
            </View>
          </View>
        )}


        {step === 4 && (
          <View className="gap-6">
            <View className="bg-sky-50 rounded-xl p-4 border border-sky-100 flex-row gap-3">
              <Text className="text-2xl">ℹ️</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-sky-900 mb-1">Account Found</Text>
                <Text className="text-xs text-sky-700 leading-relaxed">
                  We found an existing patient record for <Text className="font-bold">{form.email}</Text>. 
                  Check your terminal/console for the MOCK OTP.
                </Text>
              </View>
            </View>

            <Input
              label="6-Digit OTP"
              placeholder="000000"
              value={otp}
              error={errors.otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Button fullWidth onPress={handleVerifyOTP} loading={loading}>
              Verify OTP
            </Button>
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <View className="mb-2 bg-sky-50 p-3 rounded-xl border border-sky-100 flex-row items-center gap-3">
               <Text className="text-2xl">👋</Text>
               <View>
                 <Text className="text-xs text-slate-500 font-medium">
                   {isLinking ? "Claiming Account" : "Registering Account"}
                 </Text>
                 <Text className="text-sm font-bold text-sky-900">{form.email}</Text>
               </View>
            </View>

            <View className="flex-col gap-1.5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  secureTextEntry={!showPass}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#CBD5E1"
                  value={form.password}
                  onChangeText={(val) => setForm((f) => ({ ...f, password: val }))}
                  className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-slate-800 pr-12 ${errors.password ? "border-rose-300 bg-rose-50" : "border-sky-200"}`}
                />
                <Pressable onPress={() => setShowPass(!showPass)} className="absolute right-4 p-2">
                  <Svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></Svg>
                </Pressable>
              </View>
              {errors.password ? <Text className="text-xs text-rose-500">{errors.password}</Text> : null}
              {form.password.length > 0 && (
                <View className="flex-row items-center gap-2 mt-0.5">
                  <View className="flex-row gap-1 flex-1">
                    {[1,2,3].map((i) => (
                      <View key={i} className="flex-1 h-1.5 rounded-full"
                        style={{ backgroundColor: strength >= i ? strengthColor : "#E0F2FE" }} />
                    ))}
                  </View>
                  <Text className="text-[11px] font-semibold" style={{ color: strengthColor }}>{strengthLabel}</Text>
                </View>
              )}
            </View>

            <Input
              label="Confirm password"
              placeholder="Repeat password"
              value={form.confirm}
              error={errors.confirm}
              onChangeText={(val) => setForm((f) => ({ ...f, confirm: val }))}
              secureTextEntry={!showPass}
            />

            <View className="bg-sky-50 rounded-xl p-3 border border-sky-100 mt-2">
              <Text className="text-xs text-slate-400 leading-relaxed">
                By creating an account, you agree to CURA's{" "}
                <Text className="text-cura-500 font-semibold">Privacy Policy</Text> and{" "}
                <Text className="text-cura-500 font-semibold">Terms of Use</Text>.
              </Text>
            </View>

            <Button fullWidth onPress={handleSubmit} loading={loading} className="mt-1">
              {isLinking ? "Claim Account & Sign In" : "Create Account"}
            </Button>
          </View>
        )}
        </ScrollView>
      </View>
    </View>
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

