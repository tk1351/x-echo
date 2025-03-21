import type { PrismaClient } from "@prisma/client";
import {
  checkFollowStatus,
  createFollow,
  deleteFollow,
  getFollowers,
  getFollowing,
} from "../domain/follow/followRepository.ts";
import { findUserByUsername } from "../domain/user/userRepository.ts";
import type { FollowListResponse, FollowPaginationParams, FollowResponse, UserProfileResponse } from "../types/index.js";
import type { FollowError } from "../utils/errors.js";
import { FollowErrorType, UserErrorType } from "../utils/errors.js";
import type { Result } from "../utils/result.js";
import prisma from "../lib/prisma.js";

/**
 * Follows a user
 * @param followerId ID of the follower
 * @param username Username of the user to follow
 * @returns Result containing the follow relationship or an error
 */
export const followUser = async (
  followerId: number,
  username: string
): Promise<Result<FollowResponse, FollowError | { type: UserErrorType; message: string }>> => {
  // Find the user to follow
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const followingId = userResult.value.id;

  // Create follow relationship
  const followResult = await createFollow(
    { followerId, followingId },
    prisma
  );

  if (!followResult.ok) {
    return followResult;
  }

  return {
    ok: true,
    value: {
      id: followResult.value.id,
      followerId: followResult.value.followerId,
      followingId: followResult.value.followingId,
      createdAt: followResult.value.createdAt,
    },
  };
};

/**
 * Unfollows a user
 * @param followerId ID of the follower
 * @param username Username of the user to unfollow
 * @returns Result indicating success or an error
 */
export const unfollowUser = async (
  followerId: number,
  username: string
): Promise<Result<void, FollowError | { type: UserErrorType; message: string }>> => {
  // Find the user to unfollow
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const followingId = userResult.value.id;

  // Delete follow relationship
  return await deleteFollow(followerId, followingId, prisma);
};

/**
 * Checks if a user is following another user
 * @param followerId ID of the follower
 * @param username Username of the user to check
 * @returns Result containing the follow status or an error
 */
export const isFollowing = async (
  followerId: number,
  username: string
): Promise<Result<boolean, FollowError | { type: UserErrorType; message: string }>> => {
  // Find the user to check
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const followingId = userResult.value.id;

  // Check follow status
  return await checkFollowStatus(followerId, followingId, prisma);
};

/**
 * Gets a user profile with follow status
 * @param username Username of the user
 * @param currentUserId ID of the current user (optional)
 * @returns Result containing the user profile with follow status or an error
 */
export const getUserProfileWithFollowStatus = async (
  username: string,
  currentUserId?: number
): Promise<Result<UserProfileResponse & { isFollowing: boolean }, { type: UserErrorType | FollowErrorType; message: string }>> => {
  // Get user profile
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const user = userResult.value;

  // If no current user ID is provided, set isFollowing to false
  if (!currentUserId) {
    return {
      ok: true,
      value: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        headerImageUrl: user.headerImageUrl,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isFollowing: false,
      },
    };
  }

  // Check follow status
  const followStatusResult = await checkFollowStatus(currentUserId, user.id, prisma);
  if (!followStatusResult.ok) {
    return followStatusResult;
  }

  return {
    ok: true,
    value: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      headerImageUrl: user.headerImageUrl,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      isFollowing: followStatusResult.value,
    },
  };
};

/**
 * Gets the followers of a user
 * @param username Username of the user
 * @param params Pagination parameters
 * @returns Result containing the followers and pagination info or an error
 */
export const getUserFollowers = async (
  username: string,
  params: FollowPaginationParams
): Promise<Result<FollowListResponse, FollowError | { type: UserErrorType; message: string }>> => {
  // Find the user
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const userId = userResult.value.id;

  // Get followers
  const followersResult = await getFollowers(userId, params, prisma);
  if (!followersResult.ok) {
    return followersResult;
  }

  const { follows, hasMore, nextCursor } = followersResult.value;

  // Format response
  const followResponses: FollowResponse[] = follows.map((follow) => ({
    id: follow.id,
    followerId: follow.followerId,
    followingId: follow.followingId,
    createdAt: follow.createdAt,
  }));

  return {
    ok: true,
    value: {
      follows: followResponses,
      pagination: {
        hasMore,
        nextCursor: nextCursor?.toString(),
      },
    },
  };
};

/**
 * Gets the users that a user is following
 * @param username Username of the user
 * @param params Pagination parameters
 * @returns Result containing the following users and pagination info or an error
 */
export const getUserFollowing = async (
  username: string,
  params: FollowPaginationParams
): Promise<Result<FollowListResponse, FollowError | { type: UserErrorType; message: string }>> => {
  // Find the user
  const userResult = await findUserByUsername(username, prisma);
  if (!userResult.ok) {
    return userResult;
  }

  const userId = userResult.value.id;

  // Get following users
  const followingResult = await getFollowing(userId, params, prisma);
  if (!followingResult.ok) {
    return followingResult;
  }

  const { follows, hasMore, nextCursor } = followingResult.value;

  // Format response
  const followResponses: FollowResponse[] = follows.map((follow) => ({
    id: follow.id,
    followerId: follow.followerId,
    followingId: follow.followingId,
    createdAt: follow.createdAt,
  }));

  return {
    ok: true,
    value: {
      follows: followResponses,
      pagination: {
        hasMore,
        nextCursor: nextCursor?.toString(),
      },
    },
  };
};
