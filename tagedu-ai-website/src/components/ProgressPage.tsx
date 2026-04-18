import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Clock, Lock, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function ProgressPage() {
  const { t } = useI18n();
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem("tagedu_token");
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const progressMap: Record<string, boolean> = {};
          data.forEach((item: any) => {
            if (item.is_completed) progressMap[item.challenge_id] = true;
          });
          setCompletedChallenges(progressMap);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("tagedu_token");
          localStorage.removeItem("tagedu_user");
          window.dispatchEvent(new Event("auth_change"));
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    };

    fetchProgress();
    window.addEventListener("auth_change", fetchProgress);
    return () => window.removeEventListener("auth_change", fetchProgress);
  }, []);

  const totalMissions = 3;
  const completedCount = Object.keys(completedChallenges).length;
  const activeCount = Math.min(1, totalMissions - completedCount);
  const lockedCount = totalMissions - completedCount - activeCount;
  const progressPercent = Math.round((completedCount / totalMissions) * 100);

  const stats = [
    {
      label: t("progress.totalMissions"),
      value: totalMissions,
      icon: <TrendingUp className="h-5 w-5 text-cyan-400" />,
      color: "border-cyan-500/20",
      bg: "from-cyan-500/10 to-blue-500/5",
    },
    {
      label: t("progress.completedMissions"),
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
      color: "border-green-500/20",
      bg: "from-green-500/10 to-emerald-500/5",
    },
    {
      label: t("progress.activeMissions"),
      value: activeCount,
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      color: "border-purple-500/20",
      bg: "from-purple-500/10 to-pink-500/5",
    },
    {
      label: t("progress.lockedMissions"),
      value: lockedCount,
      icon: <Lock className="h-5 w-5 text-gray-400" />,
      color: "border-gray-500/20",
      bg: "from-gray-500/10 to-gray-600/5",
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] cosmic-bg py-12 md:py-20">
      <div className="container px-4 md:px-8 mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            {t("progress.title")}
          </h1>
          <p className="text-gray-400 text-lg">{t("progress.subtitle")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className={`glass-card p-5 rounded-xl border ${stat.color} hover:-translate-y-1 transition-all duration-300`}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        <div className="glass-card p-6 rounded-2xl border border-cyan-500/10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              {t("progress.overallProgress")}
            </h2>
            <span className="text-2xl font-bold text-gradient-cyan">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mission status list */}
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              {t("progress.recentActivity")}
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { id: "challenge7", name: "mission1.title" },
              { id: "challenge8", name: "mission2.title" },
              { id: "challenge9", name: "mission3.title" },
            ].map((mission, index, array) => {
              let status: "completed" | "active" | "locked" = "locked";
              if (completedChallenges[mission.id]) {
                status = "completed";
              } else if (index === 0) {
                status = "active";
              } else {
                const prevMissionId = array[index - 1].id;
                if (completedChallenges[prevMissionId]) {
                  status = "active";
                }
              }

              return (
              <div key={mission.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : status === "active" ? (
                    <Clock className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                  <span className={`text-sm font-medium ${status === 'locked' ? 'text-gray-500' : 'text-gray-200'}`}>
                    {t(mission.name)}
                  </span>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  status === 'completed' ? 'text-green-400' :
                  status === 'active' ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  {status === 'completed' ? t("mission.completed") :
                   status === 'active' ? t("mission.active") : t("mission.locked")}
                </span>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
