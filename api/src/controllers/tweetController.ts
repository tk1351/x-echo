import type { Context } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  createTweet as createTweetService,
  getLatestTweets as getLatestTweetsService,
  getTimeline as getTimelineService,
  getTweetById,
  getTweetsByUsername,
} from "../services/tweetService.js";
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
    prisma,
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

/**
 * Controller to retrieve a tweet by its ID
 * @param c Hono context
 * @returns JSON response
 */
export const getTweet = async (c: Context) => {
  // Get tweet ID from URL parameter
  const idParam = c.req.param("id");
  const id = Number.parseInt(idParam, 10);

  if (Number.isNaN(id)) {
    c.status(400);
    return c.json({ error: "Invalid tweet ID" });
  }

  // Get tweet
  const result = await getTweetById(id, prisma);

  if (!result.ok) {
    switch (result.error.type) {
      case TweetErrorType.TWEET_NOT_FOUND:
        c.status(404);
        return c.json({ error: result.error.message });
      default:
        c.status(500);
        return c.json({ error: result.error.message });
    }
  }

  c.status(200);
  return c.json(result.value);
};

/**
 * Controller to retrieve tweets by username
 * @param c Hono context
 * @returns JSON response
 */
export const getUserTweets = async (c: Context) => {
  // Get username from URL parameter
  const username = c.req.param("username");

  // Get limit and cursor from query parameters
  const limitParam = c.req.query("limit");
  const cursorParam = c.req.query("cursor");

  // Parse limit (default: 20)
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
  // Parse cursor (明示的に型を定義)
  const cursor: number | undefined = cursorParam
    ? Number.parseInt(cursorParam, 10)
    : undefined;

  // Validate limit
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    c.status(400);
    return c.json({
      error: "Invalid limit parameter. Must be between 1 and 100",
    });
  }

  // Validate cursor
  if (
    cursorParam &&
    (Number.isNaN(cursor) || (cursor !== undefined && cursor <= 0))
  ) {
    c.status(400);
    return c.json({
      error: "Invalid cursor parameter. Must be a positive integer",
    });
  }

  // Retrieve tweets
  const result = await getTweetsByUsername(username, limit, prisma, cursor);

  if (!result.ok) {
    switch (result.error.type) {
      case TweetErrorType.USER_NOT_FOUND:
        c.status(404);
        return c.json({ error: result.error.message });
      case TweetErrorType.INVALID_PAGINATION_PARAMS:
        c.status(400);
        return c.json({ error: result.error.message });
      default:
        c.status(500);
        return c.json({ error: result.error.message });
    }
  }

  c.status(200);
  return c.json(result.value);
};

/**
 * Controller to retrieve latest tweets
 * @param c Hono context
 * @returns JSON response
 */
export const getLatestTweets = async (c: Context) => {
  // Get limit and cursor from query parameters
  const limitParam = c.req.query("limit");
  const cursorParam = c.req.query("cursor");

  // Parse limit (default: 20)
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
  // Parse cursor (明示的に型を定義)
  const cursor: number | undefined = cursorParam
    ? Number.parseInt(cursorParam, 10)
    : undefined;

  // Validate limit
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    c.status(400);
    return c.json({
      error: "Invalid limit parameter. Must be between 1 and 100",
    });
  }

  // Validate cursor
  if (
    cursorParam &&
    (Number.isNaN(cursor) || (cursor !== undefined && cursor <= 0))
  ) {
    c.status(400);
    return c.json({
      error: "Invalid cursor parameter. Must be a positive integer",
    });
  }

  // Retrieve latest tweets
  const result = await getLatestTweetsService(limit, prisma, cursor);

  if (!result.ok) {
    switch (result.error.type) {
      case TweetErrorType.INVALID_PAGINATION_PARAMS:
        c.status(400);
        return c.json({ error: result.error.message });
      default:
        c.status(500);
        return c.json({ error: result.error.message });
    }
  }

  c.status(200);
  return c.json(result.value);
};

/**
 * Controller to retrieve timeline tweets (tweets from followed users and self)
 * @param c Hono context
 * @returns JSON response
 */
export const getTimeline = async (c: Context) => {
  // Get user ID from JWT payload set by authentication middleware
  const jwtPayload = c.get("jwtPayload");
  if (!jwtPayload || !jwtPayload.userId) {
    c.status(401);
    return c.json({ error: "認証情報が不足しています" });
  }

  // Get limit and cursor from query parameters
  const limitParam = c.req.query("limit");
  const cursorParam = c.req.query("cursor");

  // Parse limit (default: 20)
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
  // Parse cursor (明示的に型を定義)
  const cursor: number | undefined = cursorParam
    ? Number.parseInt(cursorParam, 10)
    : undefined;

  // Validate limit
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    c.status(400);
    return c.json({
      error: "Invalid limit parameter. Must be between 1 and 100",
    });
  }

  // Validate cursor
  if (
    cursorParam &&
    (Number.isNaN(cursor) || (cursor !== undefined && cursor <= 0))
  ) {
    c.status(400);
    return c.json({
      error: "Invalid cursor parameter. Must be a positive integer",
    });
  }

  // Retrieve timeline tweets
  const result = await getTimelineService(
    jwtPayload.userId,
    limit,
    prisma,
    cursor,
  );

  if (!result.ok) {
    switch (result.error.type) {
      case TweetErrorType.USER_NOT_FOUND:
        c.status(404);
        return c.json({ error: result.error.message });
      case TweetErrorType.INVALID_PAGINATION_PARAMS:
        c.status(400);
        return c.json({ error: result.error.message });
      default:
        c.status(500);
        return c.json({ error: result.error.message });
    }
  }

  c.status(200);
  return c.json(result.value);
};
