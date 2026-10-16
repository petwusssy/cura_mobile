import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ADMIN_PORTAL_GRADIENT } from "../constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedTime: string;
  onSelectTime: (timeStr: string) => void;
  title?: string;
  unavailableTimes?: string[];
}

export const TELEMEDICINE_TIME_SLOTS = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM",
];

function isSlotUnavailable(slot: string, unavailableList: string[] = []): boolean {
  if (!unavailableList || unavailableList.length === 0) return false;
  const clean = (s: string) => s.toLowerCase().replace(/[\s:-]/g, "");
  const target = clean(slot);
  const targetStart = clean(slot.split("-")[0] || "");

  return unavailableList.some((item) => {
    if (!item) return false;
    const norm = clean(item);
    if (!norm) return false;

    // 1. Direct or exact clean match
    if (norm === target) return true;

    // 2. Start time matches start time (e.g., "9:00 AM" matches "9:00 AM - 10:00 AM")
    const itemStart = clean(item.split("-")[0] || "");
    if (itemStart && itemStart === targetStart) return true;

    // 3. Legacy macro block handling (e.g., "Morning (8AM - 12PM)")
    const itemLower = item.toLowerCase();
    const slotLower = slot.toLowerCase();
    if (
      itemLower.includes("morning") &&
      (slotLower.includes("8:00 am") || slotLower.includes("9:00 am") || slotLower.includes("10:00 am") || slotLower.includes("11:00 am"))
    ) {
      return true;
    }
    if (
      itemLower.includes("afternoon") &&
      (slotLower.includes("1:00 pm") || slotLower.includes("2:00 pm") || slotLower.includes("3:00 pm") || slotLower.includes("4:00 pm"))
    ) {
      return true;
    }

    return false;
  });
}

export function LiquidGlassTimePickerModal({
  visible,
  onClose,
  selectedTime,
  onSelectTime,
  title = "Select Consultation Time",
  unavailableTimes = [],
}: Props) {
  const [tempSelected, setTempSelected] = useState(selectedTime);

  useEffect(() => {
    if (visible) {
      setTempSelected(selectedTime);
    }
  }, [visible, selectedTime]);

  const handleSlotPress = (slot: string) => {
    if (isSlotUnavailable(slot, unavailableTimes)) return;
    setTempSelected(slot);
  };

  const handleConfirm = () => {
    if (tempSelected && !isSlotUnavailable(tempSelected, unavailableTimes)) {
      onSelectTime(tempSelected);
      onClose();
    }
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Card */}
        <View style={styles.card}>
          <BlurView
            intensity={Platform.OS === "ios" ? 45 : 30}
            tint="light"
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.85)", "rgba(240, 246, 255, 0.45)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>
                  Choose an available 1-hour slot
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Time Slots Grid */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.slotsGrid}
              showsVerticalScrollIndicator={false}
            >
              {TELEMEDICINE_TIME_SLOTS.map((slot) => {
                const isUnavailable = isSlotUnavailable(slot, unavailableTimes);
                const isSelected = tempSelected === slot;

                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => handleSlotPress(slot)}
                    disabled={isUnavailable}
                    activeOpacity={0.75}
                    style={[
                      styles.slotItem,
                      isUnavailable
                        ? styles.slotItemUnavailable
                        : isSelected
                        ? styles.slotItemSelected
                        : styles.slotItemAvailable,
                    ]}
                  >
                    <View style={styles.slotTextRow}>
                      <Text
                        style={[
                          styles.slotText,
                          isUnavailable
                            ? styles.slotTextUnavailable
                            : isSelected
                            ? styles.slotTextSelected
                            : styles.slotTextAvailable,
                        ]}
                        numberOfLines={1}
                      >
                        {slot}
                      </Text>
                      {isUnavailable && (
                        <View style={styles.redBadge}>
                          <Text style={styles.redBadgeText}>Booked / Closed</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={styles.legendDotAvailable} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDotUnavailable} />
                <Text style={[styles.legendText, { color: "#EF4444" }]}>
                  Booked / Closed (Red)
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={!tempSelected || isSlotUnavailable(tempSelected, unavailableTimes)}
              style={[
                styles.confirmBtn,
                (!tempSelected || isSlotUnavailable(tempSelected, unavailableTimes)) && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.confirmBtnText}>Confirm Time</Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.85)",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 45, 114, 0.08)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#002D72",
    fontFamily: "Outfit",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 45, 114, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 13,
    color: "#002D72",
    fontWeight: "600",
    lineHeight: 14,
  },
  scrollArea: {
    maxHeight: 310,
    marginVertical: 4,
  },
  slotsGrid: {
    gap: 8,
    paddingVertical: 4,
  },
  slotItem: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  slotItemAvailable: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  slotItemSelected: {
    backgroundColor: "#002D72",
    borderColor: "#002D72",
    shadowColor: "#002D72",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  slotItemUnavailable: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FDA4AF",
    opacity: 0.85,
  },
  slotTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Outfit",
  },
  slotTextAvailable: {
    color: "#002D72",
  },
  slotTextSelected: {
    color: "#FFFFFF",
  },
  slotTextUnavailable: {
    color: "#E11D48",
  },
  redBadge: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  redBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E11D48",
    textTransform: "uppercase",
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 45, 114, 0.08)",
    marginTop: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDotAvailable: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0EA5E9",
  },
  legendDotUnavailable: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmBtn: {
    width: "100%",
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#002D72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Outfit",
  },
});
