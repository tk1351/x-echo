import type { Context } from "hono";
import { z } from "zod";
import {
  followUser,
  getUserFollowers,
  getUserFollowing,
  unfollowUser,
} from "../services/followService.js";
import { FollowErrorType, UserErrorType } from "../utils/errors.js";

/**
 * Follows a user
 * @param c Hono context
 * @returns Response with follow status or error
 */
export const followUserController = async (c: Context) => {
  try {
    // Get current user ID from JWT
    const userId = c.get("jwtPayload").id;

    // Get username from params
    const username = c.req.param("username");

    // Follow user
    const result = await followUser(userId, username);

    if (!result.ok) {
      // Handle errors
      if (result.error.type === UserErrorType.USER_NOT_FOUND) {
        c.status(404);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      if (result.error.type === FollowErrorType.ALREADY_FOLLOWING) {
        c.status(409);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      if (result.error.type === FollowErrorType.CANNOT_FOLLOW_SELF) {
        c.status(400);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      c.status(500);
      return c.json({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    }

    // Return success response
    c.status(201);
    return c.json({
      follow: result.value,
    });
  } catch (error) {
    console.error("Error in followUserController:", error);
    c.status(500);
    return c.json({
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal server error",
      },
    });
  }
};

/**
 * Unfollows a user
 * @param c Hono context
 * @returns Response with success or error
 */
export const unfollowUserController = async (c: Context) => {
  try {
    // Get current user ID from JWT
    const userId = c.get("jwtPayload").id;

    // Get username from params
    const username = c.req.param("username");

    // Unfollow user
    const result = await unfollowUser(userId, username);

    if (!result.ok) {
      // Handle errors
      if (result.error.type === UserErrorType.USER_NOT_FOUND) {
        c.status(404);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      if (result.error.type === FollowErrorType.NOT_FOLLOWING) {
        c.status(400);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      c.status(500);
      return c.json({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    }

    // Return success response
    c.status(200);
    return c.json({
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error in unfollowUserController:", error);
    c.status(500);
    return c.json({
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal server error",
      },
    });
  }
};

/**
 * Gets the followers of a user
 * @param c Hono context
 * @returns Response with followers list or error
 */
export const getUserFollowersController = async (c: Context) => {
  try {
    // Get username from params
    const username = c.req.param("username");

    // Validate query parameters
    const schema = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.coerce.number().int().optional(),
    });

    const validationResult = schema.safeParse(c.req.query());

    if (!validationResult.success) {
      c.status(400);
      return c.json({
        error: {
          type: "VALIDATION_ERROR",
          message: "Invalid pagination parameters",
          details: validationResult.error.format(),
        },
      });
    }

    const { limit, cursor } = validationResult.data;

    // Get followers
    const result = await getUserFollowers(username, { limit, cursor });

    if (!result.ok) {
      // Handle errors
      if (result.error.type === UserErrorType.USER_NOT_FOUND) {
        c.status(404);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      c.status(500);
      return c.json({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    }

    // Return success response
    c.status(200);
    return c.json(result.value);
  } catch (error) {
    console.error("Error in getUserFollowersController:", error);
    c.status(500);
    return c.json({
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal server error",
      },
    });
  }
};

/**
 * Gets the users that a user is following
 * @param c Hono context
 * @returns Response with following list or error
 */
export const getUserFollowingController = async (c: Context) => {
  try {
    // Get username from params
    const username = c.req.param("username");

    // Validate query parameters
    const schema = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.coerce.number().int().optional(),
    });

    const validationResult = schema.safeParse(c.req.query());

    if (!validationResult.success) {
      c.status(400);
      return c.json({
        error: {
          type: "VALIDATION_ERROR",
          message: "Invalid pagination parameters",
          details: validationResult.error.format(),
        },
      });
    }

    const { limit, cursor } = validationResult.data;

    // Get following users
    const result = await getUserFollowing(username, { limit, cursor });

    if (!result.ok) {
      // Handle errors
      if (result.error.type === UserErrorType.USER_NOT_FOUND) {
        c.status(404);
        return c.json({
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
      }

      c.status(500);
      return c.json({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    }

    // Return success response
    c.status(200);
    return c.json(result.value);
  } catch (error) {
    console.error("Error in getUserFollowingController:", error);
    c.status(500);
    return c.json({
      error: {
        type: FollowErrorType.INTERNAL_ERROR,
        message: "Internal server error",
      },
    });
  }
};
