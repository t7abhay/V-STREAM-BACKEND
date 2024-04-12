 import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
   {
      name: {
         type: String,
         required: true,
      },

      description: {
         type: String,
         required: false,
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

export const Playlist = mongoose.model("Playlist", playlistSchema);
