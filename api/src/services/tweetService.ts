import type { PrismaClient } from "@prisma/client";
import {
  createTweet as createTweetRepo,
  getTweetById as getTweetByIdRepo,
} from "../domain/tweet/tweetRepository.js";
import type { TweetCreateInput, TweetResponse } from "../types/index.js";
import { TweetErrorType } from "../utils/errors.js";
import type { Result } from "../utils/result.js";

export const createTweet = async (
  data: TweetCreateInput,
  prisma: PrismaClient,
): Promise<
  Result<TweetResponse, { type: TweetErrorType; message: string }>
> => {
  // Validate content
  if (!data.content || data.content.trim().length === 0) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INVALID_TWEET_DATA,
        message: "Tweet content cannot be empty",
      },
    };
  }

  if (data.content.length > 280) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INVALID_TWEET_DATA,
        message: "Tweet content cannot exceed 280 characters",
      },
    };
  }

  // Check if user exists
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return {
        ok: false,
        error: {
          type: TweetErrorType.INVALID_TWEET_DATA,
          message: "User not found",
        },
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.TWEET_CREATION_FAILED,
        message: "Failed to verify user",
      },
    };
  }

  // Create tweet
  const result = await createTweetRepo(data, prisma);

  if (!result.ok) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.TWEET_CREATION_FAILED,
        message: "Failed to create tweet",
      },
    };
  }

  return { ok: true, value: result.value };
};

/**
 * Retrieves a tweet by its ID
 * @param id The ID of the tweet to retrieve
 * @param prisma Prisma client instance
 * @returns Result containing the tweet or an error
 */
export const getTweetById = async (
  id: number,
  prisma: PrismaClient,
): Promise<
  Result<TweetResponse, { type: TweetErrorType; message: string }>
> => {
  const result = await getTweetByIdRepo(id, prisma);

  if (!result.ok) {
    // Check if the error is a "not found" error
    if (result.error.message.includes("not found")) {
      return {
        ok: false,
        error: {
          type: TweetErrorType.TWEET_NOT_FOUND,
          message: `Tweet with id ${id} not found`,
        },
      };
    }

    // Handle other errors
    return {
      ok: false,
      error: {
        type: TweetErrorType.INTERNAL_ERROR,
        message: "Failed to retrieve tweet",
      },
    };
  }

  return { ok: true, value: result.value };
};
