import { useState, useCallback, useEffect, useRef } from "react";
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
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.id, setNotifications, showAlert]);

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

  const loadUserData = useCallback(async (email: string) => {
    try {
      const pRes = await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/`);
      const patients = await pRes.json();
      const patient = patients.find((p: any) => p.email?.toLowerCase().trim() === email.toLowerCase().trim());
      
      const storedToken = await AsyncStorage.getItem('@cura_access_token').catch(() => null);
      
      if (patient) {
        const upperName = (patient.name || '').toUpperCase();
        setUser((prev: any) => {
          const token = prev?.accessToken || storedToken || patient.accessToken;
          const updated = {
            ...patient,
            ...prev,
            name: upperName,
            firstName: upperName.split(' ')[0] || prev?.firstName || '',
            lastName: upperName.split(' ').slice(1).join(' ') || prev?.lastName || '',
            displayName: upperName || prev?.displayName || '',
            id_number: patient.id || prev?.id_number || '',
            category: (patient.category || prev?.category || 'outsider').toLowerCase(),
            accessToken: token,
          };
          AsyncStorage.setItem('@cura_user_session', JSON.stringify(updated)).catch(() => {});
          if (token) {
            AsyncStorage.setItem('@cura_access_token', token).catch(() => {});
          }
          return updated;
        });
        
        // Fetch consultations and certificates concurrently
        const [cRes, certRes] = await Promise.all([
          fetch(`https://cura-backend-dvj5.onrender.com/api/consultations/`),
          fetch(`https://cura-backend-dvj5.onrender.com/api/certificates/`),
        ]);
        const [allConsultations, allCertificates] = await Promise.all([
          cRes.json(),
          certRes.json(),
        ]);
        
        const userConsultationsRaw = allConsultations.filter((c: any) => c.patient === patient.id);
        
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

        // Extract medications from treatments
        const extractedMedications = userConsultations.flatMap((c: any) => 
          (c.treatments || []).map((t: any) => ({
            id: t.id || Math.random().toString(),
            name: t.medicineName,
            dose: `${t.quantity} ${t.unit}`,
            instructions: t.remarks || "No instructions",
            timeGiven: `${c.date} ${t.timeGiven}`,
            nextDose: t.nextDose ? `${c.date} ${t.nextDose}` : null,
            status: "taken",
            consultationId: c.id
          }))
        );
        setMedications(extractedMedications);

        const userCertificates = allCertificates.filter((c: any) => c.patient === patient.id);
        setCertificates(userCertificates);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  }, []);

  const current = stack[stack.length - 1];

  const navigate = useCallback((screen: Screen, params?: Record<string, unknown>) => {
    setStack((prev) => {
      if (MAIN_TABS.includes(screen)) return [{ screen, params }];
      return [...prev, { screen, params }];
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
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

  const navProps = { navigate, goBack, user, setUser, params: current.params, resetApp };

  const renderScreen = () => {
    if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

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
      case "medications":    return <MedicationsScreen navigate={navigate} goBack={goBack} medications={medications} />;
      case "documents":      return <DocumentsScreen navigate={navigate} goBack={goBack} params={current.params} certificates={certificates} />;
      case "prescription-detail": return <PrescriptionDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "cert-detail":    return <CertificateDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "profile":        return <ProfileScreen navigate={navigate} goBack={goBack} user={user} resetApp={resetApp} consultations={consultations} medications={medications} certificates={certificates} />;

      default: return <WelcomeScreen navigate={navigate} goBack={goBack} />;
    }
  };

  return (
    <AlertProvider>
      <NotificationPoller user={user} setNotifications={setNotifications} />
      <MobileShell>
        {renderScreen()}
        {splashDone && isMainTab && (
          <BottomNav active={current.screen} navigate={navigate} />
        )}
      </MobileShell>
    </AlertProvider>
  );
}
