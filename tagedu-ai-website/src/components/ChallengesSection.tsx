import { useState, useEffect } from "react";
import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { View } from "@/pages/Index";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ChallengesProps {
  onNavigate: (view: View) => void;
}

interface MissionConfig {
  id: string;
  routeId: string;
  titleKey: string;
  descKey: string;
}

const missions: MissionConfig[] = [
  {
    id: "challenge7",
    routeId: "challenge1",
    titleKey: "mission1.title",
    descKey: "mission1.desc",
  },
  {
    id: "challenge8",
    routeId: "challenge2",
    titleKey: "mission2.title",
    descKey: "mission2.desc",
  },
  {
    id: "challenge9",
    routeId: "challenge3",
    titleKey: "mission3.title",
    descKey: "mission3.desc",
  },
];

export function ChallengesSection({ onNavigate }: ChallengesProps) {
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const { t } = useI18n();

  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem("tagedu_token");
      if (!token) {
        setCompletedChallenges({});
        return;
      }

      try {
        const response = await fetch(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });

          if (response.ok) {
            const data = await response.json();
            const progressMap: Record<string, boolean> = {};
            data.forEach((item: any) => {
              if (item.is_completed) {
                progressMap[item.challenge_id] = true;
              }
            });
            setCompletedChallenges(progressMap);
          } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("tagedu_token");
            localStorage.removeItem("tagedu_user");
            window.dispatchEvent(new Event("auth_change"));
          }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
    window.addEventListener("auth_change", fetchProgress);
    return () => window.removeEventListener("auth_change", fetchProgress);
  }, []);

  const getMissionStatus = (missionId: string, index: number): "completed" | "active" | "locked" => {
    if (completedChallenges[missionId]) return "completed";
    
    // [ROLE: ADMIN] Luôn mở khóa tất cả thử thách cho Admin
    if (isAdmin) return "active";

    if (index === 0) return "active";
    
    // Nếu thử thách trước đó đã hoàn thành, thử thách này sẽ mở khóa. Nếu không thì sẽ bị khóa.
    const prevMissionId = missions[index - 1].id;
    if (completedChallenges[prevMissionId]) return "active";

    return "locked";
  };

  return (
    <section id="challenges" className="w-full py-16 md:py-24 relative cosmic-bg">
      <div className="container px-4 md:px-8 mx-auto max-w-5xl relative">
        
        {/* Mission items with path */}
        <div className="relative">
          {/* Vertical dashed line connector */}
          <div 
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px hidden md:block"
            style={{
              backgroundImage: 'repeating-linear-gradient(to bottom, rgba(100, 200, 255, 0.25) 0px, rgba(100, 200, 255, 0.25) 8px, transparent 8px, transparent 20px)',
            }}
          />

          {missions.map((mission, index) => {
            const status = getMissionStatus(mission.id, index);
            const isLeft = index % 2 === 0;
            const isLocked = status === "locked";

            return (
              <div key={mission.id} className="relative mb-16 last:mb-0">
                {/* Center dot connector */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                  <div className={`mission-dot ${status === 'completed' ? 'animate-pulse-glow' : ''}`} 
                    style={{
                      background: status === 'completed' ? '#00d4ff' : status === 'active' ? '#a855f7' : '#374151',
                      boxShadow: status === 'completed' 
                        ? '0 0 12px rgba(0, 212, 255, 0.6)' 
                        : status === 'active' 
                          ? '0 0 12px rgba(168, 85, 247, 0.6)' 
                          : 'none',
                    }}
                  />
                </div>

                {/* Card positioned left or right */}
                <div className={`flex items-center gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Card */}
                  <div className={`flex-1 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div
                      className={`
                        relative p-6 md:p-8 rounded-2xl cursor-pointer transition-all duration-300
                        ${status === 'completed' ? 'glass-card hover:border-cyan-500/30' : ''}
                        ${status === 'active' ? 'glass-card-active hover:shadow-purple-500/20' : ''}
                        ${status === 'locked' ? 'glass-card-locked cursor-not-allowed' : ''}
                        ${!isLocked ? 'hover:-translate-y-1' : ''}
                      `}
                      onClick={() => {
                        if (isLocked) return;
                        onNavigate(mission.routeId as any);
                      }}
                    >
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`
                          ${status === 'completed' ? 'badge-completed' : ''}
                          ${status === 'active' ? 'badge-active' : ''}
                          ${status === 'locked' ? 'badge-locked' : ''}
                        `}>
                          {status === 'completed' && t("mission.completed")}
                          {status === 'active' && t("mission.active")}
                          {status === 'locked' && t("mission.locked")}
                        </div>

                        {/* Status Icon */}
                        {status === 'completed' && (
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                          </div>
                        )}
                        {status === 'locked' && (
                          <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center border border-gray-500/10">
                            <Lock className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-xl md:text-2xl font-bold mb-3 ${
                        isLocked ? 'text-gray-500' : 'text-white'
                      }`} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        {t(mission.titleKey)}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm md:text-base leading-relaxed mb-4 ${
                        isLocked ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {t(mission.descKey)}
                        {isLocked && ` ${t("mission.requiresLevel")}`}
                      </p>

                      {/* Progress bar for completed */}
                      {status === 'completed' && (
                        <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full w-full transition-all duration-1000" />
                        </div>
                      )}

                      {/* Action button for active */}
                      {status === 'active' && (
                        <button className="btn-cosmic w-full py-3 px-6 flex items-center justify-center gap-2 text-base mt-2">
                          {t("mission.continue")} <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spacer (the other half) */}
                  <div className="hidden md:block flex-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom decorative gradient orb */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-purple-900/20 to-transparent rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}