import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { JwtPayload } from "../types/auth.js";
import type { UserProfileResponse } from "../types/index.js";
import { UserErrorType } from "../utils/errors.js";
import * as userService from "../services/userService.js";
import usersRouter from "./users.js";

// モックの作成
vi.mock("../services/userService.js");
vi.mock("../lib/prisma.js", () => ({
  default: {},
}));
vi.mock("../middleware/authMiddleware.js", () => ({
  authenticate: vi.fn((c, next) => next()),
}));

describe("User Profile API Endpoints", () => {
  let app: Hono;
  let mockUserProfile: UserProfileResponse;

  beforeEach(() => {
    vi.resetAllMocks();

    // テスト用アプリケーションの作成
    app = new Hono();
    app.route("/api/users", usersRouter);

    // モックユーザープロファイルデータ
    mockUserProfile = {
      id: 1,
      username: "testuser",
      displayName: "Test User",
      bio: "Test bio",
      profileImageUrl: null,
      headerImageUrl: null,
      followersCount: 0,
      followingCount: 0,
      isVerified: false,
      createdAt: new Date(),
    };
  });

  describe("GET /:username - Profile retrieval endpoint", () => {
    it("ユーザー名が存在する場合、ユーザープロファイルを返すこと", async () => {
      // Arrange
      vi.mocked(userService.getUserProfile).mockResolvedValueOnce({
        ok: true,
        value: mockUserProfile,
      });

      // Act
      const res = await app.request("/api/users/testuser");
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data).toMatchObject({
        id: mockUserProfile.id,
        username: mockUserProfile.username,
        displayName: mockUserProfile.displayName,
        bio: mockUserProfile.bio,
        profileImageUrl: mockUserProfile.profileImageUrl,
        headerImageUrl: mockUserProfile.headerImageUrl,
        followersCount: mockUserProfile.followersCount,
        followingCount: mockUserProfile.followingCount,
        isVerified: mockUserProfile.isVerified,
      });
      expect(data).toHaveProperty("createdAt");
      expect(userService.getUserProfile).toHaveBeenCalledWith(
        "testuser",
        expect.anything(),
      );
    });

    it("ユーザー名が存在しない場合、404エラーを返すこと", async () => {
      // Arrange
      vi.mocked(userService.getUserProfile).mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      });

      // Act
      const res = await app.request("/api/users/nonexistent");
      const data = await res.json();

      // Assert
      expect(res.status).toBe(404);
      expect(data).toEqual({ error: "ユーザーが見つかりません" });
    });

    it("内部エラーが発生した場合、500エラーを返すこと", async () => {
      // Arrange
      vi.mocked(userService.getUserProfile).mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.INTERNAL_ERROR,
          message: "内部エラーが発生しました",
        },
      });

      // Act
      const res = await app.request("/api/users/testuser");
      const data = await res.json();

      // Assert
      expect(res.status).toBe(500);
      expect(data).toEqual({ error: "内部エラーが発生しました" });
    });
  });

  describe("PUT /profile - Profile update endpoint", () => {
    it("有効なデータで認証済みユーザーがプロファイルを更新できること", async () => {
      // Arrange
      const updateData = {
        displayName: "Updated Name",
        bio: "Updated bio",
      };

      // 認証ミドルウェアのモック
      app = new Hono();
      app.use("/api/users/*", async (c, next) => {
        c.set("jwtPayload", { userId: 1 } as JwtPayload);
        await next();
      });
      app.route("/api/users", usersRouter);

      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        ok: true,
        value: {
          ...mockUserProfile,
          displayName: "Updated Name",
          bio: "Updated bio",
        },
      });

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data).toMatchObject({
        id: mockUserProfile.id,
        username: mockUserProfile.username,
        displayName: "Updated Name",
        bio: "Updated bio",
        profileImageUrl: mockUserProfile.profileImageUrl,
        headerImageUrl: mockUserProfile.headerImageUrl,
        followersCount: mockUserProfile.followersCount,
        followingCount: mockUserProfile.followingCount,
        isVerified: mockUserProfile.isVerified,
      });
      expect(data).toHaveProperty("createdAt");
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        1,
        updateData,
        expect.anything(),
      );
    });

    it("バリデーションエラーの場合、400エラーを返すこと", async () => {
      // Arrange
      const invalidData = {
        displayName: "", // 空の表示名（無効）
      };

      // 認証ミドルウェアのモック
      app = new Hono();
      app.use("/api/users/*", async (c, next) => {
        c.set("jwtPayload", { userId: 1 } as JwtPayload);
        await next();
      });
      app.route("/api/users", usersRouter);

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(400);
      expect(data).toHaveProperty("error", "Validation error");
      expect(data).toHaveProperty("details");
    });

    it("プロファイルデータが無効な場合、400エラーを返すこと", async () => {
      // Arrange
      const updateData = {
        displayName: "Valid Name",
        bio: "a".repeat(161), // 161文字（上限は160文字）
      };

      // 認証ミドルウェアのモック
      app = new Hono();
      app.use("/api/users/*", async (c, next) => {
        c.set("jwtPayload", { userId: 1 } as JwtPayload);
        await next();
      });
      app.route("/api/users", usersRouter);

      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.INVALID_PROFILE_DATA,
          message: "自己紹介は160文字以内である必要があります",
        },
      });

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("認証情報がない場合、401エラーを返すこと", async () => {
      // Arrange
      const updateData = {
        displayName: "Updated Name",
      };

      // 認証ミドルウェアのモック（jwtPayloadを設定しない）
      app = new Hono();
      app.route("/api/users", usersRouter);

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(401);
      expect(data).toHaveProperty("error");
    });

    it("ユーザーが見つからない場合、404エラーを返すこと", async () => {
      // Arrange
      const updateData = {
        displayName: "Updated Name",
      };

      // 認証ミドルウェアのモック
      app = new Hono();
      app.use("/api/users/*", async (c, next) => {
        c.set("jwtPayload", { userId: 999 } as JwtPayload); // 存在しないユーザーID
        await next();
      });
      app.route("/api/users", usersRouter);

      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      });

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(404);
      expect(data).toEqual({ error: "ユーザーが見つかりません" });
    });

    it("内部エラーが発生した場合、500エラーを返すこと", async () => {
      // Arrange
      const updateData = {
        displayName: "Updated Name",
      };

      // 認証ミドルウェアのモック
      app = new Hono();
      app.use("/api/users/*", async (c, next) => {
        c.set("jwtPayload", { userId: 1 } as JwtPayload);
        await next();
      });
      app.route("/api/users", usersRouter);

      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        ok: false,
        error: {
          type: UserErrorType.INTERNAL_ERROR,
          message: "内部エラーが発生しました",
        },
      });

      // Act
      const res = await app.request("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(500);
      expect(data).toEqual({ error: "内部エラーが発生しました" });
    });
  });
});
