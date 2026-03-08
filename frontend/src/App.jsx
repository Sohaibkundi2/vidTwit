
import './App.css'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './compunents/Navbar'
import Footer from './compunents/Footer';
import VideoPlayerPage from './pages/videoPlayer'
import VideoDetails from './pages/VideoDetails'
import TweetPage from './pages/TweetPage';
import ProfilePage from './pages/ProfilePage';
import UploadVideo from './pages/UploadVideo';
import UpdateVideo from './pages/UpdateVideo'
import DeleteVideo from './pages/DeleteVideo'
import UploadTweet from './pages/UploadTweet'
import UpdateTweet from './pages/UpdateTweet'
import DeleteTweet from './pages/DeleteTweet'
import UpdateProfile from './pages/UpdateProfile'
import ProtectedRoute from './compunents/ProtectedRoute'
import PlaylistsPage from './pages/PlaylistsPage'
import PlaylistDetailPage from './pages/PlaylistDetailPage'
import CreatePlaylistPage from './pages/CreatePlaylistPage'
import EditPlaylistPage from './pages/EditPlaylistPage'
import WatchLaterPage from './pages/WatchLaterPage'
import NotFound from './pages/NotFound'

function App() {
  const location = useLocation()
  const isNotFoundRoute = ![
    '/',
    '/login',
    '/register',
    '/videos',
    '/tweets',
    '/playlists',
  ].includes(location.pathname) &&
    !location.pathname.startsWith('/watch/') &&
    !location.pathname.startsWith('/tweet/') &&
    !location.pathname.startsWith('/playlist/') &&
    !location.pathname.startsWith('/profile') &&
    !location.pathname.startsWith('/upload-video') &&
    !location.pathname.startsWith('/update-video/') &&
    !location.pathname.startsWith('/delete-video/') &&
    !location.pathname.startsWith('/upload-tweet') &&
    !location.pathname.startsWith('/update-tweet/') &&
    !location.pathname.startsWith('/delete-tweet/') &&
    !location.pathname.startsWith('/update-profile') &&
    !location.pathname.startsWith('/create-playlist') &&
    !location.pathname.endsWith('/edit')

  return (
    <div className={isNotFoundRoute ? 'min-h-screen bg-gray-900' : 'min-h-screen bg-gray-900'}>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/videos" element={<VideoDetails />} />
        <Route path="/watch/:videoId" element={<VideoPlayerPage />} />
        <Route path="/tweet/:tweetId" element={<TweetPage />} />
        <Route path="/tweets" element={<TweetPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/watch-later" element={<ProtectedRoute />}>
          <Route index element={<WatchLaterPage />} />
        </Route>
        <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />

        {/* Secure routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/upload-video" element={<UploadVideo />} />
          <Route path="/update-video/:videoId" element={<UpdateVideo />} />
          <Route path="/delete-video/:videoId" element={<DeleteVideo />} />
          <Route path="/upload-tweet" element={<UploadTweet />} />
          <Route path="/update-tweet/:tweetId" element={<UpdateTweet />} />
          <Route path="/delete-tweet/:tweetId" element={<DeleteTweet />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/create-playlist" element={<CreatePlaylistPage />} />
          <Route path="/playlist/:playlistId/edit" element={<EditPlaylistPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isNotFoundRoute && <Footer />}
    </div>
  )
}

export default App
