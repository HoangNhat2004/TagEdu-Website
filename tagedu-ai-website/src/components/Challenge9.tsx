import { useState, useEffect } from "react";
import { Rocket, Play, RefreshCw, Terminal, CheckCircle2, Circle, HelpCircle, FileCode, Check } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ChallengeProps {
  onNavigate: (view: any) => void;
}

const INITIAL_CODE = `# Mission: Ignite Thrusters
def calculateTrajectory():
    fuelLevel = 85
    destination = "Mars_Station_B"
    
    if fuelLevel > 50:
        print("System: Ready for Launch!")
        igniteThrusters(fuelLevel)
    else:
        print("Need more fuel, Explorer!")

# Your tasks:
# 1. Define fuelLevel
# 2. Assign a value between 0-100
# 3. Invoke calculateTrajectory()

`;

export default function Challenge9({ onNavigate }: ChallengeProps) {
  const { t } = useI18n();
  const [code, setCode] = useState(INITIAL_CODE);
  const [outputLines, setOutputLines] = useState<string[]>([
    "c9.term.init",
    "c9.term.check",
    "> ..."
  ]);
  const [velocity, setVelocity] = useState(0);
  const [fuelCapacity, setFuelCapacity] = useState(85);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation states
  const [hasFuelDefined, setHasFuelDefined] = useState(false);
  const [hasValidValue, setHasValidValue] = useState(false);
  const [hasInvoked, setHasInvoked] = useState(false);

  useEffect(() => {
    // Check validation dynamically as the user types
    // Xóa comment để kiểm tra logic chính xác
    const codeWithoutComments = code.replace(/#.*/g, "");

    const fuelDefinedMatch = codeWithoutComments.match(/fuelLevel\s*=/);
    setHasFuelDefined(!!fuelDefinedMatch);

    const valueMatch = codeWithoutComments.match(/fuelLevel\s*=\s*(\d+)/);
    let validVal = false;
    if (valueMatch) {
      const val = parseInt(valueMatch[1], 10);
      validVal = val >= 0 && val <= 100;
      if (validVal) setFuelCapacity(val);
    }
    setHasValidValue(validVal);

    // Kiểm tra xem hàm có được gọi sau khi định nghĩa không
    const parts = codeWithoutComments.split(/def\s+calculateTrajectory\(\):/);
    if (parts.length > 1) {
      setHasInvoked(parts[1].includes("calculateTrajectory()"));
    } else {
      setHasInvoked(false);
    }
  }, [code]);

  const handleRunCode = () => {
    // Reset trạng thái thành công trước đó
    setIsSuccess(false);
    setVelocity(0);
    
    // Xóa terminal cũ và in lại dòng log mới để user dễ nhìn thấy thay đổi
    setOutputLines([
      "c9.term.init",
      "c9.term.check",
      "> ...",
      "c9.term.exec"
    ]);

    if (hasFuelDefined && hasValidValue && hasInvoked) {
      setTimeout(() => {
        setOutputLines((prev) => [
          ...prev, 
          "c9.term.ready", 
          `c9.term.ignited___${fuelCapacity}`,
          "c9.term.success"
        ]);
        setVelocity(24000); // Set mock velocity
        setIsSuccess(true);
      }, 800);
    } else {
      setTimeout(() => {
        setOutputLines((prev) => [
          ...prev, 
          "c9.term.errMiss",
          hasInvoked ? "" : "c9.term.errInvoke",
          hasFuelDefined ? "" : "c9.term.errDefine",
        ].filter(Boolean));
      }, 500);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row pb-24">
      {/* LEFT PANEL: Mission Brief */}
      <div className="flex w-full flex-col gap-6 md:w-1/4">
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
            </div>
          </div>
        </div>

        {/* Legend / Hints */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              LEGEND .AI
            </span>
          </div>
          <div className="rounded border border-border bg-background p-4 text-sm text-muted-foreground">
            {t("c9.hintLabel")}
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1">
              {t("c9.hintBtn")}
            </Button>
            <Button variant="secondary" className="flex-1">
              {t("c9.solutionBtn")}
            </Button>
          </div>
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
            <Button variant="ghost" size="icon" onClick={() => setCode(INITIAL_CODE)}>
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
          <div className="flex h-32 flex-col gap-1 overflow-y-auto rounded bg-black/50 p-3 text-muted-foreground">
            {outputLines.map((lineStr, idx) => {
              let text = lineStr;
              if (lineStr.startsWith("c9.term.ignited___")) {
                text = t("c9.term.ignited").replace("{fuel}", lineStr.split("___")[1]);
              } else if (t(lineStr) !== lineStr) {
                text = t(lineStr);
              }

              const isError = lineStr.toLowerCase().includes("err") || lineStr.includes("Error");
              const isSuccess = lineStr.includes("success") || lineStr.includes("ready") || lineStr.includes("Success");

              return (
                <div 
                  key={idx} 
                  className={
                    isError ? "text-destructive" : 
                    isSuccess ? "text-success" : 
                    "text-primary/80"
                  }
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live View */}
      <div className="flex w-full flex-col gap-6 md:w-1/4">
        {/* Top Controls */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <span className="text-xs font-bold text-success">{t("c9.synced")}</span>
          </div>
          <Button onClick={handleRunCode} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Play className="h-4 w-4" />
            {t("c9.runCode")}
          </Button>
        </div>

        {/* Live View Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-widest text-muted-foreground">
              {t("c9.liveView")}
            </h3>
            <div className="flex gap-2">
               <RefreshCw className="h-4 w-4 text-muted-foreground" />
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
                <span>{fuelCapacity}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full bg-cyber-cyan transition-all duration-500"
                  style={{ width: `${fuelCapacity}%` }}
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
                Back to Mission Map
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
