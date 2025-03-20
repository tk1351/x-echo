import type { PrismaClient } from "@prisma/client";
import {
  createTweet as createTweetRepo,
  getTweetById as getTweetByIdRepo,
  getTweetsByUserId,
  getLatestTweets as getLatestTweetsRepo,
} from "../domain/tweet/tweetRepository.js";
import type { TweetCreateInput, TweetListResponse, TweetResponse } from "../types/index.js";
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

/**
 * ユーザー名によるツイート取得（ページネーション付き）
 * @param username ユーザー名
 * @param limit 取得するツイート数
 * @param prisma Prismaクライアントインスタンス
 * @param cursor ページネーション用カーソル（前ページの最後のツイートのID）
 * @returns ツイートとページネーション情報を含む結果
 */
export const getTweetsByUsername = async (
  username: string,
  limit: number,
  prisma: PrismaClient,
  cursor?: number
): Promise<Result<TweetListResponse, { type: TweetErrorType; message: string }>> => {
  // limitパラメータの検証
  if (limit <= 0 || limit > 100) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INVALID_PAGINATION_PARAMS,
        message: "Limit must be between 1 and 100",
      },
    };
  }

  try {
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return {
        ok: false,
        error: {
          type: TweetErrorType.USER_NOT_FOUND,
          message: `User with username ${username} not found`,
        },
      };
    }

    // ツイートの取得
    const result = await getTweetsByUserId(user.id, limit, prisma, cursor);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          type: TweetErrorType.INTERNAL_ERROR,
          message: "Failed to retrieve tweets",
        },
      };
    }

    // レスポンスの整形
    return {
      ok: true,
      value: {
        tweets: result.value.tweets,
        pagination: {
          hasMore: result.value.hasMore,
          nextCursor: result.value.hasMore && result.value.tweets.length > 0
            ? String(result.value.tweets[result.value.tweets.length - 1].id)
            : undefined,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INTERNAL_ERROR,
        message: "Failed to retrieve tweets",
      },
    };
  }
};

/**
 * 最新ツイート取得（ページネーション付き）
 * @param limit 取得するツイート数
 * @param prisma Prismaクライアントインスタンス
 * @param cursor ページネーション用カーソル（前ページの最後のツイートのID）
 * @returns ツイートとページネーション情報を含む結果
 */
export const getLatestTweets = async (
  limit: number,
  prisma: PrismaClient,
  cursor?: number
): Promise<Result<TweetListResponse, { type: TweetErrorType; message: string }>> => {
  // limitパラメータの検証
  if (limit <= 0 || limit > 100) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INVALID_PAGINATION_PARAMS,
        message: "Limit must be between 1 and 100",
      },
    };
  }

  try {
    // 最新ツイートの取得
    const result = await getLatestTweetsRepo(limit, prisma, cursor);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          type: TweetErrorType.INTERNAL_ERROR,
          message: "Failed to retrieve tweets",
        },
      };
    }

    // レスポンスの整形
    return {
      ok: true,
      value: {
        tweets: result.value.tweets,
        pagination: {
          hasMore: result.value.hasMore,
          nextCursor: result.value.hasMore && result.value.tweets.length > 0
            ? String(result.value.tweets[result.value.tweets.length - 1].id)
            : undefined,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: TweetErrorType.INTERNAL_ERROR,
        message: "Failed to retrieve tweets",
      },
    };
  }
};
