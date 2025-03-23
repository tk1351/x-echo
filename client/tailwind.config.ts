import type { Config } from 'tailwindcss';
import { colors, typography, spacing, breakpoints, animation } from './src/styles';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors,
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontWeight: typography.fontWeight,
    letterSpacing: typography.letterSpacing,
    spacing,
    screens: {
      sm: breakpoints.sm,
      md: breakpoints.md,
      lg: breakpoints.lg,
      xl: breakpoints.xl,
      '2xl': breakpoints['2xl'],
    },
    extend: {
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },
      transitionDuration: animation.duration,
      transitionTimingFunction: animation.timing,
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
