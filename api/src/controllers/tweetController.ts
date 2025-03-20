import type { Context } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { createTweet as createTweetService } from "../services/tweetService.js";
import { TweetErrorType } from "../utils/errors.js";

export const tweetCreateSchema = z.object({
  content: z.string().min(1).max(280),
});

export const createTweet = async (c: Context) => {
  // Get JSON data from request body
  let data;

  try {
    data = await c.req.json();

    // Validation
    const validationResult = tweetCreateSchema.safeParse(data);
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

  // Get user ID from JWT payload set by authentication middleware
  const jwtPayload = c.get("jwtPayload");
  if (!jwtPayload || !jwtPayload.userId) {
    return c.json({ error: "認証情報が不足しています" }, 401);
  }

  // Create tweet
  const result = await createTweetService(
    {
      content: data.content,
      userId: jwtPayload.userId,
    },
    prisma
  );

  if (!result.ok) {
    switch (result.error.type) {
      case TweetErrorType.INVALID_TWEET_DATA:
        return c.json({ error: result.error.message }, 400);
      case TweetErrorType.TWEET_CREATION_FAILED:
        return c.json({ error: result.error.message }, 500);
      case TweetErrorType.UNAUTHORIZED_ACTION:
        return c.json({ error: result.error.message }, 403);
      default:
        return c.json({ error: "Internal server error" }, 500);
    }
  }

  return c.json(result.value, 201);
};
