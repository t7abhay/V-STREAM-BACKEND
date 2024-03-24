import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id ");
    }

    const subcribe = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
    });

    if (subscribe) {
        await Subscription.findByIdAndDelete(subcribe?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { subcribe: false }, "Unsubscribed"));
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { subcribe: true }, "Subscribed"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id ");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channelId: new mongoose.Types.ObjectId(channelId),
            },
        },

        {
            // total subs
            $lookup: {
                from: "users",
                localField: "subscriptions",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    // channel info check if
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        },
                    },

                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedToSubscriber.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },

                            subscribersCount: {
                                $size: "$subscribedToSubscriber",
                            },
                        },
                    },
                ],
            },
        },

        {
            $unwind: " $subscriber",
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "subscribers fetched successfully"
            )
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel id ");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos",
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                latestVideo: {
                    $last: "$videos",
                },
            },
        },
        { $unwind: "$subscribedChannels" },

        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1,
                    },
                },
            },
        },
    ]);

    return res.status(200).json(new ApiResponse(200, subscribedChannels, ""));
});
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
