import { isValidObjectId } from "mongoose";
import { Comment } from "../middlewares/models/comment.model.js";
import { Video } from "../middlewares/models/video.model.js";
import { Like } from "../middlewares/models/like.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

const createComment = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content in comment required");
    }

    const comment = await Comment.create({
        content,
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to create a comment, !Please retry");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
        throw new ApiError(400, "Content required");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.FindById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (Comment.commentId.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Not Authorised ");
    }

    const newComment = await Comment.FindByIdAndUpdate(
        {
            $set: {
                content,
                owner: req.user?._id,
            },
        },
        { new: true }
    );

    if (!newComment) {
        throw new ApiError(500, "Error while updating comment, !Please retry");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newComment, "Comment updated successfully"));
});
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.FindById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    const deletedComment = await Comment.FindByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Error while deleting ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
});

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invaid video id ");
    }

    const video = await Video.FindById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const commentsAggregate = await Comment.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(videoId),
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes",
                },
                owner: {
                    $first: "$owner",
                },

                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },

        {
            $sort: { createdAt: -1 },
        },
        {
            $project: {
                likeCount: 1,
                isLiked: 1,
                content: 1,
                likeCount: 1,

                owner: {
                    "avatar.url": 1,
                    username: 1,
                    fullName: 1,
                },
            },
        },
    ]);

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});
export { createComment, updateComment, deleteComment, getVideoComments };
