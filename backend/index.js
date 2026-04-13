import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import socketHandler from './socket/socketHandler.js';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import quizRoutes from './routes/quiz.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import guideRoutes from './routes/guide.route.js';
import shopRoutes from './routes/shop.route.js';
import aiRoutes from './routes/ai.route.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('DB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/ai', aiRoutes);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React Frontend URL (Vite default)
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Logic
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));