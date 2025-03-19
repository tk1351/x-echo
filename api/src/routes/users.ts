import { Hono } from "hono";
import { registerUser } from "../controllers/userController.js";

const usersRouter = new Hono();

// ユーザー登録エンドポイント
usersRouter.post("/register", registerUser);

export default usersRouter;
