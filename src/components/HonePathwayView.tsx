import React, { useState, useEffect } from "react";
import { 
  Award, 
  Flame, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock, 
  Plus, 
  TrendingUp, 
  Database, 
  Cpu, 
  UserCheck, 
  Volume2, 
  Layers, 
  ThumbsUp, 
  FileText, 
  Lightbulb, 
  X,
  Zap,
  Info,
  Calendar,
  Settings
} from "lucide-react";
import { Flashcard, TrickQuestion } from "../types";

interface HonePathwayViewProps {
  flashcards: Flashcard[];
  questions: TrickQuestion[];
  studyHistory: { [key: string]: "known" | "review" | null };
  quizHistory: { [key: string]: boolean };
  readinessScore: number;
  onNavigateToTab: (tab: string) => void;
}

interface MilestoneLevel {
  id: number;
  title: string;
  subtitle: string;
  domainId: string;
  requiredScore: number;
  icon: React.ReactNode;
  description: string;
  quests: {
    id: string;
    text: string;
    target: number;
    getCurrent: () => number;
    unit: string;
  }[];
}

interface RoadmapFeature {
  id: string;
  title: string;
  tag: string;
  status: "Backlog" | "Planning" | "In Development" | "Beta Live";
  statusColor: string;
  description: string;
  estimatedDelivery: string;
  complexity: "Low" | "Medium" | "High";
  techStack: string[];
  specs: string[];
  initialVotes: number;
}

export const HonePathwayView: React.FC<HonePathwayViewProps> = ({
  flashcards,
  questions,
  studyHistory,
  quizHistory,
  readinessScore,
  onNavigateToTab,
}) => {
  const [bypassLocks, setBypassLocks] = useState<boolean>(() => {
    return localStorage.getItem("hone_bypass_locks") === "true";
  });
  
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    return Number(localStorage.getItem("hone_daily_goal") || "5");
  });

  const [studyStreak, setStudyStreak] = useState<number>(() => {
    return Number(localStorage.getItem("hone_streak_days") || "3");
  });

  const [activeLevelTab, setActiveLevelTab] = useState<number>(1);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  
  // Track votes in local state
  const [featureVotes, setFeatureVotes] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem("hone_feature_votes_v1");
    return saved ? JSON.parse(saved) : {};
  });

  const [votedFeatures, setVotedFeatures] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("hone_voted_features_v1");
    return saved ? JSON.parse(saved) : {};
  });

  // Track checked calendar days for study streak
  const [streakDays, setStreakDays] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("hone_streak_days_checked");
    if (saved) return JSON.parse(saved);
    // Default: Monday, Tuesday, Wednesday checked
    return { "Mon": true, "Tue": true, "Wed": true, "Thu": false, "Fri": false, "Sat": false, "Sun": false };
  });

  useEffect(() => {
    localStorage.setItem("hone_bypass_locks", String(bypassLocks));
  }, [bypassLocks]);

  useEffect(() => {
    localStorage.setItem("hone_daily_goal", String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem("hone_streak_days", String(studyStreak));
  }, [studyStreak]);

  useEffect(() => {
    localStorage.setItem("hone_feature_votes_v1", JSON.stringify(featureVotes));
  }, [featureVotes]);

  useEffect(() => {
    localStorage.setItem("hone_voted_features_v1", JSON.stringify(votedFeatures));
  }, [votedFeatures]);

  useEffect(() => {
    localStorage.setItem("hone_streak_days_checked", JSON.stringify(streakDays));
  }, [streakDays]);

  const handleToggleStreakDay = (day: string) => {
    const updated = { ...streakDays, [day]: !streakDays[day] };
    setStreakDays(updated);
    
    // Recalculate streak based on active consecutive checks from Mon
    const activeCount = Object.values(updated).filter(Boolean).length;
    setStudyStreak(activeCount);
  };

  const handleVote = (featureId: string) => {
    if (votedFeatures[featureId]) {
      // Unvote
      setVotedFeatures(prev => ({ ...prev, [featureId]: false }));
      setFeatureVotes(prev => ({ ...prev, [featureId]: (prev[featureId] || 0) - 1 }));
    } else {
      // Vote
      setVotedFeatures(prev => ({ ...prev, [featureId]: true }));
      setFeatureVotes(prev => ({ ...prev, [featureId]: (prev[featureId] || 0) + 1 }));
    }
  };

  // Milestone Levels definition
  const milestoneLevels: MilestoneLevel[] = [
    {
      id: 1,
      title: "Level 1: AWS Foundation & Shared Responsibility",
      subtitle: "Domain 1: Cloud Concepts",
      domainId: "cloud-concepts",
      requiredScore: 0,
      icon: <Layers className="w-5 h-5 text-blue-500" />,
      description: "Master the foundation of the cloud. Understand elasticity, Capex vs Opex, and the strict lines of the AWS Shared Responsibility Model.",
      quests: [
        {
          id: "q1_fc",
          text: "Master Domain 1 Flashcards",
          target: 3,
          getCurrent: () => {
            const d1Cards = flashcards.filter(fc => fc.domainId === "cloud-concepts");
            return d1Cards.filter(fc => studyHistory[fc.id] === "known").length;
          },
          unit: "cards"
        },
        {
          id: "q1_sim",
          text: "Correctly solve Cloud Concepts simulator scenarios",
          target: 2,
          getCurrent: () => {
            const d1Quests = questions.filter(q => q.domainId === "cloud-concepts");
            return d1Quests.filter(q => quizHistory[q.id] === true).length;
          },
          unit: "questions"
        }
      ]
    },
    {
      id: 2,
      title: "Level 2: Guarding the Cloud: Security & Compliance",
      subtitle: "Domain 2: Security & IAM",
      domainId: "security-compliance",
      requiredScore: 15,
      icon: <Award className="w-5 h-5 text-emerald-500" />,
      description: "Dive deep into the most weighted domain. Explore identity policies, MFA requirements, DDoS shielding, and auditing tools.",
      quests: [
        {
          id: "q2_fc",
          text: "Master Domain 2 Flashcards",
          target: 4,
          getCurrent: () => {
            const d2Cards = flashcards.filter(fc => fc.domainId === "security-compliance");
            return d2Cards.filter(fc => studyHistory[fc.id] === "known").length;
          },
          unit: "cards"
        },
        {
          id: "q2_sim",
          text: "Correctly solve Security & Compliance simulator scenarios",
          target: 3,
          getCurrent: () => {
            const d2Quests = questions.filter(q => q.domainId === "security-compliance");
            return d2Quests.filter(q => quizHistory[q.id] === true).length;
          },
          unit: "questions"
        }
      ]
    },
    {
      id: 3,
      title: "Level 3: Core Infrastructure, Compute & Storage",
      subtitle: "Domain 3: Technology & Services",
      domainId: "cloud-technology",
      requiredScore: 35,
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      description: "Unravel computing, load balancing, relational databases, and serverless compute paradigms like Lambda and Fargate.",
      quests: [
        {
          id: "q3_fc",
          text: "Master Domain 3 Flashcards",
          target: 5,
          getCurrent: () => {
            const d3Cards = flashcards.filter(fc => fc.domainId === "cloud-technology");
            return d3Cards.filter(fc => studyHistory[fc.id] === "known").length;
          },
          unit: "cards"
        },
        {
          id: "q3_sim",
          text: "Correctly solve Technology & Services simulator scenarios",
          target: 3,
          getCurrent: () => {
            const d3Quests = questions.filter(q => q.domainId === "cloud-technology");
            return d3Quests.filter(q => quizHistory[q.id] === true).length;
          },
          unit: "questions"
        }
      ]
    },
    {
      id: 4,
      title: "Level 4: Billing, Budgets & Cost Allocation",
      subtitle: "Domain 4: Billing & Pricing",
      domainId: "billing-pricing",
      requiredScore: 55,
      icon: <TrendingUp className="w-5 h-5 text-indigo-500" />,
      description: "Establish financial governance. Distinguish Budgets from Cost Explorer, analyze support tiers, and discover consolidated billing efficiencies.",
      quests: [
        {
          id: "q4_fc",
          text: "Master Domain 4 Flashcards",
          target: 3,
          getCurrent: () => {
            const d4Cards = flashcards.filter(fc => fc.domainId === "billing-pricing");
            return d4Cards.filter(fc => studyHistory[fc.id] === "known").length;
          },
          unit: "cards"
        },
        {
          id: "q4_sim",
          text: "Correctly solve Billing & Pricing simulator scenarios",
          target: 2,
          getCurrent: () => {
            const d4Quests = questions.filter(q => q.domainId === "billing-pricing");
            return d4Quests.filter(q => quizHistory[q.id] === true).length;
          },
          unit: "questions"
        }
      ]
    },
    {
      id: 5,
      title: "Level 5: Peak Performance & Grandmastery",
      subtitle: "Comprehensive Final Assessment",
      domainId: "all",
      requiredScore: 75,
      icon: <Zap className="w-5 h-5 text-purple-500 animate-pulse" />,
      description: "Synthesize everything. Address high-stakes scenarios and edge cases. Ready yourself to achieve 85%+ on the real exam.",
      quests: [
        {
          id: "q5_readiness",
          text: "Reach Overall Readiness Score",
          target: 80,
          getCurrent: () => readinessScore,
          unit: "%"
        },
        {
          id: "q5_attempts",
          text: "Attempt exam simulator questions",
          target: 10,
          getCurrent: () => Object.keys(quizHistory).length,
          unit: "attempts"
        }
      ]
    }
  ];

  // Hone Roadmap Feature Board definition
  const roadmapFeatures: RoadmapFeature[] = [
    {
      id: "srs",
      title: "Adaptive Spaced-Repetition System (SRS)",
      tag: "Active Recall",
      status: "In Development",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200",
      description: "Integrates the SuperMemo-2 (SM-2) algorithm. The simulator tracks your rating of recall confidence (1-5) and automatically calculates the next review interval to optimize retention.",
      estimatedDelivery: "Q3 2026",
      complexity: "Medium",
      techStack: ["React Hooks", "LocalDB/IndexedDB", "Algorithm Optimization"],
      initialVotes: 48,
      specs: [
        "Tracks confidence levels on each flip card: 1 (blackout) to 5 (perfect recall).",
        "Applies mathematical interval updates: I(1)=1 day, I(2)=6 days, I(n)=I(n-1)*EF.",
        "Generates a dynamic 'Next Due' card stack to avoid waste of study time."
      ]
    },
    {
      id: "ai-interviewer",
      title: "Voice-Enabled AI Technical Screener",
      tag: "Generative AI",
      status: "Planning",
      statusColor: "bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20",
      description: "Speak your answers to complex AWS questions. Utilizing the server-side Gemini API with audio integration, the app grades your speech, evaluates terminology, and reviews technical accuracy.",
      estimatedDelivery: "Q4 2026",
      complexity: "High",
      techStack: ["Gemini 2.5 Flash", "Web Audio API", "Node.js proxy", "Whisper STT"],
      initialVotes: 86,
      specs: [
        "Leverages Gemini API's JSON mode to parse transcribed text for specific key concepts (e.g. stateful vs stateless).",
        "Renders a dynamic scoring rubric highlighting missing industry keywords.",
        "Simulates a live professional Cloud Solutions Architect role oral examination."
      ]
    },
    {
      id: "sandbox-builder",
      title: "Interactive Network Sandbox & Checker",
      tag: "Visual Lab",
      status: "Backlog",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
      description: "Drag and drop VPC subnets, internet gateways, EC2 servers, and S3 buckets onto a canvas. A compliance checker verifies firewall setups against standard security best practices.",
      estimatedDelivery: "Q1 2027",
      complexity: "High",
      techStack: ["HTML5 Canvas", "Tailwind CSS", "Zustand State", "Validation Engine"],
      initialVotes: 52,
      specs: [
        "A drag-and-drop architectural drawing board inside the companion.",
        "Automatic validation checks, e.g., warning if an EC2 instance is in a public subnet without a security group rule.",
        "Generates direct CloudFormation or Terraform templates based on your custom visual drawing."
      ]
    },
    {
      id: "weakness-map",
      title: "Weakness Map Radar Analytics",
      tag: "Data Viz",
      status: "Beta Live",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description: "A gorgeous, interactive radar graph charting your conceptual weak spots by mapping incorrect simulation answers to sub-topics like IAM, Virtual Networking, CDN caching, or SLA Calculations.",
      estimatedDelivery: "Completed",
      complexity: "Low",
      techStack: ["D3.js", "Recharts", "JSON Analytics", "State Aggregators"],
      initialVotes: 35,
      specs: [
        "Maps quiz questions to sub-domain metadata tags.",
        "Generates a live multi-axis SVG radar chart visualizing topic precision.",
        "Suggests micro-study blocks targeting sub-domains below 70% proficiency."
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Tab Header Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-100 text-[#FF9900] text-[9.5px] font-black rounded-sm border border-amber-200 uppercase tracking-widest">
              Hone-Inspired Core
            </span>
            <span className="text-slate-400 text-xs font-mono">•</span>
            <span className="text-slate-500 text-xs font-medium">Gamified Active Recall Pathway</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
            Study Pathway & Feature Buildout Roadmap
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Progress through unlockable levels by completing active recall milestones. Upvote future roadmap features and inspect technical blueprints modeled after the leading-edge <strong>Hone</strong> learning suite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer transition-all">
            <input 
              type="checkbox" 
              checked={bypassLocks} 
              onChange={(e) => setBypassLocks(e.target.checked)}
              className="rounded text-[#FF9900] focus:ring-[#FF9900] border-slate-300 w-3.5 h-3.5"
            />
            <span>Bypass Level Locks</span>
          </label>
        </div>
      </div>

      {/* Grid: Study Streak Tracker & Pathway Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Streaks and Daily Goals (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Hone Streak & Pulse Widget */}
          <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-rose-50 text-rose-500 rounded-bl-sm">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse fill-rose-500" />
            </div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Daily Study Pulse
            </h3>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-800 tracking-tight">
                {studyStreak}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Day Streak
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Log daily blocks to cement your knowledge. Consistency is key to AWS certification.
            </p>

            {/* Mon-Sun Streak Grid */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Weekly Study Blocks
                </span>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => setStreakDays({ "Mon": true, "Tue": true, "Wed": true, "Thu": true, "Fri": true, "Sat": true, "Sun": true })}>
                  Select All
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Object.keys(streakDays).map((day) => {
                  const checked = streakDays[day];
                  return (
                    <button
                      key={day}
                      onClick={() => handleToggleStreakDay(day)}
                      className={`py-2 rounded-xs border text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                        checked 
                          ? "bg-rose-500 text-white border-rose-600 shadow-sm" 
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                      title={`Click to toggle study block for ${day}`}
                    >
                      <span>{day}</span>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${checked ? 'bg-white' : 'bg-slate-300'}`}></div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Goal Settings */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Daily Study Goal:
                </span>
                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {dailyGoal} items/day
                </span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="25" 
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>3 Items (Casual)</span>
                <span>25 Items (Full Immersion)</span>
              </div>
            </div>
          </div>

          {/* Gamified Achievements Block */}
          <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              Recall Achievements
            </h3>

            <div className="space-y-3">
              {/* Badge 1 */}
              <div className={`flex gap-3 items-center p-2.5 rounded border transition-all ${
                readinessScore >= 10 ? "bg-emerald-50/40 border-emerald-100" : "bg-slate-50/50 border-slate-200/60 opacity-60"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  readinessScore >= 10 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  01
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cloud Novice</h4>
                  <p className="text-[10px] text-slate-500">Achieve a readiness score of 10%.</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className={`flex gap-3 items-center p-2.5 rounded border transition-all ${
                readinessScore >= 40 ? "bg-amber-50/40 border-amber-100" : "bg-slate-50/50 border-slate-200/60 opacity-60"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  readinessScore >= 40 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  02
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Shield Bearer</h4>
                  <p className="text-[10px] text-slate-500">Reach 40% readiness by mastering security concepts.</p>
                </div>
              </div>

              {/* Badge 3 */}
              <div className={`flex gap-3 items-center p-2.5 rounded border transition-all ${
                readinessScore >= 80 ? "bg-purple-50/40 border-purple-100 animate-pulse" : "bg-slate-50/50 border-slate-200/60 opacity-60"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  readinessScore >= 80 ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  03
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cloud Grandmaster</h4>
                  <p className="text-[10px] text-slate-500">Achieve 80%+ readiness. Ready for CLF-C02.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Progressive Study Pathway (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            
            {/* Level Level Select Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
              {milestoneLevels.map((lvl) => {
                const isUnlocked = bypassLocks || readinessScore >= lvl.requiredScore;
                const isActive = activeLevelTab === lvl.id;
                
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setActiveLevelTab(lvl.id)}
                    className={`px-4 py-3.5 border-b-2 text-xs font-bold tracking-tight shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                      isActive 
                        ? "border-[#FF9900] text-slate-900 bg-white" 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span>Lvl {lvl.id}</span>
                    {isUnlocked ? (
                      <Unlock className="w-3 h-3 text-slate-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Level Detail Workspace */}
            {(() => {
              const selectedLvl = milestoneLevels.find(l => l.id === activeLevelTab);
              if (!selectedLvl) return null;

              const isUnlocked = bypassLocks || readinessScore >= selectedLvl.requiredScore;

              return (
                <div className="p-6 relative">
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-10">
                      <div className="w-12 h-12 bg-rose-50 border border-rose-100 flex items-center justify-center rounded-full text-rose-500 mb-3 shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Level Locked</h4>
                      <p className="text-xs text-slate-500 max-w-sm leading-normal mt-1">
                        Requires a global <strong>Readiness Score of {selectedLvl.requiredScore}%</strong> to unlock. Keep studying to reveal this level's active recall quests!
                      </p>
                      <button 
                        onClick={() => setBypassLocks(true)}
                        className="mt-4 px-3 py-1.5 bg-[#FF9900] hover:bg-[#FF9900]/90 text-white text-xs font-bold rounded-sm shadow-sm cursor-pointer transition-all"
                      >
                        Bypass Lock Constraint
                      </button>
                    </div>
                  )}

                  {/* Level Header Info */}
                  <div className="flex gap-4 items-start pb-5 border-b border-slate-100">
                    <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-sm">
                      {selectedLvl.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                        {selectedLvl.subtitle}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-md tracking-tight leading-snug">
                        {selectedLvl.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xl">
                        {selectedLvl.description}
                      </p>
                    </div>
                  </div>

                  {/* Quests Lists */}
                  <div className="mt-5 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Active Recall Quests for Level {selectedLvl.id}
                    </h4>

                    <div className="space-y-3">
                      {selectedLvl.quests.map((quest) => {
                        const current = quest.getCurrent();
                        const target = quest.target;
                        const percent = Math.min(100, Math.round((current / target) * 100));
                        const isDone = current >= target;

                        return (
                          <div key={quest.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isDone 
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                  : "bg-blue-50 text-blue-800 border border-blue-100"
                              }`}>
                                {isDone ? "Quest Mastered" : "Active Quest"}
                              </span>
                              <h5 className="font-bold text-slate-800 text-xs mt-1.5">
                                {quest.text}
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                Current progress: <span className="text-slate-600 font-bold">{current} {quest.unit}</span> out of <span className="text-slate-600 font-bold">{target} {quest.unit}</span> required.
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                                {percent}%
                              </span>
                              {isDone ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action recommendations */}
                    <div className="mt-5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-sm flex gap-3 items-start">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Milestone Guidance</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          {selectedLvl.id === 5 ? (
                            <span>Achieve grandmaster status! Navigate to the <strong>Exam Simulator</strong> to run random sets and focus on your accuracy.</span>
                          ) : (
                            <span>To complete this level, head to the <strong>Flashcards</strong> or <strong>Exam Simulator</strong> tabs and select the {selectedLvl.subtitle} scope. Your mastery progress will synchronize here immediately!</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* Feature Buildout Roadmap Board */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-sm border border-blue-100 uppercase tracking-widest">
              Hone Feature Pipeline
            </span>
            <span className="text-slate-400 text-xs font-mono">•</span>
            <span className="text-slate-500 text-xs font-bold">Interactive Product Roadmap</span>
          </div>
          <h3 className="text-md font-extrabold text-slate-800 mt-1 tracking-tight">
            AWS Study Companion Future Feature Board
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            We are continuously building high-efficacy study mechanics inspired by Hone's platform architecture. Vote for your desired feature to influence our developers, and inspect our interactive design specs!
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {roadmapFeatures.map((feat) => {
            const hasVoted = votedFeatures[feat.id] || false;
            const currentVotes = feat.initialVotes + (featureVotes[feat.id] || 0);

            return (
              <div 
                key={feat.id} 
                className="bg-slate-50 border border-slate-200/60 p-4 rounded-sm flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-blue-600 font-mono tracking-wide uppercase bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 rounded">
                      {feat.tag}
                    </span>
                    <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${feat.statusColor}`}>
                      {feat.status}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm mt-3 tracking-tight">
                    {feat.title}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-4">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>Est: <strong className="text-slate-600">{feat.estimatedDelivery}</strong></span>
                    <span>Complexity: <strong className={`font-bold ${feat.complexity === 'High' ? 'text-amber-600' : 'text-slate-600'}`}>{feat.complexity}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    {/* Vote Button */}
                    <button
                      onClick={() => handleVote(feat.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm border text-[11px] font-black tracking-tight cursor-pointer transition-all ${
                        hasVoted 
                          ? "bg-blue-600 text-white border-blue-700 shadow-xs" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-white' : ''}`} />
                      <span>{currentVotes} Votes</span>
                    </button>

                    {/* Spec Button */}
                    <button
                      onClick={() => setSelectedFeature(feat)}
                      className="px-2.5 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-sm text-[11px] font-bold cursor-pointer transition-all"
                      title="Explore Architecture Spec Blueprint"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blueprint Detail Modal (Architectural Simulation) */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FF9900]" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black">
                  [SPEC_BLUEPRINT: {selectedFeature.id.toUpperCase()}]
                </span>
              </div>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="text-slate-400 hover:text-white p-1 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              
              {/* Feature Title and Status */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-600 font-mono uppercase bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded inline-block">
                  {selectedFeature.tag}
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  {selectedFeature.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedFeature.description}
                </p>
              </div>

              {/* Specs Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200/60 rounded">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-slate-700">{selectedFeature.status}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Est. Release</span>
                  <span className="text-xs font-bold text-slate-700">{selectedFeature.estimatedDelivery}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Complexity</span>
                  <span className="text-xs font-bold text-slate-700">{selectedFeature.complexity} Level</span>
                </div>
              </div>

              {/* Technical Stack Pills */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Target Architecture Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFeature.techStack.map((tech) => (
                    <span key={tech} className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Core Blueprint Bullet Points */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Hone Design Spec Blueprint
                </h4>
                <ul className="space-y-2.5">
                  {selectedFeature.specs.map((spec, i) => (
                    <li key={i} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 text-slate-500 mt-0.5">
                        {i + 1}
                      </div>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive Simulation Code Snippet (Spec Blueprint) */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Developer Code Spec Sandbox
                </h4>
                <div className="bg-slate-900 rounded p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-normal">
                  {selectedFeature.id === "srs" && (
                    <pre>{`// SuperMemo-2 (SM-2) Interval Calculation Algorithm
export function calculateSM2(
  quality: number, // 0-5 user rating
  prevInterval: number, // in days
  prevRepetition: number,
  prevEF: number // Easiness Factor
) {
  let EF = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (EF < 1.3) EF = 1.3;

  let repetition = prevRepetition;
  let interval = 1;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * EF);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  return { interval, repetition, EF };
}`}</pre>
                  )}

                  {selectedFeature.id === "ai-interviewer" && (
                    <pre>{`// Server-Side Gemini API Audio Prompt Proxy 
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function gradeSpeechAnswer(audioBase64: string, scenarioText: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: "Evaluate this audio response against the AWS scenario: " + scenarioText },
      { inlineData: { mimeType: "audio/mp3", data: audioBase64 } }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
          critique: { type: "STRING" }
        }
      }
    }
  });
  return response.text;
}`}</pre>
                  )}

                  {selectedFeature.id === "sandbox-builder" && (
                    <pre>{`// Canvas Graph Validation Scan
export function scanInfrastructureCompliance(nodes: CanvasNode[], links: CanvasLink[]) {
  const issues = [];
  
  // Rule 1: EC2 in public subnet must have public IP and a security group
  const publicEc2s = nodes.filter(n => n.type === 'EC2' && n.parentSubnet === 'public');
  for (const ec2 of publicEc2s) {
    const hasSg = links.some(l => l.source === ec2.id && l.targetType === 'SecurityGroup');
    if (!hasSg) {
      issues.push({
        severity: 'HIGH',
        nodeId: ec2.id,
        msg: "EC2 instance in public subnet is exposed without any attached Security Group."
      });
    }
  }
  
  return { status: issues.length === 0 ? 'COMPLIANT' : 'WARNING', issues };
}`}</pre>
                  )}

                  {selectedFeature.id === "weakness-map" && (
                    <pre>{`// Radar Chart Axis Data Preparation
export function computeWeaknessRadarData(quizHistory: { [key: string]: boolean }, questions: TrickQuestion[]) {
  const categories = {};
  
  for (const q of questions) {
    const wasAttempted = quizHistory[q.id] !== undefined;
    if (wasAttempted) {
      const isCorrect = quizHistory[q.id];
      if (!categories[q.domainName]) {
        categories[q.domainName] = { correct: 0, total: 0 };
      }
      categories[q.domainName].total += 1;
      if (isCorrect) categories[q.domainName].correct += 1;
    }
  }
  
  return Object.keys(categories).map(cat => ({
    subject: cat,
    score: Math.round((categories[cat].correct / categories[cat].total) * 100),
    fullMark: 100
  }));
}`}</pre>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-sm cursor-pointer transition-all"
              >
                Close Spec Blueprint
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
