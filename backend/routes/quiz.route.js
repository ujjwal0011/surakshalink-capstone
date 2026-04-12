import express from 'express';
import { createQuiz, deleteQuiz, getQuizzes, getQuizById, submitQuiz, getQuizResult, generateAISummary, getMyResults } from '../controllers/quiz.controller.js';
import auth from '../middlewares/auth.middleware.js'; // Using your existing auth middleware

const router = express.Router();

// Teacher Endpoint
router.post('/create', auth, createQuiz); // POST /api/quiz/create
router.delete('/:id', auth, deleteQuiz); // DELETE /api/quiz/:id

// Student Endpoints
router.get('/', auth, getQuizzes);                 // GET /api/quiz (The Lobby)
router.get('/my-results', auth, getMyResults);     // GET /api/quiz/my-results (Batch results for lobby)
router.get('/:id', auth, getQuizById);             // GET /api/quiz/:id (The Game)
router.get('/:id/result', auth, getQuizResult);    // GET /api/quiz/:id/result (Previous attempt)
router.post('/submit', auth, submitQuiz);          // POST /api/quiz/submit (Grading)
router.post('/:id/ai-summary', auth, generateAISummary); // POST /api/quiz/:id/ai-summary (AI Summary)

export default router;