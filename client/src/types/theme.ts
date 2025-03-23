/**
 * テーマの型定義
 * ライト、ダーク、システム設定に基づくテーマを表します
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * テーマプロバイダーの状態の型定義
 * 現在のテーマとテーマを変更するための関数を含みます
 */
export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
