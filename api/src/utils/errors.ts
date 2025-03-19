export enum UserErrorType {
	VALIDATION_ERROR = "VALIDATION_ERROR",
	USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
	INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type UserError = {
	type: UserErrorType;
	message: string;
};
