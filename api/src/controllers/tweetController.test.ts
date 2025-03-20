import { describe, expect, it, vi } from "vitest";
import * as tweetService from "../services/tweetService.ts";
import { TweetErrorType } from "../utils/errors.ts";
import { createTweet, getTweet, getUserTweets, getLatestTweets } from "./tweetController.ts";

vi.mock("../services/tweetService.ts");

describe("tweetController", () => {
  describe("createTweet", () => {
    it("should validate request body", async () => {
      // Arrange
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({}),
        },
        json: vi.fn().mockReturnValue("json response"),
      } as any;

      // Act
      const response = await createTweet(mockContext);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation error",
        }),
        400,
      );
    });

    it("should check authentication", async () => {
      // Arrange
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({ content: "Valid content" }),
        },
        get: vi.fn().mockReturnValue(null),
        json: vi.fn().mockReturnValue("json response"),
      } as any;

      // Act
      const response = await createTweet(mockContext);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "認証情報が不足しています" },
        401,
      );
    });

    it("should create tweet when validation passes", async () => {
      // Arrange
      const mockTweet = {
        id: 1,
        content: "Valid content",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({ content: "Valid content" }),
        },
        get: vi.fn().mockReturnValue({ userId: 1 }),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "createTweet").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const response = await createTweet(mockContext);

      // Assert
      expect(tweetService.createTweet).toHaveBeenCalledWith(
        {
          content: "Valid content",
          userId: 1,
        },
        expect.anything(),
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockTweet, 201);
    });

    it("should handle service errors", async () => {
      // Arrange
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({ content: "Valid content" }),
        },
        get: vi.fn().mockReturnValue({ userId: 1 }),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "createTweet").mockResolvedValue({
        ok: false,
        error: {
          type: TweetErrorType.INVALID_TWEET_DATA,
          message: "Invalid tweet data",
        },
      });

      // Act
      const response = await createTweet(mockContext);

      // Assert
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid tweet data" },
        400,
      );
    });
  });

  describe("getTweet", () => {
    it("should return tweet with status 200 when found", async () => {
      // Arrange
      const mockTweet = {
        id: 1,
        content: "Test tweet",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("1"),
        },
        json: vi.fn().mockReturnValue("json response"),
        status: vi.fn().mockReturnThis(),
      } as any;
      vi.spyOn(tweetService, "getTweetById").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const response = await getTweet(mockContext);

      // Assert
      expect(tweetService.getTweetById).toHaveBeenCalledWith(
        1,
        expect.anything(),
      );
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith(mockTweet);
    });

    it("should return 400 when id parameter is invalid", async () => {
      // Arrange
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("invalid"),
        },
        json: vi.fn().mockReturnValue("json response"),
        status: vi.fn().mockReturnThis(),
      } as any;

      // Act
      const response = await getTweet(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: "Invalid tweet ID",
      });
    });

    it("should return 404 when tweet is not found", async () => {
      // Arrange
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("999"),
        },
        json: vi.fn().mockReturnValue("json response"),
        status: vi.fn().mockReturnThis(),
      } as any;
      vi.spyOn(tweetService, "getTweetById").mockResolvedValue({
        ok: false,
        error: {
          type: TweetErrorType.TWEET_NOT_FOUND,
          message: "Tweet not found",
        },
      });

      // Act
      const response = await getTweet(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: "Tweet not found",
      });
    });

    it("should return 500 when internal error occurs", async () => {
      // Arrange
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("1"),
        },
        json: vi.fn().mockReturnValue("json response"),
        status: vi.fn().mockReturnThis(),
      } as any;
      vi.spyOn(tweetService, "getTweetById").mockResolvedValue({
        ok: false,
        error: {
          type: TweetErrorType.INTERNAL_ERROR,
          message: "Internal error",
        },
      });

      // Act
      const response = await getTweet(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: "Internal error",
      });
    });
  });

  describe("getUserTweets", () => {
    it("should validate query parameters", async () => {
      // Arrange
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("user1"),
          query: vi.fn((param) => {
            if (param === "limit") return "-1";
            if (param === "cursor") return "invalid";
            return null;
          }),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;

      // Act
      const response = await getUserTweets(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Invalid limit parameter"),
        }),
      );
    });

    it("should return tweets when parameters are valid", async () => {
      // Arrange
      const mockTweets = [
        { id: 3, content: "Tweet 3", userId: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, content: "Tweet 2", userId: 1, createdAt: new Date(), updatedAt: new Date() },
      ];
      const mockResponse = {
        tweets: mockTweets,
        pagination: {
          hasMore: true,
          nextCursor: "2",
        },
      };
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("user1"),
          query: vi.fn((param) => {
            if (param === "limit") return "10";
            return null;
          }),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "getTweetsByUsername").mockResolvedValue({
        ok: true,
        value: mockResponse,
      });

      // Act
      const response = await getUserTweets(mockContext);

      // Assert
      expect(tweetService.getTweetsByUsername).toHaveBeenCalledWith(
        "user1",
        10,
        expect.anything(),
        undefined,
      );
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle user not found error", async () => {
      // Arrange
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue("nonexistent"),
          query: vi.fn().mockReturnValue(null),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "getTweetsByUsername").mockResolvedValue({
        ok: false,
        error: {
          type: TweetErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const response = await getUserTweets(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });
  });

  describe("getLatestTweets", () => {
    it("should validate query parameters", async () => {
      // Arrange
      const mockContext = {
        req: {
          query: vi.fn((param) => {
            if (param === "limit") return "-1";
            if (param === "cursor") return "invalid";
            return null;
          }),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;

      // Act
      const response = await getLatestTweets(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Invalid limit parameter"),
        }),
      );
    });

    it("should return tweets when parameters are valid", async () => {
      // Arrange
      const mockTweets = [
        { id: 3, content: "Tweet 3", userId: 2, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, content: "Tweet 2", userId: 1, createdAt: new Date(), updatedAt: new Date() },
      ];
      const mockResponse = {
        tweets: mockTweets,
        pagination: {
          hasMore: true,
          nextCursor: "2",
        },
      };
      const mockContext = {
        req: {
          query: vi.fn((param) => {
            if (param === "limit") return "10";
            return null;
          }),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "getLatestTweets").mockResolvedValue({
        ok: true,
        value: mockResponse,
      });

      // Act
      const response = await getLatestTweets(mockContext);

      // Assert
      expect(tweetService.getLatestTweets).toHaveBeenCalledWith(
        10,
        expect.anything(),
        undefined,
      );
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle pagination parameter errors", async () => {
      // Arrange
      const mockContext = {
        req: {
          query: vi.fn().mockReturnValue("200"),
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnValue("json response"),
      } as any;
      vi.spyOn(tweetService, "getLatestTweets").mockResolvedValue({
        ok: false,
        error: {
          type: TweetErrorType.INVALID_PAGINATION_PARAMS,
          message: "Limit must be between 1 and 100",
        },
      });

      // Act
      const response = await getLatestTweets(mockContext);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid limit parameter. Must be between 1 and 100",
        }),
      );
    });
  });
});
