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
