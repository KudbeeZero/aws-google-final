import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Award, 
  Zap, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  X, 
  Layers, 
  CreditCard, 
  ShieldAlert, 
  Vault, 
  Puzzle, 
  Bot, 
  Gamepad2, 
  RefreshCw,
  HelpCircle,
  Clock,
  Flame,
  Check
} from "lucide-react";
import { ExamConfidenceReport } from "../services/readinessService";
import { synthesizeFallbackSpeechAudio } from "../services/audioCacheService";

interface ExamPassingConfidenceModalProps {
  report: ExamConfidenceReport;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tabKey: string) => void;
}

export const ExamPassingConfidenceModal: React.FC<ExamPassingConfidenceModalProps> = ({
  report,
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "domains" | "tools" | "action_plan">("overview");
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleSpeakReport = () => {
    if (isSpeaking) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narrative = `AWS Certified Cloud Practitioner Exam Confidence Report. Your overall exam readiness is ${report.readinessScore} percent, with a projected scaled score of ${report.scaledScore} out of 1000 against the 700 passing benchmark. Your current status is ${report.confidenceLabel}. ${report.confidenceDescription} To reach the peak passing state, focus on ${report.weakestDomain ? report.weakestDomain.name : 'closing remaining practice questions'}.`;
    
    setIsSpeaking(true);
    synthesizeFallbackSpeechAudio(narrative);
    setTimeout(() => setIsSpeaking(false), 14000);
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "CreditCard": return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "ShieldAlert": return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "Vault": return <Vault className="w-4 h-4 text-amber-500" />;
      case "Puzzle": return <Puzzle className="w-4 h-4 text-purple-500" />;
      case "Layers": return <Layers className="w-4 h-4 text-emerald-500" />;
      case "Bot": return <Bot className="w-4 h-4 text-cyan-500" />;
      case "Zap": return <Zap className="w-4 h-4 text-yellow-500" />;
      case "Gamepad2": return <Gamepad2 className="w-4 h-4 text-pink-500" />;
      default: return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-6 border-b border-slate-150 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-sm bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    AWS CLF-C02 Exam Passing Confidence Hub
                  </h2>
                  <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                    Official 700 Pass Target
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-tool performance synthesis, official domain percentages, and projected test score.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeakReport}
                className={`p-2 rounded-full border transition-all ${
                  isSpeaking
                    ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
                title="Listen to Audio Evaluation"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📊 Projected Score & Confidence
            </button>
            <button
              onClick={() => setActiveTab("domains")}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap ${
                activeTab === "domains"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🏛️ Official 4 Domains Breakdown
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap ${
                activeTab === "tools"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🎮 All Tools Coverage Matrix
            </button>
            <button
              onClick={() => setActiveTab("action_plan")}
              className={`px-3 py-1.5 rounded-sm transition-all whitespace-nowrap ${
                activeTab === "action_plan"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🎯 Personalized Action Plan
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

            {/* TAB 1: OVERVIEW & SCALED SCORE */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Score Banner Hero */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-md border border-slate-800 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                        <span>Projected Scaled Score</span>
                        <span>Official Scale: 100-1000</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                          {report.scaledScore}
                        </span>
                        <span className="text-sm font-bold text-slate-400">/ 1000</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${report.confidenceBadgeBg} ${report.confidenceColor}`}>
                          {report.confidenceLabel}
                        </span>
                      </div>
                    </div>

                    {/* Visual Pass Benchmark Bar */}
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Passing Mark: 700</span>
                        <span className={report.scaledScore >= 700 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {report.scaledScore >= 700 
                            ? `+${report.scaledScore - 700} pts Above Passing` 
                            : `${700 - report.scaledScore} pts Below Passing`}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                        {/* 700 Benchmark Marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white z-10" 
                          style={{ left: `${((700 - 100) / 900) * 100}%` }}
                          title="700 Passing Benchmark"
                        />
                        <div 
                          className={`h-full transition-all duration-700 ${
                            report.scaledScore >= 760 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                              : report.scaledScore >= 700 
                                ? "bg-gradient-to-r from-amber-500 to-yellow-400" 
                                : "bg-gradient-to-r from-rose-500 to-amber-500"
                          }`}
                          style={{ width: `${((report.scaledScore - 100) / 900) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Readiness Summary Metrics */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Composite Readiness</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                        {report.readinessScore}%
                      </div>
                      <span className="text-[10px] text-slate-400">All tools weighted</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Global Study XP</span>
                      <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                        <Zap className="w-5 h-5 fill-amber-500" /> {report.xpTotal}
                      </div>
                      <span className="text-[10px] text-slate-400">Candidate Level {report.candidateLevel}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Active Streak</span>
                      <div className="text-2xl font-black text-rose-500 mt-1 flex items-center gap-1">
                        <Flame className="w-5 h-5 fill-rose-500" /> {report.streakDays} Days
                      </div>
                      <span className="text-[10px] text-slate-400">Consecutive practice</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Arcade Accuracy</span>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                        {report.overallAccuracy}%
                      </div>
                      <span className="text-[10px] text-slate-400">Speed & scenario drill</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Strongest Domain</span>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate" title={report.strongestDomain?.name}>
                        {report.strongestDomain?.name.split(" ")[0] || "Foundations"} ({report.strongestDomain?.score || 0}%)
                      </div>
                      <span className="text-[10px] text-slate-400">High mastery tier</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Primary Focus Gap</span>
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 mt-1 truncate" title={report.weakestDomain?.name}>
                        {report.weakestDomain?.name.split(" ")[0] || "None"} ({report.weakestDomain?.score || 0}%)
                      </div>
                      <span className="text-[10px] text-slate-400">High-yield ROI area</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Assessment Card */}
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-sm flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                      Socratic Readiness Assessment
                    </h4>
                    <p className="text-xs text-blue-900/80 dark:text-blue-300 mt-0.5 leading-relaxed">
                      {report.confidenceDescription}
                    </p>
                  </div>
                </div>

                {/* Quick Domain Previews */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>AWS CLF-C02 Exam Domain Performance</span>
                    <button 
                      onClick={() => setActiveTab("domains")}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.domainDetails.map((dom) => (
                      <div 
                        key={dom.domainId}
                        className="p-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-sm space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            Domain {dom.number}: {dom.name}
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {dom.score}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              dom.score >= 80 ? "bg-emerald-500" : dom.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${dom.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOMAIN DETAILS */}
            {activeTab === "domains" && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-sm text-xs text-slate-600 dark:text-slate-300">
                  The AWS CLF-C02 exam evaluates four distinct domains with specific percentage weightings. To achieve a <strong>High Confidence Passing State</strong>, aim for at least <strong>75%+ across all four domains</strong>.
                </div>

                <div className="space-y-4">
                  {report.domainDetails.map((dom) => (
                    <div 
                      key={dom.domainId}
                      className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 dark:border-slate-700 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-xs">
                              Domain {dom.number}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {dom.name}
                            </h3>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            Exam Weight: <strong>{Math.round(dom.weight * 100)}% of total exam questions</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Domain Score</span>
                            <span className={`text-lg font-black font-mono ${
                              dom.score >= 80 ? "text-emerald-600 dark:text-emerald-400" : dom.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                            }`}>
                              {dom.score}%
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            dom.status === "mastered" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" 
                              : dom.status === "proficient"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}>
                            {dom.status === "mastered" ? "★ Mastered" : dom.status === "proficient" ? "Proficient" : "Needs Review"}
                          </span>
                        </div>
                      </div>

                      {/* Sub-component progress metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Flashcard Active Recall</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {dom.knownCardsCount} / {dom.totalCardsCount} Mastered ({dom.flashcardMastery}%)
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Practice Quiz Accuracy</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {dom.correctQuizzesCount} / {dom.attemptedQuizzesCount} Correct ({dom.quizAccuracy}%)
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Applied Scenario Mastery</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {dom.appliedScenariosScore}% Efficiency
                          </span>
                        </div>
                      </div>

                      {/* High-yield recommendation for this domain */}
                      <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-sm flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-300">High-Yield Gap: </span>
                          <span className="text-amber-800 dark:text-amber-400">{dom.weakestConcept}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TOOLS COVERAGE MATRIX */}
            {activeTab === "tools" && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-sm text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Every learning and arcade tool in the study companion directly feeds into your readiness score.</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {report.toolsChecklist.filter(t => t.completed).length} / {report.toolsChecklist.length} Tools Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.toolsChecklist.map((tool) => (
                    <div 
                      key={tool.id}
                      className={`p-4 rounded-sm border transition-all flex flex-col justify-between ${
                        tool.completed 
                          ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-900/40" 
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-sm">
                              {getToolIcon(tool.iconName)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {tool.name}
                              </h4>
                              <span className="text-[10px] text-slate-500">
                                {tool.statusLabel}
                              </span>
                            </div>
                          </div>

                          {tool.completed ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Complete
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full shrink-0">
                              In Progress
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {tool.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tool.completed ? "bg-emerald-500" : "bg-blue-600"}`}
                            style={{ width: `${tool.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">
                          Weight: +{tool.scoreBonus}% Readiness
                        </span>

                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToTab(tool.tabKey);
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Launch Tool <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ACTION PLAN */}
            {activeTab === "action_plan" && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold">Personalized Roadmap to 85%+ High Confidence Pass</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Follow these step-by-step Socratic recommendations to bridge domain gaps and guarantee passing on your first exam attempt.
                  </p>
                </div>

                <div className="space-y-3">
                  {report.highPriorityRecommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm flex items-start gap-3 shadow-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Priority Action Step #{idx + 1}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exam Day Tips Checklist */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-sm space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AWS CLF-C02 Exam Day Best Practices:
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-5 list-disc">
                    <li>Read every scenario question twice to identify the exact keyword clue (e.g. "decoupling", "serverless", "least privilege", "retrospective forecasting").</li>
                    <li>Beware of distractor traps (e.g. NAT Gateway is AWS-managed with high availability; NAT Instance is customer-managed on a single EC2 instance).</li>
                    <li>Eliminate impossible answer choices immediately to boost odds to 50:50 before selecting.</li>
                    <li>Flag ambiguous questions and return to them during your second pass (you have 90 minutes for 65 questions).</li>
                  </ul>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Projected Score: <strong className="text-slate-900 dark:text-slate-100">{report.scaledScore} / 1000</strong></span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-sm transition-colors cursor-pointer"
              >
                Close Hub
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (report.weakestDomain) {
                    onNavigateToTab(report.weakestDomain.domainId === "cloud-concepts" ? "flashcards" : "vault");
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                Resume Active Practice <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
