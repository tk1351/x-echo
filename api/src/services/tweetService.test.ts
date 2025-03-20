import { describe, expect, it, vi } from "vitest";
import * as tweetRepository from "../domain/tweet/tweetRepository.ts";
import { TweetErrorType } from "../utils/errors.ts";
import { createTweet, getTweetById } from "./tweetService.ts";

vi.mock("../domain/tweet/tweetRepository.ts");

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
        mockPrisma,
      );
      const tooLongResult = await createTweet(
        { content: tooLongContent, userId: 1 },
        mockPrisma,
      );

      // Assert
      expect(emptyResult.ok).toBe(false);
      if (!emptyResult.ok) {
        expect(emptyResult.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      }
      expect(tooLongResult.ok).toBe(false);
      if (!tooLongResult.ok) {
        expect(tooLongResult.error.type).toBe(
          TweetErrorType.INVALID_TWEET_DATA,
        );
      }
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
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      }
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
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTweet);
      }
      expect(tweetRepository.createTweet).toHaveBeenCalledWith(
        { content: "Valid content", userId: 1 },
        mockPrisma,
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
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.TWEET_CREATION_FAILED);
      }
    });
  });

  describe("getTweetById", () => {
    it("should return tweet when found", async () => {
      // Arrange
      const mockPrisma = {} as any;
      const mockTweet = {
        id: 1,
        content: "Test tweet",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const result = await getTweetById(1, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTweet);
      }
      expect(tweetRepository.getTweetById).toHaveBeenCalledWith(1, mockPrisma);
    });

    it("should return TWEET_NOT_FOUND error when tweet is not found", async () => {
      // Arrange
      const mockPrisma = {} as any;
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: false,
        error: new Error("Tweet not found with id: 999"),
      });

      // Act
      const result = await getTweetById(999, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.TWEET_NOT_FOUND);
        expect(result.error.message).toBe("Tweet with id 999 not found");
      }
    });

    it("should return INTERNAL_ERROR when repository throws unexpected error", async () => {
      // Arrange
      const mockPrisma = {} as any;
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: false,
        error: new Error("Database error"),
      });

      // Act
      const result = await getTweetById(1, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to retrieve tweet");
      }
    });
  });
});
