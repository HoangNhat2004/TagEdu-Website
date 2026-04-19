import { useState, useEffect, useRef } from "react";
import { Rocket, Play, RefreshCw, Terminal, CheckCircle2, Circle, HelpCircle, FileCode, Check } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { InlineChatbot } from "./InlineChatbot";
import { toast } from "sonner";

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getInitialCode = (t: any) => `${t("c9.code.mission")}
def calculateTrajectory():
    fuelLevel = 85
    destination = "Mars_Station_B"
    
    if fuelLevel > 50:
        print("System: Ready for Launch!")
        igniteThrusters(fuelLevel)
    else:
        print("Need more fuel, Explorer!")

${t("c9.code.tasks")}
${t("c9.code.task1")}
${t("c9.code.task2")}
${t("c9.code.task3")}

`;

export default function Challenge9({ onNavigate }: ChallengeProps) {
  const { t } = useI18n();
  
  // Lấy ID người dùng để tạo key lưu trữ riêng biệt cho từng tài khoản
  const getStorageKey = () => {
    try {
      const userStr = localStorage.getItem("tagedu_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return `tagedu_c9_draft_code_${user.id}`;
      }
    } catch (e) {
      console.error("Error parsing user for storage key:", e);
    }
    return "tagedu_c9_draft_code_guest";
  };

  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem(getStorageKey());
    return savedCode || getInitialCode(t);
  });
  
  // Auto-save code to localStorage whenever it changes, scoped to the current user
  useEffect(() => {
    localStorage.setItem(getStorageKey(), code);
  }, [code]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const velocityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [velocity, setVelocity] = useState(0);
  const [fuelCapacity, setFuelCapacity] = useState(85);
  const [destination, setDestination] = useState("Mars_Station_B");
  const [hasFuelDefined, setHasFuelDefined] = useState(false);
  const [hasValidValue, setHasValidValue] = useState(false);
  const [hasValueMatch, setHasValueMatch] = useState(false);
  const [hasInvoked, setHasInvoked] = useState(false);
  const [hasDestination, setHasDestination] = useState(false);

  // Tự động cuộn lên đầu trang khi vào thử thách
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Khởi tạo terminal ban đầu để nhận đúng giá trị fuelCapacity
  useEffect(() => {
    if (outputLines.length === 0) {
      setOutputLines([
        "c9.term.init",
        `c9.term.check___${fuelCapacity}`,
        "> ..."
      ]);
    }
  }, [fuelCapacity, outputLines.length]);

  useEffect(() => {
    // Syncing indicator logic
    setIsSyncing(true);
    // 1. Dừng ngay bộ đếm vận tốc đang chạy ngầm (nếu có)
    if (velocityIntervalRef.current) {
      clearInterval(velocityIntervalRef.current);
      velocityIntervalRef.current = null;
    }
    // 2. HỦY NGAY tiến trình in Terminal của lần Run trước đó (Chống bug bóng ma)
    if (runTimeoutRef.current) {
      clearTimeout(runTimeoutRef.current);
      runTimeoutRef.current = null;
    }

    // Reset kết quả cũ ngay khi người dùng bắt đầu sửa code
    setIsSuccess(false);
    setIsRunning(false);
    setVelocity(0);

    const syncTimer = setTimeout(() => {
      setIsSyncing(false);
    }, 1000);

    // Check validation dynamically as the user types
    // 1. Tạo các phiên bản code đã làm sạch
    const codeWithoutComments = code.replace(/#.*/g, "").replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, "");
    // Thay thế chuỗi bằng placeholder có dấu cách để tránh việc ghép dính code lại với nhau
    const codeWithoutStrings = codeWithoutComments.replace(/(['"])(?:(?!\1|\\).|\\.)*?\1/g, " _STR_ "); 

    // 2. Kiểm tra fuelLevel (Sử dụng bản đã xóa cả chuỗi văn bản để an toàn tuyệt đối)
    const fuelDefinedMatch = codeWithoutStrings.match(/^[ \t]*fuelLevel[ \t]*=/m);
    setHasFuelDefined(!!fuelDefinedMatch);

    // Regex mới: Bắt buộc dòng phải kết thúc sau giá trị (chỉ cho phép khoảng trắng hoặc comment)
    const fuelMatches = Array.from(codeWithoutStrings.matchAll(/^[ \t]*fuelLevel[ \t]*=[ \t]*([ \t\-\+]*)(0(?!\d)|[1-9]\d*)(?:\.\d+)?[ \t]*(?:#.*)?$/gm));
    let validVal = false;
    let foundDigits = false;
    let currentFuel = 0;

    if (fuelMatches.length > 0) {
      const lastMatch = fuelMatches[fuelMatches.length - 1];
      foundDigits = true;
      const signs = lastMatch[1];
      const digits = lastMatch[0].split('=')[1].trim().replace(/^[ \t\-\+]+/, '');
      
      // Đếm số dấu trừ để xác định âm hay dương
      const minusCount = (signs.match(/-/g) || []).length;
      const val = parseFloat(digits) * (minusCount % 2 === 0 ? 1 : -1);
      
      validVal = val >= 0 && val <= 100;
      currentFuel = val;
      setFuelCapacity(val); 
    } else {
      setFuelCapacity(0);
    }
    setHasValidValue(validVal);
    setHasValueMatch(foundDigits);

    // Trình bày số ngắn gọn nếu quá dài để tránh vỡ UI
    const fuelDisplay = currentFuel.toString().length > 12 
      ? currentFuel.toString().substring(0, 10) + "..." 
      : currentFuel.toString();

    // Cập nhật terminal với giá trị CÔNG TÂM
    setOutputLines([
      "c9.term.init",
      `c9.term.check___${fuelDisplay}`,
      "> ..."
    ]);

    // 3. Bắt biến destination (Kiểm tra cú pháp nghiêm ngặt trước)
    // Bước A: Kiểm tra xem có đúng là CHỈ CÓ MỘT chuỗi hay không (dùng codeWithoutStrings)
    const destSyntaxMatch = codeWithoutStrings.match(/^[ \t]*destination[ \t]*=[ \t]*_STR_[ \t]*(?:#.*)?$/m);
    
    let destVal = "";
    if (destSyntaxMatch) {
      // Bước B: Nếu cú pháp chuẩn (chỉ 1 string), ta mới lấy giá trị thật từ bản code gốc (đã xóa comment)
      const destMatches = Array.from(codeWithoutComments.matchAll(/^[ \t]*destination[ \t]*=[ \t]*(['"])(.*?)\1[ \t]*(?:#.*)?$/gm));
      if (destMatches.length > 0) {
        destVal = destMatches[destMatches.length - 1][2];
      }
    }

    setDestination(destVal);
    setHasDestination(destVal !== "");

    // 4. Kiểm tra xem hàm có được gọi ở Global Scope (đầu dòng) và PHẢI SAU khi định nghĩa không
    // Sử dụng codeWithoutStrings để tránh bị lừa bởi văn bản trong print()
    const defMatch = codeWithoutStrings.match(/^[ \t]*def\s+calculateTrajectory\(\):[ \t]*(?:#.*)?$/m);
    const invokeMatch = codeWithoutStrings.match(/^[ \t]*calculateTrajectory\(\)[ \t]*(?:#.*)?$/m);
    
    if (defMatch && invokeMatch) {
      // Đảm bảo vị trí của lệnh gọi hàm lớn hơn vị trí của định nghĩa hàm
      setHasInvoked(invokeMatch.index! > defMatch.index!);
    } else {
      setHasInvoked(false);
    }

    return () => clearTimeout(syncTimer);
  }, [code]);

  // [MỚI] Tự động cuộn Terminal xuống đáy khi có dòng mới
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [outputLines]);

  // [MỚI] Lưu tiến độ khi hoàn thành thử thách
  useEffect(() => {
    if (isSuccess) {
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
            body: JSON.stringify({ challengeId: "challenge9" }),
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem("tagedu_token");
              localStorage.removeItem("tagedu_user");
              window.dispatchEvent(new Event("auth_change"));
            }
            throw new Error("Failed to save via API");
          }
          
          // Phát sự kiện để cập nhật lại Bản đồ nhiệm vụ và thanh tiến độ ngay lập tức
          window.dispatchEvent(new Event("auth_change"));
        } catch (error) {
          console.error("Lỗi khi lưu tiến độ:", error);
          toast.error(t("challenge.networkError"));
        }
      };
      saveProgress();
    }
  }, [isSuccess]);

  const handleRunCode = () => {
    if (isRunning) return;
    setIsRunning(true);

    // Hủy các tiến trình cũ
    if (velocityIntervalRef.current) clearInterval(velocityIntervalRef.current);
    if (runTimeoutRef.current) clearTimeout(runTimeoutRef.current);

    // Reset trạng thái
    setIsSuccess(false);
    setVelocity(0);
    
    // Xóa terminal cũ và in lại dòng log mới
    setOutputLines([
      "c9.term.init",
      `c9.term.check___${fuelCapacity}`,
      "> ...",
      "c9.term.exec"
    ]);

    if (hasFuelDefined && hasValidValue && hasInvoked && hasDestination) {
      if (fuelCapacity > 50) {
        runTimeoutRef.current = setTimeout(() => {
          setOutputLines((prev) => [
            ...prev, 
            "c9.term.ready", 
            `c9.term.ignited___${fuelCapacity}`,
            "c9.term.success"
          ]);
          setIsSuccess(true);
          setIsRunning(false);
          runTimeoutRef.current = null;
          
          // Tạo hiệu ứng tăng tốc dần dần
          const targetVelocity = fuelCapacity * 300;
          let currentVelocity = 0;
          const duration = 2000;
          const interval = 20;
          const step = targetVelocity / (duration / interval);
          
          velocityIntervalRef.current = setInterval(() => {
            currentVelocity += step;
            if (currentVelocity >= targetVelocity) {
              setVelocity(targetVelocity);
              if (velocityIntervalRef.current) clearInterval(velocityIntervalRef.current);
              velocityIntervalRef.current = null;
            } else {
              setVelocity(Math.floor(currentVelocity));
            }
          }, interval);
          
        }, 1500);
      } else {
        runTimeoutRef.current = setTimeout(() => {
          setOutputLines((prev) => [
            ...prev,
            "c9.term.needFuel",
            "c9.term.aborted"
          ]);
          setIsRunning(false);
          runTimeoutRef.current = null;
        }, 1500);
      }
    } else {
      runTimeoutRef.current = setTimeout(() => {
        setOutputLines((prev) => [
          ...prev, 
          "c9.term.errMiss",
          hasInvoked ? "" : "c9.term.errInvoke",
          destination ? "" : "c9.term.errTarget",
          hasFuelDefined 
            ? (hasValueMatch ? (hasValidValue ? "" : "c9.term.errValue") : "c9.term.errAssign") 
            : "c9.term.errDefine",
        ].filter(Boolean));
        setIsRunning(false);
        runTimeoutRef.current = null;
      }, 800);
    }
  };

  const resetLiveView = () => {
    // Dừng mọi tiến trình ngầm
    if (velocityIntervalRef.current) {
      clearInterval(velocityIntervalRef.current);
      velocityIntervalRef.current = null;
    }
    if (runTimeoutRef.current) {
      clearTimeout(runTimeoutRef.current);
      runTimeoutRef.current = null;
    }
    
    setIsSuccess(false);
    setIsRunning(false);
    setVelocity(0);
    // Không reset fuelCapacity và destination ở đây, 
    // vì chúng được binding trực tiếp (Live Telemetry) từ Code Editor.
    setOutputLines([
      "c9.term.init",
      `c9.term.check___${fuelCapacity}`,
      "> ..."
    ]);
  };

  // Hàm helper để render dòng terminal với tham số
  const renderTerminalLine = (line: string) => {
    if (line.includes("___")) {
      const [key, param] = line.split("___");
      return t(key).replace("{fuel}", param);
    }
    return t(line);
  };

  const destDisplay = destination.length > 15 
    ? destination.substring(0, 13) + "..." 
    : destination;

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 py-8 md:flex-row pb-24">
      {/* LEFT PANEL: Mission Brief & AI Assistant */}
      <div className="flex w-full flex-col gap-6 md:w-[360px] shrink-0 h-full overflow-hidden">
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-wide text-primary">
            {t("c9.title")}
          </h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-lg font-bold text-foreground">
              {t("c9.briefTitle")}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {t("c9.briefText")}
            </p>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                {hasFuelDefined ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t("c9.task1")}</span>
              </div>
              <div className="flex items-center gap-3">
                {hasValidValue ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t("c9.task2")}</span>
              </div>
              <div className="flex items-center gap-3">
                {hasInvoked ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t("c9.task3")}</span>
              </div>
              <div className="flex items-center gap-3">
                {hasDestination ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t("c9.task4")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Chatbot Inline (Replacing old LEGEND.AI) */}
        <div className="flex h-[500px] w-full shrink-0">
          <InlineChatbot currentView="challenge9" />
        </div>
      </div>

      {/* MIDDLE PANEL: Code Editor */}
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg md:w-1/2">
        {/* Editor Header */}
        <div className="flex items-center justify-between border-b border-border bg-background/50 px-4 py-2">
          <div className="flex items-center gap-2 border-b-2 border-primary px-3 py-1">
            <FileCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">main.py</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCode(getInitialCode(t))}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-auto bg-[#282c34]">
          <CodeMirror
            value={code}
            height="400px"
            theme={oneDark}
            extensions={[python()]}
            onChange={(value) => setCode(value)}
            className="text-sm"
          />
        </div>

        {/* Output Terminal */}
        <div className="border-t border-border bg-background/80 p-4 font-mono text-sm">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs font-bold tracking-wider">
            <Terminal className="h-4 w-4" />
            {t("c9.term.title")}
          </div>
          <div ref={terminalRef} className="flex h-32 flex-col gap-1 overflow-y-auto rounded bg-black/50 p-3 custom-scrollbar">
            {outputLines.map((line, idx) => (
              <div 
                key={idx} 
                className={
                  line.includes('err') || line.includes('aborted') ? 'text-destructive' : 
                  line.includes('success') || line.includes('ready') ? 'text-success' : 
                  'text-primary/80'
                }
              >
                {renderTerminalLine(line)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live View */}
      <div className="flex w-full flex-col gap-6 md:w-1/4">
        {/* Top Controls */}
        <div className="flex items-center justify-end gap-4">
          {isSyncing ? (
            <div className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 transition-all duration-300">
              <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-xs font-bold text-yellow-500">{t("c9.syncing")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 transition-all duration-300">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span className="text-xs font-bold text-success">{t("c9.synced")}</span>
            </div>
          )}
          <Button 
            onClick={handleRunCode} 
            disabled={isRunning}
            className={`gap-2 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? t("c9.syncing") : t("c9.runCode")}
          </Button>
        </div>

        {/* Live View Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-widest text-muted-foreground">
              {t("c9.liveView")}
            </h3>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" onClick={resetLiveView} className="h-8 w-8 hover:bg-background/50">
                 <RefreshCw className="h-4 w-4 text-muted-foreground" />
               </Button>
            </div>
          </div>

          <div className="relative mb-auto flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-background to-background/50 border border-border p-6 shadow-inner">
            {/* The Rocket Image - we use a large Lucide icon but style it to look cool */}
            <div className="relative flex flex-col items-center justify-center">
              {isSuccess && (
                <div className="absolute -bottom-4 z-0 h-16 w-16 animate-pulse rounded-full bg-orange-500/50 blur-xl"></div>
              )}
              <Rocket 
                className={`relative z-10 ${isSuccess ? 'animate-bounce text-orange-400' : 'text-primary'} p-2 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]`} 
                size={120} 
                strokeWidth={1.5}
              />
              <div className="mt-4 h-2 w-24 rounded-full bg-border shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 space-y-5">
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.target")}</span>
                <span className="text-cyan-400 truncate max-w-[120px] text-right">
                  {destDisplay || t("c9.unknown")}
                </span>
              </div>
              <div className="h-px w-full bg-border" />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.velocity")}</span>
                <span>{velocity} KM/S</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-in-out"
                  style={{ width: `${Math.min(100, (velocity / 30000) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.fuelCapacity")}</span>
                <span className={hasValidValue ? "text-cyan-400" : "text-destructive animate-pulse"}>
                  {fuelCapacity}% {!hasValidValue && "(!)"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all duration-500 ${hasValidValue ? 'bg-cyber-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, fuelCapacity))}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {isSuccess && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="font-bold">{t("c9.success")}</span>
              </div>
              <Button onClick={() => onNavigate("landing")} variant="outline" size="sm" className="w-full">
                {t("c9.backToMap")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
