import { setupFormTest } from "@/test/setup-form-test";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginFormWrapper } from "./login-form-wrapper";

describe("LoginFormWrapper", () => {
  // テスト間でDOMをクリーンアップ
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", () => {
    const { screen } = setupFormTest(<LoginFormWrapper />);
    expect(screen.getByRole("form", { name: "ログイン" })).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const { user, screen } = setupFormTest(<LoginFormWrapper />);

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // Verify console.log was called with the form data
    expect(consoleSpy).toHaveBeenCalledWith("Form submitted:", {
      identifier: "testuser",
      password: "password123"
    });
  });

  it("shows error message when submission fails", async () => {
    // Mock console.error to throw an error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("Test error");
    });

    const { user, screen } = setupFormTest(<LoginFormWrapper />);

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名またはメールアドレス/i }),
      "testuser"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const loginButton = screen.getByRole("button", { name: /ログイン/i });
    await user.click(loginButton);

    // Verify error message is displayed
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An error occurred. Please try again later."
    );

    // Restore mocks
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
