import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Headphones,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  Layers,
  Users,
} from "lucide-react";
import { useAgentWorkforce } from "../contexts/AgentWorkforceContext";
import { useAudioLesson } from "../contexts/AudioLessonContext";
import { AWS_SIX_PILLARS, WORKFORCE_AGENTS, AwsPillarId } from "../types/workforce";
import { triggerHaptic } from "../utils/haptics";

interface MobileAgentBubblesProps {
  onNavigateToTab: (tabKey: string) => void;
  onOpenConfidenceHub: () => void;
}

export const MobileAgentBubbles: React.FC<MobileAgentBubblesProps> = ({
  onNavigateToTab,
  onOpenConfidenceHub,
}) => {
  const {
    memory,
    activeCertTrack,
    setActiveCertTrack,
    activeBubble,
    isMeshSheetOpen,
    setIsMeshSheetOpen,
    dismissBubble,
    snoozeBubbles,
    toggleMuteBubbles,
    resolveHandoff,
    triggerPillarBubble,
    consultCouncil,
    isConsulting,
  } = useAgentWorkforce();

  const { playLesson, currentLesson, isPlaying } = useAudioLesson();
  const [councilInput, setCouncilInput] = useState("");
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);

  const isMuted = memory.bubblePreferences.muted;
  const isSnoozed = Boolean(memory.bubblePreferences.snoozeUntil && Date.now() < memory.bubblePreferences.snoozeUntil);
  const activeHandoffCount = memory.handoffs.filter((h) => !h.resolved).length;

  const handleBubbleAction = (tabKey: string) => {
    triggerHaptic("light");
    dismissBubble();
    if (tabKey === "confidence-hub") {
      onOpenConfidenceHub();
    } else {
      onNavigateToTab(tabKey);
    }
  };

  const handlePlayBubbleAudio = () => {
    if (!activeBubble) return;
    triggerHaptic("light");
    const agent = WORKFORCE_AGENTS[activeBubble.agentId];
    playLesson(
      {
        id: activeBubble.id,
        title: activeBubble.headline,
        module: `${agent.name} · ${activeBubble.certTrack}`,
        text: activeBubble.audioScript,
      },
      { toggleIfSame: true }
    );
  };

  const handleAskCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilInput.trim() || isConsulting) return;
    triggerHaptic("light");
    const q = councilInput.trim();
    setCouncilInput("");
    const res = await consultCouncil(q);
    setLastAnswer(res.councilAnswer);
  };

  return (
    <>
      {/* Smart Contextual Virtual Pop-Up Bubble (Thumb-Zone Floating Card, Non-Intrusive) */}
      <AnimatePresence>
        {activeBubble && !isMeshSheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed left-3 right-3 sm:left-auto sm:right-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-20 z-30 sm:w-[390px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4"
          >
            {(() => {
              const agent = WORKFORCE_AGENTS[activeBubble.agentId];
              const peer = activeBubble.handoffFromAgent ? WORKFORCE_AGENTS[activeBubble.handoffFromAgent] : null;
              const pillar = AWS_SIX_PILLARS.find((p) => p.id === activeBubble.pillar);
              const isThisSpeaking = isPlaying && currentLesson?.id === activeBubble.id;

              return (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${agent.accentColor} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {agent.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</span>
                          <span aria-hidden="true">·</span>
                          <span>{pillar?.shortName} Pillar</span>
                          {peer && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">Sync w/ {peer.name}</span>
                            </>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                          {activeBubble.headline}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={dismissBubble}
                      className="min-w-[36px] min-h-[36px] -mt-1 -mr-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      aria-label="Dismiss coaching bubble"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeBubble.message}
                  </p>

                  {/* Thumb-friendly 44px touch targets */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handlePlayBubbleAudio}
                      className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isThisSpeaking
                          ? "bg-[#FF9900] text-slate-950"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Headphones className="w-4 h-4 shrink-0" />
                      <span>{isThisSpeaking ? "Playing" : "Listen"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBubbleAction(activeBubble.actionTab)}
                      className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      <span className="truncate">{activeBubble.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => snoozeBubbles(30)}
                      title="Snooze bubbles for 30 minutes"
                      aria-label="Snooze bubbles for 30 minutes"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Clock className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleMuteBubbles}
                      title="Mute coaching bubbles"
                      aria-label="Mute coaching bubbles"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Corner Trigger for the Live Agent Mesh Bottom Sheet */}
      {!activeBubble && !isMeshSheetOpen && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            setIsMeshSheetOpen(true);
          }}
          className="fixed right-3.5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-5 z-20 min-h-[44px] px-3.5 rounded-2xl bg-slate-900/92 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Open Cross-Aware AI Agent Workforce"
          title="Open Cross-Aware AI Agent Workforce & 6-Pillar Mesh"
        >
          <Users className="w-4 h-4 text-[#FF9900] shrink-0" />
          <span className="whitespace-nowrap">AI Mesh</span>
          {activeHandoffCount > 0 && !isMuted && (
            <span className="text-[11px] font-mono tabular-nums text-amber-400">
              {activeHandoffCount}
            </span>
          )}
        </button>
      )}

      {/* Apple-Style Live Cross-Aware Agent Workforce & 6-Pillar Bottom Sheet */}
      <AnimatePresence>
        {isMeshSheetOpen && (
          <div
            onClick={() => setIsMeshSheetOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-end md:items-center justify-center md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-2xl max-h-[88vh] bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag Handle + Header */}
              <div className="px-5 pt-3 pb-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Cross-Aware AI Agent Workforce
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      7 synced specialists · 6 AWS Well-Architected Pillars · {activeCertTrack}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleMuteBubbles}
                      className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        isMuted
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{isMuted ? "Muted" : isSnoozed ? "Snoozed" : "Nudges On"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMeshSheetOpen(false)}
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                      aria-label="Close Agent Workforce Sheet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Certification Track Switcher */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Active Certification Track
                  </span>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {(["CLF-C02", "SAA-C03"] as const).map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setActiveCertTrack(track);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          activeCertTrack === track
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 touch-scroll">
                {/* 1. Ask Coordinated Council */}
                <form onSubmit={handleAskCouncil} className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Ask the Connected Council (reads your live Pillar gaps &amp; recent answers)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={councilInput}
                      onChange={(e) => setCouncilInput(e.target.value)}
                      placeholder={`Ask Archie, Guardian & PennyWise about ${activeCertTrack}...`}
                      className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#FF9900]"
                    />
                    <button
                      type="submit"
                      disabled={isConsulting || !councilInput.trim()}
                      className="min-h-[44px] px-4 rounded-xl bg-[#FF9900] hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {isConsulting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Consult</span>
                    </button>
                  </div>
                  {lastAnswer && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {lastAnswer}
                    </div>
                  )}
                </form>

                {/* 2. All 6 AWS Well-Architected Pillars — Tap for Instant Audio Briefing */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#FF9900]" />
                      <span>6 AWS Well-Architected Pillars</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tap any pillar for a spoken briefing
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {AWS_SIX_PILLARS.map((pillar) => {
                      const stat = memory.pillarScores[pillar.id as AwsPillarId] || { score: 55, attempts: 0, correct: 0 };
                      const lead = WORKFORCE_AGENTS[pillar.leadAgent];
                      return (
                        <button
                          key={pillar.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setIsMeshSheetOpen(false);
                            triggerPillarBubble(pillar.id);
                          }}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] bg-white dark:bg-slate-950/60 text-left transition-colors cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {pillar.name}
                            </span>
                            <span className="text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                              {stat.score}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                stat.score >= 80 ? "bg-emerald-500" : stat.score >= 65 ? "bg-[#FF9900]" : "bg-rose-500"
                              }`}
                              style={{ width: `${stat.score}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Lead: {lead.name}</span>
                            <span className="text-[#FF9900] font-medium">Audio Nudge →</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Live Cross-Agent Handoff Feed */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF9900]" />
                      <span>Cross-Agent Memory Handoffs</span>
                    </h4>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {memory.handoffs.length} logged
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {memory.handoffs.slice(0, 6).map((h) => {
                      const from = WORKFORCE_AGENTS[h.fromAgent] || WORKFORCE_AGENTS.archie;
                      const to = WORKFORCE_AGENTS[h.toAgent] || WORKFORCE_AGENTS.guardian;
                      const pillar = AWS_SIX_PILLARS.find((p) => p.id === h.pillar);
                      return (
                        <div key={h.id} className="p-3 bg-white dark:bg-slate-950/50 flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{from.name} → {to.name}</span>
                              <span aria-hidden="true">·</span>
                              <span>{pillar?.shortName || h.pillar}</span>
                              <span aria-hidden="true">·</span>
                              <span>{h.certTrack}</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {h.summary}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!h.resolved ? (
                              <button
                                type="button"
                                onClick={() => {
                                  resolveHandoff(h.id);
                                  setIsMeshSheetOpen(false);
                                  onNavigateToTab(h.recommendedTab || "question-bank");
                                }}
                                className="min-h-[36px] px-2.5 rounded-lg bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                              >
                                Drill
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
