import type { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import bcrypt from "bcrypt";
import * as userRepository from "../domain/user/userRepository.js";
import type {
  UserCreateInput,
  UserProfileResponse,
  UserUpdateData,
} from "../types/index.js";
import { UserErrorType } from "../utils/errors.js";
import type { UserError } from "../utils/errors.js";
import type { Result } from "../utils/result.js";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new Error("Password is required");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const checkUserExists = async (
  username: string,
  email: string,
  prisma: PrismaClient,
): Promise<void> => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new Error("Username already exists");
    }
    throw new Error("Email already exists");
  }
};

export const createUser = async (
  userData: UserCreateInput,
  prisma: PrismaClient,
): Promise<Result<User, UserError>> => {
  try {
    // 既存ユーザーのチェック
    await checkUserExists(userData.username, userData.email, prisma);

    // パスワードのハッシュ化
    const passwordHash = await hashPassword(userData.password);

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
        passwordHash,
      },
    });

    return { ok: true, value: user };
  } catch (error) {
    return mapErrorToUserError(error);
  }
};

const mapErrorToUserError = (error: unknown): Result<never, UserError> => {
  if (error instanceof Error) {
    if (error.message.includes("already exists")) {
      return {
        ok: false,
        error: {
          type: UserErrorType.USER_ALREADY_EXISTS,
          message: error.message,
        },
      };
    }
  }

  return {
    ok: false,
    error: {
      type: UserErrorType.INTERNAL_ERROR,
      message: "Failed to create user",
    },
  };
};

/**
 * プロファイルデータのバリデーション
 */
export const validateProfileData = (
  data: UserUpdateData,
): Result<true, UserError> => {
  // 表示名のバリデーション
  if (data.displayName !== undefined) {
    if (data.displayName.trim() === "") {
      return {
        ok: false,
        error: {
          type: UserErrorType.INVALID_PROFILE_DATA,
          message: "表示名は空にできません",
        },
      };
    }

    if (data.displayName.length > 50) {
      return {
        ok: false,
        error: {
          type: UserErrorType.INVALID_PROFILE_DATA,
          message: "表示名は50文字以内である必要があります",
        },
      };
    }
  }

  // 自己紹介のバリデーション
  if (data.bio !== undefined && data.bio.length > 160) {
    return {
      ok: false,
      error: {
        type: UserErrorType.INVALID_PROFILE_DATA,
        message: "自己紹介は160文字以内である必要があります",
      },
    };
  }

  return { ok: true, value: true };
};

/**
 * ユーザープロファイルの取得
 */
export const getUserProfile = async (
  username: string,
  prisma: PrismaClient,
): Promise<Result<UserProfileResponse, UserError>> => {
  // ユーザー名でユーザーを検索
  const userResult = await userRepository.findUserByUsername(username, prisma);

  if (!userResult.ok) {
    return userResult;
  }

  const user = userResult.value;

  // 公開用のプロファイル情報を作成
  const profileResponse: UserProfileResponse = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    profileImageUrl: user.profileImageUrl,
    headerImageUrl: user.headerImageUrl,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  return { ok: true, value: profileResponse };
};

/**
 * ユーザープロファイルの更新
 */
export const updateUserProfile = async (
  userId: number,
  updateData: UserUpdateData,
  prisma: PrismaClient,
): Promise<Result<UserProfileResponse, UserError>> => {
  // 更新データのバリデーション
  const validationResult = validateProfileData(updateData);
  if (!validationResult.ok) {
    return validationResult;
  }

  // ユーザープロファイルの更新
  const updateResult = await userRepository.updateUser(
    userId,
    updateData,
    prisma,
  );

  if (!updateResult.ok) {
    return updateResult;
  }

  const updatedUser = updateResult.value;

  // 公開用のプロファイル情報を作成
  const profileResponse: UserProfileResponse = {
    id: updatedUser.id,
    username: updatedUser.username,
    displayName: updatedUser.displayName,
    bio: updatedUser.bio,
    profileImageUrl: updatedUser.profileImageUrl,
    headerImageUrl: updatedUser.headerImageUrl,
    followersCount: updatedUser.followersCount,
    followingCount: updatedUser.followingCount,
    isVerified: updatedUser.isVerified,
    createdAt: updatedUser.createdAt,
  };

  return { ok: true, value: profileResponse };
};
