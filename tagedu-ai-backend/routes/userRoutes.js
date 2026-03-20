const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware'); // Đảm bảo đường dẫn đúng

// Các API dành cho người dùng tự quản lý tài khoản của mình (Bắt buộc phải đăng nhập)
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/password', authenticateToken, userController.changePassword);

module.exports = router;