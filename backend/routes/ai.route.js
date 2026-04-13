import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import { getCredits, getCreditPackages, purchaseCredits } from '../controllers/aiCredits.controller.js';
import {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  deleteConversation,
} from '../controllers/chat.controller.js';

const router = express.Router();

// ─── Credit Endpoints ───
router.get('/credits', auth, getCredits);
router.get('/credits/packages', auth, getCreditPackages);
router.post('/credits/purchase', auth, purchaseCredits);

// ─── Chatbot Endpoints ───
router.get('/chat', auth, getConversations);
router.post('/chat/new', auth, startConversation);
router.get('/chat/:conversationId', auth, getConversation);
router.post('/chat/:conversationId/message', auth, sendMessage);
router.delete('/chat/:conversationId', auth, deleteConversation);

export default router;
