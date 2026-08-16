import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Flame, 
  Crown, 
  Zap, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  HelpCircle, 
  Award, 
  Coins, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Bot, 
  Play, 
  Square, 
  TrendingUp, 
  Gift, 
  Clock, 
  Info,
  Lock,
  Unlock,
  AlertCircle,
  Swords,
  Heart,
  Shield,
  Target,
  ArrowUp,
  ArrowDown,
  Gauge,
  Timer,
  Trophy,
  Dices,
  RefreshCw,
  Rotate3d
} from "lucide-react";
import { SlotMachine3D } from "./SlotMachine3D";
import { 
  addXP, 
  awardLootCrate, 
  getGamificationProfile, 
  recordGameSessionMetric, 
  subscribeGamification,
  LootCrate,
  LootRarity,
  RARITY_COLORS
} from "../services/gamificationService";
import { 
  playLeverPullSound, 
  playReelStopSound, 
  playWinSound, 
  playJackpotFanfare, 
  playBonusTriggerSound, 
  playHoldLockSound, 
  playCoinDrop,
  playFeverOverdriveSound,
  playWildStormStrikeSound,
  playBossDamageSound,
  playBossAttackSound,
  playNudgeSound,
  setSlotSoundEnabled,
  isSlotSoundEnabled
} from "../utils/slotAudio";

export type SlotGameMode = "classic" | "chaos_fever" | "timed_rush" | "boss_raid";

export interface SlotSymbol {
  id: string;
  name: string;
  category: "compute" | "storage" | "database" | "security" | "networking" | "ai" | "jackpot" | "wild";
  emoji: string;
  iconBg: string;
  textColor: string;
  multiplier: number; // 3-of-a-kind base multiplier
  isWild?: boolean;
  isScatter?: boolean;
  awsService: string;
  conceptTip: string;
  bossEffect?: {
    type: "damage" | "shield" | "heal" | "critical" | "buff";
    value: number;
  };
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  {
    id: "guru",
    name: "Cloud Guru Crown",
    category: "jackpot",
    emoji: "👑",
    iconBg: "bg-gradient-to-br from-amber-500 to-yellow-300 text-slate-950 shadow-amber-500/40",
    textColor: "text-amber-400",
    multiplier: 500,
    awsService: "CLF-C02 Certified",
    conceptTip: "Mastery of all 4 AWS domains: Cloud Concepts, Security, Technology, and Billing.",
    bossEffect: { type: "critical", value: 3500 }
  },
  {
    id: "algo",
    name: "Algorand ASA Crystal",
    category: "wild",
    emoji: "💎",
    iconBg: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-cyan-500/40",
    textColor: "text-cyan-400",
    multiplier: 250,
    isWild: true,
    awsService: "Algorand Web3 Token",
    conceptTip: "Wild card! Substitutes for any standard AWS service on active paylines.",
    bossEffect: { type: "buff", value: 2 }
  },
  {
    id: "bedrock",
    name: "Swarm AI / Bedrock",
    category: "ai",
    emoji: "🤖",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/40",
    textColor: "text-purple-400",
    multiplier: 200,
    isScatter: true,
    awsService: "Amazon Bedrock & Agents",
    conceptTip: "Scatter symbol! 3 anywhere on the screen triggers the Socratic Bonus Arena!",
    bossEffect: { type: "damage", value: 1800 }
  },
  {
    id: "shield",
    name: "IAM & KMS Fortress",
    category: "security",
    emoji: "🛡️",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/40",
    textColor: "text-emerald-400",
    multiplier: 150,
    awsService: "AWS IAM & KMS",
    conceptTip: "Enforces principle of least privilege and encryption-at-rest key rotation.",
    bossEffect: { type: "shield", value: 1500 }
  },
  {
    id: "cloudfront",
    name: "CloudFront Edge CDN",
    category: "networking",
    emoji: "🌐",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-500/40",
    textColor: "text-blue-400",
    multiplier: 100,
    awsService: "Amazon CloudFront",
    conceptTip: "Lowers latency by caching video, static assets, and APIs at global edge locations.",
    bossEffect: { type: "damage", value: 1200 }
  },
  {
    id: "aurora",
    name: "Aurora RDS Database",
    category: "database",
    emoji: "🐬",
    iconBg: "bg-gradient-to-br from-sky-400 to-cyan-700 text-white shadow-sky-500/40",
    textColor: "text-sky-400",
    multiplier: 75,
    awsService: "Amazon Aurora / RDS",
    conceptTip: "High-performance managed relational database with up to 15 read replicas and multi-AZ failover.",
    bossEffect: { type: "heal", value: 800 }
  },
  {
    id: "s3",
    name: "S3 Infinite Storage",
    category: "storage",
    emoji: "🗄️",
    iconBg: "bg-gradient-to-br from-emerald-600 to-green-800 text-white shadow-emerald-600/40",
    textColor: "text-emerald-400",
    multiplier: 50,
    awsService: "Amazon S3",
    conceptTip: "11 9s of durability (99.999999999%) for immutable object storage and lifecycle transitions.",
    bossEffect: { type: "shield", value: 900 }
  },
  {
    id: "ec2",
    name: "EC2 Elastic Compute",
    category: "compute",
    emoji: "⚡",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/40",
    textColor: "text-amber-400",
    multiplier: 35,
    awsService: "Amazon EC2",
    conceptTip: "Virtual servers in the cloud with flexible On-Demand, Spot, and Savings Plan pricing models.",
    bossEffect: { type: "damage", value: 1000 }
  },
  {
    id: "lambda",
    name: "Lambda Serverless",
    category: "compute",
    emoji: "📦",
    iconBg: "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-600/40",
    textColor: "text-orange-400",
    multiplier: 25,
    awsService: "AWS Lambda",
    conceptTip: "Event-driven, scale-to-zero serverless compute without provisioning server instances.",
    bossEffect: { type: "damage", value: 800 }
  },
  {
    id: "cw",
    name: "CloudWatch Telemetry",
    category: "security",
    emoji: "📊",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/40",
    textColor: "text-pink-400",
    multiplier: 15,
    awsService: "Amazon CloudWatch",
    conceptTip: "Collects real-time metrics, logs, and alarms to trigger auto-scaling policies.",
    bossEffect: { type: "shield", value: 500 }
  }
];

// Long reel strip sequence for continuous realistic physics scrolling
const BASE_REEL_STRIP: SlotSymbol[] = [
  SLOT_SYMBOLS[0], // guru
  SLOT_SYMBOLS[8], // lambda
  SLOT_SYMBOLS[4], // cloudfront
  SLOT_SYMBOLS[7], // ec2
  SLOT_SYMBOLS[1], // algo (wild)
  SLOT_SYMBOLS[6], // s3
  SLOT_SYMBOLS[9], // cw
  SLOT_SYMBOLS[5], // aurora
  SLOT_SYMBOLS[3], // shield
  SLOT_SYMBOLS[2], // bedrock (scatter)
  SLOT_SYMBOLS[7], // ec2
  SLOT_SYMBOLS[8], // lambda
  SLOT_SYMBOLS[6], // s3
  SLOT_SYMBOLS[3], // shield
  SLOT_SYMBOLS[4], // cloudfront
  SLOT_SYMBOLS[5], // aurora
  SLOT_SYMBOLS[1], // algo
  SLOT_SYMBOLS[9], // cw
  SLOT_SYMBOLS[0], // guru
  SLOT_SYMBOLS[2]  // bedrock
];

// Architectural Blueprint Combos (Special Synergies)
interface BlueprintCombo {
  id: string;
  name: string;
  tagline: string;
  symbolsRequired: string[]; // symbol IDs required
  bonusMultiplier: number;
  xpBonus: number;
  description: string;
}

const BLUEPRINT_COMBOS: BlueprintCombo[] = [
  {
    id: "bp-serverless",
    name: "Serverless Web Tier",
    tagline: "Event-Driven Scalability",
    symbolsRequired: ["lambda", "s3", "aurora"],
    bonusMultiplier: 5,
    xpBonus: 350,
    description: "Combines S3 static hosting, Lambda API logic, and Aurora Serverless for zero-maintenance architecture."
  },
  {
    id: "bp-3tier",
    name: "Classic 3-Tier Enterprise",
    tagline: "High Availability VPC",
    symbolsRequired: ["ec2", "aurora", "s3"],
    bonusMultiplier: 4,
    xpBonus: 300,
    description: "Resilient Multi-AZ VPC architecture with EC2 web servers, RDS Aurora database, and S3 asset storage."
  },
  {
    id: "bp-edge",
    name: "Global Edge Acceleration",
    tagline: "Sub-10ms Global Delivery",
    symbolsRequired: ["cloudfront", "s3", "lambda"],
    bonusMultiplier: 6,
    xpBonus: 450,
    description: "CloudFront CDN caching S3 bucket origin with Lambda@Edge compute for localized user customization."
  },
  {
    id: "bp-security",
    name: "Zero-Trust Fortress",
    tagline: "Defense-In-Depth",
    symbolsRequired: ["shield", "cw", "guru"],
    bonusMultiplier: 8,
    xpBonus: 600,
    description: "IAM least-privilege policies, KMS envelope encryption, CloudWatch alarms, and certified governance."
  }
];

// Boss Raid Monsters
interface RaidBoss {
  id: string;
  name: string;
  title: string;
  avatar: string;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  description: string;
  specialMove: string;
  lootReward: LootRarity;
  xpReward: number;
}

const RAID_BOSSES: RaidBoss[] = [
  {
    id: "boss-ddos",
    name: "Downtime DDoS Behemoth",
    title: "Layer 7 Outage Entity",
    avatar: "👾",
    maxHp: 12000,
    currentHp: 12000,
    attackPower: 1200,
    description: "Floods application subnets with SYN traffic. Counter with CloudFront Edge caching and IAM Fortress shields!",
    specialMove: "SYN-Flood Overload",
    lootReward: "legendary",
    xpReward: 2500
  },
  {
    id: "boss-billshock",
    name: "Bill Shock Dragon",
    title: "Unbounded Provisioning Titan",
    avatar: "🐉",
    maxHp: 18000,
    currentHp: 18000,
    attackPower: 1800,
    description: "Uncapped EC2 instance sprawl and forgotten NAT Gateways! Strike with Serverless Lambda and CloudWatch alarms!",
    specialMove: "10,000x On-Demand Sprawl",
    lootReward: "mythic",
    xpReward: 4000
  }
];

// Socratic Mini-Game Questions
interface SocraticChallenge {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  multiplierReward: number;
}

const SOCRATIC_CHALLENGES: SocraticChallenge[] = [
  {
    id: "soc-1",
    question: "A gaming company requires a database that delivers single-digit millisecond latency at any scale. Which AWS database service should they choose?",
    options: ["Amazon RDS for MySQL", "Amazon DynamoDB", "Amazon Redshift", "AWS Glue"],
    correctIndex: 1,
    explanation: "Amazon DynamoDB is a fully managed NoSQL key-value database designed for single-digit millisecond response times at massive scale.",
    multiplierReward: 3
  },
  {
    id: "soc-2",
    question: "Which AWS service enables automated infrastructure deployments through Declarative JSON/YAML Templates (Infrastructure as Code)?",
    options: ["AWS CloudFormation", "AWS Elastic Beanstalk", "Amazon CloudWatch", "AWS Systems Manager"],
    correctIndex: 0,
    explanation: "AWS CloudFormation allows you to model, provision, and manage AWS resources using declarative template files.",
    multiplierReward: 4
  },
  {
    id: "soc-3",
    question: "What is the most cost-effective EC2 pricing model for interruptible, asynchronous batch video transcoding workloads?",
    options: ["On-Demand Instances", "Dedicated Hosts", "Spot Instances", "Standard 3-Year Reserved"],
    correctIndex: 2,
    explanation: "Amazon EC2 Spot Instances offer up to 90% discounts on unused EC2 capacity, ideal for fault-tolerant batch processing.",
    multiplierReward: 3
  },
  {
    id: "soc-4",
    question: "Which AWS Support Plan provides 24/7 access to Cloud Support Engineers and a 15-minute response time for business-critical system down issues?",
    options: ["Basic Support", "Developer Support", "Business Support", "Enterprise Support"],
    correctIndex: 3,
    explanation: "AWS Enterprise Support includes a designated Technical Account Manager (TAM) and 15-minute response SLA for critical outages.",
    multiplierReward: 5
  },
  {
    id: "soc-5",
    question: "Which feature of Amazon S3 allows automatic transition of objects from S3 Standard to S3 Glacier Flexible Retrieval after 90 days?",
    options: ["S3 Object Lock", "S3 Lifecycle Configuration Rules", "S3 Cross-Region Replication", "S3 Intelligent-Tiering"],
    correctIndex: 1,
    explanation: "S3 Lifecycle rules automate moving older objects into cheaper archive tiers (e.g. Glacier) based on age rules.",
    multiplierReward: 4
  }
];

// Payline definitions for a 3x3 grid (coordinates: [row, col])
const PAYLINES = [
  { id: "line-mid", name: "Center Line", coords: [[1,0], [1,1], [1,2]], color: "stroke-amber-400", label: "Line 1" },
  { id: "line-top", name: "Top Row", coords: [[0,0], [0,1], [0,2]], color: "stroke-blue-400", label: "Line 2" },
  { id: "line-bot", name: "Bottom Row", coords: [[2,0], [2,1], [2,2]], color: "stroke-emerald-400", label: "Line 3" },
  { id: "line-diag1", name: "Diagonal Down", coords: [[0,0], [1,1], [2,2]], color: "stroke-purple-400", label: "Line 4" },
  { id: "line-diag2", name: "Diagonal Up", coords: [[2,0], [1,1], [0,2]], color: "stroke-rose-400", label: "Line 5" }
];

export const NewAgeSlotMachine: React.FC = () => {
  // Game Mode State
  const [activeMode, setActiveMode] = useState<SlotGameMode>("classic");

  // Credits & Bank State
  const [credits, setCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("aws_slot_credits_v2");
      return saved ? parseInt(saved, 10) : 1500;
    } catch {
      return 1500;
    }
  });

  // Current Bet & Active Lines
  const [betPerLine, setBetPerLine] = useState<number>(10);
  const [activeLinesCount, setActiveLinesCount] = useState<number>(5);
  const [spinMultiplier, setSpinMultiplier] = useState<number>(1);
  const totalBet = (activeMode === "chaos_fever" ? betPerLine * activeLinesCount * 5 : betPerLine * activeLinesCount) * spinMultiplier;

  // Reels State: 3 rows x 3 columns
  const [grid, setGrid] = useState<SlotSymbol[][]>(() => [
    [SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]],
    [SLOT_SYMBOLS[3], SLOT_SYMBOLS[4], SLOT_SYMBOLS[5]],
    [SLOT_SYMBOLS[6], SLOT_SYMBOLS[7], SLOT_SYMBOLS[8]]
  ]);

  // Spinning & Hold / Nudge State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [heldReels, setHeldReels] = useState<boolean[]>([false, false, false]);
  const [canHold, setCanHold] = useState<boolean>(false);
  const [nudgeAvailable, setNudgeAvailable] = useState<number | null>(null); // reel index that can be nudged

  // Smooth Physics Reel Strip Animation Positions (in CSS px offset)
  const [reelOffsets, setReelOffsets] = useState<number[]>([0, 0, 0]);
  const [isLeverPulled, setIsLeverPulled] = useState<boolean>(false);

  // Chaos Fever Mode States
  const [feverGauge, setFeverGauge] = useState<number>(30); // 0 to 100%
  const [isFeverActive, setIsFeverActive] = useState<boolean>(false);
  const [feverSpinsLeft, setFeverSpinsLeft] = useState<number>(0);
  const [wildStormActive, setWildStormActive] = useState<boolean>(false);

  // Timed Rush Marathon (60s sprint)
  const [rushTimeLeft, setRushTimeLeft] = useState<number>(60);
  const [isRushActive, setIsRushActive] = useState<boolean>(false);
  const [rushScore, setRushScore] = useState<number>(0);
  const [rushStreak, setRushStreak] = useState<number>(1);
  const [rushSpinsCount, setRushSpinsCount] = useState<number>(0);

  // Boss Raid Mode States
  const [activeBoss, setActiveBoss] = useState<RaidBoss>(RAID_BOSSES[0]);
  const [playerHp, setPlayerHp] = useState<number>(5000);
  const [playerShield, setPlayerShield] = useState<number>(2000);
  const [bossCombatLogs, setBossCombatLogs] = useState<string[]>([
    "⚔️ Raid Initialized! Match Compute & Guru Crowns to deal massive damage!"
  ]);
  const [bossDefeated, setBossDefeated] = useState<boolean>(false);

  // Settings & Toggles
  const [soundOn, setSoundOn] = useState<boolean>(isSlotSoundEnabled());
  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [showPaytableModal, setShowPaytableModal] = useState<boolean>(false);

  // Win, Free Spins & Mini-Game States
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [lastWinXP, setLastWinXP] = useState<number>(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [matchedBlueprint, setMatchedBlueprint] = useState<BlueprintCombo | null>(null);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinMultiplier, setFreeSpinMultiplier] = useState<number>(1);
  const [totalJackpotsWon, setTotalJackpotsWon] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("aws_slot_jackpots_won") || "0", 10);
    } catch {
      return 0;
    }
  });
  const [highestWin, setHighestWin] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("aws_slot_highest_win") || "0", 10);
    } catch {
      return 0;
    }
  });

  // Socratic Challenge State
  const [activeSocraticChallenge, setActiveSocraticChallenge] = useState<SocraticChallenge | null>(null);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<number | null>(null);
  const [socraticResult, setSocraticResult] = useState<"correct" | "incorrect" | null>(null);
  const [socraticTimer, setSocraticTimer] = useState<number>(20);

  // Crate Drop Notification
  const [awardedCrate, setAwardedCrate] = useState<LootCrate | null>(null);
  const [showWinCelebration, setShowWinCelebration] = useState<boolean>(false);

  // Gamification Profile & Sync
  const [profileXP, setProfileXP] = useState<number>(() => getGamificationProfile().xp);

  // 3D Three.js Arcade View vs 2D Matrix View Toggle
  const [view3DMode, setView3DMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("aws_slot_3d_mode") !== "false";
    } catch {
      return true;
    }
  });

  // Save credits
  useEffect(() => {
    try {
      localStorage.setItem("aws_slot_credits_v2", credits.toString());
      localStorage.setItem("aws_slot_highest_win", highestWin.toString());
      localStorage.setItem("aws_slot_jackpots_won", totalJackpotsWon.toString());
    } catch {}
  }, [credits, highestWin, totalJackpotsWon]);

  // Subscribe to profile XP changes
  useEffect(() => {
    const unsub = subscribeGamification((p) => {
      setProfileXP(p.xp);
    });
    return unsub;
  }, []);

  // Timed Rush Countdown
  useEffect(() => {
    if (!isRushActive || rushTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setRushTimeLeft(prev => {
        if (prev <= 1) {
          setIsRushActive(false);
          // End rush marathon
          const bonusXP = Math.round(rushScore * 0.5);
          addXP(bonusXP, "60s Slot Rush Marathon Finish");
          const crateRarity: LootRarity = rushScore >= 20000 ? "legendary" : rushScore >= 8000 ? "epic" : "rare";
          const crate = awardLootCrate(crateRarity, `Slot Rush Score: ${rushScore.toLocaleString()}`, "60-Second Marathon Sprint");
          setAwardedCrate(crate);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRushActive, rushTimeLeft, rushScore]);

  // Handle Sound Toggle
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSlotSoundEnabled(next);
  };

  // Helper to pick random symbol with realistic weighting
  const getRandomSymbol = (): SlotSymbol => {
    const weights: Record<string, number> = {
      cw: 22,
      lambda: 19,
      ec2: 17,
      s3: 14,
      aurora: 11,
      cloudfront: 8,
      shield: 5,
      bedrock: isFeverActive ? 8 : 4,
      algo: isFeverActive ? 8 : 2.5,
      guru: isFeverActive ? 4 : 1.5
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;

    for (const sym of SLOT_SYMBOLS) {
      const weight = weights[sym.id] || 10;
      if (rand < weight) {
        return sym;
      }
      rand -= weight;
    }
    return SLOT_SYMBOLS[0];
  };

  // Check for line matches and blueprints
  const evaluateGrid = (newGrid: SlotSymbol[][], currentBet: number, isFreeSpin: boolean) => {
    let totalWinCredits = 0;
    let totalWinXP = 0;
    const hitLines: number[] = [];
    let detectedBlueprint: BlueprintCombo | null = null;
    let scatterCount = 0;

    // Count scatters across entire grid
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (newGrid[r][c].isScatter) {
          scatterCount++;
        }
      }
    }

    // Evaluate active paylines
    const activePaylines = PAYLINES.slice(0, activeLinesCount);

    activePaylines.forEach((line, lineIndex) => {
      const s1 = newGrid[line.coords[0][0]][line.coords[0][1]];
      const s2 = newGrid[line.coords[1][0]][line.coords[1][1]];
      const s3 = newGrid[line.coords[2][0]][line.coords[2][1]];

      // Check 3-of-a-kind (considering Wild cards)
      let matchSymbol: SlotSymbol | null = null;

      if (!s1.isWild) matchSymbol = s1;
      else if (!s2.isWild) matchSymbol = s2;
      else if (!s3.isWild) matchSymbol = s3;
      else matchSymbol = SLOT_SYMBOLS.find(s => s.id === "algo")!; // all wilds!

      const isS1Match = s1.isWild || s1.id === matchSymbol.id;
      const isS2Match = s2.isWild || s2.id === matchSymbol.id;
      const isS3Match = s3.isWild || s3.id === matchSymbol.id;

      if (isS1Match && isS2Match && isS3Match) {
        hitLines.push(lineIndex);
        
        // Multiplier calculation (wilds grant 2x bonus)
        const wildCount = [s1, s2, s3].filter(s => s.isWild).length;
        const wildMultiplier = Math.pow(2, wildCount);
        const modeMultiplier = isFeverActive ? 3 : 1;
        const lineWin = betPerLine * matchSymbol.multiplier * wildMultiplier * (isFreeSpin ? freeSpinMultiplier : 1) * modeMultiplier * spinMultiplier;
        
        totalWinCredits += lineWin;
        totalWinXP += Math.round(lineWin * 0.4);
      }

      // Check Architectural Blueprint Combos on this line
      const lineSymbolIds = [s1.id, s2.id, s3.id];
      for (const bp of BLUEPRINT_COMBOS) {
        const hasAll = bp.symbolsRequired.every(reqId => lineSymbolIds.includes(reqId));
        if (hasAll) {
          detectedBlueprint = bp;
          const bpWin = betPerLine * bp.bonusMultiplier * 18 * (isFeverActive ? 2 : 1) * spinMultiplier;
          totalWinCredits += bpWin;
          totalWinXP += bp.xpBonus * (isFeverActive ? 2 : 1);
          if (!hitLines.includes(lineIndex)) {
            hitLines.push(lineIndex);
          }
          break;
        }
      }
    });

    return { totalWinCredits, totalWinXP, hitLines, detectedBlueprint, scatterCount };
  };

  // Perform Physical Spin
  const spin = async (isManual: boolean = true) => {
    if (isSpinning) return;

    const isFreeSpin = freeSpinsRemaining > 0 || feverSpinsLeft > 0 || isRushActive;

    if (!isFreeSpin && activeMode !== "chaos_fever" && credits < totalBet) {
      alert("Insufficient Cloud Credits! Click 'Claim Daily 500 Credits' or switch to Chaos Fever mode for unlimited fun!");
      setAutoSpinCount(0);
      return;
    }

    // Deduct bet if not free
    if (!isFreeSpin && activeMode !== "chaos_fever") {
      setCredits(prev => prev - totalBet);
    } else if (freeSpinsRemaining > 0) {
      setFreeSpinsRemaining(prev => prev - 1);
    } else if (feverSpinsLeft > 0) {
      setFeverSpinsLeft(prev => {
        if (prev <= 1) {
          setIsFeverActive(false);
        }
        return prev - 1;
      });
    }

    // Pull Lever Animation
    setIsLeverPulled(true);
    setTimeout(() => setIsLeverPulled(false), 300);

    setIsSpinning(true);
    setWinningLines([]);
    setMatchedBlueprint(null);
    setLastWinAmount(0);
    setLastWinXP(0);
    setShowWinCelebration(false);
    setNudgeAvailable(null);
    playLeverPullSound();

    // Reels animation state
    const reelsToSpin = [!heldReels[0], !heldReels[1], !heldReels[2]];
    setSpinningReels(reelsToSpin);

    // Random Wild Storm Trigger in Fever Mode (25% chance)
    let shouldTriggerWildStorm = isFeverActive && Math.random() < 0.35;
    if (shouldTriggerWildStorm) {
      setWildStormActive(true);
      playWildStormStrikeSound();
    } else {
      setWildStormActive(false);
    }

    const spinDuration = turboMode ? 350 : 800;
    const reelStagger = turboMode ? 150 : 350;

    // Generate final grid
    const targetGrid: SlotSymbol[][] = [
      [
        heldReels[0] ? grid[0][0] : getRandomSymbol(),
        heldReels[1] ? grid[0][1] : getRandomSymbol(),
        heldReels[2] ? grid[0][2] : getRandomSymbol(),
      ],
      [
        heldReels[0] ? grid[1][0] : getRandomSymbol(),
        heldReels[1] ? grid[1][1] : getRandomSymbol(),
        heldReels[2] ? grid[1][2] : getRandomSymbol(),
      ],
      [
        heldReels[0] ? grid[2][0] : getRandomSymbol(),
        heldReels[1] ? grid[2][1] : getRandomSymbol(),
        heldReels[2] ? grid[2][2] : getRandomSymbol(),
      ],
    ];

    // If wild storm struck, convert 1-2 symbols into Wilds
    if (shouldTriggerWildStorm) {
      const r = Math.floor(Math.random() * 3);
      const c = Math.floor(Math.random() * 3);
      targetGrid[r][c] = SLOT_SYMBOLS.find(s => s.id === "algo")!;
    }

    // Clear held reels after spin
    setHeldReels([false, false, false]);

    // Animate reels stopping sequentially
    for (let col = 0; col < 3; col++) {
      if (reelsToSpin[col]) {
        await new Promise(r => setTimeout(r, spinDuration + col * reelStagger));
        playReelStopSound(col);
        setSpinningReels(prev => {
          const next = [...prev];
          next[col] = false;
          return next;
        });
      }
    }

    setGrid(targetGrid);
    setIsSpinning(false);

    // Evaluate Results
    const { totalWinCredits, totalWinXP, hitLines, detectedBlueprint, scatterCount } = evaluateGrid(targetGrid, totalBet, isFreeSpin);

    setWinningLines(hitLines);
    setMatchedBlueprint(detectedBlueprint);

    // Update Fever Energy
    if (!isFeverActive) {
      setFeverGauge(prev => {
        const next = prev + (totalWinCredits > 0 ? 18 : 6);
        if (next >= 100) {
          playFeverOverdriveSound();
          setIsFeverActive(true);
          setFeverSpinsLeft(8);
          return 0;
        }
        return next;
      });
    }

    // Boss Raid Combat Resolution
    if (activeMode === "boss_raid" && !bossDefeated) {
      resolveBossTurn(targetGrid, hitLines.length > 0);
    }

    // Scatter Socratic Bonus Trigger (3+ Scatters)
    if (scatterCount >= 3) {
      playBonusTriggerSound();
      const randomChallenge = SOCRATIC_CHALLENGES[Math.floor(Math.random() * SOCRATIC_CHALLENGES.length)];
      setActiveSocraticChallenge(randomChallenge);
      setSelectedChallengeOption(null);
      setSocraticResult(null);
      setSocraticTimer(20);
      setAutoSpinCount(0); // Pause auto spins
      return;
    }

    if (totalWinCredits > 0) {
      const isJackpot = hitLines.length >= 3 || totalWinCredits >= totalBet * 20;
      
      if (isJackpot) {
        playJackpotFanfare();
        setTotalJackpotsWon(prev => prev + 1);
        setShowWinCelebration(true);
        // Award high rarity loot crate for big wins!
        const crateRarity: LootRarity = totalWinCredits >= totalBet * 50 ? "legendary" : "epic";
        const droppedCrate = awardLootCrate(crateRarity, `Jackpot Slot Drop (${crateRarity.toUpperCase()})`, "New Age Slot Machine Mega Win");
        setAwardedCrate(droppedCrate);
      } else {
        playWinSound(totalWinCredits / totalBet);
      }

      setCredits(prev => prev + totalWinCredits);
      setLastWinAmount(totalWinCredits);
      setLastWinXP(totalWinXP);

      if (totalWinCredits > highestWin) {
        setHighestWin(totalWinCredits);
      }

      // Update Timed Rush metrics
      if (isRushActive) {
        setRushScore(prev => prev + totalWinCredits);
        setRushStreak(prev => Math.min(prev + 1, 10));
        setRushSpinsCount(prev => prev + 1);
      }

      // Add real XP to the student's profile!
      addXP(totalWinXP, `Slot Machine ${detectedBlueprint ? detectedBlueprint.name : "Win"}`);

      // Record metric
      recordGameSessionMetric({
        mode: "new_age_slots",
        title: detectedBlueprint ? `Slots: ${detectedBlueprint.name}` : "New Age Cloud Slots",
        score: totalWinCredits,
        accuracy: 100,
        questionsAttempted: 1,
        questionsCorrect: 1,
        maxStreak: rushStreak,
        avgResponseTimeMs: 1200,
        hintsUsed: 0,
        lifelinesUsed: 0,
        xpEarned: totalWinXP
      });

      setCanHold(false);
    } else {
      if (isRushActive) {
        setRushStreak(1); // Reset streak on miss
      }

      // Check near-miss for Hold / Nudge
      const s0 = targetGrid[1][0].id;
      const s1 = targetGrid[1][1].id;
      const s2 = targetGrid[1][2].id;
      if (s0 === s1 || s1 === s2 || s0 === s2) {
        setCanHold(true);
        // Randomly enable a Nudge on the non-matching column
        if (s0 === s1) setNudgeAvailable(2);
        else if (s1 === s2) setNudgeAvailable(0);
        else setNudgeAvailable(1);
      } else {
        setCanHold(false);
        setNudgeAvailable(null);
      }
    }

    // Handle Auto Spin decrement
    if (autoSpinCount > 1 && !scatterCount) {
      setTimeout(() => {
        setAutoSpinCount(prev => prev - 1);
      }, turboMode ? 400 : 1100);
    } else if (autoSpinCount === 1) {
      setAutoSpinCount(0);
    }
  };

  // Boss Raid Action Resolution
  const resolveBossTurn = (currentGrid: SlotSymbol[][], hadLineWin: boolean) => {
    let playerDmg = 0;
    let playerShieldAdd = 0;
    let playerHealAdd = 0;
    let isCrit = false;

    // Aggregate effects from all 9 symbols
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const sym = currentGrid[r][c];
        if (sym.bossEffect) {
          switch (sym.bossEffect.type) {
            case "damage":
              playerDmg += sym.bossEffect.value;
              break;
            case "shield":
              playerShieldAdd += sym.bossEffect.value;
              break;
            case "heal":
              playerHealAdd += sym.bossEffect.value;
              break;
            case "critical":
              playerDmg += sym.bossEffect.value;
              isCrit = true;
              break;
            case "buff":
              playerDmg *= 1.5;
              break;
          }
        }
      }
    }

    if (hadLineWin) {
      playerDmg = Math.round(playerDmg * 1.5);
    }

    // Apply Player Damage to Boss
    playBossDamageSound(isCrit);
    const updatedBossHp = Math.max(0, activeBoss.currentHp - playerDmg);
    setActiveBoss(prev => ({ ...prev, currentHp: updatedBossHp }));

    const logs: string[] = [];
    logs.push(`💥 Player dealt ${playerDmg.toLocaleString()} ${isCrit ? "CRITICAL " : ""}damage!`);

    if (playerShieldAdd > 0) {
      setPlayerShield(prev => prev + playerShieldAdd);
      logs.push(`🛡️ Shield fortified +${playerShieldAdd} barrier.`);
    }

    if (playerHealAdd > 0) {
      setPlayerHp(prev => Math.min(5000, prev + playerHealAdd));
      logs.push(`💚 Health recovered +${playerHealAdd} HP.`);
    }

    // Check Boss Victory
    if (updatedBossHp <= 0) {
      setBossDefeated(true);
      playJackpotFanfare();
      logs.push(`👑 VICTORY! ${activeBoss.name} has been defeated!`);
      const rewardCrate = awardLootCrate(activeBoss.lootReward, `${activeBoss.name} Slayer Drop`, "Boss Raid Victory");
      setAwardedCrate(rewardCrate);
      addXP(activeBoss.xpReward, `Defeated ${activeBoss.name}`);
      setBossCombatLogs(logs);
      return;
    }

    // Boss Counter-Attack
    setTimeout(() => {
      playBossAttackSound();
      const bossHit = activeBoss.attackPower;
      
      setPlayerShield(prevShield => {
        if (prevShield >= bossHit) {
          return prevShield - bossHit;
        } else {
          const remainingDamage = bossHit - prevShield;
          setPlayerHp(prevHp => Math.max(0, prevHp - remainingDamage));
          return 0;
        }
      });

      setBossCombatLogs([
        ...logs,
        `⚠️ ${activeBoss.name} used [${activeBoss.specialMove}] for ${bossHit} damage!`
      ]);
    }, 600);
  };

  // Reset Boss Raid
  const resetBossRaid = (bossIndex: number = 0) => {
    const selected = RAID_BOSSES[bossIndex];
    setActiveBoss({ ...selected, currentHp: selected.maxHp });
    setPlayerHp(5000);
    setPlayerShield(2000);
    setBossDefeated(false);
    setBossCombatLogs([`⚔️ Raid Initialized: ${selected.name} (${selected.title})`]);
  };

  // Nudge Function
  const nudgeReel = (colIndex: number, direction: "up" | "down") => {
    if (isSpinning || nudgeAvailable !== colIndex) return;
    playNudgeSound();

    setGrid(prev => {
      const next = [[...prev[0]], [...prev[1]], [...prev[2]]];
      if (direction === "down") {
        const topSym = getRandomSymbol();
        next[2][colIndex] = next[1][colIndex];
        next[1][colIndex] = next[0][colIndex];
        next[0][colIndex] = topSym;
      } else {
        const botSym = getRandomSymbol();
        next[0][colIndex] = next[1][colIndex];
        next[1][colIndex] = next[2][colIndex];
        next[2][colIndex] = botSym;
      }
      return next;
    });

    setNudgeAvailable(null);

    // Re-evaluate after nudge
    setTimeout(() => {
      const { totalWinCredits, totalWinXP, hitLines, detectedBlueprint } = evaluateGrid(grid, totalBet, false);
      if (totalWinCredits > 0) {
        playWinSound(2);
        setWinningLines(hitLines);
        setMatchedBlueprint(detectedBlueprint);
        setCredits(prev => prev + totalWinCredits);
        setLastWinAmount(totalWinCredits);
        setLastWinXP(totalWinXP);
        addXP(totalWinXP, "Nudge Architecture Match");
      }
    }, 200);
  };

  // Trigger auto spins
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning && !activeSocraticChallenge) {
      const timer = setTimeout(() => {
        spin(false);
      }, turboMode ? 250 : 750);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning, activeSocraticChallenge]);

  // Socratic Countdown timer
  useEffect(() => {
    if (!activeSocraticChallenge || socraticResult !== null) return;

    if (socraticTimer <= 0) {
      handleSocraticAnswer(-1); // Timeout
      return;
    }

    const interval = setInterval(() => {
      setSocraticTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSocraticChallenge, socraticTimer, socraticResult]);

  // Handle Socratic Answer Submission
  const handleSocraticAnswer = (optionIndex: number) => {
    if (!activeSocraticChallenge || socraticResult !== null) return;

    setSelectedChallengeOption(optionIndex);
    const isCorrect = optionIndex === activeSocraticChallenge.correctIndex;
    setSocraticResult(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      playJackpotFanfare();
      const bonusWin = totalBet * 50 * activeSocraticChallenge.multiplierReward;
      const bonusXP = 500 * activeSocraticChallenge.multiplierReward;
      
      setCredits(prev => prev + bonusWin);
      setLastWinAmount(bonusWin);
      setLastWinXP(bonusXP);
      addXP(bonusXP, "Socratic Jackpot Multiplier Arena Victory");
      
      // Award Mythic or Legendary Loot Crate
      const crate = awardLootCrate("legendary", "Socratic Super Jackpot Crate", "Answered Socratic Challenge Correctly");
      setAwardedCrate(crate);

      // Trigger 5 Free Spins Frenzy!
      setFreeSpinsRemaining(5);
      setFreeSpinMultiplier(3);
    } else {
      const consolationXP = 75;
      addXP(consolationXP, "Socratic Challenge Attempt");
    }
  };

  // Toggle Hold on Reel
  const toggleHoldReel = (colIndex: number) => {
    if (isSpinning || !canHold) return;
    playHoldLockSound();
    setHeldReels(prev => {
      const next = [...prev];
      next[colIndex] = !next[colIndex];
      return next;
    });
  };

  // Daily Free Credits Claim
  const claimFreeCredits = () => {
    playCoinDrop();
    setCredits(prev => prev + 500);
    alert("🎉 +500 Cloud Credits added to your spin bank!");
  };

  // Start 60s Rush
  const startRushMode = () => {
    setIsRushActive(true);
    setRushTimeLeft(60);
    setRushScore(0);
    setRushStreak(1);
    setRushSpinsCount(0);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Top Banner & Header with Game Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-[#FF9900] text-slate-950 px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <Crown className="w-3 h-3" /> Neo-Arcade Casino
              </span>
              {isFeverActive ? (
                <span className="bg-rose-500 text-white px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse flex items-center gap-1">
                  <Flame className="w-3 h-3" /> SUPER FEVER OVERDRIVE (3x WIN)
                </span>
              ) : (
                <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold">
                  PRO-ARCHITECT PHYSICS ENGINE
                </span>
              )}
              {freeSpinsRemaining > 0 && (
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-xs text-[10px] font-black animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {freeSpinsRemaining} FREE SPINS ({freeSpinMultiplier}x)
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Cloud Architect Neo-Slots <Sparkles className="w-6 h-6 text-[#FF9900] animate-spin-slow" />
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Pull the physical lever arm, trigger Wild Storms, match AWS architectural blueprints, and raid Cloud Monster Bosses for massive XP & Loot drops!
            </p>
          </div>

          {/* Credits Balance & Stats HUD */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="bg-slate-950/80 border border-amber-500/30 px-4 py-2.5 rounded-md flex items-center gap-3 shadow-inner">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black">
                <Coins className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider block">
                  {activeMode === "chaos_fever" ? "Chaos Bank (Free)" : "Spin Bank"}
                </span>
                <span className="text-lg font-black text-amber-400 font-mono tracking-tight">
                  {activeMode === "chaos_fever" ? "∞ UNLIMITED" : credits.toLocaleString()}{" "}
                  <span className="text-xs font-sans text-amber-300/70">Credits</span>
                </span>
              </div>
            </div>

            {activeMode !== "chaos_fever" && (
              <button
                onClick={claimFreeCredits}
                className="bg-gradient-to-r from-amber-500 to-[#FF9900] hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-2.5 rounded-md text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Claim +500 Free Daily Credits"
              >
                <Gift className="w-4 h-4" /> +500 Daily
              </button>
            )}
          </div>
        </div>

        {/* 4 Dedicated Game Mode Selectors */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          {/* Mode 1: Classic */}
          <button
            onClick={() => setActiveMode("classic")}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              activeMode === "classic"
                ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50 shadow-md font-bold"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black">Classic Slots</div>
              <div className="text-[9px] text-slate-400">Blueprints & Socratic</div>
            </div>
          </button>

          {/* Mode 2: Chaos Fever */}
          <button
            onClick={() => setActiveMode("chaos_fever")}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              activeMode === "chaos_fever"
                ? "bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400/50 shadow-md font-bold"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <div className="w-7 h-7 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black">Chaos Overdrive</div>
              <div className="text-[9px] text-slate-400">Free Play & Wild Storms</div>
            </div>
          </button>

          {/* Mode 3: 60s Timed Rush */}
          <button
            onClick={() => setActiveMode("timed_rush")}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              activeMode === "timed_rush"
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50 shadow-md font-bold"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <div className="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black">60s Cloud Rush</div>
              <div className="text-[9px] text-slate-400">Speed Marathon Sprint</div>
            </div>
          </button>

          {/* Mode 4: Boss Raid */}
          <button
            onClick={() => setActiveMode("boss_raid")}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
              activeMode === "boss_raid"
                ? "bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-400/50 shadow-md font-bold"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black">Boss Raid Arena</div>
              <div className="text-[9px] text-slate-400">PvE Monster Battle</div>
            </div>
          </button>

        </div>
      </div>

      {/* Mode-Specific Status Header Banners */}
      {activeMode === "chaos_fever" && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/40 p-3 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 font-bold">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-black text-rose-300 uppercase tracking-wider block">Fever Overdrive Gauge</span>
              <span className="text-[10px] text-slate-400">Fill gauge to 100% to unlock 8 Free Fever Spins with Guaranteed Wild Strikes!</span>
            </div>
          </div>

          <div className="w-full sm:w-64 flex items-center gap-2">
            <div className="flex-1 bg-slate-950 rounded-full h-3.5 border border-rose-500/40 p-0.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${isFeverActive ? 100 : feverGauge}%` }}
              />
            </div>
            <span className="text-xs font-mono font-black text-rose-400 min-w-8 text-right">
              {isFeverActive ? "100%" : `${feverGauge}%`}
            </span>
          </div>
        </div>
      )}

      {activeMode === "timed_rush" && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/40 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-300 font-black">
              <Timer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">60-Second Cloud Rush Sprint</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  {rushStreak}x Streak Multiplier
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">
                Current Score: <span className="text-amber-400 font-bold">{rushScore.toLocaleString()}</span> &bull; Spins: {rushSpinsCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-cyan-500/50 px-4 py-2 rounded-lg text-center font-mono">
              <span className="text-[9px] text-slate-400 block uppercase">Time Left</span>
              <span className={`text-xl font-black ${rushTimeLeft <= 10 ? "text-rose-400 animate-ping" : "text-cyan-400"}`}>
                {rushTimeLeft}s
              </span>
            </div>

            {!isRushActive && (
              <button
                onClick={startRushMode}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                {rushTimeLeft === 0 ? "Play Again (60s)" : "Start 60s Sprint"}
              </button>
            )}
          </div>
        </div>
      )}

      {activeMode === "boss_raid" && (
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-2 border-purple-500/50 p-4 rounded-xl shadow-2xl space-y-3">
          
          {/* Boss Header & HP */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                {activeBoss.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">{activeBoss.name}</h3>
                  <span className="bg-purple-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    {activeBoss.title}
                  </span>
                </div>
                <p className="text-[10px] text-purple-300 mt-0.5">{activeBoss.description}</p>
              </div>
            </div>

            {/* Boss Switcher */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {RAID_BOSSES.map((boss, idx) => (
                <button
                  key={boss.id}
                  onClick={() => resetBossRaid(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    activeBoss.id === boss.id
                      ? "bg-purple-500 text-slate-950 font-black shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {boss.avatar} {boss.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Dual HP Bars (Boss vs Player) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Boss HP Bar */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-purple-800/40">
              <div className="flex items-center justify-between text-xs font-black mb-1">
                <span className="text-purple-300 flex items-center gap-1">👾 Boss HP</span>
                <span className="text-rose-400 font-mono">{activeBoss.currentHp.toLocaleString()} / {activeBoss.maxHp.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-purple-900">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${(activeBoss.currentHp / activeBoss.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Player HP & Shield Bar */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-emerald-800/40">
              <div className="flex items-center justify-between text-xs font-black mb-1">
                <span className="text-emerald-300 flex items-center gap-1">🛡️ Cloud Architect Defenses</span>
                <span className="text-emerald-400 font-mono">
                  HP: {playerHp.toLocaleString()} &bull; Shield: {playerShield.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-emerald-900 flex gap-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${(playerHp / 5000) * 70}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${(playerShield / 2000) * 30}%` }}
                />
              </div>
            </div>

          </div>

          {/* Combat Log Live Telemetry */}
          <div className="bg-slate-950/80 p-2 rounded text-[10px] font-mono text-slate-300 border border-slate-800 flex items-center justify-between">
            <span className="truncate">{bossCombatLogs[bossCombatLogs.length - 1]}</span>
            {bossDefeated && (
              <button
                onClick={() => resetBossRaid(0)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 cursor-pointer ml-2"
              >
                Restart Raid
              </button>
            )}
          </div>

        </div>
      )}

      {/* Main Arcade Cabinet & Slot Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Slot Machine Display (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border-2 border-amber-500/40 rounded-xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          
          {/* LED Ticker Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 truncate">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">
                {activeMode === "boss_raid"
                  ? `PVE RAID: SPIN SYMBOLS TO ATTACK ${activeBoss.name.toUpperCase()}!`
                  : activeMode === "timed_rush"
                    ? "60S MARATHON: SPEED MULTIPLIER ACTIVE"
                    : isFeverActive
                      ? "⚡ OVERDRIVE FEVER ACTIVE: 3X PAYOUTS"
                      : "JACKPOT: 50,000 XP + MYTHIC CRATE"}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded transition-all cursor-pointer ${soundOn ? "text-amber-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"}`}
                title={soundOn ? "Mute Sound" : "Enable Sound"}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowPaytableModal(true)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition-all cursor-pointer font-bold"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#FF9900]" /> Paytable
              </button>
            </div>
          </div>

          {/* Cabinet Stage with Physical Lever Arm on Right */}
          <div className="flex items-center gap-3 relative">
            
            {/* Reel Frame Container */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-slate-800 rounded-lg p-3 sm:p-5 shadow-2xl overflow-hidden">
              
              {/* Payline Guides Indicator Labels on Left */}
              <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around text-[9px] font-mono font-black text-amber-500/60 pointer-events-none z-20">
                <span>L2</span>
                <span>L1</span>
                <span>L3</span>
              </div>

              {/* Wild Lightning Storm Visual Effect Overlay */}
              {wildStormActive && (
                <div className="absolute inset-0 z-30 pointer-events-none bg-cyan-500/10 border-2 border-cyan-400 animate-pulse flex items-center justify-center">
                  <div className="bg-slate-950/90 text-cyan-300 font-black text-xs px-3 py-1.5 rounded-full border border-cyan-400 shadow-xl flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 animate-bounce" /> WILD LIGHTNING STRIKE!
                  </div>
                </div>
              )}

              {/* 3-Column Slot Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                {[0, 1, 2].map((colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-2 relative">
                    
                    {/* The Reel Visual Column with Smooth Physics Scroll Look */}
                    <div className={`bg-slate-950/95 border-2 rounded-lg p-2 flex flex-col gap-2 sm:gap-3 transition-all ${
                      spinningReels[colIndex] 
                        ? "border-cyan-400 shadow-lg shadow-cyan-500/20" 
                        : heldReels[colIndex]
                          ? "border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20"
                          : "border-slate-800"
                    }`}>
                      {[0, 1, 2].map((rowIndex) => {
                        const sym = grid[rowIndex][colIndex];
                        const isHighlighted = winningLines.some(lineIdx => {
                          const line = PAYLINES[lineIdx];
                          return line.coords.some(([r, c]) => r === rowIndex && c === colIndex);
                        });

                        return (
                          <motion.div
                            key={rowIndex}
                            initial={{ y: 0 }}
                            animate={spinningReels[colIndex] ? { y: [0, -20, 20, 0] } : isHighlighted ? { scale: [1, 1.05, 1], rotate: [0, -5, 5, 0] } : { y: 0 }}
                            transition={spinningReels[colIndex] ? { repeat: Infinity, duration: 0.15, ease: "linear" } : isHighlighted ? { repeat: Infinity, duration: 0.5 } : { duration: 0.3 }}
                            className={`h-24 sm:h-28 rounded-md flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all duration-300 ${
                              spinningReels[colIndex]
                                ? "blur-xs scale-95 opacity-80"
                                : isHighlighted
                                  ? "ring-2 ring-amber-400 bg-amber-500/20 scale-105 shadow-lg shadow-amber-500/30"
                                  : "bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80"
                            }`}
                          >
                            {/* Symbol Emoji & Background */}
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-1 shadow-md transition-transform ${sym.iconBg} ${isHighlighted ? "animate-bounce" : ""}`}>
                              {sym.emoji}
                            </div>

                            {/* Symbol Label */}
                            <span className={`text-[10px] sm:text-xs font-black truncate max-w-full tracking-tight ${sym.textColor}`}>
                              {sym.name}
                            </span>
                            
                            {/* Tiny AWS Tag */}
                            <span className="text-[8px] text-slate-400 font-mono truncate max-w-full">
                              {sym.awsService}
                            </span>

                            {/* Badges for Wild / Scatter */}
                            {sym.isWild && (
                              <span className="absolute top-1 right-1 bg-cyan-500 text-slate-950 text-[7px] font-black px-1 rounded-xs uppercase">
                                WILD
                              </span>
                            )}
                            {sym.isScatter && (
                              <span className="absolute top-1 right-1 bg-purple-500 text-white text-[7px] font-black px-1 rounded-xs uppercase animate-pulse">
                                BONUS
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Hold Button / Nudge Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHoldReel(colIndex)}
                        disabled={isSpinning || !canHold}
                        className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          heldReels[colIndex]
                            ? "bg-amber-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300"
                            : canHold
                              ? "bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-400/40"
                              : "bg-slate-950/60 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50"
                        }`}
                        title={canHold ? "Hold this reel for the next spin" : "Hold unlocks on partial matches"}
                      >
                        {heldReels[colIndex] ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {heldReels[colIndex] ? "HELD" : "HOLD"}
                      </button>

                      {/* Nudge Controls (Up/Down) when unlocked */}
                      {nudgeAvailable === colIndex && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => nudgeReel(colIndex, "up")}
                            className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-xs"
                            title="Nudge Reel Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => nudgeReel(colIndex, "down")}
                            className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-xs"
                            title="Nudge Reel Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payline Overlays When Winning */}
              {winningLines.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                  <div className="bg-slate-950/90 border-2 border-amber-400 px-6 py-3.5 rounded-xl shadow-2xl text-center animate-bounce">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">
                      {matchedBlueprint ? `⚡ ${matchedBlueprint.name}!` : "🎉 WINNER!"}
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      +{lastWinAmount.toLocaleString()} Credits &bull; +{lastWinXP} XP
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Tactile Lever Arm on Right */}
            <div 
              onClick={() => !isSpinning && spin(true)}
              className="hidden sm:flex flex-col items-center justify-center cursor-pointer group select-none pl-1"
              title="Click to pull lever and spin!"
            >
              {/* Lever Arm Handle */}
              <div className="relative w-6 h-36 flex flex-col items-center">
                {/* Red Ball Knob */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 via-red-600 to-rose-800 shadow-xl border-2 border-red-300 z-10 transition-transform duration-200 ${
                  isLeverPulled ? "translate-y-20 scale-90" : "group-hover:-translate-y-1 group-active:translate-y-20"
                }`} />
                {/* Chrome Rod */}
                <div className={`w-2.5 flex-1 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-sm shadow-inner transition-transform duration-200 ${
                  isLeverPulled ? "scale-y-50 origin-bottom" : "group-active:scale-y-50 origin-bottom"
                }`} />
                {/* Base Joint */}
                <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-1 group-hover:text-amber-400">
                PULL
              </span>
            </div>

          </div>

          {/* Bottom Machine Dashboard Controls */}
          <div className="mt-5 space-y-4">
            
            {/* Bet Settings Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              
              {/* Bet Per Line */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bet Per Line</label>
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => setBetPerLine(val)}
                      disabled={isSpinning}
                      className={`flex-1 py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                        betPerLine === val
                          ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paylines Active */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lines (1-5)</label>
                <div className="flex items-center gap-1">
                  {[1, 3, 5].map(lines => (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      key={lines}
                      onClick={() => setActiveLinesCount(lines)}
                      disabled={isSpinning}
                      className={`flex-1 py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                        activeLinesCount === lines
                          ? "bg-cyan-500 text-slate-950 font-black shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {lines}L
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Multiplier */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Multiplier</label>
                <div className="flex items-center gap-1">
                  {[1, 3, 5].map(mult => (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      key={mult}
                      onClick={() => setSpinMultiplier(mult)}
                      disabled={isSpinning}
                      className={`flex-1 py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                        spinMultiplier === mult
                          ? "bg-rose-500 text-white font-black shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {mult}x
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Total Bet Display */}
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Stake</span>
                <span className="text-sm font-black text-white font-mono">
                  {totalBet} <span className="text-xs text-amber-400">{activeMode === "chaos_fever" ? "Chaos Pts" : "Credits"}</span>
                </span>
              </div>

              {/* Turbo Toggle */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setTurboMode(!turboMode)}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    turboMode ? "bg-red-500 text-white shadow-red-500/30 shadow-md" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Turbo {turboMode ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="flex items-center gap-3">
              
              {/* Auto Spin Buttons */}
              <div className="flex items-center gap-1.5">
                {autoSpinCount > 0 ? (
                  <button
                    onClick={() => setAutoSpinCount(0)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-3.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" /> Stop Auto ({autoSpinCount})
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    {[5, 10, 25].map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          setAutoSpinCount(count);
                          spin(true);
                        }}
                        disabled={isSpinning}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-3 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                        title={`Auto-spin ${count} rounds`}
                      >
                        Auto {count}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Spin Button */}
              <button
                onClick={() => spin(true)}
                disabled={isSpinning}
                className={`flex-1 py-3.5 sm:py-4 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                  isSpinning
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : isFeverActive
                      ? "bg-gradient-to-r from-rose-500 via-purple-500 to-amber-400 text-white hover:brightness-110 scale-102 ring-4 ring-rose-500/40"
                      : freeSpinsRemaining > 0
                        ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-emerald-400 scale-102 ring-4 ring-emerald-500/30"
                        : "bg-gradient-to-r from-[#FF9900] via-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-98 ring-4 ring-amber-500/30"
                }`}
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" /> SPINNING REELS...
                  </>
                ) : isFeverActive ? (
                  <>
                    <Flame className="w-5 h-5 animate-bounce" /> FEVER SPIN ({feverSpinsLeft} LEFT)
                  </>
                ) : freeSpinsRemaining > 0 ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" /> FREE SPIN ({freeSpinsRemaining} LEFT)
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" /> PULL LEVER / SPIN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Architectural Sidebar & Blueprints (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Architectural Blueprints Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF9900]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Active Blueprints</h3>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">SYNERGY BONUS</span>
            </div>

            <div className="space-y-2.5">
              {BLUEPRINT_COMBOS.map((bp) => {
                const isCurrentMatch = matchedBlueprint?.id === bp.id;
                return (
                  <div
                    key={bp.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCurrentMatch
                        ? "bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/40"
                        : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{bp.name}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {bp.bonusMultiplier}x +{bp.xpBonus} XP
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">{bp.description}</p>

                    <div className="flex items-center gap-1 mt-2">
                      {bp.symbolsRequired.map(symId => {
                        const sym = SLOT_SYMBOLS.find(s => s.id === symId);
                        return (
                          <span key={symId} className="text-xs bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300 flex items-center gap-1 font-mono text-[9px]">
                            {sym?.emoji} {sym?.name.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine Session Performance HUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Casino Telemetry</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Highest Win</span>
                <span className="text-sm font-black text-amber-400 font-mono">+{highestWin.toLocaleString()} <span className="text-[9px] font-sans">Credits</span></span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Jackpots Hit</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{totalJackpotsWon} 👑</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-3 rounded-lg border border-purple-800/40">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-300 uppercase">Socratic Scatter Rule</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal">
                Land 3 🤖 Swarm AI Scatters anywhere on the screen to trigger the Socratic Bonus Arena and unlock 5 Free Spins + 5x Win Multipliers!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Socratic Multiplier Challenge Modal */}
      {activeSocraticChallenge && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500 max-w-xl w-full rounded-xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Socratic Multiplier Arena</h3>
                  <span className="text-[10px] text-purple-400 font-mono">Solve the scenario to double your jackpot + unlock Free Spins!</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-purple-500/40">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span className="text-xs font-mono font-black text-amber-400">{socraticTimer}s</span>
              </div>
            </div>

            {/* Question Box */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
                {activeSocraticChallenge.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {activeSocraticChallenge.options.map((opt, idx) => {
                const isSelected = selectedChallengeOption === idx;
                const isCorrect = idx === activeSocraticChallenge.correctIndex;
                const showFeedback = socraticResult !== null;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSocraticAnswer(idx)}
                    disabled={showFeedback}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      showFeedback
                        ? isCorrect
                          ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold"
                          : isSelected
                            ? "bg-rose-950/80 border-rose-500 text-rose-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 opacity-60"
                        : isSelected
                          ? "bg-purple-950 border-purple-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span>{opt}</span>
                    {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {showFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Result Explanation */}
            {socraticResult !== null && (
              <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                socraticResult === "correct"
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                  : "bg-rose-950/60 border-rose-500 text-rose-200"
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {socraticResult === "correct" ? "🎉 Correct! Multiplier Super Jackpot Unlocked!" : "❌ Incorrect Scenario Answer"}
                </div>
                <p className="text-[11px] leading-normal">{activeSocraticChallenge.explanation}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveSocraticChallenge(null)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Continue Spinning
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loot Crate Award Modal */}
      {awardedCrate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-400 max-w-sm w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-amber-500/30 animate-bounce">
              🎁
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${RARITY_COLORS[awardedCrate.rarity]}`}>
                {awardedCrate.rarity} Crate Awarded
              </span>
              <h3 className="text-lg font-black text-white mt-1.5">{awardedCrate.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{awardedCrate.source}</p>
            </div>
            <button
              onClick={() => setAwardedCrate(null)}
              className="w-full bg-gradient-to-r from-amber-400 to-[#FF9900] text-slate-950 font-black py-2.5 rounded-lg text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
            >
              Collect & Store in Vault
            </button>
          </div>
        </div>
      )}

      {/* Paytable Modal */}
      {showPaytableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">Cloud Slots Paytable</h3>
              </div>
              <button
                onClick={() => setShowPaytableModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2.5 py-1 rounded cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SLOT_SYMBOLS.map(sym => (
                <div key={sym.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{sym.emoji}</span>
                    <div>
                      <span className={`text-xs font-black ${sym.textColor}`}>{sym.name}</span>
                      <span className="text-[10px] text-slate-400 block">{sym.awsService}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                    {sym.multiplier}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
