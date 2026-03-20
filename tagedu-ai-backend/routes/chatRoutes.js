const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middlewares/authMiddleware');

// Gắn anh bảo vệ authenticateToken vào các route cần bảo mật
router.get('/chat-history', authenticateToken, chatController.getChatHistory);
router.delete('/chat-session', authenticateToken, chatController.deleteChatSession);
router.post('/chat', authenticateToken, chatController.handleChat);

module.exports = router;