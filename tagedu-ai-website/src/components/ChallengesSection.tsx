import { useState, useEffect } from "react";
import { GripVertical, MousePointerClick, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { View } from "@/pages/Index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ChallengesProps {
  onNavigate: (view: View) => void;
}

const modules = [
  {
    id: "challenge7" as const, 
    title: "Thử thách 1: Phân loại phần mềm",
    description: "Kéo thả phần mềm vào đúng loại của nó.",
    icon: GripVertical,
  },
  {
    id: "challenge8" as const, 
    title: "Thử thách 2: Chức năng phần mềm",
    description: "Chọn phần mềm phù hợp với chức năng được yêu cầu.",
    icon: MousePointerClick,
  },
];

export function ChallengesSection({ onNavigate }: ChallengesProps) {
  // [MỚI] State lưu trữ danh sách các thử thách đã hoàn thành
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});

  // [MỚI] Gọi API lấy tiến độ khi Component được render
  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem("tagedu_token");
      if (!token) {
        setCompletedChallenges({}); // Nếu chưa đăng nhập thì xóa trắng tiến độ
        return;
      }

      try {
        const response = await fetch(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const progressMap: Record<string, boolean> = {};
          
          // Chuyển mảng dữ liệu thành dạng Object (vd: { challenge7: true })
          data.forEach((item: any) => {
            if (item.is_completed) {
              progressMap[item.challenge_id] = true;
            }
          });
          
          setCompletedChallenges(progressMap);
        }
      } catch (error) {
        console.error("Lỗi lấy tiến độ:", error);
      }
    };

    fetchProgress();

    // Lắng nghe sự kiện đăng nhập/đăng xuất để tự động cập nhật lại thanh tiến độ
    window.addEventListener("auth_change", fetchProgress);
    return () => window.removeEventListener("auth_change", fetchProgress);
  }, []);

  return (
    <section id="challenges" className="w-full py-20 bg-muted/30">
      <div className="container px-4 md:px-8 mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Thử thách thực hành
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chọn một thử thách dưới đây để bắt đầu luyện tập tư duy phân loại và xác định chức năng phần mềm cùng TagEdu.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((mod) => {
            const isCompleted = completedChallenges[mod.id]; // Kiểm tra xem thử thách này xong chưa

            return (
              <Card
                key={mod.id}
                // [MỚI] Thêm hiệu ứng viền xanh và nền mờ nếu đã hoàn thành
                className={`group cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isCompleted 
                    ? "border-success bg-success/5" 
                    : "border-border bg-card"
                }`}
                onClick={() => onNavigate(mod.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
                    isCompleted ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                  }`}>
                    <mod.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl flex items-center justify-between">
                    {mod.title}
                    {/* [MỚI] Hiện icon Tick xanh nếu hoàn thành */}
                    {isCompleted && (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">{mod.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* [MỚI] Đổi nút bấm thành Làm lại hoặc Bắt đầu tùy theo tiến độ */}
                  <Button 
                    className="w-full text-base" 
                    variant={isCompleted ? "outline" : "default"}
                  >
                    {isCompleted ? "Làm lại thử thách" : "Bắt đầu thử thách"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}