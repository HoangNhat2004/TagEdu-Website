import { useState, useEffect } from "react";
import { BarChart3, MessageSquare, Trophy, Brain, Compass, Code, Loader2, Sparkles, Award, BookOpen, Repeat, GitBranch } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface HintDistribution {
  conceptual: number;
  directional: number;
  syntax: number;
}

interface CompletedChallenge {
  challengeId: string;
  completedAt: string;
}

interface AnalyticsData {
  totalMessages: number;
  hintDistribution: HintDistribution;
  totalHints: number;
  completedChallenges: CompletedChallenge[];
  completedCount: number;
  totalChallengesAttempted: number;
  age: number | null;
  ageBand: string | null;
  fullName: string;
}

// Map challenge IDs to friendly names (matching ChallengesSection.tsx)
const CHALLENGE_NAMES: Record<string, { en: string; vi: string }> = {
  challenge1: { en: "Galactic Variables", vi: "Biến Thiên Hà" },
  challenge2: { en: "Looping Asteroids", vi: "Lượn Qua Tiểu Hành Tinh" },
  challenge3: { en: "Conditional Comets", vi: "Sao Chổi Điều Kiện" },
};

// CSTA K-12 CS Standards mapping for each challenge
interface CSTAStandard {
  code: string;
  en: string;
  vi: string;
  icon: React.ElementType;
}

const CSTA_MAPPING: Record<string, CSTAStandard[]> = {
  challenge1: [
    { code: "1B-CS-02", en: "Model how computer hardware and software work together as a system", vi: "Mô hình hóa cách phần cứng và phần mềm máy tính hoạt động cùng nhau", icon: BookOpen },
    { code: "1B-CS-03", en: "Determine potential solutions to solve simple hardware and software problems", vi: "Xác định các giải pháp tiềm năng cho vấn đề phần cứng và phần mềm", icon: Brain },
  ],
  challenge2: [
    { code: "1B-AP-10", en: "Create programs using sequences of commands and events", vi: "Thiết lập chương trình với các lệnh tuần tự và sự kiện", icon: Repeat },
    { code: "1B-AP-11", en: "Decompose problems into subproblems (selecting functional modules)", vi: "Phân rã bài toán lớn thành các phần nhỏ (chọn module chức năng)", icon: Brain },
  ],
  challenge3: [
    { code: "1B-AP-10", en: "Create programs that include sequences, events, loops, and conditionals", vi: "Tạo chương trình bao gồm trình tự, sự kiện, vòng lặp và điều kiện", icon: GitBranch },
    { code: "1B-AP-12", en: "Modify, remix, or incorporate portions of an existing program", vi: "Chỉnh sửa, kết hợp hoặc tích hợp các phần của chương trình hiện có", icon: Code },
    { code: "1B-AP-15", en: "Test and debug a program or algorithm to ensure it runs as intended", vi: "Kiểm thử và gỡ lỗi chương trình hoặc thuật toán", icon: Compass },
  ],
};

const TOTAL_CHALLENGES = 3;

interface AnalyticsDashboardProps {
  childId?: number | string;
}

export function AnalyticsDashboard({ childId }: AnalyticsDashboardProps) {
  const { t, language } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [childId]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("tagedu_token");

    try {
      const url = childId 
        ? `${API_URL}/users/analytics?language=${language}&childId=${childId}`
        : `${API_URL}/users/analytics?language=${language}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || t("analytics.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-gray-400 text-sm">{t("analytics.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{error || t("analytics.error")}</p>
      </div>
    );
  }

  const completionPercent = Math.round((data.completedCount / TOTAL_CHALLENGES) * 100);

  // Hint chart data
  const hintTotal = data.totalHints || 1; // avoid division by zero
  const hintBars = [
    { key: "conceptual", label: t("analytics.conceptual"), count: data.hintDistribution.conceptual, color: "#06b6d4", icon: Brain },
    { key: "directional", label: t("analytics.directional"), count: data.hintDistribution.directional, color: "#a855f7", icon: Compass },
    { key: "syntax", label: t("analytics.syntax"), count: data.hintDistribution.syntax, color: "#f59e0b", icon: Code },
  ];

  // Age band color
  const ageBandColor = data.ageBand === "5-8" ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
    : data.ageBand === "9-12" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : data.ageBand === "13+" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : "text-gray-400 bg-gray-500/10 border-gray-500/20";

  return (
    <div className="space-y-5 pb-2">
      {/* === TOP STATS CARDS === */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Messages */}
        <div className="rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-transparent p-4 transition-all hover:border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">{t("analytics.totalMessages")}</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalMessages}</p>
        </div>

        {/* Completed Challenges */}
        <div className="rounded-xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">{t("analytics.challengesCompleted")}</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {data.completedCount}<span className="text-sm text-gray-500 font-normal">/{TOTAL_CHALLENGES}</span>
          </p>
        </div>
      </div>

      {/* === PROGRESS BAR === */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> {t("analytics.missionProgress")}
          </span>
          <span className="text-xs font-bold text-cyan-400">{completionPercent}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${completionPercent}%`,
              background: 'linear-gradient(90deg, #06b6d4, #a855f7, #f59e0b)',
            }}
          />
        </div>
        {/* Challenge badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[1, 2, 3].map((num) => {
            const cId = `challenge${num}`;
            const isCompleted = data.completedChallenges.some(c => c.challengeId === cId);
            const name = CHALLENGE_NAMES[cId]?.[language] || cId;
            return (
              <span
                key={cId}
                title={name}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                  isCompleted
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/5 text-gray-500 border-white/5"
                }`}
              >
                {isCompleted ? "✓" : "○"} {num}
              </span>
            );
          })}
        </div>
      </div>

      {/* === AI HINT ANALYSIS === */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-medium text-gray-300">{t("analytics.hintAnalysis")}</span>
          {data.totalHints > 0 && (
            <span className="ml-auto text-[10px] text-gray-500">
              {t("analytics.totalHints")}: {data.totalHints}
            </span>
          )}
        </div>

        {data.totalHints === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">{t("analytics.noHints")}</p>
        ) : (
          <div className="space-y-2.5">
            {hintBars.map((bar) => {
              const percent = Math.round((bar.count / hintTotal) * 100);
              return (
                <div key={bar.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <bar.icon className="h-3.5 w-3.5" style={{ color: bar.color }} />
                      {bar.label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: bar.color }}>
                      {bar.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: bar.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === CSTA STANDARDS MAPPING === */}
      {data.completedCount > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-gray-300">{t("analytics.cstaTitle")}</span>
            <span className="ml-auto text-[10px] text-gray-500">{t("analytics.cstaSubtitle")}</span>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((num) => {
              const cId = `challenge${num}`;
              const isCompleted = data.completedChallenges.some(c => c.challengeId === cId);
              const standards = CSTA_MAPPING[cId] || [];
              const challengeName = CHALLENGE_NAMES[cId]?.[language] || cId;

              if (!isCompleted) return null;

              return (
                <div key={cId} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ {challengeName}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {standards.map((std) => (
                      <div key={std.code} className="flex items-start gap-2 group">
                        <std.icon className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono text-amber-400/80 mr-1.5">{std.code}</span>
                          <span className="text-[11px] text-gray-400">{language === 'vi' ? std.vi : std.en}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === AGE BAND INFO === */}
      {data.age && data.ageBand && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t("analytics.aiPersonalization")}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${ageBandColor}`}>
              {t("analytics.ageBand")}: {data.ageBand}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">{t("analytics.ageBandDesc")}</p>
        </div>
      )}
    </div>
  );
}

