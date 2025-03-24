import { setupFormTest } from "@/test/setup-form-test";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterFormWrapper } from "./register-form-wrapper";

describe("RegisterFormWrapper", () => {
  // テスト間でDOMをクリーンアップ
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the registration form", () => {
    const { screen } = setupFormTest(<RegisterFormWrapper />);
    expect(screen.getByRole("form", { name: "登録" })).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const { user, screen } = setupFormTest(<RegisterFormWrapper />);

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名/i }),
      "testuser"
    );

    await user.type(
      screen.getByRole("textbox", { name: /表示名/i }),
      "Test User"
    );

    await user.type(
      screen.getByRole("textbox", { name: /メールアドレス/i }),
      "test@example.com"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const registerButton = screen.getByRole("button", { name: /登録/i });
    await user.click(registerButton);

    // Verify console.log was called with the form data
    expect(consoleSpy).toHaveBeenCalledWith("Form submitted:", {
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "password123"
    });
  });

  it("shows error message when submission fails", async () => {
    // Mock console.error to throw an error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("Test error");
    });

    const { user, screen } = setupFormTest(<RegisterFormWrapper />);

    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名/i }),
      "testuser"
    );

    await user.type(
      screen.getByRole("textbox", { name: /表示名/i }),
      "Test User"
    );

    await user.type(
      screen.getByRole("textbox", { name: /メールアドレス/i }),
      "test@example.com"
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const registerButton = screen.getByRole("button", { name: /登録/i });
    await user.click(registerButton);

    // Verify error message is displayed
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An error occurred. Please try again later."
    );

    // Restore mocks
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
