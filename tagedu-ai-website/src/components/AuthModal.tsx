import { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Loader2, LogIn, KeyRound } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "684563079412-cvcos2eie48j5bv4r95sjlihfdfko7fm.apps.googleusercontent.com";
// [MỚI] Tự động lấy URL từ file .env, nếu không có thì mặc định dùng localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    otp: "",
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setForgotStep(1);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const isLogin = mode === "login";
    // [ĐÃ SỬA] Dùng API_URL
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { fullName: formData.fullName, email: formData.email, password: formData.password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("tagedu_token", data.token);
          localStorage.setItem("tagedu_user", JSON.stringify(data.user));
          onSuccess(data.user); 
          onClose(); 
        } else {
          setSuccessMsg("Đăng ký thành công! Đang chuyển sang đăng nhập...");
          setTimeout(() => switchMode("login"), 1500);
        }
      } else {
        throw new Error(data.error || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // [ĐÃ SỬA] Dùng API_URL
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("Mã OTP đã được gửi đến email của bạn!");
        setForgotStep(2);
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // [ĐÃ SỬA] Dùng API_URL
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp, newPassword: formData.password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("Đổi mật khẩu thành công! Đang chuyển về đăng nhập...");
        setTimeout(() => switchMode("login"), 2000);
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // [ĐÃ SỬA] Dùng API_URL
      const response = await fetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("tagedu_token", data.token);
        localStorage.setItem("tagedu_user", JSON.stringify(data.user));
        onSuccess(data.user); 
        onClose(); 
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>

          <div className="bg-primary/5 px-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {mode === "forgot" ? <KeyRound className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "Chào mừng trở lại!" : mode === "register" ? "Tạo tài khoản mới" : "Khôi phục mật khẩu"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {mode === "forgot" ? "Nhập email của bạn để nhận mã xác nhận (OTP)." : "Đăng nhập để lưu trữ quá trình học tập của bạn."}
            </p>
          </div>

          <div className="p-6">
            {errorMsg && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">{errorMsg}</div>}
            {successMsg && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">{successMsg}</div>}

            {mode === "forgot" ? (
              <form onSubmit={forgotStep === 1 ? handleSendOTP : handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" placeholder="Địa chỉ Email" required disabled={forgotStep === 2} value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100" />
                </div>

                {forgotStep === 2 && (
                  <>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input type="text" name="otp" placeholder="Nhập mã OTP (6 số)" required value={formData.otp} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input type="password" name="password" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" required minLength={6} value={formData.password} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                  </>
                )}

                <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (forgotStep === 1 ? "Gửi mã OTP" : "Đổi mật khẩu")}
                </button>
                
                <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode("login")} className="text-sm font-semibold text-gray-500 hover:text-primary">
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input type="text" name="fullName" placeholder="Họ và tên" required value={formData.fullName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="email" name="email" placeholder="Địa chỉ Email" required value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="password" name="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" required minLength={6} value={formData.password} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-medium text-primary hover:underline">
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản")}
                  </button>
                </form>

                <div className="mt-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-gray-300 after:mt-0.5 after:flex-1 after:border-t after:border-gray-300">
                  <p className="mx-4 mb-0 text-center text-sm text-gray-500">hoặc</p>
                </div>
                
                <div className="mt-5 flex justify-center">
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Đăng nhập Google thất bại")} useOneTap />
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                  <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="font-semibold text-primary hover:underline">
                    {mode === "login" ? "Đăng ký ngay" : "Đăng nhập tại đây"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}