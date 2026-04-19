import { useState, useEffect, useRef } from "react";
import { Rocket, Play, RefreshCw, Terminal, CheckCircle2, Circle, FileCode, Check, Loader2, RotateCcw } from "lucide-react";
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
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [isCloudComplete, setIsCloudComplete] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  // Tải dữ liệu từ Cloud
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
          const challengeProgress = data.find((p: any) => p.challenge_id === "challenge9");
          
          if (challengeProgress) {
            if (challengeProgress.is_completed) {
              setIsCloudComplete(true);
            }

            // [HÀNH ĐỘNG] Chỉ ghi đè code từ cloud nếu KHÔNG đang chạy simulation hoặc thành công
            // Điều này chặn việc race condition khi vừa thắng xong bị cloud sync ngược lại code cũ
            if (challengeProgress.draft_data !== null && !isSuccess && !isRunning) {
              setIsPracticing(true);
              const cloudDraft = challengeProgress.draft_data;
              // Nếu là Reset ('{}'), khôi phục code ban đầu để đồng bộ
              if (cloudDraft === "{}" || cloudDraft === "") {
                if (code !== getInitialCode(t)) setCode(getInitialCode(t));
              } else {
                if (code !== cloudDraft) setCode(cloudDraft);
              }
            } else if (challengeProgress.draft_data === null && !isSuccess && !isRunning) {
              // Nếu cloud trống và không trong trạng thái quan trọng thì reset local
              setCode(getInitialCode(t));
              setIsPracticing(false);
            }
          } else if (!isSuccess && !isRunning) {
            // Trường hợp không tìm thấy progress (user mới)
            setCode(getInitialCode(t));
            setIsPracticing(false);
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

  // Sync code to Cloud khi có thay đổi
  useEffect(() => {
    localStorage.setItem(getStorageKey(), code);
    const token = localStorage.getItem("tagedu_token");
    
    // Cho phép đồng bộ ngay cả khi là code ban đầu nếu đang thực hành (để đồng bộ Reset)
    if (isLoadingCloud || !token || isSuccess || (code === getInitialCode(t) && !isPracticing)) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/progress/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ challengeId: "challenge9", draftData: code }),
        });
      } catch (error) {
        console.error("Error saving draft to cloud:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [code, isSuccess, isLoadingCloud, isPracticing]);

  // Telemetry logic
  useEffect(() => {
    setIsSyncing(true);
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

    const syncTimer = setTimeout(() => {
      setIsSyncing(false);
    }, 1000);

    const codeWithoutComments = code.replace(/#.*/g, "").replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, "");
    const codeWithoutStrings = codeWithoutComments.replace(/(['"])(?:(?!\1|\\).|\\.)*?\1/g, " _STR_ "); 

    const fuelDefinedMatch = codeWithoutStrings.match(/^[ \t]*fuelLevel[ \t]*=/m);
    setHasFuelDefined(!!fuelDefinedMatch);

    const fuelMatches = Array.from(codeWithoutStrings.matchAll(/^[ \t]*fuelLevel[ \t]*=[ \t]*([ \t\-\+]*)(0(?!\d)|[1-9]\d*)(?:\.\d+)?[ \t]*(?:#.*)?$/gm));
    let validVal = false;
    let foundDigits = false;
    let currentFuel = 0;

    if (fuelMatches.length > 0) {
      const lastMatch = fuelMatches[fuelMatches.length - 1];
      foundDigits = true;
      const signs = lastMatch[1];
      const digits = lastMatch[0].split('=')[1].trim().replace(/^[ \t\-\+]+/, '');
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

    const fuelDisplay = currentFuel.toString().length > 12 
      ? currentFuel.toString().substring(0, 10) + "..." 
      : currentFuel.toString();

    setOutputLines([
      "c9.term.init",
      `c9.term.check___${fuelDisplay}`,
      "> ..."
    ]);

    const destSyntaxMatch = codeWithoutStrings.match(/^[ \t]*destination[ \t]*=[ \t]*_STR_[ \t]*(?:#.*)?$/m);
    let destVal = "";
    if (destSyntaxMatch) {
      const destMatches = Array.from(codeWithoutComments.matchAll(/^[ \t]*destination[ \t]*=[ \t]*(['"])(.*?)\1[ \t]*(?:#.*)?$/gm));
      if (destMatches.length > 0) {
        destVal = destMatches[destMatches.length - 1][2];
      }
    }
    setDestination(destVal);
    setHasDestination(destVal !== "");

    const defMatch = codeWithoutStrings.match(/^[ \t]*def\s+calculateTrajectory\(\):[ \t]*(?:#.*)?$/m);
    const invokeMatch = codeWithoutStrings.match(/^[ \t]*calculateTrajectory\(\)[ \t]*(?:#.*)?$/m);
    if (defMatch && invokeMatch) {
      setHasInvoked(invokeMatch.index! > defMatch.index!);
    } else {
      setHasInvoked(false);
    }

    return () => clearTimeout(syncTimer);
  }, [code]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [outputLines]);

  // Complete status sync
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
          if (res.ok) {
            setIsPracticing(false);
            setIsCloudComplete(true);
            window.dispatchEvent(new Event("auth_change"));
          }
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      };
      saveProgress();
    }
  }, [isSuccess]);

  const handleRunCode = () => {
    if (isRunning) return;
    setIsRunning(true);

    if (velocityIntervalRef.current) clearInterval(velocityIntervalRef.current);
    if (runTimeoutRef.current) clearTimeout(runTimeoutRef.current);

    setIsSuccess(false);
    setVelocity(0);
    
    setOutputLines(["c9.term.init", `c9.term.check___${fuelCapacity}`, "> ...", "c9.term.exec"]);

    if (hasFuelDefined && hasValidValue && hasInvoked && hasDestination) {
      if (fuelCapacity > 50) {
        runTimeoutRef.current = setTimeout(() => {
          setOutputLines((prev) => [...prev, "c9.term.ready", `c9.term.ignited___${fuelCapacity}`, "c9.term.success"]);
          setIsSuccess(true);
          setIsRunning(false);
          runTimeoutRef.current = null;
          
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
          setOutputLines((prev) => [...prev, "c9.term.needFuel", "c9.term.aborted"]);
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
          hasFuelDefined ? (hasValueMatch ? (hasValidValue ? "" : "c9.term.errValue") : "c9.term.errAssign") : "c9.term.errDefine",
        ].filter(Boolean));
        setIsRunning(false);
        runTimeoutRef.current = null;
      }, 800);
    }
  };

  const handleResetCode = async () => {
    setCode(getInitialCode(t));
    setIsSuccess(false);
    setIsPracticing(true);
    handleResetSimulation();
    localStorage.removeItem(getStorageKey());

    const token = localStorage.getItem("tagedu_token");
    if (token) {
      try {
        await fetch(`${API_URL}/progress/reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ challengeId: "challenge9" }),
        });
        // [SILENT] No toast for code-only reset
      } catch (error) {
        console.error("Error silently resetting progress:", error);
      }
    }
  };


  const renderTerminalLine = (line: string) => {
    if (line.includes("___")) {
      const [key, param] = line.split("___");
      return t(key).replace("{fuel}", param);
    }
    return t(line);
  };

  const handleResetSimulation = () => {
    setIsRunning(false);
    setIsSuccess(false);
    setVelocity(0);
    // Reset terminal to initial state
    setOutputLines([
      "c9.term.init",
      `c9.term.check___${fuelCapacity}`,
      "> ..."
    ]);
    if (velocityIntervalRef.current) clearInterval(velocityIntervalRef.current);
    if (runTimeoutRef.current) clearTimeout(runTimeoutRef.current);
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

  const destDisplay = destination.length > 15 ? destination.substring(0, 13) + "..." : destination;

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 py-8 md:flex-row pb-24">
      <div className="flex w-full flex-col gap-6 md:w-[360px] shrink-0 h-full overflow-hidden">
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-wide text-primary">{t("c9.title")}</h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-lg font-bold text-foreground">{t("c9.briefTitle")}</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{t("c9.briefText")}</p>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
              {[
                { label: "c9.task1", checked: hasFuelDefined },
                { label: "c9.task2", checked: hasValidValue },
                { label: "c9.task3", checked: hasInvoked },
                { label: "c9.task4", checked: hasDestination }
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3">
                  {task.checked ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  <span className="text-sm font-medium">{t(task.label)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex h-[500px] w-full shrink-0">
          <InlineChatbot currentView="challenge3" />
        </div>
      </div>

      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg md:w-1/2">
        <div className="flex items-center justify-between border-b border-border bg-background/50 px-4 py-2">
          <div className="flex items-center gap-2 border-b-2 border-primary px-3 py-1">
            <FileCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">main.py</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetCode}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title={t("challenge.retry")}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-[#282c34]">
          <CodeMirror value={code} height="400px" theme={oneDark} extensions={[python()]} onChange={(val) => setCode(val)} className="text-sm" />
        </div>
        <div className="border-t border-border bg-background/80 p-4 font-mono text-sm theme-terminal">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs font-bold tracking-wider">
            <Terminal className="h-4 w-4" /> {t("c9.term.title")}
          </div>
          <div ref={terminalRef} className="flex h-32 flex-col gap-1 overflow-y-auto rounded bg-black/50 p-3 custom-scrollbar">
            {outputLines.map((l, i) => (
              <div key={i} className={l.includes('err') || l.includes('aborted') ? 'text-destructive' : l.includes('success') || l.includes('ready') ? 'text-success' : 'text-primary/80'}>
                {renderTerminalLine(l)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 md:w-1/4">
        <div className="flex items-center justify-end gap-4">
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-300 ${isSyncing ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-success/30 bg-success/10 text-success'}`}>
            <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-success'}`}></div>
            <span className="text-xs font-bold">{isSyncing ? t("challenge.syncing") : t("challenge.synced")}</span>
          </div>
          <Button onClick={handleRunCode} disabled={isRunning} className={`gap-2 ${isRunning ? 'opacity-50' : 'bg-primary'} text-primary-foreground`}>
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? t("challenge.syncing") : t("c9.runCode")}
          </Button>
        </div>

        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-widest text-muted-foreground">{t("c9.liveView")}</h3>
            <Button variant="ghost" size="icon" onClick={handleResetSimulation} disabled={isResetting} className="text-muted-foreground hover:text-primary">
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          <div className="relative mb-auto flex flex-1 items-center justify-center rounded-xl bg-background/50 border border-border/50 p-6 min-h-[200px]">
            <div className="relative flex flex-col items-center justify-center">
              {isSuccess && <div className="absolute -bottom-4 z-0 h-16 w-16 animate-pulse rounded-full bg-orange-500/20 blur-xl"></div>}
              <Rocket className={`relative z-10 ${isSuccess ? 'animate-bounce text-orange-400' : 'text-primary'}`} size={120} strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.target")}</span>
                <span className="text-cyan-400 truncate max-w-[120px] text-right">{destDisplay || t("c9.unknown")}</span>
              </div>
              <div className="h-px w-full bg-border" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.velocity")}</span><span>{velocity} KM/S</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all duration-1000 ease-in-out" style={{ width: `${Math.min(100, (velocity / 30000) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold tracking-wider text-muted-foreground">
                <span>{t("c9.fuelCapacity")}</span>
                <span className={hasValidValue ? "text-cyan-400" : "text-destructive"}>{fuelCapacity}% {!hasValidValue && "(!)"}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className={`h-full transition-all duration-500 ${hasValidValue ? 'bg-cyan-400' : 'bg-destructive'}`} style={{ width: `${Math.min(100, Math.max(0, fuelCapacity))}%` }}></div>
              </div>
            </div>
          </div>
          
          {isSuccess && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 bg-success/5 p-4 rounded-xl border border-success/20">
              <div className="flex items-center gap-2 text-success uppercase tracking-widest text-xs font-bold">
                <Check className="h-5 w-5" /> {t("c9.success")}
              </div>
              <div className="flex w-full mt-2">
                <Button onClick={() => onNavigate("landing")} size="sm" className="w-full">
                  {t("challenge.home")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
