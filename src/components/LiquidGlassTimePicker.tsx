import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

// Safely import native DateTimePicker only on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {
    DateTimePicker = null;
  }
}

interface LiquidGlassTimePickerProps {
  value: string; // e.g. "2:00 PM - 6:00 PM"
  onChange: (timeStr: string) => void;
  label?: string;
}

const COMMON_PRESETS = [
  "2:00 PM - 6:00 PM",
  "8:00 AM - 12:00 PM",
  "1:00 PM - 5:00 PM",
  "9:00 AM - 11:00 AM",
];

function parseSingleTimeToDate(timeStr?: string): Date {
  const d = new Date();
  if (!timeStr) return d;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return d;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3] ? match[3].toUpperCase() : null;

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDateToTimeString(d: Date): string {
  let h = d.getHours();
  const min = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

export function LiquidGlassTimePicker({
  value,
  onChange,
  label = "Preferred Time Window",
}: LiquidGlassTimePickerProps) {
  // Parse current value into start and end strings
  const parts = value ? value.split(/\s*(?:-|to)\s*/i) : [];
  const startTime = parts[0]?.trim() || "";
  const endTime = parts[1]?.trim() || "";

  // Picker state
  const [activeTarget, setActiveTarget] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleOpenPicker = (target: "start" | "end") => {
    const currentStr = target === "start" ? startTime : endTime;
    setTempDate(parseSingleTimeToDate(currentStr || (target === "start" ? "2:00 PM" : "6:00 PM")));
    setActiveTarget(target);
  };

  const handleTimeSelected = (selectedDate: Date) => {
    const formatted = formatDateToTimeString(selectedDate);
    if (activeTarget === "start") {
      const newEnd = endTime || (formatDateToTimeString(new Date(selectedDate.getTime() + 4 * 60 * 60 * 1000)));
      onChange(`${formatted} - ${newEnd}`);
    } else if (activeTarget === "end") {
      const newStart = startTime || "8:00 AM";
      onChange(`${newStart} - ${formatted}`);
    }
  };

  // Android time picker handler
  const handleAndroidChange = (event: any, selectedDate?: Date) => {
    setActiveTarget(null);
    if (event.type === "set" && selectedDate) {
      handleTimeSelected(selectedDate);
    }
  };

  return (
    <View className="flex-col gap-2">
      <View className="flex-row items-center justify-between pl-1">
        <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-[11px] font-semibold text-rose-500">Reset Time</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* From & To Cards */}
      <View className="flex-row gap-2.5">
        {/* Start Time Card */}
        <TouchableOpacity
          onPress={() => handleOpenPicker("start")}
          activeOpacity={0.75}
          className="flex-1 bg-white/95 border rounded-[20px] p-3.5 flex-row items-center justify-between"
          style={{
            borderColor: startTime ? "#3B82F6" : "#E2E8F0",
            backgroundColor: startTime ? "rgba(239, 246, 255, 0.6)" : "#FFFFFF",
            elevation: 2,
            shadowColor: "#0A2472",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center">
              <Text className="text-base">🕒</Text>
            </View>
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                From (Start)
              </Text>
              <Text className="text-sm font-black text-slate-900" style={{ fontFamily: "Outfit" }}>
                {startTime || "Select Time"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* End Time Card */}
        <TouchableOpacity
          onPress={() => handleOpenPicker("end")}
          activeOpacity={0.75}
          className="flex-1 bg-white/95 border rounded-[20px] p-3.5 flex-row items-center justify-between"
          style={{
            borderColor: endTime ? "#6366F1" : "#E2E8F0",
            backgroundColor: endTime ? "rgba(238, 242, 255, 0.6)" : "#FFFFFF",
            elevation: 2,
            shadowColor: "#0A2472",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center">
              <Text className="text-base">⌛</Text>
            </View>
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                To (End)
              </Text>
              <Text className="text-sm font-black text-slate-900" style={{ fontFamily: "Outfit" }}>
                {endTime || "Select Time"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Selection Presets */}
      <View className="flex-row flex-wrap gap-1.5 pt-1">
        {COMMON_PRESETS.map((preset) => {
          const isSelected = value === preset;
          return (
            <TouchableOpacity
              key={preset}
              onPress={() => onChange(preset)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: isSelected ? "#0A2472" : "#FFFFFF",
                borderColor: isSelected ? "#0A2472" : "#E2E8F0",
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{
                  color: isSelected ? "#FFFFFF" : "#475569",
                  fontFamily: "Outfit",
                }}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Time Window Display Banner */}
      {value ? (
        <View className="flex-row items-center justify-between px-3.5 py-2 bg-blue-50/80 rounded-xl border border-blue-100/90 mt-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs">✨</Text>
            <Text className="text-xs font-bold text-blue-900">
              Selected Window: <Text className="font-black text-blue-700">{value}</Text>
            </Text>
          </View>
        </View>
      ) : null}

      {/* Android Native Picker */}
      {Platform.OS === "android" && activeTarget && DateTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS Modal with Spinner */}
      {Platform.OS === "ios" && activeTarget && (
        <Modal
          visible={Boolean(activeTarget)}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveTarget(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(3, 10, 26, 0.65)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 360,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                  {activeTarget === "start" ? "Select Start Time" : "Select End Time"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleTimeSelected(tempDate);
                    setActiveTarget(null);
                  }}
                  className="bg-blue-600 px-4 py-1.5 rounded-xl"
                >
                  <Text className="text-xs font-bold text-white">Done</Text>
                </TouchableOpacity>
              </View>

              {DateTimePicker ? (
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={(_: any, d?: Date) => {
                    if (d) setTempDate(d);
                  }}
                  style={{ height: 180, width: "100%" }}
                />
              ) : null}
            </View>
          </View>
        </Modal>
      )}

      {/* Web fallback modal (safe for browser testing) */}
      {Platform.OS === "web" && activeTarget && (
        <Modal
          visible={Boolean(activeTarget)}
          transparent
          onRequestClose={() => setActiveTarget(null)}
        >
          <Pressable
            onPress={() => setActiveTarget(null)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 20,
                width: "100%",
                maxWidth: 320,
              }}
            >
              <Text className="text-sm font-bold text-slate-900 mb-3" style={{ fontFamily: "Outfit" }}>
                {activeTarget === "start" ? "Choose Start Time" : "Choose End Time"}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      const d = parseSingleTimeToDate(t);
                      handleTimeSelected(d);
                      setActiveTarget(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200"
                  >
                    <Text className="text-xs font-bold text-slate-800">{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => setActiveTarget(null)}
                className="w-full py-2 bg-blue-600 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-white">Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
