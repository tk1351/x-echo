import type { PrismaClient } from "@prisma/client";
import type { TweetCreateInput, TweetResponse } from "../../types/index.js";
import type { Result } from "../../utils/result.js";

export const createTweet = async (
  data: TweetCreateInput,
  prisma: PrismaClient,
): Promise<Result<TweetResponse, Error>> => {
  try {
    const tweet = await prisma.tweet.create({
      data: {
        content: data.content,
        userId: data.userId,
      },
    });
    return { ok: true, value: tweet };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
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
): Promise<Result<TweetResponse, Error>> => {
  try {
    const tweet = await prisma.tweet.findUnique({
      where: { id },
    });

    if (!tweet) {
      return { ok: false, error: new Error(`Tweet not found with id: ${id}`) };
    }

    return { ok: true, value: tweet };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

/**
 * ユーザーIDによるツイート取得（ページネーション付き）
 * @param userId ユーザーID
 * @param limit 取得するツイート数
 * @param prisma Prismaクライアントインスタンス
 * @param cursor ページネーション用カーソル（前ページの最後のツイートのID）
 * @returns ツイートとhasMoreフラグを含む結果
 */
export const getTweetsByUserId = async (
  userId: number,
  limit: number,
  prisma: PrismaClient,
  cursor?: number
): Promise<Result<{ tweets: TweetResponse[]; hasMore: boolean }, Error>> => {
  try {
    // リクエストされた数より1つ多く取得して、さらにツイートがあるかどうかを判断
    const tweets = await prisma.tweet.findMany({
      where: {
        userId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" } // 一貫した順序付けのためにIDによる二次ソート
      ],
      take: limit + 1,
    });

    // さらにツイートがあるかどうかを判断
    const hasMore = tweets.length > limit;
    // hasMoreがtrueの場合、余分なツイートを削除
    const resultTweets = hasMore ? tweets.slice(0, limit) : tweets;

    return {
      ok: true,
      value: {
        tweets: resultTweets,
        hasMore,
      },
    };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

/**
 * 最新ツイート取得（ページネーション付き）
 * @param limit 取得するツイート数
 * @param prisma Prismaクライアントインスタンス
 * @param cursor ページネーション用カーソル（前ページの最後のツイートのID）
 * @returns ツイートとhasMoreフラグを含む結果
 */
export const getLatestTweets = async (
  limit: number,
  prisma: PrismaClient,
  cursor?: number
): Promise<Result<{ tweets: TweetResponse[]; hasMore: boolean }, Error>> => {
  try {
    // リクエストされた数より1つ多く取得して、さらにツイートがあるかどうかを判断
    const tweets = await prisma.tweet.findMany({
      where: cursor ? { id: { lt: cursor } } : {},
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" } // 一貫した順序付けのためにIDによる二次ソート
      ],
      take: limit + 1,
    });

    // さらにツイートがあるかどうかを判断
    const hasMore = tweets.length > limit;
    // hasMoreがtrueの場合、余分なツイートを削除
    const resultTweets = hasMore ? tweets.slice(0, limit) : tweets;

    return {
      ok: true,
      value: {
        tweets: resultTweets,
        hasMore,
      },
    };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};
