// brighton
import { Colors as AjialColors, Config as AjialConfig, Images as AjialImages, theme as AjialTheme } from './ajial';
import { Colors as BrightonColors, Config as BrightonConfig, Images as BrightonImages, theme as BrightonTheme } from './brighton';
import { Colors as SchoolzyColors, Config as SchoolzyConfig, Images as SchoolzyImages, theme as SchoolzyTheme } from './schoolzy';

export type ColorPalette = typeof BrightonTheme.light;
export type AppThemeType = { light: ColorPalette; dark: ColorPalette };
export type AppConfigType = typeof BrightonConfig;

export const Apps = {
  brighton: 'brighton',
  schoolzy: 'schoolzy',
  ajial: 'ajial',
}

const colors = {
  [Apps.brighton]: BrightonColors,
  [Apps.schoolzy]: SchoolzyColors,
  [Apps.ajial]: AjialColors,
}

const themes: Record<string, AppThemeType> = {
  [Apps.brighton]: BrightonTheme,
  [Apps.schoolzy]: SchoolzyTheme,
  [Apps.ajial]: AjialTheme,
}

const config: Record<string, AppConfigType> = {
  [Apps.brighton]: BrightonConfig,
  [Apps.schoolzy]: SchoolzyConfig,
  [Apps.ajial]: AjialConfig,
}

const images = {
  [Apps.brighton]: BrightonImages,
  [Apps.schoolzy]: SchoolzyImages,
  [Apps.ajial]: AjialImages,
}

const app = process.env.APP_VARIANT || Apps.brighton;

export const AppColors = colors[app];
export const AppTheme = themes[app];
export const AppConfig = config[app];
export const AppImages = images[app];