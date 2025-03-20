import type { Context } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  createUser,
  getUserProfile as getProfile,
  updateUserProfile as updateProfile,
} from "../services/userService.js";
import type { UserUpdateData } from "../types/index.js";
import { UserErrorType } from "../utils/errors.js";

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  headerImageUrl: z.string().url().optional().nullable(),
});

export const userCreateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const getUserProfile = async (c: Context) => {
  // URLパラメータからユーザー名を取得
  const username = c.req.param("username");

  // ユーザープロファイルを取得
  const result = await getProfile(username, prisma);

  if (!result.ok) {
    switch (result.error.type) {
      case UserErrorType.USER_NOT_FOUND:
        return c.json({ error: result.error.message }, 404);
      default:
        return c.json({ error: result.error.message }, 500);
    }
  }

  return c.json(result.value, 200);
};

export const updateUserProfile = async (c: Context) => {
  // リクエストボディからJSONデータを取得
  let data: UserUpdateData;

  try {
    data = await c.req.json();

    // バリデーション
    const validationResult = userUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        400,
      );
    }
  } catch (error) {
    return c.json(
      {
        error: "Invalid JSON",
        message: "Request body must be a valid JSON",
      },
      400,
    );
  }

  // 認証ミドルウェアで設定されたJWTペイロードからユーザーIDを取得
  const jwtPayload = c.get("jwtPayload");
  if (!jwtPayload || !jwtPayload.userId) {
    return c.json({ error: "認証情報が不足しています" }, 401);
  }

  // ユーザープロファイルを更新
  const result = await updateProfile(jwtPayload.userId, data, prisma);

  if (!result.ok) {
    switch (result.error.type) {
      case UserErrorType.INVALID_PROFILE_DATA:
        return c.json({ error: result.error.message }, 400);
      case UserErrorType.USER_NOT_FOUND:
        return c.json({ error: result.error.message }, 404);
      case UserErrorType.UNAUTHORIZED_UPDATE:
        return c.json({ error: result.error.message }, 403);
      default:
        return c.json({ error: result.error.message }, 500);
    }
  }

  return c.json(result.value, 200);
};

export const registerUser = async (c: Context) => {
  // リクエストボディからJSONデータを取得
  let data;

  try {
    data = await c.req.json();

    // バリデーション
    const validationResult = userCreateSchema.safeParse(data);
    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        400,
      );
    }
  } catch (error) {
    return c.json(
      {
        error: "Invalid JSON",
        message: "Request body must be a valid JSON",
      },
      400,
    );
  }

  const result = await createUser(data, prisma);

  if (!result.ok) {
    switch (result.error.type) {
      case UserErrorType.VALIDATION_ERROR:
        return c.json({ error: result.error.message }, 400);
      case UserErrorType.USER_ALREADY_EXISTS:
        return c.json({ error: result.error.message }, 409);
      default:
        return c.json({ error: "Internal server error" }, 500);
    }
  }

  // パスワードハッシュを除外したユーザー情報を返す
  const { passwordHash, ...userResponse } = result.value;
  return c.json(userResponse, 201);
};
