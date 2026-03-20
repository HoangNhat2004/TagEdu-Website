import { useState, useEffect } from "react";
import { X, Mail, User as UserIcon, Loader2, UserCog, BookUser, Shield, AlertCircle, CheckCircle2 } from "lucide-react";

// Tự động lấy URL từ file .env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSuccess: (updatedUser: any) => void;
}

export function ProfileModal({ isOpen, onClose, currentUser, onSuccess }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    profileBio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({ 
        fullName: currentUser.fullName || currentUser.full_name || "",
        profileBio: currentUser.profileBio || "", 
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrorMsg("");
      setSuccessMsg("");
      setActiveTab('profile');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const token = localStorage.getItem("tagedu_token");

    try {
      // Gọi API cập nhật thông tin
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          full_name: formData.fullName, 
          profileBio: formData.profileBio 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Đã cập nhật hồ sơ thành công!");
        
        // Cập nhật LocalStorage và báo cho NavBar
        const updatedUser = { 
          ...currentUser, 
          fullName: formData.fullName, 
          full_name: formData.fullName,
          profileBio: formData.profileBio 
        };
        localStorage.setItem("tagedu_user", JSON.stringify(updatedUser));
        onSuccess(updatedUser);
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin mật khẩu.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("tagedu_token");

    try {
      // Gọi API đổi mật khẩu
      const response = await fetch(`${API_URL}/users/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          currentPassword: passwordData.currentPassword, 
          newPassword: passwordData.newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Đổi mật khẩu thành công!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút đóng */}
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-500 hover:bg-white/50 transition-colors">
          <X className="h-5 w-5" />
        </button>

        {/* Header Modal */}
        <div className="bg-primary/5 px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCog className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h2>
          <p className="mt-2 text-sm text-gray-500">Cập nhật thông tin và bảo mật tài khoản của bạn.</p>
        </div>

        {/* Thanh Tabs chuyển đổi */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'profile' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => { setActiveTab('profile'); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <UserIcon className="h-4 w-4" /> Thông tin
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'password' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => { setActiveTab('password'); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <Shield className="h-4 w-4" /> Đổi mật khẩu
          </button>
        </div>

        {/* Khu vực Form */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" /> <p>{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> <p>{successMsg}</p>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4 pb-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Địa chỉ Email (Định danh)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={currentUser?.email || ""} disabled className="w-full rounded-lg border border-gray-300 bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tên hiển thị</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="fullName" placeholder="Họ và tên" required value={formData.fullName} onChange={handleProfileChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Đoạn giới thiệu bản thân ngắn (Bio)</label>
                <div className="relative">
                  <BookUser className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                  <textarea 
                    name="profileBio" 
                    placeholder="Hãy viết một vài dòng giới thiệu về bản thân hoặc mục tiêu học tập của bạn..."
                    value={formData.profileBio} 
                    onChange={handleProfileChange}
                    rows={4} 
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground font-medium">✨ TagEdu AI sẽ đọc phần này để cá nhân hóa câu trả lời tốt hơn cho bạn.</p>
              </div>

              <button type="submit" disabled={isLoading || !formData.fullName.trim()} className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Lưu thay đổi"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pb-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={isLoading} className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đổi mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}