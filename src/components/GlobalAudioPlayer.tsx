import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  X,
  Volume2,
  Trash2,
  ListMusic,
  Loader2,
  CheckCircle2,
  Radio,
  HardDrive,
  RotateCcw,
  RotateCw,
  Moon,
  CloudRain,
  Waves,
  Brain,
  Compass,
} from "lucide-react";
import {
  useAudioLesson,
  ELEVENLABS_VOICES,
  AudioLessonItem,
} from "../contexts/AudioLessonContext";
import { AmbientSoundscapeMode } from "../services/ambientAudioService";
import { triggerHaptic } from "../utils/haptics";

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const GlobalAudioPlayer: React.FC = () => {
  const {
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
    cachedLessons,
    cacheStats,
    serverStatus,
    isDrawerOpen,
    isPlayerDismissed,
    precacheProgress,
    setIsDrawerOpen,
    setIsTourModalOpen,
    setIsPlayerDismissed,
    playLesson,
    playCachedRecord,
    previewVoice,
    togglePlayPause,
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
    removeCachedLesson,
    clearAllAudioCache,
  } = useAudioLesson();

  const [libraryFilter, setLibraryFilter] = useState("");

  const activeVoice =
    ELEVENLABS_VOICES.find((v) => v.id === voiceId) || ELEVENLABS_VOICES[0];

  const progressPct =
    duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  const speedOptions = [0.85, 1.0, 1.25, 1.5, 1.75];
  const cycleSpeed = () => {
    triggerHaptic("light");
    const idx = speedOptions.findIndex((s) => Math.abs(s - playbackRate) < 0.05);
    const next = speedOptions[(idx + 1) % speedOptions.length];
    setPlaybackRate(next);
  };

  const handlePlayFromMemory = (record: (typeof cachedLessons)[number]) => {
    playCachedRecord(record);
  };

  const filteredCached = cachedLessons.filter((item) => {
    if (!libraryFilter.trim()) return true;
    const q = libraryFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.module.toLowerCase().includes(q) ||
      item.textPreview.toLowerCase().includes(q)
    );
  });

  const engineLabel =
    audioSource === "gemini-podcast"
      ? "Google Gemini 3.8 Dual-Host Podcast"
      : audioSource === "gemini-neural"
      ? "Google Gemini 3.8 Neural HD"
      : audioSource === "elevenlabs-api"
      ? "ElevenLabs Studio HD"
      : audioSource === "indexeddb-cache"
      ? "Instant Offline Audio Vault"
      : audioSource === "browser-fallback"
      ? "Device Speech Fallback"
      : serverStatus?.geminiAudioConfigured
      ? "Google Gemini 3.8 Neural HD Active"
      : "Studio Audio Ready";

  return (
    <>
      {/* Background Pre-Cache Progress Pill */}
      {precacheProgress?.active && (
        <div className="fixed top-16 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3 text-xs animate-fade-in">
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              Caching {precacheProgress.label}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {precacheProgress.done} of {precacheProgress.total} lessons stored offline
            </div>
          </div>
        </div>
      )}

      {/* Compact Apple-Style Frosted Mini-Player */}
      {currentLesson && !isPlayerDismissed && (
        <div
          role="region"
          aria-label="Lesson Audio Player"
          className="fixed bottom-[calc(4.15rem+env(safe-area-inset-bottom))] md:bottom-5 left-3 right-3 md:left-auto md:right-6 md:w-[440px] z-30 bg-white/92 dark:bg-slate-900/94 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700/70 rounded-2xl shadow-xl overflow-hidden transition-all"
        >
          {/* Interactive Progress Track */}
          <div
            onClick={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seekTo(ratio * duration);
            }}
            className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-800 cursor-pointer relative"
            title="Seek audio position"
          >
            <div
              className="h-full bg-amber-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="px-3 py-2 flex items-center gap-2">
            {/* Play / Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              aria-label={isPlaying ? "Pause lesson audio" : "Play lesson audio"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Lesson Title + Live Waveform */}
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsDrawerOpen(true);
              }}
              className="flex-1 min-w-0 text-left cursor-pointer group"
              title="Open Audio Studio & Offline Library"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                {isPlaying && (
                  <span className="inline-flex items-end gap-0.5 h-3 shrink-0">
                    <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-0.5 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "140ms" }} />
                    <span className="w-0.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "280ms" }} />
                  </span>
                )}
                <span className="truncate">{currentLesson.title}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 tabular-nums">
                <span>{currentLesson.module}</span>
                {duration > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Transport & Studio Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => skipBy(-15)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                aria-label="Rewind 15 seconds"
                title="Back 15s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => skipBy(15)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                aria-label="Forward 15 seconds"
                title="Forward 15s"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={cycleSpeed}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setIsDrawerOpen(true);
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Open Audio Studio"
                title="Audio Studio, Ambience & Offline Library"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  stopAudio();
                  setIsPlayerDismissed(true);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Dismiss mini player"
                title="Dismiss player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Apple-Grade Audio Studio & Offline Library Sheet */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    Audio Study Studio & Memory
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {engineLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{cacheStats.count} offline clips</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(cacheStats.sizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsTourModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#FF9900] text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI Tour & Podcasts</span>
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  aria-label="Close Audio Studio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Active Scrubber */}
              {currentLesson ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-white space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        <span>
                          {currentLesson.module} · {engineLabel}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1 leading-snug">
                        {currentLesson.title}
                      </h4>
                    </div>
                  </div>

                  {/* Scrub Bar */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, duration || 1)}
                      step={0.5}
                      value={Math.min(currentTime, duration || 1)}
                      onChange={(e) => seekTo(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                      aria-label="Audio scrubber"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Primary Transport Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={cycleSpeed}
                      className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white tabular-nums cursor-pointer"
                    >
                      {playbackRate}x
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={skipPrev}
                        disabled={queueIndex === 0 && currentTime < 3}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        aria-label="Previous track"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => skipBy(-15)}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
                        aria-label="Rewind 15 seconds"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={togglePlayPause}
                        className="min-h-[48px] min-w-[48px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => skipBy(15)}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
                        aria-label="Forward 15 seconds"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={skipNext}
                        disabled={queueIndex >= queue.length - 1}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        aria-label="Next track"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-14 accent-amber-500 cursor-pointer"
                        aria-label="Volume"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Google Gemini 3.8 Neural Audio Ready
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Tap Listen on any Flashcard, Blueprint Chapter, AI Tutor message, or launch the AI Audio Tour & Dual-Host Podcast Studio.
                  </p>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsTourModalOpen(true);
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-[#FF9900] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Launch AI Audio Tour</span>
                  </button>
                </div>
              )}

              {/* Focus Ambience & Sleep Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Focus Soundscape</span>
                    {ambientMode !== "off" && (
                      <input
                        type="range"
                        min={0.05}
                        max={0.8}
                        step={0.05}
                        value={ambientVolume}
                        onChange={(e) => setAmbientVolume(Number(e.target.value))}
                        className="w-16 accent-amber-500 cursor-pointer"
                        aria-label="Ambience volume"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "off", label: "Off", icon: <Volume2 className="w-3 h-3" /> },
                        { id: "rain", label: "Soft Rain", icon: <CloudRain className="w-3 h-3" /> },
                        { id: "focus", label: "Deep Focus", icon: <Waves className="w-3 h-3" /> },
                        { id: "alpha", label: "Alpha Wave", icon: <Brain className="w-3 h-3" /> },
                      ] as Array<{ id: AmbientSoundscapeMode; label: string; icon: React.ReactNode }>
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAmbientMode(item.id)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                          ambientMode === item.id
                            ? "bg-amber-500 text-slate-950 border-amber-500"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-amber-500" />
                      Sleep Timer
                    </span>
                    {sleepSecondsRemaining !== null && (
                      <span className="text-[11px] font-mono text-amber-500">
                        {formatTime(sleepSecondsRemaining)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[null, 10, 20, 30].map((mins) => (
                      <button
                        key={String(mins)}
                        type="button"
                        onClick={() => setSleepTimerMinutes(mins)}
                        className={`py-2 rounded-xl text-[11px] font-bold cursor-pointer border transition-colors ${
                          sleepTimerMinutes === mins
                            ? "bg-amber-500 text-slate-950 border-amber-500"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {mins === null ? "Off" : `${mins}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Playback Preferences: Auto-Advance & Voice Pitch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Auto-Advance Playlist
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Automatically play next lesson in queue
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPlayNext}
                    aria-label="Toggle auto-advance playlist"
                    onClick={() => {
                      triggerHaptic("light");
                      setAutoPlayNext(!autoPlayNext);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      autoPlayNext ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                        autoPlayNext ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Voice Pitch</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                        {pitch.toFixed(2)}x
                      </span>
                      {Math.abs(pitch - 1.0) > 0.01 && (
                        <button
                          type="button"
                          onClick={() => setPitch(1.0)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.5}
                    step={0.05}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                    aria-label="Voice Pitch"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
                    <span>Deeper (0.6x)</span>
                    <span>Natural (1.0x)</span>
                    <span>Brighter (1.5x)</span>
                  </div>
                </div>
              </div>

              {/* Narrator Voice Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Studio Neural Narrator ({ELEVENLABS_VOICES.length} Voices)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tap Play icon to audition
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ELEVENLABS_VOICES.map((voice) => {
                    const selected = voice.id === voiceId;
                    return (
                      <div
                        key={voice.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 min-h-[52px] ${
                          selected
                            ? "bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white"
                            : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setVoiceId(voice.id);
                          }}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{voice.name}</span>
                            <span className="text-[10px] font-mono text-amber-500">· {voice.geminiVoice}</span>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {voice.role} · {voice.style}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => previewVoice(voice.id)}
                          className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          title={`Audition ${voice.name}`}
                          aria-label={`Audition ${voice.name}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Queue */}
              {queue.length > 1 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Up Next in Commute Queue</span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      Track {queueIndex + 1} of {queue.length}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {queue.map((item, idx) => {
                      const active = idx === queueIndex;
                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          onClick={() => playLesson(item)}
                          className={`w-full px-3 py-2 rounded-xl border text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            active
                              ? "bg-amber-500/10 border-amber-500/50 text-slate-900 dark:text-white font-semibold"
                              : "bg-white dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="truncate">
                            {idx + 1}. {item.title}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">{item.module}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Persistent IndexedDB Cached Audio Memory Library */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Offline Audio Vault ({cachedLessons.length} saved · {listenedLessonIds.length} completed)
                    </span>
                  </div>

                  {cachedLessons.length > 0 && (
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        clearAllAudioCache();
                      }}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline self-start sm:self-auto cursor-pointer"
                    >
                      Clear Offline Vault
                    </button>
                  )}
                </div>

                {cachedLessons.length > 0 && (
                  <input
                    type="text"
                    placeholder="Filter saved audio lessons..."
                    value={libraryFilter}
                    onChange={(e) => setLibraryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                )}

                {filteredCached.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
                    {cachedLessons.length === 0
                      ? "No offline neural audio clips saved yet. Play any lesson, AI Tour stop, or Dual-Host Podcast to cache it automatically."
                      : "No cached lessons match your filter."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredCached.map((rec) => {
                      const isCurrent = currentLesson?.id === (rec.lessonId || rec.key);
                      const vName = ELEVENLABS_VOICES.find((v) => v.id === rec.voiceId)?.name || "Studio";
                      return (
                        <div
                          key={rec.key}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isCurrent
                              ? "bg-amber-500/10 border-amber-500/50"
                              : "bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <button
                            onClick={() => handlePlayFromMemory(rec)}
                            className="flex-1 min-w-0 text-left flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {rec.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                                {rec.module} · {vName} · {formatBytes(rec.sizeBytes)}
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => removeCachedLesson(rec.key)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                            title="Delete cached lesson"
                            aria-label={`Delete ${rec.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
