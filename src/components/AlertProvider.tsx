import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

type AlertVariant = 'info' | 'error' | 'warning' | 'success';

interface AlertContextProps {
  showAlert: (title: string, message: string, type?: AlertVariant) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertVariant>('info');

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (title: string, message: string, type?: AlertVariant) => {
    // Auto-detect type if not explicitly supplied
    let detectedType: AlertVariant = type || 'info';
    if (!type) {
      const lower = (title || '').toLowerCase();
      if (lower.includes('error') || lower.includes('failed') || lower.includes('fail')) {
        detectedType = 'error';
      } else if (lower.includes('success') || lower.includes('done')) {
        detectedType = 'success';
      } else if (lower.includes('warning') || lower.includes('caution')) {
        detectedType = 'warning';
      } else {
        detectedType = 'info';
      }
    }

    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(detectedType);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [isOpen, scaleAnim, opacityAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const isError = alertType === 'error';
  const isWarning = alertType === 'warning';
  const isSuccess = alertType === 'success';

  // Theme styling configurations
  const theme = {
    tagText: isError
      ? 'SYSTEM ALERT'
      : isWarning
      ? 'CAUTION'
      : isSuccess
      ? 'CONFIRMATION'
      : 'CLINIC NOTICE',
    tagBg: isError
      ? 'bg-rose-50 border-rose-200/80'
      : isWarning
      ? 'bg-amber-50 border-amber-200/80'
      : isSuccess
      ? 'bg-emerald-50 border-emerald-200/80'
      : 'bg-sky-50 border-sky-200/80',
    tagTextColor: isError
      ? 'text-rose-700'
      : isWarning
      ? 'text-amber-700'
      : isSuccess
      ? 'text-emerald-700'
      : 'text-sky-700',
    tagDotColor: isError
      ? '#F43F5E'
      : isWarning
      ? '#F59E0B'
      : isSuccess
      ? '#10B981'
      : '#0EA5E9',
    haloBg: isError
      ? 'bg-rose-50 border-rose-100'
      : isWarning
      ? 'bg-amber-50 border-amber-100'
      : isSuccess
      ? 'bg-emerald-50 border-emerald-100'
      : 'bg-sky-50 border-sky-100',
    iconGradient: (isError
      ? ['#F43F5E', '#E11D48']
      : isWarning
      ? ['#F59E0B', '#D97706']
      : isSuccess
      ? ['#10B981', '#059669']
      : ['#0EA5E9', '#0284C7']) as [string, string],
    iconShadow: isError
      ? '#F43F5E'
      : isWarning
      ? '#F59E0B'
      : isSuccess
      ? '#10B981'
      : '#0284C7',
    msgCardBg: isError
      ? 'bg-rose-50/50 border-rose-100/90'
      : isWarning
      ? 'bg-amber-50/50 border-amber-100/90'
      : isSuccess
      ? 'bg-emerald-50/50 border-emerald-100/90'
      : 'bg-sky-50/60 border-sky-100/90',
    topBarGradient: (isError
      ? ['#F43F5E', '#E11D48', '#0B2136']
      : isWarning
      ? ['#F59E0B', '#D97706', '#0B2136']
      : isSuccess
      ? ['#10B981', '#059669', '#0B2136']
      : ['#0EA5E9', '#0284C7', '#0B2136']) as [string, string, string],
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(11, 33, 54, 0.65)' }}>
          <Animated.View
            style={{
              width: '100%',
              maxWidth: 348,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <View
              className="w-full bg-white rounded-[32px] overflow-hidden border border-sky-100/80"
              style={{
                shadowColor: '#0B2136',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.22,
                shadowRadius: 28,
                elevation: 12,
              }}
            >
              {/* Top Accent Gradient Line */}
              <LinearGradient
                colors={theme.topBarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 4, width: '100%' }}
              />

              <View className="p-6">
                {/* Header Row: Category Badge + Close Button */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className={`flex-row items-center px-3 py-1 rounded-full border ${theme.tagBg}`}>
                    <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: theme.tagDotColor }} />
                    <Text className={`text-[10px] font-extrabold tracking-widest uppercase ${theme.tagTextColor}`}>
                      {theme.tagText}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleClose}
                    hitSlop={8}
                    className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Line x1="18" y1="6" x2="6" y2="18" />
                      <Line x1="6" y1="6" x2="18" y2="18" />
                    </Svg>
                  </Pressable>
                </View>

                {/* Hero Icon with Dual Halo Rings */}
                <View className="items-center justify-center my-1">
                  <View className={`w-20 h-20 rounded-full items-center justify-center border ${theme.haloBg}`}>
                    <LinearGradient
                      colors={theme.iconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-14 h-14 rounded-full items-center justify-center"
                      style={{
                        shadowColor: theme.iconShadow,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 5,
                      }}
                    >
                      {isError ? (
                        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <Circle cx="12" cy="12" r="10" />
                          <Line x1="12" y1="8" x2="12" y2="12" />
                          <Line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
                        </Svg>
                      ) : isSuccess ? (
                        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <Polyline points="20 6 9 17 4 12" />
                        </Svg>
                      ) : isWarning ? (
                        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <Line x1="12" y1="9" x2="12" y2="13" />
                          <Line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
                        </Svg>
                      ) : (
                        <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          <Circle cx="18" cy="6" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
                        </Svg>
                      )}
                    </LinearGradient>
                  </View>
                </View>

                {/* Title */}
                <Text
                  className="text-xl font-black text-slate-900 text-center tracking-tight mt-3 mb-2"
                  style={{ fontFamily: 'Outfit' }}
                >
                  {alertTitle}
                </Text>

                {/* Message Box */}
                <View className={`rounded-2xl p-4 mb-6 border ${theme.msgCardBg}`}>
                  <Text
                    className="text-sm font-medium text-slate-700 text-center leading-relaxed"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {alertMessage}
                  </Text>
                </View>

                {/* Primary CTA Button */}
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: '#0B2136',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 5,
                  })}
                  className="rounded-full overflow-hidden"
                >
                  <LinearGradient
                    colors={['#0B2136', '#1A3959']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 px-6 flex-row items-center justify-center gap-2"
                  >
                    <Text
                      className="text-center text-white font-bold text-sm tracking-widest uppercase"
                      style={{ fontFamily: 'Outfit' }}
                    >
                      GOT IT
                    </Text>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points="9 18 15 12 9 6" />
                    </Svg>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

