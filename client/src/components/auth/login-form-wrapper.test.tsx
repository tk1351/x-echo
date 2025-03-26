import { setupFormTest } from "@/test/setup-form-test";
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginFormWrapper } from "./login-form-wrapper";

// テスト用のヘルパー関数
function setupLoginFormTest(options = {}) {
  const defaultOptions = {
    loginFn: vi.fn().mockResolvedValue(undefined),
    routerPushFn: vi.fn(),
    isInitiallySubmitting: false,
    initialError: null,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const utils = setupFormTest(
    <LoginFormWrapper
      loginFn={mergedOptions.loginFn}
      routerPushFn={mergedOptions.routerPushFn}
      isInitiallySubmitting={mergedOptions.isInitiallySubmitting}
      initialError={mergedOptions.initialError}
    />
  );

  return {
    ...utils,
    ...mergedOptions,
  };
}

describe("LoginFormWrapper", () => {
  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", () => {
    const { screen } = setupLoginFormTest();
    expect(screen.getByRole("form", { name: "ログイン" })).toBeInTheDocument();
  });

  it("calls login function and redirects on successful submission", async () => {
    const { user, screen, loginFn, routerPushFn } = setupLoginFormTest();
    const consoleSpy = vi.spyOn(console, "log");

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith("testuser", "password123");
    });

    // コンソールログの検証
    expect(consoleSpy).toHaveBeenCalledWith("Form submitted:", {
      identifier: "testuser",
      password: "password123",
    });

    // リダイレクトの検証
    expect(routerPushFn).toHaveBeenCalledWith("/");
  });

  it("shows error message when login fails with specific error", async () => {
    const loginFn = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    const { user, screen } = setupLoginFormTest({ loginFn });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
    });

    // ログイン関数の呼び出しを検証
    expect(loginFn).toHaveBeenCalledWith("testuser", "password123");

    consoleErrorSpy.mockRestore();
  });

  it("shows generic error message when login fails without specific error", async () => {
    const loginFn = vi.fn().mockRejectedValue("Unknown error");
    const { user, screen } = setupLoginFormTest({ loginFn });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "ログインに失敗しました。後でもう一度お試しください。"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("displays initial error if provided", () => {
    const { screen } = setupLoginFormTest({
      initialError: "初期エラーメッセージ"
    });

    expect(screen.getByRole("alert")).toHaveTextContent("初期エラーメッセージ");
  });

  it("shows loading state during submission", async () => {
    // 意図的に解決を遅延させるモック
    const loginFn = vi.fn().mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(undefined), 100);
    }));

    const { user, screen } = setupLoginFormTest({ loginFn });

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // ボタンがdisabled状態になることを確認
    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent("Processing...");
  });
});
