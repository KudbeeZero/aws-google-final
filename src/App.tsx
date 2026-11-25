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
import { NewAgeSlotMachine } from "./components/NewAgeSlotMachine";
import { BlueprintLessonView } from "./components/BlueprintLessonView";
import { calculateComprehensiveReadiness, ExamConfidenceReport } from "./services/readinessService";
import { ExamPassingConfidenceModal } from "./components/ExamPassingConfidenceModal";
import { GlobalAudioPlayer } from "./components/GlobalAudioPlayer";
import { AIAudioTourStudio } from "./components/AIAudioTourStudio";
import { AIQuestionBankView } from "./components/AIQuestionBankView";
import { MobileAgentBubbles } from "./components/MobileAgentBubbles";
import { useAudioLesson } from "./contexts/AudioLessonContext";
import { useAgentWorkforce } from "./contexts/AgentWorkforceContext";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { CommandPalette } from "./components/CommandPalette";
import { triggerHaptic, getHapticsEnabled, setHapticsEnabled } from "./utils/haptics";
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
  MoreHorizontal,
  Crown,
  Coins,
  Search,
  Volume2,
  VolumeX,
  Headphones,
  Radio,
  Building2,
  ChevronRight
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
  const [showExamConfidenceModal, setShowExamConfidenceModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [hapticsOn, setHapticsOn] = useState<boolean>(() => getHapticsEnabled());
  const [quickStartStep, setQuickStartStep] = useState<number>(1);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);
  const mainRef = React.useRef<HTMLElement>(null);
  const { setIsDrawerOpen, isPlaying: isAudioPlaying, cacheStats, isTourModalOpen, setIsTourModalOpen } = useAudioLesson();
  const { activeCertTrack, memory: workforceMemory, dispatchStudyEvent } = useAgentWorkforce();

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        triggerHaptic("light");
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

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
    triggerHaptic("light");
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

  // Handle flashcard feedback + dispatch into Cross-Aware AI Agent Workforce
  const handleMarkCard = (cardId: string, status: "known" | "review") => {
    setStudyHistory((prev) => ({
      ...prev,
      [cardId]: status,
    }));
    const card = initialFlashcards.find((c) => c.id === cardId);
    if (card) {
      dispatchStudyEvent({
        sourceTab: "flashcards",
        domainId: card.domainId,
        topic: card.question.slice(0, 72),
        outcome: status === "known" ? "mastered" : "review",
      });
    }
  };

  // Reset study statistics
  const handleResetStudyHistory = () => {
    if (window.confirm("Are you sure you want to reset all flashcard statistics?")) {
      setStudyHistory({});
    }
  };

  // Handle quiz submission + dispatch into Cross-Aware AI Agent Workforce
  const handleRecordQuizResult = (questionId: string, isCorrect: boolean) => {
    setQuizHistory((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
    const q = trickQuestions.find((item) => item.id === questionId);
    if (q) {
      dispatchStudyEvent({
        sourceTab: "simulator",
        domainId: q.domainId,
        topic: q.scenario.slice(0, 72),
        outcome: isCorrect ? "correct" : "incorrect",
      });
    }
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

  // Comprehensive Exam Readiness Calculation using official domain weights & multi-tool metrics
  const totalCards = initialFlashcards.length;
  const knownCards = Object.values(studyHistory).filter((v) => v === "known").length;
  const correctQuizzes = Object.values(quizHistory).filter((v) => v === true).length;

  const readinessReport: ExamConfidenceReport = calculateComprehensiveReadiness(
    initialFlashcards,
    studyHistory,
    trickQuestions,
    quizHistory,
    totalStudyMinutes,
    streak,
    activeCertTrack,
    workforceMemory
  );
  const readinessScore = readinessReport.readinessScore;

  const mobileTabLabels: Record<string, string> = {
    dashboard: "CloudMaster",
    "question-bank": `${activeCertTrack} Bank`,
    flashcards: "Flashcards",
    simulator: "Exam Prep",
    professor: "AI Tutor",
    "blueprint-lesson": "Blueprint Lesson",
    "visual-architecture": "Architecture",
    vault: "Distractor Vault",
    matching: "Scenario Match",
    "lightning-rush": "Lightning Blitz",
    slots: "Slot Machine",
    interview: "Interview Prep",
    agents: "Agent Swarm",
    backup: "Save & Backup",
    algorand: "Web3 Portal",
  };

  return (
    <div className={`bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-[100dvh] w-full flex flex-col overflow-hidden font-sans ${darkMode ? "dark" : ""}`}>
      
      {/* Top Navigation / Header (Apple HIG Frosted Glass — All Menu Icons Visible on iPhone Vertical) */}
      <header 
        className="border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-4 px-3 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shrink-0 z-20 pt-[max(0.45rem,env(safe-area-inset-top))] pb-1.5 md:pt-[max(0.75rem,env(safe-area-inset-top))] md:pb-3 relative"
      >
        {/* Row 1 (Mobile) / Left+Right Main Bar (Desktop) */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto md:flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => {
                triggerHaptic("light");
                setSidebarOpen(!sidebarOpen);
              }}
              className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] md:min-w-0 md:min-h-0 p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100/80 md:bg-transparent dark:bg-slate-800/80 md:dark:bg-transparent hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl shrink-0 transition-colors cursor-pointer"
              title="Toggle Sidebar Menu"
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="w-5 h-5 shrink-0" />
            </button>
            
            <img
              src="/apple-touch-icon.png"
              alt="CloudMaster"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs shrink-0 object-cover"
            />
            <span className="md:hidden font-display font-bold tracking-tight text-sm text-slate-900 dark:text-white truncate">
              {mobileTabLabels[activeTab] || "CloudMaster"}
            </span>
            <span className="hidden md:inline font-display font-bold tracking-tight text-base text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              CloudMaster
            </span>
          </div>

          {/* Right Status & Account Actions (Always Visible on Mobile Row 1 & Full Desktop Bar) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            {/* Desktop-only inline quick-action buttons (mobile gets dedicated full-width Row 2 strip below) */}
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsTourModalOpen(true);
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border shrink-0 bg-amber-500/12 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
              title="AI Guided Audio Tour, Dual-Host Podcasts & Voice Ask"
              aria-label="Open AI Audio Tour & Podcasts"
            >
              <Radio className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="whitespace-nowrap">AI Tour</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsDrawerOpen(true);
              }}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
                isAudioPlaying
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70"
              }`}
              title="Audio Study Studio & Offline Memory"
              aria-label="Open Audio Study Studio"
            >
              <Headphones className={`w-3.5 h-3.5 shrink-0 ${isAudioPlaying ? "text-amber-500" : ""}`} />
              <span className="hidden lg:inline whitespace-nowrap">Audio</span>
              {cacheStats.count > 0 && (
                <span className="hidden xl:inline text-[10px] font-mono text-slate-400 tabular-nums">
                  {cacheStats.count}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setShowCommandPalette(true);
              }}
              className="hidden md:flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/70 shrink-0"
              title="Spotlight Quick Jump (⌘K)"
              aria-label="Open Quick Search"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Quick Jump</span>
              <kbd className="hidden lg:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-500">⌘K</kbd>
            </button>

            <button 
              onClick={() => {
                triggerHaptic("light");
                setShowExamConfidenceModal(true);
              }}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer shrink-0 tabular-nums"
              title="Open Exam Passing Confidence Hub"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {readinessScore}% <span className="hidden sm:inline font-medium text-slate-500 dark:text-slate-400">Ready</span>
              </span>
            </button>

            <div
              className={`flex px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl items-center gap-1 shrink-0 tabular-nums ${
                streak >= 3
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
              }`}
              title={`${streak} Day Study Streak`}
            >
              <Flame className={`w-3.5 h-3.5 shrink-0 ${streak >= 7 ? 'text-rose-500 fill-rose-500' : streak >= 3 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap">{streak}d</span>
            </div>

            <div className="hidden md:block">
              <PWAInstallButton variant="compact" />
            </div>

            {/* User Account / Sync status */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-750 shrink-0" />
            ) : user ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Cloud Sync Status Indicator (Desktop) */}
                <div className="hidden md:flex items-center gap-2 mr-1 relative">
                  <div 
                    onClick={() => {
                      setShowSyncStatsPanel(!showSyncStatsPanel);
                      if (!showSyncStatsPanel) {
                        measurePingLatency();
                      }
                    }}
                    className="flex flex-col items-end cursor-pointer hover:opacity-85 select-none"
                    title="Click to view Cloud Database Diagnostics & Connection Telemetry"
                  >
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {syncing ? 'Syncing…' : isOffline ? 'Offline' : 'Synced'}
                      <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-400' : isOffline ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                      {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting…'}
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
                        className="flex items-center justify-center p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? 'animate-spin text-[#FF9900]' : ''}`} />
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
                        <CloudLightning className="w-4 h-4 shrink-0 text-red-500" />
                      ) : (
                        <CloudLightning className={`w-4 h-4 shrink-0 ${syncing ? 'text-[#FF9900]' : 'text-emerald-500'}`} />
                      )}
                    </span>
                  </div>
                </div>
                
                {/* User profile bubble */}
                <div 
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                  title={`${user.displayName || 'Cloud Learner'} (${user.email || 'Anonymous'})`}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="avatar" 
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 sm:w-5 sm:h-5 rounded-full border border-slate-300 dark:border-slate-600 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-slate-800 dark:bg-slate-900 text-[#FF9900] flex items-center justify-center font-bold text-[10px] border border-slate-700 dark:border-slate-800 shrink-0 uppercase">
                      {(user.displayName || user.email || 'A').charAt(0)}
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-[60px] truncate hidden md:inline-block">
                    {user.displayName?.split(' ')[0] || (user.isAnonymous ? 'Guest' : 'Learner')}
                  </span>
                  <button 
                    onClick={() => logoutUser()}
                    className="hidden sm:inline-flex p-0.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3 shrink-0" />
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
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Sign in with Google to sync progress across devices"
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0 text-[#FF9900] dark:text-slate-950" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2 (Mobile Vertical Only): Dedicated 5-Icon Quick Toolbar — Zero Clipped or Hidden Icons */}
        <div className="grid grid-cols-5 gap-1 md:hidden pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => {
              triggerHaptic("light");
              setIsTourModalOpen(true);
            }}
            className="min-h-[38px] px-1 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25 cursor-pointer min-w-0"
            aria-label="Open AI Audio Tour & Podcasts"
          >
            <Radio className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="truncate">Tour</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setIsDrawerOpen(true);
            }}
            className={`min-h-[38px] px-1 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold border cursor-pointer min-w-0 ${
              isAudioPlaying
                ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200"
            }`}
            aria-label="Open Audio Study Studio"
          >
            <Headphones className={`w-3.5 h-3.5 shrink-0 ${isAudioPlaying ? "text-amber-500" : ""}`} />
            <span className="truncate">Audio</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setShowCommandPalette(true);
            }}
            className="min-h-[38px] px-1 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 cursor-pointer min-w-0"
            aria-label="Open Quick Search"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Find</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setShowSyncStatsPanel(!showSyncStatsPanel);
              if (!showSyncStatsPanel) {
                measurePingLatency();
              }
            }}
            className="min-h-[38px] px-1 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 cursor-pointer min-w-0"
            aria-label="Toggle Cloud Sync Diagnostics"
          >
            <CloudLightning
              className={`w-3.5 h-3.5 shrink-0 ${
                isOffline ? "text-red-500" : syncing ? "text-[#FF9900]" : "text-emerald-500"
              }`}
            />
            <span className="truncate">{isOffline ? "Off" : syncing ? "Sync" : "Cloud"}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setDarkMode(!darkMode);
            }}
            className="min-h-[38px] px-1 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 cursor-pointer min-w-0"
            aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            )}
            <span className="truncate">{darkMode ? "Light" : "Dark"}</span>
          </button>
        </div>

        {/* Floating Sync Telemetry Diagnostics Popover (Works on Mobile & Desktop) */}
        {showSyncStatsPanel && (
          <div className="fixed left-3 right-3 md:left-auto md:right-6 top-[calc(6.25rem+env(safe-area-inset-top))] md:top-16 md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl z-50 animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500">Cloud Sync Diagnostics</span>
              <button 
                onClick={() => setShowSyncStatsPanel(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 cursor-pointer"
                aria-label="Close Cloud Sync Diagnostics"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Server Latency Ping:</span>
                <div className="flex items-center gap-1.5">
                  {isCheckingPing ? (
                    <span className="text-[10px] font-mono text-amber-500">pinging...</span>
                  ) : pingLatency !== null ? (
                    <span className="font-mono font-bold text-emerald-500 tabular-nums">{pingLatency} ms</span>
                  ) : (
                    <span className="font-mono text-red-500">Timeout</span>
                  )}
                  <button
                    onClick={measurePingLatency}
                    disabled={isCheckingPing}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                    title="Measure server response time"
                  >
                    <RefreshCw className={`w-3 h-3 shrink-0 ${isCheckingPing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Network State:</span>
                <span className={`font-bold ${isOffline ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  PostgreSQL Cloud SQL
                </span>
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Last Sync Cycle:</span>
                  <span className="font-bold font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'No saved cycle'}
                  </span>
                </div>
                {user && (
                  <button
                    onClick={() => handleForceSync()}
                    disabled={syncing || isOffline}
                    className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-[#FF9900] py-2 font-bold text-[11px] rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {syncing ? 'Pushing State...' : 'Force Re-Sync'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
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
            fixed md:relative top-0 bottom-0 left-0 z-30 md:z-10 h-[100dvh] md:h-full
            ${sidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-0 -translate-x-full md:translate-x-0 overflow-hidden border-r-0"}
          `}
        >
          {/* Mobile sidebar header (iOS Safe-Area Protected) */}
          <div className="flex md:hidden items-center justify-between px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-6 h-6 bg-slate-900 dark:bg-slate-950 flex items-center justify-center rounded-sm font-black text-[#FF9900] text-[10px] border border-slate-800 dark:border-slate-905 shrink-0">
                AWS
              </div>
              <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-slate-100 uppercase truncate">
                CLF-C02 Companion
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0 cursor-pointer"
              title="Close Menu"
              aria-label="Close Sidebar Menu"
            >
              <X className="w-5 h-5 shrink-0" />
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
                  onClick={() => {
                    triggerHaptic("light");
                    setIsTourModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Radio className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">AI Audio Tour & Podcasts</span>
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange("question-bank")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "question-bank"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="truncate">AI Question Bank ({activeCertTrack})</span>
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
                  onClick={() => handleTabChange("slots")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "slots"
                      ? "bg-gradient-to-r from-amber-500 to-[#FF9900] text-slate-950 shadow-md font-black"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Crown className="w-4 h-4 shrink-0 text-amber-500" />
                  New Age Slot Machine
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
                  onClick={() => handleTabChange("blueprint-lesson")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left cursor-pointer ${
                    activeTab === "blueprint-lesson"
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  CLF-C02 Blueprint Lesson
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

          {/* App Store Utilities, Haptics & Theme Control (iOS Safe-Area Protected) */}
          <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/15 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="px-4 py-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
              <PWAInstallButton variant="card" />
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setShowQuickStartGuide(true);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="10-Minute Rapid Onboarding"
                >
                  <Compass className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>Guide</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setShowDeployGuide(true);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Hosting & Deployment"
                >
                  <Rocket className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                  <span>Host</span>
                </button>
                <button
                  onClick={handleDownloadOfflineCompanion}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Export Standalone HTML"
                >
                  <Download className="w-3.5 h-3.5 shrink-0 text-[#FF9900]" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* AI Model Intelligence Toggle */}
            <div className="px-4 py-2.5 flex flex-col gap-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                AI Tutor Mode
                {aiModelMode === "expert" ? <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <Zap className="w-3.5 h-3.5 shrink-0 text-[#FF9900]" />}
              </span>
              <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setAiModelMode("fast");
                  }}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    aiModelMode === "fast" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Fast
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setAiModelMode("expert");
                  }}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    aiModelMode === "expert" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Socratic
                </button>
              </div>
            </div>

            {/* Haptics & Theme Controls */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const next = !hapticsOn;
                  setHapticsEnabled(next);
                  setHapticsOn(next);
                  if (next) triggerHaptic("success");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Toggle tactile haptics & sound feedback"
              >
                {hapticsOn ? <Volume2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                <span>{hapticsOn ? "Haptics On" : "Muted"}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setDarkMode(!darkMode);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Core Workspace Main Stage */}
        <main ref={mainRef} className="flex-1 p-3.5 sm:p-6 pb-20 md:pb-[max(2rem,env(safe-area-inset-bottom))] min-h-0 overflow-y-auto touch-scroll">
          <div className="max-w-7xl mx-auto">

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
              onOpenExamConfidenceModal={() => setShowExamConfidenceModal(true)}
              onMarkCard={handleMarkCard}
            />
          )}

          {activeTab === "professor" && (
            <InteractiveProfessor
              user={user}
              onAddMinutes={handleAddStudyMinutes}
              aiModelMode={aiModelMode}
              quizHistory={quizHistory}
              studyHistory={studyHistory}
            />
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

          {activeTab === "question-bank" && (
            <AIQuestionBankView
              onRecordQuizResult={handleRecordQuizResult}
              onAddStudyMinutes={handleAddStudyMinutes}
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

          {activeTab === "slots" && (
            <NewAgeSlotMachine />
          )}

          {activeTab === "blueprint-lesson" && (
            <BlueprintLessonView
              onAddMinutes={handleAddStudyMinutes}
              onNavigateToTab={handleTabChange}
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

          </div>
        </main>
      </div>
      
      {/* Apple iOS-Style Frosted Bottom Tab Bar */}
      <nav 
        aria-label="Primary mobile navigation"
        className="md:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl shrink-0 grid grid-cols-5 items-center px-1 z-20 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]"
      >
        <button 
          onClick={() => handleTabChange("dashboard")}
          className={`flex flex-col items-center justify-center min-w-0 min-h-[44px] py-0.5 transition-colors cursor-pointer ${
            activeTab === "dashboard" 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Today"
        >
          <span className={`px-3 py-0.5 rounded-full transition-colors flex items-center justify-center ${activeTab === "dashboard" ? "bg-amber-500/15" : ""}`}>
            <Layers className="w-5 h-5 shrink-0" />
          </span>
          <span className="text-[11px] font-medium mt-0.5 leading-none truncate max-w-full">Today</span>
        </button>
        
        <button 
          onClick={() => handleTabChange("flashcards")}
          className={`flex flex-col items-center justify-center min-w-0 min-h-[44px] py-0.5 transition-colors cursor-pointer ${
            activeTab === "flashcards" 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Flashcards"
        >
          <span className={`px-3 py-0.5 rounded-full transition-colors flex items-center justify-center ${activeTab === "flashcards" ? "bg-amber-500/15" : ""}`}>
            <BookOpen className="w-5 h-5 shrink-0" />
          </span>
          <span className="text-[11px] font-medium mt-0.5 leading-none truncate max-w-full">Cards</span>
        </button>

        <button 
          onClick={() => handleTabChange("simulator")}
          className={`flex flex-col items-center justify-center min-w-0 min-h-[44px] py-0.5 transition-colors cursor-pointer ${
            activeTab === "simulator" 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Exam Simulator"
        >
          <span className={`px-3 py-0.5 rounded-full transition-colors flex items-center justify-center ${activeTab === "simulator" ? "bg-amber-500/15" : ""}`}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </span>
          <span className="text-[11px] font-medium mt-0.5 leading-none truncate max-w-full">Exam</span>
        </button>

        <button 
          onClick={() => handleTabChange("professor")}
          className={`flex flex-col items-center justify-center min-w-0 min-h-[44px] py-0.5 transition-colors cursor-pointer ${
            activeTab === "professor" 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="AI Tutor"
        >
          <span className={`px-3 py-0.5 rounded-full transition-colors flex items-center justify-center ${activeTab === "professor" ? "bg-amber-500/15" : ""}`}>
            <Bot className="w-5 h-5 shrink-0" />
          </span>
          <span className="text-[11px] font-medium mt-0.5 leading-none truncate max-w-full">Tutor</span>
        </button>

        <button 
          onClick={() => {
            triggerHaptic("light");
            setShowMobileMoreMenu(!showMobileMoreMenu);
          }}
          className={`flex flex-col items-center justify-center min-w-0 min-h-[44px] py-0.5 transition-colors cursor-pointer ${
            ["question-bank", "matching", "slots", "lightning-rush", "blueprint-lesson", "visual-architecture", "interview", "agents", "vault", "backup", "algorand"].includes(activeTab) || showMobileMoreMenu
              ? "text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Menu & Tools"
        >
          <span className={`px-3 py-0.5 rounded-full transition-colors flex items-center justify-center ${["question-bank", "matching", "slots", "lightning-rush", "blueprint-lesson", "visual-architecture", "interview", "agents", "vault", "backup", "algorand"].includes(activeTab) || showMobileMoreMenu ? "bg-amber-500/15" : ""}`}>
            <MoreHorizontal className="w-5 h-5 shrink-0" />
          </span>
          <span className="text-[11px] font-medium mt-0.5 leading-none truncate max-w-full">More</span>
        </button>
      </nav>

      {/* Apple-HIG Grouped iOS Bottom Sheet Overlay */}
      {showMobileMoreMenu && (
        <div
          onClick={() => setShowMobileMoreMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md md:hidden flex flex-col justify-end animate-fade-in pt-[env(safe-area-inset-top)]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-100/98 dark:bg-slate-950/98 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-800 rounded-t-3xl px-4 pt-3 space-y-5 max-h-[86dvh] overflow-y-auto touch-scroll shadow-2xl pb-[max(1.75rem,env(safe-area-inset-bottom))]"
          >
            {/* Drag handle + clean title */}
            <div className="space-y-2.5 sticky top-0 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md pt-0.5 pb-2 z-10 -mx-4 px-4 border-b border-slate-200/70 dark:border-slate-800/80">
              <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src="/apple-touch-icon.png" alt="CloudMaster" className="w-7 h-7 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                      Explore & Settings
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                      {streak}d streak · {readinessScore}% ready
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-200/70 dark:bg-slate-800 rounded-full shrink-0 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Quick 2x2 Control Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setShowMobileMoreMenu(false);
                  setIsDrawerOpen(true);
                }}
                className="min-h-[52px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Audio Studio</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                    {cacheStats.count} cached
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setDarkMode(!darkMode);
                }}
                className="min-h-[52px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-indigo-500 flex items-center justify-center shrink-0">
                  {darkMode ? <Sun className="w-4 h-4 shrink-0 text-amber-500" /> : <Moon className="w-4 h-4 shrink-0" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Appearance</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {darkMode ? "Dark Mode" : "Light Mode"}
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  const next = !hapticsOn;
                  setHapticsEnabled(next);
                  setHapticsOn(next);
                  if (next) triggerHaptic("success");
                }}
                className="min-h-[52px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/12 text-emerald-500 flex items-center justify-center shrink-0">
                  {hapticsOn ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Haptics</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {hapticsOn ? "Enabled" : "Muted"}
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setAiModelMode(aiModelMode === "fast" ? "expert" : "fast");
                }}
                className="min-h-[52px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/12 text-[#FF9900] flex items-center justify-center shrink-0">
                  {aiModelMode === "expert" ? <Sparkles className="w-4 h-4 shrink-0" /> : <Zap className="w-4 h-4 shrink-0" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">AI Tutor</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">
                    {aiModelMode} Mode
                  </div>
                </div>
              </button>
            </div>

            {/* Section 1: Learn & Architecture */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Learn & Architecture
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {[
                  { id: "question-bank", title: `AI-Reviewed Question Bank (${activeCertTrack})`, sub: "CLF-C02 & SAA-C03 · 6 AWS Pillars · PostgreSQL", icon: ShieldCheck, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/12" },
                  { id: "blueprint-lesson", title: "AWS CLF-C02 Blueprint Lesson", sub: "6-chapter interactive & audio masterclass", icon: Building2, iconColor: "text-[#FF9900]", iconBg: "bg-amber-500/12" },
                  { id: "visual-architecture", title: "Visual Architecture Studio", sub: "3-Tier VPC, Serverless & CDN topologies", icon: Layers, iconColor: "text-indigo-500", iconBg: "bg-indigo-500/12" },
                  { id: "vault", title: "The Distractor Vault", sub: "Compare commonly confused AWS services", icon: HelpCircle, iconColor: "text-sky-500", iconBg: "bg-sky-500/12" },
                ].map((item) => {
                  const IconComp = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full min-h-[56px] px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        active ? "bg-amber-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComp className={`w-5 h-5 shrink-0 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${active ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Arcade & Drills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Arcade & Drills
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {[
                  { id: "lightning-rush", title: "Lightning Blitz & Loot", sub: "60s speed trivia sprint & mystery crates", icon: Sparkles, iconColor: "text-amber-500", iconBg: "bg-amber-500/12" },
                  { id: "slots", title: "New Age Slot Machine", sub: "Match AWS synergies & Socratic jackpots", icon: Crown, iconColor: "text-amber-500", iconBg: "bg-amber-500/15" },
                  { id: "matching", title: "Scenario Matcher Game", sub: "Match real-world use cases to services", icon: Zap, iconColor: "text-[#FF9900]", iconBg: "bg-orange-500/12" },
                ].map((item) => {
                  const IconComp = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full min-h-[56px] px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        active ? "bg-amber-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComp className={`w-5 h-5 shrink-0 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${active ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Career, AI & Data */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Career, Web3 & Data
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {[
                  { id: "interview", title: "HONE Technical Interview Prep", sub: "Architectural defense mock interviews", icon: Briefcase, iconColor: "text-amber-500", iconBg: "bg-amber-500/12" },
                  { id: "agents", title: "AI Agent Swarm Platform", sub: "Multi-agent cloud architect council", icon: Cpu, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/12" },
                  { id: "algorand", title: "Algorand Web3 Portal", sub: "TestNet ASA credentials & AlgoKit CLI", icon: Wallet, iconColor: "text-yellow-500", iconBg: "bg-yellow-500/12" },
                  { id: "backup", title: "Save Slots & Backups", sub: "Cloud sync, exports & offline storage", icon: Database, iconColor: "text-indigo-500", iconBg: "bg-indigo-500/12" },
                ].map((item) => {
                  const IconComp = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full min-h-[56px] px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        active ? "bg-amber-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComp className={`w-5 h-5 shrink-0 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${active ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account & Utilities Row */}
            <div className="space-y-2.5">
              <PWAInstallButton variant="card" />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    setIsTourModalOpen(true);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-500/12 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="truncate">AI Audio Tour</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    handleDownloadOfflineCompanion();
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0 text-[#FF9900]" />
                  <span className="truncate">Export App</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    setShowQuickStartGuide(true);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="truncate">Quick Guide</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    setShowDeployGuide(true);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Rocket className="w-4 h-4 shrink-0 text-cyan-500" />
                  <span className="truncate">Host & Deploy</span>
                </button>
              </div>

              {user && (
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || user.email || "Signed In"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {syncing ? "Syncing…" : isOffline ? "Offline mode" : "Cloud synchronized"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isOffline && (
                      <button
                        onClick={() => handleForceSync()}
                        disabled={syncing}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? "animate-spin" : ""}`} />
                        <span>Sync</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMobileMoreMenu(false);
                        logoutUser();
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
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

      {/* Official Exam Passing Confidence Modal */}
      <ExamPassingConfidenceModal
        report={readinessReport}
        isOpen={showExamConfidenceModal}
        onClose={() => setShowExamConfidenceModal(false)}
        onNavigateToTab={setActiveTab}
      />

      {/* Spotlight Quick Jump (⌘K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateToTab={(tab) => handleTabChange(tab)}
        onSelectDomain={handleSelectDomainForFlashcards}
        domains={domainsData}
        flashcards={initialFlashcards}
        distractors={distractorVault}
      />

      {/* Persistent Frosted-Glass Lesson Audio Player & Library Drawer */}
      <GlobalAudioPlayer />

      {/* Apple App Store AI Audio Tour, Dual-Host Podcasts & Voice Ask Studio */}
      <AIAudioTourStudio
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onNavigateToTab={handleTabChange}
        onOpenConfidenceHub={() => setShowExamConfidenceModal(true)}
      />

      {/* Smart Contextual Mobile Virtual AI Agent Bubbles & Live 6-Pillar Mesh */}
      <MobileAgentBubbles
        onNavigateToTab={handleTabChange}
        onOpenConfidenceHub={() => setShowExamConfidenceModal(true)}
      />

      {/* Offline Study Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
