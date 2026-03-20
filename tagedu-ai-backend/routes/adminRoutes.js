const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Áp dụng cả 2 lớp bảo vệ: Phải đăng nhập (authenticateToken) VÀ phải là admin (isAdmin)
router.use(authenticateToken, isAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);

// [MỚI] API lấy lịch sử chat của một học viên cụ thể (Dành cho Admin)
router.get('/users/:id/logs', adminController.getUserChatLogs);

router.delete('/users/:id', adminController.deleteUser);

module.exports = router;