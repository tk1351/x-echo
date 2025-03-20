import type { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtPayload } from "../types/auth.js";
import { AuthErrorType } from "../utils/errors.js";

// モック
vi.mock("../domain/auth/tokenService.js");
vi.mock("../domain/auth/tokenBlacklistRepository.js");
vi.mock("../lib/prisma.js", () => ({
  default: {},
}));

import * as tokenBlacklistRepository from "../domain/auth/tokenBlacklistRepository.js";
import * as tokenService from "../domain/auth/tokenService.js";
// 実装をインポート
import { authenticate, requireAdmin } from "./authMiddleware.js";

describe("認証ミドルウェア", () => {
  let mockContext: Context;
  let mockNext: () => Promise<void>;
  let mockHeaders: Record<string, string | undefined>;
  let mockJson: any;
  let mockSet: any;
  let mockGet: any;

  beforeEach(() => {
    // モックのリセット
    vi.resetAllMocks();

    // モックコンテキストの作成
    mockHeaders = {};
    mockJson = vi.fn().mockReturnValue({ json: "response" });
    mockSet = vi.fn();
    mockGet = vi.fn();

    mockContext = {
      req: {
        header: (name: string) => mockHeaders[name],
      },
      json: mockJson,
      set: mockSet,
      get: mockGet,
    } as unknown as Context;

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  describe("authenticate", () => {
    it("Authorizationヘッダーがない場合は401エラーを返す", async () => {
      // Authorizationヘッダーなし
      mockHeaders.Authorization = undefined;

      const result = await authenticate(mockContext, mockNext);

      expect(mockJson).toHaveBeenCalledWith(
        {
          error: {
            type: AuthErrorType.INVALID_TOKEN,
            message: "認証トークンが提供されていません",
          },
        },
        401,
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("Authorizationヘッダーが'Bearer 'で始まらない場合は401エラーを返す", async () => {
      // 不正なフォーマットのAuthorizationヘッダー
      mockHeaders.Authorization = "InvalidFormat token123";

      const result = await authenticate(mockContext, mockNext);

      expect(mockJson).toHaveBeenCalledWith(
        {
          error: {
            type: AuthErrorType.INVALID_TOKEN,
            message: "認証トークンが提供されていません",
          },
        },
        401,
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("トークンがブラックリストに登録されている場合は401エラーを返す", async () => {
      // 有効なAuthorizationヘッダー
      mockHeaders.Authorization = "Bearer validToken";

      // ブラックリストチェックが成功し、トークンがブラックリストに登録されている
      vi.mocked(tokenBlacklistRepository.isTokenBlacklisted).mockResolvedValue({
        ok: true,
        value: true,
      });

      const result = await authenticate(mockContext, mockNext);

      expect(tokenBlacklistRepository.isTokenBlacklisted).toHaveBeenCalledWith(
        "validToken",
        expect.anything(),
      );
      expect(mockJson).toHaveBeenCalledWith(
        {
          error: {
            type: AuthErrorType.INVALID_TOKEN,
            message: "トークンは無効化されています",
          },
        },
        401,
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("ブラックリストチェックでエラーが発生した場合は500エラーを返す", async () => {
      // 有効なAuthorizationヘッダー
      mockHeaders.Authorization = "Bearer validToken";

      // ブラックリストチェックでエラー
      const mockError = {
        type: AuthErrorType.INTERNAL_ERROR,
        message: "内部エラーが発生しました",
      };
      vi.mocked(tokenBlacklistRepository.isTokenBlacklisted).mockResolvedValue({
        ok: false,
        error: mockError,
      });

      const result = await authenticate(mockContext, mockNext);

      expect(tokenBlacklistRepository.isTokenBlacklisted).toHaveBeenCalledWith(
        "validToken",
        expect.anything(),
      );
      expect(mockJson).toHaveBeenCalledWith({ error: mockError }, 500);
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("トークン検証でエラーが発生した場合は401エラーを返す", async () => {
      // 有効なAuthorizationヘッダー
      mockHeaders.Authorization = "Bearer validToken";

      // ブラックリストチェックが成功し、トークンはブラックリストに登録されていない
      vi.mocked(tokenBlacklistRepository.isTokenBlacklisted).mockResolvedValue({
        ok: true,
        value: false,
      });

      // トークン検証でエラー
      const mockError = {
        type: AuthErrorType.TOKEN_EXPIRED,
        message: "トークンの有効期限が切れています",
      };
      vi.mocked(tokenService.verifyAccessToken).mockResolvedValue({
        ok: false,
        error: mockError,
      });

      const result = await authenticate(mockContext, mockNext);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith("validToken");
      expect(mockJson).toHaveBeenCalledWith({ error: mockError }, 401);
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("有効なトークンの場合はペイロードをコンテキストに設定し次のミドルウェアに進む", async () => {
      // 有効なAuthorizationヘッダー
      mockHeaders.Authorization = "Bearer validToken";

      // ブラックリストチェックが成功し、トークンはブラックリストに登録されていない
      vi.mocked(tokenBlacklistRepository.isTokenBlacklisted).mockResolvedValue({
        ok: true,
        value: false,
      });

      // トークン検証が成功
      const mockPayload: JwtPayload = {
        userId: 1,
        username: "testuser",
        role: "USER",
      };
      vi.mocked(tokenService.verifyAccessToken).mockResolvedValue({
        ok: true,
        value: mockPayload,
      });

      await authenticate(mockContext, mockNext);

      expect(mockSet).toHaveBeenCalledWith("jwtPayload", mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("jwtPayloadがコンテキストに設定されていない場合は401エラーを返す", async () => {
      // jwtPayloadが設定されていない
      mockGet.mockReturnValue(undefined);

      const result = await requireAdmin(mockContext, mockNext);

      expect(mockJson).toHaveBeenCalledWith(
        {
          error: {
            type: AuthErrorType.INVALID_TOKEN,
            message: "認証が必要です",
          },
        },
        401,
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("ユーザーのロールがADMINでない場合は403エラーを返す", async () => {
      // 一般ユーザーのペイロード
      const mockPayload: JwtPayload = {
        userId: 1,
        username: "testuser",
        role: "USER",
      };
      mockGet.mockReturnValue(mockPayload);

      const result = await requireAdmin(mockContext, mockNext);

      expect(mockJson).toHaveBeenCalledWith(
        {
          error: {
            type: "FORBIDDEN",
            message: "この操作には管理者権限が必要です",
          },
        },
        403,
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(result).toEqual({ json: "response" });
    });

    it("ユーザーのロールがADMINの場合は次のミドルウェアに進む", async () => {
      // 管理者ユーザーのペイロード
      const mockPayload: JwtPayload = {
        userId: 1,
        username: "admin",
        role: "ADMIN",
      };
      mockGet.mockReturnValue(mockPayload);

      await requireAdmin(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
