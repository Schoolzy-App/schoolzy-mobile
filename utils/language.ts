import { I18nManager } from "react-native";

/**
 * The UI language.
 *
 * The app has no language switch yet and renders English. It follows the
 * layout direction instead of the device locale, so a screen never shows
 * Arabic text in a left-to-right layout: once RTL is turned on for Arabic,
 * every screen that reads this switches with it.
 */
export type AppLanguage = "en" | "ar";

export function appLanguage(): AppLanguage {
  return I18nManager.isRTL ? "ar" : "en";
}

/** `Accept-Language` for endpoints that localise names and reasons. */
export function acceptLanguageHeader(): Record<string, string> {
  return { "Accept-Language": appLanguage() };
}
