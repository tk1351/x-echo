# ユーザー新規登録機能の実装計画

## 概要

X-Echoアプリケーションにおけるユーザー新規登録機能の実装計画を記述します。この機能は、新規ユーザーがアプリケーションに登録するためのAPIエンドポイントを提供します。パスワードは必ずハッシュ化して保存し、セキュリティを確保します。

## 必要なライブラリ

- **bcrypt**: パスワードのハッシュ化に使用
- **@types/bcrypt**: bcryptの型定義
- **zod**: リクエストのバリデーションに使用
- **@hono/zod-validator**: HonoでZodを使用するためのミドルウェア
- **vitest**: テストフレームワーク（TDD用）

## ディレクトリ構造

```
api/src/
├── index.ts                    # エントリーポイント
├── lib/
│   └── prisma.ts               # Prismaクライアント
├── routes/
│   └── users.ts                # ユーザー関連のルート
├── controllers/
│   ├── userController.ts       # ユーザー関連のコントローラー
│   └── userController.test.ts  # コントローラーのテスト
├── services/
│   ├── userService.ts          # ユーザー関連のサービス
│   └── userService.test.ts     # サービスのテスト
├── types/
│   └── index.ts                # 型定義
└── utils/
    ├── result.ts               # Result型の定義
    └── errors.ts               # エラー型の定義
```

## TDDに基づく実装手順

### 1. 環境準備

1. 必要なライブラリのインストール
   ```bash
   npm install bcrypt
   npm install --save-dev @types/bcrypt vitest
   npm install zod @hono/zod-validator
   ```

2. テスト設定の追加（package.jsonに追加）
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

### 2. 型定義の作成（Red）

1. Result型の定義（utils/result.ts）
   ```typescript
   export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
   ```

2. エラー型の定義（utils/errors.ts）
   ```typescript
   export enum UserErrorType {
     VALIDATION_ERROR = 'VALIDATION_ERROR',
     USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
     INTERNAL_ERROR = 'INTERNAL_ERROR'
   }

   export type UserError = {
     type: UserErrorType;
     message: string;
   };
   ```

3. ユーザー関連の型定義（types/index.ts）
   ```typescript
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
   ```

### 3. ユーザーサービスのテスト作成（Red）

userService.test.tsを作成し、以下のテストケースを記述：

1. パスワードハッシュ化のテスト
   - 正常系：パスワードが正しくハッシュ化されること
   - 異常系：空のパスワードでエラーが発生すること

2. ユーザー存在チェックのテスト
   - 正常系：存在しないユーザーの場合、エラーが発生しないこと
   - 異常系：ユーザー名が既に存在する場合、エラーが発生すること
   - 異常系：メールアドレスが既に存在する場合、エラーが発生すること

3. ユーザー作成のテスト
   - 正常系：ユーザーが正しく作成されること
   - 異常系：バリデーションエラーの場合、エラーが返されること
   - 異常系：ユーザーが既に存在する場合、エラーが返されること

### 4. ユーザーサービスの実装（Green）

userService.tsを実装し、テストを通過させる：

1. パスワードハッシュ化関数
   ```typescript
   export const hashPassword = async (password: string): Promise<string> => {
     if (!password) {
       throw new Error('Password is required');
     }
     const salt = await bcrypt.genSalt(10);
     return bcrypt.hash(password, salt);
   };
   ```

2. ユーザー存在チェック関数
   ```typescript
   export const checkUserExists = async (
     username: string,
     email: string,
     prisma: PrismaClient
   ): Promise<void> => {
     const existingUser = await prisma.user.findFirst({
       where: {
         OR: [
           { username },
           { email }
         ]
       }
     });

     if (existingUser) {
       if (existingUser.username === username) {
         throw new Error('Username already exists');
       }
       throw new Error('Email already exists');
     }
   };
   ```

3. ユーザー作成関数
   ```typescript
   export const createUser = async (
     userData: UserCreateInput,
     prisma: PrismaClient
   ): Promise<Result<User, UserError>> => {
     try {
       // 既存ユーザーのチェック
       await checkUserExists(userData.username, userData.email, prisma);

       // パスワードのハッシュ化
       const passwordHash = await hashPassword(userData.password);

       // ユーザーの作成
       const user = await prisma.user.create({
         data: {
           username: userData.username,
           displayName: userData.displayName,
           email: userData.email,
           passwordHash
         }
       });

       return { ok: true, value: user };
     } catch (error) {
       if (error instanceof Error) {
         if (error.message.includes('already exists')) {
           return {
             ok: false,
             error: {
               type: UserErrorType.USER_ALREADY_EXISTS,
               message: error.message
             }
           };
         }
       }

       return {
         ok: false,
         error: {
           type: UserErrorType.INTERNAL_ERROR,
           message: 'Failed to create user'
         }
       };
     }
   };
   ```

### 5. ユーザーサービスのリファクタリング（Refactor）

1. エラーマッピング関数の抽出
   ```typescript
   const mapErrorToUserError = (error: unknown): UserError => {
     if (error instanceof Error) {
       if (error.message.includes('already exists')) {
         return {
           type: UserErrorType.USER_ALREADY_EXISTS,
           message: error.message
         };
       }
       // その他のエラータイプのマッピング
     }

     return {
       type: UserErrorType.INTERNAL_ERROR,
       message: 'An unexpected error occurred'
     };
   };
   ```

2. 定数の抽出
   ```typescript
   const SALT_ROUNDS = 10;
   ```

### 6. コントローラーのテスト作成（Red）

userController.test.tsを作成し、以下のテストケースを記述：

1. バリデーションのテスト
   - 正常系：有効なリクエストデータの場合、バリデーションが通ること
   - 異常系：必須フィールドが欠けている場合、バリデーションエラーが発生すること
   - 異常系：無効なメールアドレス形式の場合、バリデーションエラーが発生すること
   - 異常系：パスワードが短すぎる場合、バリデーションエラーが発生すること

2. ユーザー登録ハンドラーのテスト
   - 正常系：有効なリクエストの場合、ユーザーが作成され201レスポンスが返されること
   - 異常系：バリデーションエラーの場合、400レスポンスが返されること
   - 異常系：ユーザーが既に存在する場合、409レスポンスが返されること
   - 異常系：内部エラーの場合、500レスポンスが返されること

### 7. コントローラーの実装（Green）

userController.tsを実装し、テストを通過させる：

1. バリデーションスキーマの定義
   ```typescript
   import { z } from 'zod';

   export const userCreateSchema = z.object({
     username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
     displayName: z.string().min(1).max(50),
     email: z.string().email(),
     password: z.string().min(8).max(100)
   });
   ```

2. ユーザー登録ハンドラーの実装
   ```typescript
   import { Context } from 'hono';
   import { zValidator } from '@hono/zod-validator';
   import { userCreateSchema } from './schemas';
   import { createUser } from '../services/userService';
   import prisma from '../lib/prisma';
   import { UserErrorType } from '../utils/errors';

   export const registerUser = async (c: Context) => {
     const data = c.req.valid('json');

     const result = await createUser(data, prisma);

     if (!result.ok) {
       switch (result.error.type) {
         case UserErrorType.VALIDATION_ERROR:
           return c.json({ error: result.error.message }, 400);
         case UserErrorType.USER_ALREADY_EXISTS:
           return c.json({ error: result.error.message }, 409);
         default:
           return c.json({ error: 'Internal server error' }, 500);
       }
     }

     // パスワードハッシュを除外したユーザー情報を返す
     const { passwordHash, ...userResponse } = result.value;
     return c.json(userResponse, 201);
   };
   ```

### 8. ルートの定義とアプリケーションへの統合（Green）

1. ユーザールートの定義（routes/users.ts）
   ```typescript
   import { Hono } from 'hono';
   import { zValidator } from '@hono/zod-validator';
   import { userCreateSchema } from '../controllers/schemas';
   import { registerUser } from '../controllers/userController';

   const usersRouter = new Hono();

   usersRouter.post(
     '/register',
     zValidator('json', userCreateSchema),
     registerUser
   );

   export default usersRouter;
   ```

2. アプリケーションへの統合（index.ts）
   ```typescript
   import { serve } from "@hono/node-server";
   import { Hono } from "hono";
   import usersRouter from './routes/users';

   const app = new Hono();

   app.route('/api/users', usersRouter);

   app.get("/", (c) => {
     return c.text("Hello Hono!");
   });

   serve(
     {
       fetch: app.fetch,
       port: 8080,
     },
     (info) => {
       console.log(`Server is running on http://localhost:${info.port}`);
     }
   );
   ```

### 9. 統合テストの作成と実行（Red→Green）

1. エンドツーエンドのAPIテスト
   - 正常系：ユーザー登録APIが正しく動作すること
   - 異常系：各種エラーケースが適切に処理されること

## エラーハンドリング

1. **バリデーションエラー**
   - ステータスコード: 400 Bad Request
   - レスポンス: `{ "error": "Validation error message" }`

2. **重複エラー**
   - ステータスコード: 409 Conflict
   - レスポンス: `{ "error": "Username already exists" }` または `{ "error": "Email already exists" }`

3. **サーバーエラー**
   - ステータスコード: 500 Internal Server Error
   - レスポンス: `{ "error": "Internal server error" }`

## セキュリティ考慮事項

1. **パスワードハッシュ化**
   - bcryptを使用してパスワードをハッシュ化
   - ソルトラウンドは10以上を推奨

2. **パスワード要件**
   - 最小長: 8文字
   - 複雑さ: 文字、数字、記号の組み合わせを推奨

3. **レスポンスセキュリティ**
   - パスワードハッシュをレスポンスに含めない
   - エラーメッセージは最小限の情報のみを含める

4. **入力検証**
   - すべてのユーザー入力を厳格に検証
   - SQLインジェクションやXSSを防止

## 実装上の注意点

1. **トランザクション処理**
   - ユーザー作成処理はトランザクション内で行い、一貫性を確保

2. **ログ記録**
   - エラーは適切にログに記録し、デバッグ可能にする
   - 個人情報やパスワードはログに記録しない

3. **パフォーマンス**
   - bcryptのハッシュ化は計算コストが高いため、非同期処理を活用

4. **テスト容易性**
   - 依存関係の注入を活用し、テスト可能な設計にする
   - モックを使用して外部依存を分離

## 今後の拡張性

1. **メール確認機能**
   - 登録後にメール確認リンクを送信する機能

2. **パスワードリセット**
   - パスワードを忘れた場合のリセット機能

3. **ソーシャルログイン**
   - OAuth2を使用したソーシャルログイン機能

4. **二要素認証**
   - 追加のセキュリティレイヤーとしての二要素認証
