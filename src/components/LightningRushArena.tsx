import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Trophy, 
  Flame, 
  Timer, 
  Sparkles, 
  Award, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Gift, 
  ShieldAlert,
  ChevronRight,
  Crown,
  Key,
  Layers,
  ArrowUpRight,
  Scissors,
  Snowflake,
  Shield,
  BarChart3,
  Lightbulb,
  Clock,
  TrendingUp,
  Activity,
  Check
} from "lucide-react";
import { 
  getGamificationProfile, 
  addXP, 
  awardLootCrate, 
  openLootCrate, 
  claimDailyCrate, 
  subscribeGamification, 
  getXPForNextLevel, 
  recordGameSessionMetric,
  consumeLifeline,
  replenishLifelines,
  LootCrate, 
  LootItem, 
  RARITY_COLORS 
} from "../services/gamificationService";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

const BLITZ_QUESTIONS: Question[] = [
  {
    id: "blitz-1",
    question: "Which AWS service provides managed relational database scaling with support for MySQL, PostgreSQL, and Aurora?",
    options: ["Amazon S3", "Amazon RDS", "Amazon DynamoDB", "Amazon CloudFront"],
    correctIndex: 1,
    explanation: "Amazon RDS (Relational Database Service) makes it easy to set up, operate, and scale a relational database in the cloud.",
    category: "Databases"
  },
  {
    id: "blitz-2",
    question: "What is the primary benefit of deploying applications across multiple AWS Availability Zones (AZs)?",
    options: ["Lower compute cost", "High availability and fault tolerance", "Unlimited disk storage", "Faster CPU clock speed"],
    correctIndex: 1,
    explanation: "Multiple AZs protect your applications against data center failures by providing redundant power, networking, and connectivity.",
    category: "Architecture"
  },
  {
    id: "blitz-3",
    question: "Which AWS IAM feature allows temporary, secure access to AWS resources without sharing long-term credentials?",
    options: ["IAM Users", "IAM Groups", "IAM Roles and STS", "Root Account Access Keys"],
    correctIndex: 2,
    explanation: "IAM Roles combined with AWS Security Token Service (STS) grant temporary credentials for federated users and cross-account access.",
    category: "Security"
  },
  {
    id: "blitz-4",
    question: "Which AWS service is designed for ultra-low latency content delivery globally using edge locations?",
    options: ["Amazon S3 Glacier", "Amazon CloudFront", "AWS Lambda", "Amazon VPC"],
    correctIndex: 1,
    explanation: "Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, and APIs globally with low latency.",
    category: "Networking"
  },
  {
    id: "blitz-5",
    question: "Under the AWS Shared Responsibility Model, which component is strictly the customer's responsibility in Amazon EC2?",
    options: ["Host hardware maintenance", "Data center physical security", "Guest OS patching and firewall configuration", "Hypervisor virtualization layer"],
    correctIndex: 2,
    explanation: "Customers are responsible for security IN the cloud, which includes guest operating systems, software updates, and firewall configurations.",
    category: "Compliance"
  },
  {
    id: "blitz-6",
    question: "Which AWS tool provides personalized recommendations to reduce cost, improve security, and optimize performance?",
    options: ["AWS Billing Console", "AWS Trusted Advisor", "AWS CloudTrail", "AWS Config"],
    correctIndex: 1,
    explanation: "AWS Trusted Advisor inspects your AWS environment and makes recommendations for saving money, improving system performance and reliability.",
    category: "Management & Governance"
  },
  {
    id: "blitz-7",
    question: "What is the key-value NoSQL database service managed by AWS that delivers single-digit millisecond performance at any scale?",
    options: ["Amazon Aurora", "Amazon DynamoDB", "Amazon Redshift", "Amazon RDS"],
    correctIndex: 1,
    explanation: "Amazon DynamoDB is a key-value and document database that delivers single-digit millisecond performance at any scale.",
    category: "Databases"
  },
  {
    id: "blitz-8",
    question: "Which AWS service allows you to run code without provisioning or managing servers?",
    options: ["Amazon EC2", "AWS Lambda", "Amazon ECS", "Amazon EBS"],
    correctIndex: 1,
    explanation: "AWS Lambda is a serverless compute service that lets you run code for virtually any type of application or backend service without provisioning servers.",
    category: "Compute"
  },
  {
    id: "blitz-9",
    question: "Which AWS service provides an isolated private virtual network for your AWS cloud resources?",
    options: ["Amazon Route 53", "Amazon VPC", "AWS Direct Connect", "AWS Transit Gateway"],
    correctIndex: 1,
    explanation: "Amazon Virtual Private Cloud (VPC) gives you full control over your virtual networking environment, including subnets, route tables, and gateways.",
    category: "Networking"
  },
  {
    id: "blitz-10",
    question: "Which AWS pricing model provides up to a 90% discount on unused EC2 capacity for fault-tolerant workloads?",
    options: ["On-Demand Instances", "Reserved Instances", "Spot Instances", "Dedicated Hosts"],
    correctIndex: 2,
    explanation: "EC2 Spot Instances let you take advantage of unused EC2 capacity in the AWS cloud at up to 90% off the On-Demand price.",
    category: "Billing"
  }
];

export const LightningRushArena: React.FC = () => {
  const [profile, setProfile] = useState(getGamificationProfile());
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState<number>(0);
  const [questionsCorrectCount, setQuestionsCorrectCount] = useState<number>(0);

  // Lifelines state
  const [eliminatedIndexes, setEliminatedIndexes] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [lifelinesUsedInSession, setLifelinesUsedInSession] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  // Navigation & Loot modal states
  const [activeTab, setActiveTab] = useState<"rush" | "loot" | "inventory" | "quests" | "metrics">("rush");
  const [openedCrateResult, setOpenedCrateResult] = useState<{ crate: LootCrate; rewards: LootItem[]; xpEarned: number } | null>(null);
  const [dailyClaimStatus, setDailyClaimStatus] = useState<string | null>(null);

  // Subscribe to gamification state changes across app
  useEffect(() => {
    return subscribeGamification((newProfile) => {
      setProfile(newProfile);
    });
  }, []);

  // Timer effect for Blitz Rush
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0 && !isFrozen) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isFrozen]);

  const handleGameOver = () => {
    setGameState("gameover");
    // Award all earned score as real XP
    if (score > 0) {
      addXP(score, "Blitz Rush Sprint Session");
    }
    // High streak bonus crate
    if (maxStreak >= 4) {
      awardLootCrate("rare", "Hot Streak Mastery Crate", `Achieved ${maxStreak}x combo in Blitz Rush`);
    }

    // Calculate session metrics and record
    const accuracy = questionsAnsweredCount > 0 
      ? Math.round((questionsCorrectCount / questionsAnsweredCount) * 100) 
      : 0;
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0;

    recordGameSessionMetric({
      mode: "blitz_rush",
      title: "60-Second Blitz Rush Sprint",
      score: score,
      accuracy: accuracy,
      questionsAttempted: questionsAnsweredCount,
      questionsCorrect: questionsCorrectCount,
      maxStreak: maxStreak,
      avgResponseTimeMs: avgResponseTime,
      hintsUsed: 0,
      lifelinesUsed: lifelinesUsedInSession,
      xpEarned: score
    });
  };

  const startBlitz = () => {
    setGameState("playing");
    setTimeLeft(60);
    setIsFrozen(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCurrentIdx(Math.floor(Math.random() * BLITZ_QUESTIONS.length));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuestionsAnsweredCount(0);
    setQuestionsCorrectCount(0);
    setEliminatedIndexes([]);
    setShieldActive(false);
    setLifelinesUsedInSession(0);
    setResponseTimes([]);
    setQuestionStartTime(Date.now());
  };

  // In-Game Lifelines
  const handleUse5050 = () => {
    if (gameState !== "playing" || eliminatedIndexes.length > 0) return;
    const currentQ = BLITZ_QUESTIONS[currentIdx];
    const incorrectIndexes = [0, 1, 2, 3].filter(idx => idx !== currentQ.correctIndex);
    const shuffled = [...incorrectIndexes].sort(() => 0.5 - Math.random());
    setEliminatedIndexes(shuffled.slice(0, 2));
    setLifelinesUsedInSession(prev => prev + 1);
  };

  const handleUseFreeze = () => {
    if (gameState !== "playing" || isFrozen) return;
    setIsFrozen(true);
    setLifelinesUsedInSession(prev => prev + 1);
    setTimeout(() => {
      setIsFrozen(false);
    }, 7000); // 7-second time freeze
  };

  const handleUseShield = () => {
    if (gameState !== "playing" || shieldActive) return;
    setShieldActive(true);
    setLifelinesUsedInSession(prev => prev + 1);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null || gameState !== "playing" || eliminatedIndexes.includes(index)) return;
    
    const reactionTime = Date.now() - questionStartTime;
    setResponseTimes(prev => [...prev, reactionTime]);

    setSelectedAnswer(index);
    const q = BLITZ_QUESTIONS[currentIdx];
    const correct = index === q.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      const multiplier = Math.min(5, 1 + Math.floor(streak / 3));
      const points = 100 * multiplier;
      setScore((prev) => prev + points);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setQuestionsCorrectCount(prev => prev + 1);
      
      // Bonus time for hot streak!
      if (newStreak % 3 === 0) {
        setTimeLeft((prev) => Math.min(90, prev + 5));
      }
    } else {
      if (shieldActive) {
        setShieldActive(false); // Shield absorbed the combo loss!
      } else {
        setStreak(0);
      }
    }

    setQuestionsAnsweredCount((prev) => prev + 1);

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setEliminatedIndexes([]);
      setQuestionStartTime(Date.now());
      setCurrentIdx(Math.floor(Math.random() * BLITZ_QUESTIONS.length));
    }, 600);
  };

  const handleClaimDailyCrate = () => {
    const res = claimDailyCrate();
    setDailyClaimStatus(res.message);
    if (res.success && res.crate) {
      handleOpenCrate(res.crate.id);
    }
  };

  const handleOpenCrate = (crateId: string) => {
    try {
      const outcome = openLootCrate(crateId);
      setOpenedCrateResult(outcome);
    } catch (err: any) {
      alert(err.message || "Failed to open crate.");
    }
  };

  const { currentLevelXP, maxLevelXP, percentage } = getXPForNextLevel(profile.xp);
  const unopenedCrates = profile.cratesInventory.filter((c) => !c.isOpened);
  const metrics = profile.gameMetrics;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-xl shadow-xl text-white border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full border border-amber-500/30">
                🎮 AWS Rush & Loot Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full border border-emerald-500/30">
                Level {profile.level} Cloud Practitioner
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              AWS Blitz Rush & Loot Arena
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
              Rapid 60-second trivia sprints, rare mystery loot drops, tactical in-game lifelines, and real-time game analytics!
            </p>

            {/* XP Bar */}
            <div className="mt-4 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Total XP: <strong className="text-amber-400 font-black">{profile.xp}</strong></span>
                <span>Level {profile.level + 1} in {maxLevelXP - currentLevelXP} XP</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-[#FF9900] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Unopened Crates</div>
              <div className="text-xl font-black text-pink-400 flex items-center justify-center gap-1">
                <Gift className="w-4 h-4" />
                {unopenedCrates.length}
              </div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Streak</div>
              <div className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                {profile.streakDays}d
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Rating Tier</div>
              <div className="text-sm font-black text-emerald-400">{metrics?.ratingTier || "Novice"}</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-indigo-900/60 pt-4 flex-wrap">
          <button
            onClick={() => setActiveTab("rush")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "rush"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            60s Blitz Sprint
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "metrics"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Game Metrics & Analytics
          </button>

          <button
            onClick={() => setActiveTab("loot")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "loot"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Gift className="w-4 h-4 text-pink-400" />
            Daily Mystery Crate
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "inventory"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            Loot Crate Vault ({unopenedCrates.length})
          </button>

          <button
            onClick={() => setActiveTab("quests")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "quests"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            Daily Quests
          </button>
        </div>
      </div>

      {/* REWARD MODAL */}
      {openedCrateResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-pink-500/50 p-6 md:p-8 rounded-2xl max-w-lg w-full text-center space-y-5 shadow-2xl text-white relative">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 rounded-3xl flex items-center justify-center mx-auto border border-pink-500/40 shadow-inner">
              <Sparkles className="w-10 h-10 animate-spin" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-pink-400">
                {openedCrateResult.crate.rarity.toUpperCase()} CRATE OPENED!
              </span>
              <h2 className="text-2xl font-black text-white">{openedCrateResult.crate.title}</h2>
            </div>

            <div className="space-y-3">
              {openedCrateResult.rewards.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpenedCrateResult(null)}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-[#FF9900] text-slate-950 font-black text-sm rounded-lg shadow-lg hover:opacity-95 transition-opacity cursor-pointer min-h-[44px]"
            >
              Collect Rewards to Inventory
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: 60s Blitz Sprint */}
      {activeTab === "rush" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {gameState === "idle" && (
            <div className="text-center py-12 space-y-4 max-w-xl mx-auto">
              <div className="w-20 h-20 bg-amber-500/10 text-[#FF9900] rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-500/20 animate-pulse">
                <Zap className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Ready for the 60-Second AWS Blitz?
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Answer as many Cloud Practitioner questions as possible before the clock hits zero! Use in-game lifelines (50:50, Time Freeze, Shield) and build hot streaks (3+ correct) for massive multiplier bonuses.
              </p>
              <button
                onClick={startBlitz}
                className="px-8 py-3.5 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-sm rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer min-h-[44px]"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Lightning Rush Now
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="space-y-6">
              {/* HUD */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-black text-sm ${
                    isFrozen 
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 animate-pulse" 
                      : timeLeft <= 10 
                        ? "bg-rose-500/20 border-rose-500 text-rose-500 animate-bounce" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  }`}>
                    <Timer className="w-5 h-5" />
                    <span className="text-xl">{timeLeft}s {isFrozen ? "(FROZEN ❄️)" : ""}</span>
                  </div>

                  {shieldActive && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Shield Active
                    </span>
                  )}
                </div>

                {/* Tactical In-Game Lifelines Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUse5050}
                    disabled={eliminatedIndexes.length > 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      eliminatedIndexes.length > 0 
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 opacity-50 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                    }`}
                    title="Eliminate 2 wrong answers"
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                    <span>50:50</span>
                  </button>

                  <button
                    onClick={handleUseFreeze}
                    disabled={isFrozen}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isFrozen 
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 opacity-70 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                    }`}
                    title="Freeze clock for 7 seconds"
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Freeze (7s)</span>
                  </button>

                  <button
                    onClick={handleUseShield}
                    disabled={shieldActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      shieldActive 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-400 opacity-70 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                    }`}
                    title="Absorb next wrong answer without breaking combo"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Shield</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Streak</div>
                    <div className="text-base font-black text-emerald-500 flex items-center gap-1">
                      <Flame className="w-4 h-4 fill-emerald-500" />
                      {streak}x {streak >= 3 ? "🔥 (COMBO)" : ""}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Score</div>
                    <div className="text-base font-black text-[#FF9900]">{score} XP</div>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              {BLITZ_QUESTIONS[currentIdx] && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold rounded">
                      {BLITZ_QUESTIONS[currentIdx].category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Answered: {questionsAnsweredCount} (Correct: {questionsCorrectCount})
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {BLITZ_QUESTIONS[currentIdx].question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {BLITZ_QUESTIONS[currentIdx].options.map((opt, i) => {
                      const isEliminated = eliminatedIndexes.includes(i);
                      let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#FF9900]";
                      
                      if (isEliminated) {
                        btnStyle = "bg-slate-100 dark:bg-slate-900/60 text-slate-400 line-through opacity-40 cursor-not-allowed";
                      } else if (selectedAnswer !== null) {
                        if (i === BLITZ_QUESTIONS[currentIdx].correctIndex) {
                          btnStyle = "bg-emerald-600 text-white border-emerald-500 shadow-md animate-bounce";
                        } else if (i === selectedAnswer) {
                          btnStyle = "bg-rose-600 text-white border-rose-500";
                        } else {
                          btnStyle = "opacity-50 bg-slate-100 dark:bg-slate-800 text-slate-400";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswerSelect(i)}
                          disabled={selectedAnswer !== null || isEliminated}
                          className={`p-4 rounded-lg border text-left font-medium text-xs md:text-sm transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isEliminated && <span className="text-[10px] font-mono text-slate-400 uppercase">50:50 Cut</span>}
                          {selectedAnswer !== null && i === BLITZ_QUESTIONS[currentIdx].correctIndex && (
                            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                          )}
                          {selectedAnswer !== null && i === selectedAnswer && i !== BLITZ_QUESTIONS[currentIdx].correctIndex && (
                            <XCircle className="w-5 h-5 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState === "gameover" && (
            <div className="text-center py-12 space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Blitz Rush Complete!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Sprint logged to your cloud analytics! You answered {questionsAnsweredCount} questions ({questionsCorrectCount} correct) and banked +{score} XP!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-100 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Final XP</div>
                  <div className="text-xl font-black text-[#FF9900]">+{score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Accuracy</div>
                  <div className="text-xl font-black text-emerald-500">
                    {questionsAnsweredCount > 0 ? Math.round((questionsCorrectCount / questionsAnsweredCount) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Max Streak</div>
                  <div className="text-xl font-black text-orange-500">{maxStreak}x</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startBlitz}
                  className="flex-1 py-3.5 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-sm rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  onClick={() => setActiveTab("metrics")}
                  className="px-4 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  View Metrics
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Game Metrics & Analytics Dashboard */}
      {activeTab === "metrics" && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Game Performance & Skill Metrics
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-500 font-mono text-xs font-bold rounded-full">
                  {metrics?.ratingTier || "Novice"} Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive analytics tracked across Trick Simulators, 60s Blitz Sprints, and Socratic Practice.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Sessions Logged</span>
              <span className="text-lg font-black text-indigo-500">{metrics?.totalGamesPlayed || 0}</span>
            </div>
          </div>

          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Accuracy</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics?.overallAccuracy || 0}%
              </div>
              <div className="text-[10px] text-slate-400">
                {metrics?.totalQuestionsCorrect || 0} of {metrics?.totalQuestionsAnswered || 0} correct
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>All-Time Streak</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {metrics?.allTimeHighStreak || 0}x
              </div>
              <div className="text-[10px] text-slate-400">Max consecutive answers</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Avg Reaction Speed</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {metrics?.avgAnswerTimeMs ? (metrics.avgAnswerTimeMs / 1000).toFixed(1) : "2.4"}s
              </div>
              <div className="text-[10px] text-slate-400">Fastest: {metrics?.fastestAnswerTimeMs ? (metrics.fastestAnswerTimeMs / 1000).toFixed(1) : "0.9"}s</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>High Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {metrics?.allTimeHighScore || 0}
              </div>
              <div className="text-[10px] text-slate-400">{metrics?.totalLifelinesUsed || 0} lifelines engaged</div>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Exam Domain Knowledge Distribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics?.domainStats && Object.entries(metrics.domainStats).map(([key, domain]) => {
                const pct = domain.total > 0 ? Math.round((domain.correct / domain.total) * 100) : 0;
                return (
                  <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{domain.name}</span>
                      <span className="font-mono text-slate-400">{domain.correct}/{domain.total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Game Sessions Log */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Recent Game Sprint Logs
            </h3>
            {metrics?.recentSessions && metrics.recentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Score / XP</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Max Streak</th>
                      <th className="p-3">Lifelines</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {metrics.recentSessions.slice(0, 5).map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-medium">{sess.title}</td>
                        <td className="p-3 font-mono font-bold text-amber-500">+{sess.score}</td>
                        <td className="p-3 font-mono font-bold text-emerald-500">{sess.accuracy}%</td>
                        <td className="p-3 font-mono">{sess.maxStreak}x</td>
                        <td className="p-3">{sess.lifelinesUsed} used</td>
                        <td className="p-3 text-[11px] text-slate-400">{new Date(sess.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                No recent sprint sessions logged yet. Complete a 60s Blitz Sprint or Exam Trap Simulator to generate live telemetry!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Daily Mystery Crate */}
      {activeTab === "loot" && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-pink-500/30">
            <Gift className="w-12 h-12 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Daily Mystery Loot Crate
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Claim your free daily mystery crate to unlock bonus exam XP, XP multipliers, and exclusive badges!
            </p>
          </div>

          {dailyClaimStatus && (
            <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-xl text-xs font-bold text-pink-400">
              {dailyClaimStatus}
            </div>
          )}

          <button
            onClick={handleClaimDailyCrate}
            className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm rounded-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer min-h-[44px]"
          >
            <Sparkles className="w-5 h-5" />
            Claim Daily Crate Now
          </button>
        </div>
      )}

      {/* TAB 4: Inventory Vault */}
      {activeTab === "inventory" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Your Loot Crate Inventory
              </h2>
              <p className="text-xs text-slate-500">Unopened and unlocked crates earned across the app.</p>
            </div>
            <div className="px-3 py-1 bg-pink-500/10 text-pink-400 font-mono text-xs font-bold rounded border border-pink-500/20">
              {unopenedCrates.length} Crates Ready to Open
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.cratesInventory.map((crate) => {
              const rarityStyle = RARITY_COLORS[crate.rarity] || RARITY_COLORS.common;
              return (
                <div 
                  key={crate.id} 
                  className={`p-5 rounded-xl border ${rarityStyle.border} ${rarityStyle.bg} space-y-4 flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/40 ${rarityStyle.text}`}>
                        {crate.rarity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {crate.isOpened ? "Opened" : "Ready"}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{crate.title}</h3>
                    <p className="text-[11px] text-slate-300">Source: {crate.source}</p>
                  </div>

                  {crate.isOpened ? (
                    <div className="text-xs text-slate-400 font-mono py-2 text-center border-t border-slate-800">
                      ✓ Collected
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenCrate(crate.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#FF9900] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-md shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Open This Crate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Daily Quests */}
      {activeTab === "quests" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Daily Study Quests
              </h2>
              <p className="text-xs text-slate-500">Complete quests daily to maintain your study streak and earn badge rewards.</p>
            </div>
            <div className="px-3 py-1 bg-amber-500/10 text-[#FF9900] font-mono text-xs font-bold rounded border border-amber-500/20">
              🔥 {profile.streakDays}-Day Streak Active
            </div>
          </div>

          <div className="space-y-3">
            {[
              { title: "Complete 1 Lightning Rush Session", reward: "+250 XP", done: score > 0 },
              { title: "Ask Professor Cloud a Socratic Concept Question", reward: "+150 XP", done: true },
              { title: "Run 1 Agent Swarm Autonomous Evaluation", reward: "+200 XP", done: false },
              { title: "Open a Daily Mystery Loot Crate", reward: "+300 XP", done: unopenedCrates.length === 0 }
            ].map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${q.done ? "bg-emerald-500 text-white" : "border-2 border-slate-400 text-transparent"}`}>
                    ✓
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{q.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Reward: {q.reward}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-black rounded-xs ${q.done ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                  {q.done ? "Completed" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
