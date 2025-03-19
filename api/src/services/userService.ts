import type { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import bcrypt from "bcrypt";
import type { UserCreateInput } from "../types/index.js";
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
