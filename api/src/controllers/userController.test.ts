import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as userService from "../services/userService.ts";
import type { UserError } from "../utils/errors.ts";
import { UserErrorType } from "../utils/errors.ts";
import type { Result } from "../utils/result.js";
import { getUserProfile, registerUser, updateUserProfile, userCreateSchema, userUpdateSchema } from "./userController.ts";

// モックの作成
vi.mock("../services/userService.ts");
vi.mock("../lib/prisma.ts", () => ({
  default: {},
}));

describe("userUpdateSchema", () => {
  it("should validate correct update data", () => {
    const validData = {
      displayName: "Updated Name",
      bio: "Updated bio",
    };

    const result = userUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should allow partial updates", () => {
    const validData = {
      displayName: "Updated Name",
    };

    const result = userUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject too long displayName", () => {
    const invalidData = {
      displayName: "a".repeat(51), // 51文字（上限は50文字）
    };

    const result = userUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject too long bio", () => {
    const invalidData = {
      bio: "a".repeat(161), // 161文字（上限は160文字）
    };

    const result = userUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("userCreateSchema", () => {
  it("should validate correct user data", () => {
    const validData = {
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    const result = userCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid username", () => {
    const invalidData = {
      username: "te", // too short
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const invalidData = {
      username: "testuser",
      displayName: "Test User",
      email: "invalid-email",
      password: "password123",
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const invalidData = {
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "short",
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("getUserProfile", () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        param: vi.fn().mockReturnValue("testuser"),
      },
      json: vi.fn().mockReturnValue("json-response"),
    };
  });

  it("should return 200 with user profile on successful retrieval", async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue({
      ok: true,
      value: {
        id: 1,
        username: "testuser",
        displayName: "Test User",
        bio: "Test bio",
        profileImageUrl: null,
        headerImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        createdAt: new Date(),
      },
    });

    const result = await getUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "testuser",
        displayName: "Test User",
        bio: "Test bio",
      }),
      200,
    );
    expect(result).toBe("json-response");
  });

  it("should return 404 when user not found", async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_NOT_FOUND,
        message: "ユーザーが見つかりません",
      },
    });

    const result = await getUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "ユーザーが見つかりません" },
      404,
    );
    expect(result).toBe("json-response");
  });

  it("should return 500 on internal error", async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "内部エラーが発生しました",
      },
    });

    const result = await getUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "内部エラーが発生しました" },
      500,
    );
    expect(result).toBe("json-response");
  });
});

describe("updateUserProfile", () => {
  let mockContext: any;
  const updateData = {
    displayName: "Updated Name",
    bio: "Updated bio",
  };

  beforeEach(() => {
    mockContext = {
      req: {
        json: vi.fn().mockResolvedValue(updateData),
      },
      get: vi.fn().mockReturnValue({ userId: 1 }),
      json: vi.fn().mockReturnValue("json-response"),
    };
  });

  it("should return 200 with updated profile on successful update", async () => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      ok: true,
      value: {
        id: 1,
        username: "testuser",
        displayName: "Updated Name",
        bio: "Updated bio",
        profileImageUrl: null,
        headerImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        createdAt: new Date(),
      },
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Updated Name",
        bio: "Updated bio",
      }),
      200,
    );
    expect(result).toBe("json-response");
  });

  it("should return 400 when validation fails", async () => {
    // バリデーション失敗のモック
    mockContext.req.json.mockResolvedValue({
      displayName: "a".repeat(51), // 51文字（上限は50文字）
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation error",
        details: expect.any(Object),
      }),
      400,
    );
    expect(result).toBe("json-response");
  });

  it("should return 400 when profile data is invalid", async () => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.INVALID_PROFILE_DATA,
        message: "プロファイルデータが無効です",
      },
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "プロファイルデータが無効です" },
      400,
    );
    expect(result).toBe("json-response");
  });

  it("should return 404 when user not found", async () => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_NOT_FOUND,
        message: "ユーザーが見つかりません",
      },
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "ユーザーが見つかりません" },
      404,
    );
    expect(result).toBe("json-response");
  });

  it("should return 403 when unauthorized update", async () => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.UNAUTHORIZED_UPDATE,
        message: "他のユーザーのプロファイルを更新する権限がありません",
      },
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "他のユーザーのプロファイルを更新する権限がありません" },
      403,
    );
    expect(result).toBe("json-response");
  });

  it("should return 500 on internal error", async () => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "内部エラーが発生しました",
      },
    });

    const result = await updateUserProfile(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "内部エラーが発生しました" },
      500,
    );
    expect(result).toBe("json-response");
  });
});

describe("registerUser", () => {
  let mockContext: any;
  const userData = {
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  beforeEach(() => {
    mockContext = {
      req: {
        json: vi.fn().mockResolvedValue(userData),
      },
      json: vi.fn().mockReturnValue("json-response"),
    };
  });

  it("should return 201 with user data on successful registration", async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: true,
      value: {
        id: 1,
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        passwordHash: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
        bio: null,
        profileImageUrl: null,
        headerImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        isActive: true,
        role: "USER",
      },
    } as Result<User, UserError>);

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      }),
      201,
    );
    expect(result).toBe("json-response");
  });

  it("should return 400 when validation fails", async () => {
    // バリデーション失敗のモック
    mockContext.req.json.mockResolvedValue({
      username: "te", // 短すぎる
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation error",
        details: expect.any(Object),
      }),
      400,
    );
    expect(result).toBe("json-response");
  });

  it("should return 409 when user already exists", async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_ALREADY_EXISTS,
        message: "Username already exists",
      },
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Username already exists" },
      409,
    );
    expect(result).toBe("json-response");
  });

  it("should return 500 on internal error", async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: "Failed to create user",
      },
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Internal server error" },
      500,
    );
    expect(result).toBe("json-response");
  });
});
