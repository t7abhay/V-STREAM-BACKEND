import mongoose, { Schema } from "mongoose";

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


// if we searched in documents->channels : then we can find number of subscribers
// if we search in documents -> users : then we can find how many channels a user has subscribed.