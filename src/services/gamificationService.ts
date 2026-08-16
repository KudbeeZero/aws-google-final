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
  swarmBounties: DEFAULT_SWARM_BOUNTIES
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
