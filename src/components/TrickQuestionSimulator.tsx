import React, { useState, useEffect, useRef } from "react";
import { 
  AlertCircle, 
  HelpCircle, 
  Trophy, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RefreshCw, 
  Star, 
  Info, 
  Lightbulb, 
  Scissors, 
  Bot, 
  Flame, 
  Zap, 
  Timer, 
  Award, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  EyeOff
} from "lucide-react";
import { TrickQuestion, TrickQuestionOption } from "../types";
import { ParticleEffect } from "./ParticleEffect";
import { 
  addXP, 
  recordGameSessionMetric, 
  getGamificationProfile, 
  consumeLifeline 
} from "../services/gamificationService";

interface TrickQuestionSimulatorProps {
  questions: TrickQuestion[];
  quizHistory: { [key: string]: boolean };
  onRecordResult: (id: string, isCorrect: boolean) => void;
  onResetQuiz: () => void;
  savedState?: any;
  onSaveState?: (state: any) => void;
}

// Domain-based Agent heuristics for Hint Tier 3 (Agent Whisper)
const AGENT_WHISPERS: Record<string, { agent: string; emoji: string; tip: string }> = {
  "cloud-concepts": {
    agent: "Archie",
    emoji: "🏗️",
    tip: "Remember the 6 Advantages of Cloud: Trade capital expense for variable expense, benefit from massive economies of scale, stop guessing capacity, increase speed & agility, stop spending money running data centers, and go global in minutes."
  },
  "security-compliance": {
    agent: "Guardian",
    emoji: "🛡️",
    tip: "Shared Responsibility Rule: AWS manages security OF the cloud (physical infrastructure, virtualization hardware), while the customer manages security IN the cloud (customer data, IAM, OS patches, firewall rules)."
  },
  "cloud-technology": {
    agent: "TrapMaster",
    emoji: "⚡",
    tip: "Storage distinction trap: S3 is Object storage (unstructured, infinite, HTTP accessible). EBS is Block storage (attached to a single EC2 instance in the same AZ). EFS is Shared File storage (NFS mountable across multiple instances/AZs)."
  },
  "billing-pricing": {
    agent: "PennyWise",
    emoji: "💰",
    tip: "Cost Tools trap: Cost Explorer is retrospective (analyzes past usage & forecasts spend). AWS Budgets is proactive (sends alerts before or when exceeding limits). Pricing Calculator estimates upfront architectures."
  }
};

export const TrickQuestionSimulator: React.FC<TrickQuestionSimulatorProps> = ({
  questions,
  quizHistory,
  onRecordResult,
  onResetQuiz,
  savedState,
  onSaveState
}) => {
  const [currentIdx, setCurrentIdx] = useState(savedState?.currentIdx || 0);
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Hints State
  const [showClue, setShowClue] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [showAgentWhisper, setShowAgentWhisper] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Game Metrics State
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const activeQuestion = questions[currentIdx];

  useEffect(() => {
    if (onSaveState) {
      onSaveState({ currentIdx });
    }
  }, [currentIdx, onSaveState]);

  // Sync state when active question index changes
  useEffect(() => {
    setSelectedKey(null);
    setIsSubmitted(false);
    setShowClue(false);
    setEliminatedOptions([]);
    setShowAgentWhisper(false);
    setQuestionStartTime(Date.now());
  }, [currentIdx]);

  const handleSelectOption = (key: "A" | "B" | "C" | "D") => {
    if (isSubmitted || eliminatedOptions.includes(key)) return;
    setSelectedKey(key);
  };

  // Tier 1: Constraint / Architectural Clue
  const handleToggleClue = () => {
    if (!showClue) {
      setHintsUsedCount(prev => prev + 1);
    }
    setShowClue(prev => !prev);
  };

  // Tier 2: 50:50 Distractor Elimination
  const handleUse5050 = () => {
    if (eliminatedOptions.length > 0 || isSubmitted) return;
    
    // Find incorrect options
    const incorrectKeys = activeQuestion.options
      .map(o => o.key)
      .filter(k => k !== activeQuestion.correctAnswer);
    
    // Randomly pick 2 incorrect options to eliminate
    const shuffled = [...incorrectKeys].sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);
    
    setEliminatedOptions(toEliminate);
    setHintsUsedCount(prev => prev + 1);

    // If currently selected option got eliminated, deselect it
    if (selectedKey && toEliminate.includes(selectedKey)) {
      setSelectedKey(null);
    }
  };

  // Tier 3: Swarm Agent Whisper
  const handleToggleWhisper = () => {
    if (!showAgentWhisper) {
      setHintsUsedCount(prev => prev + 1);
    }
    setShowAgentWhisper(prev => !prev);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    if (!selectedKey || isSubmitted) return;
    const isCorrect = selectedKey === activeQuestion.correctAnswer;
    const responseTime = Date.now() - questionStartTime;
    setResponseTimes(prev => [...prev, responseTime]);

    onRecordResult(activeQuestion.id, isCorrect);
    setIsSubmitted(true);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      const multiplier = Math.min(3, 1 + Math.floor(streak / 2) * 0.5);
      const earnedXP = Math.round(50 * multiplier);
      setSessionXP(prev => prev + earnedXP);
      addXP(earnedXP, "Exam Trap Simulator Success");

      const newParticle = { id: Date.now().toString(), x: e.clientX, y: e.clientY };
      setParticles(prev => [...prev, newParticle]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    } else {
      setStreak(0);
      addXP(10, "Exam Trap Simulator Attempt");
      setSessionXP(prev => prev + 10);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  // Stats calculation
  const totalAttempted = Object.keys(quizHistory).length;
  const totalCorrect = Object.values(quizHistory).filter(Boolean).length;
  const currentAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const comboMultiplier = Math.min(3.0, 1.0 + Math.floor(streak / 2) * 0.5);
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000) 
    : 0;

  // Extract key constraint for Tier 1 clue
  const getKeywordClue = () => {
    const text = activeQuestion.scenario.toLowerCase();
    if (text.includes("serverless") || text.includes("without managing")) return "Pivotal Constraint: Completely Serverless (Zero continuous compute maintenance).";
    if (text.includes("unstructured") || text.includes("images") || text.includes("videos")) return "Pivotal Constraint: Object Storage vs Block/File Storage.";
    if (text.includes("block") || text.includes("xss") || text.includes("sql injection")) return "Pivotal Constraint: Layer 7 Web Application Protection.";
    if (text.includes("alert") || text.includes("threshold") || text.includes("exceeds")) return "Pivotal Constraint: Proactive Alerting (Budgets) vs Retrospective Analysis (Cost Explorer).";
    if (text.includes("temporary") || text.includes("federated") || text.includes("without sharing")) return "Pivotal Constraint: Temporary Security Token Delegation (IAM Roles / STS).";
    if (text.includes("vulnerability") || text.includes("scan") || text.includes("patch")) return "Pivotal Constraint: Software Assessment (Inspector) vs Malicious Traffic (GuardDuty).";
    return `Exam Focus: Analyze the exact AWS service responsibility for ${activeQuestion.domainName}.`;
  };

  const whisperData = AGENT_WHISPERS[activeQuestion.domainId] || {
    agent: "TrapMaster",
    emoji: "⚡",
    tip: "Beware of distracting keywords! Verify whether the question requires block-level, object-level, or proactive budget alerts."
  };

  // Save full game session metrics
  const handleFinishAndSaveSession = () => {
    if (totalAttempted > 0) {
      recordGameSessionMetric({
        mode: "trap_simulator",
        title: "Exam Trap & Distractor Simulator",
        score: sessionXP * 10,
        accuracy: currentAccuracy,
        questionsAttempted: totalAttempted,
        questionsCorrect: totalCorrect,
        maxStreak: maxStreak,
        avgResponseTimeMs: avgResponseTime * 1000,
        hintsUsed: hintsUsedCount,
        lifelinesUsed: eliminatedOptions.length > 0 ? 1 : 0,
        xpEarned: sessionXP
      });
    }
    setShowMetricsModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Game Metrics & Statistics HUD Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center rounded-xl text-[#FF9900] border border-orange-200 dark:border-orange-900/50 shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm tracking-tight">Exam Trap Simulator</h3>
              <span className="px-2 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-extrabold rounded border border-amber-500/20">
                {currentAccuracy}% ACCURACY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Score: <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalCorrect}</strong> / <span className="font-bold">{questions.length}</span> passed • Session XP: <strong className="text-amber-500 font-black">+{sessionXP} XP</strong>
            </p>
          </div>
        </div>

        {/* Live Game Metrics Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Combo Multiplier */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs">
            <Flame className={`w-4 h-4 ${streak >= 3 ? "text-orange-500 animate-bounce" : "text-amber-500"}`} />
            <div className="font-mono">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block leading-none">Streak</span>
              <strong className="text-orange-600 dark:text-orange-400 font-black text-xs">{streak}x ({comboMultiplier}x XP)</strong>
            </div>
          </div>

          {/* Response Speed */}
          {avgResponseTime > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
              <Timer className="w-4 h-4 text-blue-500" />
              <div className="font-mono">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block leading-none">Speed</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs">{avgResponseTime}s avg</strong>
              </div>
            </div>
          )}

          {/* Session Metrics Summary Button */}
          <button
            onClick={handleFinishAndSaveSession}
            className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="View Full Game Metrics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Metrics</span>
          </button>

          <button
            onClick={onResetQuiz}
            className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-colors uppercase shrink-0 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Question Progress Navigator Bar */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        {questions.map((q, idx) => {
          const status = quizHistory[q.id];
          let dotBg = "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
          if (idx === currentIdx) dotBg = "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-black ring-2 ring-amber-400 shadow-sm";
          else if (status === true) dotBg = "bg-emerald-500 text-white border-emerald-600 font-bold";
          else if (status === false) dotBg = "bg-rose-500 text-white border-rose-600 font-bold";

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all hover:scale-105 cursor-pointer ${dotBg}`}
              title={`Go to Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main scenario block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area: Scenario, Smart Hints Bar, and Options Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-xs flex flex-col justify-between min-h-[490px]">
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                Question {currentIdx + 1} of {questions.length} • {activeQuestion.domainName}
              </span>
              
              {quizHistory[activeQuestion.id] !== undefined && (
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  quizHistory[activeQuestion.id] 
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" 
                    : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                }`}>
                  {quizHistory[activeQuestion.id] ? "✓ Passed Trap" : "✗ Tricked"}
                </span>
              )}
            </div>

            {/* Scenario Paragraph */}
            <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed bg-orange-50/40 dark:bg-slate-800/60 p-4 border border-orange-100 dark:border-slate-700/80 rounded-lg mb-4">
              "{activeQuestion.scenario}"
            </h4>

            {/* 3-Tier Multi-Level Smart Hints System Bar */}
            {!isSubmitted && (
              <div className="mb-5 p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tactical Lifelines & Hints:</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {hintsUsedCount > 0 ? `${hintsUsedCount} hints engaged` : "Clean run"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Hint 1: Constraint Clue */}
                  <button
                    onClick={handleToggleClue}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      showClue
                        ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>💡 Constraint Clue</span>
                  </button>

                  {/* Hint 2: 50:50 Lifeline */}
                  <button
                    onClick={handleUse5050}
                    disabled={eliminatedOptions.length > 0}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      eliminatedOptions.length > 0
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 opacity-80 cursor-default"
                        : "bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{eliminatedOptions.length > 0 ? "✂️ 50:50 Active" : "✂️ 50:50 Lifeline"}</span>
                  </button>

                  {/* Hint 3: Agent Whisper */}
                  <button
                    onClick={handleToggleWhisper}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      showAgentWhisper
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                        : "bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>🤖 Agent Whisper</span>
                  </button>
                </div>

                {/* Tier 1 Clue Output */}
                {showClue && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-l-amber-500 text-[11px] text-amber-950 dark:text-amber-200 rounded leading-relaxed animate-fade-in">
                    <strong className="font-black">🔍 Architecture Clue: </strong>
                    {getKeywordClue()}
                  </div>
                )}

                {/* Tier 3 Agent Whisper Output */}
                {showAgentWhisper && (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-l-indigo-500 text-[11px] text-indigo-950 dark:text-indigo-200 rounded leading-relaxed animate-fade-in flex items-start gap-2">
                    <span className="text-base">{whisperData.emoji}</span>
                    <div>
                      <strong className="font-bold text-indigo-700 dark:text-indigo-300">{whisperData.agent}'s Rule of Thumb: </strong>
                      <span>{whisperData.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive choices */}
            <div className="space-y-2.5">
              {activeQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedKey === opt.key;
                const isCorrect = opt.key === activeQuestion.correctAnswer;
                const isEliminated = eliminatedOptions.includes(opt.key);
                
                let optionStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300";
                
                if (isEliminated) {
                  optionStyle = "border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 line-through opacity-50 cursor-not-allowed";
                } else if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 font-medium";
                  } else if (isSelected) {
                    optionStyle = "border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 font-medium";
                  } else {
                    optionStyle = "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed";
                  }
                } else if (isSelected) {
                  optionStyle = "border-[#FF9900] bg-orange-50/60 dark:bg-amber-950/40 text-slate-900 dark:text-slate-100 font-medium ring-1 ring-[#FF9900]";
                }

                return (
                  <div
                    key={`${activeQuestion.id}-${opt.key}-${optIdx}`}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-3.5 border rounded-lg text-xs transition-all flex items-start gap-3 select-none ${
                      isSubmitted || isEliminated ? "cursor-default" : "cursor-pointer"
                    } ${optionStyle}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      isEliminated
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        : isSelected 
                          ? isSubmitted
                            ? isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                            : "bg-[#FF9900] text-slate-950 font-black"
                          : isSubmitted && isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {isEliminated ? "✕" : opt.key}
                    </span>
                    <span className="leading-relaxed flex-1">{opt.text}</span>
                    
                    {isEliminated && (
                      <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 shrink-0 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> 50:50 ELIMINATED
                      </span>
                    )}

                    {isSubmitted && isCorrect && (
                      <span className="text-[9px] font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shrink-0">
                        CORRECT
                      </span>
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <span className="text-[9px] font-mono font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-700 shrink-0">
                        YOUR TRICKED CHOICE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative flex-wrap gap-2">
            {particles.map(p => (
              <ParticleEffect key={p.id} x={p.x} y={p.y} />
            ))}
            <div className="flex space-x-2">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={handleNext}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>

            {!isSubmitted ? (
              <button
                disabled={!selectedKey}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#FF9900] hover:bg-orange-600 text-slate-950 text-xs font-black rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider cursor-pointer"
              >
                Submit & Expose Trap
              </button>
            ) : (
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={handleNext}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black rounded-lg shadow-sm transition-all uppercase tracking-wider cursor-pointer"
              >
                Next Scenario
              </button>
            )}
          </div>
        </div>

        {/* Right Area: Deep Analysis / Distractor Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 text-white flex flex-col justify-between min-h-[490px] overflow-hidden">
          
          {!isSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 h-full space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-7 h-7 animate-pulse" />
              </div>
              <h5 className="font-bold text-slate-200 text-sm">Deep Analysis Vault Locked</h5>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Choose an option and click <strong>Submit & Expose Trap</strong>. The analyzer will expose the distractor patterns and unlock the architectural justification.
              </p>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 font-mono text-left w-full space-y-1">
                <div className="text-amber-400 font-bold">⚡ Active Lifelines Ready:</div>
                <div>• Tier 1: Constraint & Keyword Clue</div>
                <div>• Tier 2: 50:50 Distractor Elimination</div>
                <div>• Tier 3: AI Swarm Heuristic Whisper</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin">
              
              <div className="space-y-3.5">
                {/* Result Notification */}
                <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                  selectedKey === activeQuestion.correctAnswer
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {selectedKey === activeQuestion.correctAnswer ? (
                    <span>Immune! You successfully dodged the distractor trap (+{Math.round(50 * comboMultiplier)} XP).</span>
                  ) : (
                    <span>Tricked! Option {selectedKey} is a classic AWS distractor trap.</span>
                  )}
                </div>

                {/* Trap Alert */}
                <div className="bg-slate-900 p-3.5 border-l-4 border-l-orange-500 rounded-lg text-[11.5px] leading-relaxed">
                  <span className="text-[#FF9900] font-bold block mb-1">
                    🛡️ THE EXAM TRAP:
                  </span>
                  {activeQuestion.trickAlert}
                </div>

                {/* Correct Explanation */}
                <div className="bg-slate-900/70 p-3.5 border border-slate-800 rounded-lg">
                  <span className="text-emerald-400 font-bold block text-xs mb-1">
                    ✓ Why Answer {activeQuestion.correctAnswer} is Correct:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeQuestion.correctExplanation}
                  </p>
                </div>

                {/* Distractors Exposed */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    💀 Distractor Traps Exposed:
                  </span>
                  
                  {Object.entries(activeQuestion.distractorExplanations).map(([key, value]) => {
                    if (key === activeQuestion.correctAnswer) return null;
                    return (
                      <div key={key} className="text-[10.5px] bg-slate-900/40 p-2.5 border border-slate-800/60 rounded-lg leading-normal">
                        <span className="font-mono font-bold text-amber-400 mr-1 uppercase">
                          Option {key}:
                        </span>
                        <span className="text-slate-300">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips block */}
              <div className="text-[10px] text-slate-400 font-mono mt-4 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>EXAM TIP: Watch for absolute constraints like 'least operational overhead' or 'multi-AZ self-healing'.</span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Session Game Metrics Modal */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Session Game Metrics
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {currentAccuracy >= 80 ? "🏆 Grandmaster Tier" : "🎯 Specialist Tier"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Accuracy</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{currentAccuracy}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Max Streak</span>
                <span className="text-xl font-black text-orange-600 dark:text-orange-400">{maxStreak}x</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Avg Speed</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">{avgResponseTime}s</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">XP Earned</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">+{sessionXP}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200">Session Diagnostic Summary:</div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Questions Attempted:</span>
                <span className="font-mono font-bold">{totalAttempted} of {questions.length}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tactical Hints Engaged:</span>
                <span className="font-mono font-bold text-amber-500">{hintsUsedCount} hints</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Metrics Synchronized to Profile:</span>
                <span className="font-mono font-bold text-emerald-500">✓ Saved to Cloud/Local</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMetricsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Close & Continue Drilling
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

