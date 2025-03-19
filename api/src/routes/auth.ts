import { Hono } from "hono";
import { login, refresh, logout } from "../controllers/authController.js";

// 認証関連のルーターを作成
const auth = new Hono();

// ログインエンドポイント
auth.post("/login", login);

// トークン更新エンドポイント
auth.post("/refresh", refresh);

// ログアウトエンドポイント
auth.post("/logout", logout);

export default auth;
