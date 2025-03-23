'use client'

import { createContext, useContext, useEffect } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { ThemeProviderState } from '@/types/theme'

/**
 * テーマプロバイダーの初期状態
 */
const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

/**
 * テーマプロバイダーのコンテキスト
 */
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

/**
 * テーマプロバイダーのプロパティ
 */
type ThemeProviderProps = {
  children: React.ReactNode
}

/**
 * テーマプロバイダーコンポーネント
 * アプリケーション全体でテーマを管理します
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * テーマプロバイダーのコンテキストを使用するカスタムフック
 * @returns テーマの状態と切り替え関数を含むオブジェクト
 */
export const useThemeContext = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
