import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Headphones,
  Loader2,
  Database,
  Filter,
  Search,
  Layers,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Plus,
} from "lucide-react";
import {
  CertTrack,
  AwsPillarId,
  VerifiedQuestion,
  AWS_SIX_PILLARS,
  CERT_TRACK_CONFIG,
  WORKFORCE_AGENTS,
} from "../types/workforce";
import { SEED_VERIFIED_QUESTIONS } from "../data/saaAndPillarQuestions";
import { useAgentWorkforce } from "../contexts/AgentWorkforceContext";
import { useAudioLesson } from "../contexts/AudioLessonContext";
import { triggerHaptic } from "../utils/haptics";

const LOCAL_BANK_CACHE_KEY = "cloudmaster_verified_question_bank_v1";

interface AIQuestionBankViewProps {
  onRecordQuizResult?: (questionId: string, isCorrect: boolean) => void;
  onAddStudyMinutes?: (mins: number) => void;
}

export const AIQuestionBankView: React.FC<AIQuestionBankViewProps> = ({
  onRecordQuizResult,
  onAddStudyMinutes,
}) => {
  const { activeCertTrack, setActiveCertTrack, dispatchStudyEvent } = useAgentWorkforce();
  const { playLesson, currentLesson, isPlaying } = useAudioLesson();

  const [questions, setQuestions] = useState<VerifiedQuestion[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_BANK_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_VERIFIED_QUESTIONS;
  });

  const [bankSource, setBankSource] = useState<"cloudsql" | "offline-baseline">("offline-baseline");
  const [loadingBank, setLoadingBank] = useState(false);

  // Filters
  const [selectedPillar, setSelectedPillar] = useState<AwsPillarId | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "foundation" | "associate" | "challenge">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive drill state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });
  const questionStartRef = useRef<number>(Date.now());

  // Gemini 4 Generator + Peer Review panel state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genPillar, setGenPillar] = useState<AwsPillarId>("security");
  const [genDifficulty, setGenDifficulty] = useState<"foundation" | "associate" | "challenge">("associate");
  const [genTopic, setGenTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState<string | null>(null);
  const [genFeedback, setGenFeedback] = useState<string | null>(null);

  const fetchBank = async (track: CertTrack) => {
    setLoadingBank(true);
    try {
      const res = await fetch(`/api/questions/bank?certTrack=${encodeURIComponent(track)}`);
      if (!res.ok) throw new Error("Bank fetch failed");
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions((prev) => {
          const otherTrack = prev.filter((q) => q.certTrack !== track);
          const merged = [...data.questions, ...otherTrack];
          try {
            localStorage.setItem(LOCAL_BANK_CACHE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
        setBankSource(data.source === "cloudsql" ? "cloudsql" : "offline-baseline");
      }
    } catch {
      setBankSource("offline-baseline");
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    fetchBank(activeCertTrack);
    setActiveQuestionIdx(0);
    setSelectedOption(null);
    questionStartRef.current = Date.now();
  }, [activeCertTrack]);

  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return questions.filter((q) => {
      if (q.certTrack !== activeCertTrack) return false;
      if (selectedPillar !== "all" && q.pillar !== selectedPillar) return false;
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;
      if (
        qLower &&
        !q.scenario.toLowerCase().includes(qLower) &&
        !q.explanation.toLowerCase().includes(qLower)
      ) {
        return false;
      }
      return true;
    });
  }, [questions, activeCertTrack, selectedPillar, selectedDifficulty, searchQuery]);

  const currentQuestion = filteredQuestions[activeQuestionIdx] || filteredQuestions[0] || null;
  const currentPillarDef = currentQuestion
    ? AWS_SIX_PILLARS.find((p) => p.id === currentQuestion.pillar)
    : null;
  const currentLeadAgent = currentPillarDef ? WORKFORCE_AGENTS[currentPillarDef.leadAgent] : WORKFORCE_AGENTS.archie;

  useEffect(() => {
    if (activeQuestionIdx >= filteredQuestions.length && filteredQuestions.length > 0) {
      setActiveQuestionIdx(0);
      setSelectedOption(null);
    }
  }, [filteredQuestions.length, activeQuestionIdx]);

  const handleAnswer = async (optionIdx: number) => {
    if (!currentQuestion || selectedOption !== null) return;
    const isCorrect = optionIdx === currentQuestion.correctIndex;
    const reactionMs = Date.now() - questionStartRef.current;

    triggerHaptic(isCorrect ? "success" : "error");
    setSelectedOption(optionIdx);
    setSessionStats((prev) => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    if (onRecordQuizResult) {
      onRecordQuizResult(String(currentQuestion.externalKey || currentQuestion.id), isCorrect);
    }
    if (onAddStudyMinutes && (sessionStats.attempted + 1) % 3 === 0) {
      onAddStudyMinutes(2);
    }

    // Dispatch into Cross-Aware AI Agent Workforce & 16-Area CMI Engine
    dispatchStudyEvent({
      sourceTab: "question-bank",
      certTrack: currentQuestion.certTrack,
      pillar: currentQuestion.pillar,
      domainId: currentQuestion.domainId,
      topic: currentQuestion.scenario.slice(0, 72),
      outcome: isCorrect ? "correct" : "incorrect",
      reactionMs,
      customAudioScript: currentQuestion.audioScript,
    });

    // Update global PostgreSQL accuracy telemetry asynchronously
    fetch(`/api/questions/${encodeURIComponent(String(currentQuestion.id))}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCorrect }),
    }).catch(() => {});
  };

  const handleNextQuestion = () => {
    triggerHaptic("light");
    setSelectedOption(null);
    questionStartRef.current = Date.now();
    if (filteredQuestions.length > 0) {
      setActiveQuestionIdx((prev) => (prev + 1) % filteredQuestions.length);
    }
  };

  const handlePlayRationaleAudio = () => {
    if (!currentQuestion) return;
    triggerHaptic("light");
    const script =
      currentQuestion.audioScript ||
      `${currentQuestion.explanation} Exam watch-out: ${currentQuestion.trapNote}`;
    playLesson(
      {
        id: `qbank-${currentQuestion.externalKey}`,
        title: `${currentQuestion.certTrack} · ${currentPillarDef?.shortName || "AWS"} Rationale`,
        module: `${currentLeadAgent.name} Audio Briefing`,
        text: script,
      },
      { toggleIfSame: true }
    );
    dispatchStudyEvent({
      sourceTab: "question-bank",
      certTrack: currentQuestion.certTrack,
      pillar: currentQuestion.pillar,
      domainId: currentQuestion.domainId,
      topic: `${currentPillarDef?.shortName} Audio Rationale`,
      outcome: "audio",
    });
  };

  const handleGenerateVerifiedBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    triggerHaptic("light");
    setIsGenerating(true);
    setGenFeedback(null);
    setGenStage("Stage 1/2: Gemini 4 authoring original exam scenarios...");

    try {
      const stageTimer = setTimeout(() => {
        setGenStage("Stage 2/2: Independent AI Peer-Reviewer auditing AWS accuracy & Pillar alignment...");
      }, 2400);

      const trackDomains = CERT_TRACK_CONFIG[activeCertTrack].domains;
      const domainForPillar =
        genPillar === "security"
          ? trackDomains.find((d) => d.id.includes("sec"))?.id || trackDomains[0].id
          : genPillar === "cost_optimization" || genPillar === "sustainability"
          ? trackDomains.find((d) => d.id.includes("cost") || d.id.includes("billing"))?.id || trackDomains[3].id
          : trackDomains[2]?.id || trackDomains[0].id;

      const res = await fetch("/api/questions/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certTrack: activeCertTrack,
          pillar: genPillar,
          domainId: domainForPillar,
          difficulty: genDifficulty,
          count: 3,
          focusTopic: genTopic.trim(),
        }),
      });
      clearTimeout(stageTimer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions((prev) => {
          const updated = [...data.questions, ...prev];
          try {
            localStorage.setItem(LOCAL_BANK_CACHE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setSelectedPillar(genPillar);
        setSelectedDifficulty("all");
        setActiveQuestionIdx(0);
        setSelectedOption(null);
        questionStartRef.current = Date.now();
        setGenFeedback(
          `Approved ${data.approvedCount}/${data.generatedCount} new ${activeCertTrack} questions${
            data.persistedToDb ? " and saved globally to PostgreSQL Cloud SQL." : " (cached locally offline)."
          }`
        );
        setGenTopic("");
      } else {
        setGenFeedback("All drafted items were filtered out by the AI quality reviewer. Try a slightly broader topic.");
      }
    } catch (err: any) {
      setGenFeedback(err?.message || "Could not complete AI generation right now. Your offline bank remains ready.");
    } finally {
      setIsGenerating(false);
      setGenStage(null);
    }
  };

  const trackConfig = CERT_TRACK_CONFIG[activeCertTrack];
  const isPlayingCurrent = Boolean(
    currentQuestion && isPlaying && currentLesson?.id === `qbank-${currentQuestion.externalKey}`
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header & Track Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#FF9900]">{trackConfig.code}</span>
              <span aria-hidden="true">·</span>
              <span>{bankSource === "cloudsql" ? "PostgreSQL Cloud SQL Synced" : "Offline Local Bank"}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{filteredQuestions.length} verified questions</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Multi-Cert AI-Reviewed Question Bank
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Every scenario is audited by Gemini 4 against official AWS documentation and mapped to the 6 Well-Architected Pillars with spoken audio rationales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Segmented Track Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(["CLF-C02", "SAA-C03"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveCertTrack(track);
                  }}
                  className={`min-h-[40px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeCertTrack === track
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setShowGenerator((v) => !v);
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#FF9900] hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Generate &amp; Verify Set</span>
            </button>
          </div>
        </div>

        {/* Collapsible Gemini 4 Generator & Independent Peer-Review Drawer */}
        {showGenerator && (
          <form
            onSubmit={handleGenerateVerifiedBatch}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF9900]" />
                  <span>Gemini 4 Author + Independent AI Peer-Review Pipeline</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generates 3 original {activeCertTrack} scenarios, filters out ambiguities (score ≥ 75), and persists verified items globally in PostgreSQL Cloud SQL.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  AWS Well-Architected Pillar
                </label>
                <select
                  value={genPillar}
                  onChange={(e) => setGenPillar(e.target.value as AwsPillarId)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {AWS_SIX_PILLARS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Difficulty Tier
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value as "foundation" | "associate" | "challenge")}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="foundation">Foundation (CLF-C02 Core)</option>
                  <option value="associate">Associate (SAA-C03 Architecture)</option>
                  <option value="challenge">Challenge (Multi-Service Trade-off)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Optional Focus Topic
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. VPC Endpoints, Aurora Global, Graviton"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-300 min-h-[20px]">
                {genStage && (
                  <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>{genStage}</span>
                  </span>
                )}
                {!genStage && genFeedback && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{genFeedback}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="min-h-[44px] px-5 rounded-xl bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{isGenerating ? "Auditing & Saving..." : "Run Dual-Pass AI Review"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar: 6 AWS Well-Architected Pillars + Search */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedPillar("all");
                setActiveQuestionIdx(0);
                setSelectedOption(null);
              }}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedPillar === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All 6 Pillars
            </button>
            {AWS_SIX_PILLARS.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => {
                  setSelectedPillar(pillar.id);
                  setActiveQuestionIdx(0);
                  setSelectedOption(null);
                }}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedPillar === pillar.id
                    ? "bg-[#FF9900] text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {pillar.shortName}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveQuestionIdx(0);
                }}
                placeholder="Search AWS services, scenarios, or traps (e.g. VPC, KMS, Graviton, SQS)..."
                className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF9900]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value as any);
                  setActiveQuestionIdx(0);
                }}
                className="min-h-[42px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Difficulties</option>
                <option value="foundation">Foundation</option>
                <option value="associate">Associate</option>
                <option value="challenge">Challenge</option>
              </select>

              <button
                type="button"
                onClick={() => fetchBank(activeCertTrack)}
                disabled={loadingBank}
                title="Refresh from PostgreSQL Cloud SQL"
                className="min-w-[42px] min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBank ? "animate-spin text-[#FF9900]" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Scenario Drill Stage */}
      {currentQuestion ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                Question {activeQuestionIdx + 1} / {filteredQuestions.length}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {currentPillarDef?.name} Pillar
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{currentQuestion.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                AI Review {currentQuestion.aiReviewScore}/100
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {currentQuestion.attemptCount > 0 && (
                <span>
                  Global Pass {Math.round((currentQuestion.correctCount / currentQuestion.attemptCount) * 100)}%
                </span>
              )}
              {sessionStats.attempted > 0 && (
                <span className="text-slate-900 dark:text-white font-semibold">
                  Session {sessionStats.correct}/{sessionStats.attempted}
                </span>
              )}
            </div>
          </div>

          {/* Scenario Stem */}
          <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
            {currentQuestion.scenario}
          </p>

          {/* Answer Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;
              const revealed = selectedOption !== null;

              let styleClass =
                "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-[#FF9900] text-slate-800 dark:text-slate-200";
              if (revealed) {
                if (isCorrectOption) {
                  styleClass =
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100";
                } else if (isSelected && !isCorrectOption) {
                  styleClass =
                    "border-rose-500 bg-rose-50 dark:bg-rose-950/35 text-rose-950 dark:text-rose-100";
                } else {
                  styleClass =
                    "border-slate-200/60 dark:border-slate-800/60 opacity-60 text-slate-600 dark:text-slate-400";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={revealed}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full min-h-[54px] p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${styleClass}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm leading-relaxed flex-1">{opt}</span>
                  {revealed && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {revealed && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Post-Answer Well-Architected & Audio Explanation */}
          {selectedOption !== null && (
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${currentLeadAgent.accentColor} flex items-center justify-center text-xs font-bold shrink-0`}>
                    {currentLeadAgent.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedOption === currentQuestion.correctIndex ? "Correct — Pillar Verified" : "Review — Pillar & Trap Analysis"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Coached by {currentLeadAgent.name} · {currentPillarDef?.name} Pillar
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePlayRationaleAudio}
                    className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isPlayingCurrent
                        ? "bg-[#FF9900] text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>{isPlayingCurrent ? "Playing Audio" : "Listen to Rationale"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>{currentQuestion.explanation}</p>
                {currentQuestion.trapNote && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Exam Trap Watch-Out: </span>
                      <span>{currentQuestion.trapNote}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentQuestion.aiReviewNotes}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{currentQuestion.reviewedByModel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No questions match those filters yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Clear your search filter or tap Generate &amp; Verify Set above to author and audit fresh {activeCertTrack} scenarios with Gemini 4.
          </p>
        </div>
      )}
    </div>
  );
};
