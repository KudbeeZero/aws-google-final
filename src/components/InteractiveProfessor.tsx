import React, { useState, useEffect, useRef, useMemo } from "react";
import Markdown from "react-markdown";
import { getChatHistoryFromCloud, saveChatHistoryToCloud } from "../lib/db-client.js";
import {
  Bot,
  Send,
  Trash2,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Flame,
  GraduationCap,
  Copy,
  Download,
  Check,
  Play,
  Volume2,
  VolumeX,
  Loader2,
  X,
  Gift,
  Trophy,
  Zap,
  Layers,
  Cpu,
  Mic,
  MicOff,
  Square,
  Headphones,
  SlidersHorizontal,
  Target,
  Compass,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import { useAudioLesson } from "../contexts/AudioLessonContext";
import {
  recordProfessorCheckpoint,
  openLootCrate,
  LootCrate,
  LootItem,
} from "../services/gamificationService";
import {
  saveActiveSocraticSessionState,
  getMostRecentActiveSocraticSession,
  markSocraticSessionCompleted,
  ActiveSocraticSessionDoc,
} from "../lib/firebase";
import { domainsData, initialFlashcards, trickQuestions } from "../data";

export type TeachingMode = "socratic" | "rapid" | "whiteboard" | "distractor" | "voice";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  mode?: TeachingMode;
  agentCollaborator?: string;
  isStreaming?: boolean;
  hasQuiz?: boolean;
  quizOptions?: { key: string; text: string }[];
  quizAnswer?: string;
  userSelectedAnswer?: string;
  quizCorrect?: boolean;
}

interface InteractiveProfessorProps {
  user?: any;
  onAddMinutes?: (mins: number) => void;
  aiModelMode?: "fast" | "expert";
  quizHistory?: { [key: string]: boolean };
  studyHistory?: { [key: string]: "known" | "review" | null };
}

const ELEVENLABS_VOICES = [
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Deep Architect" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", label: "Crisp Strategist" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", label: "Security Lead" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Senior Coach" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "FinOps Advisor" },
];

const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, "Architecture diagram shown on screen.")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s+(.+)/g, "$1")
    .replace(/-\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[Answer:\s*[A-D]\]/gi, "")
    .trim();
};

const MODE_META: Record<
  TeachingMode,
  { label: string; shortLabel: string; description: string; icon: React.ReactNode }
> = {
  socratic: {
    label: "Socratic",
    shortLabel: "Socratic",
    description: "Analogies & guided mastery",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
  },
  rapid: {
    label: "Rapid Sprint",
    shortLabel: "Sprint",
    description: "High-yield bullet takeaways",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  whiteboard: {
    label: "Whiteboard",
    shortLabel: "Diagram",
    description: "Topologies & failover drills",
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  distractor: {
    label: "Trap Buster",
    shortLabel: "Traps",
    description: "Spot misleading exam keywords",
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
  },
  voice: {
    label: "Voice Coach",
    shortLabel: "Voice",
    description: "Spoken-style conversational drill",
    icon: <Headphones className="w-3.5 h-3.5" />,
  },
};

const MODE_SYSTEM_INSTRUCTIONS: Record<TeachingMode, string> = {
  socratic: `You are 'Professor Cloud'—an elite AWS Solutions Architect and encouraging Socratic tutor preparing the user for the AWS Certified Cloud Practitioner (CLF-C02) exam.
Rules:
1. Begin with a memorable real-world analogy, then connect it cleanly to AWS architectural trade-offs (Security, Cost, Reliability).
2. Highlight one specific CLF-C02 exam keyword trap to avoid.
3. End with an active concept check formatted strictly as:
A) Option A
B) Option B
C) Option C
D) Option D

[Answer: C]`,

  rapid: `You are 'Professor Cloud' in RAPID EXAM SPRINT mode for AWS CLF-C02.
Rules:
1. Deliver 3-4 ultra-concise, high-yield bullet points bolding the exact AWS exam trigger keywords.
2. Immediately finish with a crisp scenario checkpoint question with 4 options A) through D) and [Answer: X] at the bottom.`,

  whiteboard: `You are 'Professor Cloud' in ARCHITECTURAL WHITEBOARD mode for AWS CLF-C02.
Rules:
1. Draw a clean, compact ASCII flow diagram inside a code block showing traffic flow.
2. Explain traffic step-by-step (1, 2, 3) and briefly tie it to the Well-Architected Pillars.
3. End with a component-failure multiple-choice scenario with 4 options A) through D) and [Answer: X] at the bottom.`,

  distractor: `You are 'Professor Cloud' in DISTRACTOR TRAP BUSTER mode for AWS CLF-C02.
Rules:
1. Contrast 2-3 easily confused AWS services side by side.
2. Call out the exact "exam trap keywords" that separate the right answer from distractors.
3. End with a tricky CLF-C02 distractor checkpoint with 4 options A) through D) and [Answer: X] at the bottom.`,

  voice: `You are 'Professor Cloud' in SPOKEN VOICE COACH mode.
Rules:
1. Write naturally as if speaking aloud in a private coaching call—warm, crisp sentences, no ASCII tables or heavy markdown symbols.
2. Keep the explanation tight (~90 words), highlight the key exam takeaway, then ask one snappy spoken-style 4-option check:
A) Option A
B) Option B
C) Option C
D) Option D

[Answer: B]`,
};

const INITIAL_WELCOME: ChatMessage = {
  id: "welcome-msg",
  role: "model",
  text: "Welcome to **Professor Cloud Studio**. Ask any AWS Cloud Practitioner question, tap the mic to speak hands-free, or pick a targeted drill below to build exam mastery.",
  timestamp: new Date().toISOString(),
  mode: "socratic",
};

const QUICK_STARTERS = [
  {
    id: "security",
    tag: "Security",
    title: "Security Groups vs NACLs",
    subtitle: "Stateful vs stateless firewall rules",
    mode: "socratic" as TeachingMode,
    prompt:
      "Explain the difference between Security Groups and Network ACLs with a clear real-world analogy, flag common exam traps, and test me.",
  },
  {
    id: "responsibility",
    tag: "Concepts",
    title: "Shared Responsibility Model",
    subtitle: "OF the cloud vs IN the cloud",
    mode: "socratic" as TeachingMode,
    prompt:
      "Break down the AWS Shared Responsibility Model across IaaS (EC2), PaaS (RDS), and SaaS/Serverless (S3/Lambda), and give me a tricky checkpoint question.",
  },
  {
    id: "whiteboard_vpc",
    tag: "Architecture",
    title: "High-Availability 3-Tier VPC",
    subtitle: "ALB, Multi-AZ & Private Subnets",
    mode: "whiteboard" as TeachingMode,
    prompt:
      "Whiteboard a high-availability 3-tier VPC architecture (ALB, App Tier, Multi-AZ RDS) and test me with a failover scenario.",
  },
  {
    id: "s3_tiers",
    tag: "Billing & Storage",
    title: "S3 Storage & Glacier Traps",
    subtitle: "Retrieval times vs cost tiers",
    mode: "distractor" as TeachingMode,
    prompt:
      "Compare S3 Standard, S3 Intelligent-Tiering, S3 Standard-IA, S3 Glacier Instant, Flexible Retrieval, and Deep Archive with exam trap keywords.",
  },
];

const SWARM_SPECIALISTS = [
  { name: "Archie", role: "Solutions Architect", badge: "Architecture" },
  { name: "Guardian", role: "SecOps & Compliance", badge: "Security" },
  { name: "PennyWise", role: "FinOps & Billing", badge: "Cost" },
  { name: "TrapMaster", role: "CLF-C02 Distractors", badge: "Exam Traps" },
];

export const InteractiveProfessor: React.FC<InteractiveProfessorProps> = ({
  user,
  onAddMinutes,
  aiModelMode = "expert",
  quizHistory = {},
  studyHistory = {},
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<TeachingMode>("socratic");
  const [apiError, setApiError] = useState<string | null>(null);

  // Audio & Hands-Free Coach states
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem("aws_professor_autospeak") === "true";
  });
  const [showAudioStudio, setShowAudioStudio] = useState(false);
  const [showStarterDrawer, setShowStarterDrawer] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Voice Recognition state
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Gamification states
  const [earnedXPToast, setEarnedXPToast] = useState<{ amount: number; message: string } | null>(null);
  const [droppedCrate, setDroppedCrate] = useState<LootCrate | null>(null);
  const [openedCrateReward, setOpenedCrateReward] = useState<{ crate: LootCrate; rewards: LootItem[] } | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    playLesson,
    currentLesson,
    isPlaying: isGlobalPlaying,
    isLoading: isGlobalLoading,
    voiceId: globalVoiceId,
    playbackRate: globalRate,
    volume: globalVolume,
    setVoiceId: setGlobalVoiceId,
    setPlaybackRate: setGlobalRate,
    setVolume: setGlobalVolume,
  } = useAudioLesson();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    return localStorage.getItem("aws_professor_voice_id") || globalVoiceId;
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    return Number(localStorage.getItem("aws_professor_speech_rate") || String(globalRate));
  });
  const [speechVolume, setSpeechVolume] = useState<number>(() => {
    return Number(localStorage.getItem("aws_professor_speech_volume") || String(globalVolume));
  });
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Adaptive Learner Telemetry (weakest AWS domain + exam readiness)
  const learnerTelemetry = useMemo(() => {
    const domainScores = domainsData.map((dom) => {
      const domainCards = initialFlashcards.filter((c) => c.domainId === dom.id);
      const knownCount = domainCards.filter((c) => studyHistory[c.id] === "known").length;

      const domainQuizzes = trickQuestions.filter((q) => q.domainId === dom.id);
      const attemptedQuizzes = domainQuizzes.filter((q) => quizHistory[q.id] !== undefined);
      const correctQuizzes = attemptedQuizzes.filter((q) => quizHistory[q.id] === true);

      const cardScore = domainCards.length > 0 ? knownCount / domainCards.length : 0.5;
      const quizScore =
        attemptedQuizzes.length > 0 ? correctQuizzes.length / attemptedQuizzes.length : cardScore;

      const combinedPct = Math.round(((cardScore * 0.55 + quizScore * 0.45) * 100));
      return {
        id: dom.id,
        name: dom.name,
        pct: combinedPct,
        attemptedCount: attemptedQuizzes.length + knownCount,
      };
    });

    const sorted = [...domainScores].sort((a, b) => a.pct - b.pct);
    const weakestDomain = sorted[0] || { id: "security-compliance", name: "Security & Compliance", pct: 0 };
    const overallPct = Math.round(
      domainScores.reduce((acc, d) => acc + d.pct, 0) / Math.max(1, domainScores.length)
    );

    return {
      weakestDomain,
      overallPct,
      domainScores,
    };
  }, [quizHistory, studyHistory]);

  // Session Checkpoint Tally
  const sessionStats = useMemo(() => {
    const answered = messages.filter((m) => m.hasQuiz && m.userSelectedAnswer);
    const correct = answered.filter((m) => m.quizCorrect);
    return {
      answered: answered.length,
      correct: correct.length,
    };
  }, [messages]);

  // Detect Web Speech Recognition availability
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setMicSupported(Boolean(SpeechRec));
    }
    return () => {
      recognitionRef.current?.stop?.();
      abortControllerRef.current?.abort();
    };
  }, []);

  const playingMessageId =
    isGlobalPlaying && currentLesson?.id.startsWith("prof-")
      ? currentLesson.id.replace("prof-", "")
      : null;
  const loadingMessageId =
    isGlobalLoading && currentLesson?.id.startsWith("prof-")
      ? currentLesson.id.replace("prof-", "")
      : null;

  const handleCopyMessage = (msgId: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const updateAudioVolume = (vol: number) => {
    setSpeechVolume(vol);
    localStorage.setItem("aws_professor_speech_volume", String(vol));
    setGlobalVolume(vol);
  };

  const updateAudioRate = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem("aws_professor_speech_rate", String(rate));
    setGlobalRate(rate);
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      localStorage.setItem("aws_professor_autospeak", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (selectedVoiceId && selectedVoiceId !== globalVoiceId) {
      setGlobalVoiceId(selectedVoiceId);
    }
  }, [selectedVoiceId, globalVoiceId, setGlobalVoiceId]);

  const handlePlaySpeech = async (messageId: string, text: string) => {
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;
    await playLesson(
      {
        id: `prof-${messageId}`,
        title: cleanedText.slice(0, 56) + (cleanedText.length > 56 ? "..." : ""),
        module: "Professor Cloud",
        text: cleanedText,
      },
      { toggleIfSame: true }
    );
  };

  const toggleMicInput = () => {
    if (isListeningMic) {
      recognitionRef.current?.stop?.();
      setIsListeningMic(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    recognition.onstart = () => setIsListeningMic(true);
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setInputText((finalTranscript + interim).trimStart());
    };
    recognition.onerror = () => setIsListeningMic(false);
    recognition.onend = () => {
      setIsListeningMic(false);
      if (finalTranscript.trim()) {
        handleSendMessage(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Active Socratic Session Resume State
  const [activeSessionDoc, setActiveSessionDoc] = useState<ActiveSocraticSessionDoc | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`socratic-${Date.now()}`);

  useEffect(() => {
    if (user?.uid) {
      getMostRecentActiveSocraticSession(user.uid)
        .then((docData) => {
          if (docData && docData.status === "active" && docData.messages && docData.messages.length > 1) {
            setActiveSessionDoc(docData);
          } else {
            setActiveSessionDoc(null);
          }
        })
        .catch(() => {});
    } else {
      setActiveSessionDoc(null);
    }
  }, [user]);

  const handleResumeActiveSocraticSession = () => {
    if (!activeSessionDoc) return;
    setCurrentSessionId(activeSessionDoc.sessionId);
    if (activeSessionDoc.messages && activeSessionDoc.messages.length > 0) {
      setMessages(activeSessionDoc.messages);
    }
    setActiveSessionDoc(null);
  };

  const handleDismissActiveSocraticSession = () => {
    if (user?.uid && activeSessionDoc?.sessionId) {
      markSocraticSessionCompleted(user.uid, activeSessionDoc.sessionId);
    }
    setActiveSessionDoc(null);
  };

  useEffect(() => {
    if (user) {
      getChatHistoryFromCloud()
        .then((history) => {
          if (history && history.length > 0) {
            setMessages(history);
          } else {
            setMessages([INITIAL_WELCOME]);
          }
        })
        .catch(() => setMessages([INITIAL_WELCOME]));
    } else {
      const savedChat = localStorage.getItem("aws_professor_chat_history_v1");
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch {
          setMessages([INITIAL_WELCOME]);
        }
      }
    }
  }, [user]);

  const persistMessages = async (newMessages: ChatMessage[], sessionIdOverride?: string) => {
    const cleanForStorage = newMessages.map(({ isStreaming: _s, ...rest }) =>
      Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
    ) as unknown as ChatMessage[];
    if (user) {
      await saveChatHistoryToCloud(cleanForStorage);
      await saveActiveSocraticSessionState(user.uid, sessionIdOverride || currentSessionId, {
        status: "active",
        messages: cleanForStorage,
      });
    } else {
      localStorage.setItem("aws_professor_chat_history_v1", JSON.stringify(cleanForStorage));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const parseProfessorMessage = (text: string) => {
    const answerMatch = text.match(/\[Answer:\s*([A-D])\]/i);
    const answer = answerMatch ? answerMatch[1].toUpperCase() : undefined;
    const cleanedText = text.replace(/\[Answer:\s*([A-D])\]/gi, "").trim();

    const lines = cleanedText.split("\n");
    const options: { key: string; text: string }[] = [];
    lines.forEach((line) => {
      const match = line.match(/^\s*(?:-\s*)?([A-D])\s*[\s\-\).:\]]+(.+)$/i);
      if (match) {
        options.push({ key: match[1].toUpperCase(), text: match[2].trim() });
      }
    });

    return { cleanedText, answer, options };
  };

  const handleResetChat = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    abortControllerRef.current?.abort();
    if (user?.uid && currentSessionId) {
      await markSocraticSessionCompleted(user.uid, currentSessionId);
    }
    const newSession = `socratic-${Date.now()}`;
    setCurrentSessionId(newSession);
    setMessages([INITIAL_WELCOME]);
    await persistMessages([INITIAL_WELCOME], newSession);
    setApiError(null);
  };

  const handleExportChat = () => {
    const textToSave = messages
      .map((m) => `[${m.role.toUpperCase()} - ${m.mode || "socratic"}]\n${m.text}`)
      .join("\n\n---\n\n");
    const blob = new Blob([textToSave], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `professor-cloud-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleSendMessage = async (
    textToSend: string,
    summonedAgent?: string,
    overrideMode?: TeachingMode
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const effectiveMode = overrideMode || activeMode;
    if (overrideMode) setActiveMode(overrideMode);

    setShowStarterDrawer(false);
    setApiError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
      mode: effectiveMode,
      agentCollaborator: summonedAgent,
    };

    const assistantId = `professor-${Date.now() + 1}`;
    const streamingPlaceholder: ChatMessage = {
      id: assistantId,
      role: "model",
      text: "",
      timestamp: new Date().toISOString(),
      mode: effectiveMode,
      isStreaming: true,
    };

    const historyBeforeStream = [...messages, userMessage];
    setMessages([...historyBeforeStream, streamingPlaceholder]);
    setInputText("");
    setIsLoading(true);
    onAddMinutes?.(2);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const contents = historyBeforeStream
        .filter((m) => m.id !== "welcome-msg")
        .slice(-12)
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

      const adaptiveContext = `\n\nADAPTIVE STUDENT CONTEXT: Exam readiness ${learnerTelemetry.overallPct}%. Weakest domain: "${learnerTelemetry.weakestDomain.name}" (${learnerTelemetry.weakestDomain.pct}% mastery). Calibrate difficulty and highlight exam distinctions accordingly.`;
      const modeInstruction = MODE_SYSTEM_INSTRUCTIONS[effectiveMode] || MODE_SYSTEM_INSTRUCTIONS.socratic;
      const finalInstruction =
        modeInstruction +
        adaptiveContext +
        (summonedAgent
          ? `\n\nSPECIAL COLLABORATION: You are collaborating with Swarm Specialist @${summonedAgent}. Channel their specialized AWS expertise directly in your response.`
          : "");

      const apiResponse = await fetch("/api/gemini/professor-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          aiModelMode,
          systemInstruction: finalInstruction,
        }),
      });

      if (!apiResponse.ok || !apiResponse.body) {
        let errMessage = "Failed to connect to Professor Cloud streaming service.";
        try {
          const errJson = await apiResponse.json();
          if (errJson?.error) errMessage = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const reader = apiResponse.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.delta) {
              accumulated += payload.delta;
              const liveText = accumulated.replace(/\[Answer:\s*[A-D]?\]?/gi, "");
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, text: liveText } : m))
              );
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
          }
        }
      }

      const finalRaw = accumulated.trim() || "Ready when you are — ask a follow-up to continue.";
      const parsed = parseProfessorMessage(finalRaw);
      const completedMessage: ChatMessage = {
        id: assistantId,
        role: "model",
        text: parsed.cleanedText,
        timestamp: new Date().toISOString(),
        mode: effectiveMode,
        isStreaming: false,
        hasQuiz: parsed.options.length > 0 && !!parsed.answer,
        ...(parsed.options.length > 0 ? { quizOptions: parsed.options } : {}),
        ...(parsed.answer ? { quizAnswer: parsed.answer } : {}),
      };

      const finalMessages = [...historyBeforeStream, completedMessage];
      setMessages(finalMessages);
      await persistMessages(finalMessages);

      if (autoSpeak || effectiveMode === "voice") {
        handlePlaySpeech(assistantId, parsed.cleanedText);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: m.text || "Generation stopped.", isStreaming: false }
              : m
          );
          persistMessages(updated);
          return updated;
        });
      } else {
        setApiError(err?.message || "Unable to reach Professor Cloud. Please check your connection and try again.");
        setMessages(historyBeforeStream);
        await persistMessages(historyBeforeStream);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSelectQuizOption = (messageId: string, optionKey: string) => {
    const updated = messages.map((msg) => {
      if (msg.id === messageId && msg.quizAnswer) {
        const isCorrect = optionKey.toUpperCase() === msg.quizAnswer.toUpperCase();

        if (!msg.userSelectedAnswer) {
          const result = recordProfessorCheckpoint(isCorrect);
          setEarnedXPToast({
            amount: result.xpEarned,
            message: isCorrect ? "Spot-on Socratic Recall!" : "Review Attempt Logged",
          });
          setTimeout(() => setEarnedXPToast(null), 3500);

          if (result.crateDropped) {
            setDroppedCrate(result.crateDropped);
          }
          if (isCorrect) {
            onAddMinutes?.(2);
          }
        }

        return {
          ...msg,
          userSelectedAnswer: optionKey,
          quizCorrect: isCorrect,
        };
      }
      return msg;
    });
    setMessages(updated);
    persistMessages(updated);
  };

  const handleOpenDroppedCrate = (crate: LootCrate) => {
    try {
      const outcome = openLootCrate(crate.id);
      setOpenedCrateReward(outcome);
      setDroppedCrate(null);
    } catch (err) {
      console.error("Failed to open crate:", err);
    }
  };

  const isZeroState = messages.length <= 1;
  const lastModelMsg = [...messages].reverse().find((m) => m.role === "model" && !m.isStreaming);
  const showFollowUpChips = !isLoading && !isZeroState && !!lastModelMsg;

  return (
    <div className="flex flex-col h-[calc(100dvh-165px)] min-h-[540px] max-h-[880px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden relative">
      {/* TOP BAR */}
      <header className="bg-slate-950 px-3.5 sm:px-5 py-3 border-b border-slate-800 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-[#FF9900] flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight truncate">
                  Professor Cloud
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Adaptive CLF-C02 Tutor · {learnerTelemetry.overallPct}% Readiness
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleAutoSpeak}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                autoSpeak
                  ? "bg-[#FF9900] text-slate-950 border-[#FF9900]"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
              }`}
              title="Automatically narrate Professor responses"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{autoSpeak ? "Auto-Speak On" : "Auto-Speak"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAudioStudio((v) => !v)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                showAudioStudio
                  ? "bg-slate-800 text-[#FF9900] border-amber-500/40"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
              }`}
              title="Voice & Speed Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Voice</span>
            </button>

            <button
              type="button"
              onClick={handleExportChat}
              className="min-h-[36px] p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
              title="Export study notes"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              className={`min-h-[36px] px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                confirmReset
                  ? "bg-rose-600 text-white border-rose-500"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
              }`}
              title={confirmReset ? "Tap again to clear chat" : "New session"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmReset && <span>Confirm</span>}
            </button>
          </div>
        </div>

        {/* Segmented Horizontal Mode Picker */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(Object.keys(MODE_META) as TeachingMode[]).map((modeKey) => {
            const meta = MODE_META[modeKey];
            const active = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => setActiveMode(modeKey)}
                className={`shrink-0 min-h-[34px] px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF9900] text-slate-950 shadow-xs"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80"
                }`}
              >
                {meta.icon}
                <span className="sm:hidden">{meta.shortLabel}</span>
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* COLLAPSIBLE VOICE STUDIO DRAWER (Accessible on Mobile & Desktop) */}
      {showAudioStudio && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 text-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#FF9900] shrink-0" />
            <select
              value={selectedVoiceId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVoiceId(val);
                localStorage.setItem("aws_professor_voice_id", val);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-[#FF9900]"
            >
              {ELEVENLABS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              {[0.85, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => updateAudioRate(rate)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-bold cursor-pointer ${
                    speechRate === rate ? "bg-[#FF9900] text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span>Vol</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.1}
                value={speechVolume}
                onChange={(e) => updateAudioVolume(Number(e.target.value))}
                className="w-20 accent-[#FF9900] cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* COMPACT ADAPTIVE TELEMETRY BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2 text-[11px] shrink-0">
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Drill me on my weakest AWS CLF-C02 domain right now: ${learnerTelemetry.weakestDomain.name}. Give me a concise mastery lesson and a tough checkpoint question.`,
              "Archie"
            )
          }
          disabled={isLoading}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#FF9900] font-semibold truncate cursor-pointer disabled:opacity-50"
          title="Tap to drill your weakest domain"
        >
          <Target className="w-3.5 h-3.5 text-[#FF9900] shrink-0" />
          <span className="truncate">
            Focus: <strong className="font-bold">{learnerTelemetry.weakestDomain.name}</strong> ({learnerTelemetry.weakestDomain.pct}%)
          </span>
          <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {sessionStats.answered > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              {sessionStats.correct}/{sessionStats.answered} Checkpoints
            </span>
          )}
          <span className="hidden sm:inline">{MODE_META[activeMode].description}</span>
        </div>
      </div>

      {/* Floating XP Toast */}
      {earnedXPToast && (
        <div className="absolute top-28 right-4 z-40 bg-slate-900 border border-[#FF9900] text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2.5 animate-fade-in">
          <div className="p-1 bg-[#FF9900] text-slate-950 rounded-full">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-400">+{earnedXPToast.amount} XP</div>
            <div className="text-[10px] text-slate-300">{earnedXPToast.message}</div>
          </div>
        </div>
      )}

      {/* Mystery Crate Alert */}
      {droppedCrate && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border-b border-purple-500/40 px-4 py-2.5 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold truncate">
              Mystery Loot Crate: {droppedCrate.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenDroppedCrate(droppedCrate)}
            className="px-3 py-1.5 bg-[#FF9900] text-slate-950 font-black text-xs rounded-lg shrink-0 cursor-pointer"
          >
            Open Crate
          </button>
        </div>
      )}

      {/* Opened Crate Modal */}
      {openedCrateReward && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl text-white relative">
            <button
              type="button"
              onClick={() => setOpenedCrateReward(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-amber-500/20 text-[#FF9900] rounded-xl flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-[#FF9900]">Loot Unlocked</h3>
            {openedCrateReward.rewards.map((r, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {r.icon} {r.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    {r.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{r.description}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOpenedCrateReward(null)}
              className="w-full py-2.5 bg-[#FF9900] text-slate-950 font-black text-xs rounded-xl cursor-pointer"
            >
              Collect Reward
            </button>
          </div>
        </div>
      )}

      {/* Resume Active Cloud Session Banner */}
      {activeSessionDoc && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <p className="text-xs text-slate-700 dark:text-slate-200 truncate">
              Resume previous session ({activeSessionDoc.messages?.length || 0} messages)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissActiveSocraticSession}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleResumeActiveSocraticSession}
              className="px-3 py-1 bg-[#FF9900] text-slate-950 font-black text-xs rounded-lg cursor-pointer"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* CONVERSATION STREAM */}
      <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4 space-y-5 bg-slate-50/70 dark:bg-slate-950 touch-scroll">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[82%] flex gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Compact Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-slate-900 dark:bg-slate-800 text-white"
                    : "bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="text-[9px] font-black">YOU</span>
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className="space-y-2.5 min-w-0 flex-1">
                <div
                  className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed overflow-x-auto ${
                    msg.role === "user"
                      ? "bg-slate-900 dark:bg-slate-800 text-white rounded-tr-xs"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs prose prose-sm prose-slate dark:prose-invert max-w-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                  ) : msg.isStreaming && !msg.text ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium py-0.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9900]" />
                      <span>Professor Cloud is thinking...</span>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#FF9900] animate-pulse align-middle rounded-xs" />
                      )}
                    </div>
                  )}
                </div>

                {/* Audio + Copy Action Bar */}
                {msg.role === "model" && !msg.isStreaming && msg.text && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlaySpeech(msg.id, msg.text)}
                      disabled={loadingMessageId === msg.id}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        playingMessageId === msg.id
                          ? "bg-[#FF9900] text-slate-950 border-[#FF9900]"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#FF9900]/50"
                      }`}
                    >
                      {loadingMessageId === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#FF9900]" />
                      ) : playingMessageId === msg.id ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      <span>{playingMessageId === msg.id ? "Stop" : "Listen"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* INTERACTIVE CHECKPOINT QUIZ */}
                {msg.role === "model" && !msg.isStreaming && msg.hasQuiz && msg.quizOptions && msg.quizOptions.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider font-mono">
                      <span className="flex items-center gap-1.5 text-[#FF9900]">
                        <Flame className="w-3.5 h-3.5" />
                        Active Recall Check
                      </span>
                      <span className="text-emerald-400">+50 XP</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.quizOptions.map((opt, optIdx) => {
                        const isSelected = msg.userSelectedAnswer === opt.key;
                        const isAnswerCorrect = opt.key === msg.quizAnswer;
                        const showResult = !!msg.userSelectedAnswer;

                        let buttonStyle =
                          "bg-slate-950 border-slate-800 text-slate-200 hover:border-[#FF9900]/60";
                        if (showResult) {
                          if (isAnswerCorrect) {
                            buttonStyle = "bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold";
                          } else if (isSelected) {
                            buttonStyle = "bg-rose-950/90 border-rose-500 text-rose-200 font-bold";
                          } else {
                            buttonStyle = "bg-slate-950/40 border-slate-900 text-slate-500 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={`${msg.id}-${opt.key}-${optIdx}`}
                            type="button"
                            disabled={showResult}
                            onClick={() => handleSelectQuizOption(msg.id, opt.key)}
                            className={`w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2.5 ${buttonStyle} ${
                              !showResult && "cursor-pointer"
                            }`}
                          >
                            <span className="w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 bg-slate-800 border border-slate-700 text-slate-300">
                              {opt.key}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {msg.userSelectedAnswer && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
                          msg.quizCorrect
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {msg.quizCorrect ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span className="font-semibold">
                            {msg.quizCorrect
                              ? "Correct! +50 XP earned."
                              : `Answer is ${msg.quizAnswer}.`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendMessage(
                              `Explain concisely why ${msg.quizAnswer} is right and why the other options are AWS CLF-C02 distractors.`
                            )
                          }
                          disabled={isLoading}
                          className="text-[11px] font-black underline hover:text-white shrink-0 cursor-pointer"
                        >
                          Why?
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ZERO-STATE STUDY STARTERS & SWARM GALLERY */}
        {(isZeroState || showStarterDrawer) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF9900]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  High-Yield Study Starters
                </h4>
              </div>
              {showStarterDrawer && (
                <button
                  type="button"
                  onClick={() => setShowStarterDrawer(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  Hide
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(starter.prompt, undefined, starter.mode)}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-[#FF9900] transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9900] font-mono">
                    {starter.tag}
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-[#FF9900] transition-colors">
                    {starter.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {starter.subtitle}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#FF9900]" />
                Co-Teach with Specialist Agents
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SWARM_SPECIALISTS.map((agent) => (
                  <button
                    key={agent.name}
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      handleSendMessage(
                        `@${agent.name} (${agent.role}): Give me your #1 AWS CLF-C02 exam rule in ${agent.badge} and test me on it.`,
                        agent.name
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#FF9900] hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    @{agent.name} · {agent.badge}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Connection Notice</div>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SMART COMPOSER + FOLLOW-UP BAR */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3.5 sm:px-5 py-3 space-y-2.5 shrink-0">
        {showFollowUpChips && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setShowStarterDrawer((v) => !v)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#FF9900]" />
              <span>Topics</span>
              {showStarterDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>

            {[
              { label: "Explain simpler", prompt: "Explain that concept in simpler everyday terms with a quick analogy." },
              { label: "Harder question", prompt: "Give me a harder CLF-C02 scenario question on this exact topic." },
              { label: "Exam traps", prompt: "What sneaky distractor keywords does AWS use on the exam for this topic?" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          {micSupported && (
            <button
              type="button"
              onClick={toggleMicInput}
              disabled={isLoading}
              className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                isListeningMic
                  ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-[#FF9900]"
              }`}
              title={isListeningMic ? "Stop listening" : "Speak question hands-free"}
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <input
            id="professor-chat-input"
            type="text"
            disabled={isLoading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListeningMic
                ? "Listening... speak your AWS question"
                : `Ask Professor Cloud (${MODE_META[activeMode].shortLabel})...`
            }
            className="flex-1 min-h-[44px] px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-sm sm:text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 disabled:opacity-60 font-medium"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="min-h-[44px] px-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Stop streaming"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              id="professor-chat-submit-btn"
              disabled={!inputText.trim()}
              className="min-h-[44px] px-4 bg-[#FF9900] hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <span className="hidden sm:inline">Send</span>
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
