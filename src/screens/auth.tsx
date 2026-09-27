import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, useWindowDimensions, ActivityIndicator, Platform, KeyboardAvoidingView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Polyline, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
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

// ── Welcome ──────────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigate }: NavProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Proportional sizing based on reference design
  const badgeSize = Math.min(196, Math.max(168, width * 0.46));
  const logoSize = Math.round(badgeSize * 0.86);
  const buttonWidth = Math.min(300, width * 0.74);

  return (
    <View style={{ flex: 1, backgroundColor: "#172454" }}>
      {/* 1. High-Resolution UA Facade & Statue Hero Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.52,
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Image
          source={require("../../assets/images/ua-hero.jpg")}
          style={{
            width: "100%",
            height: "100%",
            marginTop: Math.max(0, insets.top - 6),
          }}
          resizeMode="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(8, 35, 80, 0.66)",
            zIndex: 10,
            elevation: 10,
          }}
          pointerEvents="none"
        />
      </View>

      {/* 2. Vector Arch Divider & Decorative Swooshes */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 414 896"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <SvgLinearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4A75BC" />
            <Stop offset="0.35" stopColor="#2E4F98" />
            <Stop offset="0.7" stopColor="#1E3372" />
            <Stop offset="1" stopColor="#172454" />
          </SvgLinearGradient>
        </Defs>

        {/* Blue background body covering from curve down to bottom */}
        <Path
          d="M -5 266 C 31.4 328.1 65.7 390.7 100.3 430.1 C 134.9 470.9 169.7 488.5 204.8 490.3 C 239.9 490.0 275.1 473.8 310.7 433.1 C 346.3 393.7 382.2 329.8 420 266 L 420 900 L -5 900 Z"
          fill="url(#blueGrad)"
        />

        {/* White arch border curve */}
        <Path
          d="M -5 266 C 31.4 328.1 65.7 390.7 100.3 430.1 C 134.9 470.9 169.7 488.5 204.8 490.3 C 239.9 490.0 275.1 473.8 310.7 433.1 C 346.3 393.7 382.2 329.8 420 266"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={4.5}
        />

        {/* Yellow arch curve */}
        <Path
          d="M -5 271.5 C 31.4 333.6 65.7 396.2 100.3 435.6 C 134.9 476.4 169.7 494.0 204.8 495.8 C 239.9 495.5 275.1 479.3 310.7 438.6 C 346.3 399.2 382.2 335.3 420 271.5"
          fill="none"
          stroke="#FBBF24"
          strokeWidth={4.5}
        />

        {/* Red arch curve */}
        <Path
          d="M -5 277.0 C 31.4 339.1 65.7 401.7 100.3 441.1 C 134.9 481.9 169.7 499.5 204.8 501.3 C 239.9 501.0 275.1 484.8 310.7 444.1 C 346.3 404.7 382.2 340.8 420 277.0"
          fill="none"
          stroke="#EF4444"
          strokeWidth={4.5}
        />
      </Svg>

      {/* 3. Foreground Interactive UI */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
        }}
      >
        {/* Center Branding Section */}
        <View
          style={{
            alignItems: "center",
            marginTop: Math.max(height * 0.49 - badgeSize * 0.52, insets.top + 160),
          }}
        >
          {/* Circular Badge with CURA Logo */}
          <View
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: "#FFFFFF",
              borderWidth: 5,
              borderColor: "#C3DCF4",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image
              source={require("../../assets/images/ribbon-shield.png")}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </View>

          {/* Typography */}
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: Math.min(52, width * 0.125),
              fontWeight: "900",
              letterSpacing: 2,
              textAlign: "center",
              marginTop: 12,
              fontFamily: "Outfit",
            }}
          >
            CURA
          </Text>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: Math.min(23, width * 0.055),
              fontWeight: "700",
              textAlign: "center",
              marginTop: 2,
              letterSpacing: 0.4,
              opacity: 0.95,
            }}
          >
            University Clinic
          </Text>
        </View>

        {/* Buttons Section */}
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginTop: Math.min(38, Math.max(20, height * 0.038)),
            paddingBottom: Math.max(16, insets.bottom + 8),
          }}
        >
          <Pressable
            onPress={() => navigate("register")}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            style={({ pressed }) => ({
              width: buttonWidth,
              height: 56,
              borderRadius: 9999,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.4)",
              backgroundColor: pressed ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)",
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 3,
            })}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={
                  pressed
                    ? ["rgba(255, 255, 255, 0.26)", "rgba(255, 255, 255, 0.14)"]
                    : ["rgba(255, 255, 255, 0.18)", "rgba(255, 255, 255, 0.06)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: 0.6,
                  }}
                >
                  Create Account
                </Text>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigate("login")}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            style={({ pressed }) => ({
              width: buttonWidth,
              height: 56,
              borderRadius: 9999,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.4)",
              backgroundColor: pressed ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)",
              marginTop: 14,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 3,
            })}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={
                  pressed
                    ? ["rgba(255, 255, 255, 0.26)", "rgba(255, 255, 255, 0.14)"]
                    : ["rgba(255, 255, 255, 0.18)", "rgba(255, 255, 255, 0.06)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: 0.6,
                  }}
                >
                  Sign In
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        fill="#FFFFFF"
      />
      <Path
        d="M12.0002 14.5C6.99016 14.5 2.73016 17.86 2.08016 22.5C2.04016 22.78 2.26016 23 2.54016 23H21.4602C21.7402 23 21.9602 22.78 21.9202 22.5C21.2702 17.86 17.0102 14.5 12.0002 14.5Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 11V7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7V11C5.9 11 5 11.9 5 13V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V13C19 11.9 18.1 11 17 11ZM9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V11H9V7ZM12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Path d="M1 1L23 23" />
    </Svg>
  );
}

export function LoginScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("Please fill in both username and password.");
      return;
    }
    setLoading(true);
    try {
      const loginRes = await fetchWithRetry(`https://cura-backend-dvj5.onrender.com/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password }),
      });

      const resText = await loginRes.text();
      let loginData: any = {};
      try {
        loginData = resText ? JSON.parse(resText) : {};
      } catch {}

      if (loginRes.ok) {
        const userEmail = loginData.user?.email || username.trim();
        const userName = (loginData.user?.name || userEmail.split("@")[0]).toUpperCase();

        if (setUser) {
          setUser((prev: any) => ({
            ...prev,
            email: userEmail,
            firstName: userName,
            displayName: userName,
            lastName: "",
            accessToken: loginData.access,
          }));
        }
        if (loginData.access) {
          AsyncStorage.setItem("@cura_access_token", loginData.access).catch(() => {});
        }
        if (loadUserData) {
          loadUserData(userEmail);
        }
        navigate("home");
      } else {
        setError(loginData.detail || loginData.error || "Invalid username or password. Please try again.");
      }
    } catch (err: any) {
      console.warn("Login Network Error:", err);
      setError("Network error. Please check your connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = Math.min(340, width * 0.88);

  return (
    <View style={{ flex: 1, backgroundColor: "#061A3A" }}>
      {/* 1. Actual Campus Statue Background Image */}
      <Image
        source={require("../../assets/images/ua-statue-bg.jpg")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* 2. Top Sky-Blue Glow & Subtle Ambient Vignette */}
      <LinearGradient
        colors={[
          "rgba(2, 132, 199, 0.45)",
          "rgba(10, 30, 60, 0.12)",
          "rgba(6, 26, 58, 0.4)",
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Subtle Back Button */}
      {goBack ? (
        <Pressable
          onPress={goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            position: "absolute",
            top: Math.max(insets.top + 8, 20),
            left: 16,
            zIndex: 30,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(255, 255, 255, 0.22)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.4)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            minHeight: "100%",
            justifyContent: "space-between",
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top CURA Brand Logo */}
          <View
            style={{
              alignItems: "center",
              paddingTop: Math.max(insets.top + 16, 32),
              paddingBottom: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../assets/images/cura-c-shield.png")}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontSize: 46,
                  fontWeight: "900",
                  color: "#67E8F9",
                  letterSpacing: 1.5,
                  marginLeft: 3,
                  fontFamily: "Outfit",
                  textShadowColor: "rgba(34, 211, 238, 0.8)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 18,
                }}
              >
                URA
              </Text>
            </View>
          </View>

          {/* Middle: Glassmorphism Login Panel */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={[
                {
                  width: cardWidth,
                  borderRadius: 30,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.55)",
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  paddingHorizontal: 20,
                  paddingTop: 24,
                  paddingBottom: 24,
                  shadowColor: "#38BDF8",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 8,
                  overflow: "hidden",
                },
                Platform.OS === "web"
                  ? ({ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } as any)
                  : null,
              ]}
            >
              {/* Subtle glass reflection highlight */}
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.22)", "rgba(255, 255, 255, 0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: "#FFFFFF",
                  letterSpacing: 2,
                  textAlign: "center",
                  fontFamily: "Outfit",
                  marginBottom: 18,
                  textShadowColor: "rgba(0, 0, 0, 0.35)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 6,
                }}
              >
                LOGIN
              </Text>

              {/* Username Input */}
              <View
                style={{
                  height: 50,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                }}
              >
                <UserIcon />
                <TextInput
                  value={username}
                  onChangeText={(val) => {
                    setError("");
                    setUsername(val);
                  }}
                  placeholder="Username"
                  placeholderTextColor="rgba(255, 255, 255, 0.75)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "500",
                    marginLeft: 10,
                    paddingVertical: 0,
                  }}
                />
              </View>

              {/* Password Input */}
              <View
                style={{
                  height: 50,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  marginTop: 12,
                }}
              >
                <LockIcon />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setError("");
                    setPassword(val);
                  }}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.75)"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "500",
                    marginLeft: 10,
                    paddingVertical: 0,
                  }}
                />
                <Pressable
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeIcon /> : <EyeOffIcon />}
                </Pressable>
              </View>

              {/* Error Message */}
              {error ? (
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.35)",
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600", flex: 1 }}>
                    ⚠️ {error}
                  </Text>
                </View>
              ) : null}

              {/* Prominent Login Button Directly Below Password */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Login"
                style={({ pressed }) => ({
                  height: 50,
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  shadowColor: "#007FFF",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.6,
                  shadowRadius: 14,
                  elevation: 6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                {({ pressed }) => (
                  <LinearGradient
                    colors={
                      pressed
                        ? ["#006FE6", "#0047BA"]
                        : ["#0086FF", "#0055D4"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      flex: 1,
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 18,
                          fontWeight: "800",
                          letterSpacing: 0.5,
                        }}
                      >
                        Login  →
                      </Text>
                    )}
                  </LinearGradient>
                )}
              </Pressable>
            </View>
          </View>

          {/* Bottom Blue Curved University Clinic Section */}
          <View style={{ width: "100%", alignItems: "center" }}>
            <View style={{ width: "100%", position: "relative" }}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 400 240"
                preserveAspectRatio="none"
                style={StyleSheet.absoluteFill}
              >
                <Defs>
                  <SvgLinearGradient id="clinicBottomGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#0B4B9A" />
                    <Stop offset="0.5" stopColor="#073B80" />
                    <Stop offset="1" stopColor="#04275E" />
                  </SvgLinearGradient>
                </Defs>
                {/* Curved Dome Body */}
                <Path
                  d="M 0 45 Q 200 -5 400 45 L 400 240 L 0 240 Z"
                  fill="url(#clinicBottomGrad)"
                />
                {/* Glowing Top Cyan Border */}
                <Path
                  d="M 0 45 Q 200 -5 400 45"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                />
              </Svg>

              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  paddingTop: 36,
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                  paddingHorizontal: 20,
                }}
              >
                {/* University of the Assumption logo + University Clinic */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={require("../../assets/images/ua-assumption-logo.png")}
                    style={{ width: 42, height: 42 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 22,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                      marginLeft: 10,
                      fontFamily: "Outfit",
                    }}
                  >
                    University Clinic
                  </Text>
                </View>

                {/* Subtitle */}
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.92)",
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: "500",
                    textAlign: "center",
                    maxWidth: 310,
                    marginTop: 8,
                  }}
                >
                  Your personal health companion for smarter, simpler campus care.
                </Text>

                {/* Create Account Button */}
                <Pressable
                  onPress={() => navigate("register")}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                  style={({ pressed }) => ({
                    width: "100%",
                    maxWidth: 290,
                    height: 50,
                    borderRadius: 22,
                    overflow: "hidden",
                    borderWidth: 1.5,
                    borderColor: "rgba(255, 255, 255, 0.55)",
                    backgroundColor: pressed ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)",
                    marginTop: 16,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: "#38BDF8",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    elevation: 3,
                  })}
                >
                  {({ pressed }) => (
                    <LinearGradient
                      colors={
                        pressed
                          ? ["rgba(255, 255, 255, 0.28)", "rgba(255, 255, 255, 0.12)"]
                          : ["rgba(255, 255, 255, 0.18)", "rgba(255, 255, 255, 0.05)"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 18,
                          fontWeight: "800",
                          letterSpacing: 0.5,
                        }}
                      >
                        Create Account
                      </Text>
                    </LinearGradient>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

