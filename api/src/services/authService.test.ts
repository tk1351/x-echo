import type { PrismaClient, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// bcryptのモック
vi.mock("bcrypt", () => ({
  compare: vi.fn().mockImplementation(() => Promise.resolve(true)),
}));
import * as tokenBlacklistRepository from "../domain/auth/tokenBlacklistRepository.js";
import * as tokenService from "../domain/auth/tokenService.js";
import * as userRepository from "../domain/user/userRepository.js";
import type { JwtPayload, TokenPair } from "../types/auth.js";
import { AuthErrorType, UserErrorType } from "../utils/errors.js";
import { login, logout, refreshTokens } from "./authService.js";

// モックユーザー
const mockUser: User = {
  id: 1,
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
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

// モックトークンペア
const mockTokenPair: TokenPair = {
  accessToken: "mock.access.token" as any,
  refreshToken: "mock.refresh.token" as any,
  user: {
    id: mockUser.id,
    username: mockUser.username,
    displayName: mockUser.displayName,
    email: mockUser.email,
    bio: mockUser.bio,
    profileImageUrl: mockUser.profileImageUrl,
    headerImageUrl: mockUser.headerImageUrl,
    followersCount: mockUser.followersCount,
    followingCount: mockUser.followingCount,
    isVerified: mockUser.isVerified,
    isActive: mockUser.isActive,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  },
};

// モックPrismaクライアント
const mockPrisma = {} as PrismaClient;

describe("authService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("login", () => {
    it("有効な認証情報で正常にログインできること", async () => {
      // Arrange
      const credentials = {
        identifier: "testuser",
        password: "password123",
      };

      vi.spyOn(userRepository, "findUserByIdentifier").mockResolvedValueOnce({
        ok: true,
        value: mockUser,
      });

      vi.spyOn(tokenService, "generateTokenPair").mockResolvedValueOnce(
        mockTokenPair,
      );

      // bcryptのcompareをtrueに設定
      const { compare } = await import("bcrypt");
      vi.mocked(compare).mockResolvedValueOnce(true as unknown as undefined);

      // Act
      const result = await login(credentials, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTokenPair);
      }
      expect(userRepository.findUserByIdentifier).toHaveBeenCalledWith(
        credentials.identifier,
        mockPrisma,
      );
    });

    it("ユーザーが存在しない場合エラーを返すこと", async () => {
      // Arrange
      const credentials = {
        identifier: "nonexistent",
        password: "password123",
      };

      vi.spyOn(userRepository, "findUserByIdentifier").mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      });

      // Act
      const result = await login(credentials, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      }
    });

    it("パスワードが一致しない場合エラーを返すこと", async () => {
      // Arrange
      const credentials = {
        identifier: "testuser",
        password: "wrongpassword",
      };

      vi.spyOn(userRepository, "findUserByIdentifier").mockResolvedValueOnce({
        ok: true,
        value: mockUser,
      });

      // bcryptのcompareをfalseに設定
      const { compare } = await import("bcrypt");
      vi.mocked(compare).mockResolvedValueOnce(false as unknown as undefined);

      // Act
      const result = await login(credentials, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      }
    });
  });

  describe("refreshTokens", () => {
    it("有効なリフレッシュトークンで新しいトークンペアを生成できること", async () => {
      // Arrange
      const refreshToken = "valid.refresh.token";
      const userId = 1;

      vi.spyOn(tokenService, "verifyRefreshToken").mockResolvedValueOnce({
        ok: true,
        value: { userId },
      });

      vi.spyOn(
        tokenBlacklistRepository,
        "isTokenBlacklisted",
      ).mockResolvedValueOnce({
        ok: true,
        value: false,
      });

      vi.spyOn(userRepository, "findUserById").mockResolvedValueOnce({
        ok: true,
        value: mockUser,
      });

      vi.spyOn(tokenService, "generateTokenPair").mockResolvedValueOnce(
        mockTokenPair,
      );

      // Act
      const result = await refreshTokens(refreshToken, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTokenPair);
      }
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(userRepository.findUserById).toHaveBeenCalledWith(
        userId,
        mockPrisma,
      );
    });

    it("無効なリフレッシュトークンの場合エラーを返すこと", async () => {
      // Arrange
      const refreshToken = "invalid.refresh.token";

      vi.spyOn(tokenService, "verifyRefreshToken").mockResolvedValueOnce({
        ok: false,
        error: {
          type: AuthErrorType.INVALID_REFRESH_TOKEN,
          message: "無効なリフレッシュトークンです",
        },
      });

      // Act
      const result = await refreshTokens(refreshToken, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_REFRESH_TOKEN);
      }
    });

    it("ブラックリストに登録されたトークンの場合エラーを返すこと", async () => {
      // Arrange
      const refreshToken = "blacklisted.refresh.token";
      const userId = 1;

      vi.spyOn(tokenService, "verifyRefreshToken").mockResolvedValueOnce({
        ok: true,
        value: { userId },
      });

      vi.spyOn(
        tokenBlacklistRepository,
        "isTokenBlacklisted",
      ).mockResolvedValueOnce({
        ok: true,
        value: true,
      });

      // Act
      const result = await refreshTokens(refreshToken, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INVALID_REFRESH_TOKEN);
      }
    });

    it("ユーザーが存在しない場合エラーを返すこと", async () => {
      // Arrange
      const refreshToken = "valid.refresh.token";
      const userId = 999;

      vi.spyOn(tokenService, "verifyRefreshToken").mockResolvedValueOnce({
        ok: true,
        value: { userId },
      });

      vi.spyOn(
        tokenBlacklistRepository,
        "isTokenBlacklisted",
      ).mockResolvedValueOnce({
        ok: true,
        value: false,
      });

      vi.spyOn(userRepository, "findUserById").mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      });

      // Act
      const result = await refreshTokens(refreshToken, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.USER_NOT_FOUND);
      }
    });
  });

  describe("logout", () => {
    it("トークンを正常にブラックリストに追加できること", async () => {
      // Arrange
      const token = "access.token.to.blacklist";
      const decodedToken: JwtPayload = {
        userId: 1,
        username: "testuser",
        role: "USER",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
      };

      vi.spyOn(tokenService, "verifyAccessToken").mockResolvedValueOnce({
        ok: true,
        value: decodedToken,
      });

      vi.spyOn(
        tokenBlacklistRepository,
        "addToBlacklist",
      ).mockResolvedValueOnce({
        ok: true,
        value: undefined,
      });

      // Act
      const result = await logout(token, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(tokenBlacklistRepository.addToBlacklist).toHaveBeenCalledWith(
        token,
        expect.any(Date),
        mockPrisma,
      );
    });

    it("無効なトークンの場合でも成功を返すこと", async () => {
      // Arrange
      const token = "invalid.access.token";

      vi.spyOn(tokenService, "verifyAccessToken").mockResolvedValueOnce({
        ok: false,
        error: {
          type: AuthErrorType.INVALID_TOKEN,
          message: "無効なアクセストークンです",
        },
      });

      // Act
      const result = await logout(token, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      expect(tokenBlacklistRepository.addToBlacklist).not.toHaveBeenCalled();
    });

    it("ブラックリスト追加中にエラーが発生した場合エラーを返すこと", async () => {
      // Arrange
      const token = "access.token.to.blacklist";
      const decodedToken: JwtPayload = {
        userId: 1,
        username: "testuser",
        role: "USER",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
      };

      vi.spyOn(tokenService, "verifyAccessToken").mockResolvedValueOnce({
        ok: true,
        value: decodedToken,
      });

      vi.spyOn(
        tokenBlacklistRepository,
        "addToBlacklist",
      ).mockResolvedValueOnce({
        ok: false,
        error: {
          type: AuthErrorType.INTERNAL_ERROR,
          message: "トークンのブラックリスト登録中にエラーが発生しました",
        },
      });

      // Act
      const result = await logout(token, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(AuthErrorType.INTERNAL_ERROR);
      }
    });
  });
});
