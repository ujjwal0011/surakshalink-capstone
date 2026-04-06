import express from 'express';
import { getStudentsBySchool } from '../controllers/user.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only logged-in users can get the list
router.get('/students', auth, getStudentsBySchool);

export default router;