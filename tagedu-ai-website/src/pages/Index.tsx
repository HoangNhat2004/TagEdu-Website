import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Challenge1 from "@/components/Challenge1";
import Challenge2 from "@/components/Challenge2";
import Challenge3 from "@/components/Challenge3";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ChallengesSection } from "@/components/ChallengesSection";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ProgressPage } from "@/components/ProgressPage";
import { SettingsPage } from "@/components/SettingsPage";
import { GuardianDashboard } from "@/components/GuardianDashboard";
import NotFound from "./NotFound";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { OnboardingModal } from "@/components/OnboardingModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Khai báo type View để các file khác import không bị lỗi
export type View = "landing" | "challenge1" | "challenge2" | "challenge3" | "admin" | "missions" | "progress" | "settings";

// [MỚI] Trạm kiểm soát bảo vệ Route Admin
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (user && user.role === 'admin') {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};

// [MỚI] Trạm kiểm soát bảo vệ Route Thử thách (theo tiến độ và đăng nhập)
const ChallengeProtectedRoute = ({ children, challengeId }: { children: React.ReactNode, challengeId: string }) => {
  const { t } = useI18n();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("tagedu_token");

  useEffect(() => {
    // 1. Admin luôn có quyền truy cập
    if (user && user.role === 'admin') {
      setIsAllowed(true);
      return;
    }

    // [MỚI] Guardian không được phép truy cập thử thách của học sinh
    if (user && user.role === 'guardian') {
      setIsAllowed(false);
      return;
    }

    // 2. Thử thách 1 (challenge1) là bản Demo, cho phép cả khách truy cập
    if (challengeId === "challenge1") {
      setIsAllowed(true);
      return;
    }

    // 3. Các thử thách khác bắt buộc đăng nhập
    if (!token) {
      toast.error(t("challenge.loginRequired"));
      setIsAllowed(false);
      return;
    }

    // 4. Kiểm tra tiến độ để mở khóa thử thách tiếp theo
    const checkProgress = async () => {
      try {
        const response = await fetch(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const completedMap: Record<string, boolean> = {};
          data.forEach((item: any) => {
            if (item.is_completed) completedMap[item.challenge_id] = true;
          });

          // Logic thứ tự: 1 -> 2 -> 3
          if (challengeId === "challenge2") {
            if (completedMap["challenge1"]) setIsAllowed(true);
            else {
              toast.error(t("challenge.lockedMessage"));
              setIsAllowed(false);
            }
          } else if (challengeId === "challenge3") {
            if (completedMap["challenge2"]) setIsAllowed(true);
            else {
              toast.error(t("challenge.lockedMessage"));
              setIsAllowed(false);
            }
          } else {
            setIsAllowed(true); // Các trang khác nếu có
          }
        } else {
          setIsAllowed(false);
        }
      } catch (error) {
        console.error("Access check error:", error);
        setIsAllowed(false);
      }
    };

    checkProgress();
  }, [challengeId, token, user?.id]);

  if (isAllowed === null) {
    return <div className="min-h-screen cosmic-bg flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>;
  }

  if (isAllowed === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Index = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Hàm cầu nối: Dịch từ dạng chữ cũ sang đường dẫn URL mới
  const handleNavigate = (view: string) => {
    if (view === "landing") {
      navigate("/");
    } else {
      navigate(`/${view}`);
    }
  };

  // Tính toán currentView giả lập để gửi cho ChatbotWidget nhận diện trang
  const currentViewStr = location.pathname === "/" ? "landing" : location.pathname.substring(1);

  // [MỚI - ONBOARDING] Kiểm tra xem user đã nhập ngày sinh chưa
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = () => {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'learner');
      } else {
        setUserRole(null);
      }
    };
    checkUserRole();

    const checkOnboarding = () => {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Guardian và Admin không cần onboarding ngày sinh
        if (!user.dateOfBirth && user.role !== 'admin' && user.role !== 'guardian') {
          setIsOnboardingOpen(true);
        }
      }
    };
    checkOnboarding();

    // Lắng nghe sự kiện auth_change (đăng nhập mới)
    const handleAuthChange = () => {
      checkUserRole();
      checkOnboarding();
    };
    window.addEventListener("auth_change", handleAuthChange);
    // Lắng nghe sự kiện custom khi AuthModal thành công
    window.addEventListener("login_success", handleAuthChange);
    return () => {
      window.removeEventListener("auth_change", handleAuthChange);
      window.removeEventListener("login_success", handleAuthChange);
    };
  }, []);

  const handleOnboardingComplete = (dateOfBirth: string) => {
    const userStr = localStorage.getItem("tagedu_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.dateOfBirth = dateOfBirth;
      localStorage.setItem("tagedu_user", JSON.stringify(user));
    }
    setIsOnboardingOpen(false);
    toast.success(language === 'vi' ? "Hành trình vũ trụ của bạn đã sẵn sàng! 🚀" : "Your cosmic journey is ready! 🚀", {
      description: language === 'vi' ? "AI đã sẵn sàng hỗ trợ bạn theo đúng độ tuổi." : "AI is ready to assist you based on your age.",
      duration: 5000,
    });
    window.dispatchEvent(new Event("auth_change"));
  };

  const handleOnboardingSkip = () => {
    // Đánh dấu "skipped" để không hiện lại trong phiên hiện tại
    const userStr = localStorage.getItem("tagedu_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.dateOfBirth = 'skipped';
      localStorage.setItem("tagedu_user", JSON.stringify(user));
    }
    setIsOnboardingOpen(false);
    toast.info(language === 'vi' ? "Bạn có thể cập nhật ngày sinh sau trong phần Hồ sơ." : "You can update your birthday later in Profile.");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <NavBar />

      <main className="flex-1">
        <Routes>
          {/* URL Trang chủ / Mission Map */}
          <Route path="/" element={
            userRole === 'guardian' ? (
              <GuardianDashboard />
            ) : (
              <>
                <HeroSection />
                <ChallengesSection onNavigate={handleNavigate} />
                <FeaturesSection />
              </>
            )
          } />

          {/* Mission Map alias */}
          <Route path="/missions" element={
            userRole === 'guardian' ? (
              <GuardianDashboard />
            ) : (
              <>
                <HeroSection />
                <ChallengesSection onNavigate={handleNavigate} />
                <FeaturesSection />
              </>
            )
          } />

          {/* Các URL Thử thách được bảo vệ */}
          <Route path="/challenge1" element={
            <ChallengeProtectedRoute challengeId="challenge1">
              <Challenge1 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />
          <Route path="/challenge2" element={
            <ChallengeProtectedRoute challengeId="challenge2">
              <Challenge2 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />
          <Route path="/challenge3" element={
            <ChallengeProtectedRoute challengeId="challenge3">
              <Challenge3 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />

          {/* Progress Page */}
          <Route path="/progress" element={
            userRole === 'guardian' ? <Navigate to="/" replace /> : <ProgressPage />
          } />

          {/* Settings Page */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* URL Trang Quản trị được bọc bởi Trạm kiểm soát */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />

          {/* Chốt chặn 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Chỉ hiện Footer ở trang chủ và missions */}
      {(location.pathname === "/" || location.pathname === "/missions") && <Footer />}

      {/* Chatbot Widget (Bong bóng chat nổi) - Ẩn ở Challenge 3 (dùng Inline Chatbot) và Admin */}
      {location.pathname !== "/admin" && currentViewStr !== "challenge3" && <ChatbotWidget currentView={currentViewStr as View} />}

      {/* [MỚI] Onboarding Modal — Hỏi ngày sinh lần đầu */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
};

export default Index;
