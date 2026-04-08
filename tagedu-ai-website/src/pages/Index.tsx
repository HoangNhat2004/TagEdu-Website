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

// Khai báo type View để các file khác import không bị lỗi
export type View = "landing" | "challenge7" | "challenge8" | "challenge9" | "admin" | "missions" | "progress" | "settings";

// [MỚI] Trạm kiểm soát bảo vệ Route Admin
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (user && user.role === 'admin') {
    return <>{children}</>;
  }
  
  return <Navigate to="/" replace />;
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
          
          {/* Các URL Thử thách */}
          <Route path="/challenge7" element={<Challenge7 onNavigate={handleNavigate} />} />
          <Route path="/challenge8" element={<Challenge8 onNavigate={handleNavigate} />} />
          <Route path="/challenge9" element={<Challenge9 onNavigate={handleNavigate} />} />

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
      
      {/* Chatbot Widget */}
      <ChatbotWidget currentView={currentViewStr as View} />
    </div>
  );
};

export default Index;