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
