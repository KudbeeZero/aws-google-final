import React, { useMemo } from "react";
import { Award, CheckCircle, Flame, ShieldAlert, Sparkles, BookOpen, Layers, Trophy, AlertTriangle, TrendingUp, ShieldCheck, Bot, HelpCircle, Zap, Lock, Cloud, CloudLightning, Key, UserCheck, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { DomainData, Flashcard, Achievement } from "../types";
import { FirstTimeTools } from "./FirstTimeTools";
import { FocusBuddy } from "./FocusBuddy";
import { DailyGoalTracker } from "./DailyGoalTracker";
import { WeeklyStudyChart } from "./WeeklyStudyChart";
import { MonthlyHeatmap } from "./MonthlyHeatmap";
import { loginWithGoogle, loginAnonymously, logoutUser } from "../lib/firebase";

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

  // State for Achievements filtering
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "study" | "mastery" | "quiz" | "chat">("all");
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Streak calculation
  const streak = useMemo(() => {
    if (!dailyMinutesLog) return 0;
    let currentStreak = 0;
    let isStreakBroken = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const mins = dailyMinutesLog[dateStr] || 0;
      const metGoal = mins >= dailyStudyGoal && dailyStudyGoal > 0;
      
      if (i === 0) {
        if (metGoal) currentStreak++;
      } else {
        if (metGoal && !isStreakBroken) {
          currentStreak++;
        } else if (!metGoal) {
          isStreakBroken = true;
        }
      }
    }
    return currentStreak;
  }, [dailyMinutesLog, dailyStudyGoal]);

  const [isPlayingVoice, setIsPlayingVoice] = React.useState(false);

  const handlePlayVoiceSummary = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

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

    const utterance = new SpeechSynthesisUtterance(textParts.join(" "));
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferredVoice = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) || englishVoices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    
    window.speechSynthesis.speak(utterance);
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

  const unlockedCount = achievementsList.filter(a => a.unlocked).length;
  const totalAchievements = achievementsList.length;
  const overallProgressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  const filteredAchievements = achievementsList.filter(a => categoryFilter === "all" || a.category === categoryFilter);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Cloud Integration / Progress Sync Control Center */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-sm shrink-0 ${user ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20'}`}>
              {user ? (
                <UserCheck className="w-5 h-5 shrink-0" />
              ) : (
                <Cloud className="w-5 h-5 shrink-0" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none uppercase">
                {user ? "AWS Masterclass Cloud Sync Active" : "Connect AWS Cloud Study Sync"}
              </h4>
              <p className="text-xs text-slate-500 leading-normal mt-1.5">
                {user ? (
                  <span>
                    Your progress is synchronized securely. Logged in as <strong className="text-slate-700">{user.email || 'Anonymous Guest'}</strong>. {syncing ? <span className="text-[#FF9900] animate-pulse">Syncing changes...</span> : <span className="text-emerald-600 font-medium">Progress saved to Firestore database.</span>}
                  </span>
                ) : (
                  <span>
                    Keep your flashcards, scores, and exam readiness synchronized. Authenticate to secure your progression database from cache resets.
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            {authLoading ? (
              <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-sm animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Checking credentials...</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    try {
                      setAuthError(null);
                      await logoutUser();
                    } catch (e) {
                      console.error("Logout failed:", e);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-bold rounded-sm transition-all text-center cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    try {
                      setAuthError(null);
                      await loginWithGoogle();
                    } catch (e: any) {
                      console.error("Google Auth failed:", e);
                      setAuthError("Google Sign-In was closed or blocked. If you are inside an iframe, please click the 'Open App' button in the toolbar to run in a standalone tab and sign in successfully.");
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Authenticate via Google Identity Services"
                >
                  <Key className="w-4 h-4 text-[#FF9900]" />
                  <span>Connect Google Account</span>
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
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-sm transition-all text-center cursor-pointer whitespace-nowrap"
                  title="Sign in with a temporary guest account"
                >
                  Guest Sync
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
      </div>

      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Readiness Score Circular/Hero Gauge (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-sm flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 bg-[#FF9900]/10 text-[#FF9900] text-[9px] font-bold uppercase tracking-wider rounded-bl-sm">
            Ready Check
          </div>
          
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Exam Readiness Score
          </h3>

          <div className="relative flex items-center justify-center mb-4">
            {/* Simple circular metric display using CSS clip path or clean text layout */}
            <div className="w-32 h-32 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center relative">
              <span className="text-4xl font-black text-slate-800 tracking-tight">
                {readinessScore}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Score
              </span>
              {/* Colored ring indicator */}
              <div 
                className={`absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-500 animate-spin-slow opacity-15`}
              />
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full border text-xs font-bold ${readinessColor} mb-2`}>
            {readinessLabel}
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs leading-normal mt-1">
            Readiness improves as you mark cards as <strong>Mastered</strong> in the flashcard deck and pass scenarios in the <strong>Exam Simulator</strong>.
          </p>
        </div>

        {/* Overview Stats (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Your Learning Pulse
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Stat Card 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Flashcard Mastery
                </span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block mt-1">
                  {knownCards} <span className="text-xs text-slate-400 font-medium">/ {totalCards}</span>
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(knownCards / (totalCards || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Simulator Accuracy
                </span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block mt-1">
                  {Math.round(quizScorePercent)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {correctQuizzes} correct of {attemptedQuizzes} attempts
                </span>
              </div>

              {/* Stat Card 3 */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Review Pool size
                </span>
                <span className="text-2xl font-black text-amber-600 tracking-tight block mt-1 flex items-center gap-1.5">
                  {Object.values(studyHistory).filter((v) => v === "review").length}
                  {Object.values(studyHistory).filter((v) => v === "review").length > 0 && (
                    <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </span>
                <button 
                  onClick={() => onNavigateToTab("flashcards")}
                  className="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-wider block mt-1 text-left"
                >
                  Review items →
                </button>
              </div>

            </div>
          </div>

          <div className="mt-5 p-3.5 bg-amber-50/50 border border-amber-100 rounded-sm flex gap-3 items-start">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">
                AWS Pro Tip: Focus on Domain Weight
              </h5>
              <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                Domain 2 (Security) and Domain 3 (Technology) account for over <strong>64%</strong> of the CLF-C02 questions. We recommend focusing heavily on service distinctions like WAF vs Shield in the <strong>Distractor Vault</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Study Goal Progress Tracker */}
      <DailyGoalTracker
        dailyStudyGoal={dailyStudyGoal}
        todayStudyMinutes={todayStudyMinutes}
        onUpdateDailyGoal={onUpdateDailyGoal}
        onAddStudyMinutes={onAddStudyMinutes}
        onResetStudyMinutes={onResetStudyMinutes}
      />

      {/* Weekly Study Progress Line Chart */}
      <WeeklyStudyChart 
        todayStudyMinutes={todayStudyMinutes} 
        dailyMinutesLog={dailyMinutesLog} 
        dailyStudyGoal={dailyStudyGoal} 
      />

      {/* Monthly Heatmap View */}
      <MonthlyHeatmap
        dailyMinutesLog={dailyMinutesLog}
        dailyStudyGoal={dailyStudyGoal}
      />

      {/* Dynamic Diagnostic Health Check Card */}
      {(strongestDomain || weakestDomain) ? (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#FF9900]" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                AI Study Diagnostics & Weakness Analysis
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayVoiceSummary}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                  isPlayingVoice 
                    ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse" 
                    : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700"
                }`}
                title="Play Audio Summary"
              >
                {isPlayingVoice ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isPlayingVoice ? "Stop Audio" : "Voice Summary"}
              </button>
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                Real-time Insights
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strongest area */}
            <div className="p-4 rounded bg-slate-50/50 border border-slate-100/60 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 fill-emerald-50" />
                  Your Strongest Suit
                </span>
                {strongestDomain ? (
                  <>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      {strongestDomain.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Excellent work! You have reached <strong className="text-emerald-600 font-extrabold">{strongestDomain.progress}%</strong> mastery in this domain. Keep maintaining this solid baseline.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No domain progress recorded yet. Start studying flashcards or testing yourself to identify strengths!
                  </p>
                )}
              </div>
            </div>

            {/* Weakest Area (Primary Blind Spot) */}
            <div className="p-4 rounded bg-slate-50/50 border border-slate-100/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 fill-rose-50" />
                  Primary Blind Spot
                </span>
                {weakestDomain ? (
                  <>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {weakestDomain.name} ({weakestDomain.progress}% Mastery)
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-normal mt-1 italic">
                        "{getWeakestDomainAdvice(weakestDomain.id)}"
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => onSelectDomainForFlashcards(weakestDomain.id)}
                        className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Target Study Domain
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Amazing! You have fully mastered (100%) all AWS domains in this training suite. You are highly ready for the AWS Cloud Practitioner exam!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Domain Breakdown Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Exam Domain Breakdown & Mastery
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((dom) => {
            const progress = getDomainProgress(dom.id);
            return (
              <div 
                key={dom.id}
                className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        DOMAIN {dom.number}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5 leading-snug">
                        {dom.name}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/60">
                      {progress}% Mastery
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {dom.overviewSummary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress >= 85 ? "bg-emerald-500" : progress >= 40 ? "bg-blue-500" : "bg-slate-300"
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">
                      Key Services: {dom.keyServices.slice(0, 4).join(", ")}...
                    </span>
                    <button
                      onClick={() => onSelectDomainForFlashcards(dom.id)}
                      className="text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider hover:underline"
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

      {/* Dynamic Badge & Milestone Achievements Section */}
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
            <div
              key={badge.id}
              className={`border p-4 rounded-sm flex flex-col justify-between transition-all duration-300 relative group ${
                badge.unlocked
                  ? "bg-slate-950/70 border-amber-500/40 hover:border-[#FF9900]/80 shadow-md"
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
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Onboarding Diagnostics & Focus Companion Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8">
          <FirstTimeTools 
            onNavigateToTab={onNavigateToTab} 
            onSelectDomain={onSelectDomainForFlashcards} 
          />
        </div>
        <div className="lg:col-span-4">
          <FocusBuddy onAddMinutes={onAddStudyMinutes} />
        </div>
      </div>

    </div>
  );
};
