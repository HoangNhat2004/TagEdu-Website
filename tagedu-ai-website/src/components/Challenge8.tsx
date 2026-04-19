import { useState, useEffect } from "react";
import { Radar, Calculator, Map, Camera, ShieldCheck, Thermometer, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Question {
  scenarioKey: string;
  correctAppNameKey: string;
}

const QUESTIONS: Question[] = [
  {
    scenarioKey: "c8.q1",
    correctAppNameKey: "c8.appName.Radar",
  },
  {
    scenarioKey: "c8.q2",
    correctAppNameKey: "c8.appName.Calculator",
  },
  {
    scenarioKey: "c8.q3",
    correctAppNameKey: "c8.appName.Map",
  },
  {
    scenarioKey: "c8.q4",
    correctAppNameKey: "c8.appName.Camera",
  },
  {
    scenarioKey: "c8.q5",
    correctAppNameKey: "c8.appName.Temperature",
  },
];

const APPS = [
  { nameKey: "c8.appName.Radar", icon: Radar },
  { nameKey: "c8.appName.Calculator", icon: Calculator },
  { nameKey: "c8.appName.Map", icon: Map },
  { nameKey: "c8.appName.Camera", icon: Camera },
  { nameKey: "c8.appName.Security", icon: ShieldCheck },
  { nameKey: "c8.appName.Temperature", icon: Thermometer },
];

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const Challenge8 = ({ onNavigate }: ChallengeProps) => {
  const { t } = useI18n();

  // [MỚI] Hàm tạo key lưu trữ riêng theo từng User
  const getStorageKey = () => {
    try {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return `tagedu_c2_progress_${user.id}`;
      }
    } catch (e) {}
    return "tagedu_c2_progress_guest";
  };

  const [currentQ, setCurrentQ] = useState(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const data = JSON.parse(saved);
      return typeof data.currentQ === 'number' ? data.currentQ : 0;
    }
    return 0;
  });

  const [shakeApp, setShakeApp] = useState<string | null>(null);
  const [correctApp, setCorrectApp] = useState<string | null>(null);
  
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const data = JSON.parse(saved);
      return data.completed === true;
    }
    return false;
  });

  // [MỚI] Tự động lưu vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify({ currentQ, completed }));
  }, [currentQ, completed]);

  const progress = (currentQ / QUESTIONS.length) * 100;

  // [MỚI] Tự động gọi API lưu tiến độ khi completed = true
  useEffect(() => {
    if (completed) {
      const saveProgress = async () => {
        const token = localStorage.getItem("tagedu_token");
        if (!token) return; // Nếu chưa đăng nhập thì không lưu

        try {
          const res = await fetch(`${API_URL}/progress/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ challengeId: "challenge8" }), // Mã ID của Thử thách 2
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem("tagedu_token");
              localStorage.removeItem("tagedu_user");
              window.dispatchEvent(new Event("auth_change"));
            }
            throw new Error("Failed to save via API");
          }
          console.log("Progress saved successfully");
        } catch (error) {
          console.error("Lỗi khi lưu tiến độ:", error);
          toast.error(t("challenge.networkError"));
        }
      };

      saveProgress();
    }
  }, [completed]);

  const handleChoice = (appNameKey: string) => {
    if (correctApp) return; // already answered

    if (appNameKey === QUESTIONS[currentQ].correctAppNameKey) {
      setCorrectApp(appNameKey);
      setTimeout(() => {
        if (currentQ + 1 >= QUESTIONS.length) {
          setCompleted(true);
        } else {
          setCurrentQ((q) => q + 1);
          setCorrectApp(null);
        }
      }, 800);
    } else {
      setShakeApp(appNameKey);
      setTimeout(() => setShakeApp(null), 400);
    }
  };

  // [MỚI] Hàm xử lý khi bấm Làm lại
  const handleReplay = () => {
    setCurrentQ(0);
    setCorrectApp(null);
    setShakeApp(null);
    setCompleted(false);
    localStorage.removeItem(getStorageKey());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {t("c8.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("c8.desc")}
          </p>
        </div>
        {!completed && currentQ > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplay}
            className="text-muted-foreground hover:text-destructive flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{t("c7.retry")}</span>
          </Button>
        )}
      </div>

      <Progress value={completed ? 100 : progress} className="mb-8 h-2.5" />

      {completed ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center">
          <p className="text-xl font-semibold text-success">
            {t("c8.success")}
          </p>
          {/* [MỚI] Thêm nút Làm lại ngay */}
          <div className="flex gap-4">
            <Button onClick={handleReplay} variant="outline" size="lg">
              {t("c7.retry")}
            </Button>
            <Button onClick={() => onNavigate("landing")} size="lg">
              {t("c7.home")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Question box */}
          <div className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("c8.qNum")} {currentQ + 1} / {QUESTIONS.length}
            </p>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-foreground">
              {t(QUESTIONS[currentQ].scenarioKey)}
            </p>
          </div>

          {/* Choices grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {APPS.map((app) => {
              const Icon = app.icon;
              const isCorrect = correctApp === app.nameKey;
              const isShaking = shakeApp === app.nameKey;

              return (
                <Button
                  key={app.nameKey}
                  variant="outline"
                  onClick={() => handleChoice(app.nameKey)}
                  className={`h-auto flex-col gap-2 py-5 text-base font-medium transition-all ${
                    isCorrect
                      ? "border-success bg-success/10 text-success hover:bg-success/10 hover:text-success"
                      : isShaking
                      ? "animate-shake border-destructive bg-destructive/5"
                      : "hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {t(app.nameKey)}
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