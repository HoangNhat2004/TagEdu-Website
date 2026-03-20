const db = require('../config/db');

// Tự động nhận diện thư viện mã hóa
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (err) {
  try {
    bcrypt = require('bcrypt');
  } catch (err2) {
    console.error("⚠️ CẢNH BÁO: Chưa cài thư viện mã hóa mật khẩu!");
  }
}

// 1. Cập nhật thông tin cá nhân (Tên hiển thị)
exports.updateProfile = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { full_name } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'Tên hiển thị không được để trống' });
  }

  try {
    await db.promise().query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
    res.json({ message: 'Cập nhật thông tin thành công!', full_name });
  } catch (error) {
    console.error("❌ Lỗi cập nhật Profile:", error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thông tin.' });
  }
};

// 2. Đổi mật khẩu an toàn
exports.changePassword = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }

  if (!bcrypt) {
    return res.status(500).json({ error: 'Lỗi server: Hệ thống thiếu thư viện mã hóa.' });
  }

  try {
    // Đã sửa 'password' thành 'password_hash'
    const [users] = await db.promise().query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const user = users[0];

    // Kiểm tra nếu tài khoản chưa có mật khẩu (Đăng nhập bằng Google)
    if (!user.password_hash) {
      // Vì tài khoản chưa có pass, chúng ta cho phép họ tạo pass mới luôn mà không cần check pass cũ
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
      
      return res.json({ message: 'Đã thiết lập mật khẩu thành công cho tài khoản của bạn!' });
    }

    // Nếu đã có mật khẩu thì kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    }

    // Băm mật khẩu mới và lưu vào DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập sau.' });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
};