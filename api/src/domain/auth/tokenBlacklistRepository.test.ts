import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
	addToBlacklist,
	isTokenBlacklisted,
	removeExpiredTokens,
} from "./tokenBlacklistRepository.js";
import { AuthErrorType } from "../../utils/errors.js";

// モックPrismaクライアント
const mockPrisma = {
	tokenBlacklist: {
		create: vi.fn(),
		findUnique: vi.fn(),
		deleteMany: vi.fn(),
	},
} as unknown as PrismaClient;

describe("tokenBlacklistRepository", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe("addToBlacklist", () => {
		it("トークンをブラックリストに正常に追加できること", async () => {
			// Arrange
			const token = "test.jwt.token";
			const expiresAt = new Date();
			mockPrisma.tokenBlacklist.create.mockResolvedValueOnce({
				id: 1,
				token,
				expiresAt,
				createdAt: new Date(),
			});

			// Act
			const result = await addToBlacklist(token, expiresAt, mockPrisma);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockPrisma.tokenBlacklist.create).toHaveBeenCalledWith({
				data: {
					token,
					expiresAt,
				},
			});
		});

		it("データベースエラー時に適切なエラーを返すこと", async () => {
			// Arrange
			const token = "test.jwt.token";
			const expiresAt = new Date();
			mockPrisma.tokenBlacklist.create.mockRejectedValueOnce(
				new Error("Database error"),
			);

			// Act
			const result = await addToBlacklist(token, expiresAt, mockPrisma);

			// Assert
			expect(result.ok).toBe(false);
			expect(result.error?.type).toBe(AuthErrorType.INTERNAL_ERROR);
		});
	});

	describe("isTokenBlacklisted", () => {
		it("ブラックリストに存在するトークンの場合trueを返すこと", async () => {
			// Arrange
			const token = "blacklisted.jwt.token";
			mockPrisma.tokenBlacklist.findUnique.mockResolvedValueOnce({
				id: 1,
				token,
				expiresAt: new Date(),
				createdAt: new Date(),
			});

			// Act
			const result = await isTokenBlacklisted(token, mockPrisma);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toBe(true);
			expect(mockPrisma.tokenBlacklist.findUnique).toHaveBeenCalledWith({
				where: { token },
			});
		});

		it("ブラックリストに存在しないトークンの場合falseを返すこと", async () => {
			// Arrange
			const token = "valid.jwt.token";
			mockPrisma.tokenBlacklist.findUnique.mockResolvedValueOnce(null);

			// Act
			const result = await isTokenBlacklisted(token, mockPrisma);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toBe(false);
		});

		it("データベースエラー時に適切なエラーを返すこと", async () => {
			// Arrange
			const token = "test.jwt.token";
			mockPrisma.tokenBlacklist.findUnique.mockRejectedValueOnce(
				new Error("Database error"),
			);

			// Act
			const result = await isTokenBlacklisted(token, mockPrisma);

			// Assert
			expect(result.ok).toBe(false);
			expect(result.error?.type).toBe(AuthErrorType.INTERNAL_ERROR);
		});
	});

	describe("removeExpiredTokens", () => {
		it("期限切れのトークンを正常に削除し、削除数を返すこと", async () => {
			// Arrange
			mockPrisma.tokenBlacklist.deleteMany.mockResolvedValueOnce({
				count: 5,
			});

			// Act
			const result = await removeExpiredTokens(mockPrisma);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toBe(5);
			expect(mockPrisma.tokenBlacklist.deleteMany).toHaveBeenCalledWith({
				where: {
					expiresAt: {
						lt: expect.any(Date),
					},
				},
			});
		});

		it("データベースエラー時に適切なエラーを返すこと", async () => {
			// Arrange
			mockPrisma.tokenBlacklist.deleteMany.mockRejectedValueOnce(
				new Error("Database error"),
			);

			// Act
			const result = await removeExpiredTokens(mockPrisma);

			// Assert
			expect(result.ok).toBe(false);
			expect(result.error?.type).toBe(AuthErrorType.INTERNAL_ERROR);
		});
	});
});
