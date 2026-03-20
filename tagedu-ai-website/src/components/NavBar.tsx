import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { GraduationCap, LogIn, LogOut, User, Settings, ShieldAlert } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { AuthModal } from "./AuthModal";
import { ProfileModal } from "./ProfileModal";

export default function NavBar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const navigate = useNavigate(); 
  const location = useLocation(); 

  // [ĐÃ SỬA] Thêm bộ lắng nghe thay đổi LocalStorage từ các Tab khác
  useEffect(() => {
    // 1. Kiểm tra lúc mới load trang
    const userStr = localStorage.getItem("tagedu_user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // 2. Lắng nghe sự kiện storage (khi có tab khác xóa token)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tagedu_token" && !e.newValue) {
        // Nếu token bị xóa ở tab khác -> tự động đăng xuất ở tab này
        setCurrentUser(null);
        window.dispatchEvent(new Event("auth_change")); // Báo cho Chatbot biết luôn
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tagedu_token");
    localStorage.removeItem("tagedu_user");
    setCurrentUser(null);
    window.location.href = "/"; 
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-primary">TagEdu</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 border-r pr-4 mr-2 border-border/50">
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="max-w-[200px] truncate" title={currentUser.fullName}>
                    {currentUser.fullName}
                  </span>
                </div>
                
                {currentUser.role === 'admin' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50 h-8 px-2"
                    onClick={() => navigate("/admin")}
                    title="Trang quản trị viên"
                  >
                    <ShieldAlert className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-semibold">Quản trị</span>
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:bg-gray-100 h-8 px-2"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Chỉnh sửa hồ sơ"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Hồ sơ</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 px-2"
                  onClick={() => setIsLogoutModalOpen(true)}
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className="border-r pr-4 mr-2 border-border/50">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2 h-8"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Button>
              </div>
            )}

            {location.pathname === "/" ? (
              <Button asChild>
                <a href="#challenges">Bắt đầu ngay</a>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/")}>
                Về Trang chủ
              </Button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(user) => {
          setCurrentUser(user);
          window.dispatchEvent(new Event("auth_change"));
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(updatedUser) => setCurrentUser(updatedUser)}
      />

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <LogOut className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Xác nhận đăng xuất</h3>
            <p className="mb-6 text-sm text-gray-500">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống TagEdu không?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setIsLogoutModalOpen(false)}>Hủy bỏ</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}