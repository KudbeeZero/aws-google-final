import { Flashcard, TrickQuestion } from "../types";
import { getGamificationProfile } from "./gamificationService";
import {
  CertTrack,
  CERT_TRACK_CONFIG,
  AWS_SIX_PILLARS,
  CMI16Dimension,
  SharedAgentMemoryState,
  AwsPillarId,
} from "../types/workforce";

export interface DomainReadinessDetail {
  domainId: string;
  name: string;
  number: number;
  weight: number;
  score: number; // 0 - 100
  status: "critical_gap" | "developing" | "proficient" | "mastered";
  flashcardMastery: number; // 0 - 100
  quizAccuracy: number; // 0 - 100
  appliedScenariosScore: number; // 0 - 100
  knownCardsCount: number;
  totalCardsCount: number;
  correctQuizzesCount: number;
  attemptedQuizzesCount: number;
  weakestConcept?: string;
  recommendedAction: string;
}

export interface ToolCompletionItem {
  id: string;
  name: string;
  tabKey: string;
  category: "foundation" | "drill" | "arcade" | "advanced";
  iconName: string;
  progressPercent: number;
  statusLabel: string;
  completed: boolean;
  scoreBonus: number;
  description: string;
}

export interface ExamConfidenceReport {
  certTrack: CertTrack;
  readinessScore: number; // 0 - 100%
  cmi16Score: number; // 0 - 100 proprietary 16-dimension composite
  scaledScore: number; // 100 - 1000 (700 for CLF-C02, 720 for SAA-C03)
  passingThreshold: number; // 700 or 720
  passProbability: number; // 5 - 99%
  estimatedDaysToReady: number; // 0 when already safely above pass line
  confidenceTier: "elite_master" | "high_confidence_pass" | "borderline_pass" | "needs_reinforcement";
  confidenceLabel: string;
  confidenceColor: string;
  confidenceBadgeBg: string;
  confidenceDescription: string;
  domainDetails: DomainReadinessDetail[];
  dimensions16: CMI16Dimension[]; // 6 AWS Pillars + 4 Domains + 6 Exam Execution Skills
  toolsChecklist: ToolCompletionItem[];
  strongestDomain: DomainReadinessDetail | null;
  weakestDomain: DomainReadinessDetail | null;
  weakestPillar: CMI16Dimension | null;
  strongestPillar: CMI16Dimension | null;
  overallAccuracy: number;
  totalStudyMinutes: number;
  streakDays: number;
  xpTotal: number;
  candidateLevel: number;
  highPriorityRecommendations: string[];
  councilAudioBriefing: string;
}

export const DOMAIN_WEIGHTS: Record<string, number> = {
  "cloud-concepts": 0.24,
  "security-compliance": 0.30,
  "cloud-technology": 0.34,
  "billing-pricing": 0.12,
  "saa-secure": 0.30,
  "saa-resilient": 0.26,
  "saa-performant": 0.24,
  "saa-cost": 0.20,
};

export const DOMAIN_RECOMMENDATIONS: Record<string, { gap: string; action: string }> = {
  "cloud-concepts": {
    gap: "Shared Responsibility Model (OF vs IN) and all 6 AWS Well-Architected Pillars",
    action: "Review Domain 1 flashcards and complete the Operational Excellence & Sustainability drills.",
  },
  "security-compliance": {
    gap: "IAM Least Privilege, AWS WAF vs Shield, and GuardDuty vs Inspector vs Macie",
    action: "Drill the Distractor Vault security pairs and complete Guardian's Security Pillar set.",
  },
  "cloud-technology": {
    gap: "Compute options (EC2 vs Lambda vs Fargate) and Storage classes (S3 vs EBS vs EFS)",
    action: "Launch the Visual Architecture Studio and practice Multi-AZ & Serverless questions.",
  },
  "billing-pricing": {
    gap: "AWS Budgets vs Cost Explorer, Savings Plans vs Spot, and Support Plan TAM tiers",
    action: "Practice PennyWise's Cost Optimization scenarios in the AI Question Bank.",
  },
  "saa-secure": {
    gap: "VPC Gateway/Interface Endpoints, Secrets Manager rotation, KMS envelope encryption & SCPs",
    action: "Filter the AI Question Bank to SAA-C03 Security Pillar and review Guardian's handoffs.",
  },
  "saa-resilient": {
    gap: "SQS/SNS decoupling, Aurora Global Database RPO/RTO, Route 53 failover & Multi-AZ",
    action: "Drill SAA-C03 Reliability Pillar scenarios with Archie in the Question Bank.",
  },
  "saa-performant": {
    gap: "DynamoDB DAX vs ElastiCache, Global Accelerator vs CloudFront, and EFS vs FSx",
    action: "Run EcoScale's Performance Efficiency scenarios and inspect CDN topologies.",
  },
  "saa-cost": {
    gap: "S3 Intelligent-Tiering vs Glacier, Fargate Spot, Graviton migration & NAT Gateway elimination",
    action: "Drill SAA-C03 Cost Optimization & Sustainability questions with PennyWise.",
  },
};

function statusFromScore(score: number): CMI16Dimension["status"] {
  if (score >= 85) return "mastered";
  if (score >= 72) return "proficient";
  if (score >= 52) return "developing";
  return "priority_gap";
}

/**
 * Proprietary CMI-16 Readiness & Exam Passing Confidence Engine.
 * Calculates all 16 dimensions (6 AWS Well-Architected Pillars + 4 Track-Weighted Domains + 6 Exam Skills),
 * calibrated scaled score (100-1000), pass probability, and spoken council briefing.
 */
export const calculateComprehensiveReadiness = (
  flashcards: Flashcard[],
  studyHistory: Record<string, "known" | "review" | null>,
  trickQuestions: TrickQuestion[],
  quizHistory: Record<string, boolean>,
  totalStudyMinutes: number = 0,
  streak: number = 0,
  certTrack: CertTrack = "CLF-C02",
  sharedMemory?: SharedAgentMemoryState
): ExamConfidenceReport => {
  const profile = getGamificationProfile();
  const gameMetrics = profile.gameMetrics;
  const trackConfig = CERT_TRACK_CONFIG[certTrack];
  const passingThreshold = trackConfig.passingScore;

  // Retrieve stored tool activities from localStorage
  let distractorMasteredCount = 0;
  try {
    const rawVault = localStorage.getItem("aws_distractor_vault_state_v1");
    if (rawVault) {
      const parsed = JSON.parse(rawVault);
      distractorMasteredCount = Array.isArray(parsed.masteredIds) ? parsed.masteredIds.length : 0;
    }
  } catch {}

  let visualArchCount = 0;
  try {
    const rawArch = localStorage.getItem("aws_visual_arch_completed_v1");
    if (rawArch) {
      const parsed = JSON.parse(rawArch);
      visualArchCount = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {}

  let bestScenarioStreak = 0;
  try {
    const rawStreak = localStorage.getItem("aws_match_best_streak");
    if (rawStreak) bestScenarioStreak = parseInt(rawStreak, 10) || 0;
  } catch {}

  let slotHighestWin = 0;
  let slotJackpots = 0;
  try {
    slotHighestWin = parseInt(localStorage.getItem("aws_slot_highest_win") || "0", 10);
    slotJackpots = parseInt(localStorage.getItem("aws_slot_jackpots_won") || "0", 10);
  } catch {}

  // Map SAA domains to corresponding CLF domains for baseline flashcard/quiz carryover while weighting SAA events higher
  const saaDomainBridge: Record<string, { clfDomain: string; pillar: AwsPillarId }> = {
    "saa-secure": { clfDomain: "security-compliance", pillar: "security" },
    "saa-resilient": { clfDomain: "cloud-technology", pillar: "reliability" },
    "saa-performant": { clfDomain: "cloud-technology", pillar: "performance_efficiency" },
    "saa-cost": { clfDomain: "billing-pricing", pillar: "cost_optimization" },
  };

  // 1. Calculate 4 Track-Weighted Exam Domains
  const domainDetails: DomainReadinessDetail[] = trackConfig.domains.map((dom) => {
    const bridge = saaDomainBridge[dom.id];
    const sourceDomainId = bridge ? bridge.clfDomain : dom.id;

    const domCards = flashcards.filter((c) => c.domainId === sourceDomainId);
    const knownInDom = domCards.filter((c) => studyHistory[c.id] === "known").length;
    const flashcardMastery = domCards.length > 0 ? Math.round((knownInDom / domCards.length) * 100) : 0;

    const domQuizzes = trickQuestions.filter((q) => q.domainId === sourceDomainId);
    const attemptedInDom = domQuizzes.filter((q) => quizHistory[q.id] !== undefined).length;
    const correctInDom = domQuizzes.filter((q) => quizHistory[q.id] === true).length;
    const quizAccuracy = attemptedInDom > 0 ? Math.round((correctInDom / attemptedInDom) * 100) : 0;
    const quizCoverage = domQuizzes.length > 0 ? attemptedInDom / domQuizzes.length : 0;

    // Incorporate SAA-specific verified bank events from sharedMemory if on SAA-C03
    const domainEvents = (sharedMemory?.recentEvents || []).filter(
      (e) => e.domainId === dom.id && (e.outcome === "correct" || e.outcome === "incorrect")
    );
    const bankCorrect = domainEvents.filter((e) => e.outcome === "correct").length;
    const bankAccuracy = domainEvents.length > 0 ? Math.round((bankCorrect / domainEvents.length) * 100) : null;

    const domainGameStat = gameMetrics?.domainStats?.[sourceDomainId];
    let appliedScore = 65;
    if (domainGameStat && domainGameStat.total > 0) {
      appliedScore = Math.round((domainGameStat.correct / domainGameStat.total) * 100);
    }
    if (bankAccuracy !== null) {
      appliedScore = Math.round(appliedScore * 0.4 + bankAccuracy * 0.6);
    }

    const effectiveQuizFactor = quizAccuracy * 0.7 + quizCoverage * 100 * 0.3;
    const pillarBoost = bridge && sharedMemory?.pillarScores?.[bridge.pillar]
      ? sharedMemory.pillarScores[bridge.pillar].score
      : null;

    let compositeDomScore = Math.min(
      100,
      Math.round(flashcardMastery * 0.38 + effectiveQuizFactor * 0.40 + appliedScore * 0.22)
    );
    if (certTrack === "SAA-C03" && pillarBoost !== null) {
      compositeDomScore = Math.min(100, Math.round(compositeDomScore * 0.55 + pillarBoost * 0.45));
    }

    let status: DomainReadinessDetail["status"] = "critical_gap";
    if (compositeDomScore >= 85) status = "mastered";
    else if (compositeDomScore >= 72) status = "proficient";
    else if (compositeDomScore >= 48) status = "developing";

    const rec = DOMAIN_RECOMMENDATIONS[dom.id] || {
      gap: "Core AWS architecture trade-offs",
      action: "Drill verified scenarios in the AI Question Bank.",
    };

    return {
      domainId: dom.id,
      name: `${dom.name} (${Math.round(dom.weight * 100)}%)`,
      number: dom.number,
      weight: dom.weight,
      score: compositeDomScore,
      status,
      flashcardMastery,
      quizAccuracy: bankAccuracy !== null ? Math.round((quizAccuracy + bankAccuracy) / 2) : quizAccuracy,
      appliedScenariosScore: appliedScore,
      knownCardsCount: knownInDom,
      totalCardsCount: domCards.length,
      correctQuizzesCount: correctInDom + bankCorrect,
      attemptedQuizzesCount: attemptedInDom + domainEvents.length,
      weakestConcept: rec.gap,
      recommendedAction: rec.action,
    };
  });

  // 2. Build 6 AWS Well-Architected Pillar Dimensions (CMI-16 #1..#6)
  const domScoreById = new Map(domainDetails.map((d) => [d.domainId, d.score]));
  const secDomainScore = domScoreById.get(certTrack === "SAA-C03" ? "saa-secure" : "security-compliance") ?? 50;
  const techDomainScore = domScoreById.get(certTrack === "SAA-C03" ? "saa-resilient" : "cloud-technology") ?? 50;
  const costDomainScore = domScoreById.get(certTrack === "SAA-C03" ? "saa-cost" : "billing-pricing") ?? 50;
  const conceptDomainScore = domScoreById.get(certTrack === "SAA-C03" ? "saa-performant" : "cloud-concepts") ?? 50;

  const pillarBaselineMap: Record<AwsPillarId, number> = {
    operational_excellence: Math.round(conceptDomainScore * 0.5 + techDomainScore * 0.3 + Math.min(20, visualArchCount * 7)),
    security: Math.round(secDomainScore * 0.75 + Math.min(25, distractorMasteredCount * 2.5)),
    reliability: Math.round(techDomainScore * 0.7 + Math.min(30, visualArchCount * 10)),
    performance_efficiency: Math.round(techDomainScore * 0.65 + conceptDomainScore * 0.25 + Math.min(10, bestScenarioStreak)),
    cost_optimization: Math.round(costDomainScore * 0.8 + Math.min(20, (profile.swarmBounties?.filter((b) => b.isCompleted).length || 0) * 5)),
    sustainability: Math.round(conceptDomainScore * 0.5 + costDomainScore * 0.35 + Math.min(15, totalStudyMinutes / 10)),
  };

  const pillarDimensions: CMI16Dimension[] = AWS_SIX_PILLARS.map((pillar, idx) => {
    const memStat = sharedMemory?.pillarScores?.[pillar.id];
    const base = pillarBaselineMap[pillar.id];
    const blended = memStat
      ? memStat.attempts > 0
        ? Math.min(100, Math.round(memStat.score * 0.65 + base * 0.35))
        : Math.min(100, Math.round(memStat.score * 0.4 + base * 0.6))
      : Math.min(100, Math.max(25, base));

    return {
      id: pillar.id,
      index: idx + 1,
      group: "pillar",
      name: pillar.name,
      shortName: pillar.shortName,
      score: blended,
      target: certTrack === "SAA-C03" ? 78 : 75,
      status: statusFromScore(blended),
      leadAgent: pillar.leadAgent,
      insight: pillar.summary,
      recommendedTab: "question-bank",
    };
  });

  // 3. Build 4 Domain Dimensions (CMI-16 #7..#10)
  const domainDimensions: CMI16Dimension[] = domainDetails.map((d, idx) => ({
    id: `dim-dom-${d.domainId}`,
    index: 7 + idx,
    group: "domain",
    name: d.name,
    shortName: `Domain ${d.number}`,
    score: d.score,
    target: certTrack === "SAA-C03" ? 76 : 74,
    status: statusFromScore(d.score),
    leadAgent: d.domainId.includes("sec") ? "guardian" : d.domainId.includes("cost") || d.domainId.includes("billing") ? "pennywise" : "archie",
    insight: d.recommendedAction,
    recommendedTab: certTrack === "SAA-C03" ? "question-bank" : "flashcards",
  }));

  // 4. Build 6 Proprietary Exam Execution & Cognitive Skills (CMI-16 #11..#16)
  const totalCards = flashcards.length || 1;
  const knownCards = Object.values(studyHistory).filter((v) => v === "known").length;
  const flashcardRetention = Math.min(100, Math.round((knownCards / totalCards) * 100));

  const distractorImmunity = Math.min(100, Math.round((distractorMasteredCount / 14) * 70 + (gameMetrics?.overallAccuracy || 65) * 0.3));
  const avgReactionMs = sharedMemory?.avgReactionMs || 7400;
  const decisionVelocity = Math.min(100, Math.max(35, Math.round(100 - Math.max(0, (avgReactionMs - 4500) / 220))));
  const archSynthesis = Math.min(100, Math.round(visualArchCount * 22 + bestScenarioStreak * 4 + 28));
  const finOpsPrecision = Math.min(100, Math.round((pillarDimensions.find((p) => p.id === "cost_optimization")?.score || 55) * 0.8 + Math.min(20, (streak || 1) * 3)));
  const audioSocraticReasoning = Math.min(
    100,
    Math.round(
      32 +
        Math.min(35, (sharedMemory?.totalAudioLessonsCompleted || 0) * 8) +
        Math.min(33, (profile.totalCheckpointsAnswered || 0) * 6)
    )
  );

  const skillDimensions: CMI16Dimension[] = [
    {
      id: "skill-distractor-immunity",
      index: 11,
      group: "skill",
      name: "Distractor Trap Immunity",
      shortName: "Trap Immunity",
      score: distractorImmunity,
      target: 78,
      status: statusFromScore(distractorImmunity),
      leadAgent: "trapmaster",
      insight: "Ability to distinguish look-alike AWS services (WAF vs Shield, SQS vs SNS, DAX vs ElastiCache).",
      recommendedTab: "vault",
    },
    {
      id: "skill-decision-velocity",
      index: 12,
      group: "skill",
      name: "Decision Velocity & Exam Pacing",
      shortName: "Exam Pacing",
      score: decisionVelocity,
      target: 75,
      status: statusFromScore(decisionVelocity),
      leadAgent: "opspulse",
      insight: `Average scenario decision pace: ${(avgReactionMs / 1000).toFixed(1)}s. Target under 8s on rapid drills.`,
      recommendedTab: "lightning-rush",
    },
    {
      id: "skill-arch-synthesis",
      index: 13,
      group: "skill",
      name: "Architecture Trade-Off Synthesis",
      shortName: "Arch Synthesis",
      score: archSynthesis,
      target: 75,
      status: statusFromScore(archSynthesis),
      leadAgent: "archie",
      insight: "Combining Multi-AZ, VPC endpoints, and serverless triggers cleanly under constraints.",
      recommendedTab: "visual-architecture",
    },
    {
      id: "skill-finops-precision",
      index: 14,
      group: "skill",
      name: "Pricing & FinOps Precision",
      shortName: "FinOps",
      score: finOpsPrecision,
      target: 75,
      status: statusFromScore(finOpsPrecision),
      leadAgent: "pennywise",
      insight: "Selecting optimal purchasing models (Savings Plans, Spot, S3 Intelligent-Tiering) without over-provisioning.",
      recommendedTab: "question-bank",
    },
    {
      id: "skill-active-recall",
      index: 15,
      group: "skill",
      name: "Active Recall Retention",
      shortName: "Recall",
      score: flashcardRetention,
      target: 80,
      status: statusFromScore(flashcardRetention),
      leadAgent: "professor",
      insight: `${knownCards}/${totalCards} core flashcards locked into durable spaced-repetition memory.`,
      recommendedTab: "flashcards",
    },
    {
      id: "skill-socratic-audio",
      index: 16,
      group: "skill",
      name: "Socratic & Audio Reasoning",
      shortName: "Audio/Socratic",
      score: audioSocraticReasoning,
      target: 72,
      status: statusFromScore(audioSocraticReasoning),
      leadAgent: "professor",
      insight: "Reinforcing conceptual intuition via Professor Cloud checkpoints and Gemini 3.8 audio briefings.",
      recommendedTab: "professor",
    },
  ];

  const dimensions16: CMI16Dimension[] = [...pillarDimensions, ...domainDimensions, ...skillDimensions];

  // 5. Weighted Composite & CMI-16 Proprietary Score
  let weightedDomainSum = 0;
  domainDetails.forEach((d) => {
    weightedDomainSum += d.score * d.weight;
  });

  const avgPillarScore = pillarDimensions.reduce((s, d) => s + d.score, 0) / pillarDimensions.length;
  const avgSkillScore = skillDimensions.reduce((s, d) => s + d.score, 0) / skillDimensions.length;

  const completedBountiesCount = profile.swarmBounties?.filter((b) => b.isCompleted).length || 0;
  const blitzHighScore = gameMetrics?.allTimeHighScore || 0;
  const overallGameAccuracy = gameMetrics?.overallAccuracy || 75;

  let toolBonus = 0;
  if (completedBountiesCount >= 3) toolBonus += 2;
  if (distractorMasteredCount >= 6) toolBonus += 2;
  if (bestScenarioStreak >= 5) toolBonus += 2;
  if (visualArchCount >= 2) toolBonus += 2;
  if (blitzHighScore >= 1500) toolBonus += 1;
  if (slotJackpots >= 1 || slotHighestWin >= 2000) toolBonus += 1;

  // Proprietary CMI-16 Index: 45% Official Weighted Domains + 30% 6 AWS Pillars + 25% 6 Exam Skills
  const cmi16Score = Math.min(
    100,
    Math.max(0, Math.round(weightedDomainSum * 0.45 + avgPillarScore * 0.30 + avgSkillScore * 0.25 + toolBonus * 0.5))
  );

  const readinessScore = Math.min(100, Math.max(0, Math.round(weightedDomainSum * 0.6 + cmi16Score * 0.4 + toolBonus * 0.5)));

  // Scaled Score (100 - 1000)
  const scaledScore = Math.min(1000, Math.max(100, Math.round(100 + (readinessScore / 100) * 900)));

  // Calibrated sigmoid pass probability around official track passing threshold (700 CLF / 720 SAA)
  const deltaFromPass = scaledScore - passingThreshold;
  const rawProb = 1 / (1 + Math.exp(-deltaFromPass / 58));
  const passProbability = Math.min(99, Math.max(5, Math.round(rawProb * 100)));

  // Estimated days to safe buffer (+50 pts above threshold)
  const targetSafeScaled = passingThreshold + 55;
  const pointsRemaining = Math.max(0, targetSafeScaled - scaledScore);
  const dailyPacePts = Math.max(12, Math.min(35, Math.round(14 + Math.min(15, streak * 2))));
  const estimatedDaysToReady = pointsRemaining === 0 ? 0 : Math.ceil(pointsRemaining / dailyPacePts);

  let confidenceTier: ExamConfidenceReport["confidenceTier"] = "needs_reinforcement";
  let confidenceLabel = "Gap Closing Needed";
  let confidenceColor = "text-rose-500";
  let confidenceBadgeBg = "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50";
  let confidenceDescription = `Projected ${scaledScore}/1000 sits below the official ${passingThreshold} ${certTrack} passing mark. Focus on your weakest Well-Architected Pillar and verified question sets.`;

  if (scaledScore >= passingThreshold + 160 && cmi16Score >= 84) {
    confidenceTier = "elite_master";
    confidenceLabel = "Elite Pass Ready";
    confidenceColor = "text-emerald-600 dark:text-emerald-400";
    confidenceBadgeBg = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50";
    confidenceDescription = `You clear the ${certTrack} ${passingThreshold}-point benchmark across all 16 CMI dimensions with a strong safety margin.`;
  } else if (scaledScore >= passingThreshold + 50 && cmi16Score >= 72) {
    confidenceTier = "high_confidence_pass";
    confidenceLabel = "High Pass Confidence";
    confidenceColor = "text-emerald-600 dark:text-emerald-400";
    confidenceBadgeBg = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50";
    confidenceDescription = `Strong ${passProbability}% pass projection for ${certTrack}. Keep reinforcing your lowest Pillar to lock in exam-day precision.`;
  } else if (scaledScore >= passingThreshold - 15 && cmi16Score >= 62) {
    confidenceTier = "borderline_pass";
    confidenceLabel = "Near Pass Threshold";
    confidenceColor = "text-amber-600 dark:text-amber-400";
    confidenceBadgeBg = "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50";
    confidenceDescription = `Hovering near the ${passingThreshold} pass line. Closing your top 2 CMI-16 gaps will add a reliable +60 point safety cushion.`;
  }

  // Multi-Tool Progress Checklist
  const flashcardProgress = Math.round((knownCards / totalCards) * 100);
  const totalQuizzes = trickQuestions.length || 1;
  const attemptedQuizzes = Object.keys(quizHistory).length;
  const quizProgress = Math.round((attemptedQuizzes / totalQuizzes) * 100);

  const toolsChecklist: ToolCompletionItem[] = [
    {
      id: "tool-question-bank",
      name: `${certTrack} AI-Reviewed Question Bank`,
      tabKey: "question-bank",
      category: "foundation",
      iconName: "ShieldAlert",
      progressPercent: Math.min(100, Math.round(((sharedMemory?.recentEvents.filter((e) => e.sourceTab === "question-bank").length || 0) / 10) * 100)),
      statusLabel: `${sharedMemory?.recentEvents.filter((e) => e.sourceTab === "question-bank").length || 0}/10 Verified Drills`,
      completed: (sharedMemory?.recentEvents.filter((e) => e.sourceTab === "question-bank").length || 0) >= 8,
      scoreBonus: 25,
      description: `PostgreSQL-backed ${certTrack} scenario questions audited across all 6 AWS Well-Architected Pillars.`,
    },
    {
      id: "tool-flashcards",
      name: "Flashcard Active Recall Deck",
      tabKey: "flashcards",
      category: "foundation",
      iconName: "CreditCard",
      progressPercent: flashcardProgress,
      statusLabel: `${knownCards}/${totalCards} Mastered (${flashcardProgress}%)`,
      completed: flashcardProgress >= 80,
      scoreBonus: 20,
      description: "Spaced-repetition active recall across core AWS service definitions.",
    },
    {
      id: "tool-quizzes",
      name: "Exam Trap Simulator",
      tabKey: "simulator",
      category: "drill",
      iconName: "ShieldAlert",
      progressPercent: quizProgress,
      statusLabel: `${attemptedQuizzes}/${totalQuizzes} Attempted (${quizProgress}%)`,
      completed: quizProgress >= 75,
      scoreBonus: 20,
      description: "Realistic scenario-based trick questions with distractor analysis.",
    },
    {
      id: "tool-distractor",
      name: "The Distractor Vault",
      tabKey: "vault",
      category: "drill",
      iconName: "Vault",
      progressPercent: Math.min(100, Math.round((distractorMasteredCount / 12) * 100)),
      statusLabel: `${distractorMasteredCount}/12 Confusions Mastered`,
      completed: distractorMasteredCount >= 8,
      scoreBonus: 10,
      description: "Side-by-side AWS service disambiguation (WAF vs Shield, DAX vs ElastiCache).",
    },
    {
      id: "tool-visual-arch",
      name: "Visual Architecture Studio",
      tabKey: "visual-architecture",
      category: "advanced",
      iconName: "Layers",
      progressPercent: Math.min(100, visualArchCount * 34),
      statusLabel: `${visualArchCount}/3 Blueprints Mastered`,
      completed: visualArchCount >= 2,
      scoreBonus: 10,
      description: "Click-to-inspect 3-Tier VPC, Serverless Event-Driven, and CloudFront CDN topologies.",
    },
    {
      id: "tool-agent-swarm",
      name: "Cross-Aware AI Agent Workforce",
      tabKey: "agents",
      category: "advanced",
      iconName: "Bot",
      progressPercent: Math.round((completedBountiesCount / 5) * 100),
      statusLabel: `${completedBountiesCount}/5 Council Bounties`,
      completed: completedBountiesCount >= 3,
      scoreBonus: 10,
      description: "Coordinated 7-agent AWS Well-Architected specialist council with shared learner memory.",
    },
    {
      id: "tool-lightning-rush",
      name: "Lightning Blitz Speed Sprint",
      tabKey: "lightning-rush",
      category: "arcade",
      iconName: "Zap",
      progressPercent: Math.min(100, Math.round((blitzHighScore / 2500) * 100)),
      statusLabel: `High Score: ${blitzHighScore} Pts`,
      completed: blitzHighScore >= 1200,
      scoreBonus: 5,
      description: "60-second timed exam pacing drill to raise Decision Velocity.",
    },
  ];

  const sortedDomains = [...domainDetails].sort((a, b) => b.score - a.score);
  const strongestDomain = sortedDomains[0]?.score > 0 ? sortedDomains[0] : null;
  const weakestDomain = sortedDomains[sortedDomains.length - 1] || null;

  const sortedPillars = [...pillarDimensions].sort((a, b) => b.score - a.score);
  const strongestPillar = sortedPillars[0] || null;
  const weakestPillar = sortedPillars[sortedPillars.length - 1] || null;

  const highPriorityRecommendations: string[] = [];
  if (weakestPillar && weakestPillar.score < weakestPillar.target) {
    highPriorityRecommendations.push(
      `Strengthen the ${weakestPillar.name} Pillar (${weakestPillar.score}% → ${weakestPillar.target}% target) inside the ${certTrack} AI Question Bank.`
    );
  }
  if (weakestDomain && weakestDomain.score < 75) {
    highPriorityRecommendations.push(
      `Lift ${weakestDomain.name} from ${weakestDomain.score}% to 78%+: ${weakestDomain.recommendedAction}`
    );
  }
  const weakestSkill = [...skillDimensions].sort((a, b) => a.score - b.score)[0];
  if (weakestSkill && weakestSkill.score < weakestSkill.target) {
    highPriorityRecommendations.push(
      `Boost ${weakestSkill.name} (${weakestSkill.score}%): ${weakestSkill.insight}`
    );
  }

  const councilAudioBriefing = `CloudMaster CMI-16 Council Briefing for ${trackConfig.name}. Your proprietary 16-area index is ${cmi16Score} percent, projecting a scaled score of ${scaledScore} out of one thousand against the official ${passingThreshold} passing mark—giving you a ${passProbability} percent pass probability. Your strongest Well-Architected Pillar is ${strongestPillar?.name || "Security"} at ${strongestPillar?.score || 60} percent, while your highest-leverage growth opportunity is ${weakestPillar?.name || "Sustainability"} at ${weakestPillar?.score || 52} percent. ${estimatedDaysToReady === 0 ? "You are in peak exam-ready shape." : `At your current pace, you are about ${estimatedDaysToReady} days from a comfortable pass cushion.`}`;

  return {
    certTrack,
    readinessScore,
    cmi16Score,
    scaledScore,
    passingThreshold,
    passProbability,
    estimatedDaysToReady,
    confidenceTier,
    confidenceLabel,
    confidenceColor,
    confidenceBadgeBg,
    confidenceDescription,
    domainDetails,
    dimensions16,
    toolsChecklist,
    strongestDomain,
    weakestDomain,
    weakestPillar,
    strongestPillar,
    overallAccuracy: overallGameAccuracy,
    totalStudyMinutes,
    streakDays: streak || profile.streakDays || 1,
    xpTotal: profile.xp,
    candidateLevel: profile.level,
    highPriorityRecommendations,
    councilAudioBriefing,
  };
};
