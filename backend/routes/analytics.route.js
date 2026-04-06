import express from 'express';
import { getClassAnalytics, getSchoolAnalytics } from '../controllers/analytics.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Teacher: View their own class stats
router.get('/teacher/:quizId', auth, getClassAnalytics);

// Principal: View school-wide comparison
router.get('/principal/:quizId', auth, getSchoolAnalytics);

export default router;