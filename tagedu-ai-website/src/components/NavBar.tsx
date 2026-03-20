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
          
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <GraduationCap className={`h-8 w-8 ${isTransparent ? "text-white" : "text-primary"}`} />
              <span className={`text-xl font-bold tracking-tight ${isTransparent ? "text-white" : "text-primary"}`}>
                TagEdu
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className={`flex items-center gap-2 sm:gap-3 border-r pr-4 mr-2 ${isTransparent ? "border-white/20" : "border-border/50"}`}>
                <div className={`hidden sm:flex items-center gap-2 text-sm font-medium mr-2 ${isTransparent ? "text-white/90" : "text-muted-foreground"}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isTransparent ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
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
                    className={`h-8 px-2 ${isTransparent ? "text-red-300 hover:bg-white/10 hover:text-red-200" : "text-red-600 hover:bg-red-50"}`}
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
                  className={`h-8 px-2 ${isTransparent ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Chỉnh sửa hồ sơ"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Hồ sơ</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 px-2 ${isTransparent ? "text-red-300 hover:bg-white/10 hover:text-red-200" : "text-red-500 hover:bg-red-50 hover:text-red-600"}`}
                  onClick={() => setIsLogoutModalOpen(true)}
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className={`border-r pr-4 mr-2 ${isTransparent ? "border-white/20" : "border-border/50"}`}>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`gap-2 h-8 ${isTransparent ? "text-white/90 hover:bg-white/10 hover:text-white" : ""}`}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Button>
              </div>
            )}

            {isHomePage ? (
              <Button
                asChild
                className={isTransparent ? "bg-white text-blue-900 hover:bg-white/90 border-0 font-semibold" : ""}
              >
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