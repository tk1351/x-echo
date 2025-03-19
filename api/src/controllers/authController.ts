import type { Context } from "hono";
import { ValidationErrorType } from "../utils/errors.js";
import * as authService from "../services/authService.js";
import type { LoginCredentials } from "../types/auth.js";
import prisma from "../lib/prisma.js";

// ログイン処理
export const login = async (c: Context) => {
	try {
		// リクエストボディからログイン認証情報を取得
		const credentials = await c.req.json<LoginCredentials>();

		// 認証サービスを呼び出してログイン処理
		const result = await authService.login(credentials, prisma);

		// 結果に応じてレスポンスを返す
		if (result.ok) {
			return c.json({
				accessToken: result.value.accessToken,
				refreshToken: result.value.refreshToken,
				user: result.value.user,
			}, 200);
		} else {
			return c.json({ error: result.error }, 401);
		}
	} catch (error) {
		// リクエストボディのパース失敗など
		console.error("Login error:", error);
		return c.json({
			error: {
				type: ValidationErrorType.INVALID_INPUT,
				message: "無効なリクエスト形式です",
			},
		}, 400);
	}
};

// トークン更新処理
export const refresh = async (c: Context) => {
	try {
		// リクエストボディからリフレッシュトークンを取得
		const { refreshToken } = await c.req.json<{ refreshToken: string }>();

		// 認証サービスを呼び出してトークン更新処理
		const result = await authService.refreshTokens(refreshToken, prisma);

		// 結果に応じてレスポンスを返す
		if (result.ok) {
			return c.json({
				accessToken: result.value.accessToken,
				refreshToken: result.value.refreshToken,
				user: result.value.user,
			}, 200);
		} else {
			return c.json({ error: result.error }, 401);
		}
	} catch (error) {
		// リクエストボディのパース失敗など
		console.error("Token refresh error:", error);
		return c.json({
			error: {
				type: ValidationErrorType.INVALID_INPUT,
				message: "無効なリクエスト形式です",
			},
		}, 400);
	}
};

// ログアウト処理
export const logout = async (c: Context) => {
	try {
		// Authorizationヘッダーからトークンを取得
		const authHeader = c.req.header("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json({
				error: {
					type: "INVALID_TOKEN",
					message: "認証トークンが提供されていません",
				},
			}, 401);
		}

		// "Bearer "プレフィックスを削除してトークンを取得
		const token = authHeader.substring(7);

		// 認証サービスを呼び出してログアウト処理（トークンをブラックリストに追加）
		const result = await authService.logout(token, prisma);

		// 結果に応じてレスポンスを返す
		if (result.ok) {
			return c.json({ message: "ログアウトしました" }, 200);
		} else {
			return c.json({ error: result.error }, 500);
		}
	} catch (error) {
		// 予期しないエラー
		console.error("Logout error:", error);
		return c.json({
			error: {
				type: "INTERNAL_ERROR",
				message: "内部サーバーエラーが発生しました",
			},
		}, 500);
	}
};
