import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Polyline } from "react-native-svg";
import { useAlert } from "../components/AlertProvider";
import type { Screen, PatientCategory } from "../types";

const PRIMARY = "#1B3A6B";
const API_URL = "https://cura-backend-dvj5.onrender.com/api";

type CategoryType = "Student" | "Employee" | "Outsider";
type StudentCategoryType = "Elementary" | "Junior High School" | "Senior High School" | "College";

const GRADE_LEVELS: Record<"Elementary" | "Junior High School" | "Senior High School", string[]> = {
  Elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};

const STUDENT_CATEGORIES: StudentCategoryType[] = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"];
const SEX_OPTIONS = ["Female", "Male", "Other"];

interface NavProps {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  setUser?: (val: any) => void;
  loadUserData?: (email: string) => Promise<void>;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ color = "#1B3A6B", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

function ChevronDownIcon({ color = "#64748B", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

function EyeIcon({ open, color = "#64748B", size = 18 }: { open: boolean; color?: string; size?: number }) {
  if (open) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <Circle cx="12" cy="12" r="3" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Path d="M1 1l22 22" />
    </Svg>
  );
}

function CalendarIcon({ color = "#64748B", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function CheckIcon({ color = "#FFFFFF", size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPHPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

function isValidPHPhone(num: string): boolean {
  return /^09\d{2}-\d{3}-\d{4}$/.test(num);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── Dropdown Modal Picker Component ────────────────────────────────────────

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

function DropdownModal({ visible, title, options, selected, onSelect, onClose }: DropdownModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {opt}
                  </Text>
                  {isSelected && (
                    <View style={styles.modalCheckCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Main RegisterScreen Component ──────────────────────────────────────────

export function RegisterScreen({ navigate, goBack, setUser, loadUserData }: NavProps) {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  // Step 1: Category
  const [category, setCategory] = useState<CategoryType>("Student");

  // Step 2: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Basic Information
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState("Female");
  const [contact, setContact] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Step 4: Category-Specific
  // Student
  const [studentId, setStudentId] = useState("");
  const [studentCategory, setStudentCategory] = useState<StudentCategoryType>("College");
  const [gradeLevel, setGradeLevel] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  // Employee
  const [employeeId, setEmployeeId] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");

  // Outsider
  const [address, setAddress] = useState("");

  // Modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Touched state to reveal inline errors
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Reset conditional fields when Student Category changes
  const handleStudentCategoryChange = (newCat: StudentCategoryType) => {
    setStudentCategory(newCat);
    // Reset/hide conditional fields as required
    setGradeLevel("");
    setGuardianName("");
    setCourse("");
    setYearLevel("");
  };

  // ── Validation Errors Calculation ────────────────────────────────────────

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Step 2: Account
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errs.email = "Google account (email) is required";
    } else if (!isValidEmail(cleanEmail)) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match";
    }

    // Step 3: Basic Information
    if (!name.trim()) {
      errs.name = "Full name is required";
    }

    if (!birthday) {
      errs.birthday = "Birthday is required";
    } else {
      const bDate = new Date(birthday);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate > today) {
        errs.birthday = "Birthday cannot be in the future";
      }
    }

    if (!sex) {
      errs.sex = "Sex is required";
    }

    if (!contact.trim()) {
      errs.contact = "Contact number is required";
    } else if (!isValidPHPhone(contact)) {
      errs.contact = "Must be in PH format: 09XX-XXX-XXXX";
    }

    if (!emergencyContact.trim()) {
      errs.emergencyContact = "Emergency contact name is required";
    }

    if (!emergencyPhone.trim()) {
      errs.emergencyPhone = "Emergency contact number is required";
    } else if (!isValidPHPhone(emergencyPhone)) {
      errs.emergencyPhone = "Must be in PH format: 09XX-XXX-XXXX";
    }

    // Step 4: Category-Specific
    if (category === "Student") {
      if (!studentId.trim()) {
        errs.studentId = "Student ID is required";
      }
      if (!studentCategory) {
        errs.studentCategory = "Student category is required";
      }

      if (studentCategory === "College") {
        if (!course.trim()) {
          errs.course = "Course / Program is required";
        }
        if (!yearLevel.trim()) {
          errs.yearLevel = "Year Level is required";
        }
      } else {
        // Elementary, Junior High School, Senior High School
        if (!gradeLevel.trim()) {
          errs.gradeLevel = "Grade level is required";
        }
        if (!guardianName.trim()) {
          errs.guardianName = "Guardian name is required";
        }
      }
    } else if (category === "Employee") {
      if (!employeeId.trim()) {
        errs.employeeId = "Employee ID is required";
      }
      if (!position.trim()) {
        errs.position = "Position / Designation is required";
      }
      if (!department.trim()) {
        errs.department = "Department is required";
      }
    } else if (category === "Outsider") {
      if (!address.trim()) {
        errs.address = "Home address is required";
      }
    }

    return errs;
  }, [
    email,
    password,
    confirmPassword,
    name,
    birthday,
    sex,
    contact,
    emergencyContact,
    emergencyPhone,
    category,
    studentId,
    studentCategory,
    course,
    yearLevel,
    gradeLevel,
    guardianName,
    employeeId,
    position,
    department,
    address,
  ]);

  const isFormValid = Object.keys(errors).length === 0;

  // ── Submit Handler ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSubmitError("");

    // Mark all fields as touched to show any missed inline errors
    const allFields: Record<string, boolean> = {
      email: true,
      password: true,
      confirmPassword: true,
      name: true,
      birthday: true,
      sex: true,
      contact: true,
      emergencyContact: true,
      emergencyPhone: true,
      studentId: true,
      studentCategory: true,
      course: true,
      yearLevel: true,
      gradeLevel: true,
      guardianName: true,
      employeeId: true,
      position: true,
      department: true,
      address: true,
    };
    setTouched(allFields);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim().toUpperCase();
      const selectedId = category === "Student" ? studentId.trim() : category === "Employee" ? employeeId.trim() : "";

      // 1. Call Register API
      const regResponse = await fetch(`${API_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          username: trimmedEmail,
          name: trimmedName,
          id_number: selectedId,
          role: category,
        }),
      });

      const regData = await regResponse.json().catch(() => ({}));

      if (!regResponse.ok && !regData.access) {
        const errorMsg =
          regData.error ||
          regData.detail ||
          (typeof regData === "object" ? Object.values(regData)[0] : "Failed to register account.");
        setSubmitError(String(errorMsg));
        setIsSubmitting(false);
        return;
      }

      const token = regData.access || "";

      // 2. Calculate age from birthday
      const bDate = new Date(birthday);
      const age = Math.max(0, new Date().getFullYear() - bDate.getFullYear());

      // 3. Build category-specific profile payload
      const profilePayload: Record<string, any> = {
        name: trimmedName,
        category: category,
        contact: contact.trim(),
        birthday: birthday,
        age: age,
        sex: sex,
        emergencyContact: emergencyContact.trim().toUpperCase(),
        emergencyPhone: emergencyPhone.trim(),
      };

      if (category === "Student") {
        profilePayload.id = studentId.trim();
        profilePayload.studentCategory = studentCategory;
        if (studentCategory === "College") {
          profilePayload.course = course.trim();
          profilePayload.yearLevel = yearLevel.trim();
        } else {
          profilePayload.gradeLevel = gradeLevel.trim();
          profilePayload.guardianName = guardianName.trim().toUpperCase();
        }
      } else if (category === "Employee") {
        profilePayload.id = employeeId.trim();
        profilePayload.position = position.trim();
        profilePayload.department = department.trim();
      } else if (category === "Outsider") {
        profilePayload.address = address.trim();
      }

      // 4. Update complete profile in backend
      if (token) {
        await fetch(`${API_URL}/auth/complete-profile/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profilePayload),
        }).catch((err) => {
          console.warn("Complete profile warning:", err);
        });
      }

      // 5. Build final AppUser session object
      const assignedId = selectedId || regData.user?.id || `OUT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const finalUser: any = {
        id: assignedId,
        id_number: assignedId,
        name: trimmedName,
        firstName: trimmedName.split(" ")[0] || "",
        lastName: trimmedName.split(" ").slice(1).join(" ") || "",
        displayName: trimmedName,
        email: trimmedEmail,
        phone: contact.trim(),
        dob: birthday,
        gender: sex,
        category: category.toLowerCase() as PatientCategory,
        studentCategory: category === "Student" ? studentCategory : undefined,
        gradeLevel: category === "Student" ? gradeLevel : undefined,
        guardianName: category === "Student" ? guardianName.trim().toUpperCase() : undefined,
        course: category === "Student" ? course.trim() : undefined,
        yearLevel: category === "Student" ? yearLevel : undefined,
        position: category === "Employee" ? position.trim() : undefined,
        department: category === "Employee" ? department.trim() : undefined,
        address: category === "Outsider" ? address.trim() : undefined,
        emergencyName: emergencyContact.trim().toUpperCase(),
        emergencyPhone: emergencyPhone.trim(),
        accessToken: token,
      };

      await AsyncStorage.setItem("@cura_user_session", JSON.stringify(finalUser)).catch(() => {});
      if (token) {
        await AsyncStorage.setItem("@cura_access_token", token).catch(() => {});
      }

      if (setUser) {
        setUser(finalUser);
      }
      if (loadUserData) {
        loadUserData(trimmedEmail);
      }

      showAlert("Account Created", "Your account and patient profile have been registered successfully.");
      navigate("home");
    } catch (e: any) {
      setSubmitError(e?.message || "Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    isSubmitting,
    email,
    password,
    name,
    category,
    studentId,
    employeeId,
    birthday,
    sex,
    contact,
    emergencyContact,
    emergencyPhone,
    studentCategory,
    course,
    yearLevel,
    gradeLevel,
    guardianName,
    position,
    department,
    address,
    setUser,
    loadUserData,
    showAlert,
    navigate,
  ]);

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backButton}>
          <ChevronLeftIcon color={PRIMARY} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>University Clinic Patient Registration</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 32 }]}
        >
          {submitError ? (
            <View style={styles.globalErrorCard}>
              <Text style={styles.globalErrorIcon}>⚠️</Text>
              <Text style={styles.globalErrorText}>{submitError}</Text>
            </View>
          ) : null}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 1: CHOOSE YOUR CATEGORY                                  */}
          {/* ────────────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1</Text>
              </View>
              <Text style={styles.cardTitle}>Choose your category</Text>
            </View>

            <View style={styles.categoryStack}>
              {(["Student", "Employee", "Outsider"] as CategoryType[]).map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      // Clear step 4 errors when category changes
                      setTouched((prev) => ({
                        ...prev,
                        studentId: false,
                        studentCategory: false,
                        course: false,
                        yearLevel: false,
                        gradeLevel: false,
                        guardianName: false,
                        employeeId: false,
                        position: false,
                        department: false,
                        address: false,
                      }));
                    }}
                    activeOpacity={0.8}
                    style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                  >
                    <View style={styles.categoryOptionTextWrap}>
                      <Text style={[styles.categoryOptionTitle, isSelected && styles.categoryOptionTitleSelected]}>
                        {cat}
                      </Text>
                      <Text style={[styles.categoryOptionSubtitle, isSelected && styles.categoryOptionSubtitleSelected]}>
                        {cat === "Student" && "Enrolled student (Elementary to College)"}
                        {cat === "Employee" && "Faculty, Staff, or Administration member"}
                        {cat === "Outsider" && "Visitor, Guest, or Community member"}
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInnerCircle} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 2: ACCOUNT                                                */}
          {/* ────────────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2</Text>
              </View>
              <Text style={styles.cardTitle}>Account</Text>
            </View>

            {/* Google account (email) input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Google Account (Email)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onBlur={() => markTouched("email")}
                placeholder="you@university.edu"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  touched.email && errors.email ? styles.inputError : undefined,
                ]}
              />
              {touched.email && errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => markTouched("password")}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    styles.passwordInput,
                    touched.password && errors.password ? styles.inputError : undefined,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <EyeIcon open={showPassword} color="#64748B" size={18} />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => markTouched("confirmPassword")}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    styles.passwordInput,
                    touched.confirmPassword && errors.confirmPassword ? styles.inputError : undefined,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <EyeIcon open={showConfirmPassword} color="#64748B" size={18} />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 3: BASIC INFORMATION                                      */}
          {/* ────────────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 3</Text>
              </View>
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={(t) => setName(t.toUpperCase())}
                onBlur={() => markTouched("name")}
                placeholder="LAST, FIRST MIDDLE"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={[
                  styles.input,
                  touched.name && errors.name ? styles.inputError : undefined,
                ]}
              />
              {touched.name && errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Birthday (date picker) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Birthday</Text>
              <TouchableOpacity
                onPress={() => {
                  markTouched("birthday");
                  setShowDatePicker(true);
                }}
                activeOpacity={0.75}
                style={[
                  styles.selectInput,
                  touched.birthday && errors.birthday ? styles.inputError : undefined,
                ]}
              >
                <Text style={birthday ? styles.selectText : styles.placeholderText}>
                  {birthday || "Select Birthday (YYYY-MM-DD)"}
                </Text>
                <CalendarIcon color={PRIMARY} size={18} />
              </TouchableOpacity>
              {touched.birthday && errors.birthday ? (
                <Text style={styles.errorText}>{errors.birthday}</Text>
              ) : null}

              {/* DatePicker for Android / iOS */}
              {showDatePicker && (
                <DateTimePicker
                  value={birthday ? new Date(birthday) : new Date(2002, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(_, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      setBirthday(`${y}-${m}-${day}`);
                    }
                  }}
                />
              )}
            </View>

            {/* Sex (dropdown) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sex</Text>
              <TouchableOpacity
                onPress={() => {
                  markTouched("sex");
                  setActiveDropdown("sex");
                }}
                activeOpacity={0.75}
                style={[
                  styles.selectInput,
                  touched.sex && errors.sex ? styles.inputError : undefined,
                ]}
              >
                <Text style={sex ? styles.selectText : styles.placeholderText}>
                  {sex || "Select Sex"}
                </Text>
                <ChevronDownIcon color="#64748B" size={18} />
              </TouchableOpacity>
              {touched.sex && errors.sex ? (
                <Text style={styles.errorText}>{errors.sex}</Text>
              ) : null}
            </View>

            {/* Contact Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contact Number</Text>
              <TextInput
                value={contact}
                onChangeText={(t) => setContact(formatPHPhone(t))}
                onBlur={() => markTouched("contact")}
                placeholder="09XX-XXX-XXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={13}
                style={[
                  styles.input,
                  touched.contact && errors.contact ? styles.inputError : undefined,
                ]}
              />
              {touched.contact && errors.contact ? (
                <Text style={styles.errorText}>{errors.contact}</Text>
              ) : null}
            </View>

            {/* Emergency Contact Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
              <TextInput
                value={emergencyContact}
                onChangeText={(t) => setEmergencyContact(t.toUpperCase())}
                onBlur={() => markTouched("emergencyContact")}
                placeholder="Name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={[
                  styles.input,
                  touched.emergencyContact && errors.emergencyContact ? styles.inputError : undefined,
                ]}
              />
              {touched.emergencyContact && errors.emergencyContact ? (
                <Text style={styles.errorText}>{errors.emergencyContact}</Text>
              ) : null}
            </View>

            {/* Emergency Contact Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Number</Text>
              <TextInput
                value={emergencyPhone}
                onChangeText={(t) => setEmergencyPhone(formatPHPhone(t))}
                onBlur={() => markTouched("emergencyPhone")}
                placeholder="09XX-XXX-XXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={13}
                style={[
                  styles.input,
                  touched.emergencyPhone && errors.emergencyPhone ? styles.inputError : undefined,
                ]}
              />
              {touched.emergencyPhone && errors.emergencyPhone ? (
                <Text style={styles.errorText}>{errors.emergencyPhone}</Text>
              ) : null}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 4: CATEGORY-SPECIFIC INFORMATION                          */}
          {/* ────────────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 4</Text>
              </View>
              <Text style={styles.cardTitle}>
                {category === "Student" && "Student Information"}
                {category === "Employee" && "Employee Information"}
                {category === "Outsider" && "Address Information"}
              </Text>
            </View>

            {/* ─── A) STUDENT ─── */}
            {category === "Student" && (
              <>
                {/* Student ID */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Student ID</Text>
                  <TextInput
                    value={studentId}
                    onChangeText={setStudentId}
                    onBlur={() => markTouched("studentId")}
                    placeholder="e.g., 202012345"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      touched.studentId && errors.studentId ? styles.inputError : undefined,
                    ]}
                  />
                  {touched.studentId && errors.studentId ? (
                    <Text style={styles.errorText}>{errors.studentId}</Text>
                  ) : null}
                </View>

                {/* Student Category Dropdown */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Student Category</Text>
                  <TouchableOpacity
                    onPress={() => {
                      markTouched("studentCategory");
                      setActiveDropdown("studentCategory");
                    }}
                    activeOpacity={0.75}
                    style={[
                      styles.selectInput,
                      touched.studentCategory && errors.studentCategory ? styles.inputError : undefined,
                    ]}
                  >
                    <Text style={studentCategory ? styles.selectText : styles.placeholderText}>
                      {studentCategory || "Select Category"}
                    </Text>
                    <ChevronDownIcon color="#64748B" size={18} />
                  </TouchableOpacity>
                  {touched.studentCategory && errors.studentCategory ? (
                    <Text style={styles.errorText}>{errors.studentCategory}</Text>
                  ) : null}
                </View>

                {/* Conditional Fields: Elementary, JHS, SHS */}
                {(studentCategory === "Elementary" ||
                  studentCategory === "Junior High School" ||
                  studentCategory === "Senior High School") && (
                  <>
                    {/* Grade Level Dropdown */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Grade Level</Text>
                      <TouchableOpacity
                        onPress={() => {
                          markTouched("gradeLevel");
                          setActiveDropdown("gradeLevel");
                        }}
                        activeOpacity={0.75}
                        style={[
                          styles.selectInput,
                          touched.gradeLevel && errors.gradeLevel ? styles.inputError : undefined,
                        ]}
                      >
                        <Text style={gradeLevel ? styles.selectText : styles.placeholderText}>
                          {gradeLevel || "Select Grade Level"}
                        </Text>
                        <ChevronDownIcon color="#64748B" size={18} />
                      </TouchableOpacity>
                      {touched.gradeLevel && errors.gradeLevel ? (
                        <Text style={styles.errorText}>{errors.gradeLevel}</Text>
                      ) : null}
                    </View>

                    {/* Guardian Name */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Guardian Name</Text>
                      <TextInput
                        value={guardianName}
                        onChangeText={(t) => setGuardianName(t.toUpperCase())}
                        onBlur={() => markTouched("guardianName")}
                        placeholder="e.g., Maria Dela Cruz (Mother)"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        style={[
                          styles.input,
                          touched.guardianName && errors.guardianName ? styles.inputError : undefined,
                        ]}
                      />
                      {touched.guardianName && errors.guardianName ? (
                        <Text style={styles.errorText}>{errors.guardianName}</Text>
                      ) : null}
                    </View>
                  </>
                )}

                {/* Conditional Fields: College */}
                {studentCategory === "College" && (
                  <>
                    {/* Course/Program */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Course / Program</Text>
                      <TextInput
                        value={course}
                        onChangeText={setCourse}
                        onBlur={() => markTouched("course")}
                        placeholder="e.g., BS Nursing"
                        placeholderTextColor="#94A3B8"
                        style={[
                          styles.input,
                          touched.course && errors.course ? styles.inputError : undefined,
                        ]}
                      />
                      {touched.course && errors.course ? (
                        <Text style={styles.errorText}>{errors.course}</Text>
                      ) : null}
                    </View>

                    {/* Year Level Dropdown */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Year Level</Text>
                      <TouchableOpacity
                        onPress={() => {
                          markTouched("yearLevel");
                          setActiveDropdown("yearLevel");
                        }}
                        activeOpacity={0.75}
                        style={[
                          styles.selectInput,
                          touched.yearLevel && errors.yearLevel ? styles.inputError : undefined,
                        ]}
                      >
                        <Text style={yearLevel ? styles.selectText : styles.placeholderText}>
                          {yearLevel || "Select Year Level"}
                        </Text>
                        <ChevronDownIcon color="#64748B" size={18} />
                      </TouchableOpacity>
                      {touched.yearLevel && errors.yearLevel ? (
                        <Text style={styles.errorText}>{errors.yearLevel}</Text>
                      ) : null}
                    </View>
                  </>
                )}
              </>
            )}

            {/* ─── B) EMPLOYEE ─── */}
            {category === "Employee" && (
              <>
                {/* Employee ID */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Employee ID</Text>
                  <TextInput
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    onBlur={() => markTouched("employeeId")}
                    placeholder="e.g., EMP-1234"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      touched.employeeId && errors.employeeId ? styles.inputError : undefined,
                    ]}
                  />
                  {touched.employeeId && errors.employeeId ? (
                    <Text style={styles.errorText}>{errors.employeeId}</Text>
                  ) : null}
                </View>

                {/* Position / Designation */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Position / Designation</Text>
                  <TextInput
                    value={position}
                    onChangeText={setPosition}
                    onBlur={() => markTouched("position")}
                    placeholder="e.g., Professor"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      touched.position && errors.position ? styles.inputError : undefined,
                    ]}
                  />
                  {touched.position && errors.position ? (
                    <Text style={styles.errorText}>{errors.position}</Text>
                  ) : null}
                </View>

                {/* Department */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Department</Text>
                  <TextInput
                    value={department}
                    onChangeText={setDepartment}
                    onBlur={() => markTouched("department")}
                    placeholder="e.g., College of Nursing"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      touched.department && errors.department ? styles.inputError : undefined,
                    ]}
                  />
                  {touched.department && errors.department ? (
                    <Text style={styles.errorText}>{errors.department}</Text>
                  ) : null}
                </View>
              </>
            )}

            {/* ─── C) OUTSIDER ─── */}
            {category === "Outsider" && (
              <>
                {/* Home Address (multiline) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Home Address</Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    onBlur={() => markTouched("address")}
                    placeholder="Street, Barangay, City, Province"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={[
                      styles.input,
                      styles.multilineInput,
                      touched.address && errors.address ? styles.inputError : undefined,
                    ]}
                  />
                  {touched.address && errors.address ? (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* SUBMIT BUTTON & FOOTER                                         */}
          {/* ────────────────────────────────────────────────────────────── */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.85}
              style={[
                styles.submitButton,
                (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {!isFormValid && (
              <Text style={styles.validationHintText}>
                Please fill in all required fields to activate account creation.
              </Text>
            )}

            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkMuted}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigate("login")} activeOpacity={0.7}>
                <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* DROPDOWN MODALS                                                */}
      {/* ────────────────────────────────────────────────────────────── */}
      {/* Sex Dropdown */}
      <DropdownModal
        visible={activeDropdown === "sex"}
        title="Select Sex"
        options={SEX_OPTIONS}
        selected={sex}
        onSelect={setSex}
        onClose={() => setActiveDropdown(null)}
      />

      {/* Student Category Dropdown */}
      <DropdownModal
        visible={activeDropdown === "studentCategory"}
        title="Select Student Category"
        options={STUDENT_CATEGORIES}
        selected={studentCategory}
        onSelect={(item) => handleStudentCategoryChange(item as StudentCategoryType)}
        onClose={() => setActiveDropdown(null)}
      />

      {/* Grade Level Dropdown */}
      <DropdownModal
        visible={activeDropdown === "gradeLevel"}
        title="Select Grade Level"
        options={
          studentCategory === "Elementary" ||
          studentCategory === "Junior High School" ||
          studentCategory === "Senior High School"
            ? GRADE_LEVELS[studentCategory]
            : []
        }
        selected={gradeLevel}
        onSelect={setGradeLevel}
        onClose={() => setActiveDropdown(null)}
      />

      {/* Year Level Dropdown */}
      <DropdownModal
        visible={activeDropdown === "yearLevel"}
        title="Select Year Level"
        options={YEAR_LEVELS}
        selected={yearLevel}
        onSelect={setYearLevel}
        onClose={() => setActiveDropdown(null)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    marginRight: 14,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  globalErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  globalErrorIcon: {
    fontSize: 16,
  },
  globalErrorText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  stepBadge: {
    backgroundColor: `${PRIMARY}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  categoryStack: {
    gap: 10,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryOptionSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryOptionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  categoryOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  categoryOptionTitleSelected: {
    color: "#FFFFFF",
  },
  categoryOptionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "400",
  },
  categoryOptionSubtitleSelected: {
    color: "rgba(255, 255, 255, 0.82)",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioCircleSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: PRIMARY,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F172A",
  },
  multilineInput: {
    minHeight: 76,
    paddingTop: 11,
  },
  inputError: {
    borderColor: "#F87171",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 2,
    fontWeight: "500",
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
  selectInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  submitSection: {
    marginTop: 6,
    marginBottom: 16,
    alignItems: "center",
  },
  submitButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  validationHintText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  loginLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  loginLinkMuted: {
    fontSize: 13.5,
    color: "#64748B",
  },
  loginLinkHighlight: {
    fontSize: 13.5,
    fontWeight: "700",
    color: PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalOptionSelected: {
    backgroundColor: `${PRIMARY}12`,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  modalOptionTextSelected: {
    color: PRIMARY,
    fontWeight: "700",
  },
  modalCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
});
