import dotenv from "dotenv";
import connectDB from "./db/databaseConnect.js";
import app from "./app.js";
import {servicePinger} from "./service.pinger.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening on: ${process.env.PORT}`);
            servicePinger();
        });
    })
    .catch((error) => console.log("MONGODB connection failed!!!: ", error));
