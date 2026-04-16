const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');
const userRoutes = require('./routes/userRoutes'); // [THÊM MỚI] Import route người dùng

const app = express();

// --- SỬA Ở ĐÂY ---
// Cấu hình Express tin tưởng proxy (cần thiết khi deploy trên Render/Vercel)
app.set('trust proxy', 1); 
// -----------------

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TagEdu Backend Server đang chạy cực mượt!' });
});

app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', progressRoutes);
app.use('/api/users', userRoutes); // [THÊM MỚI] Sử dụng route người dùng

process.on('unhandledRejection', (reason, promise) => {
  console.error("🔥 Lỗi Unhandled Rejection (có thể từ luồng Stream của Gemini):", reason);
});

process.on('uncaughtException', (error) => {
  console.error("🔥 Lỗi Uncaught Exception:", error);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT}`);
});