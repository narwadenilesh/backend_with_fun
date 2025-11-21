import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";

// --------------------------------------------------
// GET ALL VIDEOS WITH PAGINATION + SORT + SEARCH
// --------------------------------------------------
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {};

    // search by title
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }

    // filter by userId
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("owner", "username fullName avatar");

    const total = await Video.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, { videos, total }, "Videos fetched successfully")
    );
});

// --------------------------------------------------
// UPLOAD VIDEO + CREATE VIDEO DOCUMENT
// --------------------------------------------------
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!req.files?.video || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    // Upload video
    const videoUpload = await uploadOnCloudinary(req.files.video[0].path);
    if (!videoUpload) {
        throw new ApiError(500, "Video upload failed");
    }

    // Upload thumbnail
    const thumbnailUpload = await uploadOncloudinary(req.files.thumbnail[0].path);
    if (!thumbnailUpload) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    const newVideo = await Video.create({
        title,
        description,
        videoUrl: videoUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video published successfully")
    );
});

// --------------------------------------------------
// GET SINGLE VIDEO BY ID
// --------------------------------------------------
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

// --------------------------------------------------
// UPDATE VIDEO DETAILS (title, description, thumbnail)
// --------------------------------------------------
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

    // update fields
    if (title) video.title = title;
    if (description) video.description = description;

    // update thumbnail if provided
    if (req.files?.thumbnail) {
        const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
        video.thumbnailUrl = thumbnailUpload.url;
    }

    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
});

// --------------------------------------------------
// DELETE VIDEO
// --------------------------------------------------
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

// --------------------------------------------------
// TOGGLE PUBLISH STATUS (public <-> private)
// --------------------------------------------------
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Publish status toggled successfully")
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
