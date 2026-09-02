import { useState, useCallback } from "react";
import type { Screen, AppUser } from "./types";
import { MobileShell, BottomNav } from "./components/Shell";
import { DEFAULT_USER } from "./data";
import { SplashScreen } from "./screens/Splash";

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

type NavEntry = { screen: Screen; params?: Record<string, unknown> };

const MAIN_TABS: Screen[] = ["home", "health-history", "medications", "documents", "profile"];

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [stack, setStack] = useState<NavEntry[]>([{ screen: "welcome" }]);
  const [user, setUser] = useState<Partial<AppUser>>(DEFAULT_USER);
  const [consultations, setConsultations] = useState<any[]>([]);

  const loadUserData = useCallback(async (email: string) => {
    try {
      const pRes = await fetch(`https://cura-backend-dvj5.onrender.com/api/patients/`);
      const patients = await pRes.json();
      const patient = patients.find((p: any) => p.email?.toLowerCase().trim() === email.toLowerCase().trim());
      
      if (patient) {
        setUser((prev) => ({
          ...prev,
          ...patient,
          firstName: patient.name?.split(' ')[0] || prev.firstName,
          lastName: patient.name?.split(' ').slice(1).join(' ') || prev.lastName,
          displayName: patient.name || prev.displayName,
          id_number: patient.id,
        }));
        
        const cRes = await fetch(`https://cura-backend-dvj5.onrender.com/api/consultations/`);
        const allConsultations = await cRes.json();
        const userConsultations = allConsultations.filter((c: any) => c.patient === patient.id);
        
        userConsultations.sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.timeIn || '00:00'}`).getTime();
          const dateB = new Date(`${b.date}T${b.timeIn || '00:00'}`).getTime();
          return dateB - dateA;
        });
        
        setConsultations(userConsultations);
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
    setStack([{ screen: "welcome" }]);
  }, []);

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

      case "home":           return <HomeScreen navigate={navigate} user={user} consultations={consultations} />;
      case "notifications":  return <NotificationsScreen navigate={navigate} goBack={goBack} />;
      case "health-history": return <HealthHistoryScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "health-detail":  return <HealthDetailScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "medications":    return <MedicationsScreen navigate={navigate} goBack={goBack} />;
      case "documents":      return <DocumentsScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "prescription-detail": return <PrescriptionDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "cert-detail":    return <CertificateDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "profile":        return <ProfileScreen navigate={navigate} goBack={goBack} user={user} resetApp={resetApp} />;

      default: return <WelcomeScreen navigate={navigate} goBack={goBack} />;
    }
  };

  return (
    <MobileShell>
      {renderScreen()}
      {splashDone && isMainTab && (
        <BottomNav active={current.screen} navigate={navigate} />
      )}
    </MobileShell>
  );
}
