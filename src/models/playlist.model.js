 import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
   {
      name: {
         type: String,
         required: true,
      },

      description: {
         type: String,
         required: flase,
      },
      video: [
         {
            type: Schema.Types.ObjectId,
            ref: "Video",
         },
      ],

      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },
      
      isPublished: {
         type: Boolean,
         default: true
     },
   },
   { timestamps: true }
);

export const playlist = mongoose.model("Playlist", playlistSchema);
