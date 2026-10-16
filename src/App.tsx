import { useState, useCallback, useEffect, useRef } from "react";
import { Image, View, Platform } from "react-native";
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
    const idNumber = (user as any)?.id_number;
    const userName = (user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim().toUpperCase();
    if (!userId && !idNumber && !userName) return;

    knownIdsRef.current = new Set();
    isInitialFetchRef.current = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`https://cura-backend-dtfj.onrender.com/api/notifications/`);
        if (res.ok) {
          const data = await res.json();
          const myNotifs = Array.isArray(data) ? data.filter((n: any) => {
            if (userId && (String(n.patient_id) === String(userId) || String(n.patient) === String(userId))) return true;
            if (idNumber && (String(n.patient_id) === String(idNumber) || String(n.patient) === String(idNumber))) return true;
            if (userName && n.patientName && n.patientName.trim().toUpperCase() === userName) return true;
            if (userName && n.patient_name && n.patient_name.trim().toUpperCase() === userName) return true;
            return false;
          }) : [];
          setNotifications(myNotifs);
          AsyncStorage.setItem('@cura_cached_notifications', JSON.stringify(myNotifs)).catch(() => {});
          
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
  }, [user?.id, (user as any)?.id_number, user?.displayName, user?.firstName, user?.lastName, setNotifications, showAlert]);

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
    // Eagerly pre-cache landing page logo assets in native/browser memory on boot to eliminate any render delay
    try {
      if (typeof (Image as any).resolveAssetSource === "function") {
        const cura1x = (Image as any).resolveAssetSource(require("../assets/images/cura-logo-1x.webp"));
        const cura2x = (Image as any).resolveAssetSource(require("../assets/images/cura-logo-2x.webp"));
        const ua1x = (Image as any).resolveAssetSource(require("../assets/images/ua-seal-1x.webp"));
        const ua2x = (Image as any).resolveAssetSource(require("../assets/images/ua-seal-2x.webp"));

        [cura1x, cura2x, ua1x, ua2x].forEach((asset: any) => {
          if (asset?.uri) {
            Image.prefetch(asset.uri).catch(() => {});
          }
        });
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
      const patients = (await safeFetchJson(`https://cura-backend-dtfj.onrender.com/api/patients/`)) || [];
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
            avatarUrl: patient.avatar || patient.avatarUrl || prev?.avatarUrl || null,
            avatar: patient.avatar || patient.avatarUrl || prev?.avatar || null,
          };
          AsyncStorage.setItem('@cura_user_session', JSON.stringify(updated)).catch(() => {});
          if (token) {
            AsyncStorage.setItem('@cura_access_token', token).catch(() => {});
          }
          return updated;
        });
        
        // Fetch consultations and certificates concurrently
        const [allConsultations, allCertificates] = await Promise.all([
          safeFetchJson(`https://cura-backend-dtfj.onrender.com/api/consultations/`).then(d => Array.isArray(d) ? d : []),
          safeFetchJson(`https://cura-backend-dtfj.onrender.com/api/certificates/`).then(d => Array.isArray(d) ? d : []),
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
        AsyncStorage.setItem('@cura_cached_consultations', JSON.stringify(userConsultations)).catch(() => {});

        // Extract medications from treatments
        const intakedStored = await AsyncStorage.getItem('@cura_intaked_meds').catch(() => null);
        let intakedIds = new Set<string>();
        if (intakedStored) {
          try {
            const parsed = JSON.parse(intakedStored);
            if (Array.isArray(parsed)) intakedIds = new Set(parsed);
          } catch {}
        }

        const extractedMedications = userConsultations.flatMap((c: any) => 
          (c.treatments || []).map((t: any, idx: number) => {
            const medId = t.id ? String(t.id) : `${c.id}-${t.medicineName}-${t.nextDose || t.timeGiven || idx}`;
            const rawRemarks = t.remarks || "";
            const isServerIntaked = rawRemarks.includes('[INTAKED]') || t.status === 'intaked' || t.status === 'taken';
            const isIntaked = isServerIntaked || intakedIds.has(medId) || (t.id && intakedIds.has(String(t.id)));
            if (isServerIntaked) {
              intakedIds.add(medId);
              if (t.id) intakedIds.add(String(t.id));
            }
            return {
              id: medId,
              treatmentId: t.id ? String(t.id) : null,
              rawRemarks,
              name: t.medicineName,
              dose: `${t.quantity} ${t.unit}`,
              instructions: rawRemarks.replace(/\[INTAKED\]/g, "").trim() || "No instructions",
              timeGiven: t.timeGiven ? `${c.date} ${t.timeGiven}` : c.date,
              nextDose: t.nextDose ? `${c.date} ${t.nextDose}` : null,
              status: isIntaked ? "intaked" : "next-intake",
              consultationId: c.id
            };
          })
        );
        AsyncStorage.setItem('@cura_intaked_meds', JSON.stringify([...intakedIds])).catch(() => {});
        setMedications(extractedMedications);
        AsyncStorage.setItem('@cura_cached_medications', JSON.stringify(extractedMedications)).catch(() => {});

        const ptName = (patient.name || '').trim().toUpperCase();
        const userCertificates = allCertificates.filter((c: any) =>
          c.patient === patient.id ||
          c.patientId === patient.id ||
          c.patient === patient.id_number ||
          (ptName && (c.patient_name || c.patientName || '').trim().toUpperCase() === ptName)
        );
        setCertificates(userCertificates);
        AsyncStorage.setItem('@cura_cached_certificates', JSON.stringify(userCertificates)).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  }, []);

  const current = stack[stack.length - 1];

  // Refresh certificates and consultations whenever user views documents, profile, or medications screen
  useEffect(() => {
    const pId = user?.id || (user as any)?.id_number;
    const uName = ((user as any)?.name || '').trim().toUpperCase();
    if ((pId || uName) && (current?.screen === 'profile' || current?.screen === 'documents' || current?.screen === 'medications' || current?.screen === 'notifications')) {
      if (current?.screen === 'medications' || current?.screen === 'profile' || current?.screen === 'notifications') {
        safeFetchJson(`https://cura-backend-dtfj.onrender.com/api/consultations/`)
          .then(async (allConsultations) => {
            if (Array.isArray(allConsultations)) {
              const userConsultationsRaw = allConsultations.filter((c: any) => c.patient === pId);
              const userConsultationsMap = new Map();
              userConsultationsRaw.forEach((c: any) => userConsultationsMap.set(c.id, c));
              const userConsultations = Array.from(userConsultationsMap.values());
              setConsultations(userConsultations);
              AsyncStorage.setItem('@cura_cached_consultations', JSON.stringify(userConsultations)).catch(() => {});

              const intakedStored = await AsyncStorage.getItem('@cura_intaked_meds').catch(() => null);
              let intakedIds = new Set<string>();
              if (intakedStored) {
                try {
                  const parsed = JSON.parse(intakedStored);
                  if (Array.isArray(parsed)) intakedIds = new Set(parsed);
                } catch {}
              }

              const extracted = userConsultations.flatMap((c: any) =>
                (c.treatments || []).map((t: any, idx: number) => {
                  const medId = t.id ? String(t.id) : `${c.id}-${t.medicineName}-${t.nextDose || t.timeGiven || idx}`;
                  const rawRemarks = t.remarks || "";
                  const isServerIntaked = rawRemarks.includes('[INTAKED]') || t.status === 'intaked' || t.status === 'taken';
                  const isIntaked = isServerIntaked || intakedIds.has(medId) || (t.id && intakedIds.has(String(t.id)));
                  if (isServerIntaked) {
                    intakedIds.add(medId);
                    if (t.id) intakedIds.add(String(t.id));
                  }
                  return {
                    id: medId,
                    treatmentId: t.id ? String(t.id) : null,
                    rawRemarks,
                    name: t.medicineName,
                    dose: `${t.quantity} ${t.unit}`,
                    instructions: rawRemarks.replace(/\[INTAKED\]/g, "").trim() || "No instructions",
                    timeGiven: t.timeGiven ? `${c.date} ${t.timeGiven}` : c.date,
                    nextDose: t.nextDose ? `${c.date} ${t.nextDose}` : null,
                    status: isIntaked ? "intaked" : "next-intake",
                    consultationId: c.id
                  };
                })
              );
              AsyncStorage.setItem('@cura_intaked_meds', JSON.stringify([...intakedIds])).catch(() => {});
              setMedications(extracted);
              AsyncStorage.setItem('@cura_cached_medications', JSON.stringify(extracted)).catch(() => {});
            }
          })
          .catch(() => {});
      }

      safeFetchJson(`https://cura-backend-dtfj.onrender.com/api/certificates/`)
        .then(allCertificates => {
          if (Array.isArray(allCertificates)) {
            const userCerts = allCertificates.filter((c: any) =>
              (pId && (c.patient === pId || c.patientId === pId || c.patient === (user as any)?.id_number)) ||
              (uName && (c.patient_name || c.patientName || '').trim().toUpperCase() === uName)
            );
            setCertificates(userCerts);
            AsyncStorage.setItem('@cura_cached_certificates', JSON.stringify(userCerts)).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [current?.screen, user?.id, (user as any)?.name]);

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
    AsyncStorage.multiRemove([
      '@cura_user_session',
      '@cura_access_token',
      '@cura_cached_consultations',
      '@cura_cached_medications',
      '@cura_cached_certificates',
      '@cura_cached_notifications',
      '@cura_intaked_meds',
    ]).catch(() => {});
    setUser(DEFAULT_USER);
    setConsultations([]);
    setMedications([]);
    setCertificates([]);
    setNotifications([]);
    setStack([{ screen: "welcome" }]);
  }, []);

  // Auto-persist active user session to AsyncStorage whenever user changes
  useEffect(() => {
    if (user && (user.id || user.email)) {
      AsyncStorage.setItem('@cura_user_session', JSON.stringify(user)).catch(() => {});
      if (user.accessToken) {
        AsyncStorage.setItem('@cura_access_token', user.accessToken).catch(() => {});
      }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const [stored, storedToken, storedTheme] = await Promise.all([
          AsyncStorage.getItem('@cura_user_session').catch(() => null),
          AsyncStorage.getItem('@cura_access_token').catch(() => null),
          AsyncStorage.getItem('@cura_theme').catch(() => null),
        ]);

        if (storedTheme && isMounted) setTheme(storedTheme);

        // Instantly hydrate offline cache so counts and records show immediately without 0 flashing
        const [cachedConsults, cachedMeds, cachedCerts, cachedNotifs] = await Promise.all([
          AsyncStorage.getItem('@cura_cached_consultations').catch(() => null),
          AsyncStorage.getItem('@cura_cached_medications').catch(() => null),
          AsyncStorage.getItem('@cura_cached_certificates').catch(() => null),
          AsyncStorage.getItem('@cura_cached_notifications').catch(() => null),
        ]);

        if (cachedConsults && isMounted) {
          try { const d = JSON.parse(cachedConsults); if (Array.isArray(d)) setConsultations(d); } catch (e) {}
        }
        if (cachedMeds && isMounted) {
          try { const d = JSON.parse(cachedMeds); if (Array.isArray(d)) setMedications(d); } catch (e) {}
        }
        if (cachedCerts && isMounted) {
          try { const d = JSON.parse(cachedCerts); if (Array.isArray(d)) setCertificates(d); } catch (e) {}
        }
        if (cachedNotifs && isMounted) {
          try { const d = JSON.parse(cachedNotifs); if (Array.isArray(d)) setNotifications(d); } catch (e) {}
        }
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.id || parsed?.email) {
              if (storedToken && !parsed.accessToken) {
                parsed.accessToken = storedToken;
              }
              if (isMounted) {
                setUser(parsed);
                setStack([{ screen: initialScreen || "home" }]);
              }
              if (parsed.email) {
                loadUserData(parsed.email);
              }
              return;
            }
          } catch (e) {}
        }

        // Secondary fallback: recover session from JWT if user session was missing
        if (storedToken) {
          try {
            const parts = storedToken.split('.');
            if (parts.length === 3) {
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              if (payload?.email || payload?.user_id) {
                const recovered = {
                  id: String(payload.user_id || ''),
                  email: payload.email || '',
                  accessToken: storedToken,
                };
                if (isMounted) {
                  setUser(recovered);
                  setStack([{ screen: initialScreen || "home" }]);
                }
                if (recovered.email) {
                  loadUserData(recovered.email);
                }
                return;
              }
            }
          } catch (e) {}
        }

        if (initialScreen && isMounted) {
          setStack([{ screen: initialScreen }]);
        }
      } catch (err) {
        if (initialScreen && isMounted) {
          setStack([{ screen: initialScreen }]);
        }
      }
    };

    restoreSession();
    return () => { isMounted = false; };
  }, [initialScreen, loadUserData]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      try {
        WebBrowser.dismissBrowser();
        WebBrowser.dismissAuthSession();
      } catch (e) {}
      if (event?.url) {
        try {
          const parsed = Linking.parse(event.url);
          const path = (parsed.path || "").toLowerCase().replace(/^\/+|\/+$/g, "");
          const hostname = (parsed.hostname || "").toLowerCase();
          if (path === "telemedicine" || path.startsWith("telemedicine/") || hostname === "telemedicine") {
            navigate("telemedicine");
          }
        } catch {
          if (event.url.includes("/telemedicine") || event.url.includes("://telemedicine")) {
            navigate("telemedicine");
          }
        }
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

  const handleIntakeMedication = useCallback((id: string) => {
    setMedications(prev => {
      const targetMed = prev.find(m => m.id === id);
      const uuidMatch = (targetMed?.treatmentId || id).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const resolvedTreatmentId = uuidMatch ? uuidMatch[0] : null;

      if (resolvedTreatmentId) {
        const currentRemarks = targetMed?.rawRemarks || targetMed?.instructions || "";
        const cleanRemarks = currentRemarks.replace(/\[INTAKED\]/g, "").trim();
        const updatedRemarks = cleanRemarks ? `${cleanRemarks} [INTAKED]` : "[INTAKED]";

        fetch(`https://cura-backend-dtfj.onrender.com/api/treatments/${resolvedTreatmentId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks: updatedRemarks }),
        }).catch(() => {});
      }

      const updatedMeds = prev.map(m => m.id === id ? { ...m, status: "intaked" } : m);
      AsyncStorage.setItem('@cura_cached_medications', JSON.stringify(updatedMeds)).catch(() => {});
      return updatedMeds;
    });

    AsyncStorage.getItem('@cura_intaked_meds').then(data => {
      let set = new Set<string>();
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) set = new Set(parsed);
        } catch {}
      }
      set.add(id);
      AsyncStorage.setItem('@cura_intaked_meds', JSON.stringify([...set])).catch(() => {});
    }).catch(() => {});
  }, []);

  const isAuthenticated = Boolean(user?.id || user?.email);

  const renderScreen = () => {
    if (!isAuthenticated) {
      switch (current.screen) {
        case "login":
          return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} initialAuthMode="signin" />;
        case "register":
          return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} initialAuthMode="create_account" />;
        case "forgot-password":
          return <ForgotPasswordScreen navigate={navigate} goBack={goBack} />;
        case "welcome":
        default:
          return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} />;
      }
    }

    switch (current.screen) {
      case "welcome":       return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} />;
      case "login":         return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} initialAuthMode="signin" />;
      case "register":      return <WelcomeScreen navigate={navigate} goBack={goBack} setUser={setUser} loadUserData={loadUserData} initialAuthMode="create_account" />;
      case "forgot-password": return <ForgotPasswordScreen navigate={navigate} goBack={goBack} />;

      case "home":           return <HomeScreen navigate={navigate} user={user} consultations={consultations} notifications={notifications} medications={medications} />;
      case "notifications":  return <NotificationsScreen navigate={navigate} goBack={goBack} notifications={notifications} setNotifications={setNotifications} medications={medications} />;
      case "telemedicine":   return <TelemedicineScreen navigate={navigate} goBack={goBack} user={user} />;
      case "appointment":    return <AppointmentsScreen navigate={navigate} goBack={goBack} user={user} />;
      case "health-history": return <HealthHistoryScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "health-detail":  return <HealthDetailScreen navigate={navigate} goBack={goBack} params={current.params} consultations={consultations} />;
      case "medications":    return <MedicationsScreen navigate={navigate} goBack={goBack} medications={medications} onIntake={handleIntakeMedication} />;
      case "documents":      return <DocumentsScreen navigate={navigate} goBack={goBack} params={current.params} certificates={certificates} />;
      case "prescription-detail": return <PrescriptionDetailScreen navigate={navigate} goBack={goBack} params={current.params} />;
      case "cert-detail":    return <CertificateDetailScreen navigate={navigate} goBack={goBack} params={current.params} certificates={certificates} />;
      case "request-med-cert": return <RequestMedCertScreen navigate={navigate} goBack={goBack} user={user} />;
      case "profile":        return <ProfileScreen navigate={navigate} goBack={goBack} user={user} setUser={setUser} resetApp={resetApp} consultations={consultations} medications={medications} certificates={certificates} theme={theme} setTheme={handleSetTheme} />;

      default: return <HomeScreen navigate={navigate} user={user} consultations={consultations} notifications={notifications} medications={medications} />;
    }
  };

  return (
    <AlertProvider>
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: Platform.OS === "web" ? ("100dvh" as any) : "100%",
        }}
      >
        {splashDone && isAuthenticated && <NotificationPoller user={user} setNotifications={setNotifications} />}
        {!splashDone ? (
          <SplashScreen onDone={handleSplashDone} />
        ) : (
          <MobileShell theme={theme}>
            {renderScreen()}
            {isAuthenticated && isMainTab && (
              <BottomNav active={current.screen} navigate={navigate} isDark={theme === 'dark'} />
            )}
          </MobileShell>
        )}
      </View>
    </AlertProvider>
  );
}
