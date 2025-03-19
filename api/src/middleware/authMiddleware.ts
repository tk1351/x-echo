import type { Context, Next } from "hono";
import * as tokenService from "../domain/auth/tokenService.js";
import * as tokenBlacklistRepository from "../domain/auth/tokenBlacklistRepository.js";
import prisma from "../lib/prisma.js";
import { AuthErrorType } from "../utils/errors.js";

// 認証ミドルウェア
export const authenticate = async (c: Context, next: Next) => {
	// Authorizationヘッダーからトークンを取得
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json(
			{
				error: {
					type: AuthErrorType.INVALID_TOKEN,
					message: "認証トークンが提供されていません",
				},
			},
			401,
		);
	}

	// "Bearer "プレフィックスを削除してトークンを取得
	const token = authHeader.substring(7);

	// トークンがブラックリストに登録されていないか確認
	const blacklistResult = await tokenBlacklistRepository.isTokenBlacklisted(
		token,
		prisma,
	);

	if (!blacklistResult.ok) {
		return c.json({ error: blacklistResult.error }, 500);
	}

	// ブラックリストに登録されている場合
	if (blacklistResult.value) {
		return c.json(
			{
				error: {
					type: AuthErrorType.INVALID_TOKEN,
					message: "トークンは無効化されています",
				},
			},
			401,
		);
	}

	// トークンの検証
	const verifyResult = await tokenService.verifyAccessToken(token);
	if (!verifyResult.ok) {
		return c.json({ error: verifyResult.error }, 401);
	}

	// 検証されたペイロードをコンテキストに設定
	c.set("jwtPayload", verifyResult.value);

	// 次のミドルウェアまたはハンドラーに進む
	await next();
};

// 管理者権限チェックミドルウェア
export const requireAdmin = async (c: Context, next: Next) => {
	// 認証ミドルウェアで設定されたJWTペイロードを取得
	const payload = c.get("jwtPayload");

	// ペイロードが存在しない場合（認証ミドルウェアが先に実行されていない）
	if (!payload) {
		return c.json(
			{
				error: {
					type: AuthErrorType.INVALID_TOKEN,
					message: "認証が必要です",
				},
			},
			401,
		);
	}

	// ロールが管理者でない場合
	if (payload.role !== "ADMIN") {
		return c.json(
			{
				error: {
					type: "FORBIDDEN",
					message: "この操作には管理者権限が必要です",
				},
			},
			403,
		);
	}

	// 次のミドルウェアまたはハンドラーに進む
	await next();
};
