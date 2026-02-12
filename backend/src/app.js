import express from 'express'
import dotenv from 'dotenv'
import mongoDB from './db/index.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from 'http';
import { Server } from 'socket.io';
// import { socketAuth } from './middlewares/socket.middleware.js'; // Will import after defining

const app = express()
dotenv.config()

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://my-tube-git-main-sohaibs-projects-442454ff.vercel.app',
      'https://my-tube-red.vercel.app'
    ],
    credentials: true
  }
});

// Middleware to attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://my-tube-git-main-sohaibs-projects-442454ff.vercel.app',
    'https://my-tube-red.vercel.app'
  ],
  credentials: true
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use("/Public", express.static(path.join(__dirname, "../Public")))
app.use(cookieParser())

// Import socket auth middleware dynamically or statically if file exists
// Since I created it, I can import it.
// But I need to make sure I import it at top or here.
// I'll do dynamic import or standard import at top.

const PORT = process.env.PORT || 5000;

mongoDB()
.then(()=>{
    httpServer.listen(PORT, ()=>{
    console.log(`server is listning on port ${PORT}`)
})
})
.catch((err)=>{
    console.log('err while connecting to DB', err)
})


// routes
import userRoute from './routes/user.route.js'
import tweetRoute from './routes/tweet.route.js'
import videoRoute from './routes/video.route.js'
import commentRoute from './routes/comment.route.js'
import likeRoute from './routes/like.route.js'
import dashboardRoute from './routes/dashboard.route.js'
import subscriptionRoute from './routes/subscription.route.js'
import playlistRoute from "./routes/playlist.route.js"
import notificationRoute from './routes/notification.route.js'
import errorHandler from './middlewares/errorHandler.js'

app.use('/api/v1/users', userRoute)
app.use('/api/v1/tweets', tweetRoute)
app.use('/api/v1/videos', videoRoute)
app.use('/api/v1/comments', commentRoute)
app.use('/api/v1/likes', likeRoute)
app.use('/api/v1/dashboard', dashboardRoute)
app.use('/api/v1/subscriptions', subscriptionRoute)
app.use("/api/v1/playlists", playlistRoute)
app.use('/api/v1/notifications', notificationRoute)


app.use(errorHandler);

// Socket.io logic
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';

// Simple socket auth middleware defined inline to avoid import issues if any
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.user?.username);

  if (socket.user?._id) {
    socket.join(socket.user._id.toString());
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user?.username);
  });
});

export {app}
