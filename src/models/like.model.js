import req from "express/lib/request";
import { type } from "express/lib/response";
import mongoose, { Schema } from "mongoose";

const likeScheme = new Schema(
   {

      comments: {
         type: Schema.Types.ObjectId,
         ref: "Comment",
      },

      video: {
         type: Schema.Types.ObjectId,

         ref: "Video",
      },

      likedBy: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },

      tweet: {
         type: Schema.Types.ObjectId,
         ref: "Tweet",
      },
   },
   { timestamps: true }
);

export const likes = mongoose.model("Like", likeScheme);
