import { Hono } from "hono";
import {
  createTweet,
  getLatestTweets,
  getTweet,
  getTimeline,
} from "../controllers/tweetController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const tweetsRouter = new Hono();

// Tweet creation endpoint (requires authentication)
tweetsRouter.post("/", authenticate, createTweet);

// Tweet retrieval endpoint (no authentication required)
tweetsRouter.get("/:id", getTweet);

// Latest tweets retrieval endpoint (no authentication required)
tweetsRouter.get("/", getLatestTweets);

// Timeline endpoint (requires authentication)
tweetsRouter.get("/timeline", authenticate, getTimeline);

export default tweetsRouter;
