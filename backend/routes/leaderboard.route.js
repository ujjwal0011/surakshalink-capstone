import express from 'express';
import { getStudentLeaderboard, getTeacherLeaderboard, getPrincipalLeaderboard } from '../controllers/leaderboard.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Student: Class + School ranking
router.get('/student', auth, getStudentLeaderboard);

// Teacher: Class-level student ranking
router.get('/teacher', auth, getTeacherLeaderboard);

// Principal: School-wide + Class vs Class
router.get('/principal', auth, getPrincipalLeaderboard);

export default router;
