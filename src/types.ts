export type Screen =
  | "welcome"
  | "login"
  | "register"
  | "forgot-password"
  | "verify-email"
  | "onboard-personal"
  | "onboard-category"
  | "onboard-academic"
  | "onboard-contact"
  | "onboard-emergency"
  | "onboard-guardian"
  | "onboard-avatar"
  | "onboard-complete"
  | "home"
  | "notifications"
  | "health-history"
  | "health-detail"
  | "telemedicine"
  | "appointment"
  | "medications"
  | "documents"
  | "prescription-detail"
  | "cert-detail"
  | "profile"
  | "profile-edit"
  | "request-med-cert";

export type PatientCategory = "student" | "employee" | "outsider";

export interface AppUser {
  id?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  accessToken?: string;
  avatarId: string;
  avatarColor: string;
  avatarEmoji: string;
  category: PatientCategory;
  gender: string;
  dob: string;
  bloodType: string;
  // student fields
  studentCategory?: string;
  course?: string;
  yearLevel?: string;
  department?: string;
  gradeLevel?: string;
  // employee fields
  position?: string;
  id_number?: string; // For their actual ID
  // contact
  phone: string;
  address: string;
  // emergency
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // guardian
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
}

export interface Vitals {
  height: string;
  weight: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  o2Saturation: string;
}

export interface Consultation {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  chiefComplaint: string;
  vitals: Vitals;
  nurseNotes: string;
  doctorNotes: string;
  recommendations: string;
  followUpDate: string | null;
  doctor: string;
  nurse: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  instructions: string;
  timeGiven: string;
  nextDose: string | null;
  status: "upcoming" | "due-now" | "taken" | "missed";
  consultationId: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctor: string;
  consultationId: string;
  imageUrl: string;
  medications: string[];
}

export interface MedCertificate {
  id: string;
  date: string;
  purpose: string;
  diagnosis: string;
  recommendations: string;
  doctor: string;
  licenseNo: string;
}

export interface TransferRecord {
  id: string;
  date: string;
  time: string;
  receivingHospital: string;
  transport: string;
  reason: string;
  status: "completed" | "in-transit" | "pending";
  attendingDoctor: string;
}

export interface Notification {
  id: string;
  type: "medication" | "appointment" | "result" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface BedAssignment {
  bedNumber: string;
  allottedMinutes: number;
  startTime: string; // ISO string
  reason: string;
}

export interface PatientQueue {
  id: string;
  patient: string;
  queue_number: number;
  status: "waiting" | "called" | "done";
  date: string;
}

