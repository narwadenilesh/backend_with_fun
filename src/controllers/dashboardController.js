import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asynchandler.js"



// ------------------------------------------------------
// 1️⃣ CHANNEL STATS
// ------------------------------------------------------
const getChannelStats = asyncHandler(async (req, res) => {

    const channelId = req.user._id;

    // 1. Total Videos
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // 2. Total Subscribers (people subscribed to THIS channel)
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    // 3. Total Likes on ALL Videos of this channel
    const totalLikes = await Like.countDocuments({
        video: { 
            $in: await Video.distinct("_id", { owner: channelId }) 
        }
    });

    // 4. Total Views (sum of all views of this channel's videos)
    const videoViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const totalViews = videoViews[0]?.totalViews || 0;

    // Response
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalLikes,
                totalViews
            },
            "Channel stats fetched successfully"
        )
    );
});



// ------------------------------------------------------
// 2️⃣ GET ALL VIDEOS OF THE CHANNEL
// ------------------------------------------------------
const getChannelVideos = asyncHandler(async (req, res) => {

    const channelId = req.user._id;

    const videos = await Video.find({ owner: channelId })
                              .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});



export {
    getChannelStats,
    getChannelVideos
}
