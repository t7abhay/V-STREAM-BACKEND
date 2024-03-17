import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import {
    uploadOnCloudinary,
    deleteOnCloudinary,
} from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";
import { request, response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
    // this fucntion gets videos based on parameters or options selected by the user
    // and these options available for query property

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // search index
    // 'll titiles
    const pipelines = [];

    // based on index
    if (query) {
        pipelines.push({
            $search: {
                query: "search-index",
                path: ["tittle", "description"],
            },
        });
    }

    // if user tries to seach video based on uploaded by a user example : pewdiepi

    //based on userid
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid username");
        }

        pipelines.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        });
    }
    //also we need check if we are only trying to fetch videos that are set to be public
    pipelines.push({ $match: { isPublished: true } });

    // based on sortBy(view,publishedDate(aka : createdAt),duration(can be found by cloudniary )) and sortType(ascending and descending)
    // then push another pipeline

    if (sortBy && sortType) {
        pipelines.push({
            $sort: {
                [sortBy]: sortType === "ascending" ? 1 : -1,
                // ! comeback later to check
                // it is like example : sortby upload date:
                /* 
               and then sorttype is applied, as they are not seperate independent fields
               they can be used together to evalvulate 
            
            */
            },
        });
    } else {
        pipelines.push({
            $sort: {
                createdAt: -1,
            },
        });
    }

    pipelines.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id", // user
                as: "ownerDetails",

                pipelines: [
                    {
                        $poject: {
                            username: 1,
                            "avatar.url": 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$ownerDetails",
        }
    );

    const videoAggregate = await Video.aggregate(pipelines);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { tittle, description } = req.body;

    if ([tittle, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
    }

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath);

    if (!videoFile.url) {
        throw new ApiError(400, "Error while uploading video");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail");
    }

    /*  So now we have  the video on the cloudinary
       but we need to update and reference the that video url , thumbnail into the database
    */
    const upload = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id,
        },

        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id,
        },

        owner: req.user?._id,
        isPublished: flase, // this is job of frontend engineer to make a buttion to toggle this property to false or true , false = private and true = public
    });

    // The second verification to check if  the video has been uploaded on the database

    const isVideoUploaded = await Video.findById(video._id);

    if (!isVideoUploaded) {
        throw new ApiError(500, "Error while uploading video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const video = await Video.create([
        // stage 1 we match the video
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },

        // stage 2 to total number of likes of video
        {
            // likes
            $lookup: {
                form: "likes", // like modal
                localField: "_id", // the video id
                foreignField: "video",
                as: "likes",
            },
        },

        // stage 3 the channel and its owner realated information
        {
            $lookup: {
                from: "users",
                localField: "owner", // video model , the owner

                foreignField: "_id", // user id from user model
                as: "owner",

                pipeline: [
                    {
                        $lookup: {
                            form: "subscriptions",
                            localField: "_id",
                            foreginField: "channel",
                            as: "subscribers",
                        },
                    },

                    {
                        $addFields: {
                            subscriberCount: {
                                $size: "$subscribers",
                            },

                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber ",
                                        ],
                                    },

                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },

                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,

                            subscriberCount: 1,
                            isSubscribed: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                owner: {
                    $first: "$owner", // does that owner exist?
                },

                isLiked: {
                    $cond: {
                        if: { $in: [req.user?.id, "$likes.likedBy"] },

                        then: true,
                        else: false,
                    },
                },
            },
        },

        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
            },
        },
    ]);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }
    // it will appened the video inside wathcHistory which itself is an array, if the video is already presnt in the wathcHistory it wont be appending the video.

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video successfully fetced"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // get title,description,ispublic,thumbnail
    // delete old thumbnail

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "Access denied , only owner of this video is allowed to modify the video"
        );
    }

    thumbnailLocalPath = req.files.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail");
    }

    const publicIdOfThumbnailToDelete = video.thumbnail.public_id;

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url,
                },
            },
        },
        { new: true }
    );

    if (!updateVideo) {
        throw new ApiError(500, "Failed to update video details");
    }

    if (updateVideo) {
        await deleteOnCloudinary(publicIdOfThumbnailToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video details updated successfully"
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    // we need video id to delete a video.
    // ! also need to find that video in db
    // also need to unset all the stuff from db and cloudinary
    // check for the video id validatio
    // check for user ownership for deleting the video

    // ! delete video and thumbnail from db and cloudinary

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?.user.toString()) {
        throw new ApiError(
            403,
            "Access denied , only owner of this video is allowed to modify the video"
        );
    }

    const videoDelete = await Video.findByIdAndDelete(video?._id);

    if (!videoDelete) {
        throw new ApiError(500, "Error while deleting video");
    }

    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id, "video");

    await Likes.deleteMany({ video: video_id });
    await Comments.deleteMany({ video: video_id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // check for the owner validation
    // check for the video id
    // set the isPlublish property to true or false

    if (!isValidObjectId(videoId)) {
        throw new ApiError(`Invalid video id: ${videoId}`);
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user.toString()) {
        throw new ApiError(
            403,
            "Access denied , only owner of this video is allowed to modify the video"
        );
    }

    const videoStatusToggle = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: {
                    $cond: {
                        if: {
                            $eq: [video.isPublished, true],
                        },
                        then: false,
                        else: true,
                    },
                },
            },
        },
        { new: true }
    );

    if (!videoStatusToggle) {
        throw new ApiError(500, "Failed change the status of the video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: togglePublishStatus.isPublished },
                "Changed view status successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    togglePublishStatus,
};
