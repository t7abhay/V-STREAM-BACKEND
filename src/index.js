import connectDB from "./db/databaseConnect.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});
connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error", error);
        });
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAILED !! ", err);
    });
export default (req, res) => {
    app(req, res);  
};
