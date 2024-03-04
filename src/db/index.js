import mongoose from 'mongoose'
import { DB_NAME } from "../constants.js";


/* 
    - Wrapped the connection inside try and catch for making debugging easier and to follow good coding practises

*/

const connectDB = async () =>{
    
    // try to connect ,if success then log else throw the error
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    }
    
    catch(error){
        console.log("Mongo connection failed: ",error)
        process.exit(1)
    }
}


 export default connectDB