import { DEFAULT_FEATURES, type AppFeatures } from "./features";

export const Config = {
  name: "Brighton",
  /**
   * Base URL of the School Mobile API for this app.
   * Each app can point at its own host; override at build time with
   * EXPO_PUBLIC_API_URL when testing against another environment.
   */
  // apiUrl: "https://devapi.schoolzyapp.com", // test
  apiUrl: "https://apibbs.schoolzyapp.com", // prod
  /** Per-school feature toggles — see `apps/features.ts`. */
  features: DEFAULT_FEATURES as AppFeatures,
};

// Values follow the approved design handoff (Design-Tokens/colors.json).
// Anything the palette below has no key for lives in `constants/tokens.ts`.
export const Colors = {
  primary: "#800E37",
  secondary: "#4E7FD0",
  tertiary: "#FFAF44",

  lightGrey: "#F3F3F3",
  dark: "#1C1C1E",
  darkerGrey: "#272727",
  // Design "tertiary" text — captions, dates, placeholders. The darker
  // "secondary" grey (#6C6C70) is `Palette.text.secondary` in tokens.
  grey: "#8A8A8E",
  white: "#FFFFFF",
  green: "#33C11A",
  red: "#E53E3E",
  blue: "#4E73DF",
  offWhite: "#E6E6E8",
  success: "#24860F",
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

    placeholder: Colors.grey,
    textPrimary: Colors.dark,
    textSecondary: Colors.grey,
    textPrimaryInverted: Colors.white,
    textSecondaryInverted: Colors.lightGrey,
    errorText: Colors.red,

    success: Colors.success,
    warning: "#9A5A00",
    danger: Colors.red,
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
