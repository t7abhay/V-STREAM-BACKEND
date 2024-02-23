import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
   {
      username: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
         index: true, // now its indexed in database { database index topic }
      },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },

      fullName: {
         type: String,
         required: true,
         lowercase: true,
         trim: true,
         index: true,
      },

      avatar: {
         type: String, // cloudinary url
         required: true,
      },

      coverimage: {
         type: String,
      },

      watchhistory: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
         },
      ],

      password: {
         type: String,
         required: [true, "Password is required"],
      },
      refreshToken: {
         type: String,
      },
   },
   { timestamps: true }
);

/* 
This middle is a middle ware and the reason why we 
dont use arrow function for  the call back is because we need to reference this middle ware to userSchema.add
the middle ware requrest next to pass it as flag */
userSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password, 10);
   next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password);
};
export const User = mongoose.model("User", userSchema);

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
      {
         _id: this._id,
         email: this.email,
         username: this.username,
         fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn: ACCESS_TOKEN_EXPIRY,
      }
   );
};
userSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
      {
         _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn: REFRESH_TOKEN_EXPIRY,
      }
   );
};
