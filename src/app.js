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

app.use(
   express.json({
      limit: "20kb",
   })
);

app.use(
   express.urlencoded({
      extended: true,
      limit: "20kb",
   })
);

// routes imports

// import userRouter from "../src/routes/user.routes.js";
import  userRouter from "../src/routes/user.routes.js";


// routes declaration

app.use("/api/v1/users", userRouter);

export default app;
