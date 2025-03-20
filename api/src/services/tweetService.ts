import type { PrismaClient } from "@prisma/client";
import { createTweet as createTweetRepo } from "../domain/tweet/tweetRepository.js";
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
