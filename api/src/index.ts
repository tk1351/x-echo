import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from 'hono/cors';
import authRouter from "./routes/auth.js";
import tweetsRouter from "./routes/tweets.js";
import usersRouter from "./routes/users.js";

const app = new Hono();

app.use("/*", cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// ルートの設定
app.route("/api/users", usersRouter);
app.route("/api/auth", authRouter);
app.route("/api/tweets", tweetsRouter);

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
  },
);
