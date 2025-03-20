export type UserCreateInput = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export type UserResponse = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  createdAt: Date;
};

export type UserUpdateData = {
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  headerImageUrl?: string;
};

export type UserProfileResponse = {
  id: number;
  username: string;
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  headerImageUrl?: string | null;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  createdAt: Date;
};
