import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  getCachedAudioBlob,
  getCachedAudioBlobByKey,
  saveCachedAudioBlob,
  touchCachedAudioPlayed,
  getAudioMemorySync,
  getAudioMemoryState,
  saveAudioMemoryState,
  listCachedLessons,
  deleteCachedLesson,
  clearAudioCache,
  getCacheStats,
  CachedAudioRecord,
  PersistentLessonResume,
} from "../services/audioCacheService";
import { ambientAudioEngine, AmbientSoundscapeMode } from "../services/ambientAudioService";
import { triggerHaptic } from "../utils/haptics";

export interface ElevenLabsVoiceOption {
  id: string;
  geminiVoice: string;
  name: string;
  role: string;
  style: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoiceOption[] = [
  { id: "pNInz6obpgDQGcFmaJgB", geminiVoice: "Charon", name: "Adam", role: "Lead Cloud Architect", style: "Clear & Authoritative" },
  { id: "ErXwobaYiN019PkySvjV", geminiVoice: "Puck", name: "Antoni", role: "Solutions Strategist", style: "Crisp & Analytical" },
  { id: "VR6AewLTigWG4xSOukaG", geminiVoice: "Fenrir", name: "Arnold", role: "Security Auditor", style: "Deep & Focused" },
  { id: "21m00Tcm4TlvDq8ikWAM", geminiVoice: "Kore", name: "Rachel", role: "Senior AWS Coach", style: "Warm & Conversational" },
  { id: "AZnzlk1XvdvUeBnXmlld", geminiVoice: "Zephyr", name: "Domi", role: "FinOps Advisor", style: "Energetic & Concise" },
  { id: "EXAVITQu4vr4xnSDxMaL", geminiVoice: "Aoede", name: "Bella", role: "Executive Mentor", style: "Bright & Expressive" },
  { id: "TxGEqnHWrfWFTfGW9XjX", geminiVoice: "Charon", name: "Josh", role: "Enterprise Specialist", style: "Deep & Reassuring" },
  { id: "yoZ06aMxZJJ28mfd3POQ", geminiVoice: "Puck", name: "Sam", role: "Dynamic Trainer", style: "Clear & Action-Oriented" },
  { id: "JBFqnCBsd6RMkjVDRZzb", geminiVoice: "Fenrir", name: "George", role: "Principal Fellow", style: "Articulate & Experienced" },
];

export interface AudioLessonItem {
  id: string;
  title: string;
  module: string;
  text: string;
  domainId?: string;
  subtitle?: string;
}

export type AudioPlaybackSource =
  | "indexeddb-cache"
  | "gemini-neural"
  | "gemini-podcast"
  | "elevenlabs-api"
  | "browser-fallback"
  | null;

export interface ElevenLabsServerStatus {
  configured: boolean;
  geminiAudioConfigured?: boolean;
  elevenLabsConfigured?: boolean;
  primaryEngine?: string;
  cloudflareEdgeHeaders?: boolean;
  sdkInstalled: boolean;
  cliInstalled: boolean;
  cachedClips: number;
  totalCacheBytes: number;
}

interface AudioLessonContextValue {
  currentLesson: AudioLessonItem | null;
  queue: AudioLessonItem[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  audioSource: AudioPlaybackSource;
  voiceId: string;
  playbackRate: number;
  pitch: number;
  volume: number;
  autoPlayNext: boolean;
  ambientMode: AmbientSoundscapeMode;
  ambientVolume: number;
  sleepTimerMinutes: number | null;
  sleepSecondsRemaining: number | null;
  listenedLessonIds: string[];
  resumableLesson: PersistentLessonResume | null;
  cachedLessons: Omit<CachedAudioRecord, "audioBase64">[];
  cacheStats: { count: number; sizeBytes: number };
  serverStatus: ElevenLabsServerStatus | null;
  isDrawerOpen: boolean;
  isTourModalOpen: boolean;
  isPlayerDismissed: boolean;
  precacheProgress: { active: boolean; done: number; total: number; label: string } | null;
  setIsDrawerOpen: (open: boolean) => void;
  setIsTourModalOpen: (open: boolean) => void;
  setIsPlayerDismissed: (dismissed: boolean) => void;
  playLesson: (lesson: AudioLessonItem, options?: { startTime?: number; toggleIfSame?: boolean }) => Promise<void>;
  playAudioBlob: (lesson: AudioLessonItem, blob: Blob, sourceLabel?: AudioPlaybackSource) => Promise<void>;
  playCachedRecord: (record: { key: string; title: string; module: string; text?: string; textPreview?: string; domainId?: string; lessonId?: string }) => Promise<void>;
  playQueue: (lessons: AudioLessonItem[], startIndex?: number) => Promise<void>;
  previewVoice: (voiceId: string) => Promise<void>;
  resumeLastLesson: () => Promise<void>;
  togglePlayPause: () => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (seconds: number) => void;
  skipBy: (deltaSeconds: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVoiceId: (id: string) => void;
  setPlaybackRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (vol: number) => void;
  setAutoPlayNext: (auto: boolean) => void;
  setAmbientMode: (mode: AmbientSoundscapeMode) => void;
  setAmbientVolume: (vol: number) => void;
  setSleepTimerMinutes: (minutes: number | null) => void;
  precacheLessons: (lessons: AudioLessonItem[], label?: string) => Promise<{ cached: number; skipped: number; failed: number }>;
  removeCachedLesson: (cacheKey: string) => Promise<void>;
  clearAllAudioCache: () => Promise<void>;
  refreshAudioLibrary: () => Promise<void>;
}

const AudioLessonContext = createContext<AudioLessonContextValue | null>(null);

export function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/[*_`#>-]/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const AudioLessonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialMemory = getAudioMemorySync();

  const [currentLesson, setCurrentLesson] = useState<AudioLessonItem | null>(
    initialMemory.lastLesson
      ? {
          id: initialMemory.lastLesson.id,
          title: initialMemory.lastLesson.title,
          module: initialMemory.lastLesson.module,
          text: initialMemory.lastLesson.text,
          domainId: initialMemory.lastLesson.domainId,
          subtitle: initialMemory.lastLesson.subtitle,
        }
      : null
  );
  const [queue, setQueue] = useState<AudioLessonItem[]>(
    initialMemory.lastLesson
      ? [
          {
            id: initialMemory.lastLesson.id,
            title: initialMemory.lastLesson.title,
            module: initialMemory.lastLesson.module,
            text: initialMemory.lastLesson.text,
            domainId: initialMemory.lastLesson.domainId,
            subtitle: initialMemory.lastLesson.subtitle,
          },
        ]
      : []
  );
  const [queueIndex, setQueueIndex] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(initialMemory.lastLesson?.currentTime || 0);
  const [duration, setDuration] = useState<number>(initialMemory.lastLesson?.duration || 0);
  const [audioSource, setAudioSource] = useState<AudioPlaybackSource>(null);

  const [voiceId, setVoiceIdState] = useState<string>(initialMemory.voiceId);
  const [playbackRate, setPlaybackRateState] = useState<number>(initialMemory.playbackRate);
  const [pitch, setPitchState] = useState<number>(initialMemory.pitch || 1.0);
  const [volume, setVolumeState] = useState<number>(initialMemory.volume);
  const [autoPlayNext, setAutoPlayNextState] = useState<boolean>(initialMemory.autoPlayNext);
  const [ambientMode, setAmbientModeState] = useState<AmbientSoundscapeMode>("off");
  const [ambientVolume, setAmbientVolumeState] = useState<number>(0.25);
  const [sleepTimerMinutes, setSleepTimerMinutesState] = useState<number | null>(null);
  const [sleepSecondsRemaining, setSleepSecondsRemaining] = useState<number | null>(null);

  const [listenedLessonIds, setListenedLessonIds] = useState<string[]>(initialMemory.listenedLessonIds);
  const [resumableLesson, setResumableLesson] = useState<PersistentLessonResume | null>(initialMemory.lastLesson);

  const [cachedLessons, setCachedLessons] = useState<Omit<CachedAudioRecord, "audioBase64">[]>([]);
  const [cacheStats, setCacheStats] = useState<{ count: number; sizeBytes: number }>({ count: 0, sizeBytes: 0 });
  const [serverStatus, setServerStatus] = useState<ElevenLabsServerStatus | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isPlayerDismissed, setIsPlayerDismissed] = useState(false);
  const [precacheProgress, setPrecacheProgress] = useState<{
    active: boolean;
    done: number;
    total: number;
    label: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const lastMemoryPersistRef = useRef<number>(0);

  const stateRef = useRef({
    currentLesson,
    queue,
    queueIndex,
    voiceId,
    playbackRate,
    pitch,
    volume,
    autoPlayNext,
    listenedLessonIds,
    currentTime,
    duration,
  });
  stateRef.current = {
    currentLesson,
    queue,
    queueIndex,
    voiceId,
    playbackRate,
    pitch,
    volume,
    autoPlayNext,
    listenedLessonIds,
    currentTime,
    duration,
  };

  const refreshAudioLibrary = useCallback(async () => {
    const [list, stats] = await Promise.all([listCachedLessons(), getCacheStats()]);
    setCachedLessons(list);
    setCacheStats(stats);
    try {
      const res = await fetch("/api/audio/status");
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      // offline
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getAudioMemoryState().then((mem) => {
      if (!mounted) return;
      setVoiceIdState(mem.voiceId);
      setPlaybackRateState(mem.playbackRate);
      setPitchState(mem.pitch ?? 1.0);
      setVolumeState(mem.volume);
      setAutoPlayNextState(mem.autoPlayNext);
      setListenedLessonIds(mem.listenedLessonIds || []);
      if (mem.lastLesson) {
        setResumableLesson(mem.lastLesson);
        setCurrentLesson((prev) =>
          prev || {
            id: mem.lastLesson!.id,
            title: mem.lastLesson!.title,
            module: mem.lastLesson!.module,
            text: mem.lastLesson!.text,
            domainId: mem.lastLesson!.domainId,
            subtitle: mem.lastLesson!.subtitle,
          }
        );
        setCurrentTime((prev) => prev || mem.lastLesson!.currentTime || 0);
        setDuration((prev) => prev || mem.lastLesson!.duration || 0);
      }
    });
    refreshAudioLibrary();
    return () => {
      mounted = false;
    };
  }, [refreshAudioLibrary]);

  const cleanupCurrentAudio = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupCurrentAudio();
      ambientAudioEngine.setMode("off");
    };
  }, [cleanupCurrentAudio]);

  // Sleep Timer Countdown
  useEffect(() => {
    if (sleepSecondsRemaining === null) return;
    if (sleepSecondsRemaining <= 0) {
      cleanupCurrentAudio();
      setIsPlaying(false);
      setAmbientModeState("off");
      ambientAudioEngine.setMode("off");
      setSleepTimerMinutesState(null);
      setSleepSecondsRemaining(null);
      return;
    }
    const timer = window.setInterval(() => {
      setSleepSecondsRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sleepSecondsRemaining, cleanupCurrentAudio]);

  const persistResumeSnapshot = useCallback(
    (lesson: AudioLessonItem, posSeconds: number, totalSeconds: number, force = false) => {
      const now = Date.now();
      if (!force && now - lastMemoryPersistRef.current < 1800) return;
      lastMemoryPersistRef.current = now;
      const snapshot: PersistentLessonResume = {
        id: lesson.id,
        title: lesson.title,
        module: lesson.module,
        text: lesson.text,
        voiceId: stateRef.current.voiceId,
        domainId: lesson.domainId,
        subtitle: lesson.subtitle,
        currentTime: Math.max(0, posSeconds),
        duration: Math.max(0, totalSeconds),
        updatedAt: now,
      };
      setResumableLesson(snapshot);
      saveAudioMemoryState({ lastLesson: snapshot });
    },
    []
  );

  const markLessonCompletedInMemory = useCallback((lessonId: string) => {
    setListenedLessonIds((prev) => {
      if (prev.includes(lessonId)) return prev;
      const next = [lessonId, ...prev].slice(0, 500);
      saveAudioMemoryState({ listenedLessonIds: next });
      return next;
    });
  }, []);

  const updateMediaSession = useCallback(
    (lesson: AudioLessonItem, playing: boolean, cur = 0, dur = 0) => {
      if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
      try {
        const activeVoice = ELEVENLABS_VOICES.find((v) => v.id === stateRef.current.voiceId);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: lesson.title,
          artist: `${activeVoice?.name || "CloudMaster"} · Google Gemini 3.8 Neural Studio`,
          album: lesson.module,
          artwork: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          ],
        });
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
        if (dur > 0 && "setPositionState" in navigator.mediaSession) {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: stateRef.current.playbackRate,
            position: Math.min(cur, dur),
          });
        }
      } catch {
        // MediaSession unsupported
      }
    },
    []
  );

  const playWithSpeechFallback = useCallback(
    (lesson: AudioLessonItem, cleanedText: string, onAdvance: () => void) => {
      setAudioSource("browser-fallback");
      const wordCount = Math.max(1, cleanedText.split(/\s+/).length);
      const estimatedSeconds = Math.max(3, Math.round(wordCount / 2.5 / stateRef.current.playbackRate));
      setDuration(estimatedSeconds);
      setCurrentTime(0);
      setIsLoading(false);
      setIsPlaying(true);
      updateMediaSession(lesson, true, 0, estimatedSeconds);
      persistResumeSnapshot(lesson, 0, estimatedSeconds, true);

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = stateRef.current.playbackRate;
      utterance.pitch = stateRef.current.pitch || 1.0;
      utterance.volume = stateRef.current.volume;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Natural") || v.name.includes("Google"))) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      const startedAt = Date.now();
      fallbackTimerRef.current = window.setInterval(() => {
        const elapsed = Math.min(estimatedSeconds, (Date.now() - startedAt) / 1000);
        setCurrentTime(elapsed);
        persistResumeSnapshot(lesson, elapsed, estimatedSeconds);
      }, 400);

      utterance.onend = () => {
        if (fallbackTimerRef.current !== null) {
          window.clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setCurrentTime(estimatedSeconds);
        setIsPlaying(false);
        markLessonCompletedInMemory(lesson.id);
        persistResumeSnapshot(lesson, 0, estimatedSeconds, true);
        onAdvance();
      };

      utterance.onerror = () => {
        if (fallbackTimerRef.current !== null) {
          window.clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [markLessonCompletedInMemory, persistResumeSnapshot, updateMediaSession]
  );

  const attachAndPlayBlob = useCallback(
    async (
      lesson: AudioLessonItem,
      blob: Blob,
      source: AudioPlaybackSource,
      startTime: number,
      onAdvance: () => void,
      fallbackText?: string
    ) => {
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audio.playbackRate = stateRef.current.playbackRate;
      audio.volume = stateRef.current.volume;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        const dur = isFinite(audio.duration) ? audio.duration : 0;
        setDuration(dur);
        if (startTime > 0 && startTime < Math.max(0, dur - 1)) {
          audio.currentTime = startTime;
          setCurrentTime(startTime);
        } else {
          setCurrentTime(0);
        }
        persistResumeSnapshot(lesson, audio.currentTime, dur, true);
        updateMediaSession(lesson, true, audio.currentTime, dur);
      };

      audio.ontimeupdate = () => {
        const cur = audio.currentTime || 0;
        const dur = isFinite(audio.duration) ? audio.duration : 0;
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
        persistResumeSnapshot(lesson, cur, dur);
      };

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setAudioSource(source);
        updateMediaSession(lesson, true, audio.currentTime, isFinite(audio.duration) ? audio.duration : 0);
      };

      audio.onpause = () => {
        setIsPlaying(false);
        const cur = audio.currentTime || 0;
        const dur = isFinite(audio.duration) ? audio.duration : 0;
        persistResumeSnapshot(lesson, cur, dur, true);
        updateMediaSession(lesson, false, cur, dur);
      };

      audio.onended = () => {
        setIsPlaying(false);
        const dur = isFinite(audio.duration) ? audio.duration : 0;
        setCurrentTime(dur);
        markLessonCompletedInMemory(lesson.id);
        persistResumeSnapshot(lesson, 0, dur, true);
        onAdvance();
      };

      audio.onerror = () => {
        if (fallbackText) {
          playWithSpeechFallback(lesson, fallbackText, onAdvance);
        } else {
          setIsLoading(false);
          setIsPlaying(false);
        }
      };

      await audio.play();
    },
    [markLessonCompletedInMemory, persistResumeSnapshot, playWithSpeechFallback, updateMediaSession]
  );

  const playInternalLesson = useCallback(
    async (lesson: AudioLessonItem, startTime = 0, activeQueue?: AudioLessonItem[], activeIdx?: number) => {
      cleanupCurrentAudio();
      setIsPlayerDismissed(false);
      setCurrentLesson(lesson);
      if (activeQueue) setQueue(activeQueue);
      if (typeof activeIdx === "number") setQueueIndex(activeIdx);

      const cleanedText = cleanTextForSpeech(lesson.text);
      if (!cleanedText) return;

      setIsLoading(true);
      const targetVoice = stateRef.current.voiceId;

      const handleAutoAdvance = () => {
        const { autoPlayNext: auto, queue: q, queueIndex: idx } = stateRef.current;
        if (auto && q.length > 1 && idx + 1 < q.length) {
          const nextIdx = idx + 1;
          playInternalLesson(q[nextIdx], 0, q, nextIdx);
        }
      };

      try {
        // 1. Check client IndexedDB persistent audio vault first
        let blob = await getCachedAudioBlob(cleanedText, targetVoice);
        let source: AudioPlaybackSource = "indexeddb-cache";

        if (blob) {
          touchCachedAudioPlayed(cleanedText, targetVoice);
        } else {
          // 2. Fetch via Unified Neural Audio Proxy (Google Gemini 3.8 Neural HD / ElevenLabs + Cloudflare Edge headers)
          const response = await fetch("/api/audio/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: cleanedText,
              voiceId: targetVoice,
            }),
          });

          if (!response.ok) {
            throw new Error(`TTS unavailable (${response.status})`);
          }

          const engineHeader = response.headers.get("X-Audio-Engine") || "";
          blob = await response.blob();
          source = engineHeader.includes("elevenlabs") ? "elevenlabs-api" : "gemini-neural";

          saveCachedAudioBlob(cleanedText, targetVoice, blob, {
            lessonId: lesson.id,
            title: lesson.title,
            module: lesson.module,
            domainId: lesson.domainId,
            mimeType: blob.type || (source === "gemini-neural" ? "audio/wav" : "audio/mpeg"),
            engine: engineHeader || source,
          }).then(() => {
            refreshAudioLibrary();
          });
        }

        await attachAndPlayBlob(lesson, blob, source, startTime, handleAutoAdvance, cleanedText);
      } catch {
        playWithSpeechFallback(lesson, cleanedText, handleAutoAdvance);
      }
    },
    [attachAndPlayBlob, cleanupCurrentAudio, playWithSpeechFallback, refreshAudioLibrary]
  );

  const playAudioBlob = useCallback(
    async (lesson: AudioLessonItem, blob: Blob, sourceLabel: AudioPlaybackSource = "gemini-podcast") => {
      cleanupCurrentAudio();
      setIsPlayerDismissed(false);
      setCurrentLesson(lesson);
      setQueue([lesson]);
      setQueueIndex(0);
      setIsLoading(true);

      const cleanedText = cleanTextForSpeech(lesson.text);
      saveCachedAudioBlob(cleanedText || lesson.title, stateRef.current.voiceId, blob, {
        lessonId: lesson.id,
        title: lesson.title,
        module: lesson.module,
        domainId: lesson.domainId,
        mimeType: blob.type || "audio/wav",
        engine: sourceLabel || "gemini-podcast",
      }).then(() => refreshAudioLibrary());

      try {
        await attachAndPlayBlob(lesson, blob, sourceLabel, 0, () => {}, cleanedText);
      } catch {
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [attachAndPlayBlob, cleanupCurrentAudio, refreshAudioLibrary]
  );

  const togglePlayPause = useCallback(() => {
    triggerHaptic("light");
    const lesson = stateRef.current.currentLesson;
    if (!lesson) return;

    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      return;
    }

    if (isPlaying) {
      cleanupCurrentAudio();
      setIsPlaying(false);
    } else {
      playInternalLesson(lesson, stateRef.current.currentTime);
    }
  }, [cleanupCurrentAudio, isPlaying, playInternalLesson]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      cleanupCurrentAudio();
      setIsPlaying(false);
    }
  }, [cleanupCurrentAudio]);

  const stopAudio = useCallback(() => {
    cleanupCurrentAudio();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
    if (stateRef.current.currentLesson) {
      persistResumeSnapshot(stateRef.current.currentLesson, 0, stateRef.current.duration, true);
    }
  }, [cleanupCurrentAudio, persistResumeSnapshot]);

  const playLesson = useCallback(
    async (lesson: AudioLessonItem, options?: { startTime?: number; toggleIfSame?: boolean }) => {
      triggerHaptic("light");
      const sameLesson = stateRef.current.currentLesson?.id === lesson.id;
      if (options?.toggleIfSame && sameLesson && (isPlaying || isLoading)) {
        if (audioRef.current) {
          audioRef.current.pause();
        } else {
          stopAudio();
        }
        return;
      }
      if (options?.toggleIfSame && sameLesson && audioRef.current && audioRef.current.paused) {
        await audioRef.current.play().catch(() => {});
        return;
      }
      await playInternalLesson(lesson, options?.startTime ?? 0, [lesson], 0);
    },
    [isLoading, isPlaying, playInternalLesson, stopAudio]
  );

  const playQueue = useCallback(
    async (lessons: AudioLessonItem[], startIndex = 0) => {
      if (!lessons.length) return;
      triggerHaptic("medium");
      const safeIdx = Math.max(0, Math.min(startIndex, lessons.length - 1));
      await playInternalLesson(lessons[safeIdx], 0, lessons, safeIdx);
    },
    [playInternalLesson]
  );

  const playCachedRecord = useCallback(
    async (record: { key: string; title: string; module: string; text?: string; textPreview?: string; domainId?: string; lessonId?: string }) => {
      triggerHaptic("light");
      const cached = await getCachedAudioBlobByKey(record.key);
      if (cached?.blob) {
        const item: AudioLessonItem = {
          id: cached.record.lessonId || cached.record.key,
          title: cached.record.title,
          module: cached.record.module,
          domainId: cached.record.domainId,
          text: cached.record.text || cached.record.textPreview,
        };
        await playAudioBlob(item, cached.blob, "indexeddb-cache");
      } else {
        const item: AudioLessonItem = {
          id: record.lessonId || record.key,
          title: record.title,
          module: record.module,
          domainId: record.domainId,
          text: record.text || record.textPreview || record.title,
        };
        await playLesson(item);
      }
    },
    [playAudioBlob, playLesson]
  );

  const previewVoice = useCallback(
    async (vId: string) => {
      triggerHaptic("light");
      const target = ELEVENLABS_VOICES.find((v) => v.id === vId) || ELEVENLABS_VOICES[0];
      const previewText = `Hello, I'm ${target.name}, your ${target.role}. Ready for your AWS training.`;

      const previewLesson: AudioLessonItem = {
        id: `voice-preview-${target.id}`,
        title: `${target.name} · Voice Sample`,
        module: "Voice Audition",
        text: previewText,
      };

      setVoiceIdState(target.id);
      saveAudioMemoryState({ voiceId: target.id });

      try {
        const res = await fetch("/api/audio/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: previewText,
            voiceId: target.id,
          }),
        });
        if (res.ok) {
          const blob = await res.blob();
          await playAudioBlob(previewLesson, blob, "elevenlabs-api");
          return;
        }
      } catch {}

      playWithSpeechFallback(previewLesson, previewText, () => {});
    },
    [playAudioBlob, playWithSpeechFallback]
  );

  const resumeLastLesson = useCallback(async () => {
    const resume = resumableLesson;
    if (!resume) return;
    triggerHaptic("light");
    const item: AudioLessonItem = {
      id: resume.id,
      title: resume.title,
      module: resume.module,
      text: resume.text,
      domainId: resume.domainId,
      subtitle: resume.subtitle,
    };
    const startAt = resume.duration > 3 && resume.currentTime < resume.duration - 2 ? resume.currentTime : 0;
    await playInternalLesson(item, startAt, [item], 0);
  }, [playInternalLesson, resumableLesson]);

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, stateRef.current.duration || seconds));
      setCurrentTime(clamped);
      if (audioRef.current && isFinite(audioRef.current.duration)) {
        audioRef.current.currentTime = clamped;
      }
      if (stateRef.current.currentLesson) {
        persistResumeSnapshot(stateRef.current.currentLesson, clamped, stateRef.current.duration, true);
      }
    },
    [persistResumeSnapshot]
  );

  const skipBy = useCallback(
    (deltaSeconds: number) => {
      triggerHaptic("light");
      seekTo(stateRef.current.currentTime + deltaSeconds);
    },
    [seekTo]
  );

  const skipNext = useCallback(() => {
    const { queue: q, queueIndex: idx } = stateRef.current;
    if (idx + 1 < q.length) {
      triggerHaptic("light");
      playInternalLesson(q[idx + 1], 0, q, idx + 1);
    }
  }, [playInternalLesson]);

  const skipPrev = useCallback(() => {
    const { queue: q, queueIndex: idx, currentTime: cur } = stateRef.current;
    if (cur > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (idx > 0) {
      triggerHaptic("light");
      playInternalLesson(q[idx - 1], 0, q, idx - 1);
    }
  }, [playInternalLesson]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
      navigator.mediaSession.setActionHandler("pause", () => pauseAudio());
      navigator.mediaSession.setActionHandler("nexttrack", () => skipNext());
      navigator.mediaSession.setActionHandler("previoustrack", () => skipPrev());
      navigator.mediaSession.setActionHandler("seekbackward", (d) =>
        seekTo(stateRef.current.currentTime - (d?.seekOffset || 15))
      );
      navigator.mediaSession.setActionHandler("seekforward", (d) =>
        seekTo(stateRef.current.currentTime + (d?.seekOffset || 15))
      );
    } catch {
      // ignore unsupported MediaSession actions
    }
  }, [pauseAudio, seekTo, skipNext, skipPrev, togglePlayPause]);

  const setVoiceId = useCallback((id: string) => {
    setVoiceIdState(id);
    saveAudioMemoryState({ voiceId: id });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const clamped = Math.min(2.0, Math.max(0.75, rate));
    setPlaybackRateState(clamped);
    if (audioRef.current) {
      audioRef.current.playbackRate = clamped;
    }
    saveAudioMemoryState({ playbackRate: clamped });
  }, []);

  const setPitch = useCallback((newPitch: number) => {
    const clamped = Math.max(0.6, Math.min(1.5, Number(newPitch.toFixed(2))));
    setPitchState(clamped);
    saveAudioMemoryState({ pitch: clamped });
    triggerHaptic("light");
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.min(1.0, Math.max(0.0, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    saveAudioMemoryState({ volume: clamped });
  }, []);

  const setAutoPlayNext = useCallback((auto: boolean) => {
    setAutoPlayNextState(auto);
    saveAudioMemoryState({ autoPlayNext: auto });
  }, []);

  const setAmbientMode = useCallback((mode: AmbientSoundscapeMode) => {
    triggerHaptic("light");
    setAmbientModeState(mode);
    ambientAudioEngine.setMode(mode);
  }, []);

  const setAmbientVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setAmbientVolumeState(clamped);
    ambientAudioEngine.setVolume(clamped);
  }, []);

  const setSleepTimerMinutes = useCallback((minutes: number | null) => {
    triggerHaptic("light");
    setSleepTimerMinutesState(minutes);
    setSleepSecondsRemaining(minutes ? minutes * 60 : null);
  }, []);

  const precacheLessons = useCallback(
    async (lessons: AudioLessonItem[], label = "Lesson Deck") => {
      const targetVoice = stateRef.current.voiceId;
      let cached = 0;
      let skipped = 0;
      let failed = 0;

      setPrecacheProgress({ active: true, done: 0, total: lessons.length, label });

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const cleaned = cleanTextForSpeech(lesson.text);
        if (!cleaned) {
          skipped++;
          setPrecacheProgress({ active: true, done: i + 1, total: lessons.length, label });
          continue;
        }

        const existing = await getCachedAudioBlob(cleaned, targetVoice);
        if (existing) {
          skipped++;
          setPrecacheProgress({ active: true, done: i + 1, total: lessons.length, label });
          continue;
        }

        try {
          const response = await fetch("/api/audio/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleaned, voiceId: targetVoice }),
          });
          if (!response.ok) {
            failed++;
            if (response.status === 400 || response.status === 401) {
              setPrecacheProgress({ active: false, done: i + 1, total: lessons.length, label });
              await refreshAudioLibrary();
              return { cached, skipped, failed };
            }
          } else {
            const blob = await response.blob();
            await saveCachedAudioBlob(cleaned, targetVoice, blob, {
              lessonId: lesson.id,
              title: lesson.title,
              module: lesson.module,
              domainId: lesson.domainId,
              mimeType: blob.type || "audio/wav",
              engine: response.headers.get("X-Audio-Engine") || "gemini-neural",
            });
            cached++;
          }
        } catch {
          failed++;
        }

        setPrecacheProgress({ active: true, done: i + 1, total: lessons.length, label });
      }

      setPrecacheProgress(null);
      await refreshAudioLibrary();
      return { cached, skipped, failed };
    },
    [refreshAudioLibrary]
  );

  const removeCachedLesson = useCallback(
    async (cacheKey: string) => {
      await deleteCachedLesson(cacheKey);
      await refreshAudioLibrary();
    },
    [refreshAudioLibrary]
  );

  const clearAllAudioCache = useCallback(async () => {
    await clearAudioCache();
    await refreshAudioLibrary();
  }, [refreshAudioLibrary]);

  return (
    <AudioLessonContext.Provider
      value={{
        currentLesson,
        queue,
        queueIndex,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        audioSource,
        voiceId,
        playbackRate,
        pitch,
        volume,
        autoPlayNext,
        ambientMode,
        ambientVolume,
        sleepTimerMinutes,
        sleepSecondsRemaining,
        listenedLessonIds,
        resumableLesson,
        cachedLessons,
        cacheStats,
        serverStatus,
        isDrawerOpen,
        isTourModalOpen,
        isPlayerDismissed,
        precacheProgress,
        setIsDrawerOpen,
        setIsTourModalOpen,
        setIsPlayerDismissed,
        playLesson,
        playAudioBlob,
        playCachedRecord,
        playQueue,
        previewVoice,
        resumeLastLesson,
        togglePlayPause,
        pauseAudio,
        stopAudio,
        seekTo,
        skipBy,
        skipNext,
        skipPrev,
        setVoiceId,
        setPlaybackRate,
        setPitch,
        setVolume,
        setAutoPlayNext,
        setAmbientMode,
        setAmbientVolume,
        setSleepTimerMinutes,
        precacheLessons,
        removeCachedLesson,
        clearAllAudioCache,
        refreshAudioLibrary,
      }}
    >
      {children}
    </AudioLessonContext.Provider>
  );
};

export function useAudioLesson(): AudioLessonContextValue {
  const ctx = useContext(AudioLessonContext);
  if (!ctx) {
    throw new Error("useAudioLesson must be used inside <AudioLessonProvider>");
  }
  return ctx;
}
