import type { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authService from "../services/authService.js";
import type { TokenPair } from "../types/auth.js";
import { AuthErrorType } from "../utils/errors.js";
import { login, logout, refresh } from "./authController.js";

// Prismaクライアントのモック
vi.mock("../lib/prisma.js", () => ({
	default: {},
}));

// モックコンテキスト
const createMockContext = () => {
	const mockContext = {
		req: {
			json: vi.fn(),
			header: vi.fn(),
		},
		json: vi.fn(),
		status: vi.fn().mockReturnThis(),
	} as unknown as Context;

	return mockContext;
};

// モックトークンペア
const mockTokenPair: TokenPair = {
	accessToken: "mock.access.token" as any,
	refreshToken: "mock.refresh.token" as any,
	user: {
		id: 1,
		username: "testuser",
		displayName: "Test User",
		email: "test@example.com",
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
	},
};

describe("authController", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe("login", () => {
		it("有効な認証情報で正常にログインできること", async () => {
			// Arrange
			const mockContext = createMockContext();
			const credentials = {
				identifier: "testuser",
				password: "password123",
			};

			mockContext.req.json.mockResolvedValueOnce(credentials);

			vi.spyOn(authService, "login").mockResolvedValueOnce({
				ok: true,
				value: mockTokenPair,
			});

			// Act
			await login(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(200);
			expect(mockContext.json).toHaveBeenCalledWith({
				accessToken: mockTokenPair.accessToken,
				refreshToken: mockTokenPair.refreshToken,
				user: mockTokenPair.user,
			});
			expect(authService.login).toHaveBeenCalledWith(
				credentials,
				expect.anything(),
			);
		});

		it("無効な認証情報の場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			const credentials = {
				identifier: "nonexistent",
				password: "wrongpassword",
			};

			mockContext.req.json.mockResolvedValueOnce(credentials);

			vi.spyOn(authService, "login").mockResolvedValueOnce({
				ok: false,
				error: {
					type: AuthErrorType.INVALID_CREDENTIALS,
					message: "ユーザー名/メールアドレスまたはパスワードが正しくありません",
				},
			});

			// Act
			await login(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(401);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: AuthErrorType.INVALID_CREDENTIALS,
					message: "ユーザー名/メールアドレスまたはパスワードが正しくありません",
				},
			});
		});

		it("リクエストボディが無効な場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			mockContext.req.json.mockRejectedValueOnce(new Error("Invalid JSON"));

			// Act
			await login(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(400);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: "VALIDATION_ERROR",
					message: "無効なリクエスト形式です",
				},
			});
		});
	});

	describe("refresh", () => {
		it("有効なリフレッシュトークンで新しいトークンペアを生成できること", async () => {
			// Arrange
			const mockContext = createMockContext();
			const refreshTokenRequest = {
				refreshToken: "valid.refresh.token",
			};

			mockContext.req.json.mockResolvedValueOnce(refreshTokenRequest);

			vi.spyOn(authService, "refreshTokens").mockResolvedValueOnce({
				ok: true,
				value: mockTokenPair,
			});

			// Act
			await refresh(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(200);
			expect(mockContext.json).toHaveBeenCalledWith({
				accessToken: mockTokenPair.accessToken,
				refreshToken: mockTokenPair.refreshToken,
				user: mockTokenPair.user,
			});
			expect(authService.refreshTokens).toHaveBeenCalledWith(
				refreshTokenRequest.refreshToken,
				expect.anything(),
			);
		});

		it("無効なリフレッシュトークンの場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			const refreshTokenRequest = {
				refreshToken: "invalid.refresh.token",
			};

			mockContext.req.json.mockResolvedValueOnce(refreshTokenRequest);

			vi.spyOn(authService, "refreshTokens").mockResolvedValueOnce({
				ok: false,
				error: {
					type: AuthErrorType.INVALID_REFRESH_TOKEN,
					message: "無効なリフレッシュトークンです",
				},
			});

			// Act
			await refresh(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(401);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: AuthErrorType.INVALID_REFRESH_TOKEN,
					message: "無効なリフレッシュトークンです",
				},
			});
		});

		it("リクエストボディが無効な場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			mockContext.req.json.mockRejectedValueOnce(new Error("Invalid JSON"));

			// Act
			await refresh(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(400);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: "VALIDATION_ERROR",
					message: "無効なリクエスト形式です",
				},
			});
		});
	});

	describe("logout", () => {
		it("有効なトークンで正常にログアウトできること", async () => {
			// Arrange
			const mockContext = createMockContext();
			const token = "Bearer valid.access.token";

			mockContext.req.header.mockReturnValueOnce(token);

			vi.spyOn(authService, "logout").mockResolvedValueOnce({
				ok: true,
				value: undefined,
			});

			// Act
			await logout(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(200);
			expect(mockContext.json).toHaveBeenCalledWith({
				message: "ログアウトしました",
			});
			expect(authService.logout).toHaveBeenCalledWith(
				"valid.access.token",
				expect.anything(),
			);
		});

		it("トークンが提供されていない場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			mockContext.req.header.mockReturnValueOnce(null);

			// Act
			await logout(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(401);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: AuthErrorType.INVALID_TOKEN,
					message: "認証トークンが提供されていません",
				},
			});
		});

		it("ブラックリスト登録中にエラーが発生した場合エラーレスポンスを返すこと", async () => {
			// Arrange
			const mockContext = createMockContext();
			const token = "Bearer valid.access.token";

			mockContext.req.header.mockReturnValueOnce(token);

			vi.spyOn(authService, "logout").mockResolvedValueOnce({
				ok: false,
				error: {
					type: AuthErrorType.INTERNAL_ERROR,
					message: "トークンのブラックリスト登録中にエラーが発生しました",
				},
			});

			// Act
			await logout(mockContext);

			// Assert
			expect(mockContext.status).toHaveBeenCalledWith(500);
			expect(mockContext.json).toHaveBeenCalledWith({
				error: {
					type: AuthErrorType.INTERNAL_ERROR,
					message: "トークンのブラックリスト登録中にエラーが発生しました",
				},
			});
		});
	});
});
