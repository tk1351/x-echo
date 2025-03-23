// アニメーション時間の型定義
type Duration = {
  fast: string;
  normal: string;
  slow: string;
};

// イージング関数の型定義
type Timing = {
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
};

// アニメーション全体の型定義
type Animation = {
  duration: Duration;
  timing: Timing;
};

export const animation = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  timing: {
    ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    easeIn: "cubic-bezier(0.42, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.58, 1)",
    easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  },
} as const satisfies Animation;
