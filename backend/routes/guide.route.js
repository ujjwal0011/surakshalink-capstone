import express from 'express';
import {
  createGuide,
  getGuides,
  getGuideById,
  updateGuide,
  deleteGuide,
  getCategories
} from '../controllers/guide.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Teacher Endpoints
router.post('/create', auth, createGuide);       // POST /api/guides/create
router.put('/:id', auth, updateGuide);            // PUT  /api/guides/:id
router.delete('/:id', auth, deleteGuide);         // DELETE /api/guides/:id

// Shared Endpoints (Teacher, Student, Principal)
router.get('/', auth, getGuides);                 // GET  /api/guides
router.get('/categories', auth, getCategories);   // GET  /api/guides/categories
router.get('/:id', auth, getGuideById);           // GET  /api/guides/:id

export default router;
