import type { PrismaClient, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserErrorType } from "../../utils/errors.js";
import { findUserByIdentifier, findUserById } from "./userRepository.js";

describe("userRepository", () => {
	let mockPrisma: any;
	const mockUser: User = {
		id: 1,
		username: "testuser",
		displayName: "Test User",
		email: "test@example.com",
		passwordHash: "hashedpassword",
		bio: null,
		profileImageUrl: null,
		headerImageUrl: null,
		followersCount: 0,
		followingCount: 0,
		isVerified: false,
		isActive: true,
		role: "USER",
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockPrisma = {
			user: {
				findFirst: vi.fn(),
				findUnique: vi.fn(),
			},
		};
	});

	describe("findUserByIdentifier", () => {
		it("should return user when found by username", async () => {
			// Arrange
			mockPrisma.user.findFirst.mockResolvedValue(mockUser);

			// Act
			const result = await findUserByIdentifier(
				"testuser",
				mockPrisma as PrismaClient,
			);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUser);
			}
			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: {
					OR: [{ username: "testuser" }, { email: "testuser" }],
				},
			});
		});

		it("should return error when user not found", async () => {
			// Arrange
			mockPrisma.user.findFirst.mockResolvedValue(null);

			// Act
			const result = await findUserByIdentifier(
				"nonexistent",
				mockPrisma as PrismaClient,
			);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
				expect(result.error.message).toBe("ユーザーが見つかりません");
			}
		});

		it("should return error when database throws error", async () => {
			// Arrange
			mockPrisma.user.findFirst.mockRejectedValue(new Error("Database error"));

			// Act
			const result = await findUserByIdentifier(
				"testuser",
				mockPrisma as PrismaClient,
			);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
			}
		});
	});

	describe("findUserById", () => {
		it("should return user when found by id", async () => {
			// Arrange
			mockPrisma.user.findUnique.mockResolvedValue(mockUser);

			// Act
			const result = await findUserById(1, mockPrisma as PrismaClient);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUser);
			}
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should return error when user not found", async () => {
			// Arrange
			mockPrisma.user.findUnique.mockResolvedValue(null);

			// Act
			const result = await findUserById(999, mockPrisma as PrismaClient);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
				expect(result.error.message).toBe("ユーザーが見つかりません");
			}
		});

		it("should return error when database throws error", async () => {
			// Arrange
			mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

			// Act
			const result = await findUserById(1, mockPrisma as PrismaClient);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
			}
		});
	});
});
