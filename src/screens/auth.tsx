import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, useWindowDimensions } from "react-native";
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
              backgroundColor: "#13234D",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.18)",
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
            style={({ pressed }) => ({
              width: buttonWidth,
              height: 54,
              borderRadius: 27,
              backgroundColor: "#C3DCF4",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 14,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <Text
              style={{
                color: "#172454",
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

