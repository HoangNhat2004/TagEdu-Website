import { useState, useCallback, useEffect } from "react";
import { Check, Monitor, Cpu, ShieldCheck, Database, Globe, FileText, Music, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface SoftwareItem {
  id: string;
  name: string;
  icon: React.ElementType;
  category: string;
}

const ALL_ITEMS: SoftwareItem[] = [
  { id: "os", name: "OS", icon: Monitor, category: "system" },
  { id: "driver", name: "Driver", icon: Cpu, category: "system" },
  { id: "antivirus", name: "Antivirus", icon: ShieldCheck, category: "utility" },
  { id: "backup", name: "Backup", icon: Database, category: "utility" },
  { id: "browser", name: "Browser", icon: Globe, category: "application" },
  { id: "word", name: "Word", icon: FileText, category: "application" },
  { id: "spotify", name: "Spotify", icon: Music, category: "application" },
  { id: "email", name: "Email", icon: Mail, category: "application" },
];

const CATEGORIES = [
  { id: "system", title: "Phần mềm Hệ thống" },
  { id: "utility", title: "Phần mềm Tiện ích" },
  { id: "application", title: "Phần mềm Ứng dụng" },
];

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const Challenge7 = ({ onNavigate }: ChallengeProps) => {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const unplaced = ALL_ITEMS.filter((item) => !placed[item.id]);
  const isComplete = Object.keys(placed).length === ALL_ITEMS.length;

  // Tự động gọi API lưu tiến độ khi isComplete = true
  useEffect(() => {
    if (isComplete) {
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
            body: JSON.stringify({ challengeId: "challenge7" }),
          });
          console.log("Đã lưu tiến độ Thử thách 1 thành công!");
        } catch (error) {
          console.error("Lỗi khi lưu tiến độ:", error);
        }
      };

      saveProgress();
    }
  }, [isComplete]);

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

  const itemsInCategory = (catId: string) =>
    ALL_ITEMS.filter((item) => placed[item.id] === catId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
        Thử thách 1: Phân loại phần mềm
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Kéo mỗi phần mềm vào đúng loại của nó.
      </p>

      {isComplete ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-success bg-success/5 p-8 text-center">
          <p className="text-xl font-semibold text-success">
            🎉 Hoàn hảo! Bạn đã phân loại đúng tất cả phần mềm!
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setPlaced({})} variant="outline" size="lg">
              🔄 Làm lại ngay
            </Button>
            <Button onClick={() => onNavigate("landing")} size="lg">
              Về trang chủ
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Draggable items */}
          <div className="mb-8 flex flex-wrap gap-3">
            {unplaced.map((item) => {
              const Icon = item.icon;
              const isShaking = shakeId === item.id;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  className={`flex cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm select-none transition-colors active:cursor-grabbing ${
                    isShaking
                      ? "animate-shake border-destructive bg-destructive/5"
                      : "hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Drop zones */}
          <div className="grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(cat.id)}
                className="min-h-[180px] rounded-xl border-2 border-dashed border-border bg-secondary/40 p-4 transition-colors"
              >
                <h3 className="mb-3 text-center text-sm font-semibold text-foreground">
                  {cat.title}
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
                        <span className="text-sm font-medium">{item.name}</span>
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