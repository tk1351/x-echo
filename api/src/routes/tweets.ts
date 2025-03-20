import { Hono } from "hono";
import { createTweet } from "../controllers/tweetController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const tweetsRouter = new Hono();

// Tweet creation endpoint (requires authentication)
tweetsRouter.post("/", authenticate, createTweet);

export default tweetsRouter;
