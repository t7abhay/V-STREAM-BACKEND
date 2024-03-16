// import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

// Setup for environment variables

process.loadEnvFile()
 

// We handle the promise here
//app.on is a middleware to hand any error
// then we listen on port provided by process.env.PORT ,else use the default port
// we catch any connection errors in connection block
connectDB()
  .then(() => {

    app.on("error",(error)=>{
        console.log("Error",error)
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !! ", err);
  });
