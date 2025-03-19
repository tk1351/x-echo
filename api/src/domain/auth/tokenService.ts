import crypto from "crypto";
import type { User } from "@prisma/client";
import { sign, verify } from "hono/jwt";
import type {
  AccessToken,
  JwtPayload,
  RefreshToken,
  TokenPair,
} from "../../types/auth.js";
import type { AuthError } from "../../utils/errors.js";
import { AuthErrorType } from "../../utils/errors.js";
import type { Result } from "../../utils/result.js";

// 環境変数
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || generateSecureSecret();
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || generateSecureSecret();
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// セキュアなシークレット生成（環境変数未設定時のフォールバック）
function generateSecureSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

// トークンペア生成
export const generateTokenPair = async (user: User): Promise<TokenPair> => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  // アクセストークン（短期間有効）
  const accessToken = (await sign(payload, ACCESS_TOKEN_SECRET)) as AccessToken;

  // リフレッシュトークン（長期間有効）
  const refreshToken = (await sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
  )) as RefreshToken;

  // パスワードハッシュを除外した安全なユーザー情報を返す
  const { passwordHash, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
};

// アクセストークン検証
export const verifyAccessToken = async (
  token: string,
): Promise<Result<JwtPayload, AuthError>> => {
  try {
    const decoded = (await verify(token, ACCESS_TOKEN_SECRET)) as JwtPayload;
    return { ok: true, value: decoded };
  } catch (error: any) {
    console.error("Access token verification error:", error);

    if (error.name === "JwtTokenExpired") {
      return {
        ok: false,
        error: {
          type: AuthErrorType.TOKEN_EXPIRED,
          message: "アクセストークンの有効期限が切れています",
        },
      };
    }

    return {
      ok: false,
      error: {
        type: AuthErrorType.INVALID_TOKEN,
        message: "無効なアクセストークンです",
      },
    };
  }
};

// リフレッシュトークン検証
export const verifyRefreshToken = async (
  token: string,
): Promise<Result<{ userId: number }, AuthError>> => {
  try {
    const decoded = (await verify(token, REFRESH_TOKEN_SECRET)) as {
      userId: number;
    };
    return { ok: true, value: decoded };
  } catch (error: any) {
    console.error("Refresh token verification error:", error);

    if (error.name === "JwtTokenExpired") {
      return {
        ok: false,
        error: {
          type: AuthErrorType.REFRESH_TOKEN_EXPIRED,
          message: "リフレッシュトークンの有効期限が切れています",
        },
      };
    }

    return {
      ok: false,
      error: {
        type: AuthErrorType.INVALID_REFRESH_TOKEN,
        message: "無効なリフレッシュトークンです",
      },
    };
  }
};
