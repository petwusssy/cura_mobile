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
  selectedDate?: string;
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

export const APPOINTMENT_TIME_SLOTS = TELEMEDICINE_TIME_SLOTS;

function cleanToken(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\b0(\d)/g, "$1")
    .replace(/[\s:-]/g, "");
}

function isSlotUnavailable(slot: string, unavailableList: string[] = []): boolean {
  if (!unavailableList || unavailableList.length === 0) return false;
  const slotClean = cleanToken(slot);
  const slotParts = slot.split(/[-–—]|to/i).map((p) => p.trim());
  const slotStartClean = cleanToken(slotParts[0] || "");

  return unavailableList.some((item) => {
    if (!item) return false;
    const itemClean = cleanToken(item);
    if (!itemClean) return false;

    // 1. Exact slot match (e.g. '1:00 PM - 2:00 PM' === '1:00 PM - 2:00 PM')
    if (itemClean === slotClean) return true;

    // 2. Single time match with slot start (e.g. '1:00 PM' matches slot starting at '1:00 PM')
    const itemParts = item.split(/[-–—]|to/i).map((p) => p.trim());
    if (itemParts.length === 1 && itemClean === slotStartClean) {
      return true;
    }

    // 3. Both are ranges: match if start time tokens match exactly
    if (itemParts.length === 2 && slotParts.length === 2) {
      const itemStartClean = cleanToken(itemParts[0]);
      const itemEndClean = cleanToken(itemParts[1]);
      if (itemStartClean === slotStartClean && itemEndClean === cleanToken(slotParts[1])) {
        return true;
      }
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
  selectedDate,
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
                  {selectedDate ? `Showing slots for ${selectedDate}` : "Choose an available 1-hour slot"}
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
                          <Text style={styles.redBadgeText}>🔒 CLOSED</Text>
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
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1.5,
    opacity: 0.95,
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
    color: "#DC2626",
    fontWeight: "800",
  },
  redBadge: {
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  redBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
