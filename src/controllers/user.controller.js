import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
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
      throw new ApiError(
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
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "User does not exists");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if (!isPasswordValid) {
      throw new ApiError(404, "Invalid user credentials");
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
      .cookieCookie("refreshToken", options)
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
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid token");
   }

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

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
         new ApiResponse(
            200,
            { accessToken, newRefreshToken },
            "Access token refreshed "
         )
      );
});

const changeCurrentUser = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword, confirmPassword } = req.body;

   // if user can change password , that means user is already logged in, and that logged user can be accessed by auth_middleware - > req.user
   const user = await User.findById(req.user?._id);

   const passwordCorrect = await user.isPasswordCorrect(oldPassword);
   if (!passwordCorrect) {
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
      req.body?._id,
      {
         $set: {
            fullName,
            email,
            username,
         },
      },
      { new: true }
   ).select("-password")

   return res
   .status(200)
   .json(ApiResponse(200,"Account details updated successfully "))
});






























export {
   registerUser,
   loginUser,
   logOutUser,
   refreshAccessToken,
   changeCurrentUser,
   getCurrentUser,
   updateAccountDetails
};
