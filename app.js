import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,

        credentials: true,
    })
);

// Defined the json request size
app.use(
    express.json({
        limit: "40kb",
    })
);

// the size of the url
app.use(
    express.urlencoded({
        extended: true,
        limit: "20kb",
    })
);


app.use(cookieParser());
q

import userRouter from "../src/routes/user.routes.js";
import likeRouter from "../src/routes/like.routes.js";
import commentRouter from "../src/routes/comment.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import playlistRouter from "../src/routes/playlist.routes.js";
import dashboardRouter from "../src/routes/dashboard.routes.js";
import subscriptionRouter from "../src/routes/subscription.routes.js";

// ROUTES DECLARATION

app.use("/api/v1/users", userRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);

export { app };
