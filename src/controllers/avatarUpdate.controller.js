import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { deleteOnCloudinary } from "../utilities/cloudinary.js";

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.secure_url) {
        throw new ApiError(400, "Error while uploading avatar");
    }


    const user = await User.findById(req.user._id).select("avatar");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const avatarToDelete = user.avatar?.public_id;

    const updateAvatar = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: {
                    public_id: avatar.public_id,
                    url: avatar.secure_url,
                },
            },
        },

        { new: true, runValidators: true }
    ).select("-password");

    if (avatarToDelete && updateAvatar.avatar.public_id !== avatarToDelete) {
        await deleteOnCloudinary(avatarToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateAvatar, "Avatar updated successfully")
        );
});

export { updateUserAvatar };
