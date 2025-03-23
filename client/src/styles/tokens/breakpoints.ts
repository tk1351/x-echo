// ブレークポイントの型定義
type Breakpoints = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
};

export const breakpoints = {
  sm: "40rem", // 640px
  md: "48rem", // 768px
  lg: "64rem", // 1024px
  xl: "80rem", // 1280px
  "2xl": "96rem", // 1536px
} as const satisfies Breakpoints;
