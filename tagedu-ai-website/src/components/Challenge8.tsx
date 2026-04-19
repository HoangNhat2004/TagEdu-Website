import { useState, useEffect } from "react";
import { Radar, Calculator, Map, Camera, ShieldCheck, Thermometer, RotateCcw, Loader2, Check } from "lucide-react";
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

  // Hàm tạo key lưu trữ riêng theo từng User
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
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [isCloudComplete, setIsCloudComplete] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const data = JSON.parse(saved);
      return data.completed === true;
    }
    return false;
  });

  // Tải dữ liệu từ Cloud khi lần đầu vào trang
  useEffect(() => {
    const fetchCloudDraft = async () => {
      const token = localStorage.getItem("tagedu_token");
      if (!token) {
        setIsLoadingCloud(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const challengeProgress = data.find((p: any) => p.challenge_id === "challenge8");
          
          if (challengeProgress) {
            if (challengeProgress.is_completed) {
              setIsCloudComplete(true);
            }

            if (challengeProgress.draft_data !== null) {
              setIsPracticing(true); 
              const cloudDraft = JSON.parse(challengeProgress.draft_data);
              // [SỬA] Luôn cập nhật tiến độ (ngay cả câu 0) để đồng bộ Reset
              setCurrentQ(cloudDraft.currentQ);
              setCompleted(cloudDraft.completed);
            } else {
              // Nếu cloud trống thì reset local để tránh dữ liệu rác từ khách
              setCurrentQ(0);
              setCompleted(false);
              setIsPracticing(false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching cloud draft:", error);
      } finally {
        setIsLoadingCloud(false);
      }
    };

    fetchCloudDraft();
    window.addEventListener("auth_change", fetchCloudDraft);
    return () => window.removeEventListener("auth_change", fetchCloudDraft);
  }, []);

  // Tự động đồng bộ hóa lên Cloud
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify({ currentQ, completed }));
    const token = localStorage.getItem("tagedu_token");
    
    // [SỬA] Cho phép đồng bộ ngay cả khi ở câu 0 nếu đang luyện tập
    if (isLoadingCloud || !token || (completed && !isPracticing)) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/progress/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            challengeId: "challenge8", 
            draftData: JSON.stringify({ currentQ, completed }) 
          }),
        });
      } catch (error) {
        console.error("Error saving draft to cloud:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentQ, completed, isLoadingCloud, isPracticing]);

  const progress = (currentQ / QUESTIONS.length) * 100;

  // Lưu tiến độ khi hoàn thành
  useEffect(() => {
    if (completed) {
      const saveProgress = async () => {
        const token = localStorage.getItem("tagedu_token");
        if (!token) return;

        try {
          const res = await fetch(`${API_URL}/progress/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ challengeId: "challenge8" }),
          });
          if (res.ok) {
            setIsPracticing(false);
            setIsCloudComplete(true);
          }
        } catch (error) {
          console.error("Error saving complete status:", error);
        }
      };
      saveProgress();
    }
  }, [completed]);

  const handleChoice = (appNameKey: string) => {
    if (correctApp) return;

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

  const handleRetry = async () => {
    if (isResetting) return;
    setIsResetting(true);

    try {
      setCurrentQ(0);
      setCorrectApp(null);
      setShakeApp(null);
      setCompleted(false);
      setIsPracticing(true);
      localStorage.removeItem(getStorageKey());

      const token = localStorage.getItem("tagedu_token");
      if (token) {
        const res = await fetch(`${API_URL}/progress/reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ challengeId: "challenge8" }),
        });
        
        if (res.ok) {
          toast.success(t("challenge.resetSuccess"), { id: "challenge-reset" });
        }
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoadingCloud) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {t("challenge.syncing")}
        </p>
      </div>
    );
  }

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
        {(currentQ > 0 || completed || isCloudComplete) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isResetting}
            className="text-muted-foreground hover:text-destructive flex items-center gap-2"
          >
            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            <span className="hidden sm:inline">{t("challenge.retry")}</span>
          </Button>
        )}
      </div>

      <Progress value={(completed || (isCloudComplete && !isPracticing)) ? 100 : progress} className="mb-8 h-2.5" />

      {(completed || (isCloudComplete && !isPracticing)) ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center mt-8">
          <p className="text-xl font-semibold text-success">
            {t("c8.success") || t("c8.complete")}
          </p>
          <div className="flex gap-4">
            <Button onClick={handleRetry} variant="outline" size="lg" disabled={isResetting}>
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("challenge.retry")}
            </Button>
            <Button onClick={() => onNavigate("landing")} size="lg">
              {t("challenge.home")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("c8.qNum")} {currentQ + 1} / {QUESTIONS.length}
            </p>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-foreground">
              {t(QUESTIONS[currentQ].scenarioKey)}
            </p>
          </div>

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