import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register/principal', authController.registerPrincipal);
router.post('/register/teacher', authController.registerTeacher);
router.post('/register/student', authController.registerStudent);
router.post('/login', authController.login);

export default router;