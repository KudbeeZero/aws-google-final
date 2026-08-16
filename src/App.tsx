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
import { AlgorandPortal } from "./components/AlgorandPortal";
import { AgentSwarmHub } from "./components/AgentSwarmHub";
import { VisualArchitectureLearning } from "./components/VisualArchitectureLearning";
import { LightningRushArena } from "./components/LightningRushArena";
import { getOfflineHtmlString } from "./utils/offlineTemplate";
import { 
  GraduationCap, 
  Layers, 
  BookOpen, 
  AlertTriangle, 
  HelpCircle, 
  Terminal, 
  Cpu, 
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
  ExternalLink,
  Wallet,
  Compass,
  Rocket,
  Globe,
  CheckCircle2,
  ArrowRight,
  MoreHorizontal
} from "lucide-react";
import { 
  auth, 
  loginWithGoogle, 
  loginAnonymously, 
  loginWithAlgorandPera,
  logoutUser, 
  saveProgressToCloud, 
  getProgressFromCloud,
  getInterviewSessionsFromCloud,
  syncStreakToLeaderboard,
  getAuthDiagnostics,
  FirebaseAuthError
} from "./lib/firebase";
import { onAuthStateChanged, User, getRedirectResult } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showQuickStartGuide, setShowQuickStartGuide] = useState<boolean>(false);
  const [showDeployGuide, setShowDeployGuide] = useState<boolean>(false);
  const [quickStartStep, setQuickStartStep] = useState<number>(1);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);
  const mainRef = React.useRef<HTMLElement>(null);

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

  // iOS scroll locking when mobile tools menu is open
  useEffect(() => {
    if (showMobileMoreMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMoreMenu]);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  // Unified Error Handling Wrapper & Central State Manager for Firestore/Cloud Operations
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoModeReason, setDemoModeReason] = useState<string | null>(null);

  const handleCloudOperation = async <T,>(operationName: string, operationFn: () => Promise<T>, fallbackValue: T): Promise<T> => {
    if (isDemoMode) {
      return fallbackValue;
    }
    try {
      return await operationFn();
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isDbError = errorMsg.toLowerCase().includes("database not found") || 
                        errorMsg.includes("503") || 
                        errorMsg.toLowerCase().includes("quota") || 
                        errorMsg.toLowerCase().includes("unavailable") || 
                        errorMsg.toLowerCase().includes("permission_denied") ||
                        errorMsg.toLowerCase().includes("failed to fetch");
      
      if (isDbError) {
        console.warn(`[Central State Manager] Cloud database error in '${operationName}': ${errorMsg}. Switching App to read-only Demo Mode with cached local data.`);
        setIsDemoMode(true);
        setDemoModeReason(`Cloud database error ('${errorMsg.slice(0, 70)}'). Switched to Read-Only Demo Mode with cached local data.`);
      } else {
        console.error(`Cloud operation '${operationName}' failed:`, errorMsg);
      }
      return fallbackValue;
    }
  };
  
  // High fidelity cloud sync stats panel
  const [showSyncStatsPanel, setShowSyncStatsPanel] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState<boolean>(false);

  const measurePingLatency = async () => {
    setIsCheckingPing(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const end = performance.now();
        setPingLatency(Math.round(end - start));
      } else {
        setPingLatency(null);
      }
    } catch {
      setPingLatency(null);
    } finally {
      setIsCheckingPing(false);
    }
  };

  const [redirectLoading, setRedirectLoading] = useState<boolean>(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [redirectSuggestedAction, setRedirectSuggestedAction] = useState<string | null>(null);
  const [redirectErrorGuide, setRedirectErrorGuide] = useState<string | null>(null);

  // Check Firebase redirect result on mount
  useEffect(() => {
    const checkRedirect = async () => {
      setRedirectLoading(true);
      setRedirectError(null);
      setRedirectSuggestedAction(null);
      setRedirectErrorGuide(null);
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect login successful:", result.user);
          setUser(result.user);
        }
      } catch (error: any) {
        console.error("Redirect Auth Error caught in App:", error);
        const diagnostics = getAuthDiagnostics();
        
        let userMessage = "The login redirect process encountered an issue.";
        let action = "Try opening the application in a standalone browser window instead of an iframe.";
        let guide = "Cross-origin redirection is blocked by browser isolation standards.";

        if (error.code === "auth/unauthorized-domain" || error?.message?.includes("unauthorized-domain")) {
          userMessage = "This hosting domain is not authorized in Firebase.";
          action = `Add "${window.location.hostname}" to the Authorized Domains list in the Firebase Console (Authentication > Settings).`;
          guide = "Firebase blocks sign-ins originating from unlisted domain names for security.";
        } else if (error.code === "auth/popup-blocked" || error?.message?.includes("popup-blocked")) {
          userMessage = "The authentication popup was blocked.";
          action = "Enable popups in your browser settings or click the button to try again.";
          guide = "Popups are prevented by default in standard browser privacy settings.";
        } else if (diagnostics.suggestedAction) {
          action = diagnostics.suggestedAction;
          guide = diagnostics.errorGuide || guide;
        }

        setRedirectError(userMessage);
        setRedirectSuggestedAction(action);
        setRedirectErrorGuide(guide);
      } finally {
        setRedirectLoading(false);
      }
    };
    checkRedirect();
  }, []);

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

  // Listen to Firebase Auth state and setup API-based load & merge
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Load user's remote cloud progress from Postgres database
        setSyncing(true);
        try {
          const data = await handleCloudOperation("getProgressFromCloud", () => getProgressFromCloud(currentUser.uid), null);
          
          // Get local guest state values
          const localHistory = getLocalState("studyHistory", {} as { [key: string]: "known" | "review" | null });
          const localQuiz = getLocalState("quizHistory", {} as { [key: string]: boolean });
          const localGoal = getLocalState("dailyStudyGoal", 30);
          const localToday = getLocalState("todayStudyMinutes", 0);
          const localTotal = getLocalState("totalStudyMinutes", 0);
          const localMinutesLog = getLocalState("dailyMinutesLog", {} as { [dateKey: string]: number });
          const localHoneState = getLocalState("honePathwayState", {} as any);
          const localTrickState = getLocalState("trickSimulatorState", {} as any);
          const localVaultState = getLocalState("vaultState", {} as any);

          // Reconcile and merge guest memory with remote cloud data
          const mergedHistory = { ...(data?.studyHistory || {}) } as { [key: string]: "known" | "review" | null };
          Object.keys(localHistory).forEach((key) => {
            if (localHistory[key]) {
              mergedHistory[key] = localHistory[key];
            }
          });

          const mergedQuiz = { ...(data?.quizHistory || {}) } as { [key: string]: boolean };
          Object.keys(localQuiz).forEach((key) => {
            if (localQuiz[key] !== undefined) {
              mergedQuiz[key] = localQuiz[key] || mergedQuiz[key];
            }
          });

          const mergedGoal = data?.dailyStudyGoal !== undefined ? data.dailyStudyGoal : localGoal;
          const mergedToday = data?.todayStudyMinutes !== undefined ? Math.max(data.todayStudyMinutes, localToday) : localToday;
          const mergedTotal = data?.totalStudyMinutes !== undefined ? Math.max(data.totalStudyMinutes, localTotal) : localTotal;

          const mergedMinutesLog = { ...(data?.dailyMinutesLog || {}) } as { [dateKey: string]: number };
          Object.keys(localMinutesLog).forEach((key) => {
            mergedMinutesLog[key] = Math.max(mergedMinutesLog[key] || 0, localMinutesLog[key] || 0);
          });

          const mergedHoneState = { ...(data?.honePathwayState || {}), ...localHoneState };
          const mergedTrickState = { ...(data?.trickSimulatorState || {}), ...localTrickState };
          const mergedVaultState = { ...(data?.vaultState || {}), ...localVaultState };

          // Seed default logs if both cloud and guest history are completely empty
          if (!data && Object.keys(mergedMinutesLog).length === 0) {
            for (let i = 6; i > 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().split('T')[0];
              mergedMinutesLog[key] = Math.floor(Math.random() * 25) + 15;
            }
          }

          // Update React states
          setStudyHistory(mergedHistory);
          setQuizHistory(mergedQuiz);
          setDailyStudyGoal(mergedGoal);
          setTodayStudyMinutes(mergedToday);
          setTotalStudyMinutes(mergedTotal);
          setDailyMinutesLog(mergedMinutesLog);
          setHoneState(mergedHoneState);
          setTrickSimulatorState(mergedTrickState);
          setVaultState(mergedVaultState);

          // Save the unified dataset to Postgres Cloud immediately
          await handleCloudOperation("saveProgressToCloud-initial", () => saveProgressToCloud(currentUser.uid, {
            totalStudyMinutes: mergedTotal,
            todayStudyMinutes: mergedToday,
            dailyStudyGoal: mergedGoal,
            studyHistory: mergedHistory,
            quizHistory: mergedQuiz,
            dailyMinutesLog: mergedMinutesLog,
            honePathwayState: mergedHoneState,
            trickSimulatorState: mergedTrickState,
            vaultState: mergedVaultState
          }), undefined);

          // Clean up the guest keys to keep browser local storage tidy
          localStorage.removeItem("aws_guest_studyHistory_v1");
          localStorage.removeItem("aws_guest_quizHistory_v1");
          localStorage.removeItem("aws_guest_dailyStudyGoal_v1");
          localStorage.removeItem("aws_guest_todayStudyMinutes_v1");
          localStorage.removeItem("aws_guest_totalStudyMinutes_v1");
          localStorage.removeItem("aws_guest_dailyMinutesLog_v1");
          localStorage.removeItem("aws_guest_honePathwayState_v1");
          localStorage.removeItem("aws_guest_trickSimulatorState_v1");
          localStorage.removeItem("aws_guest_vaultState_v1");

          // Load interview sessions history
          const interviewSessions = await handleCloudOperation("getInterviewSessionsFromCloud", () => getInterviewSessionsFromCloud(), []);
          setInterviewHistory(interviewSessions);
          
          setLastSyncTime(new Date());
        } catch (error) {
          console.error("Postgres load & merge error:", error);
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
    setShowMobileMoreMenu(false);
    if (tab === "flashcards" || tab === "dashboard") {
      setSelectedDomainForFlashcards(domainId);
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAlgorandLogin = async (walletAddress: string, displayName: string) => {
    try {
      setAuthLoading(true);
      const algorandUser = await loginWithAlgorandPera(walletAddress);
      setUser(algorandUser);
    } catch (err) {
      console.error("Algorand authentication failed in app:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAlgorandLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Algorand logout failed:", err);
    }
  };

  // Helper to read state from local storage for unauthenticated guests
  const getLocalState = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(`aws_guest_${key}_v1`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // State with Local Guest fallback persistence
  const [studyHistory, setStudyHistory] = useState<{ [key: string]: "known" | "review" | null }>(() => getLocalState("studyHistory", {}));
  const [quizHistory, setQuizHistory] = useState<{ [key: string]: boolean }>(() => getLocalState("quizHistory", {}));
  const [dailyStudyGoal, setDailyStudyGoal] = useState<number>(() => getLocalState("dailyStudyGoal", 30));
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(() => getLocalState("todayStudyMinutes", 0));
  const [totalStudyMinutes, setTotalStudyMinutes] = useState<number>(() => getLocalState("totalStudyMinutes", 0));
  const [dailyMinutesLog, setDailyMinutesLog] = useState<{ [dateKey: string]: number }>(() => getLocalState("dailyMinutesLog", {}));
  const [honeState, setHoneState] = useState<any>(() => getLocalState("honePathwayState", {}));
  const [trickSimulatorState, setTrickSimulatorState] = useState<any>(() => getLocalState("trickSimulatorState", {}));
  const [vaultState, setVaultState] = useState<any>(() => getLocalState("vaultState", {}));
  const [streak, setStreak] = useState<number>(0);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  
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

  // Auto-save changes to localStorage for guests when offline/not logged in
  useEffect(() => {
    if (!user && hasLoadedCloudData) {
      try {
        localStorage.setItem("aws_guest_studyHistory_v1", JSON.stringify(studyHistory));
        localStorage.setItem("aws_guest_quizHistory_v1", JSON.stringify(quizHistory));
        localStorage.setItem("aws_guest_dailyStudyGoal_v1", JSON.stringify(dailyStudyGoal));
        localStorage.setItem("aws_guest_todayStudyMinutes_v1", JSON.stringify(todayStudyMinutes));
        localStorage.setItem("aws_guest_totalStudyMinutes_v1", JSON.stringify(totalStudyMinutes));
        localStorage.setItem("aws_guest_dailyMinutesLog_v1", JSON.stringify(dailyMinutesLog));
        localStorage.setItem("aws_guest_honePathwayState_v1", JSON.stringify(honeState));
        localStorage.setItem("aws_guest_trickSimulatorState_v1", JSON.stringify(trickSimulatorState));
        localStorage.setItem("aws_guest_vaultState_v1", JSON.stringify(vaultState));
      } catch (err) {
        console.error("Local storage save error:", err);
      }
    }
  }, [user, hasLoadedCloudData, totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, dailyMinutesLog, honeState, trickSimulatorState, vaultState]);

  // Auto-save changes to cloud when state changes (debounced)
  useEffect(() => {
    if (user && hasLoadedCloudData) {
      const delaySave = setTimeout(async () => {
        setSyncing(true);
        await handleCloudOperation("saveProgressToCloud-autosave", () => saveProgressToCloud(user.uid, {
          totalStudyMinutes,
          todayStudyMinutes,
          dailyStudyGoal,
          studyHistory,
          quizHistory,
          dailyMinutesLog,
          honePathwayState: honeState,
          trickSimulatorState,
          vaultState
        }), undefined);
        setLastSyncTime(new Date());
        setSyncing(false);
      }, 1000); // Debounce to avoid overloading write rate
      return () => clearTimeout(delaySave);
    }
  }, [user, hasLoadedCloudData, totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, dailyMinutesLog, honeState, trickSimulatorState, vaultState]);

  // Sync streak to the Global Leaderboard in Firestore
  useEffect(() => {
    if (user && hasLoadedCloudData) {
      syncStreakToLeaderboard(
        user.uid,
        user.displayName,
        user.email,
        user.photoURL,
        streak
      );
    }
  }, [user, hasLoadedCloudData, streak]);

  const handleForceSync = async () => {
    if (!user || syncing || isOffline) return;
    setSyncing(true);
    try {
      await handleCloudOperation("saveProgressToCloud-force", () => saveProgressToCloud(user.uid, {
        totalStudyMinutes,
        todayStudyMinutes,
        dailyStudyGoal,
        studyHistory,
        quizHistory,
        dailyMinutesLog,
        honePathwayState: honeState,
        trickSimulatorState,
        vaultState
      }), undefined);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Force sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

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
      <header 
        className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-white dark:bg-slate-900 shrink-0 z-20 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-4"
      >
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
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold leading-none hidden sm:block">
              Ready Score
            </span>
            <span className="text-[10px] sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5" title="Readiness Score">
              <span className="sm:hidden text-slate-400 text-[8px] font-bold">RDY:</span> {readinessScore}% 
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 40 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
            </span>
          </div>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden xs:block"></div>

          <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-full border flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all ${
            streak >= 7 
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' 
              : streak >= 3 
                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' 
                : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}>
            <Flame className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${
              streak >= 7 
                ? 'text-rose-500 fill-rose-500 animate-bounce' 
                : streak >= 3 
                  ? 'text-amber-500 fill-amber-500 animate-pulse' 
                  : 'text-slate-400 dark:text-slate-500'
            }`} />
            <span className="uppercase tracking-wider">
              <span className="hidden sm:inline">
                {streak >= 7 ? `7-Day Supernova (${streak}d)` : streak >= 3 ? `3-Day Burner (${streak}d)` : `${streak} Day Streak`}
              </span>
              <span className="sm:hidden inline">
                {streak}d
              </span>
            </span>
          </div>

          <button
            onClick={() => setShowQuickStartGuide(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-black rounded-full border border-amber-500/30 transition-all shadow-xs cursor-pointer shrink-0"
            title="Interactive 10-Minute Rapid Onboarding Tour"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">10-MIN GUIDE</span>
          </button>

          <button
            onClick={() => setShowDeployGuide(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] sm:text-xs font-black rounded-full border border-cyan-500/30 transition-all shadow-xs cursor-pointer shrink-0"
            title="Cloud Run & Cloudflare Deployment Guide"
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline">DEPLOY</span>
          </button>

          <button
            onClick={handleDownloadOfflineCompanion}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-[#FF9900]/10 hover:bg-[#FF9900]/20 text-[#FF9900] text-[10px] sm:text-xs font-black rounded-full border border-[#FF9900]/30 transition-all shadow-sm cursor-pointer shrink-0"
            title="Download Single-File Standalone HTML Version"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">OFFLINE (.HTML)</span>
          </button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

          {/* User Account / Sync status */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-750 shrink-0" />
          ) : user ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Cloud Sync Status Indicator */}
              <div className="flex items-center gap-2 mr-1 relative">
                <div 
                  onClick={() => {
                    setShowSyncStatsPanel(!showSyncStatsPanel);
                    if (!showSyncStatsPanel) {
                      measurePingLatency();
                    }
                  }}
                  className="hidden sm:flex flex-col items-end cursor-pointer hover:opacity-85 select-none"
                  title="Click to view Cloud Database Diagnostics & Connection Telemetry"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    {syncing ? 'Syncing to Cloud...' : isOffline ? 'Offline Mode' : 'Cloud Synchronized'}
                    <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-400 animate-ping' : isOffline ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {lastSyncTime ? `Last saved: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Waiting for sync...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {!isOffline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleForceSync();
                      }}
                      disabled={syncing}
                      title="Force immediate cloud sync"
                      className="hidden sm:flex items-center justify-center p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#FF9900]' : ''}`} />
                    </button>
                  )}
                  
                  <span 
                    onClick={() => {
                      setShowSyncStatsPanel(!showSyncStatsPanel);
                      if (!showSyncStatsPanel) {
                        measurePingLatency();
                      }
                    }}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative cursor-pointer shrink-0"
                    title="Toggle Cloud Health Dashboard"
                  >
                    {isOffline ? (
                      <CloudLightning className="w-4 h-4 text-red-500" />
                    ) : (
                      <CloudLightning className={`w-4 h-4 ${syncing ? 'text-[#FF9900] animate-bounce' : 'text-emerald-500'}`} />
                    )}
                    {!isOffline && <span className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full ${syncing ? 'bg-[#FF9900]' : 'bg-emerald-500'}`} />}
                  </span>
                </div>

                {/* Dropdown Floating Sync Telemetry Diagnostics Menu */}
                {showSyncStatsPanel && (
                  <div className="absolute right-0 top-10 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-xl z-50 animate-fade-in text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-black uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500">Cloud Sync Diagnostics</span>
                      <button 
                        onClick={() => setShowSyncStatsPanel(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Live Network Ping */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Server Latency Ping:</span>
                        <div className="flex items-center gap-1.5">
                          {isCheckingPing ? (
                            <span className="text-[10px] font-mono text-amber-500 animate-pulse">pinging...</span>
                          ) : pingLatency !== null ? (
                            <span className="font-mono font-bold text-emerald-500">{pingLatency} ms</span>
                          ) : (
                            <span className="font-mono text-red-500">Timeout</span>
                          )}
                          <button
                            onClick={measurePingLatency}
                            disabled={isCheckingPing}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="Measure server response time"
                          >
                            <RefreshCw className={`w-3 h-3 ${isCheckingPing ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Connection status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Network State:</span>
                        <span className={`font-bold flex items-center gap-1 ${isOffline ? 'text-rose-500' : 'text-emerald-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          {isOffline ? 'Offline' : 'Online (Socket Active)'}
                        </span>
                      </div>

                      {/* Database engine status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                        <span className="font-bold text-slate-750 dark:text-slate-250">
                          PostgreSQL Cloud SQL
                        </span>
                      </div>

                      {/* Firestore region verification */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Firestore Custom ID:</span>
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350 select-all font-black">
                          ai-studio-awsgoogle...
                        </span>
                      </div>

                      {/* Sync stats payloads */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Payload Sync Size:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          ~12.4 KB (JSON format)
                        </span>
                      </div>

                      {/* Last synchronized */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Last Sync Cycle:</span>
                          <span className="font-bold font-mono text-slate-500 dark:text-slate-400">
                            {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'No saved cycle'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            handleForceSync();
                          }}
                          disabled={syncing || isOffline}
                          className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-[#FF9900] py-1 font-bold text-[10px] rounded uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {syncing ? 'Pushing State...' : 'Force Diagnostic Re-Sync'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
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

      {/* Read-Only Demo Mode Active Banner */}
      {isDemoMode && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-900/50 p-2.5 flex items-center justify-between gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold shrink-0 px-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF9900]" />
            <span>⚡ Read-Only Demo Mode Active: {demoModeReason || "Cloud database offline or unavailable ('database not found' or 503). Using cached local data."}</span>
          </div>
          <button
            onClick={() => {
              setIsDemoMode(false);
              setDemoModeReason(null);
            }}
            className="text-[10px] uppercase tracking-wider px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 rounded hover:bg-amber-300 transition-colors"
          >
            Retry Cloud
          </button>
        </div>
      )}

      {/* Redirect Auth Loading feedback */}
      {redirectLoading && (
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-[#FF9900]/30 p-2.5 flex items-center justify-center gap-2.5 text-amber-800 dark:text-amber-400 text-xs font-bold shrink-0 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FF9900]" />
          <span>Securing cloud session with Google authentication... Verifying redirect credentials, please hold.</span>
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
                  onClick={() => handleTabChange("lightning-rush")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "lightning-rush"
                      ? "bg-amber-500 text-slate-950 shadow-md font-black"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                  Lightning Blitz & Loot
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
                  onClick={() => handleTabChange("visual-architecture")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "visual-architecture"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 text-indigo-400" />
                  Visual Architecture Studio
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

                <button
                  onClick={() => handleTabChange("algorand")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "algorand"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0 text-yellow-500" />
                  Algorand Web3 Portal
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
                {aiModelMode === "fast" ? "gemini-3.6-flash (Concise): Optimized for speed and rapid recall." : "gemini-3.6-flash (Socratic): Advanced deep-reasoning socratic mode."}
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
        <main ref={mainRef} className="flex-1 p-4 sm:p-6 md:pb-[max(1.5rem,env(safe-area-inset-bottom))] min-h-0 overflow-y-auto">
          
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
              authLoading={authLoading || redirectLoading}
              syncing={syncing}
              dailyMinutesLog={dailyMinutesLog}
              streak={streak}
              redirectError={redirectError}
              redirectSuggestedAction={redirectSuggestedAction}
              redirectErrorGuide={redirectErrorGuide}
              interviewHistory={interviewHistory}
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
              savedState={trickSimulatorState}
              onSaveState={setTrickSimulatorState}
            />
          )}

          {activeTab === "vault" && (
            <TheDistractorVault 
              vaultItems={distractorVault}
              savedState={vaultState}
              onSaveState={setVaultState}
            />
          )}

          {activeTab === "visual-architecture" && (
            <VisualArchitectureLearning />
          )}

          {activeTab === "lightning-rush" && (
            <LightningRushArena />
          )}

          {activeTab === "matching" && (
            <ScenarioMatcher />
          )}

          {activeTab === "interview" && (
            <TechnicalInterviewSimulator aiModelMode={aiModelMode} user={user} />
          )}

          {activeTab === "agents" && (
            <AgentSwarmHub user={user} aiModelMode={aiModelMode} />
          )}

          {activeTab === "backup" && (
            <StorageHub 
              studyHistory={studyHistory}
              quizHistory={quizHistory}
              onImportProgress={handleImportProgress}
              onClearAll={handleClearAllProgress}
            />
          )}

          {activeTab === "algorand" && (
            <AlgorandPortal
              user={user}
              onAlgorandLogin={handleAlgorandLogin}
              onAlgorandLogout={handleAlgorandLogout}
              currentStreak={streak}
            />
          )}

        </main>
      </div>
      
      {/* Mobile Bottom Navigation Dock (Top of the Footer) */}
      <div 
        className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-around px-1 z-20 shadow-lg pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <button 
          onClick={() => handleTabChange("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            activeTab === "dashboard" 
              ? "text-[#FF9900]" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Dashboard"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Dash</span>
          {activeTab === "dashboard" && <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-[#FF9900] rounded-full" />}
        </button>
        
        <button 
          onClick={() => handleTabChange("professor")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            activeTab === "professor" 
              ? "text-[#FF9900]" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Socratic Professor"
        >
          <Bot className={`w-5 h-5 ${activeTab === "professor" ? "text-[#FF9900]" : ""}`} />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Socratic</span>
          {activeTab === "professor" && <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-[#FF9900] rounded-full" />}
        </button>
        
        <button 
          onClick={() => handleTabChange("flashcards")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            activeTab === "flashcards" 
              ? "text-amber-500" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Flashcards"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Cards</span>
          {activeTab === "flashcards" && <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange("simulator")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            activeTab === "simulator" 
              ? "text-[#FF9900]" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Exam Simulator"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Exam</span>
          {activeTab === "simulator" && <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-[#FF9900] rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange("algorand")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            activeTab === "algorand" 
              ? "text-yellow-500" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Algorand Web3"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Web3</span>
          {activeTab === "algorand" && <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
        </button>

        <button 
          onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative cursor-pointer ${
            ["matching", "interview", "agents", "vault", "backup"].includes(activeTab) || showMobileMoreMenu
              ? "text-[#FF9900]" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="More AWS Tools"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-extrabold mt-1 leading-none uppercase tracking-tight">Tools</span>
          {(["matching", "interview", "agents", "vault", "backup"].includes(activeTab) || showMobileMoreMenu) && (
            <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-[#FF9900] rounded-full" />
          )}
        </button>
      </div>

      {/* Mobile Tools Sheet Overlay */}
      {showMobileMoreMenu && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md md:hidden flex flex-col justify-end animate-fade-in pt-[env(safe-area-inset-top)]">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 rounded-t-xl p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#FF9900] text-slate-950 rounded-xs flex items-center justify-center font-black text-xs">
                  AWS
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  All AWS Workspace Tools
                </h3>
              </div>
              <button
                onClick={() => setShowMobileMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleTabChange("matching")}
                className={`p-3 rounded border text-left flex items-center gap-3 transition-all ${
                  activeTab === "matching"
                    ? "bg-[#FF9900]/10 border-[#FF9900] text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Zap className="w-5 h-5 text-[#FF9900] shrink-0" />
                <div>
                  <div className="text-xs font-bold">Scenario Matcher Game</div>
                  <div className="text-[10px] text-slate-400">Match real-world AWS scenarios to architectural services</div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("interview")}
                className={`p-3 rounded border text-left flex items-center gap-3 transition-all ${
                  activeTab === "interview"
                    ? "bg-[#FF9900]/10 border-[#FF9900] text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Briefcase className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">HONE Technical Interview Prep</div>
                  <div className="text-[10px] text-slate-400">Simulate AWS architectural technical defense interviews</div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("agents")}
                className={`p-3 rounded border text-left flex items-center gap-3 transition-all ${
                  activeTab === "agents"
                    ? "bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Cpu className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">AI Agent Swarm Platform</div>
                  <div className="text-[10px] text-slate-400">Multi-agent cloud architect design workspace</div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("vault")}
                className={`p-3 rounded border text-left flex items-center gap-3 transition-all ${
                  activeTab === "vault"
                    ? "bg-[#FF9900]/10 border-[#FF9900] text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <HelpCircle className="w-5 h-5 text-sky-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">The Distractor Vault</div>
                  <div className="text-[10px] text-slate-400">Deconstruct tricky exam distractor choices</div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("backup")}
                className={`p-3 rounded border text-left flex items-center gap-3 transition-all ${
                  activeTab === "backup"
                    ? "bg-[#FF9900]/10 border-[#FF9900] text-slate-900 dark:text-white font-bold"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Database className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Save Slots & Backups</div>
                  <div className="text-[10px] text-slate-400">Cloud database sync, exports, and offline backups</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: 10-Minute Rapid Onboarding Walkthrough */}
      {showQuickStartGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowQuickStartGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-sm border border-amber-500/30 shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  10-Minute Cloud Practitioner Onboarding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Master the 4 core workflows of this application in 10 minutes or less.
                </p>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, title: "1. Swarm Council", time: "Min 1-3" },
                { step: 2, title: "2. Real Scenarios", time: "Min 4-6" },
                { step: 3, title: "3. Security Audit", time: "Min 7-8" },
                { step: 4, title: "4. ASA Credential", time: "Min 9-10" }
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setQuickStartStep(s.step)}
                  className={`p-2 rounded-xs border text-left transition-all cursor-pointer ${
                    quickStartStep === s.step
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  <span className="block text-[10px] font-black uppercase">{s.time}</span>
                  <span className="block text-[11px] font-bold truncate">{s.title}</span>
                </button>
              ))}
            </div>

            {/* Step Content */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xs border border-slate-200 dark:border-slate-800 space-y-3">
              {quickStartStep === 1 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                    Step 1: Consult Your AI Swarm Council (3 mins)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Meet <strong>Archie</strong> (Solutions Architect), <strong>PennyWise</strong> (FinOps), <strong>Guardian</strong> (Security), and <strong>Trap Master</strong> (Exam Traps). Ask any CLF-C02 question or spawn your own custom AI agent!
                  </p>
                  <button
                    onClick={() => {
                      setShowQuickStartGuide(false);
                      handleTabChange("agents");
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch AI Swarm Platform</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {quickStartStep === 2 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                    Step 2: Tackle Real Exam Scenarios (3 mins)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Test your knowledge against real AWS CLF-C02 scenarios with distractor traps and community RLHF voting.
                  </p>
                  <button
                    onClick={() => {
                      setShowQuickStartGuide(false);
                      handleTabChange("simulator");
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Try Exam Simulator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {quickStartStep === 3 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                    Step 3: Run Zero-Trust Security Pen-Test (2 mins)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Verify application security posture. The Guardian Shield runs rate limiters (120 req/min/IP), anti-XSS filters, and prompt injection guards.
                  </p>
                  <button
                    onClick={() => {
                      setShowQuickStartGuide(false);
                      handleTabChange("agents");
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Run Security Pen-Test Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {quickStartStep === 4 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                    Step 4: Mint Web3 Blockchain Credential (2 mins)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Mint an immutable Solutions Architect credential on Algorand testnet directly inside the Web3 Portal!
                  </p>
                  <button
                    onClick={() => {
                      setShowQuickStartGuide(false);
                      handleTabChange("algorand");
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Algorand Web3 Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Step {quickStartStep} of 4 • 10-Min Cloud Master Curriculum
              </span>
              <button
                onClick={() => setShowQuickStartGuide(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Deployment & Hosting Center */}
      {showDeployGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowDeployGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-500 flex items-center justify-center rounded-sm border border-cyan-500/30 shrink-0">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Cloud Deployment & Hosting Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to publish this application? Choose your preferred deployment target below.
                </p>
              </div>
            </div>

            {/* Deployment Targets */}
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xs border border-cyan-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-cyan-500 flex items-center gap-1.5 font-mono">
                    <Globe className="w-3.5 h-3.5" />
                    1-CLICK GOOGLE CLOUD RUN (RECOMMENDED)
                  </span>
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded-xs border border-cyan-800">
                    NATIVE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Deploy directly to Google Cloud Run containers with zero configuration! Click the <strong>"Share / Deploy"</strong> button in the AI Studio top toolbar to generate a shareable HTTPS URL.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-amber-500 flex items-center gap-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5" />
                    CLOUDFLARE PAGES & WORKERS
                  </span>
                  <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded-xs border border-amber-800">
                    EDGE KV
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sub-10ms global delivery with Cloudflare Workers KV cache. Static frontend bundles serve via Cloudflare Pages and backend routes proxy via Cloudflare Workers.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-500 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    GEMINI 3.6 FLASH API KEY INTEGRATION
                  </span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded-xs border border-emerald-800">
                    SERVER-SIDE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Gemini API is integrated server-side via Express endpoint <code>/api/gemini/agent-insight</code> using <code>@google/genai</code>. Your API key is configured safely in AI Studio <strong>Settings &gt; Secrets</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">
                Port 3000 • Production Node 22 CommonJS Server Ready
              </span>
              <button
                onClick={() => setShowDeployGuide(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Deployment Center
              </button>
            </div>
          </div>
        </div>
      )}

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
