import { useState, useCallback, useEffect, useRef } from "react";
import { Check, Monitor, Cpu, ShieldCheck, Database, Globe, FileText, Music, Mail, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface SoftwareItem {
  id: string;
  nameKey: string;
  icon: React.ElementType;
  category: string;
}

const ALL_ITEMS: SoftwareItem[] = [
  { id: "os", nameKey: "c7.os", icon: Monitor, category: "system" },
  { id: "driver", nameKey: "c7.driver", icon: Cpu, category: "system" },
  { id: "antivirus", nameKey: "c7.antivirus", icon: ShieldCheck, category: "utility" },
  { id: "backup", nameKey: "c7.backup", icon: Database, category: "utility" },
  { id: "browser", nameKey: "c7.browser", icon: Globe, category: "application" },
  { id: "word", nameKey: "c7.word", icon: FileText, category: "application" },
  { id: "spotify", nameKey: "c7.spotify", icon: Music, category: "application" },
  { id: "email", nameKey: "c7.email", icon: Mail, category: "application" },
];

const CATEGORIES = [
  { id: "system", titleKey: "c7.sys" },
  { id: "utility", titleKey: "c7.util" },
  { id: "application", titleKey: "c7.app" },
];

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const Challenge7 = ({ onNavigate }: ChallengeProps) => {
  const { t } = useI18n();

  // Hàm tạo key lưu trữ riêng theo từng User
  const getStorageKey = () => {
    try {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return `tagedu_c1_placed_${user.id}`;
      }
    } catch (e) {}
    return "tagedu_c1_placed_guest";
  };

  const [placed, setPlaced] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(getStorageKey());
    return saved ? JSON.parse(saved) : {};
  });

  const [shakeId, setShakeId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [highlightedCat, setHighlightedCat] = useState<string | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [isCloudComplete, setIsCloudComplete] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Refs để dùng trong native touch listeners
  const activeTouchItemId = useRef<string | null>(null);
  const dragCloneRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unplaced = ALL_ITEMS.filter((item) => !placed[item.id]);

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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const challengeProgress = data.find((p: any) => p.challenge_id === "challenge7");
          
          if (challengeProgress) {
            if (challengeProgress.is_completed) {
              setIsCloudComplete(true);
            }

            if (challengeProgress.draft_data !== null) {
              setIsPracticing(true); 
              const cloudDraft = JSON.parse(challengeProgress.draft_data);
              setPlaced(cloudDraft);
            } else {
              // Nếu cloud trống thì reset local luôn để tránh dữ liệu cũ từ khách
              setPlaced({});
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
    localStorage.setItem(getStorageKey(), JSON.stringify(placed));
    const token = localStorage.getItem("tagedu_token");
    
    // [SỬA] Cho phép đồng bộ ngay cả khi rỗng nếu đang thực hành (isPracticing)
    if (isLoadingCloud || !token || (Object.keys(placed).length === 0 && !isPracticing)) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/progress/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            challengeId: "challenge7", 
            draftData: JSON.stringify(placed) 
          }),
        });
      } catch (error) {
        console.error("Error saving draft to cloud:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [placed, isLoadingCloud, isPracticing]);

  const isComplete = ALL_ITEMS.every((item) => placed[item.id]);

  // Lưu tiến độ khi hoàn thành
  useEffect(() => {
    if (isComplete) {
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
            body: JSON.stringify({ challengeId: "challenge7" }),
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
  }, [isComplete]);

  const handleRetry = async () => {
    if (isResetting) return;
    setIsResetting(true);

    try {
      setPlaced({});
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
          body: JSON.stringify({ challengeId: "challenge7" }),
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = useCallback(
    (categoryId: string) => {
      if (!draggedId) return;
      const item = ALL_ITEMS.find((i) => i.id === draggedId);
      if (!item) return;

      if (item.category === categoryId) {
        setPlaced((prev) => ({ ...prev, [item.id]: categoryId }));
      } else {
        setShakeId(item.id);
        setTimeout(() => setShakeId(null), 400);
      }
      setDraggedId(null);
    },
    [draggedId]
  );

  // Mobile Touch Listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getCategoryAtPoint = (x: number, y: number): string | null => {
      if (dragCloneRef.current) dragCloneRef.current.style.display = "none";
      const el = document.elementFromPoint(x, y);
      if (dragCloneRef.current) dragCloneRef.current.style.display = "";
      return el?.closest("[data-category]")?.getAttribute("data-category") ?? null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest("[data-item-id]");
      if (!target) return;
      e.preventDefault();

      const itemId = target.getAttribute("data-item-id")!;
      activeTouchItemId.current = itemId;

      const rect = target.getBoundingClientRect();
      const clone = target.cloneNode(true) as HTMLDivElement;
      clone.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        pointer-events: none;
        opacity: 0.85;
        z-index: 9999;
        transform: scale(1.05);
      `;
      document.body.appendChild(clone);
      dragCloneRef.current = clone;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!activeTouchItemId.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (dragCloneRef.current) {
        const w = dragCloneRef.current.offsetWidth;
        const h = dragCloneRef.current.offsetHeight;
        dragCloneRef.current.style.left = `${touch.clientX - w / 2}px`;
        dragCloneRef.current.style.top = `${touch.clientY - h / 2}px`;
      }
      setHighlightedCat(getCategoryAtPoint(touch.clientX, touch.clientY));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!activeTouchItemId.current) return;
      if (dragCloneRef.current) {
        document.body.removeChild(dragCloneRef.current);
        dragCloneRef.current = null;
      }
      setHighlightedCat(null);

      const touch = e.changedTouches[0];
      const cat = getCategoryAtPoint(touch.clientX, touch.clientY);
      const item = ALL_ITEMS.find((i) => i.id === activeTouchItemId.current);

      if (item && cat) {
        if (item.category === cat) {
          setPlaced((prev) => ({ ...prev, [item.id]: cat }));
        } else {
          setShakeId(item.id);
          setTimeout(() => setShakeId(null), 400);
        }
      }
      activeTouchItemId.current = null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [unplaced.length]);

  const itemsInCategory = (catId: string) =>
    ALL_ITEMS.filter((item) => placed[item.id] === catId);

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
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24" ref={containerRef}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {t("c7.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("c7.desc")}
          </p>
        </div>
        {(Object.keys(placed).length > 0 || isCloudComplete) && (
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

      {(isComplete || (isCloudComplete && !isPracticing)) ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center mt-8">
          <p className="text-xl font-semibold text-success">
            {t("c7.success")}
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
          <div className="mb-8 flex flex-wrap gap-3">
            {unplaced.map((item) => {
              const Icon = item.icon;
              const isShaking = shakeId === item.id;
              return (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className={`flex cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm select-none transition-colors active:cursor-grabbing touch-none ${
                    isShaking
                      ? "animate-shake border-destructive bg-destructive/5"
                      : "hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t(item.nameKey)}</span>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                data-category={cat.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(cat.id)}
                className={`min-h-[180px] rounded-xl border-2 border-dashed p-4 transition-colors ${
                  highlightedCat === cat.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/40"
                }`}
              >
                <h3 className="mb-3 text-center text-sm font-semibold text-foreground">
                  {t(cat.titleKey)}
                </h3>
                <div className="space-y-2">
                  {itemsInCategory(cat.id).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/5 px-3 py-2"
                      >
                        <Icon className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">{t(item.nameKey)}</span>
                        <Check className="ml-auto h-4 w-4 text-success" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Challenge7;