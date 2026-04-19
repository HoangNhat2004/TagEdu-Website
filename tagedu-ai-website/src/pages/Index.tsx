import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Challenge7 from "@/components/Challenge7";
import Challenge8 from "@/components/Challenge8";
import Challenge9 from "@/components/Challenge9";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ChallengesSection } from "@/components/ChallengesSection";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ProgressPage } from "@/components/ProgressPage";
import { SettingsPage } from "@/components/SettingsPage";
import NotFound from "./NotFound"; 
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

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

    // 2. Thử thách 1 (challenge7) là bản Demo, cho phép cả khách truy cập
    if (challengeId === "challenge7") {
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

          // Logic thứ tự: 7 -> 8 -> 9
          if (challengeId === "challenge8") {
            if (completedMap["challenge7"]) setIsAllowed(true);
            else {
              toast.error(t("challenge.lockedMessage"));
              setIsAllowed(false);
            }
          } else if (challengeId === "challenge9") {
            if (completedMap["challenge8"]) setIsAllowed(true);
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

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <NavBar />
      
      <main className="flex-1">
        <Routes>
          {/* URL Trang chủ / Mission Map */}
          <Route path="/" element={
            <>
              <HeroSection />
              <ChallengesSection onNavigate={handleNavigate} />
              <FeaturesSection />
            </>
          } />

          {/* Mission Map alias */}
          <Route path="/missions" element={
            <>
              <HeroSection />
              <ChallengesSection onNavigate={handleNavigate} />
              <FeaturesSection />
            </>
          } />
          
          {/* Các URL Thử thách được bảo vệ */}
          <Route path="/challenge1" element={
            <ChallengeProtectedRoute challengeId="challenge7">
              <Challenge7 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />
          <Route path="/challenge2" element={
            <ChallengeProtectedRoute challengeId="challenge8">
              <Challenge8 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />
          <Route path="/challenge3" element={
            <ChallengeProtectedRoute challengeId="challenge9">
              <Challenge9 onNavigate={handleNavigate} />
            </ChallengeProtectedRoute>
          } />

          {/* Progress Page */}
          <Route path="/progress" element={<ProgressPage />} />

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
      {currentViewStr !== "challenge3" && currentViewStr !== "admin" && <ChatbotWidget currentView={currentViewStr as View} />}
    </div>
  );
};

export default Index;