import { Hono } from "hono";
import { getUserTweets } from "../controllers/tweetController.js";
import {
  followUserController,
  getUserFollowersController,
  getUserFollowingController,
  unfollowUserController,
} from "../controllers/followController.js";
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

// ユーザーのツイート一覧取得エンドポイント
usersRouter.get("/:username/tweets", getUserTweets);

// フォロー関連のエンドポイント
usersRouter.post("/:username/follow", authenticate, followUserController);
usersRouter.delete("/:username/follow", authenticate, unfollowUserController);
usersRouter.get("/:username/followers", getUserFollowersController);
usersRouter.get("/:username/following", getUserFollowingController);

export default usersRouter;
