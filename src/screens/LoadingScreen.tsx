import React from "react";
import { View, StyleSheet, Platform, StatusBar } from "react-native";
import { CuraLoadingAnimation } from "../components/CuraLoadingAnimation";

interface Props {
  text?: string;
  showText?: boolean;
}

/**
 * Fullscreen Loading Page Component
 * Drop-in loading screen centered on a clean white background with the CURA animated logo.
 */
export function LoadingScreen({ text = "Loading...", showText = true }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CuraLoadingAnimation
        size={160}
        text={text}
        showText={showText}
        fullScreen={true}
        backgroundColor="#FFFFFF"
      />
    </View>
  );
}

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: Platform.OS === "web" ? ("100dvh" as any) : "100%",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
