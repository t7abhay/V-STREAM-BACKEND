import { type } from "express/lib/response";
import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
   {
      content: {
         type: String,
         required: true,
      },
      owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
      }
   },
   { timestamps: true }
);

export const tweet = mongoose.model("Tweet", tweetSchema);
