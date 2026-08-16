import React, { useState, useEffect } from "react";
import { Zap, Trophy, Flame, Timer, Sparkles, Award, Play, RotateCcw, CheckCircle2, XCircle, Gift, ShieldAlert } from "lucide-react";

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
  }
];

export const LightningRushArena: React.FC = () => {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState<number>(0);
  const [lootClaimed, setLootClaimed] = useState<boolean>(false);
  const [lootReward, setLootReward] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rush" | "loot" | "quests">("rush");

  // Timer effect for Blitz Rush
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("gameover");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startBlitz = () => {
    setGameState("playing");
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCurrentIdx(Math.floor(Math.random() * BLITZ_QUESTIONS.length));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuestionsAnsweredCount(0);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null || gameState !== "playing") return;
    
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
      
      // Bonus time for hot streak!
      if (newStreak % 3 === 0) {
        setTimeLeft((prev) => Math.min(90, prev + 5));
      }
    } else {
      setStreak(0);
    }

    setQuestionsAnsweredCount((prev) => prev + 1);

    // Next question after brief pause
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentIdx(Math.floor(Math.random() * BLITZ_QUESTIONS.length));
    }, 800);
  };

  const openLootCrate = () => {
    if (lootClaimed) return;
    const rewards = [
      "🌟 +500 Bonus Exam XP!",
      "⚡ Double XP Multiplier for 24 Hours!",
      "🛡️ Legendary 'Cloud Guru' Badge Unlocked!",
      "📦 Secret Exam Cheat Sheet Bundle!",
      "💎 250 Algorand Testnet Tokens!"
    ];
    const chosen = rewards[Math.floor(Math.random() * rewards.length)];
    setLootReward(chosen);
    setLootClaimed(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-xl shadow-xl text-white border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full border border-amber-500/30">
                🎮 Addictive Engagement Hub
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold tracking-wider rounded-full border border-indigo-500/30">
                Live Gamification
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              AWS Blitz Rush & Loot Arena
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
              Boost your dopamine and lock in AWS knowledge with high-speed 60-second trivia sprints, daily mystery crates, and daily streak quests!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-center px-3 border-r border-slate-700">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Best Combo</div>
              <div className="text-xl font-black text-amber-400">{maxStreak}x</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Top Rush Score</div>
              <div className="text-xl font-black text-emerald-400">{score} XP</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-indigo-900/60 pt-4 flex-wrap">
          <button
            onClick={() => setActiveTab("rush")}
            className={`px-4 py-2 rounded-xs text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "rush"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            60s Lightning Rush
          </button>

          <button
            onClick={() => setActiveTab("loot")}
            className={`px-4 py-2 rounded-xs text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "loot"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Gift className="w-4 h-4 text-pink-400" />
            Daily Mystery Loot Crate
          </button>

          <button
            onClick={() => setActiveTab("quests")}
            className={`px-4 py-2 rounded-xs text-xs font-black transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === "quests"
                ? "bg-[#FF9900] text-slate-950 shadow-md"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Daily Quests & Streaks
          </button>
        </div>
      </div>

      {/* Tab 1: 60s Lightning Rush */}
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
                Answer as many Cloud Practitioner questions as possible before the clock hits zero! Build hot streaks (3+ correct) to trigger multiplier bonuses and +5s time extensions.
              </p>
              <button
                onClick={startBlitz}
                className="px-8 py-3.5 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-sm rounded-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer min-h-[44px]"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Lightning Rush Now
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="space-y-6">
              {/* HUD */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
                    <Timer className="w-5 h-5 animate-spin" />
                    <span className="text-xl font-mono">{timeLeft}s</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Streak</div>
                    <div className="text-base font-black text-emerald-500 flex items-center gap-1">
                      <Flame className="w-4 h-4 fill-emerald-500" />
                      {streak}x {streak >= 3 ? "🔥 (MAX BONUS)" : ""}
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
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold rounded">
                      {BLITZ_QUESTIONS[currentIdx].category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Answered: {questionsAnsweredCount}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {BLITZ_QUESTIONS[currentIdx].question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {BLITZ_QUESTIONS[currentIdx].options.map((opt, i) => {
                      let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#FF9900]";
                      if (selectedAnswer !== null) {
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
                          disabled={selectedAnswer !== null}
                          className={`p-4 rounded-lg border text-left font-medium text-xs md:text-sm transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${btnStyle}`}
                        >
                          <span>{opt}</span>
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
                  Fantastic sprint! You answered {questionsAnsweredCount} questions with a max streak of {maxStreak}x.
                </p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-around">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono">Final XP</div>
                  <div className="text-2xl font-black text-[#FF9900]">{score}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono">Max Streak</div>
                  <div className="text-2xl font-black text-emerald-500">{maxStreak}x</div>
                </div>
              </div>

              <button
                onClick={startBlitz}
                className="w-full py-3.5 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-sm rounded-sm shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again & Beat High Score
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daily Mystery Loot Crate */}
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
              Claim your free daily mystery crate to unlock bonus exam XP, token multipliers, and exclusive badges!
            </p>
          </div>

          {lootReward ? (
            <div className="bg-pink-500/10 border border-pink-500/30 p-6 rounded-xl space-y-3 animate-fade-in">
              <div className="text-xs uppercase tracking-widest font-mono text-pink-500 font-bold">
                🎉 Loot Unlocked Successfully!
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {lootReward}
              </div>
              <p className="text-xs text-slate-500">
                Your reward has been added to your profile inventory and cloud sync profile.
              </p>
            </div>
          ) : (
            <button
              onClick={openLootCrate}
              className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm rounded-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-5 h-5" />
              Open Mystery Crate Now
            </button>
          )}
        </div>
      )}

      {/* Tab 3: Daily Quests & Streaks */}
      {activeTab === "quests" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Daily Addictive Quests
              </h2>
              <p className="text-xs text-slate-500">Complete quests daily to maintain your study streak and earn badge rewards.</p>
            </div>
            <div className="px-3 py-1 bg-amber-500/10 text-[#FF9900] font-mono text-xs font-bold rounded border border-amber-500/20">
              🔥 7-Day Streak Active
            </div>
          </div>

          <div className="space-y-3">
            {[
              { title: "Complete 1 Lightning Rush Session", reward: "+250 XP", done: score > 0 },
              { title: "Review 5 AWS Flashcards", reward: "+150 XP", done: false },
              { title: "Inspect 2 Architecture Topologies", reward: "+200 XP", done: false },
              { title: "Solve a Trick Exam Question", reward: "+300 XP", done: false }
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
