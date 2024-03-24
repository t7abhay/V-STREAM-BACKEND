import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { ApiError } from "../utilities/ApiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

const toogleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    // user sam and he has liked pokemon video

    // it goes inside out like collection , it  tries to find a document , in which there is a user  with userid : uwdfosaso, videoid:D

    if (isLiked) {
        await Like.findByIdAndDelete(isLiked?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, ""));
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }, ""));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(403, "Invalid comment id");
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (!isLiked) {
        await Like.findByIdAndDelete(isLiked?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }), "");
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(403, "Invalid tweet id");
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (!isLiked) {
        await Like.findByIdAndDelete(isLiked?._id);

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const aggregatelikedVideo = await Like.aggregate([
        {
            // got all documents where likedBy = userId
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },

        // took all video id's from  all matched docs
        // mashed everything into pipeline where:
        //found all owners of those videos by their video id
        // used unwind to deconstruct everything that we got from the previous stage and reconstruct the result for each element or in this case video
        // then projected everything that is needed to show all liked videos
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",

                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },

                    {
                        $unwind: {
                            path: "$ownerDetails",
                        },
                    },
                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },

                    {
                        $project: {
                            _id: 1,

                            "videoFile.url": 1,
                            "thumbnail.url": 1,
                            owner: 1,
                            title: 1,
                            description: 1,
                            view: 1,
                            duration: 1,
                            comments: 1,
                            createdAt: 1,
                            isPublished: 1,
                            ownerDeatails: {
                                username: 1,
                                "avatar.url": 1,
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .statu(200)
        .json(
            new ApiResponse(200, aggregatelikedVideo, " liked videos fetched successfully")
        );
});

export { toogleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
