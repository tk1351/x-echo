import { Hono } from "hono";
import {
  getUserProfile,
  registerUser,
  updateUserProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const usersRouter = new Hono();

// ユーザー登録エンドポイント
usersRouter.post("/register", registerUser);

// ユーザープロファイル取得エンドポイント
usersRouter.get("/:username", getUserProfile);

// ユーザープロファイル更新エンドポイント（認証が必要）
usersRouter.put("/profile", authenticate, updateUserProfile);

export default usersRouter;
