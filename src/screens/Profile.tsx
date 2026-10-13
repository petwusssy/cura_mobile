import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Polyline, Rect, Circle, Line } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import type { Screen, AppUser } from "../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  user: Partial<AppUser>;
  setUser?: React.Dispatch<React.SetStateAction<any>>;
  resetApp: () => void;
  consultations?: any[];
  medications?: any[];
  certificates?: any[];
  theme?: string;
  setTheme?: (theme: string) => void;
}

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function renderInfoBlueIcon(label: string) {
  const blue = "#0056B3";
  switch (label) {
    case "ID":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="18" height="16" rx="3" />
          <Circle cx="9" cy="10" r="2" />
          <Line x1="15" y1="8" x2="17" y2="8" />
          <Line x1="15" y1="12" x2="17" y2="12" />
          <Line x1="7" y1="16" x2="17" y2="16" />
        </Svg>
      );
    case "Gender":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case "Date of Birth":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
      );
    case "Contact Details":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
      );
    case "Email":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <Polyline points="22,6 12,13 2,6" />
        </Svg>
      );
    case "Emergency Contact":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <Line x1="12" y1="8" x2="12" y2="12" />
          <Line x1="12" y1="16" x2="12.01" y2="16" />
        </Svg>
      );
    case "Position":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </Svg>
      );
    case "Department":
    case "Address":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <Circle cx="12" cy="10" r="3" />
        </Svg>
      );
    case "Notification Preferences":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </Svg>
      );
    case "Mascot & Display Name":
    case "Profile Photo & Display Name":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );
    case "Privacy & Security":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      );
    case "About CURA":
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="16" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
        </Svg>
      );
    default:
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Polyline points="14 2 14 8 20 8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Polyline points="10 9 9 9 8 9" />
        </Svg>
      );
  }
}

export function ProfileScreen({
  navigate,
  user,
  setUser,
  resetApp,
  consultations = [],
  medications = [],
  certificates = [],
  theme = "light",
}: Props) {
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const isDark = theme === "dark" || systemScheme === "dark";
  const userKey = user.id || (user as any).id_number || user.email || "default";

  // Modals visibility
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMascotModal, setShowMascotModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Saving states
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Cooldown states
  const [infoCooldown, setInfoCooldown] = useState<{ active: boolean; days: number; date: string }>({
    active: false,
    days: 0,
    date: "",
  });
  const [photoCooldown, setPhotoCooldown] = useState<{ active: boolean; days: number; date: string }>({
    active: false,
    days: 0,
    date: "",
  });
  const [nameCooldown, setNameCooldown] = useState<{ active: boolean; days: number; date: string }>({
    active: false,
    days: 0,
    date: "",
  });
  const [notifCooldown, setNotifCooldown] = useState<{ active: boolean; days: number; date: string }>({
    active: false,
    days: 0,
    date: "",
  });
  const [securityCooldown, setSecurityCooldown] = useState<{ active: boolean; days: number; date: string }>({
    active: false,
    days: 0,
    date: "",
  });

  // Edit My Information form state
  const [formId, setFormId] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmergencyName, setFormEmergencyName] = useState("");
  const [formEmergencyPhone, setFormEmergencyPhone] = useState("");
  const [formStudentCategory, setFormStudentCategory] = useState("");
  const [formGradeLevel, setFormGradeLevel] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formYearLevel, setFormYearLevel] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formAddress, setFormAddress] = useState("");

  // Single field edit modal state
  interface SingleEditField {
    key: string;
    label: string;
    value: string;
    secondLabel?: string;
    secondValue?: string;
    type?: "text" | "phone" | "email" | "select";
    options?: string[];
  }
  const [activeEditField, setActiveEditField] = useState<SingleEditField | null>(null);
  const [singleFieldValue, setSingleFieldValue] = useState("");
  const [singleFieldSecondaryValue, setSingleFieldSecondaryValue] = useState("");
  const [savingSingleField, setSavingSingleField] = useState(false);

  const openSingleEdit = (field: SingleEditField) => {
    setActiveEditField(field);
    setSingleFieldValue(field.value);
    setSingleFieldSecondaryValue(field.secondValue || "");
  };

  // Notification Preferences form state
  const [notifMedReminders, setNotifMedReminders] = useState(true);
  const [notifConsultReminders, setNotifConsultReminders] = useState(true);
  const [notifAdvisories, setNotifAdvisories] = useState(true);
  const [notifSoundAlerts, setNotifSoundAlerts] = useState(true);

  // Profile Photo & Display Name state
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formAvatarUrl, setFormAvatarUrl] = useState<string | null>(user.avatarUrl || null);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Check cooldown helper
  const checkCooldownForKey = useCallback(async (key: string) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return { active: false, days: 0, date: "" };
      const timestamp = parseInt(raw, 10);
      if (isNaN(timestamp)) return { active: false, days: 0, date: "" };
      const now = Date.now();
      const elapsed = now - timestamp;
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const days = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
        const date = new Date(timestamp + COOLDOWN_MS).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return { active: true, days, date };
      }
    } catch (e) {}
    return { active: false, days: 0, date: "" };
  }, []);

  // Refresh cooldowns
  const refreshCooldowns = useCallback(async () => {
    const [infoCd, photoCd, nameCd, notifCd, securityCd] = await Promise.all([
      checkCooldownForKey(`@cura_cooldown_my_info_${userKey}`),
      checkCooldownForKey(`@cura_cooldown_photo_${userKey}`),
      checkCooldownForKey(`@cura_cooldown_display_name_${userKey}`),
      checkCooldownForKey(`@cura_cooldown_notif_${userKey}`),
      checkCooldownForKey(`@cura_cooldown_security_${userKey}`),
    ]);
    setInfoCooldown(infoCd);
    setPhotoCooldown(photoCd);
    setNameCooldown(nameCd);
    setNotifCooldown(notifCd);
    setSecurityCooldown(securityCd);
  }, [checkCooldownForKey, userKey]);

  useEffect(() => {
    refreshCooldowns();
  }, [refreshCooldowns]);

  // Load saved preferences
  useEffect(() => {
    AsyncStorage.getItem(`@cura_notif_prefs_${userKey}`).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed.medReminders !== undefined) setNotifMedReminders(parsed.medReminders);
          if (parsed.consultReminders !== undefined) setNotifConsultReminders(parsed.consultReminders);
          if (parsed.advisories !== undefined) setNotifAdvisories(parsed.advisories);
          if (parsed.soundAlerts !== undefined) setNotifSoundAlerts(parsed.soundAlerts);
        } catch (e) {}
      }
    });
    AsyncStorage.getItem(`@cura_biometrics_${userKey}`).then((val) => {
      if (val !== null) setBiometricsEnabled(val === "true");
    });
  }, [userKey]);

  // Handlers for opening modals with 7-day cooldown check
  const handleOpenMyInfoEdit = async () => {
    const cd = await checkCooldownForKey(`@cura_cooldown_my_info_${userKey}`);
    if (cd.active) {
      Alert.alert(
        "Cooldown Active (7 Days)",
        `You recently edited your information. To maintain record accuracy, changes are limited to once every 7 days.\n\nYou can edit this again in ${cd.days} day(s) (available on ${cd.date}).`,
        [{ text: "Understood" }]
      );
      return;
    }

    // Populate current values
    setFormId((user as any).id || user.id_number || "");
    setFormGender(user.gender || (user as any).sex || "");
    setFormDob(user.dob || (user as any).birthday || "");
    setFormEmail(user.email || "");
    setFormPhone(user.phone || (user as any).contact || "");
    setFormEmergencyName(user.emergencyName || (user as any).emergencyContact || "");
    setFormEmergencyPhone(user.emergencyPhone || "");
    setFormStudentCategory((user as any).studentCategory || "");
    setFormGradeLevel((user as any).gradeLevel ? String((user as any).gradeLevel) : "");
    setFormCourse(user.course || "");
    setFormYearLevel(user.yearLevel || "");
    setFormPosition(user.position || "");
    setFormDepartment(user.department || "");
    setFormAddress(user.address || "");

    setShowInfoModal(true);
  };

  const handleOpenNotifModal = async () => {
    const cd = await checkCooldownForKey(`@cura_cooldown_notif_${userKey}`);
    if (cd.active) {
      Alert.alert(
        "Cooldown Active (7 Days)",
        `You recently modified your notification preferences. Notification changes are limited to once every 7 days.\n\nYou can edit this again in ${cd.days} day(s) (available on ${cd.date}).`,
        [{ text: "Understood" }]
      );
      return;
    }
    setShowNotifModal(true);
  };

  const handleOpenMascotModal = async () => {
    const [photoCd, nameCd] = await Promise.all([
      checkCooldownForKey(`@cura_cooldown_photo_${userKey}`),
      checkCooldownForKey(`@cura_cooldown_display_name_${userKey}`),
    ]);
    setPhotoCooldown(photoCd);
    setNameCooldown(nameCd);

    if (photoCd.active && nameCd.active) {
      Alert.alert(
        "Cooldown Active (7 Days)",
        `Both your profile photo and display name are on a 7-day cooldown.\n\n• Photo available in ${photoCd.days} day(s) (${photoCd.date})\n• Display name available in ${nameCd.days} day(s) (${nameCd.date})`,
        [{ text: "Understood" }]
      );
      return;
    }

    setFormDisplayName(user.displayName || user.firstName || "");
    setFormAvatarUrl(user.avatarUrl || null);
    setShowMascotModal(true);
  };

  const handlePickImage = async () => {
    if (photoCooldown.active) {
      Alert.alert(
        "Photo Cooldown Active (7 Days)",
        `You recently updated your profile photo. You can edit this again in ${photoCooldown.days} day(s) (available on ${photoCooldown.date}).`,
        [{ text: "Understood" }]
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to select a profile picture."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormAvatarUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  const handleRemoveImage = () => {
    if (photoCooldown.active) {
      Alert.alert(
        "Photo Cooldown Active (7 Days)",
        `You recently updated your profile photo. You can edit this again in ${photoCooldown.days} day(s) (available on ${photoCooldown.date}).`,
        [{ text: "Understood" }]
      );
      return;
    }
    setFormAvatarUrl(null);
  };

  const handleOpenSecurityModal = async () => {
    const cd = await checkCooldownForKey(`@cura_cooldown_security_${userKey}`);
    if (cd.active) {
      Alert.alert(
        "Cooldown Active (7 Days)",
        `You recently modified your security settings. Security changes are limited to once every 7 days.\n\nYou can edit this again in ${cd.days} day(s) (available on ${cd.date}).`,
        [{ text: "Understood" }]
      );
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowSecurityModal(true);
  };

  // Save My Information
  const handleSaveMyInfo = async () => {
    setSavingInfo(true);
    const cat = (user.category || "").toLowerCase();
    const patientId = user.id || (user as any).id_number;

    const payload: any = {
      ...(formId.trim() ? { id_number: formId.trim() } : {}),
      ...(formGender.trim() ? { gender: formGender.trim(), sex: formGender.trim() } : {}),
      ...(formDob.trim() ? { dob: formDob.trim(), birthday: formDob.trim() } : {}),
      ...(formEmail.trim() ? { email: formEmail.trim() } : {}),
      contact: formPhone.trim(),
      phone: formPhone.trim(),
      emergencyContact: formEmergencyName.trim().toUpperCase(),
      emergencyPhone: formEmergencyPhone.trim(),
    };

    if (cat === "student") {
      if (formStudentCategory) payload.studentCategory = formStudentCategory.trim();
      const isCol = !formStudentCategory || formStudentCategory.toLowerCase().includes("college");
      if (isCol) {
        payload.course = formCourse.trim();
        payload.yearLevel = formYearLevel.trim();
        payload.gradeLevel = "";
      } else {
        payload.gradeLevel = formGradeLevel.trim();
        payload.course = "";
        payload.yearLevel = "";
      }
    } else if (cat === "employee") {
      if (formPosition) payload.position = formPosition.trim();
      if (formDepartment) payload.department = formDepartment.trim();
    } else if (cat === "outsider") {
      if (formAddress) payload.address = formAddress.trim();
    }

    try {
      // 1. Sync with backend Patient record by ID
      if (patientId) {
        await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/${patientId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }

      // 2. Also sync by email if available to guarantee web patient profile update
      if (user.email) {
        await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/update-by-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, ...payload }),
        }).catch(() => {});
      }

      // 3. Update local session state
      const updatedUser: any = {
        ...user,
        ...(formId.trim() ? { id: formId.trim(), id_number: formId.trim() } : {}),
        ...(formGender.trim() ? { gender: formGender.trim(), sex: formGender.trim() } : {}),
        ...(formDob.trim() ? { dob: formDob.trim(), birthday: formDob.trim() } : {}),
        ...(formEmail.trim() ? { email: formEmail.trim() } : {}),
        phone: formPhone.trim(),
        contact: formPhone.trim(),
        emergencyName: formEmergencyName.trim().toUpperCase(),
        emergencyContact: formEmergencyName.trim().toUpperCase(),
        emergencyPhone: formEmergencyPhone.trim(),
        ...(cat === "student"
          ? {
              studentCategory: formStudentCategory.trim(),
              ...((!formStudentCategory || formStudentCategory.toLowerCase().includes("college"))
                ? {
                    course: formCourse.trim(),
                    yearLevel: formYearLevel.trim(),
                    gradeLevel: "",
                  }
                : {
                    gradeLevel: formGradeLevel.trim(),
                    course: "",
                    yearLevel: "",
                  }),
            }
          : {}),
        ...(cat === "employee"
          ? {
              position: formPosition.trim(),
              department: formDepartment.trim(),
            }
          : {}),
        ...(cat === "outsider"
          ? {
              address: formAddress.trim(),
            }
          : {}),
      };

      if (setUser) setUser(updatedUser);
      await AsyncStorage.setItem("@cura_user_session", JSON.stringify(updatedUser)).catch(() => {});

      // 4. Set 7-day cooldown
      const nowStr = Date.now().toString();
      await AsyncStorage.setItem(`@cura_cooldown_my_info_${userKey}`, nowStr).catch(() => {});
      await refreshCooldowns();

      setShowInfoModal(false);
      Alert.alert(
        "Information Updated",
        "Your profile has been saved and synced with your clinic records.\n\nNote: You can edit this section again after 7 days.",
        [{ text: "OK" }]
      );
    } catch (e: any) {
      Alert.alert("Notice", "Changes saved locally. Syncing will finalize on next connection.");
      setShowInfoModal(false);
    } finally {
      setSavingInfo(false);
    }
  };

  // Save single field
  const handleSaveSingleField = async () => {
    if (!activeEditField) return;
    setSavingSingleField(true);

    const val = singleFieldValue.trim();
    const secVal = singleFieldSecondaryValue.trim();
    const patientId = user.id || (user as any).id_number;

    let payload: any = {};
    let userUpdates: any = {};

    switch (activeEditField.key) {
      case "id":
        payload = { id_number: val };
        userUpdates = { id: val, id_number: val };
        break;
      case "contact":
        payload = { contact: val, phone: val };
        userUpdates = { contact: val, phone: val };
        break;
      case "email":
        payload = { email: val };
        userUpdates = { email: val };
        break;
      case "emergency":
        payload = { emergencyContact: val.toUpperCase(), emergencyPhone: secVal };
        userUpdates = {
          emergencyName: val.toUpperCase(),
          emergencyContact: val.toUpperCase(),
          emergencyPhone: secVal,
        };
        break;
      case "category":
        payload = { studentCategory: val };
        userUpdates = {
          studentCategory: val,
          ...(val.toLowerCase().includes("college")
            ? { gradeLevel: "" }
            : { course: "", yearLevel: "" }),
        };
        break;
      case "course":
        payload = { course: val };
        userUpdates = { course: val };
        break;
      case "yearLevel":
        payload = { yearLevel: val };
        userUpdates = { yearLevel: val };
        break;
      case "gender":
        payload = { gender: val, sex: val };
        userUpdates = { gender: val, sex: val };
        break;
      case "dob":
        payload = { dob: val, birthday: val };
        userUpdates = { dob: val, birthday: val };
        break;
      case "gradeLevel":
        payload = { gradeLevel: val };
        userUpdates = { gradeLevel: val };
        break;
      case "position":
        payload = { position: val };
        userUpdates = { position: val };
        break;
      case "department":
        payload = { department: val };
        userUpdates = { department: val };
        break;
      case "address":
        payload = { address: val };
        userUpdates = { address: val };
        break;
      default:
        break;
    }

    try {
      if (patientId) {
        await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/${patientId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }

      if (user.email) {
        await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/update-by-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, ...payload }),
        }).catch(() => {});
      }

      const updatedUser = {
        ...user,
        ...userUpdates,
      };

      if (setUser) setUser(updatedUser);
      await AsyncStorage.setItem("@cura_user_session", JSON.stringify(updatedUser)).catch(() => {});

      setActiveEditField(null);
      Alert.alert(
        "Information Updated",
        `${activeEditField.label} has been updated.`,
        [{ text: "OK" }]
      );
    } catch (e) {
      Alert.alert("Notice", "Changes saved locally.");
      setActiveEditField(null);
    } finally {
      setSavingSingleField(false);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifPreferences = async () => {
    const prefs = {
      medReminders: notifMedReminders,
      consultReminders: notifConsultReminders,
      advisories: notifAdvisories,
      soundAlerts: notifSoundAlerts,
    };
    await AsyncStorage.setItem(`@cura_notif_prefs_${userKey}`, JSON.stringify(prefs)).catch(() => {});
    await AsyncStorage.setItem(`@cura_cooldown_notif_${userKey}`, Date.now().toString()).catch(() => {});
    await refreshCooldowns();
    setShowNotifModal(false);
    Alert.alert(
      "Preferences Saved",
      "Notification settings updated successfully.\n\nNote: You can edit notification preferences again after 7 days.",
      [{ text: "OK" }]
    );
  };

  // Save Profile Photo & Display Name
  const handleSaveMascot = async () => {
    const oldName = (user.displayName || user.firstName || "").trim();
    const newName = formDisplayName.trim();
    const nameChanged = newName !== "" && newName !== oldName;

    const oldAvatar = user.avatarUrl || null;
    const newAvatar = formAvatarUrl || null;
    const avatarChanged = newAvatar !== oldAvatar;

    if (!nameChanged && !avatarChanged) {
      setShowMascotModal(false);
      return;
    }

    if (nameChanged && nameCooldown.active) {
      Alert.alert(
        "Display Name Cooldown Active",
        `Display name changes are limited to once every 7 days.\n\nAvailable on ${nameCooldown.date} (${nameCooldown.days} day(s) remaining).`
      );
      return;
    }

    if (avatarChanged && photoCooldown.active) {
      Alert.alert(
        "Profile Photo Cooldown Active",
        `Profile photo changes are limited to once every 7 days.\n\nAvailable on ${photoCooldown.date} (${photoCooldown.days} day(s) remaining).`
      );
      return;
    }

    const updatedUser: any = {
      ...user,
      displayName: nameChanged ? newName : (user.displayName || user.firstName || "PATIENT"),
      avatarUrl: avatarChanged ? newAvatar : user.avatarUrl,
    };

    if (setUser) setUser(updatedUser);
    await AsyncStorage.setItem("@cura_user_session", JSON.stringify(updatedUser)).catch(() => {});

    // Set cooldown only for what was changed
    const nowStr = Date.now().toString();
    if (avatarChanged) {
      await AsyncStorage.setItem(`@cura_cooldown_photo_${userKey}`, nowStr).catch(() => {});
    }
    if (nameChanged) {
      await AsyncStorage.setItem(`@cura_cooldown_display_name_${userKey}`, nowStr).catch(() => {});
    }

    await refreshCooldowns();
    setShowMascotModal(false);

    const changedParts: string[] = [];
    if (avatarChanged) changedParts.push("Profile photo");
    if (nameChanged) changedParts.push("Display name");

    Alert.alert(
      "Profile Updated",
      `${changedParts.join(" and ")} updated successfully.\n\nNote: You can edit ${changedParts.length > 1 ? "these" : "this"} again after 7 days.`,
      [{ text: "OK" }]
    );
  };

  // Save Privacy & Security
  const handleSaveSecurity = async () => {
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert("Invalid Password", "New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Password Mismatch", "New password and confirmation do not match.");
        return;
      }

      setSavingSecurity(true);
      try {
        const res = await fetch("https://cura-backend-dvj5.onrender.com/api/auth/change-password/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          Alert.alert("Update Failed", data.error || "Could not update password. Please check your current password.");
          setSavingSecurity(false);
          return;
        }
      } catch (e) {
        Alert.alert("Network Notice", "Password update request could not reach the server. Please try again.");
        setSavingSecurity(false);
        return;
      }
    }

    await AsyncStorage.setItem(`@cura_biometrics_${userKey}`, biometricsEnabled ? "true" : "false").catch(() => {});
    await AsyncStorage.setItem(`@cura_cooldown_security_${userKey}`, Date.now().toString()).catch(() => {});
    await refreshCooldowns();
    setSavingSecurity(false);
    setShowSecurityModal(false);
    Alert.alert(
      "Security Updated",
      "Your privacy and password settings have been updated.\n\nNote: You can edit security settings again after 7 days.",
      [{ text: "OK" }]
    );
  };

  // My Information items
  const myInfoItems = [
    {
      icon: "🪪",
      label: "ID",
      sub: (user as any).id || user.id_number || "—",
      color: "#F3F4F6",
      onPress: () =>
        openSingleEdit({
          key: "id",
          label: "ID",
          value: (user as any).id || user.id_number || "",
          type: "text",
        }),
    },
    {
      icon: "👤",
      label: "Gender",
      sub: user.gender || (user as any).sex || "—",
      color: "#EFF8FF",
      onPress: () =>
        openSingleEdit({
          key: "gender",
          label: "Gender",
          value: user.gender || (user as any).sex || "",
          type: "select",
          options: ["Male", "Female"],
        }),
    },
    {
      icon: "📅",
      label: "Date of Birth",
      sub:
        user.dob || (user as any).birthday
          ? new Date(user.dob || (user as any).birthday).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Manila",
            })
          : "—",
      color: "#ECFDF5",
      onPress: () =>
        openSingleEdit({
          key: "dob",
          label: "Date of Birth",
          value: user.dob || (user as any).birthday || "",
          type: "text",
        }),
    },
    {
      icon: "📞",
      label: "Contact Details",
      sub: user.phone || (user as any).contact || "—",
      color: "#ECFEFF",
      onPress: () =>
        openSingleEdit({
          key: "contact",
          label: "Contact Details",
          value: user.phone || (user as any).contact || "",
          type: "phone",
        }),
    },
    {
      icon: "📧",
      label: "Email",
      sub: user.email || "—",
      color: "#EFF8FF",
      onPress: () =>
        openSingleEdit({
          key: "email",
          label: "Email",
          value: user.email || "",
          type: "email",
        }),
    },
    {
      icon: "🆘",
      label: "Emergency Contact",
      sub: `${user.emergencyName || (user as any).emergencyContact || "—"} (${user.emergencyPhone || "—"})`,
      color: "#FFF7ED",
      onPress: () =>
        openSingleEdit({
          key: "emergency",
          label: "Emergency Contact Person",
          value: user.emergencyName || (user as any).emergencyContact || "",
          secondLabel: "Emergency Contact Phone Number",
          secondValue: user.emergencyPhone || "",
          type: "text",
        }),
    },
  ];

  const cat = user.category?.toLowerCase() || "";
  const studentCat = (user as any).studentCategory || "";
  const isCollege = !studentCat || studentCat.toLowerCase().includes("college");

  if (cat === "student") {
    myInfoItems.push({
      icon: "📋",
      label: "Category",
      sub: studentCat || "—",
      color: "#FEE2E2",
      onPress: () =>
        openSingleEdit({
          key: "category",
          label: "Category",
          value: studentCat || "",
          type: "select",
          options: ["College", "Senior High", "Junior High", "Elementary"],
        }),
    });

    if (!isCollege || (user as any).gradeLevel) {
      myInfoItems.push({
        icon: "📈",
        label: "Grade Level",
        sub: (user as any).gradeLevel ? `Grade ${(user as any).gradeLevel}` : "—",
        color: "#FEF3C7",
        onPress: () =>
          openSingleEdit({
            key: "gradeLevel",
            label: "Grade Level",
            value: (user as any).gradeLevel ? String((user as any).gradeLevel) : "",
            type: "text",
          }),
      });
    }

    if (isCollege) {
      myInfoItems.push({
        icon: "🎓",
        label: "Course",
        sub: user.course || "—",
        color: "#ECFDF5",
        onPress: () =>
          openSingleEdit({
            key: "course",
            label: "Course",
            value: user.course || "",
            type: "text",
          }),
      });
      myInfoItems.push({
        icon: "📊",
        label: "Year Level",
        sub: user.yearLevel || "—",
        color: "#F5F3FF",
        onPress: () =>
          openSingleEdit({
            key: "yearLevel",
            label: "Year Level",
            value: user.yearLevel || "",
            type: "text",
          }),
      });
    }
  } else if (cat === "employee") {
    myInfoItems.push({
      icon: "💼",
      label: "Position",
      sub: user.position || "—",
      color: "#ECFDF5",
      onPress: () =>
        openSingleEdit({
          key: "position",
          label: "Position",
          value: user.position || "",
          type: "text",
        }),
    });
    myInfoItems.push({
      icon: "🏢",
      label: "Department",
      sub: user.department || "—",
      color: "#F5F3FF",
      onPress: () =>
        openSingleEdit({
          key: "department",
          label: "Department",
          value: user.department || "",
          type: "text",
        }),
    });
  } else if (cat === "outsider") {
    myInfoItems.push({
      icon: "📍",
      label: "Address",
      sub: user.address || "—",
      color: "#FEE2E2",
      onPress: () =>
        openSingleEdit({
          key: "address",
          label: "Address",
          value: user.address || "",
          type: "text",
        }),
    });
  }

  const certItems = certificates.length > 0 ? certificates.map((cert) => ({
    icon: "📄",
    label: cert.purpose || "Medical Certificate",
    sub: `Issued: ${cert.date} · ${cert.doctor || "Clinic Physician"}`,
    color: "#EFF8FF",
    onPress: () => navigate("cert-detail", { id: cert.id, cert }),
  })) : [
    {
      icon: "📄",
      label: "No Medical Certificates",
      sub: "No certificate records issued yet",
      color: "#F8FAFC",
      onPress: () => navigate("documents", { tab: "certificates" }),
    },
  ];

  const sections = [
    {
      title: "My Information",
      cooldown: infoCooldown,
      action: (
        <Pressable
          onPress={handleOpenMyInfoEdit}
          className="flex-row items-center gap-1 px-3 py-1 rounded-full active:opacity-80"
          style={{
            backgroundColor: infoCooldown.active
              ? "rgba(251, 191, 36, 0.15)"
              : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(255, 255, 255, 0.15)",
            borderWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.45)",
            borderLeftColor: "rgba(255, 255, 255, 0.35)",
            borderRightColor: "rgba(255, 255, 255, 0.2)",
            borderBottomColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          {infoCooldown.active ? (
            <Text
              className="text-[10px] font-bold"
              style={{
                color: "#FDE68A",
                textShadowColor: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.8)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              ⏳ {infoCooldown.days}d Cooldown
            </Text>
          ) : (
            <>
              <Svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0056B3"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </Svg>
              <Text
                className="text-[10px] font-bold text-cura-900"
                style={{
                  fontFamily: "Outfit",
                }}
              >
                Edit Info
              </Text>
            </>
          )}
        </Pressable>
      ),
      items: myInfoItems,
    },
    {
      title: `Medical Certificates (${certificates.length})`,
      action: null,
      items: certItems,
    },
    {
      title: "Preferences",
      action: null,
      items: [
        {
          icon: "🔔",
          label: "Notification Preferences",
          sub: notifCooldown.active
            ? `⏳ Cooldown (${notifCooldown.days}d) · Reminders & alerts`
            : "Reminders, advisories & alerts",
          color: "#EFF8FF",
          onPress: handleOpenNotifModal,
        },
        {
          icon: "📷",
          label: "Profile Photo & Display Name",
          sub: photoCooldown.active && nameCooldown.active
            ? `⏳ Cooldown (${Math.max(photoCooldown.days, nameCooldown.days)}d) · ${(user.displayName || user.firstName || "Patient").toUpperCase()}`
            : photoCooldown.active
            ? `⏳ Photo cooldown (${photoCooldown.days}d) · ${(user.displayName || user.firstName || "Patient").toUpperCase()}`
            : nameCooldown.active
            ? `⏳ Name cooldown (${nameCooldown.days}d) · ${(user.displayName || user.firstName || "Patient").toUpperCase()}`
            : (user.displayName || user.firstName || "Patient").toUpperCase(),
          color: "#EFF6FF",
          onPress: handleOpenMascotModal,
        },
        {
          icon: "🔒",
          label: "Privacy & Security",
          sub: securityCooldown.active
            ? `⏳ Cooldown (${securityCooldown.days}d) · Password & lock`
            : "Password, biometrics & lock",
          color: "#ECFDF5",
          onPress: handleOpenSecurityModal,
        },
        {
          icon: "ℹ️",
          label: "About CURA",
          sub: "Version 1.0.0 · Information",
          color: "#F8FAFC",
          onPress: () => setShowAboutModal(true),
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-transparent">
      {/* Profile header */}
      <View
        className="px-5 pb-7"
        style={{ paddingTop: Math.max(insets.top, 24) + 16 }}
      >
        <Text
          className="text-[22px] font-black tracking-tight mb-5 text-cura-900"
          style={{ fontFamily: "Outfit" }}
        >
          Profile
        </Text>

        <View className="flex-row items-center gap-4">
          <View className="relative">
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 33,
                  borderWidth: 2.5,
                  borderColor: "rgba(0, 86, 179, 0.3)",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 33,
                  backgroundColor: "#0056B3",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2.5,
                  borderColor: "rgba(0, 86, 179, 0.3)",
                  shadowColor: "#0056B3",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 28,
                    fontWeight: "900",
                    fontFamily: "Outfit",
                  }}
                >
                  {(user.displayName || user.firstName || "U").trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable
              onPress={handleOpenMascotModal}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full items-center justify-center bg-[#0056B3]"
              style={{
                borderColor: "#FFFFFF",
                borderWidth: 2,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx="12" cy="13" r="4" />
              </Svg>
            </Pressable>
          </View>
          <View>
            <Text
              className="text-xl font-black text-cura-900"
              style={{ fontFamily: "Outfit" }}
            >
              {(user.firstName || "").toUpperCase()} {(user.lastName || "").toUpperCase()}
            </Text>
            <Text className="text-xs mt-0.5 font-medium text-slate-500">
              {user.email}
            </Text>
            <View className="flex-row items-center gap-2 mt-1.5">
              <View
                className="rounded-full px-2.5 py-0.5 overflow-hidden relative"
              >
                <LinearGradient
                  colors={ADMIN_PORTAL_GRADIENT.colors}
                  start={ADMIN_PORTAL_GRADIENT.start}
                  end={ADMIN_PORTAL_GRADIENT.end}
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  className="text-[10px] font-bold text-white capitalize"
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {user.category || "patient"}
                </Text>
              </View>
              {user.category?.toLowerCase() === "student" && (
                <Text className="text-[10px] font-semibold text-slate-500">
                  {((user as any).studentCategory || "").toLowerCase() !== "college" && (user as any).studentCategory
                    ? [(user as any).studentCategory, (user as any).gradeLevel ? `Grade ${(user as any).gradeLevel}` : null].filter(Boolean).join(' · ')
                    : [(user as any).studentCategory, user.course, user.yearLevel].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mt-5">
          {[
            { label: "Visits", value: consultations.length.toString(), action: () => navigate("health-history") },
            { label: "Medications", value: medications.length.toString(), action: () => navigate("medications") },
            { label: "Documents", value: certificates.length.toString(), action: () => navigate("documents", { tab: "certificates" }) },
          ].map((s) => (
            <Pressable
              key={s.label}
              onPress={s.action}
              className="flex-1 active:opacity-90 overflow-hidden relative"
              style={{
                borderRadius: 24,
                paddingHorizontal: 6,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderTopColor: "rgba(255, 255, 255, 0.45)",
                borderLeftColor: "rgba(255, 255, 255, 0.3)",
                borderRightColor: "rgba(255, 255, 255, 0.2)",
                borderBottomColor: "rgba(255, 255, 255, 0.15)",
                shadowColor: "#0A2472",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <Text
                className="text-[28px] font-black text-white leading-none"
                style={{
                  fontFamily: "Outfit",
                  textShadowColor: "rgba(0, 0, 0, 0.35)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                {s.value}
              </Text>
              <Text
                className="text-sm font-bold text-white mt-1.5 tracking-tight text-center"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  textShadowColor: "rgba(0, 0, 0, 0.25)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}>
        <View className="flex-col gap-4 pb-12">
          {sections.map((section) => (
            <View key={section.title}>
              <View className="flex-row items-center justify-between mb-2 px-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-wider text-cura-900"
                  style={{
                    fontFamily: "Outfit",
                  }}
                >
                  {section.title}
                </Text>
                {section.action}
              </View>

              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#EEF2F6",
                  shadowColor: "#0A2540",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 14,
                  elevation: 2,
                  overflow: "hidden",
                }}
              >
                {section.items.map((item: any, i: number) => (
                  <Pressable
                    key={`${item.label}-${i}`}
                    onPress={item.onPress}
                    className="flex-row items-center gap-3.5 px-5 py-4 active:bg-slate-50"
                    style={
                      i > 0
                        ? {
                            borderTopWidth: 1,
                            borderTopColor: "#F1F5F9",
                          }
                        : undefined
                    }
                  >
                    <View className="w-6 items-center justify-center">
                      {renderInfoBlueIcon(item.label)}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-[15px] font-bold"
                        style={{
                          color: "#002D72",
                          fontFamily: "Outfit",
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.sub ? (
                        <Text
                          className="text-xs mt-0.5 font-medium text-slate-500"
                          numberOfLines={1}
                        >
                          {item.sub}
                        </Text>
                      ) : null}
                    </View>
                    <Svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8DA4C4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Polyline points="9 18 15 12 9 6" />
                    </Svg>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#EEF2F6",
              shadowColor: "#0A2540",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 14,
              elevation: 2,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={resetApp}
              className="flex-row items-center gap-3.5 px-5 py-4 active:bg-slate-50"
            >
              <View className="w-6 items-center justify-center">
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0056B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <Polyline points="16 17 21 12 16 7" />
                  <Line x1="21" y1="12" x2="9" y2="12" />
                </Svg>
              </View>
              <View className="flex-1">
                <Text
                  className="text-[15px] font-bold"
                  style={{
                    color: "#002D72",
                    fontFamily: "Outfit",
                  }}
                >
                  Sign Out
                </Text>
              </View>
              <Svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8DA4C4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </Pressable>
          </View>

          <View className="items-center flex-col gap-1.5 mt-6 mb-4">
            <View
              style={{
                borderRadius: 16,
                shadowColor: isDark ? "#000" : "#0A2540",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.15 : 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              <BlurView
                intensity={18}
                tint={isDark ? "dark" : "light"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderTopColor: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.5)",
                  borderLeftColor: isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.4)",
                  borderRightColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.22)",
                  borderBottomColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.15)",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.04)",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  position: "relative",
                }}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? ["rgba(255, 255, 255, 0.12)", "transparent"]
                      : ["rgba(255, 255, 255, 0.25)", "transparent"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.6 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Image
                  source={require("../../assets/images/cura-logo.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </BlurView>
            </View>
            <Text
              className="text-[11px] font-bold tracking-wide text-cura-900"
              style={{
                color: "#0B2136",
                fontFamily: "Outfit",
              }}
            >
              CURA · University Clinic Patient App
            </Text>
            <Text
              className="text-[10px] font-semibold"
              style={{
                color: "#002D72",
              }}
            >
              v1.0.0 · Your health, our priority
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 0. SINGLE FIELD EDIT MODAL (BLUE GRADIENT)                               */}
      {/* ========================================================================= */}
      <Modal
        visible={!!activeEditField}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEditField(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center items-center bg-black/60 px-5"
        >
          <View
            className="w-full max-w-sm rounded-[28px] overflow-hidden p-6"
            style={{
              borderWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.45)",
              borderLeftColor: "rgba(255, 255, 255, 0.3)",
              borderRightColor: "rgba(255, 255, 255, 0.2)",
              borderBottomColor: "rgba(255, 255, 255, 0.15)",
              shadowColor: "#0A2472",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={ADMIN_PORTAL_GRADIENT.colors}
              start={ADMIN_PORTAL_GRADIENT.start}
              end={ADMIN_PORTAL_GRADIENT.end}
              style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View className="flex-row items-center justify-between pb-3.5 border-b border-white/15 mb-4">
              <View className="flex-1 mr-2">
                <Text
                  className="text-lg font-black text-white"
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.35)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  Edit {activeEditField?.label}
                </Text>
                <Text className="text-[11px] font-medium text-white/70 mt-0.5">
                  Update your university clinic records
                </Text>
              </View>
              <Pressable
                onPress={() => setActiveEditField(null)}
                className="w-8 h-8 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
              >
                <Text className="text-white font-bold text-sm">✕</Text>
              </Pressable>
            </View>

            {/* Inputs */}
            {activeEditField?.options ? (
              <View className="mb-4">
                <Text className="text-xs font-bold text-white mb-2">Select {activeEditField.label}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {activeEditField.options.map((opt) => {
                    const isSelected = singleFieldValue === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setSingleFieldValue(opt)}
                        className={`px-4 py-2 rounded-full border ${
                          isSelected ? "bg-white border-white" : "bg-white/15 border-white/25"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-[#002D72]" : "text-white"
                          }`}
                          style={{ fontFamily: "Outfit" }}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-white mb-1.5">
                  {activeEditField?.label}
                </Text>
                <TextInput
                  value={singleFieldValue}
                  onChangeText={setSingleFieldValue}
                  placeholder={`Enter ${activeEditField?.label.toLowerCase()}...`}
                  placeholderTextColor="#94A3B8"
                  keyboardType={
                    activeEditField?.type === "phone"
                      ? "phone-pad"
                      : activeEditField?.type === "email"
                      ? "email-address"
                      : "default"
                  }
                  autoCapitalize={activeEditField?.type === "email" ? "none" : "words"}
                  className="bg-white rounded-2xl px-4 py-3 text-sm font-bold text-slate-800"
                />
              </View>
            )}

            {activeEditField?.secondLabel ? (
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-white mb-1.5">
                  {activeEditField.secondLabel}
                </Text>
                <TextInput
                  value={singleFieldSecondaryValue}
                  onChangeText={setSingleFieldSecondaryValue}
                  placeholder="Enter contact number..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  className="bg-white rounded-2xl px-4 py-3 text-sm font-bold text-slate-800"
                />
              </View>
            ) : null}

            {/* Actions */}
            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setActiveEditField(null)}
                className="flex-1 py-3 rounded-2xl bg-white/20 items-center justify-center active:bg-white/30"
              >
                <Text className="text-xs font-bold text-white" style={{ fontFamily: "Outfit" }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveSingleField}
                disabled={savingSingleField}
                className="flex-1 py-3 rounded-2xl bg-white items-center justify-center active:opacity-90 shadow-sm"
              >
                {savingSingleField ? (
                  <ActivityIndicator size="small" color="#002D72" />
                ) : (
                  <Text className="text-xs font-black text-[#002D72]" style={{ fontFamily: "Outfit" }}>
                    Save
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* 1. EDIT MY INFORMATION MODAL                                             */}
      {/* ========================================================================= */}
      <Modal visible={showInfoModal} transparent animationType="slide" onRequestClose={() => setShowInfoModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[36px] max-h-[88%] overflow-hidden">
            {/* Modal Header: Blue Gradient */}
            <View className="relative overflow-hidden px-6 pt-6 pb-4 border-b border-sky-100/60">
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text
                    className="text-lg font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Edit My Information
                  </Text>
                  <Text className="text-xs text-white/80 mt-0.5">
                    Syncs directly with University Clinic records
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowInfoModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center active:bg-white/30"
                >
                  <Text className="text-white font-bold text-sm">✕</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4 space-y-4" keyboardShouldPersistTaps="handled">
              {/* ID Number */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">ID Number</Text>
                <TextInput
                  value={formId}
                  onChangeText={setFormId}
                  placeholder="e.g. 2024-00123"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Gender */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Gender</Text>
                <View className="flex-row gap-2">
                  {["Male", "Female"].map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setFormGender(g)}
                      className="px-4 py-2 rounded-xl border flex-1 items-center"
                      style={{
                        backgroundColor: formGender === g ? "#0EA5E9" : "#F8FAFC",
                        borderColor: formGender === g ? "#0EA5E9" : "#E2E8F0",
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: formGender === g ? "#FFFFFF" : "#475569" }}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Date of Birth */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Date of Birth</Text>
                <TextInput
                  value={formDob}
                  onChangeText={setFormDob}
                  placeholder="YYYY-MM-DD"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Contact Number */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Phone / Contact Details</Text>
                <TextInput
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="e.g. 09123456789"
                  keyboardType="phone-pad"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Email Address */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Email Address</Text>
                <TextInput
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="e.g. name@university.edu.ph"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Emergency Contact Name */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Emergency Contact Person</Text>
                <TextInput
                  value={formEmergencyName}
                  onChangeText={setFormEmergencyName}
                  placeholder="Full name of guardian / parent"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Emergency Contact Phone */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Emergency Contact Phone Number</Text>
                <TextInput
                  value={formEmergencyPhone}
                  onChangeText={setFormEmergencyPhone}
                  placeholder="e.g. 09987654321"
                  keyboardType="phone-pad"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              {/* Student Category Fields */}
              {cat === "student" && (
                <>
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-slate-600 mb-1.5">Student Level / Department</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["College", "Senior High", "Junior High", "Elementary"].map((sc) => (
                        <Pressable
                          key={sc}
                          onPress={() => {
                            setFormStudentCategory(sc);
                            if (sc !== "College") {
                              setFormCourse("");
                              setFormYearLevel("");
                            } else {
                              setFormGradeLevel("");
                            }
                          }}
                          className="px-3 py-1.5 rounded-full border"
                          style={{
                            backgroundColor: formStudentCategory === sc ? "#0EA5E9" : "#F8FAFC",
                            borderColor: formStudentCategory === sc ? "#0EA5E9" : "#E2E8F0",
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{ color: formStudentCategory === sc ? "#FFFFFF" : "#475569" }}
                          >
                            {sc}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* College: Course and Year Level */}
                  {(!formStudentCategory || formStudentCategory.toLowerCase().includes("college")) && (
                    <>
                      <View className="mb-3">
                        <Text className="text-xs font-bold text-slate-600 mb-1.5">Course / Strand</Text>
                        <TextInput
                          value={formCourse}
                          onChangeText={setFormCourse}
                          placeholder="e.g. BS Information Technology"
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                        />
                      </View>

                      <View className="mb-3">
                        <Text className="text-xs font-bold text-slate-600 mb-1.5">Year Level</Text>
                        <TextInput
                          value={formYearLevel}
                          onChangeText={setFormYearLevel}
                          placeholder="e.g. 1st Year, 2nd Year"
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                        />
                      </View>
                    </>
                  )}

                  {/* Non-College (Senior High, Junior High, Elementary): Grade Level */}
                  {formStudentCategory && !formStudentCategory.toLowerCase().includes("college") && (
                    <View className="mb-3">
                      <Text className="text-xs font-bold text-slate-600 mb-1.5">Grade Level</Text>
                      <TextInput
                        value={formGradeLevel}
                        onChangeText={setFormGradeLevel}
                        placeholder={formStudentCategory === "Senior High" ? "e.g. 11, 12" : "e.g. 7, 8, 9, 10"}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                      />
                    </View>
                  )}
                </>
              )}

              {/* Employee Fields */}
              {cat === "employee" && (
                <>
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-slate-600 mb-1.5">Job Position / Title</Text>
                    <TextInput
                      value={formPosition}
                      onChangeText={setFormPosition}
                      placeholder="e.g. Faculty Instructor, Administrative Staff"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                    />
                  </View>
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-slate-600 mb-1.5">Department / Office</Text>
                    <TextInput
                      value={formDepartment}
                      onChangeText={setFormDepartment}
                      placeholder="e.g. College of Computing"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                    />
                  </View>
                </>
              )}

              {/* Outsider Address */}
              {cat === "outsider" && (
                <View className="mb-3">
                  <Text className="text-xs font-bold text-slate-600 mb-1.5">Residential Address</Text>
                  <TextInput
                    value={formAddress}
                    onChangeText={setFormAddress}
                    placeholder="Barangay, City, Province"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                  />
                </View>
              )}

              {/* Cooldown Warning Notice */}
              <View className="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2 mb-2">
                <Text className="text-xs font-bold text-amber-800 mb-0.5">⚠️ 7-Day Edit Cooldown Policy</Text>
                <Text className="text-[11px] text-amber-700 leading-snug">
                  Once you save changes, this section will be locked for 7 days to maintain integrity in university clinic logs.
                </Text>
              </View>
            </ScrollView>

            <View className="p-6 pt-3 border-t border-slate-100 flex-row gap-3 bg-white">
              <Pressable
                onPress={() => setShowInfoModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveMyInfo}
                disabled={savingInfo}
                className="flex-1 py-3.5 rounded-2xl overflow-hidden items-center justify-center flex-row gap-2 relative active:opacity-90 shadow-sm"
                style={{
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
                {savingInfo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className="text-xs font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. NOTIFICATION PREFERENCES MODAL                                         */}
      {/* ========================================================================= */}
      <Modal visible={showNotifModal} transparent animationType="slide" onRequestClose={() => setShowNotifModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[36px] max-h-[85%] overflow-hidden">
            {/* Modal Header: Blue Gradient */}
            <View className="relative overflow-hidden px-6 pt-6 pb-4 border-b border-sky-100/60">
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text
                    className="text-lg font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Notification Preferences
                  </Text>
                  <Text className="text-xs text-white/80 mt-0.5">
                    Configure clinic alerts and reminders
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowNotifModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center active:bg-white/30"
                >
                  <Text className="text-white font-bold text-sm">✕</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4 space-y-3">
              {[
                {
                  label: "Medication Reminders",
                  desc: "Push reminders for scheduled doses and medicine intakes",
                  value: notifMedReminders,
                  onChange: setNotifMedReminders,
                },
                {
                  label: "Consultation & Queue Alerts",
                  desc: "Updates when doctor is ready and queue status moves",
                  value: notifConsultReminders,
                  onChange: setNotifConsultReminders,
                },
                {
                  label: "Clinic Advisories & Status",
                  desc: "Broadcasts on clinic opening, closing, and half-day hours",
                  value: notifAdvisories,
                  onChange: setNotifAdvisories,
                },
                {
                  label: "Sound & Tone Alerts",
                  desc: "Audible chime when emergency or critical alerts arrive",
                  value: notifSoundAlerts,
                  onChange: setNotifSoundAlerts,
                },
              ].map((item, idx) => (
                <View key={item.label} className={`flex-row items-center justify-between py-3 ${idx > 0 ? "border-t border-slate-100" : ""}`}>
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-slate-800">{item.label}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onChange}
                    trackColor={{ false: "#E2E8F0", true: "#0056B3" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}

              <View className="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2">
                <Text className="text-xs font-bold text-amber-800 mb-0.5">⚠️ 7-Day Edit Cooldown Policy</Text>
                <Text className="text-[11px] text-amber-700">
                  Saving changes will activate a 7-day cooldown before preferences can be edited again.
                </Text>
              </View>
            </ScrollView>

            <View className="p-6 pt-3 border-t border-slate-100 flex-row gap-3 bg-white">
              <Pressable
                onPress={() => setShowNotifModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveNotifPreferences}
                className="flex-1 py-3.5 rounded-2xl overflow-hidden items-center justify-center flex-row gap-2 relative active:opacity-90 shadow-sm"
                style={{
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
                <Text
                  className="text-xs font-black text-white"
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  Save Preferences
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. PROFILE PHOTO & DISPLAY NAME MODAL                                     */}
      {/* ========================================================================= */}
      <Modal visible={showMascotModal} transparent animationType="slide" onRequestClose={() => setShowMascotModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[36px] max-h-[88%] overflow-hidden">
            {/* Modal Header: Blue Gradient */}
            <View className="relative overflow-hidden px-6 pt-6 pb-4 border-b border-sky-100/60">
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text
                    className="text-lg font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Profile Photo & Display Name
                  </Text>
                  <Text className="text-xs text-white/80 mt-0.5">
                    Upload your photo and set preferred nickname
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowMascotModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center active:bg-white/30"
                >
                  <Text className="text-white font-bold text-sm">✕</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
              {/* Profile Photo Upload Section */}
              <Text className="text-xs font-bold text-slate-600 mb-3">Profile Photo</Text>
              <View className="items-center mb-5">
                <View className="relative mb-3">
                  {formAvatarUrl ? (
                    <Image
                      source={{ uri: formAvatarUrl }}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        borderWidth: 3,
                        borderColor: "#0056B3",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: "#0056B3",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 3,
                        borderColor: "#0056B3",
                        shadowColor: "#0056B3",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 10,
                        elevation: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 42,
                          fontWeight: "900",
                          fontFamily: "Outfit",
                        }}
                      >
                        {(formDisplayName || user.displayName || user.firstName || "U").trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handlePickImage}
                    className={`flex-row items-center gap-1.5 px-4 py-2 rounded-xl border ${
                      photoCooldown.active
                        ? "bg-slate-100 border-slate-200 opacity-60"
                        : "bg-sky-50 border-sky-200 active:bg-sky-100"
                    }`}
                  >
                    <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={photoCooldown.active ? "#64748B" : "#0056B3"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <Circle cx="12" cy="13" r="4" />
                    </Svg>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: photoCooldown.active ? "#64748B" : "#0056B3", fontFamily: "Outfit" }}
                    >
                      {photoCooldown.active ? `⏳ Photo (${photoCooldown.days}d)` : formAvatarUrl ? "Change Photo" : "Upload Image"}
                    </Text>
                  </Pressable>

                  {formAvatarUrl && (
                    <Pressable
                      onPress={handleRemoveImage}
                      className={`px-3 py-2 rounded-xl border items-center justify-center ${
                        photoCooldown.active
                          ? "bg-slate-100 border-slate-200 opacity-60"
                          : "bg-rose-50 border-rose-200 active:bg-rose-100"
                      }`}
                    >
                      <Text className="text-xs font-bold text-rose-600">Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-slate-600">Display Name / Preferred Nickname</Text>
                  {nameCooldown.active && (
                    <Text className="text-[10px] font-bold text-amber-600">
                      ⏳ {nameCooldown.days}d cooldown
                    </Text>
                  )}
                </View>
                <TextInput
                  value={formDisplayName}
                  onChangeText={(text) => {
                    if (nameCooldown.active) {
                      Alert.alert(
                        "Display Name Cooldown Active",
                        `Display name was recently modified. You can edit this again in ${nameCooldown.days} day(s) (available on ${nameCooldown.date}).`
                      );
                      return;
                    }
                    setFormDisplayName(text);
                  }}
                  editable={!nameCooldown.active}
                  placeholder="Enter preferred display name"
                  className={`border rounded-xl px-3.5 py-2.5 text-sm ${
                    nameCooldown.active
                      ? "bg-slate-100 border-slate-200 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
                {nameCooldown.active && (
                  <Text className="text-[11px] text-slate-400 mt-1">
                    Editable again on {nameCooldown.date}
                  </Text>
                )}
              </View>

              <View className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                <Text className="text-xs font-bold text-amber-800 mb-0.5">⚠️ 7-Day Edit Cooldown Policy</Text>
                <Text className="text-[11px] text-amber-700">
                  Profile photo and display name each have independent 7-day cooldowns. Updating one will not lock the other.
                </Text>
              </View>
            </ScrollView>

            <View className="p-6 pt-3 border-t border-slate-100 flex-row gap-3 bg-white">
              <Pressable
                onPress={() => setShowMascotModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveMascot}
                className="flex-1 py-3.5 rounded-2xl overflow-hidden items-center justify-center flex-row gap-2 relative active:opacity-90 shadow-sm"
                style={{
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
                <Text
                  className="text-xs font-black text-white"
                  style={{
                    fontFamily: "Outfit",
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. PRIVACY & SECURITY MODAL                                               */}
      {/* ========================================================================= */}
      <Modal visible={showSecurityModal} transparent animationType="slide" onRequestClose={() => setShowSecurityModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[36px] max-h-[88%] overflow-hidden">
            {/* Modal Header: Blue Gradient */}
            <View className="relative overflow-hidden px-6 pt-6 pb-4 border-b border-sky-100/60">
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text
                    className="text-lg font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Privacy & Security
                  </Text>
                  <Text className="text-xs text-white/80 mt-0.5">
                    Account password & security preferences
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowSecurityModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center active:bg-white/30"
                >
                  <Text className="text-white font-bold text-sm">✕</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Change Account Password</Text>

              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Current Password</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">New Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  secureTextEntry
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Confirm New Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  secureTextEntry
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Privacy & App Lock</Text>
              <View className="flex-row items-center justify-between py-3 border-t border-slate-100 mb-2">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-slate-800">Biometric / Face ID App Lock</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Require authentication upon opening the app</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={setBiometricsEnabled}
                  trackColor={{ false: "#E2E8F0", true: "#0056B3" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                <Text className="text-xs font-bold text-amber-800 mb-0.5">⚠️ 7-Day Edit Cooldown Policy</Text>
                <Text className="text-[11px] text-amber-700">
                  Password and security changes are subject to a 7-day cooldown to prevent unauthorized tampering.
                </Text>
              </View>
            </ScrollView>

            <View className="p-6 pt-3 border-t border-slate-100 flex-row gap-3 bg-white">
              <Pressable
                onPress={() => setShowSecurityModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveSecurity}
                disabled={savingSecurity}
                className="flex-1 py-3.5 rounded-2xl overflow-hidden items-center justify-center flex-row gap-2 relative active:opacity-90 shadow-sm"
                style={{
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
                {savingSecurity ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className="text-xs font-black text-white"
                    style={{
                      fontFamily: "Outfit",
                      textShadowColor: "rgba(0, 0, 0, 0.25)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. ABOUT CURA MODAL                                                       */}
      {/* ========================================================================= */}
      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View
            className="bg-white rounded-[32px] p-6 w-full max-h-[80%]"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
            }}
          >
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-2xl bg-sky-50 items-center justify-center mb-2 p-2">
                <Image
                  source={require("../../assets/images/cura-logo.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-xl font-black text-[#0B2136]" style={{ fontFamily: "Outfit" }}>CURA e-Health</Text>
              <Text
                className="text-xs font-bold"
                style={{
                  color: "#002D72",
                  fontFamily: "Outfit",
                }}
              >
                Version 1.0.0 (Production)
              </Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Clinical Unified Records & Access</Text>
            </View>

            <ScrollView className="py-2" showsVerticalScrollIndicator={false}>
              <View className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100">
                <Text className="text-xs font-bold text-slate-700 mb-1">About the Platform</Text>
                <Text className="text-xs text-slate-500 leading-relaxed">
                  CURA is the dedicated electronic health and clinic management platform of the University of the Assumption Medical-Dental Clinic in the City of San Fernando, Pampanga. It delivers seamless healthcare access to students, faculty, and administrative staff.
                </Text>
              </View>

              <View className="space-y-2 mb-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Clinic Information</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm">🏥</Text>
                  <Text className="text-xs text-slate-600 font-medium">UA Medical-Dental Clinic, Archbishop Emilio Cinense Gym Ground Floor</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm">⏰</Text>
                  <Text className="text-xs text-slate-600 font-medium">Operating Hours: Monday – Friday, 8:00 AM – 5:00 PM</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm">☎️</Text>
                  <Text className="text-xs text-slate-600 font-medium">Clinic Hotline: (045) 961-3617 local 115</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm">📧</Text>
                  <Text className="text-xs text-slate-600 font-medium">clinic@ua.edu.ph</Text>
                </View>
              </View>

              <View className="p-3 bg-sky-50 rounded-xl border border-sky-100 mb-2">
                <Text className="text-[11px] font-semibold text-sky-900 text-center">
                  “Your health, our priority — committed to compassionate Assumptionist care.” 💙
                </Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setShowAboutModal(false)}
              className="mt-4 py-3.5 rounded-2xl overflow-hidden items-center justify-center relative active:opacity-90 shadow-sm"
              style={{
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
              <Text
                className="text-xs font-black text-white"
                style={{
                  fontFamily: "Outfit",
                  textShadowColor: "rgba(0, 0, 0, 0.25)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
