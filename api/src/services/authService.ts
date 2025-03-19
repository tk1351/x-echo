import type { PrismaClient } from "@prisma/client";
import { compare } from "bcrypt";
import * as userRepository from "../domain/user/userRepository.js";
import * as tokenService from "../domain/auth/tokenService.js";
import * as tokenBlacklistRepository from "../domain/auth/tokenBlacklistRepository.js";
import type { Result } from "../utils/result.js";
import type { AuthError } from "../utils/errors.js";
import { AuthErrorType } from "../utils/errors.js";
import type { LoginCredentials, TokenPair } from "../types/auth.js";

// ログイン処理
export const login = async (
	credentials: LoginCredentials,
	prisma: PrismaClient,
): Promise<Result<TokenPair, AuthError>> => {
	// ユーザー名またはメールアドレスでユーザーを検索
	const userResult = await userRepository.findUserByIdentifier(
		credentials.identifier,
		prisma,
	);

	// ユーザーが見つからない場合
	if (!userResult.ok) {
		return {
			ok: false,
			error: {
				type: AuthErrorType.INVALID_CREDENTIALS,
				message: "ユーザー名/メールアドレスまたはパスワードが正しくありません",
			},
		};
	}

	const user = userResult.value;

	// パスワードの検証
	const isPasswordValid = await compare(credentials.password, user.passwordHash);
	if (!isPasswordValid) {
		return {
			ok: false,
			error: {
				type: AuthErrorType.INVALID_CREDENTIALS,
				message: "ユーザー名/メールアドレスまたはパスワードが正しくありません",
			},
		};
	}

	// トークンペアの生成
	const tokenPair = await tokenService.generateTokenPair(user);

	return { ok: true, value: tokenPair };
};

// トークン更新処理
export const refreshTokens = async (
	refreshToken: string,
	prisma: PrismaClient,
): Promise<Result<TokenPair, AuthError>> => {
	// リフレッシュトークンの検証
	const verifyResult = await tokenService.verifyRefreshToken(refreshToken);
	if (!verifyResult.ok) {
		return verifyResult;
	}

	const { userId } = verifyResult.value;

	// トークンがブラックリストに登録されていないか確認
	const blacklistResult = await tokenBlacklistRepository.isTokenBlacklisted(
		refreshToken,
		prisma,
	);

	if (!blacklistResult.ok) {
		return blacklistResult;
	}

	// ブラックリストに登録されている場合
	if (blacklistResult.value) {
		return {
			ok: false,
			error: {
				type: AuthErrorType.INVALID_REFRESH_TOKEN,
				message: "リフレッシュトークンは無効化されています",
			},
		};
	}

	// ユーザーの取得
	const userResult = await userRepository.findUserById(userId, prisma);
	if (!userResult.ok) {
		return {
			ok: false,
			error: {
				type: AuthErrorType.USER_NOT_FOUND,
				message: "ユーザーが見つかりません",
			},
		};
	}

	// 新しいトークンペアの生成
	const tokenPair = await tokenService.generateTokenPair(userResult.value);

	return { ok: true, value: tokenPair };
};

// ログアウト処理（トークンのブラックリスト登録）
export const logout = async (
	token: string,
	prisma: PrismaClient,
): Promise<Result<void, AuthError>> => {
	// トークンの検証
	const verifyResult = await tokenService.verifyAccessToken(token);

	// トークンが無効な場合は、すでにログアウト状態とみなして成功を返す
	if (!verifyResult.ok) {
		return { ok: true, value: undefined };
	}

	// トークンの有効期限を取得
	const { exp } = verifyResult.value;
	const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 3600000); // デフォルトは1時間後

	// トークンをブラックリストに追加
	const blacklistResult = await tokenBlacklistRepository.addToBlacklist(
		token,
		expiresAt,
		prisma,
	);

	return blacklistResult;
};
