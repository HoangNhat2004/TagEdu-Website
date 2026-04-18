import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { LogIn, LogOut, User, ShieldAlert, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthModal } from "./AuthModal";
import { ProfileModal } from "./ProfileModal";
import { useI18n } from "@/lib/i18n";

export default function NavBar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();

  const navItems = [
    { key: "nav.home", path: "/" },
    { key: "nav.missionMap", path: "/missions" },
    { key: "nav.progress", path: "/progress" },
    { key: "nav.settings", path: "/settings" },
  ];

  const [isChallengesVisible, setIsChallengesVisible] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("tagedu_user");
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tagedu_token" && !e.newValue) {
        setCurrentUser(null);
        window.dispatchEvent(new Event("auth_change"));
      }
    };

    const handleAuthChange = () => {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_change", handleAuthChange);

    // Listen for custom event from ChatbotWidget to open auth modal
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener("open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_change", handleAuthChange);
      window.removeEventListener("open-auth-modal", handleOpenAuth);
    };
  }, []);

  // Scroll spy: detect when #challenges section is visible
  useEffect(() => {
    if (location.pathname !== "/") {
      setIsChallengesVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsChallengesVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = document.getElementById("challenges");
      if (el) observer.observe(el);
    }, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("tagedu_token");
    localStorage.removeItem("tagedu_user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const handleNavClick = (item: { key: string; path: string }) => {
    if (item.path === "/missions") {
      if (location.pathname === "/") {
        // Already on home → just scroll
        const element = document.getElementById("challenges");
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navigate to home first, then scroll after render
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById("challenges");
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      navigate(item.path);
      // Scroll to top when navigating to a new page
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (path: string) => {
    // On homepage: highlight MISSION MAP when challenges section is visible, HOME otherwise
    if (location.pathname === "/") {
      if (path === "/missions") return isChallengesVisible;
      if (path === "/") return !isChallengesVisible;
      return false;
    }
    // On other pages: standard matching
    if (path !== "/" && path !== "/missions" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <nav className="nav-cosmic sticky top-0 z-50 w-full transition-all duration-300">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-gradient-cyan" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                TagEdu
              </span>
            </button>
          </div>

          {/* Center Nav Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={`px-4 py-2 text-sm font-semibold tracking-wider transition-all duration-200 rounded-lg ${
                  isActive(item.path)
                    ? "text-cyan-400 bg-cyan-400/10"
                    : "text-gray-400 hover:text-cyan-300 hover:bg-white/5"
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "vi" : "en")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/10 transition-all"
              title={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline uppercase">{language}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                {/* Avatar + Name */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 min-w-0 text-gray-300 hover:text-white transition-colors"
                  title={currentUser.fullName}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20">
                    <User className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="hidden sm:inline flex-1 min-w-0 truncate text-sm max-w-[120px]">
                    {currentUser.fullName}
                  </span>
                </button>

                {/* Admin button */}
                {currentUser.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 shrink-0 transition-all ${
                      location.pathname.startsWith("/admin")
                        ? "bg-amber-400/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] border border-amber-400/30"
                        : "text-amber-400/70 hover:bg-amber-400/10 hover:text-amber-400"
                    }`}
                    onClick={() => navigate("/admin")}
                    title="Admin"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </Button>
                )}

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 shrink-0 text-red-400 hover:bg-red-400/10 hover:text-red-300"
                  onClick={() => setIsLogoutModalOpen(true)}
                  title={t("nav.logout")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="gap-2 h-8 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <LogIn className="h-4 w-4" />
                <span>{t("nav.login")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Nav - Bottom bar */}
        <div className="md:hidden flex items-center justify-around border-t border-white/5 py-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-all rounded ${
                isActive(item.path)
                  ? "text-cyan-400"
                  : "text-gray-500 hover:text-cyan-300"
              }`}
            >
              {t(item.key)}
            </button>
          ))}
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm rounded-2xl glass-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <LogOut className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t("nav.confirmLogoutTitle")}</h3>
            <p className="mb-6 text-sm text-gray-400">
              {t("nav.confirmLogoutMsg")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-white/5"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                {t("nav.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700 border-0"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}