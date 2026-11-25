import React, { useState, useRef } from "react";
import {
  Headphones,
  Play,
  Pause,
  Sparkles,
  Radio,
  Compass,
  Mic,
  MicOff,
  Loader2,
  X,
  ArrowRight,
  DownloadCloud,
  CheckCircle2,
  Volume2,
  CloudRain,
  Waves,
  Brain,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { useAudioLesson, AudioLessonItem } from "../contexts/AudioLessonContext";
import { base64ToBlob } from "../services/audioCacheService";
import { AmbientSoundscapeMode } from "../services/ambientAudioService";
import { triggerHaptic } from "../utils/haptics";

interface AIAudioTourStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tabKey: string) => void;
  onOpenConfidenceHub: () => void;
}

interface TourStop {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  duration: string;
  tabKey: string;
  isConfidenceHub?: boolean;
  script: string;
}

const TOUR_STOPS: TourStop[] = [
  {
    id: "ai-tour-stop-1",
    step: 1,
    title: "Welcome & Command Dashboard",
    subtitle: "Live Recharts Mastery & Daily Readiness",
    duration: "0:35",
    tabKey: "dashboard",
    script:
      "Welcome to CloudMaster, your studio-grade companion for the AWS Certified Cloud Practitioner exam. Right here on your Command Dashboard, Recharts tracks your domain mastery, quiz accuracy, and daily study rhythm in real time. Every flashcard, simulation, and audio lesson syncs seamlessly so you always know exactly where to focus next.",
  },
  {
    id: "ai-tour-stop-2",
    step: 2,
    title: "CLF-C02 Blueprint Audio Masterclass",
    subtitle: "6 Interactive Chapters with Offline Caching",
    duration: "0:40",
    tabKey: "blueprint-lesson",
    script:
      "Next stop is the Blueprint Masterclass. Instead of memorizing two hundred disconnected AWS acronyms, you learn AWS like a digital skyscraper, moving from Availability Zones and Well-Architected pillars to Security, Pricing, and FinOps. Tap Listen on any chapter to play studio neural audio, or save the entire deck offline for your commute.",
  },
  {
    id: "ai-tour-stop-3",
    step: 3,
    title: "Professor Cloud AI Tutor Studio",
    subtitle: "Streaming Socratic Coaching & Auto-Speak",
    duration: "0:40",
    tabKey: "professor",
    script:
      "Step three is Professor Cloud, your adaptive Socratic AI mentor powered by Gemini 4. It automatically inspects your weakest AWS domain, streams clear analogies and ASCII architecture whiteboards live, and quizzes you with active-recall checkpoints. Turn on Auto-Speak to study completely hands-free with your headphones.",
  },
  {
    id: "ai-tour-stop-4",
    step: 4,
    title: "Exam Simulator & Distractor Vault",
    subtitle: "Beat Sneaky CLF-C02 Keyword Traps",
    duration: "0:35",
    tabKey: "simulator",
    script:
      "Now let's sharpen your exam instincts. In the Exam Simulator and Distractor Vault, you drill real-world AWS scenarios designed to expose common traps—like Security Groups versus Network ACLs, or AWS Budgets versus Cost Explorer—building instant pattern recognition before test day.",
  },
  {
    id: "ai-tour-stop-5",
    step: 5,
    title: "Visual Architecture & Prediction Hub",
    subtitle: "700-Point Scaled Score Confidence Engine",
    duration: "0:38",
    tabKey: "dashboard",
    isConfidenceHub: true,
    script:
      "Finally, open the Exam Passing Confidence Hub anytime to inspect your projected scaled score from one hundred to one thousand against AWS's official seven-hundred passing mark. With official domain weightings and a personalized roadmap, you walk into your certification exam knowing you are ready to pass.",
  },
];

const PODCAST_PRESETS = [
  {
    id: "pod-shared-resp",
    tag: "Domain 1 & 2",
    title: "Shared Responsibility & Security Showdown",
    topic: "AWS Shared Responsibility Model (EC2 vs RDS vs S3), IAM Least Privilege, and WAF vs Shield vs GuardDuty exam traps",
  },
  {
    id: "pod-s3-pricing",
    tag: "Domain 3 & 4",
    title: "S3 Storage Tiers & Cloud FinOps Playbook",
    topic: "S3 Standard vs Intelligent-Tiering vs Glacier Deep Archive, plus AWS Budgets vs Cost Explorer and EC2 Savings Plans",
  },
  {
    id: "pod-global-ha",
    tag: "Domain 1 & 3",
    title: "Global Infrastructure, Multi-AZ & Serverless",
    topic: "AWS Regions, Availability Zones, CloudFront Edge Locations, RTO vs RPO, and EC2 vs AWS Lambda serverless scaling",
  },
  {
    id: "pod-exam-cram",
    tag: "Full Exam",
    title: "60-Second High-Yield CLF-C02 Rapid Cram",
    topic: "The top 8 highest-yield AWS CLF-C02 exam service distinctions and keyword shortcuts every candidate must memorize",
  },
];

const AMBIENT_OPTIONS: Array<{ id: AmbientSoundscapeMode; label: string; icon: React.ReactNode }> = [
  { id: "off", label: "Off", icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: "rain", label: "Soft Rain", icon: <CloudRain className="w-3.5 h-3.5" /> },
  { id: "focus", label: "Deep Focus", icon: <Waves className="w-3.5 h-3.5" /> },
  { id: "alpha", label: "Alpha Wave", icon: <Brain className="w-3.5 h-3.5" /> },
];

export const AIAudioTourStudio: React.FC<AIAudioTourStudioProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenConfidenceHub,
}) => {
  const {
    currentLesson,
    isPlaying,
    isLoading,
    playLesson,
    playQueue,
    playAudioBlob,
    precacheLessons,
    ambientMode,
    ambientVolume,
    setAmbientMode,
    setAmbientVolume,
    serverStatus,
  } = useAudioLesson();

  const [activeTab, setActiveTab] = useState<"tour" | "podcast" | "voice_ask">("tour");
  const [customTopic, setCustomTopic] = useState("");
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastError, setPodcastError] = useState<string | null>(null);
  const [activePodcast, setActivePodcast] = useState<{
    title: string;
    turns: Array<{ speaker: string; text: string }>;
  } | null>(null);

  // Voice Ask (Gemini 3.5 Transcribe + Gemini 4 + Gemini 3.8 TTS)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAskBusy, setVoiceAskBusy] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [voiceAnswer, setVoiceAnswer] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const tourAudioItems: AudioLessonItem[] = TOUR_STOPS.map((stop) => ({
    id: stop.id,
    title: `${stop.step}. ${stop.title}`,
    module: "AI Guided Audio Tour",
    text: stop.script,
  }));

  const handlePlayFullTour = () => {
    triggerHaptic("medium");
    playQueue(tourAudioItems, 0);
  };

  const handlePlayStop = (stop: TourStop, navigateToo = false) => {
    triggerHaptic("light");
    playLesson(
      {
        id: stop.id,
        title: `${stop.step}. ${stop.title}`,
        module: "AI Guided Audio Tour",
        text: stop.script,
      },
      { toggleIfSame: true }
    );
    if (navigateToo) {
      onClose();
      if (stop.isConfidenceHub) {
        onOpenConfidenceHub();
      } else {
        onNavigateToTab(stop.tabKey);
      }
    }
  };

  const handleDownloadTourOffline = async () => {
    triggerHaptic("medium");
    await precacheLessons(tourAudioItems, "AI Audio Tour");
  };

  const handleGeneratePodcast = async (topic: string, title?: string) => {
    if (!topic.trim() || podcastLoading) return;
    triggerHaptic("medium");
    setPodcastLoading(true);
    setPodcastError(null);

    try {
      const response = await fetch("/api/audio/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), title }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate podcast episode.");
      }

      setActivePodcast({
        title: data.title || title || topic,
        turns: Array.isArray(data.turns) ? data.turns : [],
      });

      if (data.audioBase64) {
        const wavBlob = base64ToBlob(data.audioBase64, data.mimeType || "audio/wav");
        const transcriptSummary = (data.turns || [])
          .map((t: any) => `${t.speaker}: ${t.text}`)
          .join(" ");
        await playAudioBlob(
          {
            id: `podcast-${Date.now()}`,
            title: data.title || title || topic,
            module: "Dual-Host AI Podcast (Alex & Maya)",
            text: transcriptSummary || topic,
          },
          wavBlob,
          "gemini-podcast"
        );
      }
    } catch (err: any) {
      setPodcastError(err?.message || "Could not synthesize podcast audio right now.");
    } finally {
      setPodcastLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const recordedBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await processRecordedVoiceQuery(recordedBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      triggerHaptic("medium");
    } catch {
      setVoiceError("Microphone access was denied or is unavailable in this browser.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processRecordedVoiceQuery = async (blob: Blob) => {
    setVoiceAskBusy(true);
    setVoiceError(null);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const str = String(reader.result || "");
          resolve(str.includes(",") ? str.split(",")[1] : str);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const transcribeRes = await fetch("/api/audio/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || "audio/webm" }),
      });
      const transData = await transcribeRes.json();
      if (!transcribeRes.ok || transData.error) {
        throw new Error(transData.error || "Transcription failed.");
      }

      const spokenQuery = transData.text;
      if (!spokenQuery) {
        throw new Error("We didn't catch clear speech. Try holding the mic closer and speaking again.");
      }
      setVoiceTranscript(spokenQuery);

      const chatRes = await fetch("/api/gemini/professor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiModelMode: "fast",
          systemInstruction:
            "You are Professor Cloud in Voice Tour Coach mode for AWS CLF-C02. Answer in 3-4 crisp, natural spoken sentences with zero markdown symbols, giving one clear analogy and one exam keyword tip.",
          contents: [{ role: "user", parts: [{ text: spokenQuery }] }],
        }),
      });
      const chatData = await chatRes.json();
      if (!chatRes.ok || chatData.error) {
        throw new Error(chatData.error || "Professor Cloud could not respond right now.");
      }

      const answer = (chatData.text || "").trim();
      setVoiceAnswer(answer);
      await playLesson({
        id: `voice-ask-${Date.now()}`,
        title: spokenQuery.slice(0, 56),
        module: "Voice Coach Answer",
        text: answer,
      });
    } catch (err: any) {
      setVoiceError(err?.message || "Voice coaching failed.");
    } finally {
      setVoiceAskBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        {/* Studio Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-[#FF9900] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  AI Audio Tour & Podcast Studio
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Gemini 3.8 Neural HD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {serverStatus?.cloudflareEdgeHeaders
                  ? "Studio neural voices · Dual-host AI podcasts · Offline IndexedDB + Cloudflare Edge cache"
                  : "Narrated tour, dual-host AI podcasts, and hands-free voice coaching"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer shrink-0"
            aria-label="Close AI Audio Tour Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("tour")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === "tour"
                ? "bg-[#FF9900] text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Guided Audio Tour</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("podcast")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === "podcast"
                ? "bg-[#FF9900] text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dual-Host AI Podcasts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice_ask")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === "voice_ask"
                ? "bg-[#FF9900] text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Hands-Free Voice Ask</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 touch-scroll">
          {/* Listening Pleasure Bar: Spatial Study Soundscape */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Sliders className="w-4 h-4 text-[#FF9900] shrink-0" />
              <span>Focus Ambience</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {AMBIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAmbientMode(opt.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                    ambientMode === opt.id
                      ? "bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 border-transparent"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
              {ambientMode !== "off" && (
                <input
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-16 accent-[#FF9900] cursor-pointer ml-1"
                  aria-label="Ambient sound volume"
                />
              )}
            </div>
          </div>

          {/* TAB 1: GUIDED AUDIO TOUR */}
          {activeTab === "tour" && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    5-Stop Narrated Walkthrough
                  </div>
                  <h3 className="text-base font-black mt-0.5">
                    Press Play & Let AI Guide Your Study Session
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous studio narration plays seamlessly in the background as you explore every module.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePlayFullTour}
                    className="min-h-[44px] px-4 py-2.5 bg-[#FF9900] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Audio Tour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTourOffline}
                    className="min-h-[44px] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    title="Cache all 5 tour stops for offline playback"
                  >
                    <DownloadCloud className="w-4 h-4 text-[#FF9900]" />
                    <span className="hidden sm:inline">Save Offline</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {TOUR_STOPS.map((stop) => {
                  const isCurrent = currentLesson?.id === stop.id;
                  const stopPlaying = isCurrent && isPlaying;
                  const stopLoading = isCurrent && isLoading;

                  return (
                    <div
                      key={stop.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-amber-500/10 border-[#FF9900]/60"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handlePlayStop(stop, false)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            stopPlaying
                              ? "bg-[#FF9900] text-slate-950"
                              : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-[#FF9900] hover:text-slate-950"
                          }`}
                          aria-label={stopPlaying ? `Pause ${stop.title}` : `Listen to ${stop.title}`}
                        >
                          {stopLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : stopPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#FF9900]">
                              STOP 0{stop.step}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {stop.duration}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {stop.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {stop.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayStop(stop, true)}
                        className="shrink-0 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#FF9900] hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="hidden sm:inline">Listen & Open</span>
                        <span className="sm:hidden">Go</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DUAL-HOST AI PODCAST STUDIO */}
          {activeTab === "podcast" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FF9900]" />
                      Dual-Host Studio Show (Alex & Maya)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Powered by Google Gemini 3.8 Flash Multi-Speaker TTS. Generates a custom 2-host audio show and saves it to your offline vault.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGeneratePodcast(customTopic);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={customTopic}
                    disabled={podcastLoading}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter any AWS topic (e.g., KMS vs CloudHSM, VPC Subnets)..."
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                  />
                  <button
                    type="submit"
                    disabled={podcastLoading || !customTopic.trim()}
                    className="min-h-[44px] px-4 bg-[#FF9900] hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shrink-0 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {podcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                    <span>{podcastLoading ? "Producing..." : "Produce Show"}</span>
                  </button>
                </form>
              </div>

              {podcastError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{podcastError}</span>
                </div>
              )}

              {/* Curated One-Tap Episodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PODCAST_PRESETS.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    disabled={podcastLoading}
                    onClick={() => handleGeneratePodcast(ep.topic, ep.title)}
                    className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] transition-all cursor-pointer disabled:opacity-50 group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#FF9900]">
                        {ep.tag}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#FF9900] flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        Listen
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {ep.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ep.topic}
                    </p>
                  </button>
                ))}
              </div>

              {/* Active Podcast Transcript */}
              {activePodcast && activePodcast.turns.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="text-xs font-black text-amber-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Now Playing: {activePodcast.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Saved to Offline Vault</span>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {activePodcast.turns.map((t, idx) => (
                      <div key={idx} className="text-xs leading-relaxed">
                        <span
                          className={`font-black mr-2 ${
                            t.speaker === "Alex" ? "text-amber-400" : "text-cyan-400"
                          }`}
                        >
                          {t.speaker}:
                        </span>
                        <span className="text-slate-200">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HANDS-FREE VOICE ASK (GEMINI 3.5 TRANSCRIBE + GEMINI 3.8 TTS) */}
          {activeTab === "voice_ask" && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 text-center space-y-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Gemini 3.5 Transcribe + Gemini 3.8 Studio Voice
                </div>
                <h3 className="text-base font-black">
                  Tap & Speak Any AWS Exam Question
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Works cleanly across iOS Safari, Chrome, and desktop. Your voice is transcribed accurately for AWS terms and answered aloud automatically.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={voiceAskBusy}
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                      isRecording
                        ? "bg-rose-500 text-white animate-pulse scale-105"
                        : "bg-[#FF9900] hover:bg-amber-400 text-slate-950"
                    } disabled:opacity-50`}
                    aria-label={isRecording ? "Stop recording" : "Start voice question"}
                  >
                    {voiceAskBusy ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                  <div className="text-xs font-bold text-slate-300 mt-3">
                    {voiceAskBusy
                      ? "Transcribing & synthesizing studio response..."
                      : isRecording
                      ? "Recording... Tap again to send"
                      : "Tap microphone to ask aloud"}
                  </div>
                </div>
              </div>

              {voiceError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voiceError}</span>
                </div>
              )}

              {voiceTranscript && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      You Asked
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      “{voiceTranscript}”
                    </p>
                  </div>
                  {voiceAnswer && (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#FF9900]">
                        Professor Cloud (Narrated)
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                        {voiceAnswer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
