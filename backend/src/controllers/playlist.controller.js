import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import  ApiError  from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {}
  const userId = req.user._id

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required")
  }

  // Check for duplicate playlist name for same user
  const existing = await Playlist.findOne({
    owner: userId,
    name: name.trim()
  })

  if (existing) {
    throw new ApiError(409, "You already have a playlist with this name")
  }

  const newPlaylist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: userId,
    videos: []
  })

  if (!newPlaylist) {
    throw new ApiError(500, "Failed to create playlist")
  }

  return res.status(201).json(
    new ApiResponse(201, newPlaylist, "Playlist created successfully")
  )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID")
  }

  const playlists = await Playlist.find({ owner: userId })
    .populate("videos", "title thumbnail duration description owner")
    .populate("owner", "username avatar email")
    .sort({ createdAt: -1 })

  // FIX: Return 200 with empty array, not 404
  return res.status(200).json(
    new ApiResponse(
      200, 
      playlists, 
      playlists.length > 0 ? "Playlists retrieved successfully" : "No playlists found"
    )
  )
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("videos", "title thumbnail duration description")
    .populate("owner", "username avatar email")

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  return res.status(200).json(
    new ApiResponse(200, playlist, "Playlist retrieved successfully")
  )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  // Prevent duplicates using toString comparison
  if (playlist.videos.some((vid) => vid.toString() === videoId)) {
    throw new ApiError(400, "Video already exists in playlist")
  }

  playlist.videos.push(videoId)
  await playlist.save()

  return res.status(200).json(
    new ApiResponse(200, playlist, "Video added to playlist successfully")
  )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  const index = playlist.videos.findIndex((vid) => vid.toString() === videoId)

  if (index === -1) {
    throw new ApiError(400, "Video not found in playlist")
  }

  playlist.videos.splice(index, 1)
  await playlist.save()

  return res.status(200).json(
    new ApiResponse(200, playlist, "Video removed from playlist successfully")
  )
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Playlist deleted successfully")
  )
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  if (name?.trim()) playlist.name = name.trim()
  if (description?.trim()) playlist.description = description.trim()

  await playlist.save()

  return res.status(200).json(
    new ApiResponse(200, playlist, "Playlist updated successfully")
  )
})

export{
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}