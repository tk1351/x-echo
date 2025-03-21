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

export type TweetCreateInput = {
  content: string;
  userId: number;
};

export type TweetResponse = {
  id: number;
  content: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

// ツイートリストレスポンス型
export type TweetListResponse = {
  tweets: TweetResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string; // 次ページのカーソル（最後のツイートのID）
  };
};

// ページネーションパラメータ型
export type PaginationParams = {
  limit: number;
  cursor?: number;
};

// フォロー作成入力型
export type FollowCreateInput = {
  followerId: number;
  followingId: number;
};

// フォローレスポンス型
export type FollowResponse = {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: Date;
};

// フォローページネーションパラメータ型
export type FollowPaginationParams = {
  limit: number;
  cursor?: number;
};

// フォローリストレスポンス型
export type FollowListResponse = {
  follows: FollowResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

// フォロー状態付きユーザープロフィールレスポンス型
export type UserProfileWithFollowStatusResponse = UserProfileResponse & {
  isFollowing: boolean;
};
