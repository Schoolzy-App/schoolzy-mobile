import { DEFAULT_FEATURES, type AppFeatures } from "./features";

export const Config = {
  name: "Brighton",
  /**
   * Base URL of the School Mobile API for this app.
   * Each app can point at its own host; override at build time with
   * EXPO_PUBLIC_API_URL when testing against another environment.
   */
  apiUrl: "https://bbs.schoolzyapp.com",
  /** Per-school feature toggles — see `apps/features.ts`. */
  features: DEFAULT_FEATURES as AppFeatures,
};

export const Colors = {
  primary: "#821037",
  secondary: "#4F7DCA",
  tertiary: "#FFAF44",

  lightGrey: "#F4F4F4",
  dark: "#1D1D1D",
  darkerGrey: "#272727",
  grey: "#81828B",
  white: "#FFFFFF",
  green: "#36BD0D",
  red: "#CA1616",
  blue: "#5F70F2",
  offWhite: "#ECECEE",
  success: "#417353",
};

export const theme = {
  light: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    tertiary: Colors.tertiary,

    background: Colors.lightGrey,
    backgroundInverted: Colors.dark,
    surface: Colors.white,
    card: Colors.white,
    cardInverted: Colors.darkerGrey,
    border: Colors.offWhite,
    inputBorder: Colors.offWhite,
    shadow: Colors.grey,

    placeholder: "#A0AEC0",
    textPrimary: Colors.dark,
    textSecondary: Colors.grey,
    textPrimaryInverted: Colors.white,
    textSecondaryInverted: Colors.lightGrey,
    errorText: Colors.red,

    success: Colors.success,
    warning: "#E8A923",
    danger: "#CB2431",
    disabled: "#CBD5E0",
    buttonText: "#FFFFFF",

    // Splash background — Brighton uses its primary (burgundy)
    splashBg: Colors.primary,
    /** [topColor, bottomColor] for the splash linear gradient — dark → light */
    splashGradient: ["#4A0820", "#A12851"] as [string, string],
  },
  dark: {
    primary: "#A8294D",
    secondary: "#6B9FE4",
    tertiary: "#FFBF60",

    background: Colors.dark,
    backgroundInverted: Colors.lightGrey,
    surface: Colors.white,
    card: Colors.darkerGrey,
    cardInverted: Colors.white,
    border: Colors.offWhite,
    inputBorder: Colors.offWhite,
    shadow: Colors.grey,

    placeholder: "#A0AEC0",
    textPrimary: Colors.dark,
    textSecondary: Colors.grey,
    textPrimaryInverted: Colors.white,
    textSecondaryInverted: Colors.lightGrey,
    errorText: Colors.red,

    success: Colors.success,
    warning: "#FFD60A",
    danger: "#FF453A",
    disabled: "#3A3A3C",
    buttonText: "#FFFFFF",

    splashBg: Colors.primary,
    splashGradient: ["#4A0820", "#A12851"] as [string, string],
  },
}

export const Images = {
  /** Main app logo — used across in-app UI */
  logo: require("../assets/brighton/logo.png"),
  /** Logo used on the auth/login screen */
  loginLogo: require("../assets/brighton/logo.png"),
  /** Logo used as the splash centerpiece */
  splashLogo: require("../assets/brighton/logo.png"),
  /** Square school logo used in splash centerpiece (BBS shield) */
  logoSquare: require("../assets/brighton/logo.png"),
  /** Schoolzy brand mark for "Powered by" footer (white-tinted in UI) */
  schoolzyBrand: require("../assets/schoolzy/logo.png"),
}
