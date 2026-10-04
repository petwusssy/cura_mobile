import { useState, useCallback, useEffect, useRef } from "react";
import { Image } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Screen, AppUser } from "./types";
import { MobileShell, BottomNav } from "./components/Shell";
import { DEFAULT_USER } from "./data";
import { SplashScreen } from "./screens/Splash";
import { AlertProvider, useAlert } from "./components/AlertProvider";
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { getManilaDate, getManilaTime, normalizeDate } from "./utils/philippineTime";

cssInterop(LinearGradient, { className: "style" });

// Auth
import { WelcomeScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen } from "./screens/auth";

// Onboarding
import {
  PersonalInfoScreen,
  AcademicInfoScreen,
  AvatarScreen,
  ProfileCompleteScreen,
} from "./screens/onboarding";

// Main app
import { HomeScreen, NotificationsScreen } from "./screens/Home";
import { HealthHistoryScreen, HealthDetailScreen } from "./screens/HealthHistory";
import { MedicationsScreen } from "./screens/Medications";
import {
  DocumentsScreen,
  PrescriptionDetailScreen,
  CertificateDetailScreen,
} from "./screens/Documents";
import { ProfileScreen } from "./screens/Profile";
import { TelemedicineScreen } from "./screens/Telemedicine";
import { AppointmentsScreen } from "./screens/Appointments";
import { RequestMedCertScreen } from "./screens/RequestMedCert";

type NavEntry = { screen: Screen; params?: Record<string, unknown> };

const MAIN_TABS: Screen[] = ["home", "telemedicine", "appointment", "medications", "profile"];

function NotificationPoller({ user, setNotifications }: { user: Partial<AppUser>; setNotifications: (n: any[]) => void }) {
  const { showAlert } = useAlert();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef(true);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    knownIdsRef.current = new Set();
    isInitialFetchRef.current = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`https://cura-backend-dvj5.onrender.com/api/notifications/`);
        if (res.ok) {
          const data = await res.json();
          const myNotifs = data.filter((n: any) => n.patient_id === userId);
          setNotifications(myNotifs);
          
          if (isInitialFetchRef.current) {
            // Seed known IDs without spamming alerts for existing past notifications
            myNotifs.forEach((n: any) => {
              if (n.id) knownIdsRef.current.add(String(n.id));
            });
            isInitialFetchRef.current = false;
          } else {
            // Only alert on new unread notifications that arrive in real time
            const brandNewNotifs = myNotifs.filter((n: any) => !n.read && n.id && !knownIdsRef.current.has(String(n.id)));
            brandNewNotifs.forEach((n: any) => {
              knownIdsRef.current.add(String(n.id));
              showAlert('Notification', n.message || n.title);
            });
          }
        }
      } catch (e) {
        // silent fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 1500);
    return () => clearInterval(interval);
  }, [user?.id, setNotifications, showAlert]);

  return null;
}

function buildMedicationsList(userConsultations: any[], takenMap: Record<string, any> = {}) {
  const today = getManilaDate();
  const [currHStr, currMStr] = getManilaTime().split(':');
  const currH = parseInt(currHStr, 10);
  const currM = parseInt(currMStr, 10);
  const currMins = currH * 60 + currM;

  return userConsultations.flatMap((c: any) => 
    (c.treatments || []).map((t: any, index: number) => {
      const medId = String(t.id || `${c.id}_${index}_${t.medicineName}`);
      const isTaken = !!(takenMap[medId]?.taken || t.status === 'taken');

      let status: 'due-now' | 'upcoming' | 'taken' | 'missed' = 'upcoming';

      if (isTaken) {
        status = 'taken';
      } else if (!t.nextDose || !String(t.nextDose).trim()) {
        status = 'taken';
      } else {
        const timeMatch = String(t.nextDose).match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const doseH = parseInt(timeMatch[1], 10);
          const doseM = parseInt(timeMatch[2], 10);
          const doseMins = doseH * 60 + doseM;
          const consultDate = normalizeDate(c.date);

          if (consultDate === today) {
            if (currMins >= doseMins) {
              status = 'due-now';
            } else {
              status = 'upcoming';
            }
          } else if (consultDate < today) {
            status = 'missed';
          } else {
            status = 'upcoming';
          }
        } else {
          status = 'upcoming';
        }
      }

      return {
        id: medId,
        treatmentId: t.id,
        name: t.medicineName,
        dose: `${t.quantity} ${t.unit || 'dose'}`,
        instructions: (t.remarks && String(t.remarks).trim()) ? String(t.remarks).trim() : "Take as directed by clinic staff.",
        timeGiven: t.timeGiven,
        nextDose: t.nextDose || null,
        date: c.date,
        status,
        consultationId: c.id,
        consultationStatus: c.status || 'Consultation',
      };
    })
  );
}

function MedicationReminderChecker({
  user,
  medications,
  setMedications,
  setNotifications,
}: {
  user: Partial<AppUser>;
  medications: any[];
  setMedications: React.Dispatch<React.SetStateAction<any[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const { showAlert } = useAlert();
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!medications || medications.length === 0) return;

    const checkDue = async () => {
      const today = getManilaDate();
      const [currHStr, currMStr] = getManilaTime().split(':');
      const currMins = parseInt(currHStr, 10) * 60 + parseInt(currMStr, 10);

      const storedTaken = await AsyncStorage.getItem('@cura_taken_medications').catch(() => null);
      const takenMap = storedTaken ? JSON.parse(storedTaken) : {};

      for (const med of medications) {
        if (med.status === 'taken' || takenMap[med.id]?.taken) continue;
        if (!med.nextDose) continue;

        const timeMatch = String(med.nextDose).match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) continue;

        const doseMins = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
        const medDate = med.date ? normalizeDate(med.date) : today;

        if (medDate === today && currMins >= doseMins) {
          const reminderKey = `med_reminder_${med.id}_${medDate}_${med.nextDose}`;
          if (!notifiedKeysRef.current.has(reminderKey)) {
            const alreadyNotified = await AsyncStorage.getItem(reminderKey).catch(() => null);
            if (!alreadyNotified) {
              notifiedKeysRef.current.add(reminderKey);
              await AsyncStorage.setItem(reminderKey, 'true').catch(() => {});

              showAlert(
                '⏰ Medicine Reminder',
                `Time to take your next dose of ${med.name} (${med.dose})!\n\nInstructions: ${med.instructions || 'Take as directed by clinic.'}`
              );

              const notif = {
                id: reminderKey,
                type: 'medication',
                title: `Medicine Reminder: ${med.name}`,
                message: `It's time to take your dose of ${med.name} (${med.dose}). Instructions: ${med.instructions || 'Take as directed.'}`,
                time: new Date().toISOString(),
                read: false,
                patient_id: user?.id,
                nextDose: med.nextDose,
              };
              setNotifications(prev => [notif, ...prev.filter(n => n.id !== reminderKey)]);

              setMedications(prev =>
                prev.map(m => m.id === med.id && m.status !== 'taken' ? { ...m, status: 'due-now' } : m)
              );
            }
          }
        }
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 5000);
    return () => clearInterval(interval);
  }, [medications, showAlert, user?.id, setMedications, setNotifications]);

  return null;
}

export default function App({ initialScreen }: { initialScreen?: Screen } = {}) {
  const [splashDone, setSplashDone] = useState(false);
  const [stack, setStack] = useState<NavEntry[]>([{ screen: initialScreen || "welcome" }]);
  const [user, setUser] = useState<Partial<AppUser>>(DEFAULT_USER);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    // Eagerly pre-cache logo asset in native memory on boot to eliminate any render delay
    try {
      const asset = Image.resolveAssetSource(require("../assets/images/cura-logo.png"));
      if (asset?.uri) {
        Image.prefetch(asset.uri).catch(() => {});
      }
    } catch (e) {}
  }, []);

  const safeFetchJson = async (url: string, options?: RequestInit, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) {
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        }
      } catch (err) {}
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
    return null;
  };

  const loadUserData = useCallback(async (email: string) => {
    try {
      const patients = (await safeFetchJson(`https://cura-backend-dvj5.onrender.com/api/patients/`)) || [];
      if (!Array.isArray(patients)) return;
      const patient = patients.find((p: any) => p.email?.toLowerCase().trim() === email.toLowerCase().trim());
      
      const storedToken = await AsyncStorage.getItem('@cura_access_token').catch(() => null);
      
      if (patient) {
        const upperName = (patient.name || '').toUpperCase();
        setUser((prev: any) => {
          const token = prev?.accessToken || storedToken || patient.accessToken;
          const updated = {
            ...prev,
            ...patient,
            id: String(patient.id || prev?.id || prev?.id_number || ''),
            id_number: String(patient.id || prev?.id_number || ''),
            name: upperName,
            firstName: upperName.split(' ')[0] || prev?.firstName || '',
            lastName: upperName.split(' ').slice(1).join(' ') || prev?.lastName || '',
            displayName: upperName || prev?.displayName || '',
            category: (patient.category || prev?.category || 'outsider').toLowerCase(),
            accessToken: token,
          };
          AsyncStorage.setItem('@cura_user_session', JSON.stringify(updated)).catch(() => {});
          if (token) {
            AsyncStorage.setItem('@cura_access_token', token).catch(() => {});
          }
          return updated;
        });
        
        // Load taken map from AsyncStorage
        const storedTaken = await AsyncStorage.getItem('@cura_taken_medications').catch(() => null);
        const takenMap = storedTaken ? JSON.parse(storedTaken) : {};

        // Fetch consultations and certificates concurrently
        const [allConsultations, allCertificates] = await Promise.all([
          safeFetchJson(`https://cura-backend-dvj5.onrender.com/api/consultations/`).then(d => Array.isArray(d) ? d : []),
          safeFetchJson(`https://cura-backend-dvj5.onrender.com/api/certificates/`).then(d => Array.isArray(d) ? d : []),
        ]);
        
        const pId = String(patient.id || '').trim();
        const pIdNum = String(patient.id_number || '').trim();
        const ptName = (patient.name || '').trim().toUpperCase();

        const userConsultationsRaw = allConsultations.filter((c: any) => {
          const cPat = String(c.patient || c.patientId || '').trim();
          const cPatName = String(c.patient_name || c.patientName || '').trim().toUpperCase();
          return (
            (pId && cPat === pId) ||
            (pIdNum && cPat === pIdNum) ||
            (ptName && cPatName && cPatName === ptName)
          );
        });
        
        // Deduplicate consultations to remove any duplicate records
        const userConsultationsMap = new Map();
        userConsultationsRaw.forEach((c: any) => userConsultationsMap.set(c.id, c));
        const userConsultations = Array.from(userConsultationsMap.values());
        
        userConsultations.sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.timeIn || '00:00'}`).getTime();
          const dateB = new Date(`${b.date}T${b.timeIn || '00:00'}`).getTime();
          return dateB - dateA;
        });
        
        setConsultations(userConsultations);

        // Extract medications from treatments (both Consultation and Non-Consultation visits)
        const extractedMedications = buildMedicationsList(userConsultations, takenMap);
        setMedications(extractedMedications);

        const userCertificates = allCertificates.filter((c: any) =>
          c.patient === patient.id ||
          c.patientId === patient.id ||
          c.patient === patient.id_number ||
          (ptName && (c.patient_name || c.patientName || '').trim().toUpperCase() === ptName)
        );
        setCertificates(userCertificates);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  }, []);

  const current = stack[stack.length - 1];

  // Refresh certificates whenever user views documents or profile screen
  useEffect(() => {
    const pId = user?.id || (user as any)?.id_number;
    const uName = ((user as any)?.name || '').trim().toUpperCase();
    if ((pId || uName) && (current?.screen === 'profile' || current?.screen === 'documents')) {
      safeFetchJson(`https://cura-backend-dvj5.onrender.com/api/certificates/`)
        .then(allCertificates => {
          if (Array.isArray(allCertificates)) {
            const userCerts = allCertificates.filter((c: any) =>
              (pId && (c.patient === pId || c.patientId === pId || c.patient === (user as any)?.id_number)) ||
              (uName && (c.patient_name || c.patientName || '').trim().toUpperCase() === uName)
            );
            setCertificates(userCerts);
          }
        })
        .catch(() => {});
    }
  }, [current?.screen, user?.id, (user as any)?.name]);

  const handleMarkTaken = useCallback(async (medId: string) => {
    try {
      // 1. Update AsyncStorage
      const stored = await AsyncStorage.getItem('@cura_taken_medications').catch(() => null);
      const takenMap = stored ? JSON.parse(stored) : {};
      takenMap[medId] = { taken: true, takenAt: new Date().toISOString() };
      await AsyncStorage.setItem('@cura_taken_medications', JSON.stringify(takenMap)).catch(() => {});

      // 2. Update medications in state immediately
      setMedications((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, status: 'taken' } : m))
      );

      // 3. Mark corresponding notification as read
      setNotifications((prev) =>
        prev.map((n) => (n.id && String(n.id).includes(medId) ? { ...n, read: true } : n))
      );

      // 4. Best effort backend sync
      fetch(`https://cura-backend-dvj5.onrender.com/api/treatments/${medId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'taken' }),
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to mark medication as taken:', e);
    }
  }, []);

  const [refreshingMeds, setRefreshingMeds] = useState(false);

  const handleRefreshMedications = useCallback(async () => {
    if (user?.email) {
      setRefreshingMeds(true);
      await loadUserData(user.email);
      setRefreshingMeds(false);
    }
  }, [user?.email, loadUserData]);

  // Refresh consultations/medications whenever user views medications screen
  useEffect(() => {
    if (current?.screen === 'medications' && user?.email) {
      loadUserData(user.email);
    }
  }, [current?.screen, user?.email, loadUserData]);

  const navigate = useCallback((screen: Screen, params?: Record<string, unknown>) => {
    setStack((prev) => {
      if (MAIN_TABS.includes(screen)) return [{ screen, params }];
      return [...prev, { screen, params }];
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => {
      if (prev.length > 1) return prev.slice(0, -1);
      if (prev.length === 1 && prev[0].screen !== "home" && MAIN_TABS.includes(prev[0].screen)) {
        return [{ screen: "home" }];
      }
      return prev;
    });
  }, []);

  const resetApp = useCallback(() => {
    AsyncStorage.removeItem('@cura_user_session').catch(() => {});
    AsyncStorage.removeItem('@cura_access_token').catch(() => {});
    setUser(DEFAULT_USER);
    setStack([{ screen: "welcome" }]);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@cura_user_session').then(async (stored) => {
      const storedToken = await AsyncStorage.getItem('@cura_access_token').catch(() => null);
      const storedTheme = await AsyncStorage.getItem('@cura_theme').catch(() => null);
      if (storedTheme) setTheme(storedTheme);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.id || parsed?.email) {
            if (storedToken && !parsed.accessToken) {
              parsed.accessToken = storedToken;
            }
            setUser(parsed);
            setStack([{ screen: initialScreen || "home" }]);
            if (parsed.email) {
              loadUserData(parsed.email);
            }
          }
        } catch (e) {}
      } else if (initialScreen) {
        setStack([{ screen: initialScreen }]);
      }
    }).catch(() => {
      if (initialScreen) {
        setStack([{ screen: initialScreen }]);
      }
    });
  }, [initialScreen, loadUserData]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      try {
        WebBrowser.dismissBrowser();
        WebBrowser.dismissAuthSession();
      } catch (e) {}
      if (event?.url && (event.url.includes("telemedicine") || event.url.includes("curamobile"))) {
        navigate("telemedicine");
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    return () => sub.remove();
  }, [navigate]);

  const isMainTab = MAIN_TABS.includes(current.screen);

  const handleSetTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    AsyncStorage.setItem('@cura_theme', newTheme).catch(() => {});
  }, []);

  const navProps = { navigate, goBack, user, setUser, params: current.params, resetApp, theme, setTheme: handleSetTheme };

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  const renderScreen = () => {
    if (!splashDone) return <SplashScreen onDone={handleSplashDone} />;

    switch (current.screen) {
      case "welcome":       return <WelcomeScreen navigate={navigate} goBack={goBack} />;
      case "login":         return <LoginScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} />;
      case "register":      return <RegisterScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} />;
      case "forgot-password": return <ForgotPasswordScreen navigate={navigate} goBack={goBack} />;

      case "onboard-personal": return <PersonalInfoScreen {...navProps} />;
      case "onboard-academic": return <AcademicInfoScreen {...navProps} />;
      case "onboard-avatar":   return <AvatarScreen {...navProps} />;
      case "onboard-complete": return <ProfileCompleteScreen {...navProps} />;

      case "home":           return <HomeScreen navigate={navigate} user={user} consultations={consultations} notifications={notifications} />;
      case "notifications":  return <NotificationsScreen navigate={navigate} goBack={goBack} notifications={notifications} setNotifications={setNotifications} />;
      case "telemedicine":   return <TelemedicineScreen navigate={navigate} goBack={goBack} user={user} />;
      case "appointment":    return <AppointmentsScreen navigate={navigate} goBack={goBack} user={user} />;
      case "health-history": return <HealthHistoryScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "health-detail":  return <HealthDetailScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "medications":    return (
        <MedicationsScreen
          navigate={navigate}
          goBack={goBack}
          medications={medications}
          onMarkTaken={handleMarkTaken}
          onRefresh={handleRefreshMedications}
          refreshing={refreshingMeds}
        />
      );
      case "documents":      return <DocumentsScreen navigate={navigate} goBack={goBack} params={current.params} certificates={certificates} />;
      case "prescription-detail": return <PrescriptionDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "cert-detail":    return <CertificateDetailScreen navigate={navigate} goBack={goBack} params={current.params} certificates={certificates} />;
      case "request-med-cert": return <RequestMedCertScreen navigate={navigate} goBack={goBack} user={user} />;
      case "profile":        return <ProfileScreen navigate={navigate} goBack={goBack} user={user} setUser={setUser} resetApp={resetApp} consultations={consultations} medications={medications} certificates={certificates} theme={theme} setTheme={handleSetTheme} />;

      default: return <WelcomeScreen navigate={navigate} goBack={goBack} />;
    }
  };

  return (
    <AlertProvider>
      {splashDone && <NotificationPoller user={user} setNotifications={setNotifications} />}
      {splashDone && (
        <MedicationReminderChecker
          user={user}
          medications={medications}
          setMedications={setMedications}
          setNotifications={setNotifications}
        />
      )}
      <MobileShell theme={theme}>
        {renderScreen()}
        {splashDone && isMainTab && (
          <BottomNav active={current.screen} navigate={navigate} />
        )}
      </MobileShell>
    </AlertProvider>
  );
}
