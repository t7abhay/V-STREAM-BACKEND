import connectDB from "./db/databaseConnect.js";
import { app } from "./app.js";
process.loadEnvFile();
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
