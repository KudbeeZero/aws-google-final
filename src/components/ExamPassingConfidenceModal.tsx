import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Headphones,
  X,
  Layers,
  CreditCard,
  ShieldAlert,
  Vault,
  Puzzle,
  Bot,
  Gamepad2,
  Clock,
  Check,
  BarChart3,
  Globe,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { ExamConfidenceReport } from "../services/readinessService";
import { useAgentWorkforce } from "../contexts/AgentWorkforceContext";
import { useAudioLesson } from "../contexts/AudioLessonContext";
import { GlobalBenchmarkSnapshot, WORKFORCE_AGENTS, AWS_SIX_PILLARS } from "../types/workforce";
import { auth } from "../lib/firebase";
import { triggerHaptic } from "../utils/haptics";

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
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "pillars" | "matrix16" | "roadmap">("overview");
  const { activeCertTrack, setActiveCertTrack, triggerPillarBubble } = useAgentWorkforce();
  const { playLesson, currentLesson, isPlaying } = useAudioLesson();

  const [benchmarks, setBenchmarks] = useState<GlobalBenchmarkSnapshot | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aws_exam_checklist_state_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return { item1: false, item2: false, item3: false, item4: false };
  });

  // Fetch anonymized global cohort benchmarks + persist signed-in CMI-16 snapshot when opened
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadBenchmarksAndSync = async () => {
      try {
        const res = await fetch(
          `/api/projections/global-benchmarks?certTrack=${encodeURIComponent(report.certTrack)}&scaledScore=${report.scaledScore}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBenchmarks(data);
        }
      } catch {}

      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          await fetch("/api/projections/cmi16", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              certTrack: report.certTrack,
              overallScore: report.cmi16Score,
              scaledScore: report.scaledScore,
              passProbability: report.passProbability,
              dimensions: report.dimensions16.map((d) => ({
                id: d.id,
                group: d.group,
                score: d.score,
              })),
            }),
          });
        }
      } catch {}
    };

    loadBenchmarksAndSync();
    return () => {
      cancelled = true;
    };
  }, [isOpen, report.certTrack, report.scaledScore, report.cmi16Score, report.passProbability]);

  if (!isOpen) return null;

  const toggleChecklist = (key: string) => {
    setChecklistState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("aws_exam_checklist_state_v1", JSON.stringify(next));
      return next;
    });
  };

  const isBriefingPlaying = isPlaying && currentLesson?.id === `cmi16-briefing-${report.certTrack}`;

  const handlePlayCouncilBriefing = () => {
    triggerHaptic("light");
    playLesson(
      {
        id: `cmi16-briefing-${report.certTrack}`,
        title: `${report.certTrack} CMI-16 Council Briefing`,
        module: "Exam Passing Confidence Hub",
        text: report.councilAudioBriefing,
      },
      { toggleIfSame: true }
    );
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "CreditCard":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "Vault":
        return <Vault className="w-4 h-4 text-amber-500" />;
      case "Puzzle":
        return <Puzzle className="w-4 h-4 text-purple-500" />;
      case "Layers":
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case "Bot":
        return <Bot className="w-4 h-4 text-cyan-500" />;
      case "Zap":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "Gamepad2":
        return <Gamepad2 className="w-4 h-4 text-pink-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const pillarDimensions = report.dimensions16.filter((d) => d.group === "pillar");
  const domainDimensions = report.dimensions16.filter((d) => d.group === "domain");
  const skillDimensions = report.dimensions16.filter((d) => d.group === "skill");

  const radarData = pillarDimensions.map((p) => ({
    pillar: p.shortName,
    you: p.score,
    globalAvg: benchmarks?.pillarAverages?.[p.id as keyof typeof benchmarks.pillarAverages] ?? 70,
    target: p.target,
  }));

  const domainChartData = report.domainDetails.map((d) => ({
    name: `D${d.number}`,
    fullName: d.name,
    score: d.score,
    weight: Math.round(d.weight * 100),
    target: report.certTrack === "SAA-C03" ? 76 : 74,
  }));

  const statusMeta = (status: "mastered" | "proficient" | "developing" | "priority_gap") => {
    switch (status) {
      case "mastered":
        return { label: "Mastered", textClass: "text-emerald-600 dark:text-emerald-400", barClass: "bg-emerald-500" };
      case "proficient":
        return { label: "Proficient", textClass: "text-sky-600 dark:text-sky-400", barClass: "bg-sky-500" };
      case "developing":
        return { label: "Developing", textClass: "text-amber-600 dark:text-amber-400", barClass: "bg-[#FF9900]" };
      default:
        return { label: "Priority Gap", textClass: "text-rose-600 dark:text-rose-400", barClass: "bg-rose-500" };
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-[#FF9900]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-400 font-semibold">CMI-16 Proprietary Projection Engine</span>
                  <span aria-hidden="true">·</span>
                  <span>Official {report.passingThreshold}/1000 Pass Target</span>
                  {benchmarks && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Top {Math.max(1, 100 - benchmarks.userPercentile)}% Global</span>
                    </>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate mt-0.5">
                  {report.certTrack} Exam Passing Confidence Hub
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Cert Track Segmented Switcher */}
              <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {(["CLF-C02", "SAA-C03"] as const).map((track) => (
                  <button
                    key={track}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveCertTrack(track);
                    }}
                    className={`min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeCertTrack === track
                        ? "bg-[#FF9900] text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePlayCouncilBriefing}
                className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isBriefingPlaying
                    ? "bg-[#FF9900] text-slate-950 border-amber-400"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700"
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>{isBriefingPlaying ? "Playing" : "Audio Briefing"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Confidence Hub"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 sm:px-6 overflow-x-auto shrink-0 gap-1">
            {[
              { id: "overview", label: "CMI-16 Overview", icon: BarChart3 },
              { id: "pillars", label: "6 AWS Pillars", icon: ShieldCheck },
              { id: "matrix16", label: "All 16 Projections", icon: Target },
              { id: "roadmap", label: "Council Roadmap", icon: TrendingUp },
            ].map((t) => {
              const IconComp = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`min-h-[46px] px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                    active
                      ? "border-[#FF9900] text-slate-900 dark:text-white"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#FF9900]" : ""}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 touch-scroll">
            {/* TAB 1: CMI-16 OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 4-Column KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Projected Scaled Score</div>
                    <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {report.scaledScore}
                      </span>
                      <span className="text-xs text-slate-400">/ 1000</span>
                    </div>
                    <div className={`text-xs font-semibold mt-1.5 ${report.confidenceColor}`}>
                      {report.confidenceLabel}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">CMI-16 Pass Probability</div>
                    <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {report.passProbability}%
                      </span>
                      <span className="text-xs text-slate-400">Index {report.cmi16Score}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      {report.estimatedDaysToReady === 0
                        ? "Exam-ready safety buffer met"
                        : `Est. ${report.estimatedDaysToReady} days to safe pass`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FF9900]" />
                      <span>Global Cloud SQL Cohort</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {benchmarks ? `${benchmarks.userPercentile}th` : "—"}
                      </span>
                      <span className="text-xs text-slate-400">percentile</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                      Avg {benchmarks?.avgScaledScore ?? 710} · Top 25% {benchmarks?.topQuartileScaledScore ?? 825}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Highest-Leverage Pillar</div>
                    <div className="mt-1 text-base font-bold text-slate-900 dark:text-white truncate">
                      {report.weakestPillar?.shortName || "Sustainability"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      {report.weakestPillar?.score ?? 52}% vs {report.weakestPillar?.target ?? 75}% target
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab("question-bank");
                      }}
                      className="mt-1.5 text-xs font-semibold text-[#FF9900] hover:underline cursor-pointer"
                    >
                      Drill now →
                    </button>
                  </div>
                </div>

                {/* Summary Callout */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {report.confidenceDescription}
                </div>

                {/* Side-by-side Recharts Visuals: 6-Pillar Radar + 4-Domain Target Bars */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          6 AWS Well-Architected Pillars vs Global Avg
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Amber: Your CMI-16 score · Slate: Global cohort average
                        </p>
                      </div>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="72%">
                          <PolarGrid stroke="#94a3b8" strokeOpacity={0.25} />
                          <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11, fill: "#64748b" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <Radar name="Global Avg" dataKey="globalAvg" stroke="#64748b" fill="#64748b" fillOpacity={0.18} />
                          <Radar name="Your Score" dataKey="you" stroke="#FF9900" fill="#FF9900" fillOpacity={0.34} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "10px",
                              fontSize: "12px",
                              color: "#f8fafc",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.certTrack} Weighted Exam Domains
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Official exam domain weights vs target passing line
                      </p>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={domainChartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip
                            formatter={(value: any, _name: any, item: any) => [`${value}%`, item?.payload?.fullName || "Score"]}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "10px",
                              fontSize: "12px",
                              color: "#f8fafc",
                            }}
                          />
                          <ReferenceLine y={report.certTrack === "SAA-C03" ? 76 : 74} stroke="#10b981" strokeDasharray="4 4" />
                          <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={48}>
                            {domainChartData.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.score >= 76 ? "#10b981" : entry.score >= 55 ? "#FF9900" : "#f43f5e"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 6 AWS WELL-ARCHITECTED PILLARS */}
            {activeTab === "pillars" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pillarDimensions.map((dim) => {
                  const def = AWS_SIX_PILLARS.find((p) => p.id === dim.id);
                  const agent = WORKFORCE_AGENTS[dim.leadAgent];
                  const st = statusMeta(dim.status);
                  const globalAvg = benchmarks?.pillarAverages?.[dim.id as keyof typeof benchmarks.pillarAverages] ?? 70;
                  return (
                    <div
                      key={dim.id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Pillar 0{dim.index} · Lead: {agent.name}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {dim.name}
                            </h3>
                          </div>
                          <div className="text-right font-mono tabular-nums shrink-0">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{dim.score}%</div>
                            <div className={`text-[11px] font-semibold ${st.textClass}`}>{st.label}</div>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${st.barClass}`} style={{ width: `${dim.score}%` }} />
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono tabular-nums">
                          <span>Target {dim.target}%</span>
                          <span>Global Cohort Avg {globalAvg}%</span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {dim.insight}
                        </p>
                        {def && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Key services: <span className="text-slate-700 dark:text-slate-300 font-medium">{def.keyServices.join(" · ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            triggerPillarBubble(dim.id as any);
                          }}
                          className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5 text-[#FF9900]" />
                          <span>Audio Coach</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToTab("question-bank");
                          }}
                          className="flex-1 min-h-[40px] px-3 rounded-xl bg-slate-900 dark:bg-[#FF9900] text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Practice Pillar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: COMPLETE 16-AREA PROJECTION MATRIX */}
            {activeTab === "matrix16" && (
              <div className="space-y-6">
                {[
                  { title: "01–06. Six AWS Well-Architected Pillars", items: pillarDimensions },
                  { title: `07–10. Four Official ${report.certTrack} Exam Domains`, items: domainDimensions },
                  { title: "11–16. Six Proprietary Exam Execution & Cognitive Skills", items: skillDimensions },
                ].map((section) => (
                  <div key={section.title} className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                      {section.title}
                    </h3>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                      {section.items.map((dim) => {
                        const st = statusMeta(dim.status);
                        const agent = WORKFORCE_AGENTS[dim.leadAgent];
                        return (
                          <div
                            key={dim.id}
                            className="p-3.5 bg-white dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-mono font-bold text-slate-400 tabular-nums">
                                  {String(dim.index).padStart(2, "0")}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {dim.name}
                                </span>
                                <span className={`text-[11px] font-semibold ${st.textClass} shrink-0`}>
                                  · {st.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                {dim.insight}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-28">
                                <div className="flex justify-between text-[11px] font-mono tabular-nums mb-1">
                                  <span className="font-bold text-slate-900 dark:text-white">{dim.score}%</span>
                                  <span className="text-slate-400">/{dim.target}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.barClass}`} style={{ width: `${dim.score}%` }} />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onNavigateToTab(dim.recommendedTab);
                                }}
                                title={`Boost with ${agent.name}`}
                                className="min-h-[38px] px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#FF9900] hover:text-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Fix →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: COUNCIL ROADMAP & TOOL CHECKLIST */}
            {activeTab === "roadmap" && (
              <div className="space-y-6">
                {/* Priority Recommendations */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Coordinated AI Council Next Steps
                  </h3>
                  <div className="space-y-2">
                    {report.highPriorityRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                      >
                        <span className="font-mono font-bold text-[#FF9900] shrink-0">0{i + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Tool Completion Matrix */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Study Ecosystem Contribution
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.toolsChecklist.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTab(tool.tabKey);
                        }}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] bg-white dark:bg-slate-950/50 text-left transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {getToolIcon(tool.iconName)}
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {tool.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                            {tool.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tool.completed ? "bg-emerald-500" : "bg-[#FF9900]"}`}
                            style={{ width: `${tool.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">{tool.statusLabel}</span>
                          <span className="text-[#FF9900] font-semibold shrink-0">Open →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exam-Day Readiness Checklist */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF9900]" />
                    <span>Test-Day Readiness Checklist</span>
                  </h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {[
                      { key: "item1", text: `Reach ≥ 75% across all 6 AWS Well-Architected Pillars for ${report.certTrack}` },
                      { key: "item2", text: "Complete at least 10 AI-reviewed scenario questions without hints" },
                      { key: "item3", text: "Master 8+ confused AWS service pairs inside The Distractor Vault" },
                      { key: "item4", text: "Review your spoken Council Briefing and verify Pearson VUE / PSI exam ID rules" },
                    ].map((item) => {
                      const checked = Boolean(checklistState[item.key]);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleChecklist(item.key)}
                          className="w-full min-h-[48px] px-4 py-3 bg-white dark:bg-slate-950/50 flex items-center gap-3 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              checked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <span className={`text-xs ${checked ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                            {item.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
