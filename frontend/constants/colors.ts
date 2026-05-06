export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  news: string;
  newsLight: string;
  // Derived / aliased for existing usage
  tabInactive: string;
  tagBg: string;
  tagText: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8F8F8',
  card: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  primary: '#534AB7',
  primaryLight: '#EEEDFE',
  news: '#185FA5',
  newsLight: '#E6F1FB',
  tabInactive: '#999999',
  tagBg: '#F8F8F8',
  tagText: '#666666',
};

const darkColors: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  card: '#222222',
  textPrimary: '#F1F1F1',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  border: '#333333',
  primary: '#7F77DD',
  primaryLight: '#2A2750',
  news: '#378ADD',
  newsLight: '#0C1E33',
  tabInactive: '#666666',
  tagBg: '#1A1A1A',
  tagText: '#AAAAAA',
};

export const palettes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

// Backwards-compatible default export — light palette.
// Prefer `useColors()` from `@/constants/theme` for theme-aware access.
export const Colors = lightColors;
