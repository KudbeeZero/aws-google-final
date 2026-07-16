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
  ArrowRight
} from "lucide-react";

interface Scenario {
  id: string;
  domainId: string;
  scenarioText: string;
  correctService: string;
  incorrectOptions: string[];
  explanation: string;
}

const GAME_SCENARIOS: Scenario[] = [
  {
    id: "gs-1",
    domainId: "cloud-concepts",
    scenarioText: "Your startup needs to host static images and product videos. The storage solution must be highly durable, virtually unlimited, and cost-effective.",
    correctService: "Amazon S3",
    incorrectOptions: ["Amazon EBS", "Amazon EFS", "AWS Snowball"],
    explanation: "Amazon Simple Storage Service (S3) provides highly durable, scalable object storage specifically designed for unstructured data like images and videos."
  },
  {
    id: "gs-2",
    domainId: "cloud-technology",
    scenarioText: "You want to run a lightweight data conversion script whenever an image is uploaded, without managing or paying for any continuous virtual servers.",
    correctService: "AWS Lambda",
    incorrectOptions: ["Amazon EC2", "AWS Elastic Beanstalk", "Amazon ECS"],
    explanation: "AWS Lambda is a serverless compute service that runs your code in response to triggers (like S3 uploads) and automatically handles the underlying compute resources."
  },
  {
    id: "gs-3",
    domainId: "security-compliance",
    scenarioText: "A retail client needs to block specific web application exploits like SQL Injections and Cross-Site Scripting (XSS) from reaching their web application servers.",
    correctService: "AWS WAF",
    incorrectOptions: ["AWS Shield", "Amazon GuardDuty", "AWS Inspector"],
    explanation: "AWS Web Application Firewall (WAF) filters HTTP/HTTPS web requests based on custom rules to block application-layer attacks like SQL injection and XSS."
  },
  {
    id: "gs-4",
    domainId: "billing-pricing",
    scenarioText: "Your CFO wants to visualize historic spending trends, analyze billing items visually, and forecast cloud spend for the next three months.",
    correctService: "AWS Cost Explorer",
    incorrectOptions: ["AWS Budgets", "AWS Pricing Calculator", "AWS Trusted Advisor"],
    explanation: "AWS Cost Explorer is a retrospective visual tool to analyze historical costs, usage, and forecast spending up to three months in the future."
  },
  {
    id: "gs-5",
    domainId: "security-compliance",
    scenarioText: "An enterprise wants to download official third-party ISO and SOC compliance reports of AWS physical infrastructure for an upcoming regulatory audit.",
    correctService: "AWS Artifact",
    incorrectOptions: ["AWS Trusted Advisor", "AWS Inspector", "AWS Secrets Manager"],
    explanation: "AWS Artifact is the central, self-service portal to retrieve AWS security and compliance documents, including SOC and ISO certificates."
  },
  {
    id: "gs-6",
    domainId: "cloud-technology",
    scenarioText: "A high-frequency trading platform requires a fully-managed NoSQL database capable of delivering single-digit millisecond latency at any scale.",
    correctService: "Amazon DynamoDB",
    incorrectOptions: ["Amazon RDS", "Amazon Aurora", "Amazon Redshift"],
    explanation: "Amazon DynamoDB is a key-value and document NoSQL database designed to deliver consistent, single-digit millisecond latency at massive scale."
  },
  {
    id: "gs-7",
    domainId: "security-compliance",
    scenarioText: "You need a continuous security analysis tool that scans your running Amazon EC2 instances for known software vulnerabilities and unintended network exposure.",
    correctService: "Amazon Inspector",
    incorrectOptions: ["Amazon GuardDuty", "AWS WAF", "AWS Shield"],
    explanation: "Amazon Inspector is an automated security assessment service that proactively scans EC2 instances and container images for software vulnerabilities."
  },
  {
    id: "gs-8",
    domainId: "cloud-concepts",
    scenarioText: "Your website is suffering from slow page load speeds for users located in Tokyo, while your servers are hosted in North Virginia. You need to cache web assets globally close to users.",
    correctService: "Amazon CloudFront",
    incorrectOptions: ["Amazon Route 53", "AWS Direct Connect", "Amazon VPC"],
    explanation: "Amazon CloudFront is a Content Delivery Network (CDN) that delivers files, videos, and APIs to global users with low latency using edge locations."
  },
  {
    id: "gs-9",
    domainId: "billing-pricing",
    scenarioText: "Your infrastructure team wants to be alerted proactively via email immediately if their monthly RDS spending exceeds a target threshold of $500.",
    correctService: "AWS Budgets",
    incorrectOptions: ["AWS Cost Explorer", "AWS Pricing Calculator", "AWS Billing Conductor"],
    explanation: "AWS Budgets lets you set custom costs and usage limits and alerts you proactively when your costs exceed (or are forecasted to exceed) your budget."
  },
  {
    id: "gs-10",
    domainId: "cloud-technology",
    scenarioText: "A system architect requires a highly-available, self-healing, relational database compatible with PostgreSQL that can automatically scale storage up to 128 TiB.",
    correctService: "Amazon Aurora",
    incorrectOptions: ["Amazon DynamoDB", "Amazon Redshift", "Amazon ElastiCache"],
    explanation: "Amazon Aurora is a cloud-native, fully managed relational database engine compatible with MySQL/PostgreSQL, offering self-healing disk storage and clustering."
  },
  {
    id: "gs-11",
    domainId: "security-compliance",
    scenarioText: "You want an AI-powered service that continuously monitors cloud activities and VPC flow logs to identify suspicious threat patterns or malicious network behavior.",
    correctService: "Amazon GuardDuty",
    incorrectOptions: ["Amazon Inspector", "AWS Trusted Advisor", "AWS Shield"],
    explanation: "Amazon GuardDuty is an active threat detection service that monitors AWS CloudTrail, VPC Flow Logs, and DNS logs to uncover malicious activities."
  },
  {
    id: "gs-12",
    domainId: "cloud-technology",
    scenarioText: "A team needs to connect multiple EC2 instances to a single shared file system that can dynamically grow or shrink as files are written and deleted.",
    correctService: "Amazon EFS",
    incorrectOptions: ["Amazon EBS", "Amazon S3", "Amazon Glacier"],
    explanation: "Amazon Elastic File System (EFS) provides a simple, serverless, set-and-forget elastic file system that can be mounted to multiple EC2 instances simultaneously."
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
      setTimer(25);
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

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;

    setSelectedAnswer(option);
    setIsAnswered(true);
    
    const isCorrect = option === currentScenario.correctService;
    if (isCorrect) {
      setScore((prev) => prev + 10 + Math.round(timer / 2));
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
      setGameCompleted(true);
    }
  };

  const restartGame = () => {
    setCurrentIdx(0);
    setStreak(0);
    setScore(0);
    setHistory([]);
    setGameCompleted(false);
    setIsPlaying(true);
  };

  if (!isPlaying && !gameCompleted) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8 max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-full flex items-center justify-center mx-auto text-[#FF9900]">
          <Zap className="w-8 h-8 fill-current" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#FF9900] tracking-widest font-mono">
            AWS Interactive Learning
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            AWS Scenario-to-Service Matcher
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Train your split-second active recall for the CLF-C02 exam. Read practical customer requirements and match them to the correct AWS service under a countdown!
          </p>
        </div>

        {bestStreak > 0 && (
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-600">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-100" />
            Personal Best Streak: <span className="text-amber-600 font-extrabold font-mono">{bestStreak} matches</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => setIsPlaying(true)}
            className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 text-xs font-black tracking-wider uppercase rounded-sm inline-flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-102"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Speed Run
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100">
          <div>
            <span className="block text-slate-800 font-extrabold text-sm">12</span> Scenarios
          </div>
          <div>
            <span className="block text-slate-800 font-extrabold text-sm">25s</span> Timer per Card
          </div>
          <div>
            <span className="block text-slate-800 font-extrabold text-sm">+Time Bonus</span> High Score
          </div>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    const accuracy = history.length > 0 ? Math.round((history.filter(h => h.correct).length / history.length) * 100) : 0;
    
    return (
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest font-mono block">
            Speed Run Completed!
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Final Study scorecard
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-sm">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Accuracy
            </span>
            <span className="text-xl font-black text-slate-800 block mt-1 font-mono">
              {accuracy}%
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Score
            </span>
            <span className="text-xl font-black text-[#FF9900] block mt-1 font-mono">
              {score} pts
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Max Streak
            </span>
            <span className="text-xl font-black text-blue-600 block mt-1 font-mono">
              {bestStreak}
            </span>
          </div>
        </div>

        {/* Detailed incorrect / correct list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Review of matched scenarios
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-sm scrollbar-thin">
            {history.map((h, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xs text-xs flex items-start gap-2.5 border ${
                  h.correct 
                    ? "bg-emerald-50/50 border-emerald-100/60" 
                    : "bg-rose-50/50 border-rose-100/60"
                }`}
              >
                {h.correct ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-slate-700 font-medium leading-relaxed mb-1">
                    {h.scenario}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Your choice: <span className={h.correct ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>{h.choice}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={restartGame}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Play Again
          </button>
          <button
            onClick={() => {
              setGameCompleted(false);
              setIsPlaying(false);
            }}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isSelectedCorrect = selectedAnswer === currentScenario.correctService;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Top HUD stats */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Flame className={`w-5 h-5 ${streak > 0 ? "text-amber-500 fill-amber-50" : "text-slate-300"}`} />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                Streak
              </span>
              <span className="text-xs font-black text-slate-800 font-mono">
                {streak} matches
              </span>
            </div>
          </div>
          
          <div className="w-px h-6 bg-slate-200"></div>

          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Progress
            </span>
            <span className="text-xs font-black text-slate-800 font-mono">
              {currentIdx + 1} / {GAME_SCENARIOS.length}
            </span>
          </div>
        </div>

        {/* Dynamic Timer Circular bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className={`w-4 h-4 ${timer < 8 ? "text-rose-500 animate-pulse" : "text-slate-500"}`} />
            <span className={`text-xs font-black font-mono ${timer < 8 ? "text-rose-600" : "text-slate-800"}`}>
              {timer}s
            </span>
          </div>

          <div className="w-px h-6 bg-slate-200"></div>

          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none text-right">
              Score
            </span>
            <span className="text-xs font-black text-slate-800 font-mono block text-right">
              {score} pts
            </span>
          </div>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
        <div 
          className="bg-slate-900 h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / GAME_SCENARIOS.length) * 100}%` }}
        />
      </div>

      {/* Scenario card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentScenario.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
              Scenario #{currentIdx + 1}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {currentScenario.domainId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
          </div>

          {/* Scenario Text */}
          <div className="p-6 md:p-8 text-center space-y-4">
            <p className="text-sm md:text-base text-slate-700 font-semibold leading-relaxed max-w-2xl mx-auto">
              "{currentScenario.scenarioText}"
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shuffledOptions.map((option, index) => {
          let btnStyle = "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700";
          let icon = null;

          if (isAnswered) {
            const isCorrect = option === currentScenario.correctService;
            const isUserChoice = option === selectedAnswer;

            if (isCorrect) {
              btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs";
              icon = <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
            } else if (isUserChoice) {
              btnStyle = "bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-xs";
              icon = <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
            } else {
              btnStyle = "bg-white border-slate-100 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={index}
              disabled={isAnswered}
              onClick={() => handleOptionClick(option)}
              className={`p-4 border rounded-sm text-xs font-bold text-left flex items-center justify-between transition-all leading-normal ${
                !isAnswered ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99]" : ""
              } ${btnStyle}`}
            >
              <span>{option}</span>
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
          className={`p-5 rounded-sm border ${
            isSelectedCorrect 
              ? "bg-emerald-50/40 border-emerald-100 text-slate-700" 
              : "bg-rose-50/40 border-rose-100 text-slate-700"
          } space-y-2`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded ${
              isSelectedCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}>
              {isSelectedCorrect ? "Correct Match" : "Incorrect Match"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              The correct answer is: <strong className="text-slate-800">{currentScenario.correctService}</strong>
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {currentScenario.explanation}
          </p>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
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
