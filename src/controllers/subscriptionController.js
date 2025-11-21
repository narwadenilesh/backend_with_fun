import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

// -------------------------------------------------------------
// TOGGLE SUBSCRIPTION  (Subscribe / Unsubscribe)
// -------------------------------------------------------------
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscriberId = req.user?._id;

    if (!subscriberId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId,
    });

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        );
    }

    // Subscribe
    await Subscription.create({
        channel: channelId,
        subscriber: subscriberId,
    });

    return res.status(200).json(
        new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
    );
});

// -------------------------------------------------------------
// GET SUBSCRIBERS OF A CHANNEL
// -------------------------------------------------------------
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username fullName avatar")
        .select("-__v");

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// -------------------------------------------------------------
// GET CHANNELS USER HAS SUBSCRIBED TO
// -------------------------------------------------------------
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username fullName avatar")
        .select("-__v");

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
