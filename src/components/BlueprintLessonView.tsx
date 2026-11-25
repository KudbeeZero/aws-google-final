import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Globe,
  ShieldCheck,
  LifeBuoy,
  TrendingUp,
  Layers,
  CheckCircle2,
  Play,
  Pause,
  DownloadCloud,
  Headphones,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Clock,
  AlertTriangle,
  Lock,
  Cpu,
  Zap,
  ChevronRight,
  Award,
  BookOpen,
} from "lucide-react";
import { useAudioLesson, AudioLessonItem } from "../contexts/AudioLessonContext";
import { addXP } from "../services/gamificationService";
import { triggerHaptic } from "../utils/haptics";

interface BlueprintLessonViewProps {
  onAddMinutes?: (mins: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface ChapterQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

interface BlueprintChapter {
  id: string;
  number: string;
  shortTitle: string;
  title: string;
  analogy: string;
  domainTag: string;
  durationLabel: string;
  summary: string;
  keyTakeaways: string[];
  audioScript: string;
  question: ChapterQuestion;
}

const STORAGE_KEY = "aws_clf_c02_blueprint_lesson_v1";

const CHAPTERS: BlueprintChapter[] = [
  {
    id: "blueprint-ch-1",
    number: "01",
    shortTitle: "Global Infra",
    title: "Global Infrastructure: Building the Foundation",
    analogy: "Skyscraper Foundation & Bedrock",
    domainTag: "Domain 1 & 3 · Cloud Concepts & Technology",
    durationLabel: "~1m 20s",
    summary:
      "Treat AWS Cloud architecture like designing a digital skyscraper rather than memorizing 200 disconnected services. Every resilient workload rests on physically isolated Availability Zones inside carefully chosen Regions.",
    keyTakeaways: [
      "An Availability Zone (AZ) is one or more discrete data centers with redundant power, networking, and connectivity inside an AWS Region.",
      "AZs sit in physically separate buildings miles apart to survive local floods or grid outages, connected by ultra-low latency private fiber for static stability (Multi-AZ).",
      "Choose an AWS Region using four weighted factors: Compliance & Data Residency laws, Latency to end users, Service Availability, and Pricing variations.",
    ],
    audioScript:
      "Chapter 1: Global Infrastructure, Building the Foundation. Imagine designing a digital skyscraper instead of memorizing two hundred isolated acronyms. Every resilient AWS workload starts with Availability Zones inside a Region. An Availability Zone is one or more discrete data centers with redundant power, networking, and connectivity. They are physically separated by miles so a localized flood or power grid failure cannot take down your whole application, yet connected via ultra-low latency private links for static Multi-AZ stability. When choosing which AWS Region to build in, evaluate four core factors: compliance and data residency laws, proximity and latency to your users, whether the specific AWS services you need are available in that Region, and regional pricing differences.",
    question: {
      prompt:
        "A European healthcare startup must guarantee patient records never leave Germany while keeping synchronous database replication resilient to a single data-center power outage. Which architectural choice satisfies both rules?",
      options: [
        "Deploy across multiple Availability Zones within the eu-central-1 (Frankfurt) Region",
        "Deploy a single EC2 instance in us-east-1 with S3 Cross-Region Replication to Tokyo",
        "Use a single Availability Zone with two identical server racks for redundancy",
        "Place CloudFront edge caches in front of an on-premises server in London",
      ],
      correctIndex: 0,
      rationale:
        "Multiple Availability Zones inside eu-central-1 keep data strictly inside Germany (Compliance & Data Residency) while protecting against facility-level power or flood outages over low-latency private links.",
    },
  },
  {
    id: "blueprint-ch-2",
    number: "02",
    shortTitle: "Well-Architected",
    title: "Well-Architected Framework: Raising the Structural Pillars",
    analogy: "Load-Bearing Structural Columns",
    domainTag: "Domain 1 & 3 · Architecture & Reliability",
    durationLabel: "~1m 35s",
    summary:
      "The AWS Well-Architected Framework turns uptime and recovery goals into measurable engineering targets. Balancing RTO, RPO, and automated rollbacks prevents human hesitation during bad deployments.",
    keyTakeaways: [
      "Core structural pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization (plus Sustainability).",
      "RTO (Recovery Time Objective) is your maximum acceptable downtime delay to restore service; RPO (Recovery Point Objective) is your maximum acceptable data-loss window since the last backup.",
      "Automated Rollbacks follow Plan -> Test -> Rollback: test in a mirrored network with an automated runner, and automatically revert when failure thresholds trigger to eliminate human delay and preserve RTO.",
    ],
    audioScript:
      "Chapter 2: Well-Architected Framework, Raising the Structural Pillars. Structural pillars keep your cloud skyscraper standing under stress: Operational Excellence, Security, Reliability, Performance Efficiency, and Cost Optimization. On the exam, pay sharp attention to RTO versus RPO. Recovery Time Objective, RTO, measures how much downtime your business can tolerate before service must be restored. Recovery Point Objective, RPO, measures the maximum amount of data loss you can accept, measured back to your last backup. To protect tight RTO targets during software updates, implement Automated Rollbacks in three steps: Plan a verified reversion path to a known good state, Test the deployment in a mirrored production environment using an automated test runner, and automatically trigger a Rollback when failure conditions fire—removing slow manual intervention.",
    question: {
      prompt:
        "An e-commerce checkout platform can lose at most 5 minutes of recent transactions during an outage (data loss tolerance) and must be back online within 15 minutes (downtime tolerance). How do these map to AWS recovery objectives?",
      options: [
        "RPO = 5 minutes; RTO = 15 minutes",
        "RTO = 5 minutes; RPO = 15 minutes",
        "Both RPO and RTO equal 20 minutes combined",
        "RPO applies only to Spot Instances, while RTO applies to S3 Glacier",
      ],
      correctIndex: 0,
      rationale:
        "RPO (Recovery Point Objective) governs acceptable data loss back to the last backup (5 minutes), whereas RTO (Recovery Time Objective) governs acceptable downtime delay to restore service (15 minutes).",
    },
  },
  {
    id: "blueprint-ch-3",
    number: "03",
    shortTitle: "Security & Incidents",
    title: "Security & Incidents: Installing the Security System",
    analogy: "Biometric Access & Automated Sprinklers",
    domainTag: "Domain 2 · Security & Compliance (30% Exam Weight)",
    durationLabel: "~1m 25s",
    summary:
      "Security (Domain 2) carries the heaviest weight on CLF-C02. Eliminate static long-lived keys wherever possible, isolate workloads by account, and automate incident detection through runbooks.",
    keyTakeaways: [
      "Enforce Least Privilege: audit permissions continuously and avoid static IAM access keys by using IAM Roles for temporary credentials.",
      "If long-term IAM access keys are unavoidable, rotate them at least every 90 days and isolate distinct workloads into separate AWS accounts as hard guardrails.",
      "Automated Incident Pipeline: CloudWatch / EventBridge detects anomalies -> AWS Incident Manager centralizes triage -> AWS Systems Manager (SSM) executes predefined Automation Runbooks to slash MTTR.",
    ],
    audioScript:
      "Chapter 3: Security and Incidents, Installing the Security System. Security carries thirty percent of the CLF-C02 exam. Enforce the principle of least privilege everywhere. Whenever possible, eliminate permanent IAM access keys and rely on IAM Roles that issue short-lived temporary credentials. If a legacy workload forces you to keep static IAM access keys, rotate them at least every ninety days. Isolate different environments and workloads into separate AWS accounts for strict blast-radius guardrails. Finally, automate your incident pipeline: Amazon CloudWatch or EventBridge detects an operational anomaly, AWS Incident Manager centralizes the alert and response plan, and AWS Systems Manager Automation runs predefined remediation runbooks—dramatically cutting Mean Time to Resolution without waiting for a human to wake up.",
    question: {
      prompt:
        "A legacy script requires a static IAM user access key while migrating to IAM Roles. According to AWS security best practices highlighted in the blueprint, what is the maximum recommended interval for rotating that key?",
      options: [
        "Every 90 days",
        "Every 365 days",
        "Only after a security breach is reported in Trusted Advisor",
        "Once every 3 years alongside a Savings Plan renewal",
      ],
      correctIndex: 0,
      rationale:
        "While temporary IAM Role credentials are strongly preferred, unavoidable long-term IAM access keys must be audited and rotated at least every 90 days.",
    },
  },
  {
    id: "blueprint-ch-4",
    number: "04",
    shortTitle: "Support Plans",
    title: "AWS Support Plans: Establishing Building Management",
    analogy: "24/7 Concierge & Structural Engineering Retainer",
    domainTag: "Domain 4 · Billing, Pricing & Support",
    durationLabel: "~55s",
    summary:
      "Know exact response SLAs for every AWS Support tier. Exam scenarios frequently describe an outage severity and ask for the most cost-effective plan that guarantees the required response window.",
    keyTakeaways: [
      "Developer Support: Best for early experimentation and non-production workloads; technical guidance during Business Hours (< 12h/24h guidance).",
      "Business Support: Minimum tier for production workloads; 24/7 phone/chat/email access with < 1 hour response for urgent Production System Down cases.",
      "Enterprise Support: Mission-critical tier adding a Technical Account Manager (TAM) and < 5 minutes response time for Business-Critical System Down incidents (plus < 15 min on Enterprise On-Ramp).",
    ],
    audioScript:
      "Chapter 4: AWS Support Plans, Establishing Building Management. Exam questions love testing Support Plan Service Level Agreements. Developer Support gives you technical email guidance during business hours and is suited for testing and non-production environments. Business Support unlocks twenty-four seven support with a response time under one hour when your production system goes down, making it the minimum baseline for production workloads. For mission-critical operations that demand unified operations management and a dedicated Technical Account Manager, Enterprise Support guarantees a response time under five minutes for business-critical incidents.",
    question: {
      prompt:
        "A global financial trading platform requires unified operations support and a guaranteed maximum response time of under 5 minutes if a business-critical production system goes down. Which AWS Support plan is required?",
      options: [
        "AWS Enterprise Support",
        "AWS Business Support (< 1 hour SLA)",
        "AWS Developer Support (Business hours)",
        "AWS Basic Support (Billing & account only)",
      ],
      correctIndex: 0,
      rationale:
        "Only AWS Enterprise Support provides the < 5 minute SLA for Business-Critical System Down incidents (Business Support tops out at < 1 hour for Production System Down).",
    },
  },
  {
    id: "blueprint-ch-5",
    number: "05",
    shortTitle: "Cloud Economics",
    title: "Cloud Economics: Reviewing the Lease",
    analogy: "Flexible Lease vs Buying Empty Floors",
    domainTag: "Domain 1 & 4 · Cloud Value & Pricing Models",
    durationLabel: "~1m 20s",
    summary:
      "Cloud economics replaces rigid upfront hardware guesses (CapEx) with elastic pay-as-you-go operations (OpEx), letting you blend On-Demand, Savings Plans, and Spot capacity by workload predictability.",
    keyTakeaways: [
      "CapEx -> OpEx: Stop spending millions upfront guessing peak capacity three years out; pay variable operating costs that scale automatically with real demand.",
      "On-Demand Instances: Pay by the hour or second with zero commitment—best for short-term, spiky, or unpredictable workloads.",
      "Savings Plans (1- or 3-year commitment): Major discounts in exchange for steady compute spend commitments.",
      "Spot Instances: Purchase spare AWS EC2 capacity at up to 90% discount—ideal for stateless, fault-tolerant, or interruptible batch jobs.",
    ],
    audioScript:
      "Chapter 5: Cloud Economics, Reviewing the Lease. Moving to AWS shifts your organization from Capital Expenditure, CapEx, to Operational Expenditure, OpEx. Instead of guessing demand and spending millions upfront on physical hardware that sits idle half the year, you pay variable operating expenses strictly as traffic scales. For EC2 compute, match each workload to one of three core models: On-Demand Instances let you pay by the hour or second with zero commitment for spiky workloads. Savings Plans deliver steep discounts when you commit to consistent compute usage over a one or three year term. And Spot Instances tap into spare AWS capacity for up to ninety percent off On-Demand rates, built for stateless, fault-tolerant jobs that can handle interruptions.",
    question: {
      prompt:
        "A media studio runs nightly video transcoding jobs using stateless containers that can checkpoint and resume seamlessly if an instance is reclaimed. Which EC2 purchasing option delivers up to 90% savings?",
      options: [
        "Spot Instances",
        "On-Demand Instances",
        "Dedicated Hosts with no commitment",
        "1-Year Convertible Reserved Capacity without interruption",
      ],
      correctIndex: 0,
      rationale:
        "Spot Instances utilize spare AWS capacity at up to 90% discount and fit stateless, fault-tolerant, checkpointed workloads.",
    },
  },
  {
    id: "blueprint-ch-6",
    number: "06",
    shortTitle: "Capstone Loop",
    title: "Capstone: How Architectural Concepts Work Together",
    analogy: "Full Building Stress Test Under Live Load",
    domainTag: "Full CLF-C02 Synthesis",
    durationLabel: "~1m 10s",
    summary:
      "Real exam scenarios combine economics, reliability, automation, and support in a single chain reaction. Watch how Auto Scaling, CloudWatch Rollbacks, and Enterprise Support interlock during a live crisis.",
    keyTakeaways: [
      "1. Elastic Scale (Economics + Reliability): Sudden viral traffic triggers Auto Scaling automatically, converting demand into variable OpEx without pre-buying hardware.",
      "2. Self-Healing Rollback (Operations + Reliability): A buggy concurrent deploy triggers CloudWatch alarms; Automated Rollback restores the known good release in seconds, safeguarding RTO.",
      "3. Critical Escalation (Security + Support): Incident Manager runs SSM diagnostics while Enterprise Support engineers join inside 5 minutes to protect business continuity.",
    ],
    audioScript:
      "Chapter 6, Capstone Synthesis: How Architectural Concepts Work Together. On the actual CLF-C02 exam, questions weave these blueprints into one scenario. Picture a sudden traffic surge hitting your platform right as a buggy software update deploys. First, Auto Scaling provisions extra compute automatically under a variable OpEx model so you never run out of capacity. Second, CloudWatch catches the spike in deployment errors and triggers an Automated Rollback, reverting to the last known good state in seconds to preserve your Recovery Time Objective. Third, for any deeper underlying infrastructure fault, AWS Incident Manager runs Systems Manager automation while Enterprise Support engineers step in within five minutes. Every pillar of your skyscraper works together as one cohesive system.",
    question: {
      prompt:
        "During a Black Friday traffic spike, a faulty deployment pushes error rates up just as Auto Scaling adds capacity. Which combined AWS workflow minimizes customer downtime (RTO) without manual engineer intervention?",
      options: [
        "CloudWatch alarm triggers Automated Rollback to the previous known good state while Auto Scaling handles elastic OpEx load",
        "An engineer manually SSHs into every EC2 instance in one Availability Zone to downgrade packages",
        "Delete the AWS Region and purchase a 3-year Savings Plan before redeploying",
        "Wait for Developer Support business hours to inspect static IAM user keys",
      ],
      correctIndex: 0,
      rationale:
        "Combining elastic Auto Scaling (variable OpEx) with CloudWatch-driven Automated Rollbacks removes human reaction lag and protects the Recovery Time Objective (RTO).",
    },
  },
];

const REGION_FACTORS = [
  {
    id: "compliance",
    label: "1. Compliance & Data Residency",
    metric: "Legal Priority #1",
    summary: "Strict national or industry regulations (GDPR, HIPAA, sovereign healthcare/finance laws) dictate which country or geographic boundary data may never leave.",
    examCue: "When a question says 'data must reside strictly within country X', choose Region selection for Compliance first—even over lower price.",
  },
  {
    id: "latency",
    label: "2. Latency & User Proximity",
    metric: "Speed Priority",
    summary: "Deploy Regions physically closest to your end-user clusters to minimize round-trip network milliseconds (complemented by CloudFront edge locations for static/cached assets).",
    examCue: "When users in Tokyo complain of slow dynamic API responses from us-east-1, launch in ap-northeast-1.",
  },
  {
    id: "services",
    label: "3. Service & Feature Availability",
    metric: "Capability Check",
    summary: "Not every newly released AWS service or specialized GPU/AI instance family is immediately available in all 30+ global Regions.",
    examCue: "Verify target Region supports required managed services (e.g., Bedrock, specialized RDS engines) before provisioning.",
  },
  {
    id: "pricing",
    label: "4. Regional Pricing Differences",
    metric: "FinOps Tie-Breaker",
    summary: "Taxation, local real estate, and utility energy costs vary globally—for instance, us-east-1 often costs less per compute hour than sa-east-1 (São Paulo).",
    examCue: "If compliance, latency, and services are already satisfied, pick the lower-cost Region to optimize spend.",
  },
];

const DR_TIERS = [
  { id: "backup", name: "Backup & Restore", rto: "Hours", rpo: "Hours", cost: "$", detail: "Cheapest option: snapshots stored in Amazon S3; infrastructure rebuilt only after a disaster." },
  { id: "pilot", name: "Pilot Light", rto: "10s of Mins", rpo: "Minutes", cost: "$$", detail: "Core database replicates live; compute stays off or minimal until failover scales it up." },
  { id: "warm", name: "Warm Standby", rto: "Minutes", rpo: "Seconds–Mins", cost: "$$$", detail: "Scaled-down copy of full production always running; scales rapidly on traffic shift." },
  { id: "active", name: "Multi-Site Active-Active", rto: "Near Zero", rpo: "Near Zero", cost: "$$$$", detail: "Full production running simultaneously in multiple Regions behind Route 53; highest cost, tightest RTO/RPO." },
];

const SUPPORT_TIERS = [
  {
    tier: "Basic",
    sla: "No Technical SLA",
    scope: "Account, billing & service health checks only",
    highlight: false,
  },
  {
    tier: "Developer",
    sla: "Business Hours (< 12h / 24h)",
    scope: "Experimentation & non-production; 1 primary contact via web/email",
    highlight: false,
  },
  {
    tier: "Business",
    sla: "< 1 Hour (Production Down)",
    scope: "Minimum tier for production; 24/7 phone/chat/email + full Trusted Advisor checks",
    highlight: false,
  },
  {
    tier: "Enterprise",
    sla: "< 5 Minutes (Business-Critical)",
    scope: "Mission-critical SLA (< 5 min unified operations response) + dedicated TAM + Incident Management",
    highlight: true,
  },
];

export const BlueprintLessonView: React.FC<BlueprintLessonViewProps> = ({
  onAddMinutes,
  onNavigateToTab,
}) => {
  const {
    currentLesson,
    isPlaying,
    isLoading,
    playLesson,
    playQueue,
    precacheLessons,
    precacheProgress,
    listenedLessonIds,
  } = useAudioLesson();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.completedIds) ? parsed.completedIds : [];
    } catch {
      return [];
    }
  });
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [selectedRegionFactor, setSelectedRegionFactor] = useState<string>("compliance");
  const [selectedDrTier, setSelectedDrTier] = useState<string>("pilot");
  const [incidentStep, setIncidentStep] = useState<number>(0);
  const [economicsView, setEconomicsView] = useState<"opex" | "capex">("opex");
  const [capstoneStage, setCapstoneStage] = useState<number>(0);
  const [xpToast, setXpToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedIds }));
    } catch {
      // Ignore storage quota issues
    }
  }, [completedIds]);

  const activeChapter = CHAPTERS[activeIndex];
  const chapterAudioItems: AudioLessonItem[] = useMemo(
    () =>
      CHAPTERS.map((ch) => ({
        id: ch.id,
        title: `Blueprint ${ch.number}: ${ch.shortTitle}`,
        module: "AWS CLF-C02 Blueprint",
        subtitle: ch.title,
        text: ch.audioScript,
      })),
    []
  );

  const activeAudioItem = chapterAudioItems[activeIndex];
  const isThisChapterPlaying =
    currentLesson?.id === activeAudioItem.id && isPlaying;
  const isThisChapterLoading =
    currentLesson?.id === activeAudioItem.id && isLoading;

  const isChapterDone = completedIds.includes(activeChapter.id);
  const selectedOpt = selectedAnswers[activeChapter.id];
  const isCorrect = selectedOpt === activeChapter.question.correctIndex;
  const completionPct = Math.round((completedIds.length / CHAPTERS.length) * 100);

  const showToast = (msg: string) => {
    setXpToast(msg);
    setTimeout(() => setXpToast(null), 2800);
  };

  const handleAnswerSelect = (optIdx: number) => {
    triggerHaptic("light");
    setSelectedAnswers((prev) => ({ ...prev, [activeChapter.id]: optIdx }));

    if (
      optIdx === activeChapter.question.correctIndex &&
      !completedIds.includes(activeChapter.id)
    ) {
      triggerHaptic("success");
      setCompletedIds((prev) => [...prev, activeChapter.id]);
      addXP(40, `Blueprint ${activeChapter.number}: ${activeChapter.shortTitle}`);
      onAddMinutes?.(2);
      showToast(`+40 XP · Chapter ${activeChapter.number} Mastered`);
    } else if (optIdx !== activeChapter.question.correctIndex) {
      triggerHaptic("error");
    }
  };

  const handleToggleManualComplete = () => {
    triggerHaptic("light");
    if (isChapterDone) {
      setCompletedIds((prev) => prev.filter((id) => id !== activeChapter.id));
    } else {
      setCompletedIds((prev) => [...prev, activeChapter.id]);
      addXP(20, `Completed Blueprint ${activeChapter.number}`);
      onAddMinutes?.(2);
      showToast(`+20 XP · Marked Chapter ${activeChapter.number} Complete`);
    }
  };

  const getChapterIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return Globe;
      case 1:
        return Building2;
      case 2:
        return ShieldCheck;
      case 3:
        return LifeBuoy;
      case 4:
        return TrendingUp;
      default:
        return Layers;
    }
  };

  const activeFactorObj =
    REGION_FACTORS.find((f) => f.id === selectedRegionFactor) || REGION_FACTORS[0];
  const activeDrObj =
    DR_TIERS.find((t) => t.id === selectedDrTier) || DR_TIERS[1];

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Floating XP confirmation toast */}
      {xpToast && (
        <div className="fixed bottom-24 right-5 z-40 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold shadow-xl flex items-center gap-2 border border-amber-500/40 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-slate-950 shrink-0" />
          <span>{xpToast}</span>
        </div>
      )}

      {/* Top Studio Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Featured Audio + Visual Lesson</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                7m 42s Curriculum · 6 Chapters
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AWS CLF-C02 Blueprint: The Digital Skyscraper
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Stop memorizing disconnected acronyms. Master how AWS Global Infrastructure, Well-Architected RTO/RPO, 90-day Identity Security, Support SLAs, and Cloud Economics lock together on the exam.
            </p>
          </div>

          {/* Primary Audio Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                triggerHaptic("medium");
                playQueue(chapterAudioItems, 0);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF9900] hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              <span>Play Full Audio Lesson</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                precacheLessons(chapterAudioItems, "AWS CLF-C02 Blueprint");
              }}
              disabled={precacheProgress?.active}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-sky-500" />
              <span>
                {precacheProgress?.active
                  ? `Caching ${precacheProgress.done}/${precacheProgress.total}...`
                  : "Cache All Offline"}
              </span>
            </button>
          </div>
        </div>

        {/* Lesson Mastery Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF9900] to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
              {completedIds.length} / {CHAPTERS.length} Mastered ({completionPct}%)
            </span>
          </div>
          {completedIds.length === CHAPTERS.length && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
              <span>Blueprint Complete — Ready for Scenario Drills</span>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Navigation Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CHAPTERS.map((ch, idx) => {
          const IconComp = getChapterIcon(idx);
          const isActive = idx === activeIndex;
          const done = completedIds.includes(ch.id);
          const listened = listenedLessonIds.includes(ch.id);
          const isNowPlaying = currentLesson?.id === ch.id && isPlaying;

          return (
            <button
              key={ch.id}
              onClick={() => {
                triggerHaptic("light");
                setActiveIndex(idx);
              }}
              className={`min-h-[68px] p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-slate-900 dark:bg-slate-800 border-amber-500 text-white shadow-md"
                  : done
                  ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70 text-slate-800 dark:text-slate-100 hover:border-emerald-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-mono font-bold tabular-nums ${
                    isActive ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  CH {ch.number}
                </span>
                <div className="flex items-center gap-1">
                  {isNowPlaying && (
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {!isNowPlaying && listened && (
                    <Headphones
                      className={`w-3 h-3 ${
                        isActive ? "text-sky-300" : "text-sky-500"
                      }`}
                    />
                  )}
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <IconComp
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-amber-400" : "text-slate-400"
                      }`}
                    />
                  )}
                </div>
              </div>
              <div className="text-xs font-bold leading-tight mt-1.5 truncate">
                {ch.shortTitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Active Chapter Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Center Interactive Lesson Stage (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Chapter Header + Audio Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  Chapter {activeChapter.number}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeChapter.analogy}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeChapter.durationLabel}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeChapter.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activeChapter.domainTag}
              </p>
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                playLesson(activeAudioItem, { toggleIfSame: true });
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                isThisChapterPlaying
                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
              }`}
            >
              {isThisChapterLoading ? (
                <span>Loading Audio...</span>
              ) : isThisChapterPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Chapter</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Listen to Chapter</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {activeChapter.summary}
          </p>

          {/* CHAPTER-SPECIFIC INTERACTIVE DIAGRAM / EXPLORER */}
          {activeIndex === 0 && (
            <div className="space-y-4">
              {/* Availability Zone Anatomy Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Inside an AWS Region · Multi-AZ Static Stability
                  </span>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                    Miles Apart · Private Fiber
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {["Availability Zone A", "Availability Zone B", "Availability Zone C"].map(
                    (az, i) => (
                      <div
                        key={az}
                        className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {az}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Discrete Data Center{i === 0 ? " (1+)" : ""}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                          Independent Power & Cooling
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Interactive 4-Factor Region Selector */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-amber-300">
                  Interactive Inspector: How to Choose an AWS Region (4 Factors)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {REGION_FACTORS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedRegionFactor(f.id);
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold text-left border transition-all cursor-pointer ${
                        selectedRegionFactor === f.id
                          ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{activeFactorObj.label}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      {activeFactorObj.metric}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeFactorObj.summary}
                  </p>
                  <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 pt-1">
                    Exam Rule: {activeFactorObj.examCue}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeIndex === 1 && (
            <div className="space-y-4">
              {/* RTO vs RPO Explorer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Interactive RTO vs. RPO Strategy Selector
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    RPO = Data Loss · RTO = Downtime
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DR_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedDrTier(tier.id);
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedDrTier === tier.id
                          ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                      }`}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        RTO (Downtime)
                      </div>
                      <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                        {activeDrObj.rto}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        RPO (Data Loss)
                      </div>
                      <div className="text-xs font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
                        {activeDrObj.rpo}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        Cost Profile
                      </div>
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        {activeDrObj.cost}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeDrObj.detail}
                  </p>
                </div>
              </div>

              {/* Automated Rollback 3-Step Flow */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-amber-300">
                  Automated Rollback Sequence (Eliminates Human Delay)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { step: "1. Plan", text: "Define reversion to a verified known good state before deploying." },
                    { step: "2. Test", text: "Run an automated test runner inside a mirrored production network." },
                    { step: "3. Rollback", text: "Trigger instant automatic revert when pre-set failure thresholds fire." },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {item.step}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeIndex === 2 && (
            <div className="space-y-4">
              {/* Identity Guardrails */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>IAM Roles First</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Prefer temporary STS role credentials over static IAM access keys.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span className="tabular-nums">90-Day Key Rotation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Audit and rotate unavoidable long-term IAM keys at least every 90 days.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Account Isolation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Isolate workloads across separate AWS accounts as hard permission guardrails.
                  </p>
                </div>
              </div>

              {/* Interactive Incident Pipeline */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-amber-300">
                    Interactive Pipeline: Cutting MTTR Automatically
                  </span>
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setIncidentStep((s) => (s + 1) % 3);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold cursor-pointer"
                  >
                    Step Pipeline →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      stage: "1. Detect",
                      svc: "CloudWatch / EventBridge",
                      desc: "Spots latency spikes, error thresholds, or unauthorized API events in real time.",
                    },
                    {
                      stage: "2. Centralize",
                      svc: "AWS Incident Manager",
                      desc: "Aggregates alarms, activates response plans, and alerts responders cleanly.",
                    },
                    {
                      stage: "3. Respond",
                      svc: "SSM Automation Runbook",
                      desc: "Executes pre-approved remediation scripts automatically, cutting MTTR.",
                    },
                  ].map((node, idx) => (
                    <button
                      key={node.stage}
                      onClick={() => {
                        triggerHaptic("light");
                        setIncidentStep(idx);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        incidentStep === idx
                          ? "bg-slate-900 dark:bg-slate-800 border-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="text-xs font-extrabold text-amber-500">
                        {node.stage}
                      </div>
                      <div className="text-xs font-bold mt-0.5">{node.svc}</div>
                      <p
                        className={`text-[11px] mt-1 leading-snug ${
                          incidentStep === idx
                            ? "text-slate-300"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {node.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeIndex === 3 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  AWS Support Plan SLA Response Matrix
                </span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  High-Frequency Exam Table
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-3 font-bold">Support Plan</th>
                      <th className="py-2 pr-3 font-bold">Fastest SLA</th>
                      <th className="py-2 font-bold">Best Fit & Capabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-xs">
                    {SUPPORT_TIERS.map((row) => (
                      <tr
                        key={row.tier}
                        className={
                          row.highlight
                            ? "bg-amber-500/10 dark:bg-amber-500/15 font-semibold"
                            : ""
                        }
                      >
                        <td className="py-2.5 pr-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {row.tier}
                        </td>
                        <td className="py-2.5 pr-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap tabular-nums">
                          {row.sla}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {row.scope}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeIndex === 4 && (
            <div className="space-y-4">
              {/* Compute Purchasing Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    name: "On-Demand",
                    tag: "Zero Commitment",
                    metric: "Per Hour / Sec",
                    desc: "Full flexibility for short-term, spiky, or unpredictable workloads.",
                  },
                  {
                    name: "Savings Plans",
                    tag: "1- or 3-Year Term",
                    metric: "Up to ~72% Off",
                    desc: "Major discounts when committing to steady $/hr compute usage.",
                  },
                  {
                    name: "Spot Instances",
                    tag: "Spare EC2 Capacity",
                    metric: "Up to 90% Off",
                    desc: "Deepest discount for stateless, fault-tolerant, interruptible workloads.",
                  },
                ].map((opt) => (
                  <div
                    key={opt.name}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {opt.name}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {opt.metric} · {opt.tag}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* CapEx vs OpEx Toggle */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-amber-300">
                    Economics Shift: Fixed CapEx vs. Variable OpEx
                  </span>
                  <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setEconomicsView("opex")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        economicsView === "opex"
                          ? "bg-emerald-500 text-slate-950"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Cloud OpEx
                    </button>
                    <button
                      onClick={() => setEconomicsView("capex")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        economicsView === "capex"
                          ? "bg-rose-500 text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Legacy CapEx
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {economicsView === "opex"
                    ? "Variable Operational Expense (OpEx): Pay only for resources actively consumed. Capacity scales out automatically during holiday spikes and scales back in overnight—eliminating stranded capital."
                    : "Fixed Capital Expense (CapEx): Guess maximum traffic three years ahead, spend millions upfront on physical racks, and pay depreciation whether servers run at 95% or 8% utilization."}
                </p>
              </div>
            </div>
          )}

          {activeIndex === 5 && (
            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Live Blueprint Stress Simulation
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Step through how all 5 architectural domains respond together during a simultaneous traffic spike + bad deploy.
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    setCapstoneStage((s) => (s + 1) % 3);
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Advance Event ({capstoneStage + 1}/3)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    title: "T+00s · Traffic Surge",
                    badge: "Economics + Reliability",
                    body: "Auto Scaling provisions multi-AZ compute on demand, turning sudden demand into variable OpEx with zero hardware wait.",
                  },
                  {
                    title: "T+12s · Bad Deployment",
                    badge: "Operations + RTO",
                    body: "CloudWatch detects rising HTTP 5xx alarms and fires Automated Rollback to the last known good state in seconds.",
                  },
                  {
                    title: "T+45s · Critical Escalation",
                    badge: "Security + Support",
                    body: "Incident Manager runs SSM diagnostics while Enterprise Support (< 5 min SLA) joins operations triage.",
                  },
                ].map((ev, idx) => (
                  <div
                    key={ev.title}
                    onClick={() => setCapstoneStage(idx)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      capstoneStage === idx
                        ? "bg-slate-900 border-amber-400 shadow-md"
                        : "bg-slate-900/40 border-slate-800 opacity-65 hover:opacity-100"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-amber-400">
                      {ev.badge}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {ev.title}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {ev.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Blueprint Key Takeaways
            </h4>
            <ul className="space-y-2">
              {activeChapter.keyTakeaways.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                >
                  <ChevronRight className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Chapter Mastery Check + Navigation (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF9900]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Chapter {activeChapter.number} Mastery Check
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                +40 XP Reward
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {activeChapter.question.prompt}
            </p>

            <div className="space-y-2">
              {activeChapter.question.options.map((opt, idx) => {
                const chosen = selectedOpt === idx;
                const rightOption = idx === activeChapter.question.correctIndex;
                let styleClass =
                  "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-400";

                if (selectedOpt !== undefined) {
                  if (rightOption) {
                    styleClass =
                      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold";
                  } else if (chosen) {
                    styleClass =
                      "bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full min-h-[44px] p-3 rounded-xl border text-left text-xs leading-snug transition-all cursor-pointer flex items-start gap-2.5 ${styleClass}`}
                  >
                    <span className="font-mono font-bold text-slate-400 shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedOpt !== undefined && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isCorrect
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                }`}
              >
                <div className="font-extrabold mb-1">
                  {isCorrect ? "Correct · Architectural Rationale:" : "Review Blueprint Principle:"}
                </div>
                <p>{activeChapter.question.rationale}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleToggleManualComplete}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isChapterDone
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isChapterDone ? "Chapter Mastered" : "Mark Complete"}</span>
              </button>

              {activeIndex < CHAPTERS.length - 1 ? (
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveIndex((i) => Math.min(CHAPTERS.length - 1, i + 1));
                  }}
                  className="min-h-[40px] px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Chapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveIndex(0);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Blueprint</span>
                </button>
              )}
            </div>
          </div>

          {/* Drill Next CTA Card */}
          {onNavigateToTab && (
            <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Reinforce This Blueprint
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onNavigateToTab("flashcards")}
                  className="min-h-[44px] p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Flashcards</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Active recall deck
                  </div>
                </button>

                <button
                  onClick={() => onNavigateToTab("simulator")}
                  className="min-h-[44px] p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#FF9900] text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Cpu className="w-3.5 h-3.5 text-[#FF9900]" />
                    <span>Exam Simulator</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Scenario traps
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
