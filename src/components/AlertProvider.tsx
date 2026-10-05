import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';

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

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={isOpen} transparent animationType="fade">
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
          <View className="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <View className="flex-row items-center justify-center mb-4">
              <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mb-1 border border-amber-100">
                <Text className="text-xl">⚠️</Text>
              </View>
            </View>
            <Text className="text-lg font-bold text-slate-800 text-center mb-2">{alertTitle}</Text>
            <Text className="text-sm text-slate-500 text-center leading-relaxed mb-6">{alertMessage}</Text>
            <Pressable 
              onPress={() => setIsOpen(false)}
              className="bg-cura-500 py-3.5 rounded-xl w-full"
              style={{ elevation: 2, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
              <Text className="text-center text-white font-bold text-sm tracking-wide">GOT IT</Text>
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
