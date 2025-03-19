import type { Context } from "hono";
import { ValidationErrorType } from "../utils/errors.js";
import * as authService from "../services/authService.js";
import * as userRepository from "../domain/user/userRepository.js";
import type { LoginCredentials, JwtPayload } from "../types/auth.js";
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
			c.status(200);
			return c.json({
				accessToken: result.value.accessToken,
				refreshToken: result.value.refreshToken,
				user: result.value.user,
			});
		} else {
			c.status(401);
			return c.json({ error: result.error });
		}
	} catch (error) {
		// リクエストボディのパース失敗など
		console.error("Login error:", error);
		c.status(400);
		return c.json({
			error: {
				type: ValidationErrorType.INVALID_INPUT,
				message: "無効なリクエスト形式です",
			},
		});
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
			c.status(200);
			return c.json({
				accessToken: result.value.accessToken,
				refreshToken: result.value.refreshToken,
				user: result.value.user,
			});
		} else {
			c.status(401);
			return c.json({ error: result.error });
		}
	} catch (error) {
		// リクエストボディのパース失敗など
		console.error("Token refresh error:", error);
		c.status(400);
		return c.json({
			error: {
				type: ValidationErrorType.INVALID_INPUT,
				message: "無効なリクエスト形式です",
			},
		});
	}
};

// ログアウト処理
export const logout = async (c: Context) => {
	try {
		// Authorizationヘッダーからトークンを取得
		const authHeader = c.req.header("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			c.status(401);
			return c.json({
				error: {
					type: "INVALID_TOKEN",
					message: "認証トークンが提供されていません",
				},
			});
		}

		// "Bearer "プレフィックスを削除してトークンを取得
		const token = authHeader.substring(7);

		// 認証サービスを呼び出してログアウト処理（トークンをブラックリストに追加）
		const result = await authService.logout(token, prisma);

		// 結果に応じてレスポンスを返す
		if (result.ok) {
			c.status(200);
			return c.json({ message: "ログアウトしました" });
		} else {
			c.status(500);
			return c.json({ error: result.error });
		}
	} catch (error) {
		// 予期しないエラー
		console.error("Logout error:", error);
		c.status(500);
		return c.json({
			error: {
				type: "INTERNAL_ERROR",
				message: "内部サーバーエラーが発生しました",
			},
		});
	}
};

// 現在のユーザー情報取得処理
export const me = async (c: Context) => {
	try {
		// 認証ミドルウェアで設定されたJWTペイロードを取得
		const payload = c.get("jwtPayload") as JwtPayload;

		// ユーザーIDを使用してユーザー情報を取得
		const userResult = await userRepository.findUserById(payload.userId, prisma);

		if (!userResult.ok) {
			c.status(404);
			return c.json({ error: userResult.error });
		}

		// パスワードハッシュを除外した安全なユーザー情報を返す
		const { passwordHash, ...safeUser } = userResult.value;

		c.status(200);
		return c.json({ user: safeUser });
	} catch (error) {
		// 予期しないエラー
		console.error("Get current user error:", error);
		c.status(500);
		return c.json({
			error: {
				type: "INTERNAL_ERROR",
				message: "内部サーバーエラーが発生しました",
			},
		});
	}
};
