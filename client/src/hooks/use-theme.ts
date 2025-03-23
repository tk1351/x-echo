'use client'

import { useEffect, useState } from 'react'
import { Theme } from '@/types/theme'

/**
 * テーマを管理するカスタムフック
 * ローカルストレージからテーマ設定を読み込み、テーマの切り替えを処理します
 * @returns テーマの状態と切り替え関数を含むオブジェクト
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme) {
        setTheme(savedTheme)
        applyTheme(savedTheme)
      }
    }
  }, [])

  /**
   * テーマを適用する関数
   * @param newTheme 適用するテーマ
   */
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  /**
   * テーマを設定し、ローカルストレージに保存する関数
   * @param newTheme 設定するテーマ
   */
  const setThemeAndSave = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme: setThemeAndSave }
}
