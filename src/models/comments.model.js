import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
   {
      content: {
         type: String,
         required: true,
      },
      video: {
         type: Schema.Types.ObjectId,
         ref: "Video",
      },
      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },
   },
   { timestamps: true }
);
commentSchema.plugin(mongooseAggregatePaginate)

export const comment = mongoose.model("Comment", commentSchema);
