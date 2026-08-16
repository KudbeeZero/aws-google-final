import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Flame, 
  CheckCircle, 
  XCircle, 
  Zap, 
  HelpCircle, 
  RefreshCw, 
  Clock, 
  Trophy, 
  Play, 
  Volume2, 
  VolumeX,
  Award,
  ArrowRight,
  Lightbulb,
  Scissors,
  Bot,
  Shield,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { 
  addXP, 
  recordGameSessionMetric, 
  awardLootCrate,
  getGamificationProfile 
} from "../services/gamificationService";

interface Scenario {
  id: string;
  domainId: string;
  scenarioText: string;
  correctService: string;
  incorrectOptions: string[];
  explanation: string;
  keywordClue: string;
  agentWhisper: string;
}

const GAME_SCENARIOS: Scenario[] = [
  {
    id: "gs-1",
    domainId: "cloud-concepts",
    scenarioText: "Your startup needs to host static images and product videos. The storage solution must be highly durable, virtually unlimited, and cost-effective.",
    correctService: "Amazon S3",
    incorrectOptions: ["Amazon EBS", "Amazon EFS", "AWS Snowball"],
    explanation: "Amazon Simple Storage Service (S3) provides highly durable, scalable object storage specifically designed for unstructured data like images and videos.",
    keywordClue: "Static unstructured media, 99.999999999% durability, unlimited object store.",
    agentWhisper: "Archie Whisper: Notice 'static images/videos' and 'unlimited'—block and file storage are tied to instances, while S3 is a global object store."
  },
  {
    id: "gs-2",
    domainId: "cloud-technology",
    scenarioText: "You want to run a lightweight data conversion script whenever an image is uploaded, without managing or paying for any continuous virtual servers.",
    correctService: "AWS Lambda",
    incorrectOptions: ["Amazon EC2", "AWS Elastic Beanstalk", "Amazon ECS"],
    explanation: "AWS Lambda is a serverless compute service that runs your code in response to triggers (like S3 uploads) and automatically handles the underlying compute resources.",
    keywordClue: "Event-triggered execution, zero idle server cost, pure serverless compute.",
    agentWhisper: "PennyWise Whisper: 'Whenever an image is uploaded' without continuous servers screams event-driven serverless computing."
  },
  {
    id: "gs-3",
    domainId: "security-compliance",
    scenarioText: "A retail client needs to block specific web application exploits like SQL Injections and Cross-Site Scripting (XSS) from reaching their web application servers.",
    correctService: "AWS WAF",
    incorrectOptions: ["AWS Shield", "Amazon GuardDuty", "AWS Inspector"],
    explanation: "AWS Web Application Firewall (WAF) filters HTTP/HTTPS web requests based on custom rules to block application-layer attacks like SQL injection and XSS.",
    keywordClue: "Layer 7 inspection, SQLi/XSS filtering, web ACL rule groups.",
    agentWhisper: "Guardian Whisper: Layer 7 HTTP payload inspection for SQLi/XSS is the explicit domain of AWS WAF, whereas Shield is for Layer 3/4 DDoS."
  },
  {
    id: "gs-4",
    domainId: "billing-pricing",
    scenarioText: "Your CFO wants to visualize historic spending trends, analyze billing items visually, and forecast cloud spend for the next three months.",
    correctService: "AWS Cost Explorer",
    incorrectOptions: ["AWS Budgets", "AWS Pricing Calculator", "AWS Trusted Advisor"],
    explanation: "AWS Cost Explorer is a retrospective visual tool to analyze historical costs, usage, and forecast spending up to three months in the future.",
    keywordClue: "Visual historical graphs, 3-month predictive forecasting, usage breakdown.",
    agentWhisper: "PennyWise Whisper: Cost Explorer visualizes past data and forecasts future bills; Budgets sets active monetary thresholds."
  },
  {
    id: "gs-5",
    domainId: "security-compliance",
    scenarioText: "An enterprise wants to download official third-party ISO and SOC compliance reports of AWS physical infrastructure for an upcoming regulatory audit.",
    correctService: "AWS Artifact",
    incorrectOptions: ["AWS Trusted Advisor", "AWS Inspector", "AWS Secrets Manager"],
    explanation: "AWS Artifact is the central, self-service portal to retrieve AWS security and compliance documents, including SOC and ISO certificates.",
    keywordClue: "Self-service compliance document vault, SOC/ISO audit reports.",
    agentWhisper: "Alex Whisper: AWS Artifact is your compliance library for official auditor-ready reports on AWS data centers."
  },
  {
    id: "gs-6",
    domainId: "cloud-technology",
    scenarioText: "A high-frequency trading platform requires a fully-managed NoSQL database capable of delivering single-digit millisecond latency at any scale.",
    correctService: "Amazon DynamoDB",
    incorrectOptions: ["Amazon RDS", "Amazon Aurora", "Amazon Redshift"],
    explanation: "Amazon DynamoDB is a key-value and document NoSQL database designed to deliver consistent, single-digit millisecond latency at massive scale.",
    keywordClue: "Single-digit millisecond latency, key-value NoSQL, massive auto-scaling throughput.",
    agentWhisper: "Archie Whisper: 'Single-digit millisecond latency' + 'NoSQL' is the classic Amazon DynamoDB hallmark phrase."
  },
  {
    id: "gs-7",
    domainId: "security-compliance",
    scenarioText: "You need a continuous security analysis tool that scans your running Amazon EC2 instances for known software vulnerabilities and unintended network exposure.",
    correctService: "Amazon Inspector",
    incorrectOptions: ["Amazon GuardDuty", "AWS WAF", "AWS Shield"],
    explanation: "Amazon Inspector is an automated security assessment service that proactively scans EC2 instances and container images for software vulnerabilities.",
    keywordClue: "Automated vulnerability scanning, EC2 CVE assessment, package auditing.",
    agentWhisper: "TrapMaster Whisper: Don't confuse GuardDuty (threat intelligence/logs) with Inspector (vulnerability scanner on EC2/containers)."
  },
  {
    id: "gs-8",
    domainId: "cloud-concepts",
    scenarioText: "Your website is suffering from slow page load speeds for users located in Tokyo, while your servers are hosted in North Virginia. You need to cache web assets globally close to users.",
    correctService: "Amazon CloudFront",
    incorrectOptions: ["Amazon Route 53", "AWS Direct Connect", "Amazon VPC"],
    explanation: "Amazon CloudFront is a Content Delivery Network (CDN) that delivers files, videos, and APIs to global users with low latency using edge locations.",
    keywordClue: "Global edge location caching, CDN latency reduction, points of presence (PoPs).",
    agentWhisper: "Archie Whisper: Edge caching for worldwide users to reduce latency is the exact definition of Amazon CloudFront CDN."
  },
  {
    id: "gs-9",
    domainId: "billing-pricing",
    scenarioText: "Your infrastructure team wants to be alerted proactively via email immediately if their monthly RDS spending exceeds a target threshold of $500.",
    correctService: "AWS Budgets",
    incorrectOptions: ["AWS Cost Explorer", "AWS Pricing Calculator", "AWS Billing Conductor"],
    explanation: "AWS Budgets lets you set custom costs and usage limits and alerts you proactively when your costs exceed (or are forecasted to exceed) your budget.",
    keywordClue: "Proactive email alerting, budget threshold alarms, forecasted overage triggers.",
    agentWhisper: "PennyWise Whisper: Setting limits and receiving alert notifications when passing a dollar amount is AWS Budgets."
  },
  {
    id: "gs-10",
    domainId: "cloud-technology",
    scenarioText: "A system architect requires a highly-available, self-healing, relational database compatible with PostgreSQL that can automatically scale storage up to 128 TiB.",
    correctService: "Amazon Aurora",
    incorrectOptions: ["Amazon DynamoDB", "Amazon Redshift", "Amazon ElastiCache"],
    explanation: "Amazon Aurora is a cloud-native, fully managed relational database engine compatible with MySQL/PostgreSQL, offering self-healing disk storage and clustering.",
    keywordClue: "Cloud-native MySQL/Postgres engine, 6-way replica self-healing storage, 128 TiB auto-grow.",
    agentWhisper: "Archie Whisper: Aurora is AWS's proprietary high-performance Postgres/MySQL relational engine with self-healing storage."
  },
  {
    id: "gs-11",
    domainId: "security-compliance",
    scenarioText: "You want an AI-powered service that continuously monitors cloud activities and VPC flow logs to identify suspicious threat patterns or malicious network behavior.",
    correctService: "Amazon GuardDuty",
    incorrectOptions: ["Amazon Inspector", "AWS Trusted Advisor", "AWS Shield"],
    explanation: "Amazon GuardDuty is an active threat detection service that monitors AWS CloudTrail, VPC Flow Logs, and DNS logs to uncover malicious activities.",
    keywordClue: "Intelligent threat detection, CloudTrail & DNS anomaly monitoring, cryptocurrency mining detection.",
    agentWhisper: "Guardian Whisper: GuardDuty continuously analyzes CloudTrail/VPC/DNS telemetry for compromised keys or malware."
  },
  {
    id: "gs-12",
    domainId: "cloud-technology",
    scenarioText: "A team needs to connect multiple EC2 instances to a single shared file system that can dynamically grow or shrink as files are written and deleted.",
    correctService: "Amazon EFS",
    incorrectOptions: ["Amazon EBS", "Amazon S3", "Amazon Glacier"],
    explanation: "Amazon Elastic File System (EFS) provides a simple, serverless, set-and-forget elastic file system that can be mounted to multiple EC2 instances simultaneously.",
    keywordClue: "NFS shared mount, multi-EC2 concurrent access, auto-expanding elastic file system.",
    agentWhisper: "Archie Whisper: Amazon EFS provides standard file storage mountable by multiple EC2 instances simultaneously."
  }
];

export const ScenarioMatcher: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    return Number(localStorage.getItem("aws_match_best_streak") || "0");
  });
  const [history, setHistory] = useState<{ scenario: string; correct: boolean; choice: string }[]>([]);
  const [timer, setTimer] = useState(25);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Hints and Lifelines states
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [activeHintType, setActiveHintType] = useState<"none" | "clue" | "whisper">("none");
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [lifelinesUsedCount, setLifelinesUsedCount] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const currentScenario = GAME_SCENARIOS[currentIdx];

  // Initialize and shuffle choices for current scenario
  useEffect(() => {
    if (currentScenario) {
      const options = [currentScenario.correctService, ...currentScenario.incorrectOptions];
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      setShuffledOptions(options);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setEliminatedOptions([]);
      setActiveHintType("none");
      setTimer(25);
      setQuestionStartTime(Date.now());
    }
  }, [currentIdx, isPlaying]);

  // Game timer
  useEffect(() => {
    if (!isPlaying || isAnswered || gameCompleted) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isAnswered, gameCompleted, currentIdx]);

  const handleTimeOut = () => {
    const reactionTime = Date.now() - questionStartTime;
    setResponseTimes(prev => [...prev, reactionTime]);
    setSelectedAnswer("");
    setIsAnswered(true);
    setStreak(0);
    setHistory((prev) => [
      ...prev,
      {
        scenario: currentScenario.scenarioText,
        correct: false,
        choice: "TIME EXPIRED"
      }
    ]);
  };

  // Lifelines
  const handleUse5050 = () => {
    if (isAnswered || eliminatedOptions.length > 0) return;
    const incorrect = currentScenario.incorrectOptions;
    const shuffled = [...incorrect].sort(() => 0.5 - Math.random());
    setEliminatedOptions(shuffled.slice(0, 2));
    setLifelinesUsedCount(prev => prev + 1);
  };

  const handleShowClue = () => {
    if (isAnswered) return;
    setActiveHintType(activeHintType === "clue" ? "none" : "clue");
    setHintsUsedCount(prev => prev + 1);
  };

  const handleShowWhisper = () => {
    if (isAnswered) return;
    setActiveHintType(activeHintType === "whisper" ? "none" : "whisper");
    setHintsUsedCount(prev => prev + 1);
  };

  const handleOptionClick = (option: string) => {
    if (isAnswered || eliminatedOptions.includes(option)) return;

    const reactionTime = Date.now() - questionStartTime;
    setResponseTimes(prev => [...prev, reactionTime]);

    setSelectedAnswer(option);
    setIsAnswered(true);
    
    const isCorrect = option === currentScenario.correctService;
    if (isCorrect) {
      const timeBonus = Math.round(timer / 2);
      const earnedXP = 15 + timeBonus;
      setScore((prev) => prev + earnedXP);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem("aws_match_best_streak", String(newStreak));
      }
    } else {
      setStreak(0);
    }

    setHistory((prev) => [
      ...prev,
      {
        scenario: currentScenario.scenarioText,
        correct: isCorrect,
        choice: option
      }
    ]);
  };

  const handleNext = () => {
    if (currentIdx < GAME_SCENARIOS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finalizeGame();
    }
  };

  const finalizeGame = () => {
    setGameCompleted(true);
    
    const correctCount = history.filter(h => h.correct).length + (selectedAnswer === currentScenario.correctService ? 1 : 0);
    const totalAttempted = GAME_SCENARIOS.length;
    const accuracy = Math.round((correctCount / totalAttempted) * 100);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Bank XP into gamification profile
    if (score > 0) {
      addXP(score, "Scenario Matcher Speed Run");
    }

    // Award bonus loot crate on high performance
    if (bestStreak >= 4 || accuracy >= 80) {
      awardLootCrate("rare", "Architect Matcher Mastery Crate", `Achieved ${accuracy}% accuracy in Scenario Matcher`);
    }

    // Save extended game metrics
    recordGameSessionMetric({
      mode: "scenario_match",
      title: "AWS Scenario Matcher Speed Run",
      score: score,
      accuracy: accuracy,
      questionsAttempted: totalAttempted,
      questionsCorrect: correctCount,
      maxStreak: bestStreak,
      avgResponseTimeMs: avgResponseTime,
      hintsUsed: hintsUsedCount,
      lifelinesUsed: lifelinesUsedCount,
      xpEarned: score
    });
  };

  const restartGame = () => {
    setCurrentIdx(0);
    setStreak(0);
    setScore(0);
    setHistory([]);
    setGameCompleted(false);
    setIsPlaying(true);
    setEliminatedOptions([]);
    setActiveHintType("none");
    setHintsUsedCount(0);
    setLifelinesUsedCount(0);
    setResponseTimes([]);
  };

  if (!isPlaying && !gameCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-full flex items-center justify-center mx-auto text-[#FF9900]">
          <Zap className="w-8 h-8 fill-current" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#FF9900] tracking-widest font-mono">
            AWS Interactive Learning
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            AWS Scenario-to-Service Matcher
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Train your split-second active recall for the CLF-C02 exam. Read practical customer requirements and match them to the correct AWS service using real architectural hints and lifelines!
          </p>
        </div>

        {bestStreak > 0 && (
          <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-100" />
            Personal Best Streak: <span className="text-amber-600 font-extrabold font-mono">{bestStreak} matches</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => setIsPlaying(true)}
            className="px-6 py-3.5 bg-slate-900 dark:bg-[#FF9900] hover:bg-slate-800 dark:hover:bg-amber-500 text-white dark:text-slate-950 text-xs font-black tracking-wider uppercase rounded-lg inline-flex items-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Speed Run
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="block text-slate-800 dark:text-white font-extrabold text-sm">{GAME_SCENARIOS.length}</span> Scenarios
          </div>
          <div>
            <span className="block text-slate-800 dark:text-white font-extrabold text-sm">25s</span> Timer per Card
          </div>
          <div>
            <span className="block text-slate-800 dark:text-white font-extrabold text-sm">3 Hints</span> Smart Lifelines
          </div>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    const accuracy = history.length > 0 ? Math.round((history.filter(h => h.correct).length / history.length) * 100) : 0;
    
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest font-mono block">
            Speed Run Completed!
          </span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Final Study Scorecard & Analytics
          </h2>
          <p className="text-xs text-slate-500">Telemetry securely logged to your extended game analytics profile.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Accuracy
            </span>
            <span className="text-xl font-black text-emerald-600 block mt-1 font-mono">
              {accuracy}%
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Score Earned
            </span>
            <span className="text-xl font-black text-[#FF9900] block mt-1 font-mono">
              +{score} XP
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Max Streak
            </span>
            <span className="text-xl font-black text-blue-600 block mt-1 font-mono">
              {bestStreak}x
            </span>
          </div>
        </div>

        {/* Detailed incorrect / correct list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Review of Matched Scenarios
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 p-2 rounded-lg scrollbar-thin">
            {history.map((h, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  h.correct 
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                }`}
              >
                {h.correct ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-1">
                    {h.scenario}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Your choice: <span className={h.correct ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>{h.choice}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={restartGame}
            className="px-5 py-3 bg-slate-950 dark:bg-[#FF9900] hover:bg-slate-900 dark:hover:bg-amber-500 text-white dark:text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg inline-flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Play Again
          </button>
          <button
            onClick={() => {
              setGameCompleted(false);
              setIsPlaying(false);
            }}
            className="px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer min-h-[44px]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const isSelectedCorrect = selectedAnswer === currentScenario.correctService;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Top HUD stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Flame className={`w-5 h-5 ${streak > 0 ? "text-amber-500 fill-amber-50" : "text-slate-300"}`} />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                Streak
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                {streak} matches
              </span>
            </div>
          </div>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Progress
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
              {currentIdx + 1} / {GAME_SCENARIOS.length}
            </span>
          </div>
        </div>

        {/* Dynamic Timer Circular bar & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Clock className={`w-4 h-4 ${timer < 8 ? "text-rose-500 animate-pulse" : "text-slate-500"}`} />
            <span className={`text-xs font-black font-mono ${timer < 8 ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
              {timer}s
            </span>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none text-right">
              Score
            </span>
            <span className="text-xs font-black text-amber-500 font-mono block text-right">
              +{score} XP
            </span>
          </div>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-amber-500 to-[#FF9900] h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / GAME_SCENARIOS.length) * 100}%` }}
        />
      </div>

      {/* Interactive Lifelines Toolbar */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Tactical Hints:
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowClue}
            disabled={isAnswered}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              activeHintType === "clue"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-white dark:bg-slate-900 hover:bg-amber-50 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            }`}
            title="Highlight architectural keywords in the scenario"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Keyword Clue</span>
          </button>

          <button
            onClick={handleUse5050}
            disabled={isAnswered || eliminatedOptions.length > 0}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              eliminatedOptions.length > 0
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 opacity-50 cursor-not-allowed"
                : "bg-white dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            }`}
            title="Eliminate 2 incorrect AWS services"
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            <span>50:50</span>
          </button>

          <button
            onClick={handleShowWhisper}
            disabled={isAnswered}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              activeHintType === "whisper"
                ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                : "bg-white dark:bg-slate-900 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            }`}
            title="Get a Socratic whisper from Swarm Agents"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent Whisper</span>
          </button>
        </div>
      </div>

      {/* Active Hint Dropdown Display */}
      {activeHintType === "clue" && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg text-xs space-y-1 text-amber-900 dark:text-amber-200"
        >
          <div className="font-bold flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Key Architectural Indicators:</span>
          </div>
          <p className="font-mono text-[11px] pl-5">{currentScenario.keywordClue}</p>
        </motion.div>
      )}

      {activeHintType === "whisper" && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs space-y-1 text-indigo-900 dark:text-indigo-200"
        >
          <div className="font-bold flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span>Swarm Agent Socratic Guidance:</span>
          </div>
          <p className="italic pl-5">{currentScenario.agentWhisper}</p>
        </motion.div>
      )}

      {/* Scenario card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentScenario.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-50/60 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
              Scenario #{currentIdx + 1}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
              {currentScenario.domainId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
          </div>

          {/* Scenario Text */}
          <div className="p-6 md:p-8 text-center space-y-4">
            <p className="text-sm md:text-base text-slate-800 dark:text-slate-100 font-semibold leading-relaxed max-w-2xl mx-auto">
              "{currentScenario.scenarioText}"
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shuffledOptions.map((option, index) => {
          const isEliminated = eliminatedOptions.includes(option);
          let btnStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800";
          let icon = null;

          if (isEliminated) {
            btnStyle = "bg-slate-100 dark:bg-slate-900/60 text-slate-400 line-through opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800";
          } else if (isAnswered) {
            const isCorrect = option === currentScenario.correctService;
            const isUserChoice = option === selectedAnswer;

            if (isCorrect) {
              btnStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs";
              icon = <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
            } else if (isUserChoice) {
              btnStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200 font-bold shadow-xs";
              icon = <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
            } else {
              btnStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={index}
              disabled={isAnswered || isEliminated}
              onClick={() => handleOptionClick(option)}
              className={`p-4 border rounded-lg text-xs font-bold text-left flex items-center justify-between transition-all leading-normal min-h-[44px] ${
                !isAnswered && !isEliminated ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99]" : ""
              } ${btnStyle}`}
            >
              <span>{option}</span>
              {isEliminated && <span className="text-[10px] font-mono text-slate-400 uppercase">50:50 Cut</span>}
              {icon}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isAnswered && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`p-5 rounded-xl border ${
            isSelectedCorrect 
              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300" 
              : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-slate-700 dark:text-slate-300"
          } space-y-2`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded ${
              isSelectedCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}>
              {isSelectedCorrect ? "Correct Match" : "Incorrect Match"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              The correct answer is: <strong className="text-slate-800 dark:text-white">{currentScenario.correctService}</strong>
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {currentScenario.explanation}
          </p>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-slate-900 dark:bg-[#FF9900] hover:bg-slate-850 dark:hover:bg-amber-500 text-white dark:text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
            >
              {currentIdx < GAME_SCENARIOS.length - 1 ? "Next Scenario" : "Finish Run"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
