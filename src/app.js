import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
const app = new express();

app.set("trust proxy", 1); // Fixes the express-rate-limit error

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: "Rate limited",
});
app.use(
    session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

const corsConfig = {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
};

app.use(limiter);
app.use(cors(corsConfig));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export default app;
