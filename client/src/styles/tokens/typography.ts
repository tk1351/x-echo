// フォントファミリーの型定義
type FontFamily = {
  sans: string;
  mono: string;
};

// フォントサイズの型定義
type FontSize = {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
  "5xl": string;
};

// 行の高さの型定義
type LineHeight = {
  none: string;
  tight: string;
  snug: string;
  normal: string;
  relaxed: string;
  loose: string;
};

// フォントの太さの型定義
type FontWeight = {
  light: string;
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
};

// 文字間隔の型定義
type LetterSpacing = {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
};

// タイポグラフィ全体の型定義
type Typography = {
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineHeight: LineHeight;
  fontWeight: FontWeight;
  letterSpacing: LetterSpacing;
};

export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const satisfies Typography;
