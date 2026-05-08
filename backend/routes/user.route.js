import express from 'express';
import { getStudentsBySchool, getTeachersBySchool, getMe } from '../controllers/user.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only logged-in users can get the list
router.get('/students', auth, getStudentsBySchool);
router.get('/teachers', auth, getTeachersBySchool);
router.get('/me', auth, getMe);

export default router;