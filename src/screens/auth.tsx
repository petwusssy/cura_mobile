import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, useWindowDimensions, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
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

        {/* Soft light-cyan arch border curve */}
        <Path
          d="M -5 266 C 31.4 328.1 65.7 390.7 100.3 430.1 C 134.9 470.9 169.7 488.5 204.8 490.3 C 239.9 490.0 275.1 473.8 310.7 433.1 C 346.3 393.7 382.2 329.8 420 266"
          fill="none"
          stroke="#DCEBF8"
          strokeWidth={4.5}
        />

        {/* Left Bottom Swoosh */}
        <Path
          d="M 47.0 705.0 C 11.2 748.7 7.8 780.3 20.5 799.1 C 33.2 818.5 62.0 825.1 93.2 831.7 C 124.5 838.3 158.4 845.0 185.8 865.4 C 213.6 885.5 235.0 919.3 248.0 969.6 C 208.1 942.8 181.9 1003.1 162.0 1056.5 C 75.0 1023.0 -12.1 989.4 -99.2 955.9 C -90.0 928.6 -77.6 901.6 -63.2 864.9 C -46.6 827.9 -27.8 781.0 47.0 705.0 Z"
          fill="#17234A"
        />
        <Path
          d="M 43.0 706.0 C 7.2 749.7 3.8 781.3 16.5 800.1 C 29.2 819.5 58.0 826.1 89.2 832.7 C 120.5 839.3 154.4 846.0 181.8 866.4 C 209.6 886.5 231.0 920.3 244.0 970.6 C 204.1 943.8 177.9 1004.1 158.0 1057.5 C 71.0 1024.0 -16.1 990.4 -103.2 956.9 C -94.0 929.6 -81.6 902.6 -67.2 865.9 C -50.6 828.9 -31.8 782.0 43.0 706.0 Z"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          fill="#3A55C8"
        />

        {/* Right Bottom Swoosh */}
        <Path
          d="M 355.0 750.0 C 378.2 737.9 389.7 746.1 396.0 756.5 C 402.1 767.6 402.9 780.9 398.9 793.3 C 391.4 818.4 366.2 839.0 336.4 859.4 C 306.7 879.9 272.0 899.0 249.8 922.5 C 238.5 934.3 230.5 947.6 225.5 964.4 C 223.0 972.8 221.3 982.1 220.3 992.5 C 219.7 997.7 219.4 1003.1 219.2 1008.9 L 550 1089 L 550 750 Z"
          fill="#17234A"
        />
        <Path
          d="M 359.0 749.0 C 382.2 736.9 393.7 745.1 400.0 755.5 C 406.1 766.6 406.9 779.9 402.9 792.3 C 395.4 817.4 370.2 838.0 340.4 858.4 C 310.7 878.9 276.0 898.0 253.8 921.5 C 242.5 933.3 234.5 946.6 229.5 963.4 C 227.0 971.8 225.3 981.1 224.3 991.5 C 223.7 996.7 223.4 1002.1 223.2 1007.9 L 553 1086 L 553 749 Z"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          fill="#3A55C8"
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
            marginTop: Math.max(height * 0.51 - badgeSize * 0.52, insets.top + 190),
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
              fontSize: Math.min(46, width * 0.11),
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
              fontSize: Math.min(20, width * 0.048),
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

        {/* Buttons Section - Shifted upward to remove the huge gap */}
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginTop: Math.min(46, Math.max(28, height * 0.045)),
          }}
        >
          <Pressable
            onPress={() => navigate("register")}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            style={({ pressed }) => ({
              width: buttonWidth,
              height: 54,
              borderRadius: 27,
              backgroundColor: "#17234D",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.6,
              }}
            >
              Create Account
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigate("login")}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            hitSlop={12}
            style={({ pressed }) => ({
              marginTop: 22,
              paddingVertical: 10,
              paddingHorizontal: 24,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.6,
              }}
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

export function LoginScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const inputWidth = Math.min(324, width * 0.82);
  const heroHeight = Math.round(height * 0.28);
  const badgeSize = Math.min(124, Math.max(112, width * 0.30));
  const logoImgSize = Math.round(badgeSize * 0.58);

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
        setError(loginData.detail || loginData.error || "Invalid username or password. Please try again.");
      }
    } catch (err: any) {
      console.warn("Login Network Error:", err);
      setError("Network error. Please check your connection or try again in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#101F42" }}>
      {/* 1. UA Building & Statue Hero Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: heroHeight + 35,
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
      </View>

      {/* 2. Vector Arch Divider & Decorative Accents */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 414 896"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <SvgLinearGradient id="loginBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14244E" />
            <Stop offset="0.4" stopColor="#101F42" />
            <Stop offset="1" stopColor="#0B1632" />
          </SvgLinearGradient>
        </Defs>

        {/* Dark blue body covering below the arch curve */}
        <Path
          d="M -5 130 C 50 165, 120 220, 207 220 C 294 220, 364 165, 420 130 L 420 900 L -5 900 Z"
          fill="url(#loginBodyGrad)"
        />

        {/* Soft light-cyan arch border curve */}
        <Path
          d="M -5 130 C 50 165, 120 220, 207 220 C 294 220, 364 165, 420 130"
          fill="none"
          stroke="#54B1EB"
          strokeWidth={5}
        />

        {/* Crisp white arch border curve */}
        <Path
          d="M -5 130 C 50 165, 120 220, 207 220 C 294 220, 364 165, 420 130"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
        />

        {/* Left Bottom Swoosh */}
        <Path
          d="M -10 820 C 30 830, 80 855, 120 890 L -10 900 Z"
          fill="#17234A"
        />
        <Path
          d="M -20 810 C 25 825, 75 850, 135 885"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          fill="none"
        />
        <Path
          d="M -20 820 C 30 835, 80 860, 140 895"
          stroke="#38A2ED"
          strokeWidth={3}
          fill="none"
          opacity={0.7}
        />

        {/* Bottom Right CURA Watermark */}
        <Circle cx="390" cy="850" r="90" stroke="#182A54" strokeWidth="18" fill="none" opacity={0.65} />
        <Circle cx="390" cy="850" r="62" stroke="#182A54" strokeWidth="6" fill="none" opacity={0.45} />
        <Path
          d="M 374 850 L 406 850 M 390 834 L 390 866"
          stroke="#1B2F5C"
          strokeWidth="16"
          strokeLinecap="round"
          opacity={0.6}
        />
      </Svg>

      {/* 3. Top Back Button */}
      <Pressable
        onPress={goBack}
        style={{
          position: "absolute",
          top: Math.max(insets.top, 16) + 6,
          left: 18,
          zIndex: 20,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="15 18 9 12 15 6" />
        </Svg>
      </Pressable>

      {/* 4. Scrollable Form Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            paddingTop: heroHeight - badgeSize * 0.44,
            paddingBottom: Math.max(insets.bottom + 20, 32),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Circular Badge with CURA Logo */}
          <View
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: "#FFFFFF",
              borderWidth: 4.5,
              borderColor: "#54B1EB",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image
              source={require("../../assets/images/cura-logo.png")}
              style={{ width: logoImgSize, height: logoImgSize }}
              resizeMode="contain"
            />
            <Text
              style={{
                color: "#101F42",
                fontSize: 15,
                fontWeight: "900",
                fontFamily: "Outfit",
                letterSpacing: 1.5,
                marginTop: 1,
              }}
            >
              CURA
            </Text>
          </View>

          {/* Typography */}
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 34,
              fontWeight: "900",
              letterSpacing: 2.5,
              textAlign: "center",
              marginTop: 10,
              fontFamily: "Outfit",
            }}
          >
            CURA
          </Text>

          <Text
            style={{
              color: "#9CBEE2",
              fontSize: 10.5,
              fontWeight: "700",
              letterSpacing: 1.8,
              textAlign: "center",
              marginTop: 2,
            }}
          >
            YOUR WELL-BEING. OUR PRIORITY.
          </Text>

          {/* Error Message */}
          {error ? (
            <View
              style={{
                width: inputWidth,
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "rgba(244, 63, 94, 0.18)",
                borderColor: "#F43F5E",
                borderWidth: 1,
                borderRadius: 18,
              }}
            >
              <Text style={{ color: "#FECDD3", fontSize: 12, textAlign: "center" }}>
                ⚠️ {error}
              </Text>
            </View>
          ) : null}

          {/* Input 1: Username or Student ID */}
          <View
            style={{
              width: inputWidth,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#EAF1F8",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              marginTop: 18,
            }}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101F42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <Circle cx="12" cy="7" r="4" />
            </Svg>
            <TextInput
              value={email}
              onChangeText={(val) => { setError(""); setEmail(val); }}
              placeholder="Username or Student ID"
              placeholderTextColor="#7E93AA"
              autoCapitalize="none"
              style={{
                flex: 1,
                fontSize: 14,
                color: "#101F42",
                paddingHorizontal: 12,
                fontWeight: "500",
              }}
            />
          </View>

          {/* Input 2: Password */}
          <View
            style={{
              width: inputWidth,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#EAF1F8",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              marginTop: 12,
            }}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101F42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </Svg>
            <TextInput
              value={password}
              onChangeText={(val) => { setError(""); setPassword(val); }}
              placeholder="Password"
              placeholderTextColor="#7E93AA"
              secureTextEntry={!showPass}
              style={{
                flex: 1,
                fontSize: 14,
                color: "#101F42",
                paddingHorizontal: 12,
                fontWeight: "500",
              }}
            />
            <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
              {showPass ? (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E93AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx="12" cy="12" r="3" />
                </Svg>
              ) : (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E93AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <Line x1="1" y1="1" x2="23" y2="23" />
                </Svg>
              )}
            </Pressable>
          </View>

          {/* Primary Action Button: LOG IN → */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Log In"
            style={({ pressed }) => ({
              width: inputWidth,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#38A2ED",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 18,
              opacity: pressed || loading ? 0.85 : 1,
              shadowColor: "#38A2ED",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 5,
            })}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: 1.5,
                  }}
                >
                  LOG IN
                </Text>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12h14" />
                  <Polyline points="12 5 19 12 12 19" />
                </Svg>
              </>
            )}
          </Pressable>

          {/* Divider: ── OR ── */}
          <View
            style={{
              width: inputWidth,
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.16)" }} />
            <Text
              style={{
                color: "#7B98BC",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
                marginHorizontal: 14,
              }}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.16)" }} />
          </View>

          {/* Secondary Action Button: CREATE ACCOUNT */}
          <Pressable
            onPress={() => navigate("register")}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            style={({ pressed }) => ({
              width: inputWidth,
              height: 52,
              borderRadius: 26,
              backgroundColor: "transparent",
              borderWidth: 1.5,
              borderColor: "#4EA8DE",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
                letterSpacing: 1.2,
              }}
            >
              CREATE ACCOUNT
            </Text>
          </Pressable>

          {/* Footer Tagline */}
          <View style={{ marginTop: 28, alignItems: "center" }}>
            <Text
              style={{
                color: "#5F7E9F",
                fontSize: 10.5,
                fontWeight: "600",
                letterSpacing: 1.8,
                textAlign: "center",
              }}
            >
              BUILDING A HEALTHIER
            </Text>
            <Text
              style={{
                color: "#5F7E9F",
                fontSize: 10.5,
                fontWeight: "600",
                letterSpacing: 1.8,
                textAlign: "center",
                marginTop: 2,
              }}
            >
              TOMORROW, TOGETHER.
            </Text>
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

