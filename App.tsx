import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-gesture-handler";

import PushBanner from "@/components/PushBanner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUpdateCheck } from "@/hooks/useUpdateCheck";
import RootNavigator from "@/navigation/RootNavigator";
import { QueryProvider } from "@/providers/QueryProvider";
import SplashScreen from "@/screens/SplashScreen";

// Keep the native splash visible until JS is ready to take over
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* re-entry is fine */
});

function Root() {
  const { isDark } = useTheme();
  const { isRestoring } = useAuth();
  const [splashTimerDone, setSplashTimerDone] = useState(false);
  const { ready } = useUpdateCheck();

  // Keep the JS splash up until the timer elapses AND the persisted session has
  // been restored — otherwise a signed-in user briefly sees the login screen.
  const splashVisible = !splashTimerDone || isRestoring;

  // Hold the native splash until the initial update check resolves so a pending
  // OTA update can reload before any UI is shown.
  useEffect(() => {
    if (!ready) return;
    ExpoSplashScreen.hideAsync().catch(() => {
      /* already hidden */
    });
  }, [ready]);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        {/* Must sit inside the navigator: it navigates on notification taps. */}
        <PushLayer />
        <StatusBar style="light" />
      </NavigationContainer>

      {splashVisible ? (
        <SplashScreen onFinish={() => setSplashTimerDone(true)} />
      ) : null}
    </View>
  );
}

/**
 * Push delivery + the in-app banner shown for foreground messages.
 * Separate component so `usePushNotifications` can call `useNavigation`.
 */
function PushLayer() {
  const { banner, dismissBanner, openFrom } = usePushNotifications();

  return (
    <PushBanner
      message={banner}
      onPress={openFrom}
      onDismiss={dismissBanner}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <Root />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
