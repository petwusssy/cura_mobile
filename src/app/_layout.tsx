import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function Layout() {
  return (
    <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
      <StatusBar style="dark" />
      <Slot />
    </SafeAreaProvider>
  );
}
