import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Award, 
  Lock, 
  CheckCircle2, 
  Gift, 
  ChevronRight, 
  Play, 
  Flame, 
  Volume2, 
  X,
  ArrowUpRight,
  TrendingUp,
  Star
} from "lucide-react";
import { 
  addXP, 
  awardLootCrate, 
  LootRarity 
} from "../services/gamificationService";

export interface ReadinessMilestone {
  id: string;
  threshold: number; // 25, 50, 75, 100
  title: string;
  rankTitle: string;
  badgeName: string;
  rarity: "bronze" | "silver" | "gold" | "diamond";
  iconEmoji: string;
  iconType: "zap" | "layers" | "shield" | "crown";
  description: string;
  perksText: string;
  xpBonus: number;
  crateRarity: LootRarity;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeGlow: string;
  textColor: string;
}

export const READINESS_MILESTONES: ReadinessMilestone[] = [
  {
    id: "milestone-novice-25",
    threshold: 25,
    title: "Novice Practitioner",
    rankTitle: "Cloud Novice",
    badgeName: "AWS Cloud Novice",
    rarity: "bronze",
    iconEmoji: "🥉",
    iconType: "zap",
    description: "Demonstrated fundamental AWS Cloud acumen. Mastered core cloud definitions, global infrastructure regions, and basic compute scaling.",
    perksText: "+250 Cloud XP • Novice Practitioner Title • Bronze Badge Credential",
    xpBonus: 250,
    crateRarity: "rare",
    accentColor: "#D97706",
    badgeBg: "bg-amber-950/40",
    badgeBorder: "border-amber-600/40",
    badgeGlow: "shadow-amber-500/20",
    textColor: "text-amber-400"
  },
  {
    id: "milestone-architect-50",
    threshold: 50,
    title: "Cloud Architect",
    rankTitle: "Solutions Architect",
    badgeName: "AWS Cloud Architect",
    rarity: "silver",
    iconEmoji: "🥈",
    iconType: "layers",
    description: "Halfway to certification mastery! Proficient in VPC network isolation, EC2 scaling tiers, RDS databases, and IAM zero-trust policies.",
    perksText: "+500 Cloud XP • Solutions Architect Title • Silver Badge Credential • Rare Mystery Loot Crate",
    xpBonus: 500,
    crateRarity: "rare",
    accentColor: "#94A3B8",
    badgeBg: "bg-slate-900/60",
    badgeBorder: "border-slate-400/50",
    badgeGlow: "shadow-slate-400/20",
    textColor: "text-slate-200"
  },
  {
    id: "milestone-specialist-75",
    threshold: 75,
    title: "Lead Cloud Specialist",
    rankTitle: "Principal Specialist",
    badgeName: "AWS Lead Specialist",
    rarity: "gold",
    iconEmoji: "🥇",
    iconType: "shield",
    description: "High-confidence exam readiness! Demonstrating expertise across Well-Architected Framework pillars, cost governance, and tricky trap avoidance.",
    perksText: "+750 Cloud XP • Lead Specialist Title • Gold Badge Credential • Epic Mystery Loot Crate",
    xpBonus: 750,
    crateRarity: "epic",
    accentColor: "#F59E0B",
    badgeBg: "bg-yellow-950/40",
    badgeBorder: "border-yellow-500/50",
    badgeGlow: "shadow-yellow-500/30",
    textColor: "text-amber-300"
  },
  {
    id: "milestone-guru-100",
    threshold: 100,
    title: "AWS Cloud Guru",
    rankTitle: "Cloud Guru Legend",
    badgeName: "AWS Cloud Guru",
    rarity: "diamond",
    iconEmoji: "👑",
    iconType: "crown",
    description: "100% Complete Exam Readiness! Total mastery over all CLF-C02 exam domains, distractor traps, and architectural scenarios. Certified ready to ace the real exam!",
    perksText: "+1,500 Cloud XP • Cloud Guru Legend Title • Holographic Diamond Medal • Mythic Loot Crate",
    xpBonus: 1500,
    crateRarity: "mythic",
    accentColor: "#EC4899",
    badgeBg: "bg-pink-950/40",
    badgeBorder: "border-pink-500/60",
    badgeGlow: "shadow-pink-500/40",
    textColor: "text-pink-400"
  }
];

const MILESTONES_STORAGE_KEY = "aws_readiness_unlocked_milestones_v2";

interface ReadinessMilestonesProps {
  readinessScore: number;
  onNavigateToTab?: (tab: string) => void;
}

export const ReadinessMilestones: React.FC<ReadinessMilestonesProps> = ({
  readinessScore,
  onNavigateToTab
}) => {
  // Saved unlocked milestone IDs
  const [unlockedMilestoneIds, setUnlockedMilestoneIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MILESTONES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Auto-calculate initial unlocked based on current readiness
    const initial: string[] = [];
    READINESS_MILESTONES.forEach((m) => {
      if (readinessScore >= m.threshold) initial.push(m.id);
    });
    return initial;
  });

  // Modal states for level up celebration & badge inspect
  const [celebratingMilestone, setCelebratingMilestone] = useState<ReadinessMilestone | null>(null);
  const [inspectingMilestone, setInspectingMilestone] = useState<ReadinessMilestone | null>(null);
  const [showReplayNotice, setShowReplayNotice] = useState<boolean>(false);

  // Determine current active rank
  const currentRank = useMemo(() => {
    if (readinessScore >= 100) return READINESS_MILESTONES[3];
    if (readinessScore >= 75) return READINESS_MILESTONES[2];
    if (readinessScore >= 50) return READINESS_MILESTONES[1];
    if (readinessScore >= 25) return READINESS_MILESTONES[0];
    return {
      id: "milestone-explorer-0",
      threshold: 0,
      title: "Cloud Explorer",
      rankTitle: "Cloud Explorer",
      badgeName: "AWS Cloud Explorer",
      rarity: "bronze" as const,
      iconEmoji: "🚀",
      iconType: "zap" as const,
      description: "Commencing the AWS certification journey. Master foundational flashcards and practice questions to unlock your first badge at 25% readiness!",
      perksText: "Earn your first badge at 25% Readiness Score",
      xpBonus: 0,
      crateRarity: "common" as const,
      accentColor: "#64748B",
      badgeBg: "bg-slate-900/40",
      badgeBorder: "border-slate-700/50",
      badgeGlow: "shadow-slate-700/20",
      textColor: "text-slate-400"
    };
  }, [readinessScore]);

  // Determine next milestone target
  const nextMilestone = useMemo(() => {
    return READINESS_MILESTONES.find((m) => readinessScore < m.threshold) || null;
  }, [readinessScore]);

  // Check for auto-level up on readiness score changes
  useEffect(() => {
    READINESS_MILESTONES.forEach((milestone) => {
      if (readinessScore >= milestone.threshold && !unlockedMilestoneIds.includes(milestone.id)) {
        // New milestone reached!
        const updated = [...unlockedMilestoneIds, milestone.id];
        setUnlockedMilestoneIds(updated);
        try {
          localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(updated));
        } catch {}

        // Award gamification perks
        addXP(milestone.xpBonus, `Achieved ${milestone.title} Milestone (${milestone.threshold}% Readiness)`);
        awardLootCrate(
          milestone.crateRarity,
          `${milestone.title} Milestone Crate`,
          `Unlocked for reaching ${milestone.threshold}% Exam Readiness.`
        );

        // Open level up celebration modal!
        setCelebratingMilestone(milestone);
      }
    });
  }, [readinessScore, unlockedMilestoneIds]);

  const triggerCelebrationModal = (milestone: ReadinessMilestone, isReplay = false) => {
    setShowReplayNotice(isReplay);
    setCelebratingMilestone(milestone);
  };

  const getIcon = (type: string, className: string) => {
    switch (type) {
      case "zap": return <Zap className={className} />;
      case "layers": return <Layers className={className} />;
      case "shield": return <ShieldCheck className={className} />;
      case "crown": return <Crown className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-6 space-y-6 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Milestone Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Readiness Level & Badge Progression
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Current Rank: {currentRank.rankTitle}
            </span>
          </div>
          <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>CLF-C02 Milestone Badges & Level-Up Path</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Progress through exam readiness milestones to unlock official credentials, bonus Cloud XP, and rare mystery loot crates.
          </p>
        </div>

        {/* Current Score Summary Pill */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-center px-2 border-r border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Exam Readiness</div>
            <div className="text-xl font-black text-[#FF9900] font-mono flex items-center justify-center gap-1">
              {readinessScore}%
            </div>
          </div>
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Milestones</div>
            <div className="text-xl font-black text-emerald-500 font-mono">
              {READINESS_MILESTONES.filter(m => readinessScore >= m.threshold).length} / 4
            </div>
          </div>
        </div>
      </div>

      {/* Global Progression Track */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-4 md:p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-4 h-4 text-[#FF9900]" />
            <span>Active Rank: <strong className="text-slate-900 dark:text-white font-black">{currentRank.title}</strong></span>
          </div>

          {nextMilestone ? (
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Next Rank: <strong className="text-[#FF9900] font-bold">{nextMilestone.title} ({nextMilestone.threshold}%)</strong> —{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{nextMilestone.threshold - readinessScore}% to go</span>
            </span>
          ) : (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Maximum Rank Achieved (100% Cloud Guru)
            </span>
          )}
        </div>

        {/* Multi-tier Milestone Progress Bar */}
        <div className="relative pt-3 pb-4">
          {/* Base track */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-[#FF9900] to-pink-500 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>

          {/* Milestone Checkpoint Pins */}
          <div className="relative w-full flex justify-between mt-2">
            {READINESS_MILESTONES.map((m) => {
              const isUnlocked = readinessScore >= m.threshold;
              return (
                <div 
                  key={m.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setInspectingMilestone(m)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all shadow-sm ${
                    isUnlocked
                      ? "bg-[#FF9900] border-amber-300 text-slate-950 font-black scale-110 shadow-amber-500/30"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                  }`}>
                    {isUnlocked ? "✓" : m.iconEmoji}
                  </div>
                  <span className={`text-[10px] font-mono font-bold mt-1 ${
                    isUnlocked ? "text-[#FF9900] font-black" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {m.threshold}%
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline text-center max-w-[70px] truncate">
                    {m.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 MILESTONE BADGE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {READINESS_MILESTONES.map((milestone) => {
          const isUnlocked = readinessScore >= milestone.threshold;
          const progressToThis = Math.min(100, Math.round((readinessScore / milestone.threshold) * 100));

          return (
            <motion.div
              key={milestone.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-lg border transition-all relative flex flex-col justify-between overflow-hidden ${
                isUnlocked
                  ? `bg-slate-900 text-white ${milestone.badgeBorder} shadow-lg ${milestone.badgeGlow}`
                  : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 opacity-90"
              }`}
            >
              {/* Top status tag */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                  isUnlocked
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                }`}>
                  {isUnlocked ? "Unlocked & Verified" : `Target: ${milestone.threshold}%`}
                </span>

                <span className="text-xl">{milestone.iconEmoji}</span>
              </div>

              {/* Badge Emblem & Title */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    isUnlocked
                      ? `${milestone.badgeBg} ${milestone.badgeBorder} ${milestone.textColor}`
                      : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"
                  }`}>
                    {getIcon(milestone.iconType, "w-5 h-5")}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                      {milestone.badgeName}
                    </h4>
                    <span className={`text-[10px] font-mono font-bold ${milestone.textColor}`}>
                      {milestone.rarity.toUpperCase()} TIER
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {milestone.description}
                </p>
              </div>

              {/* Progress or Actions Footer */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {isUnlocked ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Milestone Mastered
                      </span>
                      <span className="text-amber-400">+{milestone.xpBonus} XP</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => triggerCelebrationModal(milestone, true)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-700"
                        title="Replay level-up fanfare animation"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Replay Fanfare
                      </button>
                      
                      <button
                        onClick={() => setInspectingMilestone(milestone)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                        title="Inspect Badge Perks"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Milestone Progress</span>
                      <strong className="text-[#FF9900]">{progressToThis}%</strong>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-[#FF9900] rounded-full transition-all duration-500"
                        style={{ width: `${progressToThis}%` }}
                      />
                    </div>

                    <button
                      onClick={() => setInspectingMilestone(milestone)}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      Inspect Criteria & Perks
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LEVEL-UP CELEBRATION MODAL */}
      <AnimatePresence>
        {celebratingMilestone && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            
            {/* Confetti / Sparkle burst particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * 360;
                const distance = 140 + Math.random() * 120;
                const rad = (angle * Math.PI) / 180;
                const targetX = Math.cos(rad) * distance;
                const targetY = Math.sin(rad) * distance;
                const colors = ["#FF9900", "#F59E0B", "#10B981", "#EC4899", "#3B82F6", "#FBBF24"];
                const color = colors[i % colors.length];

                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{ 
                      x: targetX, 
                      y: targetY, 
                      opacity: [1, 1, 0], 
                      scale: [0, 1.4, 0.8],
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ backgroundColor: color }}
                    className="absolute w-3 h-3 rounded-sm shadow-md"
                  />
                );
              })}
            </div>

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/80 p-6 md:p-8 rounded-2xl max-w-lg w-full text-center space-y-6 shadow-2xl text-white relative z-10 overflow-hidden"
            >
              {/* Radial glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setCelebratingMilestone(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Level Up Top Badge Banner */}
              <div className="space-y-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-[#FF9900] text-slate-950 text-xs font-black uppercase tracking-widest rounded-full shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" />
                  {showReplayNotice ? "MILESTONE SHOWCASE" : "🎉 LEVEL UP ACHIEVED!"}
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2 font-sans">
                  {celebratingMilestone.rankTitle}
                </h2>
                <span className="text-amber-400 text-xs font-mono font-bold tracking-wide block">
                  {celebratingMilestone.threshold}% Exam Readiness Milestone Mastered
                </span>
              </div>

              {/* Animated Emblem */}
              <motion.div
                initial={{ rotate: -15, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="relative mx-auto w-24 h-24"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
                <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 shadow-2xl relative z-10 ${celebratingMilestone.badgeBg} ${celebratingMilestone.badgeBorder} text-amber-300`}>
                  <span className="text-3xl">{celebratingMilestone.iconEmoji}</span>
                  <span className="text-[10px] font-mono font-black uppercase mt-1">
                    {celebratingMilestone.rarity}
                  </span>
                </div>
              </motion.div>

              {/* Description & Rewards */}
              <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {celebratingMilestone.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    Unlocked Rewards & Credentials:
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs text-slate-200 font-medium">
                    {celebratingMilestone.perksText}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setCelebratingMilestone(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-[#FF9900] hover:from-amber-400 hover:to-[#FF9900] text-slate-950 font-black text-sm rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer min-h-[44px]"
                >
                  Claim Credential & Keep Soaring
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BADGE INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectingMilestone && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl max-w-md w-full space-y-5 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setInspectingMilestone(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border text-2xl ${inspectingMilestone.badgeBg} ${inspectingMilestone.badgeBorder}`}>
                  {inspectingMilestone.iconEmoji}
                </div>
                <div>
                  <span className={`text-[10px] font-mono font-black uppercase ${inspectingMilestone.textColor}`}>
                    {inspectingMilestone.rarity.toUpperCase()} CREDENTIAL
                  </span>
                  <h3 className="text-xl font-black text-white">{inspectingMilestone.badgeName}</h3>
                  <span className="text-xs text-slate-400">Required: {inspectingMilestone.threshold}% Exam Readiness</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-200">Milestone Criteria:</div>
                <p>{inspectingMilestone.description}</p>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">Included Perks & Rewards:</div>
                  <p className="text-slate-400 font-mono text-[11px]">{inspectingMilestone.perksText}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const m = inspectingMilestone;
                    setInspectingMilestone(null);
                    triggerCelebrationModal(m, true);
                  }}
                  className="flex-1 py-3 bg-[#FF9900] hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  Preview Level-Up Fanfare
                </button>

                <button
                  onClick={() => setInspectingMilestone(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer min-h-[44px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
