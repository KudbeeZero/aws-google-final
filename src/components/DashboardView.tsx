import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  Award, CheckCircle, Flame, ShieldAlert, Sparkles, BookOpen, Layers, Trophy, 
  AlertTriangle, TrendingUp, ShieldCheck, Bot, HelpCircle, Zap, Lock, Cloud, 
  CloudLightning, Key, UserCheck, RefreshCw, Volume2, VolumeX, ExternalLink, 
  Mail, SlidersHorizontal, Check, X, Compass, Cpu, FileQuestion, Briefcase, 
  Coins, Database, Server, Puzzle, ArrowRight, Gamepad2, Vault, Crown, Building2, Headphones, Radio
} from "lucide-react";
import { DomainData, Flashcard, Achievement } from "../types";
import { FirstTimeTools } from "./FirstTimeTools";
import { FocusBuddy } from "./FocusBuddy";
import { DailyGoalTracker } from "./DailyGoalTracker";
import { WeeklyStudyChart } from "./WeeklyStudyChart";
import { MonthlyHeatmap } from "./MonthlyHeatmap";
import { Achievements } from "./Achievements";
import { GlobalLeaderboard } from "./GlobalLeaderboard";
import { ReadinessMilestones, READINESS_MILESTONES } from "./ReadinessMilestones";
import { DailySmartSprint } from "./DailySmartSprint";
import { useAudioLesson } from "../contexts/AudioLessonContext";
import { useAgentWorkforce } from "../contexts/AgentWorkforceContext";
import { AWS_SIX_PILLARS, WORKFORCE_AGENTS } from "../types/workforce";
import { loginWithGoogle, loginAnonymously, logoutUser, registerWithEmail, loginWithEmail, getAuthDiagnostics, FirebaseAuthError } from "../lib/firebase";
import { DashboardAnalyticsCharts } from "./DashboardAnalyticsCharts";
import { trickQuestions } from "../data";

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

interface DashboardViewProps {
  domains: DomainData[];
  flashcards: Flashcard[];
  studyHistory: { [key: string]: "known" | "review" | null };
  quizHistory: { [key: string]: boolean };
  totalQuizCount: number;
  onNavigateToTab: (tab: string) => void;
  onSelectDomainForFlashcards: (domainId: string) => void;
  dailyStudyGoal: number;
  todayStudyMinutes: number;
  totalStudyMinutes: number;
  onUpdateDailyGoal: (mins: number) => void;
  onAddStudyMinutes: (mins: number) => void;
  onResetStudyMinutes: () => void;
  user?: any;
  authLoading?: boolean;
  syncing?: boolean;
  dailyMinutesLog?: { [dateKey: string]: number };
  streak: number;
  redirectError?: string | null;
  redirectSuggestedAction?: string | null;
  redirectErrorGuide?: string | null;
  interviewHistory?: any[];
  onOpenExamConfidenceModal?: () => void;
  onMarkCard?: (cardId: string, status: "known" | "review") => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  domains,
  flashcards,
  studyHistory,
  quizHistory,
  totalQuizCount,
  onNavigateToTab,
  onSelectDomainForFlashcards,
  dailyStudyGoal,
  todayStudyMinutes,
  totalStudyMinutes,
  onUpdateDailyGoal,
  onAddStudyMinutes,
  onResetStudyMinutes,
  user,
  authLoading,
  syncing,
  dailyMinutesLog,
  streak,
  redirectError,
  redirectSuggestedAction,
  redirectErrorGuide,
  interviewHistory = [],
  onOpenExamConfidenceModal,
  onMarkCard,
}) => {
  // Calculate statistics
  const totalCards = flashcards.length;
  const knownCards = Object.values(studyHistory).filter((v) => v === "known").length;
  
  // Quiz accuracy
  const correctQuizzes = Object.values(quizHistory).filter((v) => v === true).length;
  const attemptedQuizzes = Object.keys(quizHistory).length;
  const quizScorePercent = attemptedQuizzes > 0 ? (correctQuizzes / attemptedQuizzes) * 100 : 0;

  // Domain-specific progress calculation
  const getDomainProgress = (domainId: string) => {
    const domainCards = flashcards.filter((fc) => fc.domainId === domainId);
    if (domainCards.length === 0) return 0;
    const knownInDomain = domainCards.filter((fc) => studyHistory[fc.id] === "known").length;
    return Math.round((knownInDomain / domainCards.length) * 100);
  };

  // Identify strongest and weakest domains based on progress
  const domainBreakdowns = domains.map(dom => ({
    ...dom,
    progress: getDomainProgress(dom.id)
  }));

  const sortedByProgress = [...domainBreakdowns].sort((a, b) => b.progress - a.progress);
  const strongestDomain = sortedByProgress[0]?.progress > 0 ? sortedByProgress[0] : null;

  const sortedByLowestProgress = [...domainBreakdowns].sort((a, b) => a.progress - b.progress);
  const weakestDomain = sortedByLowestProgress[0]?.progress < 100 ? sortedByLowestProgress[0] : null;

  const getWeakestDomainAdvice = (id: string) => {
    switch (id) {
      case "cloud-concepts":
        return "Focus on AWS Shared Responsibility Model (OF vs IN the cloud) and the structural differences between elasticity and scalability.";
      case "security-compliance":
        return "Review critical service comparisons like WAF (application-layer firewall) vs AWS Shield (DDoS) vs GuardDuty (active continuous monitoring) in the Distractor Vault.";
      case "cloud-technology":
        return "Study compute classifications (EC2 virtual machines vs serverless AWS Lambda / Fargate containers) and S3 object storage durability characteristics.";
      case "billing-pricing":
        return "Master pricing tiers (On-Demand vs Spot vs Savings Plans) and cost tools (AWS Budgets proactive alerts vs Cost Explorer retrospective graphs).";
      default:
        return "Review high-yield flashcards and practice scenarios to build confidence.";
    }
  };

  // Exam Readiness Score calculation (50% flashcard mastery, 50% quiz accuracy)
  const flashcardWeight = (knownCards / (totalCards || 1)) * 50;
  const quizWeight = attemptedQuizzes > 0 ? (correctQuizzes / (totalQuizCount || 1)) * 50 : 0;
  const readinessScore = Math.min(100, Math.round(flashcardWeight + quizWeight));

  // Determine readiness evaluation text
  let readinessLabel = "Inception";
  let readinessColor = "text-rose-500 border-rose-200 bg-rose-50";
  if (readinessScore >= 80) {
    readinessLabel = "Exam Ready!";
    readinessColor = "text-emerald-700 border-emerald-200 bg-emerald-50";
  } else if (readinessScore >= 50) {
    readinessLabel = "Making Solid Progress";
    readinessColor = "text-amber-700 border-amber-200 bg-amber-50";
  } else if (readinessScore > 0) {
    readinessLabel = "Getting Started";
    readinessColor = "text-blue-700 border-blue-200 bg-blue-50";
  }

  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuggestedAction, setAuthSuggestedAction] = React.useState<string | null>(null);
  const [authErrorGuide, setAuthErrorGuide] = React.useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = React.useState<boolean>(false);
  const [showEmailAuth, setShowEmailAuth] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [isRegistering, setIsRegistering] = React.useState<boolean>(false);
  const [emailLoading, setEmailLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (redirectError) {
      setAuthError(redirectError);
    }
    if (redirectSuggestedAction) {
      setAuthSuggestedAction(redirectSuggestedAction);
    }
    if (redirectErrorGuide) {
      setAuthErrorGuide(redirectErrorGuide);
    }
  }, [redirectError, redirectSuggestedAction, redirectErrorGuide]);

  const { playLesson, currentLesson, isPlaying: isGlobalPlaying, setIsTourModalOpen, setIsDrawerOpen } = useAudioLesson();
  const { activeCertTrack, setActiveCertTrack, memory: workforceMemory, triggerPillarBubble, setIsMeshSheetOpen } = useAgentWorkforce();
  const isPlayingVoice = isGlobalPlaying && currentLesson?.id === "dashboard-voice-summary";

  const handlePlayVoiceSummary = () => {
    const textParts = [];
    if (streak > 0) {
      textParts.push(`Great job! You are currently on a ${streak} day study streak.`);
    } else {
      textParts.push(`Welcome back. Let's build a new study streak today.`);
    }

    if (strongestDomain) {
      textParts.push(`Your strongest area is ${strongestDomain.name}, with a mastery of ${strongestDomain.progress} percent.`);
    }

    if (weakestDomain) {
      textParts.push(`Your primary knowledge gap is ${weakestDomain.name}, sitting at ${weakestDomain.progress} percent. I recommend you focus on this to boost your exam readiness.`);
    } else {
      textParts.push(`You have mastered all domains. You are exam ready!`);
    }

    playLesson(
      {
        id: "dashboard-voice-summary",
        title: "Daily Readiness & Gap Summary",
        module: "Dashboard Briefing",
        text: textParts.join(" "),
      },
      { toggleIfSame: true }
    );
  };

  // Dynamically parse Socratic Professor chat counts
  const chatHistoryRaw = localStorage.getItem("aws_professor_chat_history_v1");
  const userChatCount = React.useMemo(() => {
    if (!chatHistoryRaw) return 0;
    try {
      const parsed = JSON.parse(chatHistoryRaw);
      return Array.isArray(parsed) ? parsed.filter((m: any) => m.role === "user").length : 0;
    } catch (e) {
      return 0;
    }
  }, [chatHistoryRaw]);

  // Construct complete Achievements list
  const achievementsList: Achievement[] = React.useMemo(() => {
    const list: Omit<Achievement, "unlocked" | "progress" | "valueText">[] = [
      {
        id: "cloud-novice",
        title: "Cloud Novice",
        description: "Began your AWS certification journey.",
        requirementText: "Log at least 1 minute of active study time.",
        iconName: "BookOpen",
        category: "study"
      },
      {
        id: "daily-achiever",
        title: "Daily Overachiever",
        description: "Pushed through today's AWS study quota.",
        requirementText: "Hit your Daily Goal Tracker minute quota.",
        iconName: "Flame",
        category: "study"
      },
      {
        id: "cloud-marathoner",
        title: "AWS Marathon Scholar",
        description: "Built incredible durable memory through deep focus.",
        requirementText: "Log a solid 100 total study minutes.",
        iconName: "Award",
        category: "study"
      },
      {
        id: "flashcard-explorer",
        title: "Concept Explorer",
        description: "Began self-assessing CLF-C02 core capabilities.",
        requirementText: "Rate 15 flashcards as known or review.",
        iconName: "Layers",
        category: "mastery"
      },
      {
        id: "sovereign-master",
        title: "Sovereign Master",
        description: "Mastered 100% of all available study materials.",
        requirementText: "Mark all available flashcards as mastered.",
        iconName: "ShieldCheck",
        category: "mastery"
      },
      {
        id: "socratic-dialogue",
        title: "Socratic Scholar",
        description: "Engaged in critical reasoning with Professor Cloud.",
        requirementText: "Complete a Socratic chat dialogue.",
        iconName: "Bot",
        category: "chat"
      },
      {
        id: "quiz-challenger",
        title: "Trap Detector",
        description: "Challenged tricky, misleading exam simulations.",
        requirementText: "Attempt at least 5 trick question scenarios.",
        iconName: "HelpCircle",
        category: "quiz"
      },
      {
        id: "distractor-slayer",
        title: "Distractor Slayer",
        description: "Secured high accuracy against common vocab pitfalls.",
        requirementText: "Correctly answer 8 exam simulator questions.",
        iconName: "Zap",
        category: "quiz"
      }
    ];

    return list.map((item) => {
      let unlocked = false;
      let progress = 0;
      let valueText = "";

      switch (item.id) {
        case "cloud-novice":
          unlocked = totalStudyMinutes >= 1;
          progress = Math.min(100, Math.round((totalStudyMinutes / 1) * 100));
          valueText = `${totalStudyMinutes} / 1 min`;
          break;
        case "daily-achiever":
          unlocked = todayStudyMinutes >= dailyStudyGoal;
          progress = Math.min(100, Math.round((todayStudyMinutes / dailyStudyGoal) * 100));
          valueText = `${todayStudyMinutes} / ${dailyStudyGoal} mins`;
          break;
        case "cloud-marathoner":
          unlocked = totalStudyMinutes >= 100;
          progress = Math.min(100, Math.round((totalStudyMinutes / 100) * 100));
          valueText = `${totalStudyMinutes} / 100 mins`;
          break;
        case "flashcard-explorer":
          const cardsEvaluated = Object.keys(studyHistory).length;
          unlocked = cardsEvaluated >= 15;
          progress = Math.min(100, Math.round((cardsEvaluated / 15) * 100));
          valueText = `${cardsEvaluated} / 15 cards`;
          break;
        case "sovereign-master":
          unlocked = knownCards === totalCards && totalCards > 0;
          progress = totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0;
          valueText = `${knownCards} / ${totalCards} cards`;
          break;
        case "socratic-dialogue":
          unlocked = userChatCount >= 1;
          progress = Math.min(100, Math.round((userChatCount / 1) * 100));
          valueText = `${userChatCount} / 1 query`;
          break;
        case "quiz-challenger":
          unlocked = attemptedQuizzes >= 5;
          progress = Math.min(100, Math.round((attemptedQuizzes / 5) * 100));
          valueText = `${attemptedQuizzes} / 5 questions`;
          break;
        case "distractor-slayer":
          unlocked = correctQuizzes >= 8;
          progress = Math.min(100, Math.round((correctQuizzes / 8) * 100));
          valueText = `${correctQuizzes} / 8 correct`;
          break;
      }

      return {
        ...item,
        unlocked,
        progress,
        valueText
      };
    });
  }, [totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, totalCards, knownCards, attemptedQuizzes, correctQuizzes, userChatCount]);

  const [widgetVisibility, setWidgetVisibility] = React.useState<{ [key: string]: boolean }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aws_dashboard_widget_preferences_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      streakCard: true,
      cloudSync: true,
      readinessScore: true,
      readinessMilestones: true,
      quickHub: true,
      learningPulse: true,
      leaderboard: true,
      dailyGoal: true,
      weeklyChart: true,
      monthlyHeatmap: true,
      analyticsCharts: true,
      diagnostics: true,
      domainBreakdown: true,
      interviewArchive: true,
      achievements: true,
      firstTimeTools: true,
      focusBuddy: true,
    };
  });

  const [showCustomizeModal, setShowCustomizeModal] = React.useState(false);

  const toggleWidget = (key: string) => {
    setWidgetVisibility(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        localStorage.setItem("aws_dashboard_widget_preferences_v1", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resetWidgets = () => {
    const defaults = {
      streakCard: true,
      cloudSync: true,
      readinessScore: true,
      readinessMilestones: true,
      quickHub: true,
      learningPulse: true,
      leaderboard: true,
      dailyGoal: true,
      weeklyChart: true,
      monthlyHeatmap: true,
      diagnostics: true,
      domainBreakdown: true,
      interviewArchive: true,
      achievements: true,
      firstTimeTools: true,
      focusBuddy: true,
    };
    setWidgetVisibility(defaults);
    if (typeof window !== "undefined") {
      localStorage.setItem("aws_dashboard_widget_preferences_v1", JSON.stringify(defaults));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Today's Focus & 3-Minute Smart Sprint Hero */}
      {widgetVisibility.streakCard && (
        <DailySmartSprint
          flashcards={flashcards}
          domains={domains}
          studyHistory={studyHistory}
          onMarkCard={onMarkCard || (() => {})}
          onAddStudyMinutes={onAddStudyMinutes}
          onNavigateToTab={onNavigateToTab}
          readinessScore={readinessScore}
          streak={streak}
        />
      )}

      {/* AI Audio Tour, Dual-Host Podcasts & Listening Studio Banner */}
      <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Gemini 3.8 Neural Audio · Spatial Soundscapes
            </div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-white mt-0.5">
              AI Guided Audio Tour & Dual-Host Podcasts
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Take a 5-stop narrated tour of CloudMaster, stream Alex &amp; Maya deep-dive exam podcasts, or ask questions hands-free with focus ambience.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsTourModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#FF9900] hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Headphones className="w-4 h-4" />
            <span>Launch Audio Tour</span>
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Soundscapes
          </button>
        </div>
      </div>

      {/* 6 AWS Well-Architected Pillars & Cross-Aware AI Workforce Command Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              AWS Well-Architected Framework · 7 Synced AI Agents · {activeCertTrack}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              6-Pillar Mastery &amp; Multi-Cert Question Bank
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(["CLF-C02", "SAA-C03"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setActiveCertTrack(track)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeCertTrack === track
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab("question-bank")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Question Bank</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMeshSheetOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Agent Mesh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AWS_SIX_PILLARS.map((pillar) => {
            const stat = workforceMemory.pillarScores[pillar.id] || { score: 55, attempts: 0, correct: 0 };
            const lead = WORKFORCE_AGENTS[pillar.leadAgent];
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => triggerPillarBubble(pillar.id)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] bg-slate-50/70 dark:bg-slate-950/50 text-left transition-colors cursor-pointer space-y-2"
                title={`Tap for spoken ${pillar.name} Pillar coaching bubble from ${lead.name}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {pillar.shortName}
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {stat.score}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stat.score >= 80 ? "bg-emerald-500" : stat.score >= 65 ? "bg-[#FF9900]" : "bg-rose-500"
                    }`}
                    style={{ width: `${stat.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {lead.name} · Listen
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Cloud Integration / Progress Sync Control Center (Compact when signed in to reduce vertical clutter) */}
      {widgetVisibility.cloudSync && (
        user ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Cloud Sync Active
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email || "Guest Sync"} · {syncing ? "Syncing…" : "Saved"}
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  setAuthError(null);
                  await logoutUser();
                } catch (e) {
                  console.error("Logout failed:", e);
                }
              }}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:text-red-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
        <div className="border rounded-2xl p-4 sm:p-5 transition-all bg-gradient-to-r from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-200 dark:border-amber-800/60 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl shrink-0 bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20">
                <Cloud className="w-5 h-5 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <span>Sync Recommended</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Local-only session active
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-snug">
                  Connect Cloud Study Sync
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1">
                  Keep your flashcards, scores, and exam readiness synchronized across iPhone, iPad, and desktop.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {authLoading ? (
                <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Checking…</span>
                </div>
              ) : showEmailAuth ? (
                <div className="flex flex-col gap-3 w-full max-w-sm bg-slate-50 dark:bg-slate-900/40 p-4 rounded-sm border border-slate-200 dark:border-slate-800 animate-fade-in sm:self-center shrink-0">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-1">
                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#FF9900]" />
                      <span>{isRegistering ? "Create AWS Study Account" : "Sign In with Email"}</span>
                    </h5>
                    <button 
                      onClick={() => {
                        setShowEmailAuth(false);
                        setAuthError(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold transition-all text-xs cursor-pointer px-1 py-0.5"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. learner@domain.com"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#FF9900] transition-colors"
                        disabled={emailLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password (min 6 chars)</label>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#FF9900] transition-colors"
                        disabled={emailLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={async () => {
                        if (!email || !password) {
                          setAuthError("Please fill in both email and password fields.");
                          return;
                        }
                        if (password.length < 6) {
                          setAuthError("Password must be at least 6 characters.");
                          return;
                        }
                        setAuthError(null);
                        setEmailLoading(true);
                        try {
                          if (isRegistering) {
                            await registerWithEmail(email, password);
                          } else {
                            await loginWithEmail(email, password);
                          }
                          setShowEmailAuth(false);
                          setEmail("");
                          setPassword("");
                        } catch (e: any) {
                          console.error("Email auth failed:", e);
                          if (e?.code === 'auth/user-not-found' || e?.message?.includes('user-not-found')) {
                            setAuthError("No account found with this email. Toggle 'Create an Account' below to sign up!");
                          } else if (e?.code === 'auth/wrong-password' || e?.message?.includes('wrong-password') || e?.message?.includes('invalid-credential')) {
                            setAuthError("Incorrect credentials. Please check your email/password and try again.");
                          } else if (e?.code === 'auth/email-already-in-use' || e?.message?.includes('email-already-in-use')) {
                            setAuthError("This email is already registered. Please sign in instead.");
                          } else if (e?.code === 'auth/invalid-email' || e?.message?.includes('invalid-email')) {
                            setAuthError("Please enter a valid email address.");
                          } else if (e?.code === 'auth/weak-password' || e?.message?.includes('weak-password')) {
                            setAuthError("Password is too weak. Please use at least 6 characters.");
                          } else if (e?.code === 'auth/configuration-not-found' || e?.message?.includes('configuration-not-found')) {
                            setAuthError("Email/Password authentication needs to be enabled in the Firebase Console under Authentication -> Sign-in Method.");
                          } else {
                            setAuthError(e?.message || "Authentication failed. Please verify your credentials.");
                          }
                        } finally {
                          setEmailLoading(false);
                        }
                      }}
                      disabled={emailLoading}
                      className="w-full py-1.5 bg-[#FF9900] hover:bg-amber-600 disabled:bg-amber-400 text-white text-xs font-extrabold rounded-sm transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {emailLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{isRegistering ? "Create AWS Student Account" : "Sign In with Email"}</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold px-0.5">
                      <span>
                        {isRegistering ? "Already have an account?" : "Need a custom login?"}
                      </span>
                      <button
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setAuthError(null);
                        }}
                        disabled={emailLoading}
                        className="text-[#FF9900] hover:text-amber-600 transition-colors cursor-pointer font-bold underline decoration-dotted"
                      >
                        {isRegistering ? "Sign In Instead" : "Create an Account"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col xs:flex-row flex-wrap gap-2 w-full sm:w-auto items-center justify-center sm:justify-start">
                  {typeof window !== "undefined" && window.self !== window.top && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      title="Open application in a standalone tab to enable Google Sign-In"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                      <span>Open in New Tab</span>
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        setAuthError(null);
                        setAuthSuggestedAction(null);
                        setAuthErrorGuide(null);
                        await loginWithGoogle();
                      } catch (e: any) {
                        console.error("Google Auth failed:", e);
                        if (e.name === "FirebaseAuthError" || e.suggestedAction || e.errorGuide) {
                          setAuthError(e.message || "Authentication failed.");
                          setAuthSuggestedAction(e.suggestedAction || null);
                          setAuthErrorGuide(e.errorGuide || null);
                        } else {
                          setAuthError(e.message || "Google Sign-In was closed or blocked. If you are inside an iframe, please use the 'Open in New Tab' button to run in a standalone tab and sign in successfully.");
                          const diagnostics = getAuthDiagnostics();
                          if (diagnostics.suggestedAction) {
                            setAuthSuggestedAction(diagnostics.suggestedAction);
                            setAuthErrorGuide(diagnostics.errorGuide || "Environment security policies are preventing authentication.");
                          }
                        }
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#FF9900] hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-black rounded-sm transition-all shadow-md shadow-amber-500/15 cursor-pointer whitespace-nowrap"
                    title="Authenticate via Google Identity Services"
                  >
                    <Key className="w-4 h-4 text-white fill-white" />
                    <span>Connect Google Account</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setShowEmailAuth(true);
                      setIsRegistering(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    title="Authenticate via traditional Email and Password"
                  >
                    <Mail className="w-4 h-4 text-sky-500" />
                    <span>Email Sign-In</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        setAuthError(null);
                        await loginAnonymously();
                      } catch (e: any) {
                        console.error("Anonymous Auth failed:", e);
                        if (e?.code === 'auth/admin-restricted-operation' || e?.message?.includes('admin-restricted-operation')) {
                          setAuthError("Guest/Anonymous login is disabled by default in the Firebase console. Please connect your Google Account directly to synchronize progress!");
                        } else {
                          setAuthError(e?.message || "Guest authentication failed. Please use Google Sign-In.");
                        }
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-sm transition-all text-center cursor-pointer whitespace-nowrap"
                    title="Sign in with a temporary guest account"
                  >
                    Guest Sync
                  </button>

                  <button
                    onClick={() => {
                      const diagnostics = getAuthDiagnostics();
                      setAuthError(null);
                      setAuthSuggestedAction(diagnostics.suggestedAction || "Everything looks correctly configured for standard environments.");
                      setAuthErrorGuide(diagnostics.errorGuide || "No immediate environmental blocks detected.");
                      setShowDiagnostics(true);
                    }}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350 text-xs font-bold rounded-sm transition-all text-center cursor-pointer whitespace-nowrap flex items-center gap-1"
                    title="Run Environment Diagnostics & Troubleshoot login issues"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Troubleshoot</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Polished Error Banner */}
          {authError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-800 flex items-start justify-between gap-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <span className="font-extrabold uppercase bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-[2px] tracking-wider text-[9px] shrink-0 mt-0.5">Firebase</span>
                <span className="leading-relaxed font-medium">{authError}</span>
              </div>
              <button 
                onClick={() => setAuthError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold transition-colors cursor-pointer px-1 shrink-0 text-sm"
                title="Dismiss Error"
              >
                ×
              </button>
            </div>
          )}

          {/* Troubleshooter & Diagnostic Assistant */}
          {(authSuggestedAction || authErrorGuide || showDiagnostics) && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-700 dark:text-slate-300 animate-fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h5 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF9900]" />
                  <span>Web-Host Auth Troubleshooter</span>
                </h5>
                <button
                  onClick={() => {
                    setAuthSuggestedAction(null);
                    setAuthErrorGuide(null);
                    setShowDiagnostics(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-extrabold text-xs"
                >
                  Close
                </button>
              </div>
              
              {authErrorGuide && (
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Status Report:</p>
                  <div className="p-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/50 rounded-sm font-medium text-rose-800 dark:text-rose-400">
                    {authErrorGuide}
                  </div>
                </div>
              )}

              {authSuggestedAction && (
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Recommended Action:</p>
                  <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/50 rounded-sm font-medium text-amber-800 dark:text-amber-400 leading-relaxed">
                    {authSuggestedAction}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">Staging & Web-Host Checklist:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Authorized Domains:</strong> Ensure <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px] font-mono">{typeof window !== "undefined" ? window.location.hostname : "your-domain.com"}</code> is explicitly whitelisted in the Firebase Console (Authentication &gt; Settings &gt; Authorized Domains).
                  </li>
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Third-Party Cookies:</strong> Privacy-centric browser controls (like Brave shields, Safari cross-site tracking, or Chrome incognito) block Google Auth popups. Choose the <span className="font-semibold text-[#FF9900]">Email Sign-In</span> alternative if cookies are restricted.
                  </li>
                  <li>
                    <strong className="text-slate-700 dark:text-slate-300">Staging Hostnames:</strong> When deploying on Cloudflare Pages or Vercel, dynamic branch URLs (e.g. <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px] font-mono">*.pages.dev</code>) are used. Remember to add these generated hostnames to your Firebase whitelist.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        )
      )}

      {/* Dashboard Customization Control Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#FF9900]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Dashboard Layout
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline tabular-nums">
            · {Object.values(widgetVisibility).filter(Boolean).length} of {Object.keys(widgetVisibility).length} widgets visible
          </span>
        </div>
        <button
          onClick={() => setShowCustomizeModal(true)}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF9900]" />
          <span>Customize</span>
        </button>
      </div>

      {/* Top Banner Grid */}
      {(widgetVisibility.readinessScore || widgetVisibility.learningPulse || widgetVisibility.leaderboard) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Readiness Score Circular/Hero Gauge (4 cols) */}
          {widgetVisibility.readinessScore && (
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs relative overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Exam Readiness Score
              </h3>

              <div className="relative flex items-center justify-center mb-3">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {readinessScore}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                    Ready
                  </span>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-500 opacity-30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <span>{readinessLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {readinessScore >= 100 ? "Cloud Guru" : readinessScore >= 75 ? "Lead Specialist" : readinessScore >= 50 ? "Cloud Architect" : readinessScore >= 25 ? "Cloud Novice" : "Explorer"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mt-1">
                Improves as you mark cards <strong>Mastered</strong> and solve scenarios in the <strong>Exam Simulator</strong>.
              </p>
            </div>
          )}

          {/* Overview Stats (4 cols) */}
          {widgetVisibility.learningPulse && (
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  Your Learning Pulse
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  
                  {/* Stat Card 1 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Flashcards
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight block mt-1 tabular-nums">
                      {knownCards} <span className="text-xs text-slate-400 font-medium">/ {totalCards}</span>
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(knownCards / (totalCards || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stat Card 2 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Accuracy
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight block mt-1 tabular-nums">
                      {Math.round(quizScorePercent)}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 tabular-nums">
                      {correctQuizzes}/{attemptedQuizzes} passed
                    </span>
                  </div>

                  {/* Stat Card 3 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Review Queue
                    </span>
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight block mt-1 tabular-nums">
                      {Object.values(studyHistory).filter((v) => v === "review").length}
                    </span>
                    <button 
                      onClick={() => onNavigateToTab("flashcards")}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline block mt-1 text-left cursor-pointer"
                    >
                      Review now →
                    </button>
                  </div>

                </div>
              </div>

              <div className="mt-5 p-3.5 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex gap-3 items-start">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Focus on High-Weight Domains
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal mt-0.5">
                    Security (Domain 2) and Technology (Domain 3) account for <strong>64%</strong> of CLF-C02 questions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Global Streaks Leaderboard (4 cols) */}
          {widgetVisibility.leaderboard && (
            <div className="lg:col-span-4">
              <GlobalLeaderboard currentUserId={user?.uid} currentStreak={streak} />
            </div>
          )}

        </div>
      )}

      {/* Gamified Readiness Score Milestone Level-Up & Badges */}
      {widgetVisibility.readinessMilestones && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Official Exam Readiness & Milestone Ladder
              </span>
            </div>
            {onOpenExamConfidenceModal && (
              <button
                onClick={onOpenExamConfidenceModal}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> View Confidence Hub
              </button>
            )}
          </div>
          <ReadinessMilestones 
            readinessScore={readinessScore} 
            onNavigateToTab={onNavigateToTab} 
          />
        </div>
      )}

      {/* Quick Study Stations & Fast Hub Matrix */}
      {widgetVisibility.quickHub && (
        <div id="quick-study-stations-hub" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF9900]/10 text-[#FF9900] rounded-xs shrink-0 dark:bg-[#FF9900]/5">
                <Compass className="w-5 h-5 text-[#FF9900]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  AWS Exam Study Stations & Fast Hub
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Quick access to all 11 core training consoles, simulations, AI reasoning tutors, and Web3 credentials.
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200/60 dark:border-slate-700 self-start sm:self-auto">
              12 Modules Ready
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
            {[
              {
                id: "question-bank",
                title: `AI Question Bank (${activeCertTrack})`,
                desc: "Gemini 4 peer-reviewed CLF-C02 & SAA-C03 scenarios across all 6 AWS Pillars",
                icon: ShieldCheck,
                color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700",
                badge: "PostgreSQL + AI",
              },
              {
                id: "blueprint-lesson",
                title: "CLF-C02 Blueprint Lesson",
                desc: "6-chapter architectural skyscraper masterclass with audio + mastery checks",
                icon: Building2,
                color: "text-[#FF9900] bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700",
                badge: "Video Lesson",
              },
              {
                id: "slots",
                title: "New Age Slot Machine",
                desc: "Spin AWS reels, match architecture blueprints & solve Socratic multiplier jackpots",
                icon: Crown,
                color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700",
                badge: "Neo-Casino XP",
              },
              {
                id: "flashcards",
                title: "Concept Flashcards",
                desc: "100+ CLF-C02 core capabilities, active recall & domain filters",
                icon: Layers,
                color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
                badge: "Active Recall",
              },
              {
                id: "professor",
                title: "Socratic Professor",
                desc: "Voice-narrated AI reasoning coach powered by ElevenLabs & Gemini",
                icon: Bot,
                color: "text-[#FF9900] bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
                badge: "Voice + AI",
              },
              {
                id: "simulator",
                title: "Exam Trap Simulator",
                desc: "High-yield scenario questions with community traps & voting stats",
                icon: HelpCircle,
                color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
                badge: "Practice Exam",
              },
              {
                id: "vault",
                title: "The Distractor Vault",
                desc: "Deconstruct confusing AWS service pairs (WAF vs Shield, KMS vs CloudHSM)",
                icon: Vault,
                color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
                badge: "Trap Defense",
              },
              {
                id: "visual-architecture",
                title: "Visual Architecture Studio",
                desc: "Interactive 3-Tier VPC, Serverless & CloudFront CDN topologies",
                icon: Server,
                color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
                badge: "Blueprints",
              },
              {
                id: "lightning-rush",
                title: "Lightning Rush Trivia",
                desc: "60-second rapid-fire speed sprint with streak multipliers & loot crates",
                icon: Zap,
                color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
                badge: "60s Sprint",
              },
              {
                id: "matching",
                title: "Scenario Matcher",
                desc: "Drag & match real-world business scenarios to AWS services",
                icon: Puzzle,
                color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
                badge: "Mini-Game",
              },
              {
                id: "interview",
                title: "HONE Technical Interview",
                desc: "Realistic Cloud Architect defense interview simulator with scorecard",
                icon: Briefcase,
                color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
                badge: "Interview Prep",
              },
              {
                id: "agents",
                title: "AI Agent Swarm Hub",
                desc: "Autonomous architect council (Archie, Guardian, PennyWise, Alex)",
                icon: Cpu,
                color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
                badge: "Autonomous",
              },
              {
                id: "algorand",
                title: "Algorand Web3 Portal",
                desc: "Mint ASA verifiable blockchain credentials & AlgoKit CLI terminal",
                icon: Coins,
                color: "text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
                badge: "Web3 ASA",
              },
              {
                id: "backup",
                title: "Storage & Backup Hub",
                desc: "Cloud sync, JSON data exports, and offline recovery diagnostics",
                icon: Database,
                color: "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                badge: "Persistence",
              },
            ].map((station) => {
              const IconComp = station.icon;
              return (
                <div
                  key={station.id}
                  onClick={() => onNavigateToTab(station.id)}
                  className="group relative p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] dark:hover:border-[#FF9900] bg-white dark:bg-slate-950 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg border ${station.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="hidden sm:inline-block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {station.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#FF9900] transition-colors leading-tight">
                      {station.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                      {station.desc}
                    </p>
                  </div>
                  <div className="hidden sm:flex mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 items-center justify-between text-[11px] font-semibold text-[#FF9900]">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Study Goal Progress Tracker */}
      {widgetVisibility.dailyGoal && (
        <DailyGoalTracker
          dailyStudyGoal={dailyStudyGoal}
          todayStudyMinutes={todayStudyMinutes}
          onUpdateDailyGoal={onUpdateDailyGoal}
          onAddStudyMinutes={onAddStudyMinutes}
          onResetStudyMinutes={onResetStudyMinutes}
        />
      )}

      {/* Weekly Study Progress Line Chart */}
      {widgetVisibility.weeklyChart && (
        <WeeklyStudyChart 
          todayStudyMinutes={todayStudyMinutes} 
          dailyMinutesLog={dailyMinutesLog} 
          dailyStudyGoal={dailyStudyGoal} 
        />
      )}

      {/* Monthly Heatmap View */}
      {widgetVisibility.monthlyHeatmap && (
        <MonthlyHeatmap
          dailyMinutesLog={dailyMinutesLog}
          dailyStudyGoal={dailyStudyGoal}
        />
      )}

      {/* Recharts Analytics: Domain Mastery & Quiz Accuracy Trends */}
      {widgetVisibility.analyticsCharts && (
        <DashboardAnalyticsCharts
          domains={domains}
          flashcards={flashcards}
          studyHistory={studyHistory}
          quizHistory={quizHistory}
          trickQuestions={trickQuestions}
          dailyMinutesLog={dailyMinutesLog}
          todayStudyMinutes={todayStudyMinutes}
          dailyStudyGoal={dailyStudyGoal}
        />
      )}

      {/* Dynamic Diagnostic Health Check Card */}
      {widgetVisibility.diagnostics && (strongestDomain || weakestDomain) ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#FF9900]" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                AI Study Diagnostics & Weakness Analysis
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayVoiceSummary}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                  isPlayingVoice 
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse" 
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-white"
                }`}
                title="Play Audio Summary"
              >
                {isPlayingVoice ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isPlayingVoice ? "Stop Audio" : "Voice Summary"}
              </button>
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded">
                Real-time Insights
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strongest area */}
            <div className="p-4 rounded bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/60 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 fill-emerald-50 dark:fill-emerald-950" />
                  Your Strongest Suit
                </span>
                {strongestDomain ? (
                  <>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {strongestDomain.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Excellent work! You have reached <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{strongestDomain.progress}%</strong> mastery in this domain. Keep maintaining this solid baseline.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    No domain progress recorded yet. Start studying flashcards or testing yourself to identify strengths!
                  </p>
                )}
              </div>
            </div>

            {/* Weakest Area (Primary Blind Spot) */}
            <div className="p-4 rounded bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/60 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 fill-rose-50 dark:fill-rose-950" />
                  Primary Blind Spot
                </span>
                {weakestDomain ? (
                  <>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {weakestDomain.name} ({weakestDomain.progress}% Mastery)
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal mt-1 italic">
                        "{getWeakestDomainAdvice(weakestDomain.id)}"
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => onSelectDomainForFlashcards(weakestDomain.id)}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer inline-flex items-center gap-1 border dark:border-slate-700"
                      >
                        Target Study Domain
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Amazing! You have fully mastered (100%) all AWS domains in this training suite. You are highly ready for the AWS Cloud Practitioner exam!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Domain Breakdown Section */}
      {widgetVisibility.domainBreakdown && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Exam Domain Breakdown & Mastery
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domains.map((dom) => {
              const progress = getDomainProgress(dom.id);
              return (
                <div 
                  key={dom.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-sm shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                          DOMAIN {dom.number}
                        </span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 leading-snug">
                          {dom.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100/60 dark:border-blue-800/60">
                        {progress}% Mastery
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {dom.overviewSummary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 85 ? "bg-emerald-500" : progress >= 40 ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">
                        Key Services: {dom.keyServices.slice(0, 4).join(", ")}...
                      </span>
                      <button
                        onClick={() => onSelectDomainForFlashcards(dom.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Study Cards →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical Interview Archive Section */}
      {widgetVisibility.interviewArchive && interviewHistory && interviewHistory.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Technical Interview Archive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewHistory.slice(0, 4).map((session, i) => (
              <div key={session.id || i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-sm shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      session.scorecard?.overall_rating === "Strong Hire" ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800" :
                      session.scorecard?.overall_rating === "Hire" ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800" :
                      session.scorecard?.overall_rating === "Leaning No Hire" ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800" :
                      "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}>
                      {session.scorecard?.overall_rating || "Evaluated"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1.5 leading-snug">
                    Scenario: {session.scenarioId || "Technical Interview"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {session.scorecard?.feedback_summary || "No feedback summary available."}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    <span>Technical: {session.scorecard?.metrics?.technical_accuracy}/10</span>
                    <span>Comm: {session.scorecard?.metrics?.communication}/10</span>
                  </div>
                  <button 
                    onClick={() => onNavigateToTab("interview")}
                    className="text-[#FF9900] hover:text-orange-600 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    View Simulator
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Badge & Milestone Achievements Section */}
      {widgetVisibility.achievements && (
        <Achievements achievementsList={achievementsList} />
      )}

      {/* Interactive Onboarding Diagnostics & Focus Companion Bento Grid */}
      {(widgetVisibility.firstTimeTools || widgetVisibility.focusBuddy) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {widgetVisibility.firstTimeTools && (
            <div className="lg:col-span-8">
              <FirstTimeTools 
                onNavigateToTab={onNavigateToTab} 
                onSelectDomain={onSelectDomainForFlashcards} 
              />
            </div>
          )}
          {widgetVisibility.focusBuddy && (
            <div className="lg:col-span-4">
              <FocusBuddy onAddMinutes={onAddStudyMinutes} />
            </div>
          )}
        </div>
      )}

      {/* CUSTOMIZE WIDGETS MODAL */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] ring-1 ring-slate-900/5 dark:ring-white/10">
            
            <div className="bg-slate-900 text-slate-200 px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#FF9900] text-slate-950 rounded-xs flex items-center justify-center font-black text-xs">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                    Dashboard Widget Customizer
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Toggle visibility of dashboard cards. Preferences are saved in localStorage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer rounded hover:bg-slate-800"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              {[
                { key: "streakCard", label: "Dashboard Header & Streak Badge", desc: "Top gradient banner showing exam readiness info and active study streak." },
                { key: "cloudSync", label: "Cloud Study Sync Control Center", desc: "Firebase authentication and progress synchronization status bar." },
                { key: "readinessScore", label: "Exam Readiness Score Gauge", desc: "Circular score gauge predicting CLF-C02 exam readiness." },
                { key: "readinessMilestones", label: "Readiness Milestones & Level-Up Badges", desc: "Interactive progression track, rank tiers (Novice, Architect, Guru), and animated badge showcase." },
                { key: "quickHub", label: "Study Stations & Fast Hub Matrix", desc: "Interactive launchpad with 1-click access to all 11 AWS learning and simulation modules." },
                { key: "learningPulse", label: "Learning Pulse & Overview Stats", desc: "Flashcard mastery counters and simulator accuracy metrics." },
                { key: "leaderboard", label: "Global Streaks Leaderboard", desc: "Real-time candidate rankings and study momentum leaderboard." },
                { key: "dailyGoal", label: "Daily Study Goal Progress Tracker", desc: "Interactive study minute quota tracker with quick add buttons." },
                { key: "weeklyChart", label: "Weekly Study Progress Line Chart", desc: "7-day study consistency chart with goal benchmarks." },
                { key: "monthlyHeatmap", label: "Monthly Activity Heatmap", desc: "GitHub-style daily study intensity heatmap." },
                { key: "analyticsCharts", label: "Learner Progress & Recharts Analytics", desc: "Interactive Recharts visualization for domain mastery, quiz accuracy, and weekly study rhythm." },
                { key: "diagnostics", label: "AI Study Diagnostics & Weakness Analysis", desc: "Strongest suit, blind spot advice, and voice summary." },
                { key: "domainBreakdown", label: "Exam Domain Breakdown & Mastery", desc: "Domain-by-domain breakdown with mastery progress bars." },
                { key: "interviewArchive", label: "Technical Interview Archive", desc: "Saved mock technical interview transcripts and scores." },
                { key: "achievements", label: "Milestone Badges & Achievements", desc: "Unlockable study badges and achievement progress." },
                { key: "firstTimeTools", label: "Interactive Onboarding Diagnostics", desc: "Starter guide and tool explorer." },
                { key: "focusBuddy", label: "Focus Companion", desc: "Pomodoro timer and focus sound generator." },
              ].map((item) => {
                const isVisible = widgetVisibility[item.key] ?? true;
                return (
                  <div 
                    key={item.key}
                    onClick={() => toggleWidget(item.key)}
                    className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-center justify-between ${
                      isVisible 
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100" 
                        : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-70"
                    }`}
                  >
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{item.label}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                          isVisible ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      isVisible 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent"
                    }`}>
                      {isVisible && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={resetWidgets}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset to All Visible
              </button>

              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm shadow-xs transition-all cursor-pointer"
              >
                Save Preferences
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
