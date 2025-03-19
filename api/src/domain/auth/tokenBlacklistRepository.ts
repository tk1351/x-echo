import type { PrismaClient } from "@prisma/client";
import type { AuthError } from "../../utils/errors.js";
import { AuthErrorType } from "../../utils/errors.js";
import type { Result } from "../../utils/result.js";

// トークンをブラックリストに追加
export const addToBlacklist = async (
  token: string,
  expiresAt: Date,
  prisma: PrismaClient,
): Promise<Result<void, AuthError>> => {
  try {
    await prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
      },
    });

    return { ok: true, value: undefined };
  } catch (error) {
    console.error("Error adding token to blacklist:", error);

    return {
      ok: false,
      error: {
        type: AuthErrorType.INTERNAL_ERROR,
        message: "トークンのブラックリスト登録中にエラーが発生しました",
      },
    };
  }
};

// トークンがブラックリストに存在するか確認
export const isTokenBlacklisted = async (
  token: string,
  prisma: PrismaClient,
): Promise<Result<boolean, AuthError>> => {
  try {
    const blacklistedToken = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    return { ok: true, value: !!blacklistedToken };
  } catch (error) {
    console.error("Error checking token blacklist:", error);

    return {
      ok: false,
      error: {
        type: AuthErrorType.INTERNAL_ERROR,
        message: "トークンのブラックリスト確認中にエラーが発生しました",
      },
    };
  }
};

// 期限切れのトークンをブラックリストから削除（定期的なクリーンアップに使用）
export const removeExpiredTokens = async (
  prisma: PrismaClient,
): Promise<Result<number, AuthError>> => {
  try {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return { ok: true, value: result.count };
  } catch (error) {
    console.error("Error removing expired tokens:", error);

    return {
      ok: false,
      error: {
        type: AuthErrorType.INTERNAL_ERROR,
        message: "期限切れトークンの削除中にエラーが発生しました",
      },
    };
  }
};
