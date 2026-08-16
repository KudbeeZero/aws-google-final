export type LootRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface LootItem {
  id: string;
  name: string;
  rarity: LootRarity;
  type: "xp_boost" | "badge" | "token" | "cheat_sheet" | "swarm_artifact";
  description: string;
  icon: string;
  value?: number;
  obtainedAt: string;
}

export interface LootCrate {
  id: string;
  title: string;
  rarity: LootRarity;
  tier: string;
  source: string;
  isOpened: boolean;
  openedAt?: string;
  contents?: LootItem[];
}

export interface SwarmBounty {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  title: string;
  task: string;
  xpReward: number;
  crateRarity: LootRarity;
  isCompleted: boolean;
  completedAt?: string;
}

export interface GameSessionMetric {
  id: string;
  mode: "blitz_rush" | "trap_simulator" | "scenario_match" | "distractor_defense" | "new_age_slots";
  title: string;
  timestamp: string;
  score: number;
  accuracy: number; // percentage (0-100)
  questionsAttempted: number;
  questionsCorrect: number;
  maxStreak: number;
  avgResponseTimeMs: number;
  hintsUsed: number;
  lifelinesUsed: number;
  xpEarned: number;
  domainBreakdown?: Record<string, { attempted: number; correct: number }>;
}

export interface ExtendedGameMetrics {
  totalGamesPlayed: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  overallAccuracy: number;
  allTimeHighStreak: number;
  allTimeHighScore: number;
  fastestAnswerTimeMs: number;
  avgAnswerTimeMs: number;
  totalHintsUsed: number;
  totalLifelinesUsed: number;
  freezeLifelinesCount: number;
  fiftyFiftyCount: number;
  agentWhisperCount: number;
  streakShieldCount: number;
  domainStats: Record<string, { correct: number; total: number; name: string }>;
  recentSessions: GameSessionMetric[];
  ratingTier: "Novice" | "Apprentice" | "Specialist" | "Master" | "Cloud Grandmaster";
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  cratesInventory: LootCrate[];
  unlockedBadges: string[];
  unlockedArtifacts: LootItem[];
  xpMultiplier: number;
  multiplierExpiresAt?: string;
  totalCheckpointsAnswered: number;
  totalCheckpointsCorrect: number;
  lastDailyClaimDate?: string;
  completedBountyIds: string[];
  swarmBounties: SwarmBounty[];
  // Enhanced Game Metrics and Lifelines state
  gameMetrics?: ExtendedGameMetrics;
}

const STORAGE_KEY = "aws_gamification_v2";

const RARITY_COLORS: Record<LootRarity, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-500", bg: "bg-slate-800", text: "text-slate-300", glow: "shadow-slate-500/20" },
  rare: { border: "border-blue-500", bg: "bg-blue-950", text: "text-blue-400", glow: "shadow-blue-500/30" },
  epic: { border: "border-purple-500", bg: "bg-purple-950", text: "text-purple-400", glow: "shadow-purple-500/30" },
  legendary: { border: "border-amber-500", bg: "bg-amber-950", text: "text-amber-400", glow: "shadow-amber-500/40" },
  mythic: { border: "border-pink-500", bg: "bg-pink-950", text: "text-pink-400", glow: "shadow-pink-500/50" }
};

export { RARITY_COLORS };

export const DEFAULT_SWARM_BOUNTIES: SwarmBounty[] = [
  {
    id: "bounty-1",
    agentId: "ag-1",
    agentName: "Archie",
    agentEmoji: "🏗️",
    title: "Multi-AZ VPC Resilience Audit",
    task: "Design active-passive multi-region failover strategy with Route 53 latency routing and Aurora Global Database replication with RPO < 1 min.",
    xpReward: 250,
    crateRarity: "rare",
    isCompleted: false
  },
  {
    id: "bounty-2",
    agentId: "ag-2",
    agentName: "Guardian",
    agentEmoji: "🛡️",
    title: "Zero-Trust IAM Policy & KMS Audit",
    task: "Identify least-privilege violations across IAM user policies and enforce AWS KMS Customer Managed Keys (CMK) with automated annual rotation.",
    xpReward: 300,
    crateRarity: "epic",
    isCompleted: false
  },
  {
    id: "bounty-3",
    agentId: "ag-3",
    agentName: "PennyWise",
    agentEmoji: "💰",
    title: "Compute FinOps: Spot vs Savings Plans",
    task: "Calculate 3-year Compute Savings Plans vs Spot Fleet instance pricing for asynchronous batch video encoding with 60% budget reduction.",
    xpReward: 200,
    crateRarity: "rare",
    isCompleted: false
  },
  {
    id: "bounty-4",
    agentId: "ag-4",
    agentName: "TrapMaster",
    agentEmoji: "⚡",
    title: "Anti-Distractor: VPC Endpoints vs NAT Gateway",
    task: "Dissect why Gateway VPC Endpoints are free for S3/DynamoDB while Interface VPC Endpoints (PrivateLink) and NAT Gateways incur hourly + data processing charges.",
    xpReward: 350,
    crateRarity: "legendary",
    isCompleted: false
  },
  {
    id: "bounty-5",
    agentId: "ag-5",
    agentName: "Alex",
    agentEmoji: "🤝",
    title: "Socratic Peer Active Recall Sprint",
    task: "Explain the AWS Shared Responsibility Model distinctions for RDS vs EC2 database hosting in plain English with a real-world metaphor.",
    xpReward: 150,
    crateRarity: "common",
    isCompleted: false
  }
];

// Calculate level based on XP (every 500 XP = 1 Level)
export const calculateLevel = (xp: number): number => {
  return Math.max(1, Math.floor(xp / 500) + 1);
};

export const getXPForNextLevel = (xp: number): { currentLevelXP: number; maxLevelXP: number; percentage: number } => {
  const currentLevel = calculateLevel(xp);
  const currentLevelBaseXP = (currentLevel - 1) * 500;
  const currentLevelXP = xp - currentLevelBaseXP;
  const maxLevelXP = 500;
  const percentage = Math.min(100, Math.round((currentLevelXP / maxLevelXP) * 100));
  return { currentLevelXP, maxLevelXP, percentage };
};

export const DEFAULT_GAME_METRICS: ExtendedGameMetrics = {
  totalGamesPlayed: 6,
  totalQuestionsAnswered: 48,
  totalQuestionsCorrect: 41,
  overallAccuracy: 85,
  allTimeHighStreak: 8,
  allTimeHighScore: 2450,
  fastestAnswerTimeMs: 1420,
  avgAnswerTimeMs: 3200,
  totalHintsUsed: 5,
  totalLifelinesUsed: 3,
  freezeLifelinesCount: 2,
  fiftyFiftyCount: 3,
  agentWhisperCount: 2,
  streakShieldCount: 1,
  domainStats: {
    "cloud-concepts": { correct: 12, total: 14, name: "Cloud Concepts (24%)" },
    "security-compliance": { correct: 11, total: 13, name: "Security & Compliance (30%)" },
    "cloud-technology": { correct: 10, total: 12, name: "Cloud Technology & Services (34%)" },
    "billing-pricing": { correct: 8, total: 9, name: "Billing, Pricing & Support (12%)" }
  },
  recentSessions: [
    {
      id: "sess-init-1",
      mode: "blitz_rush",
      title: "Blitz Rush 60s Sprint",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      score: 1800,
      accuracy: 88,
      questionsAttempted: 8,
      questionsCorrect: 7,
      maxStreak: 6,
      avgResponseTimeMs: 2800,
      hintsUsed: 1,
      lifelinesUsed: 1,
      xpEarned: 350
    },
    {
      id: "sess-init-2",
      mode: "trap_simulator",
      title: "Exam Trap & Distractor Run",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      score: 1400,
      accuracy: 83,
      questionsAttempted: 6,
      questionsCorrect: 5,
      maxStreak: 4,
      avgResponseTimeMs: 4100,
      hintsUsed: 2,
      lifelinesUsed: 1,
      xpEarned: 250
    }
  ],
  ratingTier: "Specialist"
};

const DEFAULT_PROFILE: GamificationProfile = {
  xp: 350,
  level: 1,
  streakDays: 3,
  cratesInventory: [
    {
      id: "crate-starter",
      title: "Novice Practitioner Crate",
      rarity: "rare",
      tier: "Tier 1",
      source: "Welcome Pack",
      isOpened: false
    }
  ],
  unlockedBadges: ["Cloud Initiate", "First Socratic Drill"],
  unlockedArtifacts: [],
  xpMultiplier: 1.0,
  totalCheckpointsAnswered: 4,
  totalCheckpointsCorrect: 3,
  completedBountyIds: [],
  swarmBounties: DEFAULT_SWARM_BOUNTIES,
  gameMetrics: DEFAULT_GAME_METRICS
};

// Event emitter subscribers
type GamificationListener = (profile: GamificationProfile) => void;
const listeners: Set<GamificationListener> = new Set();

export const subscribeGamification = (listener: GamificationListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (profile: GamificationProfile) => {
  listeners.forEach((fn) => {
    try {
      fn(profile);
    } catch (err) {
      console.error("Gamification listener error:", err);
    }
  });
};

export const getGamificationProfile = (): GamificationProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      swarmBounties: parsed.swarmBounties && parsed.swarmBounties.length > 0 ? parsed.swarmBounties : DEFAULT_SWARM_BOUNTIES,
      gameMetrics: parsed.gameMetrics ? { ...DEFAULT_GAME_METRICS, ...parsed.gameMetrics } : DEFAULT_GAME_METRICS,
      level: calculateLevel(parsed.xp || DEFAULT_PROFILE.xp)
    };
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveGamificationProfile = (profile: GamificationProfile): void => {
  try {
    profile.level = calculateLevel(profile.xp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    notifyListeners(profile);
  } catch (err) {
    console.error("Error saving gamification profile:", err);
  }
};

export const addXP = (amount: number, source: string): { newXP: number; newLevel: number; leveledUp: boolean; bonusCrate?: LootCrate } => {
  const profile = getGamificationProfile();
  const oldLevel = calculateLevel(profile.xp);
  
  // Check active multiplier
  let finalMultiplier = profile.xpMultiplier || 1.0;
  if (profile.multiplierExpiresAt && new Date(profile.multiplierExpiresAt) < new Date()) {
    finalMultiplier = 1.0;
    profile.xpMultiplier = 1.0;
  }

  const earnedXP = Math.round(amount * finalMultiplier);
  profile.xp += earnedXP;
  const newLevel = calculateLevel(profile.xp);
  const leveledUp = newLevel > oldLevel;

  let bonusCrate: LootCrate | undefined;
  if (leveledUp) {
    bonusCrate = {
      id: `crate-lvl-${newLevel}-${Date.now()}`,
      title: `Level ${newLevel} Mastery Crate`,
      rarity: newLevel >= 5 ? "legendary" : newLevel >= 3 ? "epic" : "rare",
      tier: `Level ${newLevel} Reward`,
      source: `Ranked up to Level ${newLevel}`,
      isOpened: false
    };
    profile.cratesInventory.unshift(bonusCrate);
    profile.unlockedBadges.push(`Level ${newLevel} Cloud Veteran`);
  }

  saveGamificationProfile(profile);
  return { newXP: profile.xp, newLevel, leveledUp, bonusCrate };
};

export const awardLootCrate = (rarity: LootRarity, title: string, source: string): LootCrate => {
  const profile = getGamificationProfile();
  const newCrate: LootCrate = {
    id: `crate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    rarity,
    tier: rarity.toUpperCase(),
    source,
    isOpened: false
  };

  profile.cratesInventory.unshift(newCrate);
  saveGamificationProfile(profile);
  return newCrate;
};

// Generates high-yield rewards based on crate rarity
export const openLootCrate = (crateId: string): { crate: LootCrate; rewards: LootItem[]; xpEarned: number } => {
  const profile = getGamificationProfile();
  const crateIdx = profile.cratesInventory.findIndex((c) => c.id === crateId);
  
  if (crateIdx === -1) {
    throw new Error("Loot crate not found in inventory");
  }

  const crate = profile.cratesInventory[crateIdx];
  if (crate.isOpened && crate.contents) {
    return { crate, rewards: crate.contents, xpEarned: 0 };
  }

  const possibleRewards: Record<LootRarity, LootItem[]> = {
    common: [
      { id: "item-xp-100", name: "+100 Exam XP Surge", rarity: "common", type: "xp_boost", description: "Instantly adds 100 XP to your Cloud Practitioner rank.", icon: "⚡", value: 100, obtainedAt: new Date().toISOString() },
      { id: "item-tip-s3", name: "S3 Lifecycle Cheat Card", rarity: "common", type: "cheat_sheet", description: "Quick reference card: Standard -> IA (30 days) -> Glacier (90 days) -> Deep Archive (180 days).", icon: "📦", obtainedAt: new Date().toISOString() }
    ],
    rare: [
      { id: "item-xp-250", name: "+250 Exam XP Burst", rarity: "rare", type: "xp_boost", description: "Adds 250 XP towards your next mastery rank.", icon: "⚡", value: 250, obtainedAt: new Date().toISOString() },
      { id: "item-badge-arch", name: "Archie's Blueprint Key", rarity: "rare", type: "swarm_artifact", description: "Architectural clearance token unlocked from Agent Archie.", icon: "🏗️", obtainedAt: new Date().toISOString() },
      { id: "item-mult-15", name: "1.5x XP Multiplier (24 Hours)", rarity: "rare", type: "xp_boost", description: "Boosts all session study XP by 50% for 24 hours.", icon: "🔥", value: 1.5, obtainedAt: new Date().toISOString() }
    ],
    epic: [
      { id: "item-xp-500", name: "+500 Exam XP Mega-Burst", rarity: "epic", type: "xp_boost", description: "Massive 500 XP surge straight into your profile.", icon: "🌟", value: 500, obtainedAt: new Date().toISOString() },
      { id: "item-badge-secops", name: "Guardian's Zero-Trust Shield", rarity: "epic", type: "badge", description: "Exclusive SecOps artifact certifying mastery over KMS and WAF.", icon: "🛡️", obtainedAt: new Date().toISOString() },
      { id: "item-mult-20", name: "2.0x Double XP Boost (24 Hours)", rarity: "epic", type: "xp_boost", description: "Doubles all quiz and professor study XP.", icon: "🚀", value: 2.0, obtainedAt: new Date().toISOString() }
    ],
    legendary: [
      { id: "item-xp-1000", name: "+1000 Mythic Exam XP", rarity: "legendary", type: "xp_boost", description: "Instant 1,000 XP mastery jump!", icon: "👑", value: 1000, obtainedAt: new Date().toISOString() },
      { id: "item-algo-token", name: "Algorand ASA Study Token (TestNet)", rarity: "legendary", type: "token", description: "Blockchain-verified study achievement token on Algorand TestNet.", icon: "💎", obtainedAt: new Date().toISOString() },
      { id: "item-trap-slayer", name: "TrapMaster's Anti-Distractor Ring", rarity: "legendary", type: "swarm_artifact", description: "Bypasses all exam trick wording traps with +100% confidence.", icon: "⚡", obtainedAt: new Date().toISOString() }
    ],
    mythic: [
      { id: "item-xp-2000", name: "+2000 Godlike Knowledge Core", rarity: "mythic", type: "xp_boost", description: "Unprecedented 2,000 XP leap into elite tier!", icon: "🌌", value: 2000, obtainedAt: new Date().toISOString() },
      { id: "item-title-guru", name: "Title: Master of the Swarm", rarity: "mythic", type: "badge", description: "Ultimate achievement title unlocked for your candidate profile.", icon: "🏆", obtainedAt: new Date().toISOString() }
    ]
  };

  const pool = possibleRewards[crate.rarity] || possibleRewards.common;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  
  let xpEarned = 0;
  if (picked.type === "xp_boost" && picked.value && picked.value >= 50) {
    xpEarned = picked.value;
    profile.xp += xpEarned;
  } else if (picked.type === "xp_boost" && picked.value && picked.value <= 3.0) {
    profile.xpMultiplier = picked.value;
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    profile.multiplierExpiresAt = expires.toISOString();
  }

  if (picked.type === "badge" || picked.type === "swarm_artifact") {
    if (!profile.unlockedBadges.includes(picked.name)) {
      profile.unlockedBadges.push(picked.name);
    }
    profile.unlockedArtifacts.unshift(picked);
  }

  crate.isOpened = true;
  crate.openedAt = new Date().toISOString();
  crate.contents = [picked];

  profile.cratesInventory[crateIdx] = crate;
  saveGamificationProfile(profile);

  return { crate, rewards: [picked], xpEarned };
};

export const claimDailyCrate = (): { success: boolean; crate?: LootCrate; message: string } => {
  const profile = getGamificationProfile();
  const todayStr = new Date().toISOString().split("T")[0];

  if (profile.lastDailyClaimDate === todayStr) {
    return {
      success: false,
      message: "You have already claimed today's daily loot crate! Check back tomorrow for your next reward."
    };
  }

  const crate = awardLootCrate("rare", "Daily AWS Mystery Crate", "Daily Login Reward");
  profile.lastDailyClaimDate = todayStr;
  profile.streakDays = (profile.streakDays || 0) + 1;
  saveGamificationProfile(profile);

  return {
    success: true,
    crate,
    message: `🎉 Daily Mystery Crate claimed! You are on a ${profile.streakDays}-Day study streak!`
  };
};

export const recordProfessorCheckpoint = (isCorrect: boolean): { xpEarned: number; crateDropped?: LootCrate } => {
  const profile = getGamificationProfile();
  profile.totalCheckpointsAnswered += 1;
  
  let xpEarned = isCorrect ? 50 : 15;
  if (isCorrect) {
    profile.totalCheckpointsCorrect += 1;
  }

  // 25% chance of a Mystery Loot Crate drop on a correct answer!
  let crateDropped: LootCrate | undefined;
  if (isCorrect && Math.random() < 0.25) {
    const rarity: LootRarity = Math.random() < 0.1 ? "epic" : "rare";
    crateDropped = awardLootCrate(rarity, "Professor's Socratic Bonus Crate", "Answered Socratic Checkpoint Correctly");
  }

  addXP(xpEarned, isCorrect ? "Socratic Checkpoint Victory" : "Socratic Practice Attempt");
  return { xpEarned, crateDropped };
};

// Calculate user rating tier based on overall accuracy and high streak
export const calculateRatingTier = (accuracy: number, gamesPlayed: number, maxStreak: number): ExtendedGameMetrics["ratingTier"] => {
  if (gamesPlayed >= 15 && accuracy >= 90 && maxStreak >= 10) return "Cloud Grandmaster";
  if (gamesPlayed >= 10 && accuracy >= 85 && maxStreak >= 7) return "Master";
  if (gamesPlayed >= 5 && accuracy >= 75) return "Specialist";
  if (gamesPlayed >= 2) return "Apprentice";
  return "Novice";
};

// Record comprehensive game session metrics
export const recordGameSessionMetric = (
  sessionData: Omit<GameSessionMetric, "id" | "timestamp">
): { updatedMetrics: ExtendedGameMetrics; profile: GamificationProfile } => {
  const profile = getGamificationProfile();
  const metrics: ExtendedGameMetrics = profile.gameMetrics || { ...DEFAULT_GAME_METRICS };

  const session: GameSessionMetric = {
    ...sessionData,
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  // Update aggregated game metrics
  metrics.totalGamesPlayed += 1;
  metrics.totalQuestionsAnswered += session.questionsAttempted;
  metrics.totalQuestionsCorrect += session.questionsCorrect;
  metrics.overallAccuracy = Math.round((metrics.totalQuestionsCorrect / Math.max(1, metrics.totalQuestionsAnswered)) * 100);
  metrics.allTimeHighStreak = Math.max(metrics.allTimeHighStreak, session.maxStreak);
  metrics.allTimeHighScore = Math.max(metrics.allTimeHighScore, session.score);
  
  if (session.avgResponseTimeMs > 0) {
    if (metrics.avgAnswerTimeMs === 0) {
      metrics.avgAnswerTimeMs = session.avgResponseTimeMs;
    } else {
      metrics.avgAnswerTimeMs = Math.round((metrics.avgAnswerTimeMs + session.avgResponseTimeMs) / 2);
    }
  }

  if (session.avgResponseTimeMs > 0 && (metrics.fastestAnswerTimeMs === 0 || session.avgResponseTimeMs < metrics.fastestAnswerTimeMs)) {
    metrics.fastestAnswerTimeMs = session.avgResponseTimeMs;
  }

  metrics.totalHintsUsed += session.hintsUsed;
  metrics.totalLifelinesUsed += session.lifelinesUsed;

  // Merge domain breakdowns if available
  if (session.domainBreakdown) {
    Object.entries(session.domainBreakdown).forEach(([domainKey, data]) => {
      if (metrics.domainStats[domainKey]) {
        metrics.domainStats[domainKey].correct += data.correct;
        metrics.domainStats[domainKey].total += data.attempted;
      }
    });
  }

  // Prepend session to recent history (keep up to 20)
  metrics.recentSessions = [session, ...(metrics.recentSessions || [])].slice(0, 20);
  metrics.ratingTier = calculateRatingTier(metrics.overallAccuracy, metrics.totalGamesPlayed, metrics.allTimeHighStreak);

  profile.gameMetrics = metrics;
  saveGamificationProfile(profile);

  return { updatedMetrics: metrics, profile };
};

// Lifeline consumption
export const consumeLifeline = (
  type: "freeze" | "fiftyFifty" | "agentWhisper" | "streakShield"
): { success: boolean; remaining: number } => {
  const profile = getGamificationProfile();
  const metrics = profile.gameMetrics || { ...DEFAULT_GAME_METRICS };

  let currentCount = 0;
  if (type === "freeze") currentCount = metrics.freezeLifelinesCount || 0;
  else if (type === "fiftyFifty") currentCount = metrics.fiftyFiftyCount || 0;
  else if (type === "agentWhisper") currentCount = metrics.agentWhisperCount || 0;
  else if (type === "streakShield") currentCount = metrics.streakShieldCount || 0;

  if (currentCount <= 0) {
    return { success: false, remaining: 0 };
  }

  if (type === "freeze") metrics.freezeLifelinesCount = currentCount - 1;
  else if (type === "fiftyFifty") metrics.fiftyFiftyCount = currentCount - 1;
  else if (type === "agentWhisper") metrics.agentWhisperCount = currentCount - 1;
  else if (type === "streakShield") metrics.streakShieldCount = currentCount - 1;

  metrics.totalLifelinesUsed += 1;
  profile.gameMetrics = metrics;
  saveGamificationProfile(profile);

  return { success: true, remaining: currentCount - 1 };
};

// Lifeline replenishment
export const replenishLifelines = (
  type: "freeze" | "fiftyFifty" | "agentWhisper" | "streakShield",
  count: number = 1
): number => {
  const profile = getGamificationProfile();
  const metrics = profile.gameMetrics || { ...DEFAULT_GAME_METRICS };

  if (type === "freeze") metrics.freezeLifelinesCount = (metrics.freezeLifelinesCount || 0) + count;
  else if (type === "fiftyFifty") metrics.fiftyFiftyCount = (metrics.fiftyFiftyCount || 0) + count;
  else if (type === "agentWhisper") metrics.agentWhisperCount = (metrics.agentWhisperCount || 0) + count;
  else if (type === "streakShield") metrics.streakShieldCount = (metrics.streakShieldCount || 0) + count;

  profile.gameMetrics = metrics;
  saveGamificationProfile(profile);

  return type === "freeze" ? metrics.freezeLifelinesCount
    : type === "fiftyFifty" ? metrics.fiftyFiftyCount
    : type === "agentWhisper" ? metrics.agentWhisperCount
    : metrics.streakShieldCount;
};

