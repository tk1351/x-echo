import { describe, expect, it, vi } from "vitest";
import { createTweet } from "./tweetService.js";
import * as tweetRepository from "../domain/tweet/tweetRepository.js";
import { TweetErrorType } from "../utils/errors.js";

vi.mock("../domain/tweet/tweetRepository.js");

describe("tweetService", () => {
  describe("createTweet", () => {
    it("should validate tweet content length", async () => {
      // Arrange
      const mockPrisma = {} as any;
      const emptyContent = "";
      const tooLongContent = "a".repeat(281);

      // Act
      const emptyResult = await createTweet(
        { content: emptyContent, userId: 1 },
        mockPrisma
      );
      const tooLongResult = await createTweet(
        { content: tooLongContent, userId: 1 },
        mockPrisma
      );

      // Assert
      expect(emptyResult.ok).toBe(false);
      expect(emptyResult.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      expect(tooLongResult.ok).toBe(false);
      expect(tooLongResult.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
    });

    it("should check if user exists", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 999 },
        mockPrisma
      );

      // Assert
      expect(result.ok).toBe(false);
      expect(result.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it("should create tweet when validation passes", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      const mockTweet = {
        id: 1,
        content: "Valid content",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(tweetRepository, "createTweet").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 1 },
        mockPrisma
      );

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(mockTweet);
      expect(tweetRepository.createTweet).toHaveBeenCalledWith(
        { content: "Valid content", userId: 1 },
        mockPrisma
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      vi.spyOn(tweetRepository, "createTweet").mockResolvedValue({
        ok: false,
        error: new Error("Repository error"),
      });

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 1 },
        mockPrisma
      );

      // Assert
      expect(result.ok).toBe(false);
      expect(result.error.type).toBe(TweetErrorType.TWEET_CREATION_FAILED);
    });
  });
});
