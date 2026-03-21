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
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    const userStr = localStorage.getItem("tagedu_user");
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tagedu_token" && !e.newValue) {
        setCurrentUser(null);
        window.dispatchEvent(new Event("auth_change"));
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

  // Tên ngắn: lấy từ cuối cùng (tên riêng trong tiếng Việt)
  const getShortName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1];
  };

  const isTransparent = isHomePage && !isScrolled;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          isTransparent
            ? "bg-black/30 backdrop-blur-sm border-white/10"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border"
        }`}
      >
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <GraduationCap className={`h-8 w-8 ${isTransparent ? "text-white" : "text-primary"}`} />
              <span className={`text-xl font-bold tracking-tight ${isTransparent ? "text-white" : "text-primary"}`}>
                TagEdu
              </span>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-3 min-w-0">
            {currentUser ? (
              <div className={`flex items-center gap-1 sm:gap-2 border-r pr-2 sm:pr-4 mr-1 sm:mr-2 min-w-0 ${
                isTransparent ? "border-white/20" : "border-border/50"
              }`}>

                {/* Avatar + Tên:
                    - Mobile: avatar + tên ngắn (tên riêng), vd "Nhật"
                    - Desktop: avatar + họ tên đầy đủ
                    Bấm vào để mở ProfileModal */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors min-w-0 ${
                    isTransparent
                      ? "text-white/90 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={currentUser.fullName}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isTransparent ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    <User className="h-4 w-4" />
                  </div>
                  {/* Mobile: tên riêng ngắn gọn | Desktop: họ tên đầy đủ */}
                  <span className="truncate max-w-[70px] sm:max-w-[180px]">
                    <span className="sm:hidden">{getShortName(currentUser.fullName)}</span>
                    <span className="hidden sm:inline">{currentUser.fullName}</span>
                  </span>
                </button>

                {/* Admin */}
                {currentUser.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-1.5 sm:px-2 shrink-0 ${
                      isTransparent
                        ? "text-red-300 hover:bg-white/10 hover:text-red-200"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                    onClick={() => navigate("/admin")}
                    title="Trang quản trị viên"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span className="hidden sm:inline font-semibold ml-1">Quản trị</span>
                  </Button>
                )}

                {/* Settings - desktop only */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden sm:flex h-8 px-2 shrink-0 ${
                    isTransparent
                      ? "text-white/90 hover:bg-white/10 hover:text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Chỉnh sửa hồ sơ"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Hồ sơ
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-1.5 sm:px-2 shrink-0 ${
                    isTransparent
                      ? "text-red-300 hover:bg-white/10 hover:text-red-200"
                      : "text-red-500 hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setIsLogoutModalOpen(true)}
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className={`border-r pr-2 sm:pr-4 mr-1 sm:mr-2 ${
                isTransparent ? "border-white/20" : "border-border/50"
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`gap-2 h-8 ${
                    isTransparent ? "text-white/90 hover:bg-white/10 hover:text-white" : ""
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Button>
              </div>
            )}

            {/* CTA button */}
            {isHomePage ? (
              <Button
                asChild
                size="sm"
                className={`shrink-0 text-xs sm:text-sm px-3 sm:px-4 ${
                  isTransparent ? "bg-white text-blue-900 hover:bg-white/90 border-0 font-semibold" : ""
                }`}
              >
                <a href="#challenges">
                  <span className="hidden sm:inline">Bắt đầu ngay</span>
                  <span className="sm:hidden">Bắt đầu</span>
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs sm:text-sm px-3 sm:px-4"
                onClick={() => navigate("/")}
              >
                <span className="hidden sm:inline">Về Trang chủ</span>
                <span className="sm:hidden">Trang chủ</span>
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
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống TagEdu không?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}