import User from '../models/user.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import { resetDailyCredits, deductCredit } from './aiCredits.controller.js';
import { generateChatResponse } from '../services/ai.service.js';

// ─── 1. GET /ai/chat — List all conversations ───
export const getConversations = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Chatbot is for students only.' });
    }

    const conversations = await ChatConversation.find({ studentId: req.user.id })
      .select('title lastMessageAt createdAt messages')
      .sort({ lastMessageAt: -1 });

    // Return with message count and preview
    const list = conversations.map(c => ({
      _id: c._id,
      title: c.title,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
      messageCount: c.messages.length,
      preview: c.messages.length > 0
        ? c.messages[c.messages.length - 1].content.substring(0, 80) + '...'
        : '',
    }));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. GET /ai/chat/:conversationId — Full conversation ───
export const getConversation = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Chatbot is for students only.' });
    }

    const conversation = await ChatConversation.findOne({
      _id: req.params.conversationId,
      studentId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. POST /ai/chat/new — Start new conversation ───
export const startConversation = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Chatbot is for students only.' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    // Credit check
    const user = await User.findById(req.user.id);
    resetDailyCredits(user);

    if (!deductCredit(user, 'chatbot')) {
      await user.save();
      return res.status(403).json({
        error: 'No AI credits remaining! Purchase more from the Credit Center.',
        creditsNeeded: true,
      });
    }
    await user.save();

    // Generate AI response
    const conversationHistory = [];
    let aiResponse;
    try {
      aiResponse = await generateChatResponse(message, conversationHistory);
    } catch (aiErr) {
      // Refund credit on AI failure
      user.aiCredits.chatbot += 1;
      await user.save();
      return res.status(500).json({ error: 'AI service temporarily unavailable. Credit refunded.' });
    }

    // Auto-generate title from first message
    const title = message.trim().substring(0, 50) + (message.length > 50 ? '...' : '');

    // Save conversation
    const conversation = new ChatConversation({
      studentId: req.user.id,
      title,
      messages: [
        { role: 'user', content: message.trim() },
        { role: 'assistant', content: aiResponse },
      ],
      lastMessageAt: new Date(),
    });
    await conversation.save();

    res.status(201).json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        messages: conversation.messages,
        lastMessageAt: conversation.lastMessageAt,
      },
      credits: {
        summary: user.aiCredits.summary,
        chatbot: user.aiCredits.chatbot,
        purchased: user.aiCredits.purchased,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 4. POST /ai/chat/:conversationId/message — Send message ───
export const sendMessage = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Chatbot is for students only.' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const conversation = await ChatConversation.findOne({
      _id: req.params.conversationId,
      studentId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Credit check
    const user = await User.findById(req.user.id);
    resetDailyCredits(user);

    if (!deductCredit(user, 'chatbot')) {
      await user.save();
      return res.status(403).json({
        error: 'No AI credits remaining! Purchase more from the Credit Center.',
        creditsNeeded: true,
      });
    }
    await user.save();

    // Build conversation history (last 10 messages for context)
    const recentMessages = conversation.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Generate AI response
    let aiResponse;
    try {
      aiResponse = await generateChatResponse(message, recentMessages);
    } catch (aiErr) {
      // Refund credit on AI failure
      user.aiCredits.chatbot += 1;
      await user.save();
      return res.status(500).json({ error: 'AI service temporarily unavailable. Credit refunded.' });
    }

    // Save messages
    conversation.messages.push(
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: aiResponse }
    );
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      messages: [
        { role: 'user', content: message.trim(), timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() },
      ],
      credits: {
        summary: user.aiCredits.summary,
        chatbot: user.aiCredits.chatbot,
        purchased: user.aiCredits.purchased,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 5. DELETE /ai/chat/:conversationId — Delete conversation ───
export const deleteConversation = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Chatbot is for students only.' });
    }

    const result = await ChatConversation.findOneAndDelete({
      _id: req.params.conversationId,
      studentId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
