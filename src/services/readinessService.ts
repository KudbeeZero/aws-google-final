import { Flashcard, TrickQuestion, DomainData, DistractorItem } from "../types";
import { getGamificationProfile, GamificationProfile } from "./gamificationService";

export interface DomainReadinessDetail {
  domainId: string;
  name: string;
  number: number;
  weight: number; // 0.24, 0.30, 0.34, 0.12
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
  readinessScore: number; // 0 - 100%
  scaledScore: number; // 100 - 1000 (Pass threshold is 700)
  passingThreshold: number; // 700
  confidenceTier: "elite_master" | "high_confidence_pass" | "borderline_pass" | "needs_reinforcement";
  confidenceLabel: string;
  confidenceColor: string;
  confidenceBadgeBg: string;
  confidenceDescription: string;
  domainDetails: DomainReadinessDetail[];
  toolsChecklist: ToolCompletionItem[];
  strongestDomain: DomainReadinessDetail | null;
  weakestDomain: DomainReadinessDetail | null;
  overallAccuracy: number;
  totalStudyMinutes: number;
  streakDays: number;
  xpTotal: number;
  candidateLevel: number;
  highPriorityRecommendations: string[];
}

// Official AWS CLF-C02 Domain Weights
export const DOMAIN_WEIGHTS: Record<string, number> = {
  "cloud-concepts": 0.24,
  "security-compliance": 0.30,
  "cloud-technology": 0.34,
  "billing-pricing": 0.12
};

export const DOMAIN_RECOMMENDATIONS: Record<string, { gap: string; action: string }> = {
  "cloud-concepts": {
    gap: "Shared Responsibility Model (OF vs IN) and Elasticity vs Scalability",
    action: "Review Domain 1 flashcards and study the 6 Pillars of Well-Architected Framework."
  },
  "security-compliance": {
    gap: "IAM Role Best Practices, AWS WAF vs Shield, and GuardDuty vs Inspector vs Macie",
    action: "Drill the Distractor Vault trap cards on Security Services and complete Guardian's bounty."
  },
  "cloud-technology": {
    gap: "Compute options (EC2 vs Lambda vs Fargate) and Storage classes (S3 vs EBS vs EFS)",
    action: "Launch the Visual Architecture Learning Studio and test VPC & Serverless blueprints."
  },
  "billing-pricing": {
    gap: "AWS Budgets vs Cost Explorer, Savings Plans vs Spot Instances, and Support Plan TAM tiers",
    action: "Practice Cost Explorer forecasting and complete PennyWise's Compute FinOps bounty."
  }
};

/**
 * Calculates comprehensive exam readiness, domain breakdowns, scaled projected score,
 * and passing confidence status incorporating all study tools, arcade systems, and bounties.
 */
export const calculateComprehensiveReadiness = (
  flashcards: Flashcard[],
  studyHistory: Record<string, "known" | "review" | null>,
  trickQuestions: TrickQuestion[],
  quizHistory: Record<string, boolean>,
  totalStudyMinutes: number = 0,
  streak: number = 0
): ExamConfidenceReport => {
  const profile = getGamificationProfile();
  const gameMetrics = profile.gameMetrics;

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

  // 1. Calculate Domain-by-Domain Metrics
  const domainIds = ["cloud-concepts", "security-compliance", "cloud-technology", "billing-pricing"];
  const domainNames: Record<string, { name: string; number: number }> = {
    "cloud-concepts": { name: "Cloud Concepts (24%)", number: 1 },
    "security-compliance": { name: "Security & Compliance (30%)", number: 2 },
    "cloud-technology": { name: "Technology & Services (34%)", number: 3 },
    "billing-pricing": { name: "Billing & Pricing (12%)", number: 4 }
  };

  const domainDetails: DomainReadinessDetail[] = domainIds.map((domainId) => {
    const domInfo = domainNames[domainId];
    const weight = DOMAIN_WEIGHTS[domainId] || 0.25;

    // Flashcards in this domain
    const domCards = flashcards.filter((c) => c.domainId === domainId);
    const knownInDom = domCards.filter((c) => studyHistory[c.id] === "known").length;
    const flashcardMastery = domCards.length > 0 ? Math.round((knownInDom / domCards.length) * 100) : 0;

    // Quizzes in this domain
    const domQuizzes = trickQuestions.filter((q) => q.domainId === domainId);
    const attemptedInDom = domQuizzes.filter((q) => quizHistory[q.id] !== undefined).length;
    const correctInDom = domQuizzes.filter((q) => quizHistory[q.id] === true).length;
    const quizAccuracy = attemptedInDom > 0 ? Math.round((correctInDom / attemptedInDom) * 100) : 0;
    const quizCoverage = domQuizzes.length > 0 ? (attemptedInDom / domQuizzes.length) : 0;

    // Arcade & Applied Scenarios in this domain
    const domainGameStat = gameMetrics?.domainStats?.[domainId];
    let appliedScore = 70; // baseline foundational
    if (domainGameStat && domainGameStat.total > 0) {
      appliedScore = Math.round((domainGameStat.correct / domainGameStat.total) * 100);
    }

    // Composite Domain Score (40% flashcards, 40% quiz accuracy & coverage, 20% applied scenarios)
    const effectiveQuizFactor = (quizAccuracy * 0.7 + (quizCoverage * 100) * 0.3);
    const compositeDomScore = Math.min(
      100,
      Math.round(flashcardMastery * 0.40 + effectiveQuizFactor * 0.40 + appliedScore * 0.20)
    );

    let status: DomainReadinessDetail["status"] = "critical_gap";
    if (compositeDomScore >= 85) status = "mastered";
    else if (compositeDomScore >= 70) status = "proficient";
    else if (compositeDomScore >= 45) status = "developing";

    const rec = DOMAIN_RECOMMENDATIONS[domainId] || {
      gap: "Fundamental concepts and service pairs",
      action: "Practice high-yield questions."
    };

    return {
      domainId,
      name: domInfo.name,
      number: domInfo.number,
      weight,
      score: compositeDomScore,
      status,
      flashcardMastery,
      quizAccuracy,
      appliedScenariosScore: appliedScore,
      knownCardsCount: knownInDom,
      totalCardsCount: domCards.length,
      correctQuizzesCount: correctInDom,
      attemptedQuizzesCount: attemptedInDom,
      weakestConcept: rec.gap,
      recommendedAction: rec.action
    };
  });

  // 2. Calculate Global Weighted Score from Official Domain Percentages
  let weightedDomainSum = 0;
  domainDetails.forEach((d) => {
    weightedDomainSum += d.score * d.weight;
  });

  // 3. Arcade, Swarm & Tool Performance Modifiers
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

  // Final Composite Readiness Score (0-100)
  const readinessScore = Math.min(100, Math.max(0, Math.round(weightedDomainSum + toolBonus)));

  // Scaled Score (AWS Exam Score is 100 - 1000, Passing is 700)
  const scaledScore = Math.min(1000, Math.max(100, Math.round(100 + (readinessScore / 100) * 900)));

  // 4. Determine Confidence Passing Tier
  let confidenceTier: ExamConfidenceReport["confidenceTier"] = "needs_reinforcement";
  let confidenceLabel = "Foundational / Gap Closing Needed";
  let confidenceColor = "text-rose-500";
  let confidenceBadgeBg = "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50";
  let confidenceDescription = "Your readiness is currently below the 700 passing benchmark. Focus on completing flashcards, distractor traps, and practice quizzes to build solid domain foundations.";

  if (scaledScore >= 880 && readinessScore >= 85) {
    confidenceTier = "elite_master";
    confidenceLabel = "🌟 Elite Master Passing State";
    confidenceColor = "text-pink-500";
    confidenceBadgeBg = "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900/50";
    confidenceDescription = "Superb! You exceed the AWS CLF-C02 passing mark by a wide margin across all 4 domains. You are in peak condition to pass with distinction.";
  } else if (scaledScore >= 760 && readinessScore >= 74) {
    confidenceTier = "high_confidence_pass";
    confidenceLabel = "🟢 High Confidence Passing State";
    confidenceColor = "text-emerald-600 dark:text-emerald-400";
    confidenceBadgeBg = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50";
    confidenceDescription = "High Passing Probability! You have achieved solid proficiency across key domains and surpassed the 700-point AWS threshold with healthy buffer room.";
  } else if (scaledScore >= 700 && readinessScore >= 65) {
    confidenceTier = "borderline_pass";
    confidenceLabel = "🟡 Near Passing Threshold";
    confidenceColor = "text-amber-600 dark:text-amber-400";
    confidenceBadgeBg = "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50";
    confidenceDescription = "Borderline Passing. You are hovering around the 700 mark. Reinforce your lowest-scoring domain to guarantee a comfortable safety cushion.";
  }

  // 5. Multi-Tool Progress Checklist
  const totalCards = flashcards.length || 1;
  const knownCards = Object.values(studyHistory).filter((v) => v === "known").length;
  const flashcardProgress = Math.round((knownCards / totalCards) * 100);

  const totalQuizzes = trickQuestions.length || 1;
  const attemptedQuizzes = Object.keys(quizHistory).length;
  const quizProgress = Math.round((attemptedQuizzes / totalQuizzes) * 100);

  const toolsChecklist: ToolCompletionItem[] = [
    {
      id: "tool-flashcards",
      name: "Flashcard Active Recall Deck",
      tabKey: "flashcards",
      category: "foundation",
      iconName: "CreditCard",
      progressPercent: flashcardProgress,
      statusLabel: `${knownCards}/${totalCards} Mastered (${flashcardProgress}%)`,
      completed: flashcardProgress >= 80,
      scoreBonus: 25,
      description: "Spaced-repetition active recall across all 4 official CLF-C02 domains."
    },
    {
      id: "tool-quizzes",
      name: "Practice Exam & Trick Simulator",
      tabKey: "simulator",
      category: "drill",
      iconName: "ShieldAlert",
      progressPercent: quizProgress,
      statusLabel: `${attemptedQuizzes}/${totalQuizzes} Attempted (${quizProgress}%)`,
      completed: quizProgress >= 75,
      scoreBonus: 25,
      description: "Realistic scenario-based trick questions with distractor analysis."
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
      description: "High-yield service confusion pairs (SQS vs SNS, WAF vs Shield, Inspector vs GuardDuty)."
    },
    {
      id: "tool-scenario-match",
      name: "Architectural Scenario Matcher",
      tabKey: "matching",
      category: "drill",
      iconName: "Puzzle",
      progressPercent: Math.min(100, bestScenarioStreak * 15),
      statusLabel: `Best Streak: ${bestScenarioStreak} Matches`,
      completed: bestScenarioStreak >= 6,
      scoreBonus: 10,
      description: "Speed matching real AWS business requirements to target services."
    },
    {
      id: "tool-visual-arch",
      name: "Visual Architecture Studio",
      tabKey: "visual-architecture",
      category: "advanced",
      iconName: "Layers",
      progressPercent: Math.min(100, visualArchCount * 34),
      statusLabel: `${visualArchCount}/3 Interactive Blueprints Mastered`,
      completed: visualArchCount >= 2,
      scoreBonus: 10,
      description: "Click-to-inspect reference topologies (3-Tier VPC, Serverless, CloudFront CDN)."
    },
    {
      id: "tool-agent-swarm",
      name: "Agent Swarm Autonomous Bounties",
      tabKey: "agent-swarm",
      category: "advanced",
      iconName: "Bot",
      progressPercent: Math.round((completedBountiesCount / 5) * 100),
      statusLabel: `${completedBountiesCount}/5 Swarm Bounties Completed`,
      completed: completedBountiesCount >= 3,
      scoreBonus: 10,
      description: "Autonomous agent challenges evaluated by Gemini AI across 5 specialized domains."
    },
    {
      id: "tool-lightning-rush",
      name: "Arcade: Lightning Blitz Sprint",
      tabKey: "arcade",
      category: "arcade",
      iconName: "Zap",
      progressPercent: Math.min(100, Math.round((blitzHighScore / 2500) * 100)),
      statusLabel: `High Score: ${blitzHighScore} Pts`,
      completed: blitzHighScore >= 1200,
      scoreBonus: 5,
      description: "60-second high-energy trivia sprints with streak multipliers and tactical lifelines."
    },
    {
      id: "tool-slot-machine",
      name: "Arcade: New Age Slot Machine",
      tabKey: "arcade-slots",
      category: "arcade",
      iconName: "Gamepad2",
      progressPercent: Math.min(100, slotJackpots > 0 ? 100 : Math.round((slotHighestWin / 3000) * 100)),
      statusLabel: slotJackpots > 0 ? `${slotJackpots} Jackpots Won` : `Best Win: ${slotHighestWin} Coins`,
      completed: slotHighestWin >= 1000 || slotJackpots >= 1,
      scoreBonus: 5,
      description: "Architecture synergy reel spins, Boss Raids, and Quick-Fire bonus rounds."
    }
  ];

  // Strongest and weakest domains
  const sortedDomains = [...domainDetails].sort((a, b) => b.score - a.score);
  const strongestDomain = sortedDomains[0]?.score > 0 ? sortedDomains[0] : null;
  const weakestDomain = sortedDomains[sortedDomains.length - 1];

  // High priority actionable recommendations
  const highPriorityRecommendations: string[] = [];
  if (weakestDomain && weakestDomain.score < 75) {
    highPriorityRecommendations.push(
      `Boost Domain ${weakestDomain.number} (${weakestDomain.name}) from ${weakestDomain.score}% to 80%+: ${weakestDomain.recommendedAction}`
    );
  }

  const incompleteTools = toolsChecklist.filter((t) => !t.completed);
  if (incompleteTools.length > 0) {
    highPriorityRecommendations.push(
      `Complete ${incompleteTools[0].name} to gain +${incompleteTools[0].scoreBonus}% readiness boost.`
    );
  }

  if (profile.totalCheckpointsAnswered < 5) {
    highPriorityRecommendations.push(
      "Engage with Interactive Professor Socratic checkpoints to earn mystery loot crates and XP."
    );
  }

  return {
    readinessScore,
    scaledScore,
    passingThreshold: 700,
    confidenceTier,
    confidenceLabel,
    confidenceColor,
    confidenceBadgeBg,
    confidenceDescription,
    domainDetails,
    toolsChecklist,
    strongestDomain,
    weakestDomain,
    overallAccuracy: overallGameAccuracy,
    totalStudyMinutes,
    streakDays: streak || profile.streakDays || 1,
    xpTotal: profile.xp,
    candidateLevel: profile.level,
    highPriorityRecommendations
  };
};
