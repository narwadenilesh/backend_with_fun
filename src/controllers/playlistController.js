import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";


// ------------------------------------------------------
// 1️⃣ CREATE PLAYLIST
// ------------------------------------------------------
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});


// ------------------------------------------------------
// 2️⃣ GET PLAYLISTS OF A USER
// ------------------------------------------------------
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched"));
});


// ------------------------------------------------------
// 3️⃣ GET PLAYLIST BY ID
// ------------------------------------------------------
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos")
        .populate("owner", "username fullName avatar");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});


// ------------------------------------------------------
// 4️⃣ ADD VIDEO TO PLAYLIST
// ------------------------------------------------------
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Only owner can modify
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist"));
});


// ------------------------------------------------------
// 5️⃣ REMOVE VIDEO FROM PLAYLIST
// ------------------------------------------------------
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Only owner can modify
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }

    playlist.videos = playlist.videos.filter(
        (v) => v.toString() !== videoId.toString()
    );

    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed successfully"));
});


// ------------------------------------------------------
// 6️⃣ DELETE PLAYLIST (only by owner)
// ------------------------------------------------------
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to delete this playlist");
    }

    await Playlist.deleteOne({ _id: playlistId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});


// ------------------------------------------------------
// 7️⃣ UPDATE PLAYLIST
// ------------------------------------------------------
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field is required to update");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to update this playlist");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
