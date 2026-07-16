import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Lock, CheckCircle, Award, Flame, BookOpen, Layers, ShieldCheck, Bot, HelpCircle, Zap } from "lucide-react";
import { Achievement } from "../types";

const AchievementIcon: React.FC<{ name: string; unlocked: boolean }> = ({ name, unlocked }) => {
  const baseClass = `w-5 h-5 ${unlocked ? "text-[#FF9900]" : "text-slate-400"}`;
  switch (name) {
    case "BookOpen": return <BookOpen className={baseClass} />;
    case "Flame": return <Flame className={baseClass} />;
    case "Award": return <Award className={baseClass} />;
    case "Layers": return <Layers className={baseClass} />;
    case "ShieldCheck": return <ShieldCheck className={baseClass} />;
    case "Bot": return <Bot className={baseClass} />;
    case "HelpCircle": return <HelpCircle className={baseClass} />;
    case "Zap": return <Zap className={baseClass} />;
    default: return <Award className={baseClass} />;
  }
};

interface AchievementsProps {
  achievementsList: Achievement[];
}

export const Achievements: React.FC<AchievementsProps> = ({ achievementsList }) => {
  const [categoryFilter, setCategoryFilter] = useState<"all" | "study" | "mastery" | "quiz" | "chat">("all");

  const unlockedCount = achievementsList.filter(a => a.unlocked).length;
  const totalAchievements = achievementsList.length;
  const overallProgressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  const filteredAchievements = achievementsList.filter(a => categoryFilter === "all" || a.category === categoryFilter);

  return (
    <div className="bg-slate-900 text-white rounded-sm border border-slate-800 p-6 shadow-md relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#FF9900]/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/25 rounded-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Cloud Practitioner Badge Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Gamified CLF-C02 preparation. Complete active learning milestones to unlock credentials.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 bg-slate-950 border border-slate-800/80 p-3 rounded-sm">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider block">
              Total Badges Earned
            </span>
            <span className="font-mono text-lg font-black text-[#FF9900]">
              {unlockedCount} <span className="text-slate-500 text-xs font-normal">/ {totalAchievements}</span>
            </span>
          </div>
          <div className="w-px h-10 bg-slate-800"></div>
          <div className="min-w-[100px]">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
              <span>PROGRESS</span>
              <span>{overallProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-[#FF9900] rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all border ${
            categoryFilter === "all"
              ? "bg-[#FF9900] text-slate-900 border-[#FF9900]"
              : "bg-slate-950 text-slate-400 border-slate-855 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          All Achievements
        </button>
        <button
          onClick={() => setCategoryFilter("study")}
          className={`px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all border ${
            categoryFilter === "study"
              ? "bg-[#FF9900] text-slate-900 border-[#FF9900]"
              : "bg-slate-950 text-slate-400 border-slate-855 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          Study Quota
        </button>
        <button
          onClick={() => setCategoryFilter("mastery")}
          className={`px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all border ${
            categoryFilter === "mastery"
              ? "bg-[#FF9900] text-slate-900 border-[#FF9900]"
              : "bg-slate-950 text-slate-400 border-slate-855 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          Recall Mastery
        </button>
        <button
          onClick={() => setCategoryFilter("quiz")}
          className={`px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all border ${
            categoryFilter === "quiz"
              ? "bg-[#FF9900] text-slate-900 border-[#FF9900]"
              : "bg-slate-950 text-slate-400 border-slate-855 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          Practice Exam
        </button>
        <button
          onClick={() => setCategoryFilter("chat")}
          className={`px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all border ${
            categoryFilter === "chat"
              ? "bg-[#FF9900] text-slate-900 border-[#FF9900]"
              : "bg-slate-950 text-slate-400 border-slate-855 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          AI Socratic Chat
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAchievements.map((badge) => (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.02 }}
            className={`border p-4 rounded-sm flex flex-col justify-between transition-all duration-300 relative group ${
              badge.unlocked
                ? "bg-slate-950/70 border-amber-500/40 hover:border-[#FF9900]/80 shadow-md hover:shadow-[0_0_15px_rgba(255,153,0,0.3)]"
                : "bg-slate-950/20 border-slate-800/60 opacity-60 hover:opacity-80"
            }`}
          >
            {/* Lock Indicator */}
            {!badge.unlocked && (
              <div className="absolute top-2 right-2 p-1 bg-slate-950/50 rounded-xs border border-slate-800 text-slate-600">
                <Lock className="w-3 h-3" />
              </div>
            )}

            {/* Unlock Badge Indicator */}
            {badge.unlocked && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest animate-pulse">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                Unlocked
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xs border ${
                  badge.unlocked
                    ? "bg-[#FF9900]/10 border-[#FF9900]/30 text-[#FF9900]"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  <AchievementIcon name={badge.iconName} unlocked={badge.unlocked} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${badge.unlocked ? "text-amber-400" : "text-slate-400"}`}>
                    {badge.title}
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                    {badge.category}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 mt-3 leading-snug">
                {badge.description}
              </p>
              <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">
                Req: {badge.requirementText}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1.5">
                <span>METRIC</span>
                <span className={badge.unlocked ? "text-[#FF9900]" : "text-slate-400"}>
                  {badge.valueText}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    badge.unlocked ? "bg-[#FF9900]" : "bg-slate-700"
                  }`}
                  style={{ width: `${badge.progress}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
