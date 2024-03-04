import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// To allow to use resources from outside the domain
// here we use cloudinary , so we need cors
app.use(
   cors({
      origin: process.env.CORS_ORIGIN,

      credentials: true,
   })
);

// Defined the json request size
app.use(
   express.json({
      limit: "20kb",
   })
);

// the size of the url
app.use(
   express.urlencoded({
      extended: true,
      limit: "20kb",
   })
);

// ! To get parse cookies and use them for example : login / logout or to store session information
app.use(cookieParser());

// routes imports

import userRouter from "../src/routes/user.routes.js";

// routes declaration

app.use("/api/v1/users", userRouter);

export default app;
