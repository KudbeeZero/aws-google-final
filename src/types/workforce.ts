export type CertTrack = "CLF-C02" | "SAA-C03";

export type AwsPillarId =
  | "operational_excellence"
  | "security"
  | "reliability"
  | "performance_efficiency"
  | "cost_optimization"
  | "sustainability";

export type WorkforceAgentId =
  | "archie"
  | "guardian"
  | "pennywise"
  | "opspulse"
  | "ecoscale"
  | "trapmaster"
  | "professor";

export interface AwsPillarDefinition {
  id: AwsPillarId;
  name: string;
  shortName: string;
  leadAgent: WorkforceAgentId;
  summary: string;
  designPrinciples: string[];
  keyServices: string[];
  accentText: string;
  accentBg: string;
}

export interface WorkforceAgentProfile {
  id: WorkforceAgentId;
  name: string;
  role: string;
  pillarId: AwsPillarId | "all";
  voicePersona: "Adam" | "Antoni" | "Arnold" | "Rachel" | "Domi";
  initials: string;
  accentColor: string;
  specialty: string;
}

export interface VerifiedQuestion {
  id: string | number;
  externalKey: string;
  certTrack: CertTrack;
  domainId: string;
  pillar: AwsPillarId;
  difficulty: "foundation" | "associate" | "challenge";
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapNote: string;
  audioScript: string;
  aiReviewScore: number;
  aiReviewNotes: string;
  reviewedByModel: string;
  attemptCount: number;
  correctCount: number;
  createdAt?: string;
}

export interface StudyMemoryEvent {
  id: string;
  timestamp: string;
  sourceTab: string;
  certTrack: CertTrack;
  pillar: AwsPillarId;
  domainId?: string;
  topic: string;
  outcome: "correct" | "incorrect" | "mastered" | "review" | "explored" | "audio";
  reactionMs?: number;
}

export interface AgentHandoff {
  id: string;
  fromAgent: WorkforceAgentId;
  toAgent: WorkforceAgentId;
  pillar: AwsPillarId;
  certTrack: CertTrack;
  summary: string;
  recommendedTab: string;
  resolved: boolean;
  createdAt: string;
}

export interface BubblePreferences {
  muted: boolean;
  snoozeUntil: number | null;
  autoNarrate: boolean;
}

export interface SharedAgentMemoryState {
  activeCertTrack: CertTrack;
  pillarScores: Record<AwsPillarId, { attempts: number; correct: number; score: number }>;
  weakConcepts: string[];
  recentEvents: StudyMemoryEvent[];
  handoffs: AgentHandoff[];
  bubblePreferences: BubblePreferences;
  totalAudioLessonsCompleted: number;
  avgReactionMs: number;
  lastSyncedAt: string | null;
}

export interface SmartBubbleNotification {
  id: string;
  agentId: WorkforceAgentId;
  handoffFromAgent?: WorkforceAgentId;
  pillar: AwsPillarId;
  certTrack: CertTrack;
  headline: string;
  message: string;
  audioScript: string;
  actionLabel: string;
  actionTab: string;
  createdAt: number;
}

export interface CMI16Dimension {
  id: string;
  index: number; // 1..16
  group: "pillar" | "domain" | "skill";
  name: string;
  shortName: string;
  score: number; // 0 - 100
  target: number; // e.g. 75 or 78
  status: "mastered" | "proficient" | "developing" | "priority_gap";
  leadAgent: WorkforceAgentId;
  insight: string;
  recommendedTab: string;
}

export interface GlobalBenchmarkSnapshot {
  certTrack: CertTrack;
  sampleSize: number;
  avgScaledScore: number;
  topQuartileScaledScore: number;
  userPercentile: number;
  pillarAverages: Record<AwsPillarId, number>;
  source: "cloudsql" | "baseline";
}

export const AWS_SIX_PILLARS: AwsPillarDefinition[] = [
  {
    id: "operational_excellence",
    name: "Operational Excellence",
    shortName: "Ops Excellence",
    leadAgent: "opspulse",
    summary: "Run and monitor systems cleanly, automate operations as code, and continuously improve through blameless postmortems.",
    designPrinciples: ["Operations as Code", "Frequent Reversible Changes", "Anticipate Failure"],
    keyServices: ["CloudFormation", "Systems Manager", "CloudWatch", "Config", "X-Ray"],
    accentText: "text-sky-600 dark:text-sky-400",
    accentBg: "bg-sky-500/10 border-sky-500/25",
  },
  {
    id: "security",
    name: "Security",
    shortName: "Security",
    leadAgent: "guardian",
    summary: "Protect identities, data in transit and at rest, and infrastructure layers using least privilege and automated detection.",
    designPrinciples: ["Strong Identity Foundation", "Defense in Depth", "Encrypt Everywhere"],
    keyServices: ["IAM", "KMS", "WAF", "Shield", "GuardDuty", "CloudTrail", "Secrets Manager"],
    accentText: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-500/10 border-rose-500/25",
  },
  {
    id: "reliability",
    name: "Reliability",
    shortName: "Reliability",
    leadAgent: "archie",
    summary: "Recover automatically from infrastructure or service disruptions and dynamically acquire compute resources across Multi-AZ.",
    designPrinciples: ["Auto-Recovery", "Scale Horizontally", "Test Recovery Procedures"],
    keyServices: ["Multi-AZ RDS", "Auto Scaling", "Route 53", "ELB", "AWS Backup", "SQS"],
    accentText: "text-indigo-600 dark:text-indigo-400",
    accentBg: "bg-indigo-500/10 border-indigo-500/25",
  },
  {
    id: "performance_efficiency",
    name: "Performance Efficiency",
    shortName: "Performance",
    leadAgent: "ecoscale",
    summary: "Select right-sized compute, serverless, caching, and global edge services to keep latency low as demand evolves.",
    designPrinciples: ["Go Global in Minutes", "Use Serverless Architectures", "Mechanical Sympathy"],
    keyServices: ["CloudFront", "ElastiCache", "DAX", "Lambda", "Global Accelerator", "EBS gp3"],
    accentText: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/25",
  },
  {
    id: "cost_optimization",
    name: "Cost Optimization",
    shortName: "Cost Opt",
    leadAgent: "pennywise",
    summary: "Deliver business outcomes at the lowest price point using consumption models, Savings Plans, Spot, and S3 lifecycle tiers.",
    designPrinciples: ["Cloud Financial Management", "Adopt Consumption Model", "Stop Spending on Undifferentiated Heavy Lifting"],
    keyServices: ["Savings Plans", "Spot Instances", "AWS Budgets", "Cost Explorer", "S3 Intelligent-Tiering"],
    accentText: "text-emerald-600 dark:text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/25",
  },
  {
    id: "sustainability",
    name: "Sustainability",
    shortName: "Sustainability",
    leadAgent: "ecoscale",
    summary: "Minimize the environmental footprint of cloud workloads through Graviton silicon, high utilization, and managed serverless scaling.",
    designPrinciples: ["Maximize Utilization", "Adopt Graviton & Managed Services", "Reduce Downstream Data Transfer"],
    keyServices: ["AWS Graviton", "Customer Carbon Footprint Tool", "Lambda", "S3 Lifecycle", "Auto Scaling"],
    accentText: "text-teal-600 dark:text-teal-400",
    accentBg: "bg-teal-500/10 border-teal-500/25",
  },
];

export const WORKFORCE_AGENTS: Record<WorkforceAgentId, WorkforceAgentProfile> = {
  archie: {
    id: "archie",
    name: "Archie",
    role: "Principal Solutions Architect",
    pillarId: "reliability",
    voicePersona: "Adam",
    initials: "AR",
    accentColor: "bg-indigo-600 text-white",
    specialty: "Multi-AZ Reliability, VPC Topologies & SAA-C03 Design Trade-offs",
  },
  guardian: {
    id: "guardian",
    name: "Guardian",
    role: "Zero-Trust Security Lead",
    pillarId: "security",
    voicePersona: "Arnold",
    initials: "GU",
    accentColor: "bg-rose-600 text-white",
    specialty: "IAM Least Privilege, KMS Encryption, WAF vs Shield & Compliance",
  },
  pennywise: {
    id: "pennywise",
    name: "PennyWise",
    role: "Cloud FinOps Strategist",
    pillarId: "cost_optimization",
    voicePersona: "Antoni",
    initials: "PW",
    accentColor: "bg-emerald-600 text-white",
    specialty: "Savings Plans, Spot Fleets, S3 Tiering & Cost Governance",
  },
  opspulse: {
    id: "opspulse",
    name: "OpsPulse",
    role: "Site Reliability & Ops Director",
    pillarId: "operational_excellence",
    voicePersona: "Rachel",
    initials: "OP",
    accentColor: "bg-sky-600 text-white",
    specialty: "IaC Automation, CloudWatch Observability, Config & Incident Runbooks",
  },
  ecoscale: {
    id: "ecoscale",
    name: "EcoScale",
    role: "Performance & Sustainability Architect",
    pillarId: "sustainability",
    voicePersona: "Domi",
    initials: "ES",
    accentColor: "bg-teal-600 text-white",
    specialty: "Graviton Efficiency, CloudFront Edge Latency, Caching & Carbon Reduction",
  },
  trapmaster: {
    id: "trapmaster",
    name: "TrapMaster",
    role: "Exam Distractor Analyst",
    pillarId: "all",
    voicePersona: "Antoni",
    initials: "TM",
    accentColor: "bg-amber-500 text-slate-950",
    specialty: "CLF-C02 & SAA-C03 Keyword Traps and Commonly Confused Services",
  },
  professor: {
    id: "professor",
    name: "Professor Cloud",
    role: "Adaptive Socratic Mentor",
    pillarId: "all",
    voicePersona: "Rachel",
    initials: "PC",
    accentColor: "bg-slate-900 text-amber-400",
    specialty: "Cross-Agent Socratic Synthesis, Mental Models & Spoken Coaching",
  },
};

export const CERT_TRACK_CONFIG: Record<
  CertTrack,
  {
    code: CertTrack;
    name: string;
    shortName: string;
    passingScore: number;
    domains: Array<{ id: string; number: number; name: string; weight: number }>;
  }
> = {
  "CLF-C02": {
    code: "CLF-C02",
    name: "AWS Certified Cloud Practitioner",
    shortName: "Cloud Practitioner",
    passingScore: 700,
    domains: [
      { id: "cloud-concepts", number: 1, name: "Cloud Concepts", weight: 0.24 },
      { id: "security-compliance", number: 2, name: "Security & Compliance", weight: 0.30 },
      { id: "cloud-technology", number: 3, name: "Cloud Technology & Services", weight: 0.34 },
      { id: "billing-pricing", number: 4, name: "Billing, Pricing & Support", weight: 0.12 },
    ],
  },
  "SAA-C03": {
    code: "SAA-C03",
    name: "AWS Certified Solutions Architect – Associate",
    shortName: "Solutions Architect",
    passingScore: 720,
    domains: [
      { id: "saa-secure", number: 1, name: "Design Secure Architectures", weight: 0.30 },
      { id: "saa-resilient", number: 2, name: "Design Resilient Architectures", weight: 0.26 },
      { id: "saa-performant", number: 3, name: "Design High-Performing Architectures", weight: 0.24 },
      { id: "saa-cost", number: 4, name: "Design Cost-Optimized Architectures", weight: 0.20 },
    ],
  },
};
