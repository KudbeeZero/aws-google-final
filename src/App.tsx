/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { domainsData, initialFlashcards, trickQuestions, distractorVault } from "./data";
import { DomainData, Flashcard, TrickQuestion, DistractorItem } from "./types";
import { DashboardView } from "./components/DashboardView";
import { FlashcardDeck } from "./components/FlashcardDeck";
import { TrickQuestionSimulator } from "./components/TrickQuestionSimulator";
import { TheDistractorVault } from "./components/TheDistractorVault";
import { ScenarioMatcher } from "./components/ScenarioMatcher";
import { TechnicalInterviewSimulator } from "./components/TechnicalInterviewSimulator";
import { StorageHub } from "./components/StorageHub";
import { InteractiveProfessor } from "./components/InteractiveProfessor";
import { getOfflineHtmlString } from "./utils/offlineTemplate";
import { 
  GraduationCap, 
  Layers, 
  BookOpen, 
  AlertTriangle, 
  HelpCircle, 
  Terminal, 
  ShieldCheck, 
  Menu, 
  X,
  Sparkles,
  Flame,
  Award,
  Download,
  Briefcase,
  Zap,
  Database,
  Bot,
  User as UserIcon,
  LogOut,
  CloudLightning,
  RefreshCw,
  Sun,
  Moon,
  ExternalLink
} from "lucide-react";
import { 
  auth, 
  loginWithGoogle, 
  loginAnonymously, 
  logoutUser, 
  saveProgressToCloud, 
  getProgressFromCloud,
} from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [selectedDomainForFlashcards, setSelectedDomainForFlashcards] = useState<string>("all");

  const [aiModelMode, setAiModelMode] = useState<"fast" | "expert">(() => {
    const saved = localStorage.getItem("aws_ai_model_mode_v1");
    return (saved as "fast" | "expert") || "expert";
  });

  useEffect(() => {
    localStorage.setItem("aws_ai_model_mode_v1", aiModelMode);
  }, [aiModelMode]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aws_study_dark_mode_v1");
      if (saved) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem("aws_study_dark_mode_v1", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state and setup API-based load
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Load user's remote cloud progress from Postgres database
        setSyncing(true);
        try {
          const data = await getProgressFromCloud(currentUser.uid);
          if (data) {
            if (data.totalStudyMinutes !== undefined) setTotalStudyMinutes(data.totalStudyMinutes);
            if (data.todayStudyMinutes !== undefined) setTodayStudyMinutes(data.todayStudyMinutes);
            if (data.dailyStudyGoal !== undefined) setDailyStudyGoal(data.dailyStudyGoal);
            if (data.studyHistory !== undefined) setStudyHistory(data.studyHistory);
            if (data.quizHistory !== undefined) setQuizHistory(data.quizHistory);
            if (data.dailyMinutesLog !== undefined) setDailyMinutesLog(data.dailyMinutesLog);
          } else {
            // Seed initial mock data if no record exists
            const log: { [dateKey: string]: number } = {};
            for (let i = 6; i > 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().split('T')[0];
              log[key] = Math.floor(Math.random() * 25) + 15;
            }
            setDailyMinutesLog(log);
          }
        } catch (error) {
          console.error("Postgres load error:", error);
        } finally {
          setSyncing(false);
          setHasLoadedCloudData(true);
        }
      } else {
        setUser(null);
        setHasLoadedCloudData(true);
      }
      setAuthLoading(false);
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Automatically close sidebar if window size changes to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Responsive tab changer
  const handleTabChange = (tab: string, domainId: string = "all") => {
    setActiveTab(tab);
    if (tab === "flashcards" || tab === "dashboard") {
      setSelectedDomainForFlashcards(domainId);
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Cloud-first state (no localStorage for data)
  const [studyHistory, setStudyHistory] = useState<{ [key: string]: "known" | "review" | null }>({});
  const [quizHistory, setQuizHistory] = useState<{ [key: string]: boolean }>({});
  const [dailyStudyGoal, setDailyStudyGoal] = useState<number>(30);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(0);
  const [totalStudyMinutes, setTotalStudyMinutes] = useState<number>(0);
  const [dailyMinutesLog, setDailyMinutesLog] = useState<{ [dateKey: string]: number }>({});
  const [streak, setStreak] = useState<number>(0);
  
  // Flag to prevent overwriting cloud state with empty local state on first load
  const [hasLoadedCloudData, setHasLoadedCloudData] = useState<boolean>(false);

  // Calculate and update current study streak
  useEffect(() => {
    if (!dailyMinutesLog) return;
    
    const calculateStreak = (log: { [dateKey: string]: number }): number => {
      if (!log || Object.keys(log).length === 0) return 0;

      let currentStreak = 0;
      const today = new Date();
      
      const formatDateString = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const r = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${r}`;
      };

      const todayStr = formatDateString(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateString(yesterday);

      const hasActivityToday = (log[todayStr] || 0) > 0;
      const hasActivityYesterday = (log[yesterdayStr] || 0) > 0;

      if (!hasActivityToday && !hasActivityYesterday) {
        return 0;
      }

      let currentCheckDate = new Date(today);
      if (!hasActivityToday && hasActivityYesterday) {
        currentCheckDate = yesterday;
      }

      while (true) {
        const dateStr = formatDateString(currentCheckDate);
        if ((log[dateStr] || 0) > 0) {
          currentStreak++;
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
          break;
        }
      }

      return currentStreak;
    };

    setStreak(calculateStreak(dailyMinutesLog));
  }, [dailyMinutesLog]);

  // Sync today's study minutes with the daily log
  useEffect(() => {
    if (!hasLoadedCloudData) return;
    const todayKey = new Date().toISOString().split('T')[0];
    if (dailyMinutesLog[todayKey] !== todayStudyMinutes) {
      setDailyMinutesLog((prev) => ({
        ...prev,
        [todayKey]: todayStudyMinutes,
      }));
    }
  }, [todayStudyMinutes, hasLoadedCloudData]);

  // Action to download standalone offline companion
  const handleDownloadOfflineCompanion = () => {
    try {
      const htmlString = getOfflineHtmlString();
      const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "aws_clf_c02_offline_study_companion.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Could not download companion:", err);
    }
  };

  // Auto-save changes to cloud when state changes (debounced)
  useEffect(() => {
    if (user && hasLoadedCloudData) {
      const delaySave = setTimeout(async () => {
        setSyncing(true);
        await saveProgressToCloud(user.uid, {
          totalStudyMinutes,
          todayStudyMinutes,
          dailyStudyGoal,
          studyHistory,
          quizHistory,
          dailyMinutesLog
        });
        setSyncing(false);
      }, 1000); // Debounce to avoid overloading write rate
      return () => clearTimeout(delaySave);
    }
  }, [user, hasLoadedCloudData, totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, dailyMinutesLog]);

  // Handle daily study goal metrics
  const handleUpdateDailyGoal = (mins: number) => {
    setDailyStudyGoal(mins);
  };

  const handleAddStudyMinutes = (mins: number) => {
    setTodayStudyMinutes((prev) => prev + mins);
    setTotalStudyMinutes((prev) => prev + mins);
  };

  const handleResetStudyMinutes = () => {
    setTodayStudyMinutes(0);
  };

  // Handle flashcard feedback
  const handleMarkCard = (cardId: string, status: "known" | "review") => {
    setStudyHistory((prev) => ({
      ...prev,
      [cardId]: status,
    }));
  };

  // Reset study statistics
  const handleResetStudyHistory = () => {
    if (window.confirm("Are you sure you want to reset all flashcard statistics?")) {
      setStudyHistory({});
    }
  };

  // Handle quiz submission
  const handleRecordQuizResult = (questionId: string, isCorrect: boolean) => {
    setQuizHistory((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
  };

  // Reset quiz history
  const handleResetQuiz = () => {
    if (window.confirm("Are you sure you want to reset all your quiz answers?")) {
      setQuizHistory({});
    }
  };

  const handleImportProgress = (study: any, quiz: any) => {
    setStudyHistory(study);
    setQuizHistory(quiz);
  };

  const handleClearAllProgress = () => {
    setStudyHistory({});
    setQuizHistory({});
    setTodayStudyMinutes(0);
    setTotalStudyMinutes(0);
  };

  // Switch to flashcards and select a specific domain
  const handleSelectDomainForFlashcards = (domainId: string) => {
    setSelectedDomainForFlashcards(domainId);
    setActiveTab("flashcards");
  };

  // Dynamic readiness metric calculation
  const totalCards = initialFlashcards.length;
  const knownCards = Object.values(studyHistory).filter((v) => v === "known").length;
  const correctQuizzes = Object.values(quizHistory).filter((v) => v === true).length;
  const readinessScore = Math.min(
    100,
    Math.round(
      (knownCards / (totalCards || 1)) * 50 + 
      (correctQuizzes / (trickQuestions.length || 1)) * 50
    )
  );

  return (
    <div className={`bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen w-full flex flex-col overflow-hidden font-sans ${darkMode ? "dark" : ""}`}>
      
      {/* Top Navigation / Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-white dark:bg-slate-900 shrink-0 z-20">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm shrink-0"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-950 flex items-center justify-center rounded-sm font-black text-[#FF9900] text-xs border border-slate-800 dark:border-slate-900 shrink-0">
            AWS
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold tracking-tight text-[11px] sm:text-xs md:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1 leading-none truncate">
              CLF-C02 STUDY COMPANION <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0 hidden xs:inline" />
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wide truncate hidden md:block">
              Solutions Architect Interactive Training Suite
            </span>
          </div>
        </div>

        {/* Global Progress Indicators */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 min-w-0">
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold leading-none">
              Ready Score
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              {readinessScore}% 
              <span className={`w-2 h-2 rounded-full ${readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 40 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
            </span>
          </div>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden xs:block"></div>

          <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full border flex items-center gap-1.5 shrink-0 transition-all ${
            streak >= 7 
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' 
              : streak >= 3 
                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' 
                : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}>
            <Flame className={`w-3.5 h-3.5 shrink-0 ${
              streak >= 7 
                ? 'text-rose-500 fill-rose-500 animate-bounce' 
                : streak >= 3 
                  ? 'text-amber-500 fill-amber-500 animate-pulse' 
                  : 'text-slate-400 dark:text-slate-500'
            }`} />
            <span className="uppercase tracking-wider">
              {streak >= 7 ? `7-Day Supernova (${streak}d)` : streak >= 3 ? `3-Day Burner (${streak}d)` : `${streak} Day Streak`}
            </span>
          </div>

          <button
            onClick={handleDownloadOfflineCompanion}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#FF9900]/10 hover:bg-[#FF9900]/20 text-[#FF9900] text-[10px] sm:text-xs font-black rounded-full border border-[#FF9900]/30 transition-all shadow-sm cursor-pointer shrink-0"
            title="Download Single-File Standalone HTML Version"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">OFFLINE COMPANION (.HTML)</span>
            <span className="inline lg:hidden">OFFLINE</span>
          </button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden xs:block"></div>

          {/* User Account / Sync status */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-750 shrink-0" />
          ) : user ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Cloud Sync Status Indicator */}
              <span 
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative cursor-pointer"
                title={syncing ? "Syncing study progress to AWS Study Cloud..." : isOffline ? "Offline mode active" : "Study progress safe in Firebase Cloud"}
              >
                {isOffline ? (
                  <CloudLightning className="w-4 h-4 text-red-500" />
                ) : (
                  <CloudLightning className={`w-4 h-4 ${syncing ? 'text-[#FF9900] animate-bounce' : 'text-emerald-500'}`} />
                )}
                {!isOffline && <span className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full ${syncing ? 'bg-[#FF9900]' : 'bg-emerald-500'}`} />}
              </span>
              
              {/* User profile bubble */}
              <div 
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700"
                title={`${user.displayName || 'Cloud Learner'} (${user.email || 'Anonymous'})`}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="avatar" 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-900 text-[#FF9900] flex items-center justify-center font-bold text-[9px] border border-slate-700 dark:border-slate-800 shrink-0 uppercase">
                    {(user.displayName || user.email || 'A').charAt(0)}
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 max-w-[60px] truncate hidden xs:inline-block">
                  {user.displayName?.split(' ')[0] || (user.isAnonymous ? 'Guest' : 'Cloud Student')}
                </span>
                <button 
                  onClick={() => logoutUser()}
                  className="p-0.5 text-slate-400 hover:text-red-500 transition-colors shrink-0 animate-fade-in"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setActiveTab("dashboard");
                loginWithGoogle().catch(err => {
                  console.error("Sign in failed:", err);
                });
              }}
              className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white text-[10px] sm:text-xs font-black rounded-full hover:bg-slate-800 border border-slate-900 transition-all shadow-sm cursor-pointer shrink-0"
              title="Sign in with Google to sync progress across devices"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#FF9900]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-900/50 p-2 flex items-center justify-center gap-2 text-red-700 dark:text-red-400 text-xs font-bold shrink-0">
          <AlertTriangle className="w-4 h-4" />
          <span>You are currently offline. Cloud syncing is paused, but you can continue studying using local storage!</span>
        </div>
      )}

      {/* Iframe Notice Banner for Sign In */}
      {isIframe && !user && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/40 p-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold shrink-0 text-center animate-fade-in">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#FF9900]" />
            <span>Google Sign-In is restricted inside preview iframes. Please open this app in a new tab to authenticate securely.</span>
          </div>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] uppercase tracking-wide transition-all cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open App in New Tab</span>
          </a>
        </div>
      )}

      {/* Main Dockable Navigation Layout */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/65 backdrop-blur-xs z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Dockable Left Sidebar */}
        <aside 
          className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out shrink-0 flex flex-col justify-between 
            fixed md:relative top-0 bottom-0 left-0 z-30 md:z-10 h-screen md:h-full
            ${sidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-0 -translate-x-full md:translate-x-0 overflow-hidden border-r-0"}
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-900 dark:bg-slate-950 flex items-center justify-center rounded-sm font-black text-[#FF9900] text-[10px] border border-slate-800 dark:border-slate-905">
                AWS
              </div>
              <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                CLF-C02 Companion
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Tabs */}
          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3 px-2">
                Core Workspace
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  Dashboard
                </button>

                <button
                  onClick={() => handleTabChange("professor")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "professor"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Bot className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  Socratic AI Professor
                </button>

                <button
                  onClick={() => handleTabChange("flashcards")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "flashcards"
                      ? "bg-[#FF9900] text-white shadow-sm dark:bg-amber-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Flashcards
                </button>

                <button
                  onClick={() => handleTabChange("matching")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "matching"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  Scenario Matcher Game
                </button>

                <button
                  onClick={() => handleTabChange("simulator")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "simulator"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Exam Simulator
                </button>

                <button
                  onClick={() => handleTabChange("interview")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "interview"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Briefcase className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  HONE Interview Prep
                </button>

                <button
                  onClick={() => handleTabChange("vault")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "vault"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  The Distractor Vault
                </button>

                <button
                  onClick={() => handleTabChange("backup")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "backup"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  Save Slots & Backups
                </button>
              </nav>
            </div>

            {/* Mini Study Metrics Widget in sidebar */}
            {sidebarOpen && (
              <div className="bg-slate-50/70 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-sm space-y-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Quick Progress
                </span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Cards Mastered</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{knownCards} / {totalCards}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full animate-pulse"
                        style={{ width: `${(knownCards / (totalCards || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Quiz Scenarios</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{correctQuizzes} / {trickQuestions.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#FF9900] h-full"
                        style={{ width: `${(correctQuizzes / (trickQuestions.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Control and AI Settings */}
          <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 shrink-0">
            {/* AI Model Intelligence Toggle */}
            <div className="px-4 py-3 flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between">
                Intelligence Engine
                {aiModelMode === "expert" ? <Sparkles className="w-3 h-3 text-emerald-500" /> : <Zap className="w-3 h-3 text-[#FF9900]" />}
              </span>
              <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-sm">
                <button
                  onClick={() => setAiModelMode("fast")}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded-xs uppercase transition-all ${
                    aiModelMode === "fast" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Fast Mode
                </button>
                <button
                  onClick={() => setAiModelMode("expert")}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded-xs uppercase transition-all ${
                    aiModelMode === "expert" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Expert Mode
                </button>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                {aiModelMode === "fast" ? "gemini-3.5-flash: Optimized for speed and quick recall." : "gemini-3.1-pro: Advanced reasoning for complex scenarios."}
              </p>
            </div>
            {/* Theme Toggle */}
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Theme Control
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                title={darkMode ? "Banish the shadows, switch to Light Mode" : "Rest your eyes, switch to Dark Mode"}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-spin-slow" />
                    <span className="text-amber-500">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                    <span className="text-slate-500">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Footer with Credits */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 space-y-1 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
            <p className="font-bold text-slate-500 dark:text-slate-400">CLF-C02 Premium Suite</p>
            <p className="leading-snug">Designed for AWS Certified Cloud Practitioner mastery.</p>
          </div>
        </aside>

        {/* Core Workspace Main Stage */}
        <main className="flex-1 p-4 sm:p-6 min-h-0 overflow-y-auto">
          
          {/* Welcome Notification Accent */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-sm flex items-start justify-between gap-4 shadow-sm mb-6 border border-slate-800">
            <div className="flex gap-3 items-start">
              <div className="bg-[#FF9900] text-slate-900 p-2 rounded-xs shrink-0">
                <Sparkles className="w-4 h-4 text-slate-900 fill-slate-900" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-[#FF9900] uppercase">
                  CLF-C02 Masterclass Interactive Simulator
                </h3>
                <p className="text-xs text-slate-300 leading-normal mt-0.5 max-w-2xl">
                  Bypass the AWS exam trap questions! Tap into our active recall flip cards, test yourself in the scenario-based multiple choice engine, or search the Distractor Vault for core overlapping services.
                </p>
              </div>
            </div>
            
            <span className="text-[10px] font-mono font-bold text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/25 px-2.5 py-1 rounded-sm shrink-0 uppercase tracking-widest hidden md:inline-block">
              Study Hub v2
            </span>
          </div>

          {/* Dynamic Tab Rendering */}
          {activeTab === "dashboard" && (
            <DashboardView
              domains={domainsData}
              flashcards={initialFlashcards}
              studyHistory={studyHistory}
              quizHistory={quizHistory}
              totalQuizCount={trickQuestions.length}
              onNavigateToTab={setActiveTab}
              onSelectDomainForFlashcards={handleSelectDomainForFlashcards}
              dailyStudyGoal={dailyStudyGoal}
              todayStudyMinutes={todayStudyMinutes}
              totalStudyMinutes={totalStudyMinutes}
              onUpdateDailyGoal={handleUpdateDailyGoal}
              onAddStudyMinutes={handleAddStudyMinutes}
              onResetStudyMinutes={handleResetStudyMinutes}
              user={user}
              authLoading={authLoading}
              syncing={syncing}
              dailyMinutesLog={dailyMinutesLog}
              streak={streak}
            />
          )}

          {activeTab === "professor" && (
            <InteractiveProfessor user={user} onAddMinutes={handleAddStudyMinutes} aiModelMode={aiModelMode} />
          )}

          {activeTab === "flashcards" && (
            <FlashcardDeck
              flashcards={initialFlashcards}
              domains={domainsData}
              studyHistory={studyHistory}
              onMarkCard={handleMarkCard}
              onResetStudyHistory={handleResetStudyHistory}
              initialDomainId={selectedDomainForFlashcards}
            />
          )}

          {activeTab === "simulator" && (
            <TrickQuestionSimulator
              questions={trickQuestions}
              quizHistory={quizHistory}
              onRecordResult={handleRecordQuizResult}
              onResetQuiz={handleResetQuiz}
            />
          )}

          {activeTab === "vault" && (
            <TheDistractorVault vaultItems={distractorVault} />
          )}

          {activeTab === "matching" && (
            <ScenarioMatcher />
          )}

          {activeTab === "interview" && (
            <TechnicalInterviewSimulator aiModelMode={aiModelMode} user={user} />
          )}

          {activeTab === "backup" && (
            <StorageHub 
              studyHistory={studyHistory}
              quizHistory={quizHistory}
              onImportProgress={handleImportProgress}
              onClearAll={handleClearAllProgress}
            />
          )}

        </main>
      </div>

      {/* Footer Meta bar */}
      <footer className="h-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono select-none z-20">
        <div className="flex space-x-6 items-center">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            SESSION: <span className="text-slate-600 dark:text-slate-300 font-semibold">AWS_MASTER_2026</span>
          </span>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
          <span className="hidden sm:flex items-center gap-1.5">
            READINESS SCORE: 
            <span className="text-slate-700 dark:text-slate-200 font-bold">{readinessScore}%</span>
            <span className="w-16 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden inline-block border border-slate-300/40 dark:border-slate-700/40">
              <span 
                className="bg-emerald-500 h-full block transition-all duration-300" 
                style={{ width: `${readinessScore}%` }}
              ></span>
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF9900] font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/40 px-2 py-0.5 rounded-sm border border-slate-300/40 dark:border-slate-750/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            Solutions Architect Verified
          </span>
        </div>
      </footer>
    </div>
  );
}
