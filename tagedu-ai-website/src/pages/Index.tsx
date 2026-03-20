import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"; // [ĐÃ SỬA] Import thêm Navigate
import NavBar from "@/components/NavBar";
import Challenge7 from "@/components/Challenge7";
import Challenge8 from "@/components/Challenge8";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ChallengesSection } from "@/components/ChallengesSection";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { AdminDashboard } from "@/components/AdminDashboard";
import NotFound from "./NotFound"; 

// Khai báo type View để các file khác import không bị lỗi
export type View = "landing" | "challenge7" | "challenge8" | "admin";

// [MỚI] Trạm kiểm soát bảo vệ Route Admin
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Nếu là user hợp lệ và có quyền admin thì cho phép đi qua
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }
  
  // Nếu chưa đăng nhập hoặc không phải admin -> Đá văng về trang chủ lập tức
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
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <NavBar />
      
      <main className="flex-1">
        <Routes>
          {/* URL Trang chủ */}
          <Route path="/" element={
            <>
              <HeroSection />
              <ChallengesSection onNavigate={handleNavigate} />
              <FeaturesSection />
            </>
          } />
          
          {/* Các URL Thử thách */}
          <Route path="/challenge7" element={<Challenge7 onNavigate={handleNavigate} />} />
          <Route path="/challenge8" element={<Challenge8 onNavigate={handleNavigate} />} />
          
          {/* [ĐÃ SỬA] URL Trang Quản trị được bọc bởi Trạm kiểm soát */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />

          {/* Chốt chặn 404: Nếu URL không khớp các link trên thì hiện NotFound */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Chỉ hiện Footer ở trang chủ */}
      {location.pathname === "/" && <Footer />}
      
      {/* Vẫn giữ nguyên logic gửi currentView cho Bot */}
      <ChatbotWidget currentView={currentViewStr as View} />
    </div>
  );
};

export default Index;