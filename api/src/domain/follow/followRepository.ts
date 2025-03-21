import type { Follow, PrismaClient } from "@prisma/client";
import type { FollowCreateInput, FollowPaginationParams } from "../../types/index.js";
import type { FollowError } from "../../utils/errors.js";
import { FollowErrorType } from "../../utils/errors.js";
import type { Result } from "../../utils/result.js";

/**
 * Creates a follow relationship between two users
 * @param data Follow creation input data
 * @param prisma Prisma client instance
 * @returns Result containing the created follow relationship or an error
 */
export const createFollow = async (
  data: FollowCreateInput,
  prisma: PrismaClient
): Promise<Result<Follow, FollowError>> => {
  try {
    // Check if user is trying to follow themselves
    if (data.followerId === data.followingId) {
      return {
        ok: false,
        error: {
          type: FollowErrorType.CANNOT_FOLLOW_SELF,
          message: "Cannot follow yourself",
        },
      };
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: data.followerId,
        followingId: data.followingId,
      },
    });

    if (existingFollow) {
      return {
        ok: false,
        error: {
          type: FollowErrorType.ALREADY_FOLLOWING,
          message: "Already following this user",
        },
      };
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data,
    });

    // Update follower and following counts
    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.followingId },
        data: { followersCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: data.followerId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    return { ok: true, value: follow };
  } catch (error) {
    console.error("Error creating follow:", error);
    return {
      ok: false,
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal error occurred while creating follow relationship",
      },
    };
  }
};

/**
 * Deletes a follow relationship between two users
 * @param followerId ID of the follower
 * @param followingId ID of the user being followed
 * @param prisma Prisma client instance
 * @returns Result indicating success or an error
 */
export const deleteFollow = async (
  followerId: number,
  followingId: number,
  prisma: PrismaClient
): Promise<Result<void, FollowError>> => {
  try {
    // Find the follow relationship
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (!follow) {
      return {
        ok: false,
        error: {
          type: FollowErrorType.NOT_FOLLOWING,
          message: "Not following this user",
        },
      };
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });

    // Update follower and following counts
    await prisma.$transaction([
      prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);

    return { ok: true, value: undefined };
  } catch (error) {
    console.error("Error deleting follow:", error);
    return {
      ok: false,
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal error occurred while deleting follow relationship",
      },
    };
  }
};

/**
 * Checks if a user is following another user
 * @param followerId ID of the follower
 * @param followingId ID of the user being followed
 * @param prisma Prisma client instance
 * @returns Result containing the follow status or an error
 */
export const checkFollowStatus = async (
  followerId: number,
  followingId: number,
  prisma: PrismaClient
): Promise<Result<boolean, FollowError>> => {
  try {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    return { ok: true, value: !!follow };
  } catch (error) {
    console.error("Error checking follow status:", error);
    return {
      ok: false,
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal error occurred while checking follow status",
      },
    };
  }
};

/**
 * Gets the followers of a user with pagination
 * @param userId ID of the user
 * @param params Pagination parameters
 * @param prisma Prisma client instance
 * @returns Result containing the followers and pagination info or an error
 */
export const getFollowers = async (
  userId: number,
  params: FollowPaginationParams,
  prisma: PrismaClient
): Promise<Result<{ follows: Follow[]; hasMore: boolean; nextCursor?: number }, FollowError>> => {
  try {
    const { limit, cursor } = params;

    // Implement cursor-based pagination
    const follows = await prisma.follow.findMany({
      where: {
        followingId: userId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [
        { id: "desc" },
      ],
      take: limit + 1, // Fetch one more to determine if there are more results
    });

    const hasMore = follows.length > limit;
    if (hasMore) {
      follows.pop(); // Remove the extra item
    }

    const nextCursor = hasMore ? follows[follows.length - 1].id : undefined;

    return {
      ok: true,
      value: {
        follows,
        hasMore,
        nextCursor,
      },
    };
  } catch (error) {
    console.error("Error getting followers:", error);
    return {
      ok: false,
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal error occurred while getting followers",
      },
    };
  }
};

/**
 * Gets the users that a user is following with pagination
 * @param userId ID of the user
 * @param params Pagination parameters
 * @param prisma Prisma client instance
 * @returns Result containing the following users and pagination info or an error
 */
export const getFollowing = async (
  userId: number,
  params: FollowPaginationParams,
  prisma: PrismaClient
): Promise<Result<{ follows: Follow[]; hasMore: boolean; nextCursor?: number }, FollowError>> => {
  try {
    const { limit, cursor } = params;

    // Implement cursor-based pagination
    const follows = await prisma.follow.findMany({
      where: {
        followerId: userId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [
        { id: "desc" },
      ],
      take: limit + 1, // Fetch one more to determine if there are more results
    });

    const hasMore = follows.length > limit;
    if (hasMore) {
      follows.pop(); // Remove the extra item
    }

    const nextCursor = hasMore ? follows[follows.length - 1].id : undefined;

    return {
      ok: true,
      value: {
        follows,
        hasMore,
        nextCursor,
      },
    };
  } catch (error) {
    console.error("Error getting following:", error);
    return {
      ok: false,
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal error occurred while getting following users",
      },
    };
  }
};
