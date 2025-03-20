export enum UserErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  UNAUTHORIZED_UPDATE = "UNAUTHORIZED_UPDATE",
  INVALID_PROFILE_DATA = "INVALID_PROFILE_DATA",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type UserError = {
  type: UserErrorType;
  message: string;
};

// 認証エラータイプ
export enum AuthErrorType {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// 認証エラー
export type AuthError = {
  type: AuthErrorType;
  message: string;
};

// バリデーションエラータイプ
export enum ValidationErrorType {
  INVALID_PASSWORD = "INVALID_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_USERNAME = "INVALID_USERNAME",
  INVALID_INPUT = "INVALID_INPUT",
}

// バリデーションエラー
export type ValidationError = {
  type: ValidationErrorType;
  message: string;
};
