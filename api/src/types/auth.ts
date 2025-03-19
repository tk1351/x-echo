import type { Role, User } from "@prisma/client";

// ブランド型
type Branded<T, B> = T & { _brand: B };
export type Password = Branded<string, "Password">;
export type HashedPassword = Branded<string, "HashedPassword">;
export type AccessToken = Branded<string, "AccessToken">;
export type RefreshToken = Branded<string, "RefreshToken">;
export type UserId = Branded<number, "UserId">;

// ログイン認証情報
export type LoginCredentials = {
	identifier: string; // ユーザー名またはメールアドレス
	password: string;
};

// JWTペイロード
export type JwtPayload = {
	userId: number;
	username: string;
	role: Role;
	iat?: number;
	exp?: number;
};

// 安全なユーザー情報（パスワードハッシュなどの機密情報を除外）
export type SafeUser = Omit<User, "passwordHash">;

// トークンペア
export type TokenPair = {
	accessToken: AccessToken;
	refreshToken: RefreshToken;
	user: SafeUser;
};
