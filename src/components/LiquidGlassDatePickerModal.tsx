import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Polyline } from "react-native-svg";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  title?: string;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function LiquidGlassDatePickerModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = "Select Preferred Date",
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tempSelected, setTempSelected] = useState(selectedDate || "");

  useEffect(() => {
    if (visible) {
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const [y, m] = selectedDate.split("-").map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
        setTempSelected(selectedDate);
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setTempSelected("");
      }
    }
  }, [visible, selectedDate]);

  const prevMonth = () => {
    if (viewYear === today.getFullYear() && viewMonth <= today.getMonth()) {
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Create grid cells (empty slots for offset + actual day numbers)
  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const handleDayPress = (day: number) => {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateFormatted = `${yStr}-${mStr}-${dStr}`;
    setTempSelected(dateFormatted);
  };

  const handleConfirm = () => {
    if (tempSelected) {
      onSelectDate(tempSelected);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/45 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm rounded-[32px] overflow-hidden"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.82)",
            borderWidth: 1.5,
            borderColor: "rgba(255, 255, 255, 0.7)",
            shadowColor: "#002D72",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 10,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Glass blur effect */}
          <BlurView
            intensity={Platform.OS === "ios" ? 45 : 30}
            tint="light"
            style={StyleSheet.absoluteFill}
          />

          {/* Liquid sheen gradient */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.75)", "rgba(240, 246, 255, 0.35)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View className="p-5">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3.5 mb-3 border-b border-white/40">
              <Text
                className="text-[17px] font-black text-[#002D72]"
                style={{ fontFamily: "Outfit" }}
              >
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-white/70 border border-white items-center justify-center shadow-sm"
              >
                <Text className="text-slate-600 font-bold text-xs">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View className="flex-row items-center justify-between mb-4 px-1">
              <TouchableOpacity
                onPress={prevMonth}
                disabled={!canGoPrev}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-full items-center justify-center border ${
                  canGoPrev
                    ? "bg-white/80 border-white/80 active:bg-white"
                    : "bg-slate-100/50 border-transparent opacity-30"
                }`}
              >
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Polyline
                    points="15 18 9 12 15 6"
                    stroke="#002D72"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              <Text
                className="text-base font-black text-[#002D72]"
                style={{ fontFamily: "Outfit" }}
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <TouchableOpacity
                onPress={nextMonth}
                activeOpacity={0.7}
                className="w-9 h-9 rounded-full bg-white/80 border border-white/80 items-center justify-center active:bg-white"
              >
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Polyline
                    points="9 18 15 12 9 6"
                    stroke="#002D72"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Day of Week Labels */}
            <View className="flex-row mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <View key={day} className="flex-1 items-center justify-center py-1">
                  <Text
                    className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                    style={{ fontFamily: "Outfit" }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View className="flex-row flex-wrap">
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return (
                    <View key={`empty-${idx}`} style={{ width: "14.28%", height: 40 }} />
                  );
                }

                const cellDate = new Date(viewYear, viewMonth, day);
                cellDate.setHours(0, 0, 0, 0);
                const isPast = cellDate < today;

                const yStr = String(viewYear);
                const mStr = String(viewMonth + 1).padStart(2, "0");
                const dStr = String(day).padStart(2, "0");
                const thisDateStr = `${yStr}-${mStr}-${dStr}`;

                const isSelected = tempSelected === thisDateStr;
                const isToday = cellDate.getTime() === today.getTime();

                return (
                  <View
                    key={`day-${day}`}
                    style={{ width: "14.28%", height: 40 }}
                    className="items-center justify-center p-0.5"
                  >
                    <TouchableOpacity
                      disabled={isPast}
                      onPress={() => handleDayPress(day)}
                      activeOpacity={0.7}
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        isSelected
                          ? "bg-[#002D72] shadow-sm shadow-[#002D72]/40"
                          : isToday
                          ? "bg-[#00A3FF]/15 border border-[#00A3FF]"
                          : isPast
                          ? "opacity-25"
                          : "active:bg-white/90"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? "text-white font-black"
                            : isToday
                            ? "text-[#002D72] font-black"
                            : isPast
                            ? "text-slate-400 font-medium"
                            : "text-slate-800 font-bold"
                        }`}
                        style={{ fontFamily: "Outfit" }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Confirm Date Action Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              className="mt-4 bg-[#002D72] py-3.5 rounded-2xl items-center justify-center shadow-md shadow-[#002D72]/30 active:opacity-90"
            >
              <Text
                className="text-white font-bold text-sm tracking-wide"
                style={{ fontFamily: "Outfit" }}
              >
                Confirm Date
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
