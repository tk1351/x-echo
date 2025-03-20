import { describe, expect, it, vi } from "vitest";
import * as tweetService from "../services/tweetService.ts";
import { TweetErrorType } from "../utils/errors.ts";
import { createTweet } from "./tweetController.ts";

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
});
