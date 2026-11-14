import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import { ADMIN_PORTAL_GRADIENT } from '../constants/theme';
import { PUBLIC_PRIVACY_URL } from '../services/api';

export const PRIVACY_POLICY_VERSION = '2026-06';

const POLICY_SECTIONS = [
  {
    title: '1. Data Controller & RA 10173 Scope',
    body: 'CURA is operated by the University of the Assumption (UA) Medical-Dental Clinic in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
  },
  {
    title: '2. Personal & Health Information Collected',
    body: 'We collect identity details (name, Student/Employee/Visitor ID, email, contact number, home address, course/department, emergency contact) and sensitive health records (birthday, sex, vitals, symptoms, diagnoses, prescriptions, telemedicine sessions, and medical certificates).',
  },
  {
    title: '3. Purpose & Informed Consent',
    body: 'Data is used solely for on-campus clinical care, triage, emergency notification, patient portal access, medical certificate issuance, and anonymized clinic health reports.',
  },
  {
    title: '4. Storage, Safeguards & No Commercial Sharing',
    body: 'All network traffic is protected by HTTPS/TLS. Accounts use encrypted passwords/OTPs, JWT security, a 7-day security edit cooldown, clinical audit logging, and authorized UA Clinic Google Drive report backups. CURA never sells or shares data for advertising.',
  },
  {
    title: '5. Data Retention & Lifecycle Schedule',
    body: 'Routine non-consultation/first-aid logs are kept 3–5 years. Clinical consultation and medical certificate records are kept 10 years (adults) or until age 18 + 10 years (minors), then securely anonymized or disposed.',
  },
  {
    title: '6. Your Data Subject Rights & DPO Contact',
    body: 'Under RA 10173 you may access, request correction, or inquire about erasure/retention of your records anytime via UA Medical-Dental Clinic DPO: clinic@ua.edu.ph · (045) 961-3617 loc. 115.',
  },
];

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  acceptLabel?: string;
}

export function PrivacyPolicyModal({
  visible,
  onClose,
  onAccept,
  acceptLabel = 'Agree & Continue',
}: PrivacyPolicyModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View
          className="bg-white rounded-[28px] w-full max-w-[460px] max-h-[85%] overflow-hidden"
          style={{
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 18,
          }}
        >
          {/* Header */}
          <LinearGradient
            colors={ADMIN_PORTAL_GRADIENT.colors}
            start={ADMIN_PORTAL_GRADIENT.start}
            end={ADMIN_PORTAL_GRADIENT.end}
            style={{ paddingHorizontal: 20, paddingVertical: 16 }}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <Path d="m9 12 2 2 4-4" />
                  </Svg>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-white" style={{ fontFamily: 'Outfit' }}>
                    CURA Data Privacy Policy
                  </Text>
                  <Text className="text-[11px] text-sky-100" style={{ fontFamily: 'Outfit' }}>
                    Philippine RA 10173 · Effective June 2026 (v{PRIVACY_POLICY_VERSION})
                  </Text>
                </View>
              </View>

              <Pressable onPress={onClose} hitSlop={10} className="w-8 h-8 rounded-full bg-white/15 items-center justify-center">
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
                  <Line x1="18" y1="6" x2="6" y2="18" />
                  <Line x1="6" y1="6" x2="18" y2="18" />
                </Svg>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Body */}
          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {['RA 10173 Compliant', '3–10 Yr Retention', 'Never Sold for Ads'].map((badge) => (
                <View key={badge} className="bg-sky-50 border border-sky-200 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-bold text-[#0056B3]" style={{ fontFamily: 'Outfit' }}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>

            {POLICY_SECTIONS.map((sec) => (
              <View key={sec.title} className="bg-slate-50 rounded-2xl p-3.5 mb-2.5 border border-slate-100">
                <Text className="text-xs font-extrabold text-[#0B2136] mb-1" style={{ fontFamily: 'Outfit' }}>
                  {sec.title}
                </Text>
                <Text className="text-[11.5px] text-slate-600 leading-[17px]">
                  {sec.body}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => Linking.openURL(PUBLIC_PRIVACY_URL).catch(() => {})}
              className="py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-200 items-center mb-2 active:opacity-80"
            >
              <Text className="text-xs font-bold text-[#0056B3]" style={{ fontFamily: 'Outfit' }}>
                Open Full Web Notice ({PUBLIC_PRIVACY_URL.replace(/^https?:\/\//, '')}) ↗
              </Text>
            </Pressable>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-3.5 border-t border-slate-100 bg-white flex-row gap-2.5">
            {onAccept && (
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-600" style={{ fontFamily: 'Outfit' }}>
                  Close
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="flex-1 py-3 rounded-2xl overflow-hidden items-center justify-center relative active:opacity-90"
            >
              <LinearGradient
                colors={ADMIN_PORTAL_GRADIENT.colors}
                start={ADMIN_PORTAL_GRADIENT.start}
                end={ADMIN_PORTAL_GRADIENT.end}
                style={StyleSheet.absoluteFill}
              />
              <Text className="text-xs font-black text-white" style={{ fontFamily: 'Outfit' }}>
                {onAccept ? acceptLabel : 'Close'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
