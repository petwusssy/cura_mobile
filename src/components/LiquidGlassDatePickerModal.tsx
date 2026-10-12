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
import Svg, { Polyline } from "react-native-svg";

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
  const getTodayStart = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const today = getTodayStart();

  const getTodayFormatted = () => {
    const yStr = String(today.getFullYear());
    const mStr = String(today.getMonth() + 1).padStart(2, "0");
    const dStr = String(today.getDate()).padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  };

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tempSelected, setTempSelected] = useState(selectedDate || getTodayFormatted());

  useEffect(() => {
    if (visible) {
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const parts = selectedDate.split("-").map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          setViewYear(parts[0]);
          setViewMonth(parts[1] - 1);
          setTempSelected(selectedDate);
          return;
        }
      }
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setTempSelected(selectedDate || getTodayFormatted());
    }
  }, [visible, selectedDate]);

  const prevMonth = () => {
    const currentToday = getTodayStart();
    if (
      viewYear < currentToday.getFullYear() ||
      (viewYear === currentToday.getFullYear() && viewMonth <= currentToday.getMonth())
    ) {
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
    onSelectDate(dateFormatted);
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
      <View style={styles.overlay}>
        {/* Sibling backdrop - tapping outside closes modal */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        {/* Modal card */}
        <View style={styles.card}>
          {/* BlurView */}
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

          <View style={styles.content}>
            {/* Modal Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthRow}>
              <TouchableOpacity
                onPress={prevMonth}
                disabled={!canGoPrev}
                activeOpacity={0.7}
                style={[
                  styles.navBtn,
                  canGoPrev ? styles.navBtnActive : styles.navBtnDisabled,
                ]}
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

              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <TouchableOpacity
                onPress={nextMonth}
                activeOpacity={0.7}
                style={[styles.navBtn, styles.navBtnActive]}
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
            <View style={styles.weekRow}>
              {DAYS_OF_WEEK.map((day) => (
                <View key={day} style={styles.weekCell}>
                  <Text style={styles.weekText}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.grid}>
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return (
                    <View key={`empty-${idx}`} style={styles.emptyCell} />
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
                    key={`day-${viewYear}-${viewMonth}-${day}`}
                    style={styles.dayCell}
                  >
                    <TouchableOpacity
                      disabled={isPast}
                      onPress={() => handleDayPress(day)}
                      activeOpacity={0.7}
                      style={[
                        styles.dayBtn,
                        isSelected
                          ? styles.dayBtnSelected
                          : isPast
                          ? styles.dayBtnPast
                          : styles.dayBtnDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected
                            ? styles.dayTextSelected
                            : isPast
                            ? styles.dayTextPast
                            : styles.dayTextDefault,
                        ]}
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
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>
                Confirm Date
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.7)",
    shadowColor: "#002D72",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.4)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#002D72",
    fontFamily: "Outfit",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#475569",
    fontWeight: "bold",
    fontSize: 12,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#002D72",
    fontFamily: "Outfit",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  navBtnDisabled: {
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    borderWidth: 1,
    borderColor: "transparent",
    opacity: 0.3,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  weekText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Outfit",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyCell: {
    width: "14.28%",
    height: 40,
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnSelected: {
    backgroundColor: "rgba(0, 163, 255, 0.16)",
    borderWidth: 1.5,
    borderColor: "#00A3FF",
    shadowColor: "#00A3FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  dayBtnPast: {
    opacity: 0.25,
  },
  dayBtnDefault: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Outfit",
  },
  dayTextSelected: {
    color: "#002D72",
    fontWeight: "900",
  },
  dayTextPast: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  dayTextDefault: {
    color: "#1E293B",
    fontWeight: "700",
  },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: "#002D72",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#002D72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: "Outfit",
  },
});

