import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Award, CheckCircle, Flame, ShieldAlert, Sparkles, BookOpen, Layers, Trophy, AlertTriangle, TrendingUp, ShieldCheck, Bot, HelpCircle, Zap, Lock, Cloud, CloudLightning, Key, UserCheck, RefreshCw, Volume2, VolumeX, ExternalLink, Mail } from "lucide-react";
import { DomainData, Flashcard, Achievement } from "../types";
import { FirstTimeTools } from "./FirstTimeTools";
import { FocusBuddy } from "./FocusBuddy";
import { DailyGoalTracker } from "./DailyGoalTracker";
import { WeeklyStudyChart } from "./WeeklyStudyChart";
import { MonthlyHeatmap } from "./MonthlyHeatmap";
import { Achievements } from "./Achievements";
import { loginWithGoogle, loginAnonymously, logoutUser, registerWithEmail, loginWithEmail } from "../lib/firebase";

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
  const [showEmailAuth, setShowEmailAuth] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [isRegistering, setIsRegistering] = React.useState<boolean>(false);
  const [emailLoading, setEmailLoading] = React.useState<boolean>(false);

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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* DashboardHeader with Streak and Greetings */}
      <div id="dashboard-header" className="bg-gradient-to-r from-amber-500 via-[#FF9900] to-orange-600 rounded-sm p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Abstract background blobs for premium aesthetic */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-16 -mb-16 blur-xl pointer-events-none" />
        
        <div className="relative z-10 text-center md:text-left">
          <span className="bg-white/20 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-[2px] tracking-widest leading-none">
            AWS Certified Cloud Practitioner (CLF-C02)
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-white">
            AWS Masterclass Study Dashboard
          </h1>
          <p className="text-xs text-white/90 leading-normal mt-1 max-w-xl">
            Welcome back to your ultimate interactive training console. Build muscle memory through active recall, tackle challenging exam simulations, and sharpen your cloud architect reasoning.
          </p>
        </div>

        {/* Flame Badge / Streak Indicator section */}
        <div className="relative z-10 flex items-center gap-3 bg-white/15 backdrop-blur-xs border border-white/25 px-4 py-3 rounded-sm shadow-inner shrink-0 w-full sm:w-auto justify-center sm:justify-start">
          <div className="relative flex items-center justify-center">
            {streak >= 3 ? (
              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  rotate: [0, 4, -4, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <Flame className={`w-10 h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] ${streak >= 7 ? "text-rose-200 fill-rose-300" : "text-amber-200 fill-amber-300"}`} />
                {/* Visual sparkles or pulse rings for 3/7 day streaks */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </motion.div>
            ) : (
              <Flame className="w-10 h-10 text-white/45" />
            )}
          </div>
          
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none">
              Daily Study Streak
            </span>
            <span className="text-xl font-black mt-1 text-white tracking-tight flex items-center gap-2">
              {streak} {streak === 1 ? "Day" : "Days"}
              {streak >= 7 ? (
                <span className="bg-rose-500/30 text-white border border-rose-500/50 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[2px] tracking-wider animate-pulse shrink-0">
                  7-Day Supernova! 🚀
                </span>
              ) : streak >= 3 ? (
                <span className="bg-amber-500/30 text-white border border-amber-500/50 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[2px] tracking-wider shrink-0">
                  3-Day Burner! 🔥
                </span>
              ) : (
                <span className="text-white/60 text-xs font-normal shrink-0">
                  (Keep going!)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
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
                      await loginWithGoogle();
                    } catch (e: any) {
                      console.error("Google Auth failed:", e);
                      setAuthError("Google Sign-In was closed or blocked. If you are inside an iframe, please use the 'Open in New Tab' button to run in a standalone tab and sign in successfully.");
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Authenticate via Google Identity Services"
                >
                  <Key className="w-4 h-4 text-[#FF9900]" />
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
      <Achievements achievementsList={achievementsList} />

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
