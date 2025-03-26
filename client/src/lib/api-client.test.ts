import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginUser, logoutUser, registerUser } from "./api-client";

// Mock global fetch
global.fetch = vi.fn();

describe("API Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("loginUser", () => {
    it("should make a POST request to the login endpoint", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          accessToken: "test-token",
          refreshToken: "test-refresh-token",
          user: { id: 1, username: "testuser" },
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const credentials = { identifier: "testuser", password: "password123" };
      const result = await loginUser(credentials);

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        },
      );

      expect(result).toEqual({
        accessToken: "test-token",
        refreshToken: "test-refresh-token",
        user: { id: 1, username: "testuser" },
      });
    });

    it("should throw an error when the request fails", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: "Invalid credentials" },
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const credentials = { identifier: "testuser", password: "wrongpassword" };

      await expect(loginUser(credentials)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("registerUser", () => {
    it("should make a POST request to the register endpoint", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: "User registered successfully",
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const credentials = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const result = await registerUser(credentials);

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        },
      );

      expect(result).toEqual({
        message: "User registered successfully",
      });
    });

    it("should throw an error when the request fails", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: "Username already exists" },
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const credentials = {
        username: "existinguser",
        displayName: "Existing User",
        email: "existing@example.com",
        password: "password123",
      };

      await expect(registerUser(credentials)).rejects.toThrow(
        "Username already exists",
      );
    });
  });

  describe("logoutUser", () => {
    it("should make a POST request to the logout endpoint with authorization header", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: "Logged out successfully",
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const token = "test-token";
      const result = await logoutUser(token);

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/auth/logout",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        },
      );

      expect(result).toEqual({
        message: "Logged out successfully",
      });
    });

    it("should throw an error when the request fails", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: "Invalid token" },
        }),
      };

      (fetch as any).mockResolvedValue(mockResponse);

      const token = "invalid-token";

      await expect(logoutUser(token)).rejects.toThrow("Invalid token");
    });
  });
});
