const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit'); // [MỚI] Import thư viện

// [MỚI] Thiết lập khiên chống Spam OTP tích hợp song ngữ
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3, // Tối đa 3 lần request từ 1 IP
  handler: (req, res) => {
    const lang = req.body.language || 'vi';
    res.status(429).json({ 
      error: lang === 'en' 
        ? 'You have requested OTPs too many times. Please try again after 15 minutes.' 
        : 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.' 
    });
  }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

// [ĐÃ SỬA] Gắn khiên otpLimiter vào API forgot-password
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;