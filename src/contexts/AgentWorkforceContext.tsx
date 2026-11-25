import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  CertTrack,
  AwsPillarId,
  WorkforceAgentId,
  SharedAgentMemoryState,
  StudyMemoryEvent,
  AgentHandoff,
  SmartBubbleNotification,
  AWS_SIX_PILLARS,
  WORKFORCE_AGENTS,
} from "../types/workforce";
import { auth } from "../lib/firebase";

const STORAGE_KEY = "cloudmaster_agent_workforce_memory_v1";

const createInitialPillarScores = (): SharedAgentMemoryState["pillarScores"] => ({
  operational_excellence: { attempts: 0, correct: 0, score: 58 },
  security: { attempts: 0, correct: 0, score: 62 },
  reliability: { attempts: 0, correct: 0, score: 60 },
  performance_efficiency: { attempts: 0, correct: 0, score: 59 },
  cost_optimization: { attempts: 0, correct: 0, score: 61 },
  sustainability: { attempts: 0, correct: 0, score: 52 },
});

const createDefaultMemory = (): SharedAgentMemoryState => ({
  activeCertTrack: "CLF-C02",
  pillarScores: createInitialPillarScores(),
  weakConcepts: [],
  recentEvents: [],
  handoffs: [
    {
      id: "init-handoff-1",
      fromAgent: "archie",
      toAgent: "guardian",
      pillar: "security",
      certTrack: "CLF-C02",
      summary: "All 7 specialist agents are synchronized across the 6 AWS Well-Architected Pillars. Answer a question or explore a card to trigger live coaching.",
      recommendedTab: "question-bank",
      resolved: false,
      createdAt: new Date().toISOString(),
    },
  ],
  bubblePreferences: {
    muted: false,
    snoozeUntil: null,
    autoNarrate: false,
  },
  totalAudioLessonsCompleted: 0,
  avgReactionMs: 7400,
  lastSyncedAt: null,
});

export function inferPillarFromDomainOrTopic(domainId?: string, topic?: string): AwsPillarId {
  const hay = `${domainId || ""} ${topic || ""}`.toLowerCase();
  if (hay.includes("sustain") || hay.includes("carbon") || hay.includes("graviton") || hay.includes("green")) {
    return "sustainability";
  }
  if (hay.includes("cost") || hay.includes("billing") || hay.includes("pricing") || hay.includes("budget") || hay.includes("savings") || hay.includes("spot") || hay.includes("saa-cost")) {
    return "cost_optimization";
  }
  if (hay.includes("security") || hay.includes("iam") || hay.includes("kms") || hay.includes("waf") || hay.includes("shield") || hay.includes("guardduty") || hay.includes("saa-secure")) {
    return "security";
  }
  if (hay.includes("ops") || hay.includes("cloudformation") || hay.includes("config") || hay.includes("cloudwatch") || hay.includes("systems manager") || hay.includes("automation")) {
    return "operational_excellence";
  }
  if (hay.includes("perf") || hay.includes("cloudfront") || hay.includes("dax") || hay.includes("elasticache") || hay.includes("latency") || hay.includes("accelerator") || hay.includes("saa-performant")) {
    return "performance_efficiency";
  }
  return "reliability";
}

function getLeadAgentForPillar(pillar: AwsPillarId): WorkforceAgentId {
  const def = AWS_SIX_PILLARS.find((p) => p.id === pillar);
  return def ? def.leadAgent : "archie";
}

function getPeerHandoffAgent(lead: WorkforceAgentId, outcome: StudyMemoryEvent["outcome"]): WorkforceAgentId {
  if (outcome === "incorrect" || outcome === "review") {
    return lead === "trapmaster" ? "professor" : "trapmaster";
  }
  return lead === "professor" ? "archie" : "professor";
}

export interface CouncilConsultResponse {
  leadAgent: WorkforceAgentId;
  handoffToAgent: WorkforceAgentId;
  pillar: AwsPillarId;
  headline: string;
  councilAnswer: string;
  handoffSummary: string;
  audioScript: string;
  recommendedTab: string;
  fallback?: boolean;
}

interface AgentWorkforceContextValue {
  memory: SharedAgentMemoryState;
  activeCertTrack: CertTrack;
  setActiveCertTrack: (track: CertTrack) => void;
  activeBubble: SmartBubbleNotification | null;
  isMeshSheetOpen: boolean;
  setIsMeshSheetOpen: (open: boolean) => void;
  dispatchStudyEvent: (input: {
    sourceTab: string;
    pillar?: AwsPillarId;
    domainId?: string;
    topic: string;
    outcome: StudyMemoryEvent["outcome"];
    reactionMs?: number;
    certTrack?: CertTrack;
    customAudioScript?: string;
  }) => void;
  dismissBubble: () => void;
  snoozeBubbles: (minutes: number) => void;
  toggleMuteBubbles: () => void;
  resolveHandoff: (handoffId: string) => void;
  triggerPillarBubble: (pillar: AwsPillarId) => void;
  consultCouncil: (prompt: string) => Promise<CouncilConsultResponse>;
  isConsulting: boolean;
  isSyncingMemory: boolean;
}

const AgentWorkforceContext = createContext<AgentWorkforceContextValue | null>(null);

export const AgentWorkforceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memory, setMemory] = useState<SharedAgentMemoryState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...createDefaultMemory(),
          ...parsed,
          pillarScores: { ...createInitialPillarScores(), ...(parsed.pillarScores || {}) },
          bubblePreferences: { ...createDefaultMemory().bubblePreferences, ...(parsed.bubblePreferences || {}) },
        };
      }
    } catch {}
    return createDefaultMemory();
  });

  const [activeBubble, setActiveBubble] = useState<SmartBubbleNotification | null>(null);
  const [isMeshSheetOpen, setIsMeshSheetOpen] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [isSyncingMemory, setIsSyncingMemory] = useState(false);

  const lastBubbleShownAtRef = useRef<number>(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHandoffRef = useRef<AgentHandoff | null>(null);

  // Persist locally on every update (guaranteed offline fallback)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {}
  }, [memory]);

  // Load shared memory from PostgreSQL Cloud SQL when authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/workforce/memory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.memory) {
          setMemory((prev) => ({
            ...prev,
            activeCertTrack: (data.memory.activeCertTrack === "SAA-C03" ? "SAA-C03" : "CLF-C02") as CertTrack,
            pillarScores: { ...prev.pillarScores, ...(data.memory.pillarScores || {}) },
            weakConcepts: Array.isArray(data.memory.weakConcepts) && data.memory.weakConcepts.length > 0
              ? data.memory.weakConcepts
              : prev.weakConcepts,
            recentEvents: Array.isArray(data.memory.recentEvents) && data.memory.recentEvents.length > 0
              ? data.memory.recentEvents
              : prev.recentEvents,
            handoffs: Array.isArray(data.handoffs) && data.handoffs.length > 0 ? data.handoffs : prev.handoffs,
            bubblePreferences: { ...prev.bubblePreferences, ...(data.memory.bubblePreferences || {}) },
            lastSyncedAt: data.memory.lastSyncedAt || new Date().toISOString(),
          }));
        }
      } catch {
        // Offline local fallback remains authoritative
      }
    });
    return () => unsubscribe();
  }, []);

  const scheduleCloudSync = useCallback((nextMem: SharedAgentMemoryState, newHandoff?: AgentHandoff) => {
    if (newHandoff) pendingHandoffRef.current = newHandoff;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        setIsSyncingMemory(true);
        const token = await user.getIdToken();
        const handoffToSend = pendingHandoffRef.current;
        pendingHandoffRef.current = null;

        const res = await fetch("/api/workforce/memory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activeCertTrack: nextMem.activeCertTrack,
            pillarScores: nextMem.pillarScores,
            weakConcepts: nextMem.weakConcepts,
            recentEvents: nextMem.recentEvents.slice(0, 30),
            bubblePreferences: nextMem.bubblePreferences,
            newHandoff: handoffToSend || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.syncedAt) {
            setMemory((curr) => ({ ...curr, lastSyncedAt: data.syncedAt }));
          }
        }
      } catch {
        // Offline local persistence already succeeded
      } finally {
        setIsSyncingMemory(false);
      }
    }, 1200);
  }, []);

  const setActiveCertTrack = useCallback(
    (track: CertTrack) => {
      setMemory((prev) => {
        if (prev.activeCertTrack === track) return prev;
        const next: SharedAgentMemoryState = {
          ...prev,
          activeCertTrack: track,
        };
        scheduleCloudSync(next);
        return next;
      });
    },
    [scheduleCloudSync]
  );

  const canShowContextualBubble = useCallback((prefs: SharedAgentMemoryState["bubblePreferences"]) => {
    if (prefs.muted) return false;
    if (prefs.snoozeUntil && Date.now() < prefs.snoozeUntil) return false;
    // Gentle cooldown so mobile bubbles never feel spammy (minimum 18s between nudges)
    if (Date.now() - lastBubbleShownAtRef.current < 18000) return false;
    return true;
  }, []);

  const dispatchStudyEvent = useCallback(
    (input: {
      sourceTab: string;
      pillar?: AwsPillarId;
      domainId?: string;
      topic: string;
      outcome: StudyMemoryEvent["outcome"];
      reactionMs?: number;
      certTrack?: CertTrack;
      customAudioScript?: string;
    }) => {
      const pillar = input.pillar || inferPillarFromDomainOrTopic(input.domainId, input.topic);
      const track = input.certTrack || memory.activeCertTrack;
      const leadAgent = getLeadAgentForPillar(pillar);
      const peerAgent = getPeerHandoffAgent(leadAgent, input.outcome);
      const pillarDef = AWS_SIX_PILLARS.find((p) => p.id === pillar)!;
      const leadProfile = WORKFORCE_AGENTS[leadAgent];
      const peerProfile = WORKFORCE_AGENTS[peerAgent];

      const event: StudyMemoryEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        sourceTab: input.sourceTab,
        certTrack: track,
        pillar,
        domainId: input.domainId,
        topic: input.topic.slice(0, 120),
        outcome: input.outcome,
        reactionMs: input.reactionMs,
      };

      let createdHandoff: AgentHandoff | undefined;

      setMemory((prev) => {
        const currentStat = prev.pillarScores[pillar] || { attempts: 0, correct: 0, score: 55 };
        const isScored = input.outcome === "correct" || input.outcome === "incorrect" || input.outcome === "mastered" || input.outcome === "review";
        const isPositive = input.outcome === "correct" || input.outcome === "mastered";

        const nextAttempts = isScored ? currentStat.attempts + 1 : currentStat.attempts;
        const nextCorrect = isPositive ? currentStat.correct + 1 : currentStat.correct;

        let nextScore = currentStat.score;
        if (input.outcome === "correct" || input.outcome === "mastered") {
          nextScore = Math.min(100, Math.round(currentStat.score + (100 - currentStat.score) * 0.14 + 2));
        } else if (input.outcome === "incorrect" || input.outcome === "review") {
          nextScore = Math.max(20, currentStat.score - 5);
        } else if (input.outcome === "explored" || input.outcome === "audio") {
          nextScore = Math.min(100, currentStat.score + 2);
        }

        const weakConcepts = [...prev.weakConcepts];
        if ((input.outcome === "incorrect" || input.outcome === "review") && !weakConcepts.includes(input.topic)) {
          weakConcepts.unshift(input.topic);
        } else if (isPositive) {
          const idx = weakConcepts.indexOf(input.topic);
          if (idx >= 0) weakConcepts.splice(idx, 1);
        }

        const nextHandoffs = [...prev.handoffs];
        if (input.outcome === "incorrect" || input.outcome === "review") {
          createdHandoff = {
            id: `ho-${Date.now()}`,
            fromAgent: leadAgent,
            toAgent: peerAgent,
            pillar,
            certTrack: track,
            summary: `${leadProfile.name} flagged "${input.topic.slice(0, 56)}" (${pillarDef.shortName}) and handed off a targeted drill to ${peerProfile.name}.`,
            recommendedTab: input.sourceTab === "question-bank" ? "vault" : "question-bank",
            resolved: false,
            createdAt: new Date().toISOString(),
          };
          nextHandoffs.unshift(createdHandoff);
        }

        const nextAvgReaction =
          input.reactionMs && input.reactionMs > 400 && input.reactionMs < 60000
            ? Math.round(prev.avgReactionMs * 0.75 + input.reactionMs * 0.25)
            : prev.avgReactionMs;

        const nextState: SharedAgentMemoryState = {
          ...prev,
          pillarScores: {
            ...prev.pillarScores,
            [pillar]: { attempts: nextAttempts, correct: nextCorrect, score: nextScore },
          },
          weakConcepts: weakConcepts.slice(0, 20),
          recentEvents: [event, ...prev.recentEvents].slice(0, 40),
          handoffs: nextHandoffs.slice(0, 20),
          totalAudioLessonsCompleted:
            input.outcome === "audio" ? prev.totalAudioLessonsCompleted + 1 : prev.totalAudioLessonsCompleted,
          avgReactionMs: nextAvgReaction,
        };

        // Decide whether to pop a smart contextual virtual bubble
        if (canShowContextualBubble(prev.bubblePreferences)) {
          if (input.outcome === "incorrect" || input.outcome === "review") {
            lastBubbleShownAtRef.current = Date.now();
            setActiveBubble({
              id: `bub-${Date.now()}`,
              agentId: leadAgent,
              handoffFromAgent: peerAgent,
              pillar,
              certTrack: track,
              headline: `${leadProfile.name} spotted a ${pillarDef.shortName} gap`,
              message: `${pillarDef.designPrinciples[0]} is the anchor here. ${peerProfile.name} queued a quick ${track} reinforcement drill for you.`,
              audioScript:
                input.customAudioScript ||
                `${leadProfile.name} here on the ${pillarDef.name} Pillar. Remember ${pillarDef.designPrinciples[0]} and key services like ${pillarDef.keyServices.slice(0, 3).join(", ")}. Tap Drill This whenever you are ready.`,
              actionLabel: "Drill This Pillar",
              actionTab: "question-bank",
              createdAt: Date.now(),
            });
          } else if (isPositive && nextCorrect > 0 && nextCorrect % 3 === 0) {
            lastBubbleShownAtRef.current = Date.now();
            setActiveBubble({
              id: `bub-${Date.now()}`,
              agentId: leadAgent,
              pillar,
              certTrack: track,
              headline: `${pillarDef.shortName} Pillar leveled up to ${nextScore}%`,
              message: `Clean streak on ${track}. Your CMI-16 readiness projection just climbed—keep building momentum.`,
              audioScript:
                input.customAudioScript ||
                `Nice work! ${leadProfile.name} updated your ${pillarDef.name} Pillar to ${nextScore} percent inside your 16-area exam confidence projection.`,
              actionLabel: "Open CMI-16 Hub",
              actionTab: "confidence-hub",
              createdAt: Date.now(),
            });
          }
        }

        scheduleCloudSync(nextState, createdHandoff);
        return nextState;
      });
    },
    [memory.activeCertTrack, canShowContextualBubble, scheduleCloudSync]
  );

  const triggerPillarBubble = useCallback(
    (pillar: AwsPillarId) => {
      const def = AWS_SIX_PILLARS.find((p) => p.id === pillar)!;
      const lead = WORKFORCE_AGENTS[def.leadAgent];
      lastBubbleShownAtRef.current = Date.now();
      setActiveBubble({
        id: `bub-manual-${Date.now()}`,
        agentId: def.leadAgent,
        pillar,
        certTrack: memory.activeCertTrack,
        headline: `${def.name} Pillar Briefing`,
        message: `${def.summary} Core services: ${def.keyServices.slice(0, 4).join(", ")}.`,
        audioScript: `${lead.name} with your ${def.name} Pillar briefing. ${def.summary} On your ${memory.activeCertTrack} exam, watch for ${def.keyServices.slice(0, 4).join(", ")}.`,
        actionLabel: `Practice ${def.shortName}`,
        actionTab: "question-bank",
        createdAt: Date.now(),
      });
    },
    [memory.activeCertTrack]
  );

  const dismissBubble = useCallback(() => setActiveBubble(null), []);

  const snoozeBubbles = useCallback(
    (minutes: number) => {
      setActiveBubble(null);
      setMemory((prev) => {
        const next: SharedAgentMemoryState = {
          ...prev,
          bubblePreferences: {
            ...prev.bubblePreferences,
            snoozeUntil: Date.now() + minutes * 60 * 1000,
          },
        };
        scheduleCloudSync(next);
        return next;
      });
    },
    [scheduleCloudSync]
  );

  const toggleMuteBubbles = useCallback(() => {
    setActiveBubble(null);
    setMemory((prev) => {
      const nextMuted = !prev.bubblePreferences.muted;
      const next: SharedAgentMemoryState = {
        ...prev,
        bubblePreferences: {
          ...prev.bubblePreferences,
          muted: nextMuted,
          snoozeUntil: nextMuted ? null : prev.bubblePreferences.snoozeUntil,
        },
      };
      scheduleCloudSync(next);
      return next;
    });
  }, [scheduleCloudSync]);

  const resolveHandoff = useCallback(
    (handoffId: string) => {
      setMemory((prev) => {
        const next: SharedAgentMemoryState = {
          ...prev,
          handoffs: prev.handoffs.map((h) => (h.id === handoffId ? { ...h, resolved: true } : h)),
        };
        scheduleCloudSync(next);
        return next;
      });
    },
    [scheduleCloudSync]
  );

  const consultCouncil = useCallback(
    async (prompt: string): Promise<CouncilConsultResponse> => {
      setIsConsulting(true);
      try {
        const res = await fetch("/api/workforce/consult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            certTrack: memory.activeCertTrack,
            sharedContext: {
              pillarScores: memory.pillarScores,
              weakConcepts: memory.weakConcepts.slice(0, 6),
              recentEvents: memory.recentEvents.slice(0, 5),
            },
          }),
        });
        const data = await res.json();
        const leadAgent = (WORKFORCE_AGENTS[data.leadAgent as WorkforceAgentId] ? data.leadAgent : "archie") as WorkforceAgentId;
        const handoffToAgent = (WORKFORCE_AGENTS[data.handoffToAgent as WorkforceAgentId] ? data.handoffToAgent : "guardian") as WorkforceAgentId;
        const pillar = (AWS_SIX_PILLARS.some((p) => p.id === data.pillar) ? data.pillar : "security") as AwsPillarId;

        const result: CouncilConsultResponse = {
          leadAgent,
          handoffToAgent,
          pillar,
          headline: data.headline || "AI Workforce Council Insight",
          councilAnswer: data.councilAnswer || "Align your architecture with the 6 AWS Well-Architected Pillars.",
          handoffSummary: data.handoffSummary || "Peer specialist queued a targeted follow-up.",
          audioScript: data.audioScript || data.councilAnswer || "Council briefing ready.",
          recommendedTab: data.recommendedTab || "question-bank",
          fallback: data.fallback,
        };

        const newHandoff: AgentHandoff = {
          id: `ho-consult-${Date.now()}`,
          fromAgent: leadAgent,
          toAgent: handoffToAgent,
          pillar,
          certTrack: memory.activeCertTrack,
          summary: result.handoffSummary,
          recommendedTab: result.recommendedTab,
          resolved: false,
          createdAt: new Date().toISOString(),
        };

        setMemory((prev) => {
          const next = {
            ...prev,
            handoffs: [newHandoff, ...prev.handoffs].slice(0, 20),
          };
          scheduleCloudSync(next, newHandoff);
          return next;
        });

        lastBubbleShownAtRef.current = Date.now();
        setActiveBubble({
          id: `bub-consult-${Date.now()}`,
          agentId: leadAgent,
          handoffFromAgent: handoffToAgent,
          pillar,
          certTrack: memory.activeCertTrack,
          headline: result.headline,
          message: result.councilAnswer.slice(0, 190),
          audioScript: result.audioScript,
          actionLabel: "Open Drill",
          actionTab: result.recommendedTab,
          createdAt: Date.now(),
        });

        return result;
      } finally {
        setIsConsulting(false);
      }
    },
    [memory, scheduleCloudSync]
  );

  return (
    <AgentWorkforceContext.Provider
      value={{
        memory,
        activeCertTrack: memory.activeCertTrack,
        setActiveCertTrack,
        activeBubble,
        isMeshSheetOpen,
        setIsMeshSheetOpen,
        dispatchStudyEvent,
        dismissBubble,
        snoozeBubbles,
        toggleMuteBubbles,
        resolveHandoff,
        triggerPillarBubble,
        consultCouncil,
        isConsulting,
        isSyncingMemory,
      }}
    >
      {children}
    </AgentWorkforceContext.Provider>
  );
};

export function useAgentWorkforce() {
  const ctx = useContext(AgentWorkforceContext);
  if (!ctx) {
    throw new Error("useAgentWorkforce must be used within AgentWorkforceProvider");
  }
  return ctx;
}
