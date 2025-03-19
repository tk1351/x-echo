import { Hono } from "hono";
import { login, logout, me, refresh } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

// 認証関連のルーターを作成
const auth = new Hono();

// 認証不要のエンドポイント
auth.post("/login", login);
auth.post("/refresh", refresh);

// 認証が必要なエンドポイント
auth.post("/logout", authenticate, logout);
auth.get("/me", authenticate, me);

export default auth;
