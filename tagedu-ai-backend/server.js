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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);

  // --- SELF-PING: Giữ Render free tier luôn hoạt động ---
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (RENDER_URL) {
    const INTERVAL = 14 * 60 * 1000; // 14 phút (trước ngưỡng 15 phút spin-down)
    setInterval(async () => {
      try {
        const res = await fetch(RENDER_URL);
        console.log(`🏓 Self-ping: ${res.status} - ${new Date().toLocaleString('vi-VN')}`);
      } catch (err) {
        console.error('❌ Self-ping thất bại:', err.message);
      }
    }, INTERVAL);
    console.log(`🏓 Self-ping đã bật, ping mỗi 14 phút tới: ${RENDER_URL}`);
  }
});