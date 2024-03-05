import mongoose, { Schema } from "mongoose";
import { diskStorage } from "multer";

const subscriptionSchema = new Schema(
   {
      subscriber: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      channel: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);


// if we searched in userdocuments->channels : then we can find number of subscribers
// if we search in userdocuments -> users : then we can find how many channels a user has subscribed.
