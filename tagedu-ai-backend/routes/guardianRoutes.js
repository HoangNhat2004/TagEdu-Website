const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const authenticateToken = require('../middlewares/authMiddleware');

// Tất cả các route này yêu cầu đăng nhập
router.post('/children', authenticateToken, guardianController.addChild);
router.get('/children', authenticateToken, guardianController.getChildren);
router.delete('/children/:childId', authenticateToken, guardianController.removeChild);

// COPPA/GDPR-K: Quyền riêng tư dữ liệu
router.get('/children/:childId/export', authenticateToken, guardianController.exportChildData);
router.delete('/children/:childId/data', authenticateToken, guardianController.deleteChildData);

module.exports = router;
