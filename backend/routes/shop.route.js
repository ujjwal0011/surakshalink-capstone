import express from 'express';
import { getShopItems, buyItem, getMyBag } from '../controllers/shop.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/items', auth, getShopItems);
router.post('/buy/:itemId', auth, buyItem);
router.get('/my-bag', auth, getMyBag);

export default router;
