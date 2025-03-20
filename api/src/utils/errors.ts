export const UserErrorType = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  UNAUTHORIZED_UPDATE: "UNAUTHORIZED_UPDATE",
  INVALID_PROFILE_DATA: "INVALID_PROFILE_DATA",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const satisfies Record<string, string>;

export type UserErrorType = (typeof UserErrorType)[keyof typeof UserErrorType];

export type UserError = {
  type: UserErrorType;
  message: string;
};

// 認証エラータイプ
export const AuthErrorType = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const satisfies Record<string, string>;

export type AuthErrorType = (typeof AuthErrorType)[keyof typeof AuthErrorType];

// 認証エラー
export type AuthError = {
  type: AuthErrorType;
  message: string;
};

// バリデーションエラータイプ
export const ValidationErrorType = {
  INVALID_PASSWORD: "INVALID_PASSWORD",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_USERNAME: "INVALID_USERNAME",
  INVALID_INPUT: "INVALID_INPUT",
} as const satisfies Record<string, string>;

export type ValidationErrorType = (typeof ValidationErrorType)[keyof typeof ValidationErrorType];

// バリデーションエラー
export type ValidationError = {
  type: ValidationErrorType;
  message: string;
};

// ツイートエラータイプ
export const TweetErrorType = {
  INVALID_TWEET_DATA: "INVALID_TWEET_DATA",
  TWEET_CREATION_FAILED: "TWEET_CREATION_FAILED",
  UNAUTHORIZED_ACTION: "UNAUTHORIZED_ACTION",
  TWEET_NOT_FOUND: "TWEET_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const satisfies Record<string, string>;

export type TweetErrorType = (typeof TweetErrorType)[keyof typeof TweetErrorType];

// ツイートエラー
export type TweetError = {
  type: TweetErrorType;
  message: string;
};
