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
  const { full_name, language } = req.body;
  const lang = language || 'vi';

  if (!full_name) {
    return res.status(400).json({ error: lang === 'en' ? 'Display name cannot be empty' : 'Tên hiển thị không được để trống' });
  }

  try {
    await db.promise().query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
    res.json({ message: lang === 'en' ? 'Profile updated successfully!' : 'Cập nhật thông tin thành công!', full_name });
  } catch (error) {
    console.error("❌ Lỗi cập nhật Profile:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while updating profile.' : 'Lỗi máy chủ khi cập nhật thông tin.' });
  }
};

// 2. Đổi mật khẩu an toàn
exports.changePassword = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { currentPassword, newPassword, language } = req.body;
  const lang = language || 'vi';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: lang === 'en' ? 'Please enter both current and new password.' : 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: lang === 'en' ? 'New password must differ from current password.' : 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }

  if (!bcrypt) {
    return res.status(500).json({ error: lang === 'en' ? 'Server error: Missing encryption library.' : 'Lỗi server: Hệ thống thiếu thư viện mã hóa.' });
  }

  try {
    const [users] = await db.promise().query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: lang === 'en' ? 'User not found.' : 'Không tìm thấy người dùng.' });
    }

    const user = users[0];

    // Kiểm tra nếu tài khoản chưa có mật khẩu (Đăng nhập bằng Google)
    if (!user.password_hash) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
      
      return res.json({ message: lang === 'en' ? 'Password set successfully for your account!' : 'Đã thiết lập mật khẩu thành công cho tài khoản của bạn!' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: lang === 'en' ? 'Current password is incorrect.' : 'Mật khẩu hiện tại không đúng.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: lang === 'en' ? 'Password changed successfully! Please use your new password next time.' : 'Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập sau.' });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while changing password.' : 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
};