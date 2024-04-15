import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { deleteOnCloudinary } from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findById(req.user._id).select("coverImage");
    const coverImageToDelete = user.coverImage?.public_id;

    const updateCoverImage = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: {
                    public_id: coverImage.public_id,
                    url: coverImage.url,
                },
            },
        },
        { new: true }
    ).select("-password");

    if (
        coverImageToDelete &&
        updateCoverImage.coverImage.public_id !== coverImageToDelete
    ) {
        await deleteOnCloudinary(coverImageToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateCoverImage, "Cover Image updated"));
});

export { updateUserCoverImage };
