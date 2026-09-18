import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { AppImages } from "@/apps";
import { Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";

interface SplashScreenProps {
  /** Called when the splash should be torn down (after the timer elapses). */
  onFinish?: () => void;
  /** How long the splash is shown for, in ms. Default 2200ms. */
  durationMs?: number;
}

// ─── Dots loader: 5 dots in a tight cluster, fading in/out in a loop ────────
function DotsLoader({ color }: { color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Dot key={i} index={i} progress={progress} color={color} />
      ))}
    </View>
  );
}

function Dot({
  index,
  progress,
  color,
}: {
  index: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // Stagger each dot's pulse
    const offset = index * 0.15;
    const t = (progress.value + offset) % 1;
    const opacity = 0.25 + 0.75 * Math.sin(t * Math.PI);
    return { opacity };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color }, animatedStyle]}
    />
  );
}

export default function SplashScreen({
  onFinish,
  durationMs = 2200,
}: SplashScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Fade-out animation when finishing
  const opacity = useSharedValue(1);
  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!onFinish) return;
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        "worklet";
        if (finished) {
          // Callback runs on the UI thread — hop back to JS to call onFinish.
          runOnJS(onFinish)();
        }
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onFinish, opacity]);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* ── Gradient background ──────────────────────────────────────── */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={colors.splashGradient[0]}
              stopOpacity="1"
            />
            <Stop
              offset="1"
              stopColor={colors.splashGradient[1]}
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashBg)" />
      </Svg>

      {/* ── School logo centerpiece ────────────────────────────────── */}
      <View style={styles.center}>
        <Image
          source={AppImages.splashLogo}
          style={styles.schoolLogo}
          resizeMode="contain"
        />
      </View>

      {/* ── Loader dots above the footer ────────────────────────────── */}
      <View style={styles.loaderArea}>
        <DotsLoader color={colors.buttonText} />
      </View>

      {/* ── Powered by Schoolzy footer ──────────────────────────────── */}
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <Text variant="label3" weight="regular" color={colors.buttonText}>
          Powered by
        </Text>
        <View style={styles.divider} />
        <Image
          source={AppImages.schoolzyBrand}
          style={[styles.schoolzyBrand, { tintColor: colors.buttonText }]}
          resizeMode="contain"
        />
        <Text
          variant="label2"
          weight="bold"
          color={colors.buttonText}
          style={styles.brandText}
        >
          Schoolzy
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  schoolLogo: {
    width: 220,
    height: 220,
  },
  loaderArea: {
    paddingBottom: 32,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 2,
  },
  schoolzyBrand: {
    width: 22,
    height: 22,
  },
  brandText: {
    letterSpacing: 0.3,
  },
});
