import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Animated,
  KeyboardAvoidingView, Platform, Modal
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../components/AlertProvider";
import Svg, { Polyline } from "react-native-svg";
import { AppUser, PatientCategory, Screen } from "../types";
import { MASCOTS } from "../data";
import { PH_REGIONS } from "../constants/phLocations";

interface NavProps {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  user: Partial<AppUser>;
  setUser: React.Dispatch<React.SetStateAction<Partial<AppUser>>>;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function OnboardProgress({ step, total }: { step: number; total: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="px-6 py-4 flex-row gap-1" style={{ paddingTop: Math.max(insets.top, 24) + 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-[#0B2136]" : "bg-[#0B2136]/20"}`} />
      ))}
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength, autoCapitalize }: any) {
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
        autoCapitalize={autoCapitalize}
        className="w-full bg-[#F8FAFC] rounded-[32px] px-5 py-4 text-sm font-bold text-slate-800"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
      />
    </View>
  );
}

function DatePickerField({ label, value, onChange, placeholder = "Select Birthday" }: any) {
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
    <View className="mb-4 w-full">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        className="w-full bg-[#F8FAFC] rounded-[32px] px-5 py-4 flex-row items-center justify-between"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
      >
        <Text className={`text-sm font-bold ${value ? "text-slate-800" : "text-slate-400"}`}>
          {value || placeholder}
        </Text>
        <Text className="text-base">📅</Text>
      </Pressable>

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
        <Modal visible={showPicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white rounded-t-[32px] p-6 pb-10">
              <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <Text className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit" }}>Select Birthday</Text>
                <Pressable onPress={handleIOSDone} className="bg-[#0B2136] px-4 py-2 rounded-full">
                  <Text className="text-white text-xs font-bold">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, d) => { if (d) setTempDate(d); }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function LocationModalPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  allowCustom = true,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
  allowCustom?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) => o.toLowerCase().includes(search.toLowerCase().trim()));
  }, [options, search]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-[32px] max-h-[75%] p-6 pb-8">
          <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <Text className="text-lg font-black text-[#0B2136]" style={{ fontFamily: "Outfit" }}>{title}</Text>
            <Pressable onPress={() => { setSearch(""); onClose(); }} className="p-2">
              <Text className="text-slate-400 font-bold text-sm">Close</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Search location..."
            placeholderTextColor="#CBD5E1"
            value={search}
            onChangeText={setSearch}
            className="w-full bg-[#F8FAFC] rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 mb-3"
          />

          <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
            {filtered.map((item) => {
              const isSel = item === selected;
              return (
                <Pressable
                  key={item}
                  onPress={() => { onSelect(item); setSearch(""); onClose(); }}
                  className={`py-3.5 px-4 rounded-xl flex-row items-center justify-between mb-1 ${isSel ? "bg-[#0B2136]/10" : "bg-transparent"}`}
                >
                  <Text className={`text-sm font-bold ${isSel ? "text-[#0B2136]" : "text-slate-700"}`}>{item}</Text>
                  {isSel && <Text className="text-[#0B2136] font-bold">✓</Text>}
                </Pressable>
              );
            })}

            {allowCustom && search.trim().length > 0 && !filtered.includes(search.trim()) && (
              <Pressable
                onPress={() => { onSelect(search.trim()); setSearch(""); onClose(); }}
                className="py-3.5 px-4 rounded-xl bg-blue-50 border border-blue-200 mt-2 flex-row items-center justify-between"
              >
                <Text className="text-sm font-bold text-[#0B2136]">Use "{search.trim()}"</Text>
                <Text className="text-xs text-blue-600 font-bold">Select ➔</Text>
              </Pressable>
            )}

            {filtered.length === 0 && (!allowCustom || !search.trim()) && (
              <View className="py-8 items-center">
                <Text className="text-slate-400 text-sm font-medium">No results found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SelectRow({ label, value, onPress, placeholder }: any) {
  return (
    <View className="mb-3.5 w-full">
      <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</Text>
      <Pressable
        onPress={onPress}
        className="w-full bg-[#F8FAFC] rounded-[32px] px-5 py-4 flex-row items-center justify-between"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
      >
        <Text className={`text-sm font-bold flex-1 pr-2 ${value ? "text-slate-800" : "text-slate-400"}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text className="text-slate-400 text-xs font-bold">▼</Text>
      </Pressable>
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
              className={`px-4 py-3 rounded-full border ${isSelected ? "bg-[#0B2136] border-[#0B2136]" : "bg-white border-transparent"}`}
              style={isSelected ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
            >
              <Text className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-600"}`}>
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
      className={`rounded-full items-center justify-center py-4 ${disabled ? "bg-slate-200" : "bg-[#0B2136]"} ${fullWidth ? "w-full" : "px-8"} ${className}`}
      style={!disabled && !loading ? { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 } : {}}
    >
      {loading ? (
        <Text className="text-white font-black tracking-wider text-base">Wait...</Text>
      ) : (
        <Text className={`font-black tracking-wider text-base ${disabled ? "text-slate-400" : "text-white"}`}>{children}</Text>
      )}
    </Pressable>
  );
}

// ── Basic Info (Name, Contact, DOB, Sex, Emergency) ───────────────────────────

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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#E4F4FB]">
      <OnboardProgress step={1} total={3} />
      <View className="px-6 py-2 mb-4">
        <Text className="text-[28px] font-black text-[#0B2136] tracking-tight mb-1" style={{ fontFamily: "Outfit" }}>Basic Info</Text>
        <Text className="text-[#0B2136]/60 text-sm font-bold">Tell us about yourself</Text>
      </View>
      <View className="flex-1 bg-white rounded-t-[40px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 10 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 4 }}>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="First name"
                placeholder="JUAN"
                value={form.firstName}
                autoCapitalize="characters"
                onChangeText={(v: string) => setForm((f) => ({ ...f, firstName: v.toUpperCase() }))}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Last name"
                placeholder="DELA CRUZ"
                value={form.lastName}
                autoCapitalize="characters"
                onChangeText={(v: string) => setForm((f) => ({ ...f, lastName: v.toUpperCase() }))}
              />
            </View>
          </View>

          <Input
            label="Contact Number"
            placeholder="09XXXXXXXXX"
            value={form.contact}
            keyboardType="phone-pad"
            maxLength={11}
            onChangeText={(v: string) => setForm((f) => ({ ...f, contact: v.replace(/[^0-9]/g, "") }))}
          />

          <DatePickerField
            label="Birthday"
            value={form.dob}
            onChange={(v: string) => setForm((f) => ({ ...f, dob: v }))}
          />

          <Select label="Sex" value={form.sex} options={sexes} onValueChange={(v: string) => setForm((f) => ({ ...f, sex: v }))} />
          
          <View className="mt-4 mb-4">
            <Text className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "Outfit" }}>Emergency Contact</Text>
          </View>
          <Input
            label="Emergency Contact Name"
            placeholder="NAME"
            value={form.emergencyName}
            autoCapitalize="characters"
            onChangeText={(v: string) => setForm((f) => ({ ...f, emergencyName: v.toUpperCase() }))}
          />
          <Input
            label="Emergency Contact No."
            placeholder="09XXXXXXXXX"
            value={form.emergencyPhone}
            keyboardType="phone-pad"
            maxLength={11}
            onChangeText={(v: string) => setForm((f) => ({ ...f, emergencyPhone: v.replace(/[^0-9]/g, "") }))}
          />

          <Button
            fullWidth
            onPress={() => {
              setUser((u) => ({
                ...u,
                ...form,
                firstName: form.firstName.trim().toUpperCase(),
                lastName: form.lastName.trim().toUpperCase(),
                emergencyName: form.emergencyName.trim().toUpperCase(),
                gender: form.sex,
                phone: form.contact
              }));
              navigate("onboard-academic");
            }}
            disabled={!isValid}
            className="mb-8 mt-2"
          >
            Continue
          </Button>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Category Specific Info (Student, Employee, or eGov-style Address for Outsider) ─

export function AcademicInfoScreen({ navigate, user, setUser }: NavProps) {
  const rawCat = (user.category || (user.email?.endsWith(".student@ua.edu.ph") ? "student" : user.email?.endsWith("@ua.edu.ph") ? "employee" : "outsider")).toLowerCase();
  const category = rawCat === "student" || rawCat === "employee" ? rawCat : "outsider";

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

  // eGov Address Selector State (No GPS needed)
  const [selectedRegion, setSelectedRegion] = useState("Region III (Central Luzon)");
  const [selectedProvince, setSelectedProvince] = useState("Pampanga");
  const [selectedCity, setSelectedCity] = useState("City of San Fernando");
  const [selectedBarangay, setSelectedBarangay] = useState("Dolores");
  const [street, setStreet] = useState("");

  const [modalType, setModalType] = useState<"region" | "province" | "city" | "barangay" | null>(null);

  // Derive available options based on selections
  const currentRegionObj = useMemo(() => {
    return PH_REGIONS.find((r) => r.name === selectedRegion) || PH_REGIONS[0];
  }, [selectedRegion]);

  const provinceOptions = useMemo(() => {
    return currentRegionObj.provinces.map((p) => p.name);
  }, [currentRegionObj]);

  const currentProvinceObj = useMemo(() => {
    return currentRegionObj.provinces.find((p) => p.name === selectedProvince) || currentRegionObj.provinces[0];
  }, [currentRegionObj, selectedProvince]);

  const cityOptions = useMemo(() => {
    return currentProvinceObj?.cities.map((c) => c.name) || [];
  }, [currentProvinceObj]);

  const currentCityObj = useMemo(() => {
    return currentProvinceObj?.cities.find((c) => c.name === selectedCity);
  }, [currentProvinceObj, selectedCity]);

  const barangayOptions = useMemo(() => {
    return currentCityObj?.barangays || [
      "Dolores", "San Agustin", "San Jose", "Del Pilar", "Sindalan",
      "Telabastagan", "Saguin", "Juliana", "Poblacion", "San Nicolas"
    ];
  }, [currentCityObj]);

  // Keep form.address in sync for outsiders
  useEffect(() => {
    if (category === "outsider") {
      const parts = [];
      if (street.trim()) parts.push(street.trim());
      if (selectedBarangay.trim()) parts.push(`Brgy. ${selectedBarangay.trim()}`);
      if (selectedCity.trim()) parts.push(selectedCity.trim());
      if (selectedProvince.trim()) parts.push(selectedProvince.trim());
      const full = parts.join(", ");
      setForm((f) => ({ ...f, address: full }));
    }
  }, [category, street, selectedBarangay, selectedCity, selectedProvince]);

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
    if (category === "outsider") {
      return !!(selectedBarangay && selectedCity && selectedProvince && street.trim().length >= 2);
    }
    return true;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#E4F4FB]">
      <OnboardProgress step={2} total={3} />
      <View className="px-6 py-2 mb-4">
        <Text className="text-[28px] font-black text-[#0B2136] tracking-tight mb-1" style={{ fontFamily: "Outfit" }}>
          {category === "student" ? "Student Info" : category === "employee" ? "Employee Info" : "Address"}
        </Text>
        <Text className="text-[#0B2136]/60 text-sm font-bold">
          {category === "outsider" ? "Select your location (eGov style)" : "Please provide your details below"}
        </Text>
      </View>
      <View className="flex-1 bg-white rounded-t-[40px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 10 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 12 }}>

          {category === "student" && (
            <>
              <Input label="Student ID" placeholder="STU-XXXX" value={form.id_number} onChangeText={(v: string) => setForm(f => ({ ...f, id_number: v }))} />
              <Select label="Student Category" value={form.studentCategory} options={studentCats} onValueChange={(v: string) => setForm(f => ({ ...f, studentCategory: v }))} />
              {isMinor && <Input label="Grade Level" placeholder="Grade 7" value={form.gradeLevel} onChangeText={(v: string) => setForm(f => ({ ...f, gradeLevel: v }))} />}
              {isMinor && <Input label="Guardian Name" placeholder="NAME" value={form.guardianName} autoCapitalize="characters" onChangeText={(v: string) => setForm(f => ({ ...f, guardianName: v.toUpperCase() }))} />}
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
            <View className="w-full">
              <SelectRow
                label="Region"
                value={selectedRegion}
                onPress={() => setModalType("region")}
              />

              <SelectRow
                label="Province"
                value={selectedProvince}
                onPress={() => setModalType("province")}
              />

              <SelectRow
                label="City / Municipality"
                value={selectedCity}
                onPress={() => setModalType("city")}
              />

              <SelectRow
                label="Barangay"
                value={selectedBarangay}
                onPress={() => setModalType("barangay")}
              />

              <Input
                label="House No. / Street / Village"
                placeholder="e.g. 123 MacArthur Hwy, Villa Angela"
                value={street}
                onChangeText={setStreet}
              />

              <View className="mt-1 mb-4 p-4 rounded-2xl bg-[#0B2136]/5 border border-[#0B2136]/10">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">📍 Address Preview</Text>
                <Text className="text-sm font-bold text-slate-800 leading-snug">
                  {form.address || "Please select and fill your address details"}
                </Text>
              </View>
            </View>
          )}

          <Button
            fullWidth
            onPress={() => {
              setUser((u) => ({
                ...u,
                ...form,
                guardianName: form.guardianName.trim().toUpperCase(),
                category: category as PatientCategory
              }));
              navigate("onboard-avatar");
            }}
            disabled={!isValid()}
            className="mt-4 mb-8"
          >
            Continue
          </Button>
        </ScrollView>
      </View>

      {/* Location Selector Modals */}
      <LocationModalPicker
        visible={modalType === "region"}
        title="Select Region"
        options={PH_REGIONS.map((r) => r.name)}
        selected={selectedRegion}
        onSelect={(reg) => {
          setSelectedRegion(reg);
          const regObj = PH_REGIONS.find((r) => r.name === reg);
          if (regObj && regObj.provinces.length > 0) {
            setSelectedProvince(regObj.provinces[0].name);
            if (regObj.provinces[0].cities.length > 0) {
              setSelectedCity(regObj.provinces[0].cities[0].name);
            }
          }
        }}
        onClose={() => setModalType(null)}
      />

      <LocationModalPicker
        visible={modalType === "province"}
        title="Select Province"
        options={provinceOptions}
        selected={selectedProvince}
        onSelect={(prov) => {
          setSelectedProvince(prov);
          const provObj = currentRegionObj.provinces.find((p) => p.name === prov);
          if (provObj && provObj.cities.length > 0) {
            setSelectedCity(provObj.cities[0].name);
          }
        }}
        onClose={() => setModalType(null)}
      />

      <LocationModalPicker
        visible={modalType === "city"}
        title="Select City / Municipality"
        options={cityOptions}
        selected={selectedCity}
        onSelect={(ct) => {
          setSelectedCity(ct);
        }}
        onClose={() => setModalType(null)}
      />

      <LocationModalPicker
        visible={modalType === "barangay"}
        title="Select Barangay"
        options={barangayOptions}
        selected={selectedBarangay}
        onSelect={(brgy) => {
          setSelectedBarangay(brgy);
        }}
        onClose={() => setModalType(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function AvatarScreen({ navigate, user, setUser }: NavProps) {
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<string>("");
  const [displayName, setDisplayName] = useState((user.firstName || "").toUpperCase());
  const [loading, setLoading] = useState(false);

  const mascot = MASCOTS.find((m) => m.id === selected);

  const handleComplete = async () => {
    setLoading(true);
    
    // Retrieve token safely from user state or AsyncStorage
    const storedToken = await AsyncStorage.getItem('@cura_access_token').catch(() => null);
    const token = user.accessToken || (storedToken ?? undefined);

    // Merge final user state
    const finalUser = {
      ...user,
      avatarId: selected,
      avatarColor: mascot?.color || "#0994E8",
      avatarEmoji: mascot?.emoji || "🩺",
      displayName: (displayName || user.firstName || "").trim().toUpperCase(),
      accessToken: token,
    };
    
    setUser(finalUser);

    // Calculate age from birthday
    let age = 0;
    if (finalUser.dob) {
      const bdate = new Date(finalUser.dob);
      if (!isNaN(bdate.getTime())) {
        const now = new Date();
        age = now.getFullYear() - bdate.getFullYear();
        const m = now.getMonth() - bdate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < bdate.getDate())) {
          age--;
        }
      }
    }

    const catStr = (finalUser.category || "outsider").toLowerCase();
    const formattedCategory = catStr === "student" ? "Student" : catStr === "employee" ? "Employee" : "Outsider";

    // Prepare payload matching CompleteProfileView
    const payload: any = {
      name: `${finalUser.firstName || ''} ${finalUser.lastName || ''}`.trim().toUpperCase(),
      category: formattedCategory,
      contact: finalUser.phone,
      birthday: finalUser.dob,
      age: Math.max(0, age),
      sex: finalUser.gender,
      emergencyContact: (finalUser.emergencyName || "").trim().toUpperCase(),
      emergencyPhone: finalUser.emergencyPhone,
      studentCategory: finalUser.studentCategory,
      course: finalUser.course,
      yearLevel: finalUser.yearLevel,
      gradeLevel: finalUser.gradeLevel,
      guardianName: (finalUser.guardianName || "").trim().toUpperCase(),
      position: finalUser.position,
      department: finalUser.department,
      address: finalUser.address,
    };

    if (finalUser.id_number && finalUser.id_number.trim()) {
      payload.id = finalUser.id_number.trim();
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("https://cura-backend-dvj5.onrender.com/api/auth/complete-profile/", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await AsyncStorage.setItem('@cura_user_session', JSON.stringify(finalUser)).catch(() => {});
        navigate("onboard-complete");
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("Failed to complete profile:", res.status, errData);
        if (res.status === 401) {
          showAlert("Authentication Required", "Your login session expired. Please log in again to continue.");
        } else {
          showAlert("Error", errData.detail || errData.error || "Failed to save profile. Please try again.");
        }
      }
    } catch (e) {
      showAlert("Error", "Network Error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#E4F4FB]">
      <OnboardProgress step={3} total={3} />
      <View className="px-6 py-2 mb-4">
        <Text className="text-[28px] font-black text-[#0B2136] tracking-tight mb-1" style={{ fontFamily: "Outfit" }}>Choose avatar</Text>
        <Text className="text-[#0B2136]/60 text-sm font-bold">Pick a companion for your health journey</Text>
      </View>
      <View className="flex-1 bg-white rounded-t-[40px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 10 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
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
            autoCapitalize="characters"
            onChangeText={(v: string) => setDisplayName(v.toUpperCase())}
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
    </KeyboardAvoidingView>
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
      colors={['#0B2136', '#0B2136']}
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
      <Text className="text-3xl font-black text-white text-center mb-3" style={{ fontFamily: "Outfit" }}>
        Welcome, {(user.displayName || user.firstName || "").toUpperCase()}! 🎉
      </Text>
      <Text className="text-[#E4F4FB] text-center text-sm mb-10 leading-relaxed">
        Your CURA account is all set. Access your health records, track medications, and manage your clinic visits — all in one place.
      </Text>
      <LinearGradient
        colors={['#E4F4FB', '#E4F4FB']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        className="rounded-full overflow-hidden"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 }}
      >
        <Pressable onPress={() => navigate("home")} className="py-4 px-10">
          <Text className="text-[#0B2136] font-black tracking-widest text-base">Open Dashboard →</Text>
        </Pressable>
      </LinearGradient>
    </LinearGradient>
  );
}
