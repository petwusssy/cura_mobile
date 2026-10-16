import React from "react";
import { View, Text, Modal, TouchableOpacity, Pressable } from "react-native";

interface RequestConfirmationModalProps {
  visible: boolean;
  type: "telemed" | "appointment";
  date?: string;
  time?: string;
  onClose: () => void;
  onViewRequests: () => void;
}

export function RequestConfirmationModal({
  visible,
  type,
  date,
  time,
  onClose,
  onViewRequests,
}: RequestConfirmationModalProps) {
  const isTelemed = type === "telemed";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(3, 10, 26, 0.65)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-white rounded-[28px] p-6 items-center"
          style={{
            maxWidth: 340,
            shadowColor: "#0A2472",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Success Icon */}
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3.5 border"
            style={{
              backgroundColor: isTelemed ? "#EFF6FF" : "#F0FDF4",
              borderColor: isTelemed ? "#BFDBFE" : "#BBF7D0",
            }}
          >
            <Text className="text-2xl">{isTelemed ? "🩺" : "📅"}</Text>
          </View>

          {/* Title */}
          <Text
            className="text-lg font-bold text-slate-900 text-center mb-1.5"
            style={{ fontFamily: "Outfit" }}
          >
            Request Submitted!
          </Text>

          {/* Subtitle */}
          <Text className="text-xs text-slate-500 text-center leading-relaxed mb-4 px-2">
            Your {isTelemed ? "telemedicine consultation" : "clinic appointment"} request has been sent to our staff. You can track its status in the Requests tab.
          </Text>

          {/* Date & Time pill summary if available */}
          {(date || time) ? (
            <View className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 flex-row items-center justify-center gap-1.5 mb-5">
              <Text className="text-[11px] font-bold text-slate-700">
                {[date, time].filter(Boolean).join(" • ")}
              </Text>
            </View>
          ) : null}

          {/* Primary Action Button */}
          <TouchableOpacity
            onPress={onViewRequests}
            activeOpacity={0.8}
            className="w-full py-3 rounded-xl items-center bg-[#0A2472] mb-2"
          >
            <Text
              className="text-xs font-bold text-white tracking-wide"
              style={{ fontFamily: "Outfit" }}
            >
              View My Requests
            </Text>
          </TouchableOpacity>

          {/* Secondary Action */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.6}
            className="w-full py-2 items-center"
          >
            <Text className="text-xs font-semibold text-slate-400">
              Done
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
