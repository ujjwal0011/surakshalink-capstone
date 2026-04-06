import express from 'express';
import { createQuiz, getQuizzes, getQuizById, submitQuiz } from '../controllers/quiz.controller.js';
import auth from '../middlewares/auth.middleware.js'; // Using your existing auth middleware

const router = express.Router();

// Teacher Endpoint
router.post('/create', auth, createQuiz); // POST /api/quiz/create

// Student Endpoints
router.get('/', auth, getQuizzes);        // GET /api/quiz (The Lobby)
router.get('/:id', auth, getQuizById);    // GET /api/quiz/:id (The Game)
router.post('/submit', auth, submitQuiz); // POST /api/quiz/submit (Grading)

export default router;