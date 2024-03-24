import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { updateUserAvatar } from "./avatarUpdate.controller.js";
import { updateUserCoverImage } from "./coverImageUpdate.controller.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken; 
      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiErrwor(
         500,
         "Something went wrong while generating refresh and access token"
      );
   }
};

const registerUser = asyncHandler(async (req, res) => {
   const { fullName, email, username, password } = req.body;
   // check if some value are empty the
   if (
      [fullName, email, username, password].some((field) => field?.trim() == "")
   ) {
      throw new ApiError(400, "All fields are required");
   }
   // to check if the user with same username and email already exist in the database
   const existedUser = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (existedUser) {
      throw new ApiError(409, "User with username or email already exists");
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   let coverImageLocalPath;
   if (
      req.files?.cover &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
   ) {
      coverImageLocalPath = req.file.coverImage[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar filed is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!avatar) {
      throw new ApiError(400, "Avatar filed is required");
   }

   // We create a user on database
   const user = await User.create({
      fullName,
      avatar: avatar.url, // from cloudinary
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username,
   });

   const createdUser = await User.findById(user._id).select(
      "-password  -refreshToken"
   );
   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user");
   }
   return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully "));
});

const loginUser = asyncHandler(async (req, res) => {
   const { email, username, password } = req.body;

   
   if (!username && !email) {
      throw new ApiError(400, "username or email is required");
   }

   const user = await User.findOne({
      $and: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "User does not exists");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );

   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken,
         })
      );
});

const logOutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1,
         },
      },
      {
         new: true,
      }
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User loggedOut"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =
      // ?from cookies and for mobile browser - body
      req.cookies.refreshToken || req.body.refreshToken;

   if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
   }

   // Verifying incoming incomingtoken from the client
   try {
      const decodedToken = await jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken?._id);

      if (!user) {
         throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or use");
      }

      const options = {
         httpOnly: true,
         secure: true,
      };

      const { accessToken, refreshToken } =
         await generateAccessAndRefreshTokens(user._id);

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               { accessToken, refreshToken: newRefreshToken },
               "Access token refreshed "
            )
         );
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid token");
   }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword, confirmPassword } = req.body;

   // if user can change password , that means user is already logged in, and that logged user can be accessed by auth_middleware - > req.user
   const user = await User.findById(req.user?._id);

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
   }

   if (!(newPassword === confirmPassword)) {
      throw new ApiError(
         400,
         "New password and Confirmation password do not match"
      );
   }
   user.password = newPassword;

   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
   return res.status(200).json(200, req.user, "Current user fetched");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { username, fullName, email } = req.body;

   if (!fullName || !email || !username) {
      throw new ApiError(400, "Fill all required information ");
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email,
            username,
         },
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new ApiResponse(200, "Account details updated successfully "));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
   // we can get the user profile from the channel url
   // the channel url can be found from praramter in req

   const { username } = req.params;

   // defining aggregation pipelines
   const channel = await User.aggregate([
      //stage 1 : match username in all documents ,optionally chained them to lowercase
      {
         $match: {
            username: username?.toLowerCase(),
         },
      },

      //stage 2 : Doing lookup for subscription from subscription model/schema
      {
         // lookup for all user documents
         // to search for users using _id
         // this will find how many (user)documents contain the channel_name to find the total number of subscribers
         // the subscription filed has user reference in schema
         $lookup: {
            from: "subscription",
            localField: "_id",
            foreignField: "channels",
            as: "subscribers",
         },
      },

      // if we searched in documents->channels : then we can find number of subscribers
      // if we search in documents -> users : then we can find how many channels a user has subscribed.

      // Stage 3: this is quite complex but please refer to subscription model
      {
         // Lookup for
         $lookup: {
            from: "subscription",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscriberedTo",
         },
      },
      // Stage 4: Counting the subs and subbed
      // also checking if the user is subbed or not
      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers",
            },
            channelsSubscribedToCount: {
               $size: "$subscriberedTo",
            },

            // if found in Stage1 .i.e from total number of subs
            isSubscribed: {
               $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
               },
            },
         },
      },

      // Stage 5: forwards or projects 📺 values which are explicitly mentioned.
      {
         $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
         },
      },
   ]);

   if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
   }

   /* we get return value of aggregate as arrays */

   if (!username?.trim()) {
      throw new ApiError(400, "username is missing");
   }
   return res
      .status(200)
      .json(
         new ApiError(200, channel[0], "User Channel fetched successfully ")
      );
});



const getWatchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
      // Stage:1 Matching the user documents
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user?._id),
         },
      },

      // Stage 2:  Lookup for video ids as watch history
      {
         $lookup: {
            from: "videos", // from video schema
            localField: "watchHistory", // user schema
            foreignField: "_id", // video id's
            as: "watchhistory",
            pipeline: [
               // Stage 3 : from video modal , match ids with owners from user
               {
                  $lookup: {
                     from: "users", // user modal
                     localField: "owner", // the user owns the video
                     foreignField: "_id", // getting the user id
                     as: "owner",

                     // now we have the user's watch history and the owner of each video that is in watch history

                     // can be done directly but this is the prefered way
                     // then we project avatar and etc info to display on  watch history page.
                     pipeline: [
                        {
                           $project: {
                              fullName: 1,
                              username: 1,
                              avatar: 1,
                           },
                        },

                        // for sake of frontend
                        {
                           $addFields: {
                              owner: {
                                 $first: "$owner",
                              },
                           },
                        },
                     ],
                  },
               },
            ],
         },
      },
   ]);


   const apiResponse  = new ApiResponse(200,user[0].watchHistory, "Watched history fetched successfully")
   return res
      .status(200)
      .json(apiResponse)
});

export {
   registerUser,
   loginUser,
   logOutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserCoverImage,
   updateUserAvatar,
   getUserChannelProfile,
   getWatchHistory,
};
