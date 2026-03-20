import { useState, useEffect } from "react";
import { Radar, Calculator, Map, Camera, ShieldCheck, Thermometer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Question {
  scenario: string;
  correctApp: string;
}

const QUESTIONS: Question[] = [
  {
    scenario: "Con tàu này cần phần mềm cảm ứng chướng ngại vật để tránh va chạm trong không gian.",
    correctApp: "Radar",
  },
  {
    scenario: "Phi hành đoàn cần phần mềm tính toán quỹ đạo bay chính xác.",
    correctApp: "Máy tính",
  },
  {
    scenario: "Tàu vũ trụ cần phần mềm định vị và dẫn đường giữa các hành tinh.",
    correctApp: "Bản đồ",
  },
  {
    scenario: "Đội nghiên cứu cần phần mềm ghi lại hình ảnh bề mặt các hành tinh.",
    correctApp: "Camera",
  },
  {
    scenario: "Hệ thống tàu cần phần mềm giám sát nhiệt độ động cơ liên tục.",
    correctApp: "Nhiệt độ",
  },
];

const APPS = [
  { name: "Radar", icon: Radar },
  { name: "Máy tính", icon: Calculator },
  { name: "Bản đồ", icon: Map },
  { name: "Camera", icon: Camera },
  { name: "Bảo mật", icon: ShieldCheck },
  { name: "Nhiệt độ", icon: Thermometer },
];

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const Challenge8 = ({ onNavigate }: ChallengeProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [shakeApp, setShakeApp] = useState<string | null>(null);
  const [correctApp, setCorrectApp] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const progress = (currentQ / QUESTIONS.length) * 100;

  // [MỚI] Tự động gọi API lưu tiến độ khi completed = true
  useEffect(() => {
    if (completed) {
      const saveProgress = async () => {
        const token = localStorage.getItem("tagedu_token");
        if (!token) return; // Nếu chưa đăng nhập thì không lưu

        try {
          await fetch(`${API_URL}/progress/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ challengeId: "challenge8" }), // Mã ID của Thử thách 2
          });
          console.log("Đã lưu tiến độ Thử thách 2 thành công!");
        } catch (error) {
          console.error("Lỗi khi lưu tiến độ:", error);
        }
      };

      saveProgress();
    }
  }, [completed]);

  const handleChoice = (appName: string) => {
    if (correctApp) return; // already answered

    if (appName === QUESTIONS[currentQ].correctApp) {
      setCorrectApp(appName);
      setTimeout(() => {
        if (currentQ + 1 >= QUESTIONS.length) {
          setCompleted(true);
        } else {
          setCurrentQ((q) => q + 1);
          setCorrectApp(null);
        }
      }, 800);
    } else {
      setShakeApp(appName);
      setTimeout(() => setShakeApp(null), 400);
    }
  };

  // [MỚI] Hàm xử lý khi bấm Làm lại
  const handleReplay = () => {
    setCurrentQ(0);
    setCorrectApp(null);
    setShakeApp(null);
    setCompleted(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
        Thử thách 2: Chức năng phần mềm
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Chọn phần mềm phù hợp với chức năng được yêu cầu.
      </p>

      <Progress value={completed ? 100 : progress} className="mb-8 h-2.5" />

      {completed ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center">
          <p className="text-xl font-semibold text-success">
            🎉 Tuyệt vời! Tất cả phần mềm đã được cài đặt!
          </p>
          {/* [MỚI] Thêm nút Làm lại ngay */}
          <div className="flex gap-4">
            <Button onClick={handleReplay} variant="outline" size="lg">
              🔄 Làm lại ngay
            </Button>
            <Button onClick={() => onNavigate("landing")} size="lg">
              Về trang chủ
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Question box */}
          <div className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Câu {currentQ + 1} / {QUESTIONS.length}
            </p>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-foreground">
              {QUESTIONS[currentQ].scenario}
            </p>
          </div>

          {/* Choices grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {APPS.map((app) => {
              const Icon = app.icon;
              const isCorrect = correctApp === app.name;
              const isShaking = shakeApp === app.name;

              return (
                <Button
                  key={app.name}
                  variant="outline"
                  onClick={() => handleChoice(app.name)}
                  className={`h-auto flex-col gap-2 py-5 text-base font-medium transition-all ${
                    isCorrect
                      ? "border-success bg-success/10 text-success hover:bg-success/10 hover:text-success"
                      : isShaking
                      ? "animate-shake border-destructive bg-destructive/5"
                      : "hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {app.name}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Challenge8;