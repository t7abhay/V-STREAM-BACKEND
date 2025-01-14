import connectDB from "./db/databaseConnect.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        // No need to listen on a port in Vercel serverless functions
        console.log("MongoDB connected successfully.");
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAILED !! ", err);
    });

export default app; // Export app for Vercel to handle the request
