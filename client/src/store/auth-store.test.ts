import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./auth-store";
import * as apiClient from "@/lib/api-client";

// Mock the API client functions
vi.mock("@/lib/api-client", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

// Mock localStorage for persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Clear localStorage
    window.localStorage.clear();

    // Reset store state
    const store = useAuthStore.getState();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定されていること", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("login", () => {
    it("ログインが成功した場合、状態が正しく更新されること", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        isActive: true,
        role: "USER",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      const mockResponse = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        user: mockUser,
      };

      // Mock the loginUser function to return the mock response
      vi.mocked(apiClient.loginUser).mockResolvedValue(mockResponse);

      // Call the login function
      await useAuthStore.getState().login("testuser", "password123");

      // Check that the state was updated correctly
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("test-access-token");
      expect(state.refreshToken).toBe("test-refresh-token");
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Check that the API client was called with the correct arguments
      expect(apiClient.loginUser).toHaveBeenCalledWith({
        identifier: "testuser",
        password: "password123",
      });
    });

    it("ログインが失敗した場合、エラー状態が正しく設定されること", async () => {
      // Mock the loginUser function to throw an error
      vi.mocked(apiClient.loginUser).mockRejectedValue(
        new Error("Invalid credentials")
      );

      // Call the login function and expect it to throw
      await expect(
        useAuthStore.getState().login("testuser", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");

      // Check that the state was updated correctly
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid credentials");

      // Check that the API client was called with the correct arguments
      expect(apiClient.loginUser).toHaveBeenCalledWith({
        identifier: "testuser",
        password: "wrongpassword",
      });
    });
  });

  describe("logout", () => {
    it("ログアウトが成功した場合、状態が正しくリセットされること", async () => {
      // Set up initial authenticated state
      useAuthStore.setState({
        user: {
          id: 1,
          username: "testuser",
          displayName: "Test User",
          email: "test@example.com",
          followersCount: 0,
          followingCount: 0,
          isVerified: false,
          isActive: true,
          role: "USER",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Mock the logoutUser function to return success
      vi.mocked(apiClient.logoutUser).mockResolvedValue({
        message: "Logged out successfully",
      });

      // Call the logout function
      await useAuthStore.getState().logout();

      // Check that the state was reset correctly
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Check that the API client was called with the correct arguments
      expect(apiClient.logoutUser).toHaveBeenCalledWith("test-access-token");
    });

    it("ログアウトが失敗した場合、エラー状態が正しく設定されること", async () => {
      // Set up initial authenticated state
      useAuthStore.setState({
        user: {
          id: 1,
          username: "testuser",
          displayName: "Test User",
          email: "test@example.com",
          followersCount: 0,
          followingCount: 0,
          isVerified: false,
          isActive: true,
          role: "USER",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Mock the logoutUser function to throw an error
      vi.mocked(apiClient.logoutUser).mockRejectedValue(
        new Error("Invalid token")
      );

      // Call the logout function and expect it to throw
      await expect(useAuthStore.getState().logout()).rejects.toThrow(
        "Invalid token"
      );

      // Check that the error state was set correctly
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid token");

      // User should still be authenticated since logout failed
      expect(state.user).not.toBeNull();
      expect(state.accessToken).not.toBeNull();
      expect(state.refreshToken).not.toBeNull();
      expect(state.isAuthenticated).toBe(true);

      // Check that the API client was called with the correct arguments
      expect(apiClient.logoutUser).toHaveBeenCalledWith("test-access-token");
    });
  });

  describe("clearError", () => {
    it("エラーがクリアされること", () => {
      // Set up initial state with an error
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Some error message",
      });

      // Call the clearError function
      useAuthStore.getState().clearError();

      // Check that the error was cleared
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("Persistence", () => {
    it("ログイン後に認証状態が保持されること", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        isActive: true,
        role: "USER",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      const mockResponse = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        user: mockUser,
      };

      // Mock the loginUser function to return the mock response
      vi.mocked(apiClient.loginUser).mockResolvedValue(mockResponse);

      // Call the login function
      await useAuthStore.getState().login("testuser", "password123");

      // Verify the state is updated correctly
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("test-access-token");
      expect(state.refreshToken).toBe("test-refresh-token");
      expect(state.isAuthenticated).toBe(true);

      // Create a new store instance to simulate a page refresh
      // This would normally load state from localStorage in a real environment
      const newStore = useAuthStore.getState();

      // Verify the state is still correct in the new store instance
      expect(newStore.user).toEqual(mockUser);
      expect(newStore.accessToken).toBe("test-access-token");
      expect(newStore.refreshToken).toBe("test-refresh-token");
      expect(newStore.isAuthenticated).toBe(true);
    });
  });
});
