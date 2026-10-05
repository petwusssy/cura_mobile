import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface AlertContextProps {
  showAlert: (title: string, message: string) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsOpen(true);
  };

  const isError =
    (alertTitle || '').toLowerCase().includes('error') ||
    (alertTitle || '').toLowerCase().includes('fail');

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(11, 33, 54, 0.65)' }}>
          <View
            className="w-full max-w-[340px] bg-white rounded-[32px] p-6 border border-sky-100/80"
            style={{
              shadowColor: '#0B2136',
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.18,
              shadowRadius: 28,
              elevation: 10,
            }}
          >
            {/* Top Decorative Pill Accent */}
            <View
              style={{
                height: 4,
                width: 44,
                borderRadius: 2,
                backgroundColor: isError ? '#F43F5E' : '#0284C7',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            {/* Hero Icon with Dual Concentric Rings */}
            <View className="items-center justify-center mb-3">
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: isError ? '#FFF1F2' : '#F0F9FF',
                  borderWidth: 2,
                  borderColor: isError ? '#FFE4E6' : '#BAE6FD',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isError ? '#E11D48' : '#0284C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isError ? '#E11D48' : '#0284C7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isError ? (
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Circle cx="12" cy="12" r="10" />
                      <Line x1="12" y1="8" x2="12" y2="12" />
                      <Line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
                    </Svg>
                  ) : (
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      <Circle cx="18" cy="6" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
                    </Svg>
                  )}
                </View>
              </View>
            </View>

            {/* Category / Status Badge */}
            <View
              style={{
                alignSelf: 'center',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: isError ? '#FFF1F2' : '#F0F9FF',
                borderWidth: 1,
                borderColor: isError ? '#FECDD3' : '#BAE6FD',
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isError ? '#E11D48' : '#0284C7',
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: isError ? '#BE123C' : '#0369A1',
                }}
              >
                {isError ? 'SYSTEM NOTICE' : 'CLINIC NOTICE'}
              </Text>
            </View>

            {/* Title */}
            <Text
              className="text-xl font-black text-slate-800 text-center mb-2"
              style={{ fontFamily: 'Outfit' }}
            >
              {alertTitle}
            </Text>

            {/* Message Box */}
            <View
              style={{
                backgroundColor: isError ? '#FFF1F2' : '#F8FAFC',
                borderWidth: 1,
                borderColor: isError ? '#FFE4E6' : '#E2E8F0',
                borderRadius: 18,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <Text
                className="text-sm text-slate-600 text-center leading-relaxed font-medium"
                style={{ fontFamily: 'Inter' }}
              >
                {alertMessage}
              </Text>
            </View>

            {/* Action Button */}
            <Pressable
              onPress={() => setIsOpen(false)}
              style={({ pressed }) => ({
                backgroundColor: '#0B2136',
                borderRadius: 9999,
                paddingVertical: 14,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4,
                shadowColor: '#0B2136',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text
                className="text-center text-white font-bold text-sm tracking-widest uppercase"
                style={{ fontFamily: 'Outfit' }}
              >
                GOT IT
              </Text>
            </Pressable>
          </View>
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

