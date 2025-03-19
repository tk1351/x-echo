import type { Context } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { createUser } from "../services/userService.js";
import { UserErrorType } from "../utils/errors.js";

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
