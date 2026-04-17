import { useState, useCallback, useEffect, useRef } from "react";
import { Check, Monitor, Cpu, ShieldCheck, Database, Globe, FileText, Music, Mail } from "lucide-react";
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
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [highlightedCat, setHighlightedCat] = useState<string | null>(null);

  // Refs để dùng trong native event listeners (tránh stale closure)
  const activeTouchItemId = useRef<string | null>(null);
  const dragCloneRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unplaced = ALL_ITEMS.filter((item) => !placed[item.id]);
  const isComplete = Object.keys(placed).length === ALL_ITEMS.length;

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
          if (!res.ok) throw new Error("Failed to save via API");
        } catch (error) {
          console.error("Lỗi khi lưu tiến độ:", error);
          toast.error("Không thể lưu tiến trình. Xin kiểm tra kết nối mạng!");
        }
      };
      saveProgress();
    }
  }, [isComplete]);

  // ── Desktop drag handlers ──────────────────────────────────────────────────
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

  // ── Mobile: native touch listeners với { passive: false } ─────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getCategoryAtPoint = (x: number, y: number): string | null => {
      // Tạm ẩn clone để elementFromPoint xuyên qua được
      if (dragCloneRef.current) dragCloneRef.current.style.display = "none";
      const el = document.elementFromPoint(x, y);
      if (dragCloneRef.current) dragCloneRef.current.style.display = "";
      return el?.closest("[data-category]")?.getAttribute("data-category") ?? null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest("[data-item-id]");
      if (!target) return;

      // preventDefault hợp lệ vì listener được đăng ký với { passive: false }
      e.preventDefault();

      const itemId = target.getAttribute("data-item-id")!;
      activeTouchItemId.current = itemId;

      // Tạo clone theo ngón tay
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
      // Không gọi preventDefault ở touchend (cancelable=false khi đang scroll)
      if (!activeTouchItemId.current) return;

      // Dọn clone
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

    // { passive: false } cho phép gọi preventDefault() bên trong
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [unplaced.length]); // re-attach khi số item thay đổi

  // ── Render ─────────────────────────────────────────────────────────────────
  const itemsInCategory = (catId: string) =>
    ALL_ITEMS.filter((item) => placed[item.id] === catId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24" ref={containerRef}>
      <h2 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
        {t("c7.title")}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("c7.desc")}
      </p>

      {isComplete ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center">
          <p className="text-xl font-semibold text-success">
            {t("c7.success")}
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setPlaced({})} variant="outline" size="lg">
              {t("c7.retry")}
            </Button>
            <Button onClick={() => onNavigate("landing")} size="lg">
              {t("c7.home")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Draggable items — data-item-id để native listener nhận diện */}
          <div className="mb-8 flex flex-wrap gap-3">
            {unplaced.map((item) => {
              const Icon = item.icon;
              const isShaking = shakeId === item.id;
              return (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
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

          {/* Drop zones — data-category để getCategoryAtPoint nhận diện */}
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