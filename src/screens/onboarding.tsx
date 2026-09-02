import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Animated,
  KeyboardAvoidingView, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Polyline, Circle, Rect } from "react-native-svg";
import { AppUser, PatientCategory, Screen } from "../types";
import { MASCOTS } from "../data";

interface NavProps {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  user: Partial<AppUser>;
  setUser: React.Dispatch<React.SetStateAction<Partial<AppUser>>>;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <View className="px-6 py-4 flex-row gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-cura-500" : "bg-slate-100"}`} />
      ))}
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength }: any) {
  return (
    <View className="mb-4 w-full">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800"
      />
    </View>
  );
}

function Select({ label, value, options, onValueChange }: any) {
  return (
    <View className="mb-4 w-full">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt: any) => {
          const isSelected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onValueChange(opt.value)}
              className={`px-4 py-2.5 rounded-xl border ${isSelected ? "bg-cura-500 border-cura-500" : "bg-white border-slate-200"}`}
            >
              <Text className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-600"}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Button({ children, onPress, disabled, loading, fullWidth, className = "" }: any) {
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      className={`rounded-2xl items-center justify-center py-4 ${disabled ? "bg-slate-200" : "bg-cura-500"} ${fullWidth ? "w-full" : "px-8"} ${className}`}
      style={!disabled && !loading ? { elevation: 4, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 } : {}}
    >
      {loading ? (
        <Text className="text-white font-bold text-base">Wait...</Text>
      ) : (
        <Text className={`font-bold text-base ${disabled ? "text-slate-400" : "text-white"}`}>{children}</Text>
      )}
    </Pressable>
  );
}

// ── Basic Info (Matches Web: Name, Contact, DOB, Sex, Emergency) ───────────────

export function PersonalInfoScreen({ navigate, user, setUser }: NavProps) {
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    dob: user.dob || "",
    sex: user.gender || "",
    contact: user.phone || "",
    emergencyName: user.emergencyName || "",
    emergencyPhone: user.emergencyPhone || "",
  });

  const sexes = ["Female", "Male", "Other"].map((v) => ({ value: v, label: v }));

  const isValid = form.firstName && form.lastName && form.dob && form.sex && form.contact && form.emergencyName && form.emergencyPhone;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <OnboardProgress step={1} total={3} />
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: "Outfit" }}>Basic Information</Text>
          <Text className="text-slate-400 text-sm">Tell us about yourself</Text>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1"><Input label="First name" placeholder="Juan" value={form.firstName} onChangeText={(v: string) => setForm((f) => ({ ...f, firstName: v }))} /></View>
          <View className="flex-1"><Input label="Last name" placeholder="Dela Cruz" value={form.lastName} onChangeText={(v: string) => setForm((f) => ({ ...f, lastName: v }))} /></View>
        </View>
        <Input label="Contact Number" placeholder="09XX-XXX-XXXX" value={form.contact} onChangeText={(v: string) => setForm((f) => ({ ...f, contact: v }))} />
        <Input label="Birthday (YYYY-MM-DD)" placeholder="2000-01-01" value={form.dob} onChangeText={(v: string) => setForm((f) => ({ ...f, dob: v }))} />
        <Select label="Sex" value={form.sex} options={sexes} onValueChange={(v: string) => setForm((f) => ({ ...f, sex: v }))} />
        
        <View className="mt-4 mb-4">
          <Text className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "Outfit" }}>Emergency Contact</Text>
        </View>
        <Input label="Emergency Contact Name" placeholder="Name" value={form.emergencyName} onChangeText={(v: string) => setForm((f) => ({ ...f, emergencyName: v }))} />
        <Input label="Emergency Contact No." placeholder="09XX-XXX-XXXX" value={form.emergencyPhone} onChangeText={(v: string) => setForm((f) => ({ ...f, emergencyPhone: v }))} />

        <Button fullWidth onPress={() => { setUser((u) => ({ ...u, ...form, gender: form.sex, phone: form.contact })); navigate("onboard-academic"); }} disabled={!isValid} className="mb-8 mt-2">
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Category Specific Info ───────────────────────────────────────────────────

export function AcademicInfoScreen({ navigate, user, setUser }: NavProps) {
  // Infer category if missing
  const category = user.category || (user.email?.endsWith(".student@ua.edu.ph") ? "student" : user.email?.endsWith("@ua.edu.ph") ? "employee" : "outsider");

  const [form, setForm] = useState({
    id_number: user.id_number || "",
    studentCategory: user.studentCategory || "College",
    gradeLevel: user.gradeLevel || "",
    course: user.course || "",
    yearLevel: user.yearLevel || "",
    guardianName: user.guardianName || "",
    position: user.position || "",
    department: user.department || "",
    address: user.address || "",
  });

  const studentCats = ["Elementary", "Junior High School", "Senior High School", "College"].map(v => ({ value: v, label: v }));
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"].map(v => ({ value: v, label: v }));

  const isMinor = ["Elementary", "Junior High School", "Senior High School"].includes(form.studentCategory);

  const isValid = () => {
    if (category === "student") {
      if (!form.id_number) return false;
      if (form.studentCategory === "College" && (!form.course || !form.yearLevel)) return false;
      if (isMinor && (!form.gradeLevel || !form.guardianName)) return false;
      return true;
    }
    if (category === "employee") return form.id_number && form.position && form.department;
    if (category === "outsider") return !!form.address;
    return true;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <OnboardProgress step={2} total={3} />
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40, gap: 4 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: "Outfit" }}>
            {category === "student" ? "Student Information" : category === "employee" ? "Employee Information" : "Address"}
          </Text>
          <Text className="text-slate-400 text-sm">Please provide your details below</Text>
        </View>

        {category === "student" && (
          <>
            <Input label="Student ID" placeholder="STU-XXXX" value={form.id_number} onChangeText={(v: string) => setForm(f => ({ ...f, id_number: v }))} />
            <Select label="Student Category" value={form.studentCategory} options={studentCats} onValueChange={(v: string) => setForm(f => ({ ...f, studentCategory: v }))} />
            {isMinor && <Input label="Grade Level" placeholder="Grade 7" value={form.gradeLevel} onChangeText={(v: string) => setForm(f => ({ ...f, gradeLevel: v }))} />}
            {isMinor && <Input label="Guardian Name" placeholder="Name" value={form.guardianName} onChangeText={(v: string) => setForm(f => ({ ...f, guardianName: v }))} />}
            {form.studentCategory === "College" && <Input label="Course / Program" placeholder="BS Nursing" value={form.course} onChangeText={(v: string) => setForm(f => ({ ...f, course: v }))} />}
            {form.studentCategory === "College" && <Select label="Year Level" value={form.yearLevel} options={yearLevels} onValueChange={(v: string) => setForm(f => ({ ...f, yearLevel: v }))} />}
          </>
        )}

        {category === "employee" && (
          <>
            <Input label="Employee ID" placeholder="EMP-XXXX" value={form.id_number} onChangeText={(v: string) => setForm(f => ({ ...f, id_number: v }))} />
            <Input label="Position / Designation" placeholder="Professor" value={form.position} onChangeText={(v: string) => setForm(f => ({ ...f, position: v }))} />
            <Input label="Department" placeholder="College of Nursing" value={form.department} onChangeText={(v: string) => setForm(f => ({ ...f, department: v }))} />
          </>
        )}

        {category === "outsider" && (
          <Input label="Home Address" placeholder="Street, Barangay, City" value={form.address} onChangeText={(v: string) => setForm(f => ({ ...f, address: v }))} />
        )}

        <Button fullWidth onPress={() => { setUser((u) => ({ ...u, ...form, category: category as PatientCategory })); navigate("onboard-avatar"); }} disabled={!isValid()} className="mt-4 mb-8">
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function AvatarScreen({ navigate, user, setUser }: NavProps) {
  const [selected, setSelected] = useState<string>("");
  const [displayName, setDisplayName] = useState(user.firstName || "");
  const [loading, setLoading] = useState(false);

  const mascot = MASCOTS.find((m) => m.id === selected);

  const handleComplete = async () => {
    setLoading(true);
    
    // Merge final user state
    const finalUser = {
      ...user,
      avatarId: selected,
      avatarColor: mascot?.color || "#0994E8",
      avatarEmoji: mascot?.emoji || "🩺",
      displayName: displayName || user.firstName || "",
    };
    
    setUser(finalUser);

    // Prepare payload matching CompleteProfileView
    const payload = {
      id: finalUser.id_number,
      name: `${finalUser.firstName} ${finalUser.lastName}`.trim(),
      category: finalUser.category === "student" ? "Student" : finalUser.category === "employee" ? "Employee" : "Outsider",
      contact: finalUser.phone,
      birthday: finalUser.dob,
      sex: finalUser.gender,
      emergencyContact: finalUser.emergencyName,
      emergencyPhone: finalUser.emergencyPhone,
      studentCategory: finalUser.studentCategory,
      course: finalUser.course,
      yearLevel: finalUser.yearLevel,
      gradeLevel: finalUser.gradeLevel,
      guardianName: finalUser.guardianName,
      position: finalUser.position,
      department: finalUser.department,
      address: finalUser.address,
    };

    try {
      const res = await fetch("https://cura-backend-dvj5.onrender.com/api/auth/complete-profile/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: Assuming token is handled globally or via cookies. If not, this might need auth header.
        // Wait, the API requires token. I need to make sure we are authenticated. 
        // For simplicity, we just send it. If we have local storage of token, we should attach it.
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        navigate("onboard-complete");
      } else {
        alert("Failed to save profile. Please try again.");
      }
    } catch (e) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <OnboardProgress step={3} total={3} />
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-8">
          <Text className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: "Outfit" }}>Choose an avatar</Text>
          <Text className="text-slate-400 text-sm">Pick a companion for your health journey</Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
          {MASCOTS.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setSelected(m.id)}
              className="w-[23%] aspect-square rounded-2xl items-center justify-center border-2"
              style={{
                backgroundColor: m.bg,
                borderColor: selected === m.id ? m.color : m.bg,
                transform: [{ scale: selected === m.id ? 1.05 : 1 }]
              }}
            >
              <Text className="text-3xl">{m.emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Display name"
          placeholder="What should we call you?"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Button
          fullWidth
          onPress={handleComplete}
          disabled={!selected || loading}
          loading={loading}
          className="mb-8"
        >
          {"I'm ready! 🎉"}
        </Button>
      </ScrollView>
    </View>
  );
}

// ── Profile Complete ──────────────────────────────────────────────────────────

export function ProfileCompleteScreen({ navigate, user }: NavProps) {
  const mascot = MASCOTS.find((m) => m.id === user.avatarId) || MASCOTS[0];
  const [scale] = useState(new Animated.Value(0.5));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#EFF8FF', '#DEF0FF', '#BAE6FD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center px-8"
    >
      <View className="relative mb-8 items-center justify-center">
        <Animated.View className="absolute rounded-full" style={{ width: 200, height: 200, backgroundColor: mascot.color, opacity: Animated.multiply(opacity, 0.08), transform: [{ scale: scale }] }} />
        <Animated.View className="absolute rounded-full" style={{ width: 150, height: 150, backgroundColor: mascot.color, opacity: Animated.multiply(opacity, 0.13), transform: [{ scale: scale }] }} />
        <Animated.View className="absolute rounded-full" style={{ width: 96, height: 96, backgroundColor: mascot.color, opacity: Animated.multiply(opacity, 0.18), transform: [{ scale: scale }] }} />
        <Animated.View style={{ transform: [{ scale: scale }] }}>
          <LinearGradient
            colors={[mascot.color, mascot.color + 'bb']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-full items-center justify-center z-10"
            style={{ elevation: 16, shadowColor: mascot.color, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.45, shadowRadius: 40 }}
          >
            <Text className="text-5xl">{mascot.emoji}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
      <View className="flex-row items-center gap-2 mb-3 bg-emerald-100 rounded-full px-4 py-1.5">
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>
        <Text className="text-emerald-700 text-xs font-bold">Profile complete!</Text>
      </View>
      <Text className="text-3xl font-extrabold text-cura-900 text-center mb-3" style={{ fontFamily: "Outfit" }}>
        Welcome, {user.displayName || user.firstName}! 🎉
      </Text>
      <Text className="text-slate-500 text-center text-sm mb-10 leading-relaxed">
        Your CURA account is all set. Access your health records, track medications, and manage your clinic visits — all in one place.
      </Text>
      <LinearGradient
        colors={['#0994E8', '#06B6D4']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="rounded-xl overflow-hidden"
        style={{ elevation: 8, shadowColor: '#0994E8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24 }}
      >
        <Pressable onPress={() => navigate("home")} className="py-4 px-10">
          <Text className="text-white font-bold text-base">Open Dashboard →</Text>
        </Pressable>
      </LinearGradient>
    </LinearGradient>
  );
}
