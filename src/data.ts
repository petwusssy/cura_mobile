import type {
  AppUser, Consultation, Medication,
  Prescription, MedCertificate, TransferRecord,
  Notification, BedAssignment
} from "./types";

export const DEFAULT_USER: AppUser = {
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  avatarId: "pulse",
  avatarColor: "#1B4FD8",
  avatarEmoji: "🩺",
  category: "outsider",
  gender: "",
  dob: "",
  bloodType: "",
  course: "",
  yearLevel: "",
  department: "",
  gradeLevel: "",
  phone: "",
  address: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
};

export const CONSULTATIONS: Consultation[] = [];

export const MEDICATIONS: Medication[] = [];

export const PRESCRIPTIONS: Prescription[] = [];

export const CERTIFICATES: MedCertificate[] = [];

export const TRANSFERS: TransferRecord[] = [];

export const NOTIFICATIONS: Notification[] = [];

export const BED_ASSIGNMENT: BedAssignment | null = null;

export const MASCOTS = [
  { id: "pulse", emoji: "🩺", name: "Dr. Pulse", color: "#1B4FD8", bg: "#EFF6FF" },
  { id: "vita", emoji: "💊", name: "Vita", color: "#059669", bg: "#ECFDF5" },
  { id: "thermo", emoji: "🌡️", name: "Thermo", color: "#D97706", bg: "#FFFBEB" },
  { id: "haven", emoji: "🏥", name: "Haven", color: "#7C3AED", bg: "#F5F3FF" },
  { id: "cordia", emoji: "🫀", name: "Cordia", color: "#E11D48", bg: "#FFF1F2" },
  { id: "helix", emoji: "🧬", name: "Helix", color: "#0891B2", bg: "#ECFEFF" },
  { id: "patch", emoji: "🩹", name: "Patch", color: "#EA580C", bg: "#FFF7ED" },
  { id: "lumos", emoji: "🔬", name: "Lumos", color: "#4F46E5", bg: "#EEF2FF" },
];
