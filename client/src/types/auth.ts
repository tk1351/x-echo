export type LoginCredentials = {
  identifier: string;
  password: string;
};

export type RegisterCredentials = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export type User = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  headerImageUrl?: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type AuthError = {
  type: string;
  message: string;
};
