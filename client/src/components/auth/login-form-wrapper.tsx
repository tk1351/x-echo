"use client";

import { useAuthStore } from "@/store/auth-store";
import type { LoginFormData } from "@/validations/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginForm } from "./login-form";

// 明示的な型定義で安全性を向上
export interface LoginFormWrapperProps {
  loginFn?: (identifier: string, password: string) => Promise<void>;
  routerPushFn?: (path: string) => void;
  isInitiallySubmitting?: boolean;
  initialError?: string | null;
}

// 実際のアプリで使用するためのラッパー
export function LoginFormWrapperWithDefaults() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  return (
    <LoginFormWrapper
      loginFn={login}
      routerPushFn={router.push}
    />
  );
}

// テスト可能なコア実装
export function LoginFormWrapper({
  loginFn,
  routerPushFn,
  isInitiallySubmitting = false,
  initialError = null,
}: LoginFormWrapperProps = {}) {
  // 実際のアプリでのデフォルト値を取得
  const authLogin = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(isInitiallySubmitting);
  const [error, setError] = useState<string | null>(initialError);

  // Use provided functions or defaults
  const login = loginFn || authLogin;
  const push = routerPushFn || (() => {});

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Log for debugging purposes
      console.log("Form submitted:", data);

      // Call the login function
      await login(data.identifier, data.password);

      // Redirect to home page after successful login
      push("/");
    } catch (err) {
      // Display specific error message from API if available
      setError(
        err instanceof Error
          ? err.message
          : "ログインに失敗しました。後でもう一度お試しください。"
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div
          className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded mb-4"
          role="alert"
          data-testid="error-message"
        >
          {error}
        </div>
      )}
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}
