import * as apiClient from "@/lib/api-client";
import { setupFormTest } from "@/test/setup-form-test";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterFormWrapper } from "./register-form-wrapper";

// Mock the Next.js router
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  registerUser: vi.fn(),
}));

describe("RegisterFormWrapper", () => {
  // テスト間でDOMをクリーンアップ
  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the registration form", () => {
    const { screen } = setupFormTest(<RegisterFormWrapper />);
    expect(screen.getByRole("form", { name: "登録" })).toBeInTheDocument();
  });

  it("calls registerUser API and redirects to login page on successful submission", async () => {
    // Mock successful API response
    vi.mocked(apiClient.registerUser).mockResolvedValue({
      message: "User registered successfully",
    });

    const consoleSpy = vi.spyOn(console, "log");
    const { user, screen } = setupFormTest(<RegisterFormWrapper />);

    // Fill out the form
    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名/i }),
      "testuser",
    );

    await user.type(
      screen.getByRole("textbox", { name: /表示名/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /メールアドレス/i }),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const registerButton = screen.getByRole("button", { name: /登録/i });
    await user.click(registerButton);

    // Verify API was called with correct data
    expect(apiClient.registerUser).toHaveBeenCalledWith({
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    // Verify console.log was called with the form data
    expect(consoleSpy).toHaveBeenCalledWith("Form submitted:", {
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    // Verify router.push was called with the correct path
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("shows API error message when submission fails", async () => {
    // Mock API error
    vi.mocked(apiClient.registerUser).mockRejectedValue(
      new Error("Username already exists"),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { user, screen } = setupFormTest(<RegisterFormWrapper />);

    // Fill out the form
    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名/i }),
      "testuser",
    );

    await user.type(
      screen.getByRole("textbox", { name: /表示名/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /メールアドレス/i }),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const registerButton = screen.getByRole("button", { name: /登録/i });
    await user.click(registerButton);

    // Verify API was called
    expect(apiClient.registerUser).toHaveBeenCalled();

    // Verify error message is displayed with the API error message
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Username already exists",
    );

    // Verify router.push was not called
    expect(pushMock).not.toHaveBeenCalled();

    // Restore mocks
    consoleErrorSpy.mockRestore();
  });

  it("shows generic error message when submission fails with non-Error object", async () => {
    // Mock API error with non-Error object
    vi.mocked(apiClient.registerUser).mockRejectedValue("Unknown error");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { user, screen } = setupFormTest(<RegisterFormWrapper />);

    // Fill out the form
    await user.type(
      screen.getByRole("textbox", { name: /ユーザー名/i }),
      "testuser",
    );

    await user.type(
      screen.getByRole("textbox", { name: /表示名/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /メールアドレス/i }),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/パスワード/i), "password123");

    const registerButton = screen.getByRole("button", { name: /登録/i });
    await user.click(registerButton);

    // Verify API was called
    expect(apiClient.registerUser).toHaveBeenCalled();

    // Verify generic error message is displayed
    expect(screen.getByRole("alert")).toHaveTextContent(
      "登録に失敗しました。後でもう一度お試しください。",
    );

    // Restore mocks
    consoleErrorSpy.mockRestore();
  });
});
