import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
 

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
   }

 const user =  await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url,
         },
      },
      { new: true }.select("-password")
   );

   return res
   .status(200)
   .json(new ApiResponse(200,user,"Avatar updated"))
});

export { updateUserAvatar };
