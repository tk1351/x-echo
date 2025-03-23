// 色のシェード値の型定義
type PrimaryShades = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

// ニュートラルシェードの型定義
type NeutralShades = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

// 機能色の型定義
type FunctionalColor = {
  light: string;
  DEFAULT: string;
  dark: string;
};

// カラーパレット全体の型定義
type ColorPalette = {
  primary: PrimaryShades;
  neutral: NeutralShades;
  success: FunctionalColor;
  warning: FunctionalColor;
  error: FunctionalColor;
  info: FunctionalColor;
};

export const colors = {
  // Brand colors
  primary: {
    50: "#e6f1ff",
    100: "#cce3ff",
    200: "#99c7ff",
    300: "#66abff",
    400: "#338fff",
    500: "#0073ff", // Main color
    600: "#005cd9",
    700: "#0044b3",
    800: "#002d8c",
    900: "#001766",
  },
  // Grayscale
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  // Functional colors
  success: {
    light: "#d1fae5",
    DEFAULT: "#10b981",
    dark: "#065f46",
  },
  warning: {
    light: "#fef3c7",
    DEFAULT: "#f59e0b",
    dark: "#92400e",
  },
  error: {
    light: "#fee2e2",
    DEFAULT: "#ef4444",
    dark: "#b91c1c",
  },
  info: {
    light: "#dbeafe",
    DEFAULT: "#3b82f6",
    dark: "#1e40af",
  },
} as const satisfies ColorPalette;
