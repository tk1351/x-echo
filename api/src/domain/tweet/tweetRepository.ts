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
