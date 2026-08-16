import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { getChatHistoryFromCloud, saveChatHistoryToCloud } from "../lib/db-client.js";
import { 
  Bot, 
  Send, 
  Trash2, 
  Key, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Flame,
  HelpCircle,
  GraduationCap,
  Copy,
  Download,
  Check,
  Play,
  Volume2,
  VolumeX,
  Pause,
  Loader2,
  Database,
  HardDrive,
  WifiOff,
  RotateCcw,
  FileAudio,
  X,
  Gift,
  Trophy,
  Zap,
  Layers,
  Cpu,
  Shield,
  DollarSign,
  Maximize2
} from "lucide-react";
import { 
  getCachedAudio, 
  saveAudioToCache, 
  synthesizeFallbackSpeechAudio 
} from "../services/audioCacheService";
import { 
  recordProfessorCheckpoint, 
  getGamificationProfile, 
  openLootCrate, 
  LootCrate, 
  LootItem, 
  RARITY_COLORS 
} from "../services/gamificationService";
import { 
  auth, 
  saveActiveSocraticSessionState, 
  getMostRecentActiveSocraticSession, 
  markSocraticSessionCompleted, 
  ActiveSocraticSessionDoc 
} from "../lib/firebase";

export type TeachingMode = "socratic" | "rapid" | "whiteboard" | "distractor";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  mode?: TeachingMode;
  agentCollaborator?: string;
  // Parsed checkpoint data
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
}

const ELEVENLABS_VOICES = [
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Professional Deep Male" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", label: "Crisp Young Male" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", label: "Authoritative Male" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Polished Narration Female" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "Conversational Female" }
];

const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s+(.+)/g, "$1")
    .replace(/-\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
};

const MODE_SYSTEM_INSTRUCTIONS: Record<TeachingMode, string> = {
  socratic: `You are 'Professor Cloud'—an elite AWS Solutions Architect and an encouraging, interactive Socratic mentor.
Socratic Pedagogy Rules:
1. Deep Socratic Architectural Analysis: Always dive deep into architectural trade-offs, security, cost optimization, and performance instead of generic responses. Ask probing questions that challenge the student to think.
2. Relatable Context: Begin technical explanations with clear real-world analogies (e.g., Security Groups = hotel room security guards, NACLs = building perimeter guard gate).
3. Distractor Alert: Explicitly call out typical keyword pitfalls or misleading exam options common to the AWS CLF-C02 exam.
4. Active Checkpoints: Always end your response with a brief, high-yield multiple-choice concept check or scenario riddle.

Active Checkpoint Formatting Rules (MANDATORY):
- Provide exactly 4 options labeled A), B), C), and D) on new lines.
- Always include the correct answer code at the very bottom: [Answer: X] (where X is A, B, C, or D).
Example:
A) Option A
B) Option B
C) Option C
D) Option D

[Answer: C]`,

  rapid: `You are 'Professor Cloud' in RAPID EXAM SPRINT mode.
Rules:
1. Deliver ultra-concise, high-yield bulleted takeaways for AWS CLF-C02 exam prep.
2. Highlight exact AWS keywords that guarantee the right answer on the test.
3. Immediately follow with a lightning-fast scenario checkpoint question.
4. Active Checkpoint Formatting: Exactly 4 options A), B), C), D) and [Answer: X] at the very end.`,

  whiteboard: `You are 'Professor Cloud' in ARCHITECTURAL WHITEBOARD mode.
Rules:
1. Provide ASCII/box-diagram visual architecture representations of the AWS topology requested.
2. Explain the traffic flow step-by-step with numbers (1, 2, 3...).
3. Analyze the architecture through the AWS Well-Architected Pillars (Reliability, Security, Cost Optimization).
4. End with a scenario question testing what happens during a component failure.
5. Active Checkpoint Formatting: Exactly 4 options A), B), C), D) and [Answer: X] at the very end.`,

  distractor: `You are 'Professor Cloud' in DISTRACTOR TRAP BUSTER mode.
Rules:
1. Analyze two or three closely related AWS services that candidates constantly confuse (e.g. WAF vs Shield vs Security Groups, KMS vs CloudHSM, S3 Glacier Flexible vs Deep Archive).
2. Contrast their exact use cases with a side-by-side breakdown.
3. Call out the 'trap keywords' the exam uses to deceive candidates.
4. End with a tricky exam question featuring these distractors.
5. Active Checkpoint Formatting: Exactly 4 options A), B), C), D) and [Answer: X] at the very end.`
};

const INITIAL_WELCOME: ChatMessage = {
  id: "welcome-msg",
  role: "model",
  text: "Hello, Practitioner! I am **Professor Cloud**, your Socratic AWS mentor. Let's master the AWS Certified Cloud Practitioner (CLF-C02) exam!\n\nI can explain architecture with real-world analogies, draw whiteboard topologies, deconstruct tricky distractors, and quiz you on key concepts. Choose a study mode above or pick a high-yield topic below to begin!",
  timestamp: new Date().toISOString(),
  mode: "socratic"
};

export const InteractiveProfessor: React.FC<InteractiveProfessorProps> = ({ user, onAddMinutes, aiModelMode = "expert" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<TeachingMode>("socratic");
  const [apiError, setApiError] = useState<string | null>(null);

  // Gamification states
  const [earnedXPToast, setEarnedXPToast] = useState<{ amount: number; message: string } | null>(null);
  const [droppedCrate, setDroppedCrate] = useState<LootCrate | null>(null);
  const [openedCrateReward, setOpenedCrateReward] = useState<{ crate: LootCrate; rewards: LootItem[] } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ElevenLabs Voice Synthesis hooks
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    return localStorage.getItem("aws_professor_voice_id") || "pNInz6obpgDQGcFmaJgB";
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    return Number(localStorage.getItem("aws_professor_speech_rate") || "1.0");
  });
  const [speechVolume, setSpeechVolume] = useState<number>(() => {
    return Number(localStorage.getItem("aws_professor_speech_volume") || "1.0");
  });
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateAudioVolume = (vol: number) => {
    setSpeechVolume(vol);
    localStorage.setItem("aws_professor_speech_volume", String(vol));
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const updateAudioRate = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem("aws_professor_speech_rate", String(rate));
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlaySpeech = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingMessageId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoadingMessageId(messageId);
    try {
      const cleanedText = cleanTextForSpeech(text);
      const response = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          voiceId: selectedVoiceId
        })
      });

      if (!response.ok) {
        throw new Error("Speech synthesis request failed. Falling back to local browser speech.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = speechVolume;
      audio.playbackRate = speechRate;
      audioRef.current = audio;
      
      audio.onplay = () => {
        setLoadingMessageId(null);
        setPlayingMessageId(messageId);
      };

      audio.onended = () => {
        setPlayingMessageId(null);
      };

      audio.onerror = () => {
        setLoadingMessageId(null);
        setPlayingMessageId(null);
        synthesizeFallbackSpeechAudio(cleanedText);
      };

      await audio.play();
    } catch (error: any) {
      console.warn("ElevenLabs TTS fallback:", error);
      setLoadingMessageId(null);
      setPlayingMessageId(null);
      synthesizeFallbackSpeechAudio(cleanTextForSpeech(text));
    }
  };

  // Active Socratic Session Resume State
  const [activeSessionDoc, setActiveSessionDoc] = useState<ActiveSocraticSessionDoc | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`socratic-${Date.now()}`);

  // Check Firestore for active session upon user login
  useEffect(() => {
    if (user?.uid) {
      getMostRecentActiveSocraticSession(user.uid).then((docData) => {
        if (docData && docData.status === "active" && docData.messages && docData.messages.length > 1) {
          setActiveSessionDoc(docData);
        } else {
          setActiveSessionDoc(null);
        }
      }).catch(err => console.error("Error checking active Socratic session:", err));
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

  // Load chat history from Postgres or localStorage
  useEffect(() => {
    if (user) {
      getChatHistoryFromCloud().then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([INITIAL_WELCOME]);
        }
      }).catch((e) => {
        console.error("Failed to load chat history from Postgres:", e);
        setMessages([INITIAL_WELCOME]);
      });
    } else {
      const savedChat = localStorage.getItem("aws_professor_chat_history_v1");
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (e) {
          setMessages([INITIAL_WELCOME]);
        }
      }
    }
  }, [user]);

  const saveHistory = async (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    if (user) {
      await saveChatHistoryToCloud(newMessages);
      await saveActiveSocraticSessionState(user.uid, currentSessionId, {
        status: "active",
        messages: newMessages
      });
    } else {
      localStorage.setItem("aws_professor_chat_history_v1", JSON.stringify(newMessages));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Helper to parse Professor messages for concept check quizzes
  const parseProfessorMessage = (text: string) => {
    const answerMatch = text.match(/\[Answer:\s*([A-D])\]/i);
    const answer = answerMatch ? answerMatch[1].toUpperCase() : undefined;

    let cleanedText = text.replace(/\[Answer:\s*([A-D])\]/gi, "").trim();

    const lines = cleanedText.split("\n");
    const options: { key: string; text: string }[] = [];
    
    lines.forEach(line => {
      const match = line.match(/^\s*(?:-\s*)?([A-D])\s*[\s\-\).:\]]+(.+)$/i);
      if (match) {
        options.push({
          key: match[1].toUpperCase(),
          text: match[2].trim()
        });
      }
    });

    return {
      cleanedText,
      answer,
      options
    };
  };

  const handleResetChat = async () => {
    if (window.confirm("Are you sure you want to reset your conversation history with Professor Cloud?")) {
      if (user?.uid && currentSessionId) {
        await markSocraticSessionCompleted(user.uid, currentSessionId);
      }
      const newSession = `socratic-${Date.now()}`;
      setCurrentSessionId(newSession);
      saveHistory([INITIAL_WELCOME]);
      setApiError(null);
    }
  };

  const handleExportChat = () => {
    const textToSave = messages.map(m => `[${m.role.toUpperCase()} - ${m.mode || 'Socratic'}]\n${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([textToSave], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `professor-cloud-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send message to Gemini
  const handleSendMessage = async (textToSend: string, summonedAgent?: string) => {
    if (!textToSend.trim() || isLoading) return;

    setApiError(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
      mode: activeMode,
      agentCollaborator: summonedAgent
    };

    const updatedHistory = [...messages, userMessage];
    saveHistory(updatedHistory);
    setInputText("");
    setIsLoading(true);

    if (onAddMinutes) {
      onAddMinutes(2);
    }

    try {
      const contents = updatedHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const activeSystemInstruction = MODE_SYSTEM_INSTRUCTIONS[activeMode] || MODE_SYSTEM_INSTRUCTIONS.socratic;
      const finalInstruction = summonedAgent
        ? `${activeSystemInstruction}\n\nSPECIAL COLLABORATION: The user has summoned Swarm Agent ${summonedAgent}. Incorporate their specialized perspective into your answer!`
        : activeSystemInstruction;

      const apiResponse = await fetch("/api/gemini/professor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          aiModelMode,
          systemInstruction: finalInstruction
        })
      });
      
      if (!apiResponse.ok) {
        throw new Error("Failed to get response from Professor API");
      }
      
      const response = await apiResponse.json();
      if (response.error) {
        throw new Error(response.error);
      }

      const responseText = response.text || "Professor Cloud is reflecting on that...";
      const parsed = parseProfessorMessage(responseText);

      const professorMessage: ChatMessage = {
        id: `professor-${Date.now()}`,
        role: "model",
        text: parsed.cleanedText,
        timestamp: new Date().toISOString(),
        mode: activeMode,
        hasQuiz: parsed.options.length > 0 && !!parsed.answer,
        quizOptions: parsed.options,
        quizAnswer: parsed.answer,
      };

      saveHistory([...updatedHistory, professorMessage]);
    } catch (err: any) {
      console.error("Gemini API error:", err);
      setApiError(err.message || "Failed to communicate with Gemini API. Please check your network.");
      saveHistory(messages);
    } finally {
      setIsLoading(false);
    }
  };

  // Swarm Agent Summon Shortcut
  const handleSummonAgent = (agentName: string, role: string) => {
    const prompt = `@${agentName} (${role}): What is your specialized take and architecture advice for the current AWS exam concept?`;
    handleSendMessage(prompt, agentName);
  };

  // Quick Action Preset triggers
  const triggerPreset = (topic: string) => {
    let promptText = "";
    if (topic === "security") {
      promptText = "Professor, can you explain the differences between Security Groups and Network Access Control Lists (NACLs) using a clear Socratic analogy, and give me a practice concept check?";
    } else if (topic === "responsibility") {
      promptText = "Professor, can you break down the AWS Shared Responsibility Model (what AWS is responsible for vs. what the customer is responsible for) with a simple analogy and a practice question?";
    } else if (topic === "whiteboard_vpc") {
      setActiveMode("whiteboard");
      promptText = "Professor, please whiteboard a high-availability 3-tier VPC architecture diagram (ALB, Web Tier, App Tier, Multi-AZ Database) and test me with a failover scenario.";
    } else if (topic === "s3_tiers") {
      setActiveMode("distractor");
      promptText = "Professor, break down the exact differences and cost traps between S3 Standard, S3 Standard-IA, S3 Glacier Flexible Retrieval, and S3 Glacier Deep Archive.";
    } else if (topic === "serverless") {
      setActiveMode("whiteboard");
      promptText = "Professor, whiteboard an event-driven serverless architecture using API Gateway, AWS Lambda, DynamoDB, and Amazon EventBridge.";
    } else if (topic === "kms") {
      setActiveMode("distractor");
      promptText = "Professor, expose the exam traps comparing AWS KMS vs AWS CloudHSM vs AWS Secrets Manager vs AWS Systems Manager Parameter Store.";
    }
    handleSendMessage(promptText);
  };

  // Handle quiz option selection with real-time gamification
  const handleSelectQuizOption = (messageId: string, optionKey: string) => {
    const updated = messages.map(msg => {
      if (msg.id === messageId && msg.quizAnswer) {
        const isCorrect = optionKey.toUpperCase() === msg.quizAnswer.toUpperCase();
        
        if (!msg.userSelectedAnswer) {
          const result = recordProfessorCheckpoint(isCorrect);
          setEarnedXPToast({
            amount: result.xpEarned,
            message: isCorrect ? "🎯 Correct Socratic Concept Check!" : "💡 Good Practice Attempt!"
          });
          setTimeout(() => setEarnedXPToast(null), 4000);

          if (result.crateDropped) {
            setDroppedCrate(result.crateDropped);
          }

          if (isCorrect && onAddMinutes) {
            onAddMinutes(2);
          }
        }

        return {
          ...msg,
          userSelectedAnswer: optionKey,
          quizCorrect: isCorrect
        };
      }
      return msg;
    });
    saveHistory(updated);
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

  return (
    <div className="flex flex-col h-[720px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden relative">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-800 gap-3">
        
        {/* Left: Identity */}
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-amber-500 to-[#FF9900] p-2 rounded-md shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider leading-none">
                Professor Cloud
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-[#FF9900] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase font-mono">
                Socratic AI Mentor
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1.5">
              <span>AWS Solutions Architect</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-mono text-[10px]">CLF-C02 Specialist</span>
            </p>
          </div>
        </div>

        {/* Center: Teaching Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => setActiveMode("socratic")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "socratic" 
                ? "bg-[#FF9900] text-slate-950 shadow-xs" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Socratic Deep Mentorship & Analogies"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Socratic</span>
          </button>
          
          <button
            onClick={() => setActiveMode("rapid")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "rapid" 
                ? "bg-[#FF9900] text-slate-950 shadow-xs" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Rapid High-Yield Exam Sprint"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rapid Sprint</span>
          </button>

          <button
            onClick={() => setActiveMode("whiteboard")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "whiteboard" 
                ? "bg-[#FF9900] text-slate-950 shadow-xs" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Whiteboard Cloud Architecture Topology Diagrams"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>

          <button
            onClick={() => setActiveMode("distractor")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "distractor" 
                ? "bg-[#FF9900] text-slate-950 shadow-xs" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Expose & Bust Sneaky Exam Traps"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trap Buster</span>
          </button>
        </div>

        {/* Right: Audio & Controls */}
        <div className="flex items-center gap-2">
          {/* ElevenLabs Voice Selection */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 rounded px-2 py-1 text-[10px] text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <select
              value={selectedVoiceId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVoiceId(val);
                localStorage.setItem("aws_professor_voice_id", val);
              }}
              className="bg-transparent border-none text-[10px] font-bold font-mono focus:outline-none text-slate-200 cursor-pointer pr-1"
            >
              {ELEVENLABS_VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100 font-sans font-semibold">
                  {v.name} ({v.label})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800 border border-slate-700/60 rounded px-1.5 py-1 text-[10px]">
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => updateAudioRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                  speechRate === rate 
                    ? "bg-[#FF9900] text-slate-950" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            onClick={handleExportChat}
            className="text-slate-400 hover:text-[#FF9900] text-[10px] font-bold font-mono transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
            title="Export Notes"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleResetChat}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating XP Notification Toast */}
      {earnedXPToast && (
        <div className="absolute top-16 right-4 z-50 bg-slate-900 border border-[#FF9900] text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
          <div className="p-1.5 bg-[#FF9900] text-slate-950 rounded-full font-black">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-400">+{earnedXPToast.amount} Exam XP!</div>
            <div className="text-[10px] text-slate-300">{earnedXPToast.message}</div>
          </div>
        </div>
      )}

      {/* Floating Mystery Loot Crate Drop Alert */}
      {droppedCrate && (
        <div className="bg-gradient-to-r from-pink-900/90 via-purple-900/90 to-indigo-900/90 border-b border-pink-500/40 px-4 py-3 text-white flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-500 text-white rounded-lg shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-pink-300">
                🎁 Mystery Loot Crate Discovered!
              </div>
              <div className="text-xs text-slate-200">
                {droppedCrate.title} ({droppedCrate.rarity.toUpperCase()})
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenDroppedCrate(droppedCrate)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-[#FF9900] text-slate-950 font-black text-xs rounded-md shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Crate Now
          </button>
        </div>
      )}

      {/* Opened Crate Reward Modal */}
      {openedCrateReward && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 p-6 rounded-xl max-w-md w-full text-center space-y-4 shadow-2xl text-white relative">
            <button 
              onClick={() => setOpenedCrateReward(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 bg-amber-500/20 text-[#FF9900] rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-[#FF9900]">
              Loot Unlocked!
            </h3>
            {openedCrateReward.rewards.map((r, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{r.icon}</span>
                    {r.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                    {r.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.description}</p>
              </div>
            ))}
            <button
              onClick={() => setOpenedCrateReward(null)}
              className="w-full py-2.5 bg-[#FF9900] text-slate-950 font-black text-xs rounded-md shadow hover:bg-amber-500 transition-colors cursor-pointer"
            >
              Claim to Inventory
            </button>
          </div>
        </div>
      )}

      {/* Resume Active Session Banner */}
      {activeSessionDoc && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in text-slate-200">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            <p className="text-xs text-slate-300">
              Active Socratic chat found ({activeSessionDoc.messages?.length || 0} msgs).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismissActiveSocraticSession}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 font-bold cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={handleResumeActiveSocraticSession}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded shadow-xs cursor-pointer"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* CHAT BUBBLES CONSOLE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        
        {/* Sync Status Pill */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-2">
          <div className="flex items-center gap-1.5 font-bold font-mono">
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {user ? "Cloud Synced Storage Active" : "Local Sandbox Mode"}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>Mode: <strong className="text-[#FF9900] uppercase">{activeMode}</strong></span>
          </div>
        </div>
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div className={`max-w-[88%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              
              {/* Avatar Icons */}
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
                msg.role === "user" 
                  ? "bg-slate-900 dark:bg-slate-800 border-slate-700 text-white shadow-xs" 
                  : "bg-[#FF9900]/10 border-[#FF9900]/30 text-[#FF9900]"
              }`}>
                {msg.role === "user" ? (
                  <span className="text-[10px] font-black font-mono">YOU</span>
                ) : (
                  <Bot className="w-4 h-4 text-[#FF9900]" />
                )}
              </div>

              {/* Bubble Content */}
              <div className="space-y-3 relative group w-full">
                <div className={`p-4 rounded-lg shadow-xs border text-xs leading-relaxed overflow-hidden ${
                  msg.role === "user"
                    ? "bg-slate-900 dark:bg-slate-800 border-slate-700 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none prose prose-sm prose-slate dark:prose-invert max-w-none"
                }`}>
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>

                {/* Message Audio / Copy Toolbar */}
                {msg.role === "model" && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => handlePlaySpeech(msg.id, msg.text)}
                      className={`text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer border ${
                        playingMessageId === msg.id 
                          ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm animate-pulse" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-[#FF9900]"
                      }`}
                      title={playingMessageId === msg.id ? "Stop Narration" : "Listen with Professor Voice"}
                      disabled={loadingMessageId === msg.id}
                    >
                      {loadingMessageId === msg.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9900]" />
                      ) : playingMessageId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>{playingMessageId === msg.id ? "Listening..." : "Listen"}</span>

                      {/* Visual Soundwave Animation */}
                      {playingMessageId === msg.id && (
                        <span className="flex items-center gap-0.5 ml-1">
                          <span className="w-0.5 h-2.5 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-0.5 h-3.5 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-0.5 h-2 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy message text"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                )}

                {/* PARSED SOCRATIC CHECKPOINT QUIZ */}
                {msg.role === "model" && msg.hasQuiz && msg.quizOptions && msg.quizOptions.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-md space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#FF9900] tracking-wider uppercase font-mono">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20 animate-pulse" />
                        Socratic Active Checkpoint
                      </span>
                      <span className="text-emerald-400 font-mono">+50 XP & Loot Drop</span>
                    </div>
                    
                    <p className="text-xs text-slate-300 font-medium">
                      Select the correct answer to test your retention and earn mastery XP:
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.quizOptions.map((opt, optIdx) => {
                        const isSelected = msg.userSelectedAnswer === opt.key;
                        const isAnswerCorrect = opt.key === msg.quizAnswer;
                        const showResult = !!msg.userSelectedAnswer;

                        let buttonStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white";
                        if (showResult) {
                          if (isAnswerCorrect) {
                            buttonStyle = "bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold";
                          } else if (isSelected) {
                            buttonStyle = "bg-rose-950/90 border-rose-500 text-rose-300 font-bold";
                          } else {
                            buttonStyle = "bg-slate-950/40 border-slate-900 text-slate-600 opacity-40";
                          }
                        }

                        return (
                          <button
                            key={`${msg.id}-${opt.key}-${optIdx}`}
                            disabled={showResult}
                            onClick={() => handleSelectQuizOption(msg.id, opt.key)}
                            className={`w-full text-left p-3 rounded-md border text-xs font-semibold transition-all flex items-start gap-3 ${buttonStyle} ${!showResult && "cursor-pointer hover:translate-x-1"}`}
                          >
                            <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                              showResult && isAnswerCorrect 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                                : showResult && isSelected 
                                ? "bg-rose-500/20 border-rose-500 text-rose-400" 
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}>
                              {opt.key}
                            </span>
                            <span className="leading-snug pt-0.5">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quiz result feedback */}
                    {msg.userSelectedAnswer && (
                      <div className={`p-3 rounded-md text-xs flex items-start gap-2.5 animate-fade-in ${
                        msg.quizCorrect 
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" 
                          : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                      }`}>
                        {msg.quizCorrect ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-black text-xs text-emerald-300">Spot on! Excellent retention.</p>
                              <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                                You identified the core architectural requirement. Socratic active recall cemented! Awarded <strong className="text-white">+50 XP</strong>.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-black text-xs text-rose-300">Watch out for distractors!</p>
                              <p className="text-[11px] text-rose-400/90 leading-relaxed">
                                The correct answer was <span className="font-mono font-bold bg-rose-500/20 px-1 py-0.5 rounded">{msg.quizAnswer}</span>. Review the professor's explanation above to memorize this distinction.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] shrink-0">
                <Bot className="w-4 h-4 text-[#FF9900] animate-pulse" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 p-3.5 rounded-lg text-xs rounded-tl-none flex items-center gap-2 shadow-xs">
                <span className="font-bold">Professor Cloud is reasoning...</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-4 rounded-lg text-xs space-y-1 max-w-xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold uppercase tracking-wider text-rose-900 dark:text-rose-100">
                API Response Delayed
              </h4>
              <p className="leading-relaxed font-medium text-rose-700 dark:text-rose-300">{apiError}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SWARM AGENT SUMMON BAR & PRESETS */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
        
        {/* Agent Swarm Summon Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1 mr-1">
            <Cpu className="w-3 h-3 text-[#FF9900]" />
            Summon Agent:
          </span>
          <button
            onClick={() => handleSummonAgent("Archie", "Lead Solutions Architect")}
            disabled={isLoading}
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            🏗️ @Archie (Architect)
          </button>
          <button
            onClick={() => handleSummonAgent("Guardian", "SecOps & Compliance")}
            disabled={isLoading}
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            🛡️ @Guardian (SecOps)
          </button>
          <button
            onClick={() => handleSummonAgent("PennyWise", "FinOps & Cost")}
            disabled={isLoading}
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            💰 @PennyWise (FinOps)
          </button>
          <button
            onClick={() => handleSummonAgent("TrapMaster", "Exam Distractors")}
            disabled={isLoading}
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            ⚡ @TrapMaster (Traps)
          </button>
        </div>

        {/* Quick Topics Shortcuts */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => triggerPreset("security")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            🛡️ Security Groups vs NACLs
          </button>
          <button
            onClick={() => triggerPreset("responsibility")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            ⚖️ Shared Responsibility
          </button>
          <button
            onClick={() => triggerPreset("whiteboard_vpc")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            📐 Draw 3-Tier VPC Topology
          </button>
          <button
            onClick={() => triggerPreset("s3_tiers")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            📦 S3 Storage Class Cost Traps
          </button>
          <button
            onClick={() => triggerPreset("serverless")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            ⚡ Serverless Event Architecture
          </button>
          <button
            onClick={() => triggerPreset("kms")}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            🔒 KMS vs CloudHSM vs Secrets Manager
          </button>
        </div>

        {/* Input Box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2"
        >
          <input
            id="professor-chat-input"
            type="text"
            disabled={isLoading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask Professor Cloud (${activeMode.toUpperCase()} mode)...`}
            className="flex-1 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100 disabled:opacity-60 font-medium"
          />
          <button
            type="submit"
            id="professor-chat-submit-btn"
            disabled={!inputText.trim() || isLoading}
            className="bg-[#FF9900] hover:bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-md shrink-0 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-sm min-h-[44px]"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
};
