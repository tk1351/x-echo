import { serve } from "@hono/node-server";
import { Hono } from "hono";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";

const app = new Hono();

// ルートの設定
app.route("/api/users", usersRouter);
app.route("/api/auth", authRouter);

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
