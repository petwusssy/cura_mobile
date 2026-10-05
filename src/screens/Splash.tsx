import { useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  Animated,
  Pressable,
  Image,
  useWindowDimensions,
  StyleSheet,
  Easing,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";

interface Props {
  onDone: () => void;
}

const curaLogoSource = require("../../assets/images/cura-logo.png");

let MaskedView: any = null;
try {
  MaskedView = require("@react-native-masked-view/masked-view").default;
} catch (e) {
  MaskedView = null;
}

export const SplashScreen = memo(function SplashScreen({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const systemReducedMotion =
    typeof useReducedMotion === "function" ? useReducedMotion() : false;
  const reduceMotion = Boolean(systemReducedMotion);

  // Responsive calculations: enlarged logo (~1.8x, max 240px) & bold prominent CURA text
  const logoSize = Math.min(width * 0.58, height < 700 ? 190 : 230);
  const wordmarkSize = width < 380 || height < 700 ? 68 : 82;
  const logoUri = Image.resolveAssetSource(curaLogoSource)?.uri || "";

  // Transition animations
  // 0 - 0.5s: fade-in and subtle scale (0.92 -> 1)
  // 0.5 - 2.2s: hold and shine
  // 2.2 - 2.5s: fade-out to landing page
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // 1) 5s infinite soft light band loop (exact same easing, timing & direction as landing page)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shineAnim]);

  // 2) Staged sequence: 0-0.5s In, 0.5-2.2s Hold/Shine, 2.2-2.5s Out -> onDone
  useEffect(() => {
    // Entrance: 500ms
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Fade-out at 2200ms
    const tOut = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 2200);

    // Complete transition at 2500ms
    const tDone = setTimeout(() => {
      onDoneRef.current?.();
    }, 2500);

    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, [entranceAnim, exitOpacity]);

  const contentOpacity = Animated.multiply(entranceAnim, exitOpacity);
  const contentScale = reduceMotion
    ? 1
    : entranceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.92, 1],
      });

  return (
    <Pressable
      onPress={() => onDoneRef.current?.()}
      style={[StyleSheet.absoluteFill, { backgroundColor: "#07173F" }]}
    >
      <StatusBar barStyle="light-content" />

      {/* Static full-bleed base gradient (identical to landing page base colors) */}
      <LinearGradient
        colors={["#07173F", "#091F53", "#0C2A6B", "#0F337B", "#123C8C"]}
        locations={[0, 0.24, 0.52, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Main Center Content (Exact centering and proportions as Landing Page Hero) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          }}
        >
          {/* CURA Shield Logo Icon with Masked Soft Light Band Shine */}
          {Platform.OS === "web" ? (
            <div
              style={{
                position: "relative",
                width: logoSize,
                height: logoSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <style>{`
                @keyframes splashLogoShineSweep {
                  0%, 100% {
                    transform: translateY(-110%);
                  }
                  50% {
                    transform: translateY(220%);
                  }
                }
                @keyframes splashTextShineSweep {
                  0%, 100% {
                    background-position: 0% 0%;
                  }
                  50% {
                    background-position: 0% 100%;
                  }
                }
              `}</style>
              {/* Base Logo */}
              <img
                src={logoUri}
                alt="CURA Logo"
                style={{
                  width: logoSize,
                  height: logoSize,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {/* Shine Overlay - strictly masked to the logo's PNG alpha */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  WebkitMaskImage: `url(${logoUri})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: `url(${logoUri})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: logoSize * 0.45,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(186,230,253,0.5) 30%, rgba(255,255,255,0.92) 50%, rgba(186,230,253,0.5) 70%, rgba(255,255,255,0) 100%)",
                    animation: "splashLogoShineSweep 5s ease-in-out infinite",
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            </div>
          ) : (
            <View
              style={{
                width: logoSize,
                height: logoSize,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {MaskedView ? (
                <MaskedView
                  style={{ width: logoSize, height: logoSize }}
                  maskElement={
                    <Image
                      source={curaLogoSource}
                      style={{ width: logoSize, height: logoSize }}
                      resizeMode="contain"
                    />
                  }
                >
                  <Image
                    source={curaLogoSource}
                    style={{ width: logoSize, height: logoSize }}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: logoSize * 0.45,
                      transform: [
                        {
                          translateY: shineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-logoSize * 0.55, logoSize * 1.15],
                          }),
                        },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 255, 255, 0)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0.88)",
                        "rgba(186, 230, 253, 0.4)",
                        "rgba(255, 255, 255, 0)",
                      ]}
                      locations={[0, 0.3, 0.5, 0.7, 1]}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Animated.View>
                </MaskedView>
              ) : (
                <Image
                  source={curaLogoSource}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              )}
            </View>
          )}

          {/* CURA Wordmark (White base with animated sky-blue color wave matching CURA Web & Landing Page) */}
          {Platform.OS === "web" ? (
            <div
              style={{
                position: "relative",
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              {/* Base text: pure white */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: wordmarkSize,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    fontFamily: "'Plus Jakarta Sans', Outfit, sans-serif",
                    lineHeight: 1,
                  }}
                >
                  CURA
                </span>
              </div>

              {/* Sky-blue color wave overlay masked strictly to text letters via background-clip: text */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: wordmarkSize,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    fontFamily: "'Plus Jakarta Sans', Outfit, sans-serif",
                    lineHeight: 1,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    backgroundImage:
                      "linear-gradient(180deg, rgba(186,230,253,0) 0%, rgba(186,230,253,0.85) 35%, #7DD3FC 50%, rgba(186,230,253,0.85) 65%, rgba(186,230,253,0) 100%)",
                    backgroundSize: "100% 280%",
                    animation: "splashTextShineSweep 5s ease-in-out infinite",
                  }}
                >
                  CURA
                </span>
              </div>
            </div>
          ) : (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {MaskedView ? (
                <MaskedView
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  maskElement={
                    <View
                      style={{
                        backgroundColor: "transparent",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#000000",
                          fontSize: wordmarkSize,
                          fontWeight: "800",
                          letterSpacing: 1.5,
                          fontFamily: "Outfit",
                        }}
                      >
                        CURA
                      </Text>
                    </View>
                  }
                >
                  {/* Base text: pure white */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: wordmarkSize,
                        fontWeight: "800",
                        letterSpacing: 1.5,
                        fontFamily: "Outfit",
                      }}
                    >
                      CURA
                    </Text>
                  </View>

                  {/* Sky-blue wave band strictly inside the text letters */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: -40,
                      right: -40,
                      height: wordmarkSize * 0.65,
                      transform: [
                        {
                          translateY: shineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-wordmarkSize * 0.75, wordmarkSize * 1.35],
                          }),
                        },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(186, 230, 253, 0)",
                        "rgba(186, 230, 253, 0.85)",
                        "#7DD3FC",
                        "rgba(186, 230, 253, 0.85)",
                        "rgba(186, 230, 253, 0)",
                      ]}
                      locations={[0, 0.25, 0.5, 0.75, 1]}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Animated.View>
                </MaskedView>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: wordmarkSize,
                      fontWeight: "800",
                      letterSpacing: 1.5,
                      fontFamily: "Outfit",
                    }}
                  >
                    CURA
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Subtitle: UNIVERSITY CLINIC */}
          <Text
            style={{
              color: "#BAE6FD",
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontFamily: "Outfit",
              marginTop: 12,
              textShadowColor: "rgba(0, 0, 0, 0.35)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            University Clinic
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Priority Tagline */}
      <View
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <Animated.Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#93C5FD",
            fontFamily: "Outfit",
            letterSpacing: 0.5,
            opacity: contentOpacity,
          }}
        >
          Your health, our priority
        </Animated.Text>
      </View>
    </Pressable>
  );
});
