import dotenv from "dotenv";
import connectDB from "./src/db/databaseConnect.js";
import app from "./src/app.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening on: ${process.env.PORT}`);
        });
    })
    .catch((error) => console.log("MONGODB connection failed!!!: ", error));
