import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
 

const updateUserCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path;

   if (!updateUserCoverImage) {
      throw new ApiError(400, "CoverImage file is missing");
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading avatar");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverimage: coverImage.url,
         },
      },
      { new: true }.select("-password")
   );


   return res
   .status(200)
   .json(new ApiResponse(200,user,"Cover Image updated"))
});

export { updateUserCoverImage };
