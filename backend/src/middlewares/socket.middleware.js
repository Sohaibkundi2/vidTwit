import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
};
