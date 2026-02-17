import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true
});


//  Attach token to each request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling expired access tokens
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call your refresh token route (backend should return new access token)
        const refreshRes = await API.post("/users/refresh-token"); 
        const newAccessToken = refreshRes.data?.accessToken;

        // Save new token in localStorage
        localStorage.setItem("token", newAccessToken);

        // Update original request headers
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry original request
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and log out user
        localStorage.removeItem("token");
        window.location.href = "/login"; // redirect to login
      }
    }

    return Promise.reject(error);
  }
);


//
//  USER APIs
//
export const getUserProfile = () => API.get('/users/me');  //Done
export const registerUser = (formData) => API.post("/users/register", formData); //Done
export const loginUser = (data) => API.post("/users/login", data); //Done
export const logoutUser = () => API.get("/users/logout"); //Done
export const updateUserInfo = (data) => API.patch("/users/profile", data); //Done
export const changePassword = (data) => API.patch("/users/password", data); //Done
export const updateAvatar = (formData) => API.patch("/users/avatar", formData); //Done
export const updateCoverImage = (formData) => API.patch("/users/cover", formData); //Done
export const getWatchHistory = () => API.get("/users/history"); //Done

//
//  TWEET APIs
//
export const createTweet = (data) => API.post("/tweets", data); //Done
export const getTweets = () => API.get("/tweets"); //Done
export const updateTweet = (tweetId, data) => API.put(`/tweets/${tweetId}`, data); //Done
export const deleteTweet = (tweetId) => API.delete(`/tweets/${tweetId}`); //Done

//
//  VIDEO APIs
//
export const createVideo = (formData) => API.post("/videos/publish", formData); //Done
export const getAllVideos = () => API.get("/videos"); //Done
export const getVideoById = (videoId) => API.get(`/videos/${videoId}`); //Done
export const deleteVideo = (videoId) => API.delete(`/videos/${videoId}`); // Done
export const updateVideo = (videoId,formData) => API.put(`/videos/${videoId}`, formData); //Done
export const togglePublishStatus = (videoId) => API.patch(`/videos/${videoId}/toggle`);//Done
//
//  COMMENT APIs
//
export const addComment = (videoId, data) => API.post(`/comments/${videoId}`, data); //Done
export const updateComment = (commentId, data) => API.patch(`/comments/update/${commentId}`, data); //Done
export const deleteComment = (commentId) => API.delete(`/comments/delete/${commentId}`); //Done
export const getComments = (videoId) => API.get(`/comments/${videoId}`); //Done

//
//  LIKE APIs
//
export const toggleVideoLike = (videoId) => API.patch(`/likes/videos/${videoId}/toggle`); //Commented
export const getLikedVideos = () => API.get("/likes/videos"); //Commented
export const getVideoLikes = (videoId) => API.get(`/likes/videos/${videoId}/count`); //Commented

//
//  DASHBOARD APIs
//
export const getChannelStats = (channelId) => API.get(`/dashboard/stats/${channelId}`);  //Done
export const getChannelVideos = (channelId) => API.get(`/dashboard/videos/${channelId}`); //Done

//
//  SUBSCRIPTION APIs
//
export const toggleSubscription = (channelId) => API.post(`/subscriptions/${channelId}/toggle`); //Done
export const getSubscribers = (channelId) => API.get(`/subscriptions/${channelId}/subscribers`);//Done
export const getSubscribedChannels = (userId) => API.get(`/subscriptions/${userId}/subscriptions`); //Done

//
//  PLAYLIST APIs
//
export const createPlaylist = (data) => API.post("/playlists", data); // Create new playlist
export const getUserPlaylists = (userId) => API.get(`/playlists/user/${userId}`); // Get playlists by user
export const getPlaylistById = (playlistId) => API.get(`/playlists/${playlistId}`); // Get one playlist
export const addVideoToPlaylist = (playlistId, videoId) => API.patch(`/playlists/${playlistId}/add/${videoId}`); // Add video
export const removeVideoFromPlaylist = (playlistId, videoId) => API.patch(`/playlists/${playlistId}/remove/${videoId}`); // Remove video
export const deletePlaylist = (playlistId) => API.delete(`/playlists/${playlistId}`); // Delete
export const updatePlaylist = (playlistId, data) => API.put(`/playlists/${playlistId}`, data); // Update name/description

//
// NOTIFICATION APIs
//
export const getNotifications = () => API.get("/notifications");
export const markNotificationAsRead = (notificationId) => API.patch(`/notifications/${notificationId}`);
export const markAllNotificationsAsRead = () => API.patch("/notifications/mark-all-read");
export const deleteNotification = (notificationId) => API.delete(`/notifications/${notificationId}`);
