import type { User } from "@prisma/client";
import * as honoJwt from "hono/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthErrorType } from "../../utils/errors.js";
import {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokenService.js";

// Hono JWT ヘルパーのモック
vi.mock("hono/jwt", () => ({
  sign: vi.fn(),
  verify: vi.fn(),
  decode: vi.fn(),
}));

describe("tokenService", () => {
  const mockUser: User = {
    id: 1,
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedpassword",
    bio: null,
    profileImageUrl: null,
    headerImageUrl: null,
    followersCount: 0,
    followingCount: 0,
    isVerified: false,
    isActive: true,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("generateTokenPair", () => {
    it("should generate access and refresh tokens", async () => {
      // Arrange
      vi.mocked(honoJwt.sign).mockResolvedValueOnce("mock-access-token");
      vi.mocked(honoJwt.sign).mockResolvedValueOnce("mock-refresh-token");

      // Act
      const result = await generateTokenPair(mockUser);

      // Assert
      expect(honoJwt.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toBe("mock-refresh-token");

      // パスワードハッシュが除外されていることを確認
      expect(result.user).not.toHaveProperty("passwordHash");

      // 必須プロパティが含まれていることを確認
      expect(result.user).toHaveProperty("id", 1);
      expect(result.user).toHaveProperty("username", "testuser");
      expect(result.user).toHaveProperty("displayName", "Test User");
      expect(result.user).toHaveProperty("email", "test@example.com");
      expect(result.user).toHaveProperty("role", "USER");
    });
  });

  describe("verifyAccessToken", () => {
    it("should return payload when token is valid", async () => {
      // Arrange
      const mockPayload = {
        userId: 1,
        username: "testuser",
        role: "USER",
      };
      vi.mocked(honoJwt.verify).mockResolvedValue(mockPayload);

      // Act
      const result = await verifyAccessToken("valid-token");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockPayload);
      }
      expect(honoJwt.verify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(String),
      );
    });

    it("should return error when token is expired", async () => {
      // Arrange
      vi.mocked(honoJwt.verify).mockRejectedValue({
        name: "JwtTokenExpired",
        message: "Token expired",
      });

      // Act
      const result = await verifyAccessToken("expired-token");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.TOKEN_EXPIRED);
      }
    });

    it("should return error when token is invalid", async () => {
      // Arrange
      vi.mocked(honoJwt.verify).mockRejectedValue({
        name: "JwtTokenInvalid",
        message: "Invalid token",
      });

      // Act
      const result = await verifyAccessToken("invalid-token");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_TOKEN);
      }
    });
  });

  describe("verifyRefreshToken", () => {
    it("should return userId when token is valid", async () => {
      // Arrange
      const mockPayload = { userId: 1 };
      vi.mocked(honoJwt.verify).mockResolvedValue(mockPayload);

      // Act
      const result = await verifyRefreshToken("valid-refresh-token");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockPayload);
      }
      expect(honoJwt.verify).toHaveBeenCalledWith(
        "valid-refresh-token",
        expect.any(String),
      );
    });

    it("should return error when token is expired", async () => {
      // Arrange
      vi.mocked(honoJwt.verify).mockRejectedValue({
        name: "JwtTokenExpired",
        message: "Token expired",
      });

      // Act
      const result = await verifyRefreshToken("expired-refresh-token");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.REFRESH_TOKEN_EXPIRED);
      }
    });

    it("should return error when token is invalid", async () => {
      // Arrange
      vi.mocked(honoJwt.verify).mockRejectedValue({
        name: "JwtTokenInvalid",
        message: "Invalid token",
      });

      // Act
      const result = await verifyRefreshToken("invalid-refresh-token");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_REFRESH_TOKEN);
      }
    });
  });
});
