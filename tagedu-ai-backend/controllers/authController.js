const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- SỬA Ở ĐÂY ---
// Chuyển sang dùng cổng 587 với STARTTLS để vượt tường lửa Render
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false cho port 587, true cho 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
// -----------------

exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin!' });

  try {
    const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ error: 'Email này đã được sử dụng!' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );

    // [ĐÃ SỬA] Trả về object user có chứa role thay vì chỉ trả về userId
    res.status(201).json({ message: 'Đăng ký tài khoản thành công!', user: { id: result.insertId, fullName: fullName, email: email, role: 'user' } });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu!' });

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác!' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác!' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // [ĐÃ SỬA] Trả về thêm trường role khi đăng nhập thành công
    res.json({ message: 'Đăng nhập thành công!', token, user: { id: user.id, fullName: user.full_name, email: user.email, profileBio: user.profile_bio, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập.' });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Thiếu mã xác thực từ Google!' });

  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const [result] = await db.promise().query(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );
      // [ĐÃ SỬA] Thêm role mặc định là 'user' khi tạo mới
      user = { id: result.insertId, full_name: name, email: email, profile_bio: null, role: 'user' }; 
    } else {
      user = users[0];
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    // [ĐÃ SỬA] Trả về thêm trường role khi đăng nhập bằng Google
    res.json({ message: 'Đăng nhập Google thành công!', token, user: { id: user.id, fullName: user.full_name, email: user.email, profileBio: user.profile_bio, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Xác thực Google thất bại.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Vui lòng nhập email!' });

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này!' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.promise().query(
      'UPDATE users SET reset_otp = ?, reset_otp_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?',
      [otp, email]
    );

    const mailOptions = {
      from: `"TagEdu Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã OTP Đặt lại mật khẩu - TagEdu',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #2563eb;">TagEdu AI</h2>
          <p>Chào bạn,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Dưới đây là mã OTP của bạn (có hiệu lực trong 15 phút):</p>
          <h1 style="background: #f3f4f6; padding: 10px; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
          <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Đã gửi mã OTP đến email của bạn!' });
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi email.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin!' });

  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > NOW()',
      [email, otp]
    );

    if (users.length === 0) return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn!' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.promise().query(
      'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?',
      [passwordHash, email]
    );

    res.json({ message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống khi đổi mật khẩu.' });
  }
};

// [ĐÃ SỬA] Hàm Cập nhật Profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.userId; 
  const { fullName, profileBio } = req.body; // Lấy thêm profileBio từ body

  if (!fullName) return res.status(400).json({ error: 'Tên hiển thị không được để trống!' });

  try {
    // Cập nhật cả tên và bio vào Database
    await db.promise().query('UPDATE users SET full_name = ?, profile_bio = ? WHERE id = ?', [fullName, profileBio, userId]);

    // [ĐÃ SỬA] Lấy lại thông tin user mới nhất bao gồm cả bio VÀ role
    const [users] = await db.promise().query('SELECT id, full_name, email, profile_bio, role FROM users WHERE id = ?', [userId]);

    res.json({ 
      message: 'Cập nhật hồ sơ thành công!', 
      user: { id: users[0].id, fullName: users[0].full_name, email: users[0].email, profileBio: users[0].profile_bio, role: users[0].role } 
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật hồ sơ.' });
  }
};