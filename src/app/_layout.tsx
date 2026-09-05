import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <Slot />
    </SafeAreaProvider>
  );
}
