import type { PrismaClient, User } from "@prisma/client";
import type { UserUpdateData } from "../../types/index.js";
import type { UserError } from "../../utils/errors.js";
import { UserErrorType } from "../../utils/errors.js";
import type { Result } from "../../utils/result.js";

// 識別子（ユーザー名またはメール）でユーザーを検索
export const findUserByIdentifier = async (
  identifier: string,
  prisma: PrismaClient,
): Promise<Result<User, UserError>> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return {
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      };
    }

    return { ok: true, value: user };
  } catch (error) {
    console.error("Error finding user:", error);

    return {
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "ユーザー検索中に内部エラーが発生しました",
      },
    };
  }
};

// IDでユーザーを検索
export const findUserById = async (
  id: number,
  prisma: PrismaClient,
): Promise<Result<User, UserError>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      };
    }

    return { ok: true, value: user };
  } catch (error) {
    console.error("Error finding user by ID:", error);

    return {
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "ユーザー検索中に内部エラーが発生しました",
      },
    };
  }
};

// ユーザー名でユーザーを検索
export const findUserByUsername = async (
  username: string,
  prisma: PrismaClient,
): Promise<Result<User, UserError>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return {
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "ユーザーが見つかりません",
        },
      };
    }

    return { ok: true, value: user };
  } catch (error) {
    console.error("Error finding user by username:", error);

    return {
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "ユーザー検索中に内部エラーが発生しました",
      },
    };
  }
};

// ユーザープロファイルを更新
export const updateUser = async (
  userId: number,
  updateData: UserUpdateData,
  prisma: PrismaClient,
): Promise<Result<User, UserError>> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { ok: true, value: user };
  } catch (error) {
    console.error("Error updating user:", error);

    // Prismaの特定のエラーを処理
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return {
          ok: false,
          error: {
            type: UserErrorType.USER_NOT_FOUND,
            message: "更新するユーザーが見つかりません",
          },
        };
      }
    }

    return {
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "ユーザー更新中に内部エラーが発生しました",
      },
    };
  }
};
