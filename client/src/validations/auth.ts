import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'ユーザー名またはメールアドレスは必須です'),
  password: z.string().min(1, 'パスワードは必須です'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'ユーザー名は3文字以上である必要があります')
    .max(20, 'ユーザー名は20文字以下である必要があります')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
  displayName: z
    .string()
    .min(1, '表示名は必須です')
    .max(50, '表示名は50文字以下である必要があります'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(100, 'パスワードは100文字以下である必要があります'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
