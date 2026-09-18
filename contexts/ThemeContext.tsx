import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { AppTheme, ColorPalette } from "@/apps";
import { FeatureFlags } from "@/constants/featureFlags";

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
  scheme: "light" | "dark";
  /**
   * Whether dark mode is available at all in this build. False when the
   * `darkMode` feature flag is off — useful for hiding a theme toggle.
   */
  darkModeEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: React.ReactNode;
  /** Override the system color scheme (useful for a manual theme toggle) */
  forcedScheme?: "light" | "dark";
}

export function ThemeProvider({ children, forcedScheme }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolvedScheme =
    systemScheme === "unspecified" ? "light" : systemScheme;

  // The system scheme is still read (the hook must run unconditionally), but
  // it is ignored while the dark-mode flag is off so the app stays light even
  // on a device set to dark.
  const requestedScheme: "light" | "dark" = forcedScheme ?? resolvedScheme ?? "light";
  const scheme: "light" | "dark" = FeatureFlags.darkMode
    ? requestedScheme
    : "light";
  const isDark = scheme === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: AppTheme[scheme],
      isDark,
      scheme,
      darkModeEnabled: FeatureFlags.darkMode,
    }),
    [scheme, isDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export type { ColorPalette };
