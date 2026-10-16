import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";

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

function to24Hour(time12: string): string {
  if (!time12) return "";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : "";
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function to12Hour(time24: string): string {
  if (!time24) return "";
  const match = time24.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time24;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

function addHours(time12: string, hoursToAdd: number): string {
  const d = parseSingleTimeToDate(time12);
  d.setHours(d.getHours() + hoursToAdd);
  return formatDateToTimeString(d);
}

export function LiquidGlassTimePicker({
  value,
  onChange,
  label = "Preferred Time",
}: LiquidGlassTimePickerProps) {
  const parts = value ? value.split(/\s*(?:-|to)\s*/i) : [];
  const startTime = parts[0]?.trim() || "";
  const endTime = parts[1]?.trim() || "";

  const [activeTarget, setActiveTarget] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleTimeChange = (target: "start" | "end", newTimeStr: string) => {
    if (!newTimeStr) return;
    if (target === "start") {
      const newEnd = endTime || addHours(newTimeStr, 4);
      onChange(`${newTimeStr} - ${newEnd}`);
    } else {
      const newStart = startTime || "8:00 AM";
      onChange(`${newStart} - ${newTimeStr}`);
    }
  };

  const handleOpenPicker = (target: "start" | "end") => {
    const currentStr = target === "start" ? startTime : endTime;
    setTempDate(parseSingleTimeToDate(currentStr || (target === "start" ? "2:00 PM" : "6:00 PM")));
    setActiveTarget(target);
  };

  const handleAndroidChange = (event: any, selectedDate?: Date) => {
    const target = activeTarget;
    setActiveTarget(null);
    if (event.type === "set" && selectedDate && target) {
      handleTimeChange(target, formatDateToTimeString(selectedDate));
    }
  };

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
        {label}
      </Text>

      {/* From & To Cards */}
      <View className="flex-row gap-2.5">
        {/* From Time Card */}
        <View className="flex-1 relative">
          <TouchableOpacity
            onPress={() => Platform.OS !== "web" && handleOpenPicker("start")}
            activeOpacity={Platform.OS === "web" ? 1 : 0.75}
            className="w-full bg-white border rounded-2xl p-3 flex-row items-center gap-2.5"
            style={{
              borderColor: startTime ? "#3B82F6" : "#E2E8F0",
              backgroundColor: startTime ? "#EFF6FF" : "#FFFFFF",
              elevation: 1,
              shadowColor: "#0A2472",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
            }}
          >
            <View
              className="w-9 h-9 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: startTime ? "#DBEAFE" : "#F8FAFC",
                borderColor: startTime ? "#BFDBFE" : "#E2E8F0",
              }}
            >
              <Text className="text-base">🕒</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                From
              </Text>
              <Text
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit" }}
                numberOfLines={1}
              >
                {startTime || "Select Time"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Web Native Time Input Overlay */}
          {Platform.OS === "web" &&
            React.createElement("input", {
              type: "time",
              value: to24Hour(startTime),
              onChange: (e: any) => handleTimeChange("start", to12Hour(e.target.value)),
              onClick: (e: any) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (_) {}
              },
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                zIndex: 10,
              },
            })}
        </View>

        {/* To Time Card */}
        <View className="flex-1 relative">
          <TouchableOpacity
            onPress={() => Platform.OS !== "web" && handleOpenPicker("end")}
            activeOpacity={Platform.OS === "web" ? 1 : 0.75}
            className="w-full bg-white border rounded-2xl p-3 flex-row items-center gap-2.5"
            style={{
              borderColor: endTime ? "#6366F1" : "#E2E8F0",
              backgroundColor: endTime ? "#EEF2FF" : "#FFFFFF",
              elevation: 1,
              shadowColor: "#0A2472",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
            }}
          >
            <View
              className="w-9 h-9 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: endTime ? "#E0E7FF" : "#F8FAFC",
                borderColor: endTime ? "#C7D2FE" : "#E2E8F0",
              }}
            >
              <Text className="text-base">⌛</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                To
              </Text>
              <Text
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit" }}
                numberOfLines={1}
              >
                {endTime || "Select Time"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Web Native Time Input Overlay */}
          {Platform.OS === "web" &&
            React.createElement("input", {
              type: "time",
              value: to24Hour(endTime),
              onChange: (e: any) => handleTimeChange("end", to12Hour(e.target.value)),
              onClick: (e: any) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (_) {}
              },
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                zIndex: 10,
              },
            })}
        </View>
      </View>

      {/* Android Native Picker Dialog */}
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
                maxWidth: 340,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 20,
                elevation: 10,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                  {activeTarget === "start" ? "Select Start Time" : "Select End Time"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleTimeChange(activeTarget, formatDateToTimeString(tempDate));
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
    </View>
  );
}
