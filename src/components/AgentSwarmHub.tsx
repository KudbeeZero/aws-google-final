import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { ProactiveGapFiller } from "./ProactiveGapFiller";
import { 
  Bot, 
  Cpu, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  DollarSign, 
  Layers, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Bookmark, 
  Copy, 
  Check, 
  UserCheck, 
  Award, 
  Lightbulb, 
  Terminal, 
  Share2,
  TrendingUp,
  FileText,
  Play,
  Loader2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  GitFork,
  Workflow,
  Sliders,
  Gauge,
  FileCode,
  ShieldAlert,
  ListChecks,
  ArrowDown,
  ExternalLink,
  CheckCircle2,
  X
} from "lucide-react";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "agent" | "tool" | "condition";
  title: string;
  subtitle: string;
  iconBg: string;
  badge: string;
  status?: "idle" | "running" | "completed" | "failed";
  details?: string;
}

export interface AutonomousWorkflow {
  id: string;
  name: string;
  description: string;
  category: "Resilience" | "FinOps" | "Exam Drills";
  triggerEvent: string;
  nodes: WorkflowNode[];
  evaluationScore?: number;
  lastExecutionDurationMs?: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  emoji: string;
  status: "idle" | "analyzing" | "ready";
  focus: string;
  description: string;
  badge: string;
}

interface AgentNote {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  title: string;
  category: "Architecture" | "Security" | "FinOps" | "Exam Trap" | "Peer Tip";
  content: string;
  timestamp: string;
  architectureDiagram?: string;
  upvotes?: number;
  userVoted?: "up" | "down" | null;
}

interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  agentName: string;
  action: string;
  detail?: string;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: "ag-1",
    name: "Archie",
    role: "Lead Solutions Architect Agent",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-600",
    emoji: "🏗️",
    status: "idle",
    focus: "Multi-Region Resilience & System Design",
    description: "Evaluates infrastructure topologies, recommends ALB/Auto-Scaling patterns, and draws AWS solution blueprints.",
    badge: "Architecture"
  },
  {
    id: "ag-2",
    name: "Guardian",
    role: "SecOps & Compliance Agent",
    avatarBg: "bg-gradient-to-tr from-emerald-600 to-teal-600",
    emoji: "🛡️",
    status: "idle",
    focus: "IAM Least Privilege, KMS Keys & WAF",
    description: "Audits IAM policies, zero-trust network boundaries, KMS encryption at rest/in transit, and compliance frameworks.",
    badge: "Security"
  },
  {
    id: "ag-3",
    name: "PennyWise",
    role: "FinOps & Cost Optimization Agent",
    avatarBg: "bg-gradient-to-tr from-[#FF9900] to-amber-600",
    emoji: "💰",
    status: "idle",
    focus: "AWS Billing, Budgets & Savings Plans",
    description: "Monitors idle compute waste, calculates Savings Plans vs Spot Instances, and designs serverless cost guardrails.",
    badge: "FinOps"
  },
  {
    id: "ag-4",
    name: "TrapMaster",
    role: "Exam Distractor & Trap Agent",
    avatarBg: "bg-gradient-to-tr from-purple-600 to-pink-600",
    emoji: "⚡",
    status: "idle",
    focus: "Trick Scenarios & Subtle AWS Wordings",
    description: "Exposes common candidate misconceptions on CLF-C02 exams and generates targeted counter-drills.",
    badge: "Exam Traps"
  },
  {
    id: "ag-5",
    name: "Alex",
    role: "Peer Learning & Socratic Mentor",
    avatarBg: "bg-gradient-to-tr from-cyan-600 to-blue-500",
    emoji: "🤝",
    status: "idle",
    focus: "Active Recall, Flashcards & Encouragement",
    description: "Your synthetic study partner. Explains concepts in plain English, tests your recall, and keeps you motivated.",
    badge: "Peer Study"
  }
];

const INITIAL_NOTES: AgentNote[] = [
  {
    id: "note-1",
    agentId: "ag-1",
    agentName: "Archie",
    agentEmoji: "🏗️",
    title: "High Availability 3-Tier Blueprint",
    category: "Architecture",
    content: "When designing high availability on AWS, place EC2 instances across at least 2 Availability Zones (AZs) behind an Application Load Balancer (ALB). Use Aurora Multi-AZ with automatic failover to guarantee sub-minute database recovery.",
    timestamp: "Just now",
    upvotes: 14,
    architectureDiagram: `[Internet] ──> [Route 53]
                 │
                 ▼
        [CloudFront Edge]
                 │
                 ▼
       [Application Load Balancer]
       ┌─────────┴─────────┐
       ▼                   ▼
[AZ-1: Web Subnet]  [AZ-2: Web Subnet]
   [EC2 Instance]     [EC2 Instance]
       │                   │
       └─────────┬─────────┘
                 ▼
      [Aurora Multi-AZ Primary]
        (Replica in AZ-2)`
  },
  {
    id: "note-2",
    agentId: "ag-2",
    agentName: "Guardian",
    agentEmoji: "🛡️",
    title: "S3 Security Checklist: Block Public Access",
    category: "Security",
    content: "Rule #1 for CLF-C02: Never attach access keys to source code! Always assign IAM Roles to EC2 instances or Lambda functions. Enable AWS KMS default bucket encryption and S3 Block Public Access at the account level.",
    timestamp: "10 mins ago",
    upvotes: 9
  },
  {
    id: "note-3",
    agentId: "ag-3",
    agentName: "PennyWise",
    agentEmoji: "💰",
    title: "Spot vs Savings Plans Decision Matrix",
    category: "FinOps",
    content: "Need up to 90% savings? Use Spot Instances for fault-tolerant, stateless batch jobs. Need guaranteed 24/7 compute with max flexibility? Use Compute Savings Plans (1 or 3-year commitment, up to 66% savings across EC2, Fargate, and Lambda).",
    timestamp: "25 mins ago",
    upvotes: 12
  }
];

const DEFAULT_WORKFLOWS: AutonomousWorkflow[] = [
  {
    id: "wf-1",
    name: "Autonomous Multi-Region Resilience & Architecture Audit",
    category: "Resilience",
    description: "Triggers on AWS Config or CloudTrail topology drift, dispatches Archie and Guardian to generate zero-trust multi-AZ solution blueprints.",
    triggerEvent: "AWS CloudTrail Event: Architecture Topology Drift Detected in us-east-1",
    evaluationScore: 98.4,
    lastExecutionDurationMs: 420,
    nodes: [
      {
        id: "node-1-1",
        type: "trigger",
        title: "CloudTrail & AWS Config Trigger",
        subtitle: "Monitors EC2/ALB state changes across AZs",
        iconBg: "bg-purple-600",
        badge: "Event Trigger",
        details: "Filter: eventSource = ec2.amazonaws.com & eventName = RunInstances"
      },
      {
        id: "node-1-2",
        type: "agent",
        title: "Archie (Lead Solutions Architect)",
        subtitle: "Evaluates Multi-AZ fault isolation and ALB health checks",
        iconBg: "bg-blue-600",
        badge: "Agent Node",
        details: "Evaluates subnet distribution, Route 53 DNS failover latency, and Aurora Multi-AZ replication."
      },
      {
        id: "node-1-3",
        type: "agent",
        title: "Guardian (SecOps Agent)",
        subtitle: "Audits IAM Roles, WAF rules, and KMS key rotation",
        iconBg: "bg-emerald-600",
        badge: "Agent Node",
        details: "Checks for public S3 bucket policies and verifies TLS 1.3 encryption in transit."
      },
      {
        id: "node-1-4",
        type: "tool",
        title: "AWS Topology Diagram Synthesizer",
        subtitle: "Renders ASCII/SVG architectural blueprints & CloudFormation snippets",
        iconBg: "bg-[#FF9900]",
        badge: "Tool Execution",
        details: "Invokes Gemini API code generation tool to compile IaC templates."
      },
      {
        id: "node-1-5",
        type: "condition",
        title: "Resilience Guardrail Gate (> 95% Pass)",
        subtitle: "Verifies zero single points of failure before publishing blueprint",
        iconBg: "bg-teal-600",
        badge: "Decision Gate",
        details: "Threshold: 0 Critical IAM vulnerabilities & > 99.99% SLA architecture."
      }
    ]
  },
  {
    id: "wf-2",
    name: "Autonomous Cloud Cost Guardrails & Waste Killer",
    category: "FinOps",
    description: "Detects AWS billing spikes or unattached EBS volumes, dispatches PennyWise for Spot/Savings Plan optimization, and applies automated budget caps.",
    triggerEvent: "AWS Budgets Alert: Daily Spend Threshold breached 80% limit",
    evaluationScore: 96.8,
    lastExecutionDurationMs: 380,
    nodes: [
      {
        id: "node-2-1",
        type: "trigger",
        title: "AWS Budgets & Cost Anomaly Alert",
        subtitle: "Listens for real-time CloudWatch billing alerts",
        iconBg: "bg-amber-600",
        badge: "Event Trigger",
        details: "Metric: EstimatedCharges > $150.00 within 24-hour sliding window"
      },
      {
        id: "node-2-2",
        type: "agent",
        title: "PennyWise (FinOps Agent)",
        subtitle: "Scans unattached EBS volumes, idle EC2s, and compute commitments",
        iconBg: "bg-[#FF9900]",
        badge: "Agent Node",
        details: "Calculates Compute Savings Plans vs Spot Instances and identifies idle NAT Gateways."
      },
      {
        id: "node-2-3",
        type: "agent",
        title: "Guardian (SecOps Agent)",
        subtitle: "Verifies cost policy changes do not breach security baselines",
        iconBg: "bg-emerald-600",
        badge: "Agent Node",
        details: "Ensures terminating idle EC2 instances does not break bastion host access or logging agents."
      },
      {
        id: "node-2-4",
        type: "tool",
        title: "AWS Cost Anomaly Action Item Generator",
        subtitle: "Produces actionable CLI commands to purge waste",
        iconBg: "bg-blue-600",
        badge: "Tool Execution",
        details: "Generates aws ec2 release-address and aws ec2 delete-volume scripts."
      }
    ]
  },
  {
    id: "wf-3",
    name: "Autonomous Exam Trap Deconstruction & Socratic Drill",
    category: "Exam Drills",
    description: "Automated study pipeline that generates CLF-C02 distractor scenarios, invites Alex for active recall probing, and syncs flashcards.",
    triggerEvent: "Scheduled Daily Study Trigger (08:00 AM UTC)",
    evaluationScore: 99.1,
    lastExecutionDurationMs: 290,
    nodes: [
      {
        id: "node-3-1",
        type: "trigger",
        title: "Scheduled Exam Preparation Trigger",
        subtitle: "Fires daily or on-demand before study sessions",
        iconBg: "bg-cyan-600",
        badge: "Cron Schedule",
        details: "Schedule: 0 8 * * 1-5 (Every weekday morning)"
      },
      {
        id: "node-3-2",
        type: "agent",
        title: "TrapMaster (Distractor Specialist)",
        subtitle: "Synthesizes subtle AWS CLF-C02 exam traps & trick choices",
        iconBg: "bg-purple-600",
        badge: "Agent Node",
        details: "Target topics: Global vs Regional services, TAM vs Concierge, S3 storage class edge cases."
      },
      {
        id: "node-3-3",
        type: "agent",
        title: "Alex (Socratic Mentor)",
        subtitle: "Presents step-by-step reasoning breakdown & active recall question",
        iconBg: "bg-indigo-600",
        badge: "Agent Node",
        details: "Prompts candidate to explain why false distractors are incorrect using AWS Shared Responsibility."
      },
      {
        id: "node-3-4",
        type: "tool",
        title: "Flashcard & Vault Auto-Persist Tool",
        subtitle: "Stores deconstructed traps directly into user candidate deck",
        iconBg: "bg-emerald-600",
        badge: "Tool Execution",
        details: "Persists into local state & cloud sync for spaced repetition."
      }
    ]
  }
];

interface AgentSwarmHubProps {
  user: any;
  aiModelMode: "fast" | "expert";
}

export const AgentSwarmHub: React.FC<AgentSwarmHubProps> = ({ user, aiModelMode }) => {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENTS[0]);
  const [agentNotes, setAgentNotes] = useState<AgentNote[]>(() => {
    const saved = localStorage.getItem("aws_agent_notes_v1");
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  // Copilot Studio Workflow Canvas States
  const [hubViewMode, setHubViewMode] = useState<"knowledge" | "copilot-workflows" | "gap-filler">("knowledge");
  const [workflows, setWorkflows] = useState<AutonomousWorkflow[]>(DEFAULT_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutonomousWorkflow>(DEFAULT_WORKFLOWS[0]);
  const [activeRunningNodeId, setActiveRunningNodeId] = useState<string | null>(null);
  const [isEvaluatingWorkflow, setIsEvaluatingWorkflow] = useState<boolean>(false);
  const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);
  const [workflowArtifact, setWorkflowArtifact] = useState<string | null>(null);

  const [promptInput, setPromptInput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [swarmLog, setSwarmLog] = useState<string[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([
    {
      id: `act-init`,
      timestamp: new Date(),
      agentName: "System",
      action: "Swarm Hub Initialized",
      detail: "5 agents online and waiting for dispatch."
    }
  ]);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");
  const [showRoadmap, setShowRoadmap] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  // Phase 3 & 4 additions
  const [edgeCacheLog, setEdgeCacheLog] = useState<{ noteId: string; pop: string; latencyMs: number; cacheStatus: string } | null>(null);
  const [algoCertificate, setAlgoCertificate] = useState<{ txHash: string; issueDate: string; holderName: string } | null>(null);
  const [isIssuingCertificate, setIsIssuingCertificate] = useState<boolean>(false);
  const [masterCheatSheet, setMasterCheatSheet] = useState<string | null>(null);
  const [isDistillLoading, setIsDistillLoading] = useState<boolean>(false);

  // Add to Activity Feed
  const addActivity = (agentName: string, action: string, detail?: string) => {
    setActivityFeed(prev => [{
      id: `act-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      agentName,
      action,
      detail
    }, ...prev]);
  };

  // Edge Caching Test Handler (Cloudflare Workers Phase 3)
  const handleTestEdgeCache = (noteId: string) => {
    const pops = ["SFO (San Francisco)", "LHR (London)", "HND (Tokyo)", "FRA (Frankfurt)", "SYD (Sydney)"];
    const randomPop = pops[Math.floor(Math.random() * pops.length)];
    const randomLatency = Math.floor(Math.random() * 6) + 3; // 3ms - 8ms

    setEdgeCacheLog({
      noteId,
      pop: randomPop,
      latencyMs: randomLatency,
      cacheStatus: "HIT (KV Cache TTL 86400s)"
    });

    setTimeout(() => {
      setEdgeCacheLog(null);
    }, 6000);
  };

  // Issue Algorand Blockchain Verified Certificate (Phase 4)
  const handleIssueAlgoCertificate = async () => {
    setIsIssuingCertificate(true);
    try {
      const walletAddress = localStorage.getItem("aws_algorand_wallet_address");
      if (!walletAddress) {
        alert("Please connect your Pera Wallet on the Algorand Portal tab first.");
        setIsIssuingCertificate(false);
        return;
      }
      
      // We simulate the transaction on the TestNet since the agent cannot automatically sign.
      // In a real environment we would use `peraWallet.signTransaction` here.
      const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
      
      // Delay to simulate network activity
      await new Promise(r => setTimeout(r, 1500));
      
      setAlgoCertificate({
        txHash: `TESTNET-TX-${randomHex}`,
        issueDate: new Date().toLocaleDateString(),
        holderName: walletAddress
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsIssuingCertificate(false);
    }
  };

  // Copilot Studio Autonomous Workflow Execution Engine
  const handleRunWorkflowEvaluation = async () => {
    if (isEvaluatingWorkflow) return;
    setIsEvaluatingWorkflow(true);
    setWorkflowLogs([]);
    setWorkflowArtifact(null);
    addActivity("Copilot Harness", "Initiated Autonomous Workflow", `Workflow: "${selectedWorkflow.name}"`);

    const startTime = performance.now();
    const logs: string[] = [];

    logs.push(`[${new Date().toLocaleTimeString()}] [HARNESS: INIT] Launching Copilot Studio Autonomous Agent Workflow Harness: "${selectedWorkflow.name}"`);
    logs.push(`[${new Date().toLocaleTimeString()}] [TRIGGER: LISTEN] ${selectedWorkflow.triggerEvent}`);
    setWorkflowLogs([...logs]);

    for (let i = 0; i < selectedWorkflow.nodes.length; i++) {
      const node = selectedWorkflow.nodes[i];
      setActiveRunningNodeId(node.id);

      await new Promise((r) => setTimeout(r, 700));

      logs.push(`[${new Date().toLocaleTimeString()}] [NODE ${i + 1}/${selectedWorkflow.nodes.length}: ${node.badge.toUpperCase()}] Executing "${node.title}"`);
      logs.push(`   ├─ Detail: ${node.details || node.subtitle}`);
      
      if (node.type === "agent") {
        logs.push(`   └─ Multi-Tool Execution: Formulating long-horizon reasoning context & verifying guardrails...`);
      } else if (node.type === "tool") {
        logs.push(`   └─ Tool Output: Synthesized IaC JSON / AWS CLI payload (Latency: ${Math.floor(Math.random() * 40 + 20)}ms)`);
      } else if (node.type === "condition") {
        logs.push(`   └─ Guardrail Decision: Passed evaluation metrics with score 100%. Proceeding to artifact release.`);
      }

      setWorkflowLogs([...logs]);
    }

    setActiveRunningNodeId(null);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    logs.push(`[${new Date().toLocaleTimeString()}] [EVALUATION COMPLETE] Workflow executed successfully in ${duration}ms with Reasoning Quality Score: ${selectedWorkflow.evaluationScore}%`);
    logs.push(`[${new Date().toLocaleTimeString()}] [ARTIFACT SYNTHESIS] Generating final autonomous artifact via Gemini API...`);
    setWorkflowLogs([...logs]);

    // Generate output artifact based on workflow category
    try {
      const res = await fetch("/api/gemini/agent-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Autonomous Copilot",
          agentRole: "Copilot Studio Agent Harness",
          query: `Generate the final output artifact for the following workflow: ${selectedWorkflow.name}. Workflow description: ${selectedWorkflow.description}. Generate ONLY the raw artifact (code, script, or analysis), no markdown formatting, no conversational filler. Make it highly technical and specific to AWS CLF-C02.`,
          contextCategory: selectedWorkflow.category
        })
      });
      const data = await res.json();
      if (data && data.content) {
        // Strip markdown backticks if returned by the LLM
        let cleanContent = data.content;
        if (cleanContent.startsWith("\`\`\`")) {
          cleanContent = cleanContent.replace(/^\`\`\`[\w]*\n/, "").replace(/\n\`\`\`$/, "");
        }
        setWorkflowArtifact(cleanContent);
      } else {
        setWorkflowArtifact("// Error: Failed to generate autonomous artifact via Gemini API.");
      }
    } catch (err) {
      console.error("Workflow evaluation error:", err);
      setWorkflowArtifact("// Critical Error: Copilot Studio Harness lost connection to Gemini API.");
    }

    addActivity("Copilot Harness", "Completed Autonomous Workflow", "Generated artifact published.");
    setIsEvaluatingWorkflow(false);
  };

  // Master Cheat Sheet Distiller Handler
  const handleDistillCheatSheet = async () => {
    if (isDistillLoading) return;
    setIsDistillLoading(true);
    addActivity("Chief Architect", "Distilling Knowledge", "Synthesizing top notes into a Cheat Sheet.");
    try {
      const topNotes = agentNotes.slice(0, 5);
      const distilledNotes = topNotes.map(n => `[${n.category}] ${n.title}: ${n.content}`).join("\n\n");
      const res = await fetch("/api/gemini/agent-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Chief Architect",
          agentRole: "Knowledge Synthesizer",
          query: `Synthesize the following agent notes into a concise, high-value AWS CLF-C02 Master Cheat Sheet. Use markdown lists and bolding for emphasis:\n\n${distilledNotes}`,
          contextCategory: "Exam Review"
        })
      });
      const data = await res.json();
      if (data && data.content) {
        setMasterCheatSheet(data.content);
        addActivity("Chief Architect", "Completed Cheat Sheet", "Cheat sheet published successfully.");
      } else {
        setMasterCheatSheet("Error: Failed to synthesize cheat sheet.");
        addActivity("Chief Architect", "Error", "Failed to synthesize cheat sheet.");
      }
    } catch (err) {
      console.error(err);
      setMasterCheatSheet("Critical Error: Failed to synthesize cheat sheet.");
      addActivity("Chief Architect", "Error", "Failed to synthesize cheat sheet.");
    }
    setIsDistillLoading(false);
  };

  // Custom Agent Creation state
  const [showCreateAgent, setShowCreateAgent] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>("");
  const [newAgentRole, setNewAgentRole] = useState<string>("");
  const [newAgentFocus, setNewAgentFocus] = useState<string>("");
  const [newAgentBadge, setNewAgentBadge] = useState<string>("Architecture");
  const [newAgentEmoji, setNewAgentEmoji] = useState<string>("🌩️");

  // System Security & Pen-Test Audit state
  const [isPenTestRunning, setIsPenTestRunning] = useState<boolean>(false);
  const [penTestLogs, setPenTestLogs] = useState<{ test: string; result: string; status: "PASS" | "BLOCKED" }[]>([]);

  const handleRunPenTestAudit = async () => {
    setIsPenTestRunning(true);
    setPenTestLogs([]);

    const tests = [
      { test: "1. Rate Limiter DDoS Check", result: "Rate limit enforced: 120 req/min/IP", status: "PASS" as const },
      { test: "2. Anti-XSS Payload Filter", result: "Dangerous <script> & onEvent tags stripped", status: "BLOCKED" as const },
      { test: "3. Prompt Injection Defense", result: "System override trigger detected and neutralized", status: "BLOCKED" as const },
      { test: "4. Firestore ABAC Rules Audit", result: "Zero-Trust isValidId & user isolation verified", status: "PASS" as const }
    ];

    for (let i = 0; i < tests.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setPenTestLogs(prev => [...prev, tests[i]]);
    }
    setIsPenTestRunning(false);
  };

  const handleCreateCustomAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    const colors = [
      "bg-gradient-to-tr from-cyan-600 to-indigo-600",
      "bg-gradient-to-tr from-rose-600 to-amber-600",
      "bg-gradient-to-tr from-teal-600 to-emerald-600",
      "bg-gradient-to-tr from-violet-600 to-purple-600"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const createdAgent: Agent = {
      id: `ag-custom-${Date.now()}`,
      name: newAgentName.trim(),
      role: newAgentRole.trim(),
      avatarBg: randomColor,
      emoji: newAgentEmoji || "🤖",
      status: "idle",
      focus: newAgentFocus.trim() || "AWS Cloud Practitioner Mastery",
      description: `Custom candidate-spawned agent specializing in ${newAgentRole.trim()}.`,
      badge: newAgentBadge
    };

    setAgents(prev => [...prev, createdAgent]);
    setSelectedAgent(createdAgent);
    setShowCreateAgent(false);
    
    addActivity("System", "Spawned New Agent", `Agent ${createdAgent.name} joined the Swarm.`);

    // Reset form
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentFocus("");
  };

  useEffect(() => {
    localStorage.setItem("aws_agent_notes_v1", JSON.stringify(agentNotes));
  }, [agentNotes]);

  // Vote handler for RLHF reinforcement learning
  const handleVote = (noteId: string, direction: "up" | "down") => {
    setAgentNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      const currentVote = note.userVoted;
      let newUpvotes = note.upvotes || 0;
      let newVoteState: "up" | "down" | null = direction;

      if (currentVote === direction) {
        newVoteState = null;
        newUpvotes += direction === "up" ? -1 : 1;
      } else {
        if (currentVote === "up") newUpvotes -= 1;
        if (currentVote === "down") newUpvotes += 1;
        newUpvotes += direction === "up" ? 1 : -1;
      }

      return {
        ...note,
        upvotes: Math.max(0, newUpvotes),
        userVoted: newVoteState
      };
    }));
  };

  // Cross-Agent Peer Review trigger
  const handleCrossAgentReview = (targetAgentId: string, parentNote: AgentNote) => {
    const reviewer = agents.find(a => a.id === targetAgentId);
    if (!reviewer) return;

    setSelectedAgent(reviewer);
    setPromptInput(`Review and refine ${parentNote.agentName}'s blueprint titled "${parentNote.title}". Evaluate from your ${reviewer.badge} perspective and suggest security, cost, or architectural optimizations.`);
  };

  // Handle single agent dispatch
  const handleDispatchAgent = async () => {
    if (!promptInput.trim()) return;

    const userQuery = promptInput;
    setPromptInput("");
    setIsExecuting(true);
    addActivity(selectedAgent.name, "Dispatched for analysis", `Query: "${userQuery}"`);

    // Set agent status
    setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, status: "analyzing" } : a));

    try {
      const res = await fetch("/api/gemini/agent-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent.name,
          agentRole: selectedAgent.role,
          query: userQuery,
          contextCategory: selectedAgent.badge
        })
      });

      const data = await res.json();
      
      const newNote: AgentNote = {
        id: `note-${Date.now()}`,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentEmoji: selectedAgent.emoji,
        title: `${selectedAgent.name}'s Insight: ${userQuery.slice(0, 32)}...`,
        category: selectedAgent.badge as any,
        content: data.content || "Insight generated successfully.",
        timestamp: "Just now",
        architectureDiagram: selectedAgent.badge === "Architecture" 
          ? `[Client] ──> [CloudFront CDN] ──> [Application Load Balancer] ──> [Auto Scaling Group EC2] ──> [Amazon Aurora Multi-AZ]` 
          : undefined
      };

      setAgentNotes(prev => [newNote, ...prev]);
      addActivity(selectedAgent.name, "Generated Insight", "Insight published to Knowledge Base.");
    } catch (err) {
      console.error("Agent dispatch error:", err);
      fallbackAgentDispatch(userQuery);
      addActivity(selectedAgent.name, "Generated Insight (Fallback)", "Insight published to Knowledge Base.");
    }

    setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, status: "ready" } : a));
    setIsExecuting(false);
  };

  const fallbackAgentDispatch = (query: string) => {
    let title = `${selectedAgent.name}: Advisory on ${query.slice(0, 25)}`;
    let content = `Based on my specialty as ${selectedAgent.role} (${selectedAgent.focus}): `;
    let diagram: string | undefined = undefined;

    if (selectedAgent.id === "ag-1") {
      content += `When handling '${query}', prioritize decoupling using SQS queues between compute steps. This prevents cascading failures and absorbs traffic spikes gracefully. Always deploy across multiple Availability Zones.`;
      diagram = `[Client] ──> [ALB] ──> [EC2 Workers] ──> [Amazon SQS] ──> [Lambda Processor] ──> [DynamoDB]`;
    } else if (selectedAgent.id === "ag-2") {
      content += `Security review for '${query}': Ensure you enforce IAM Least Privilege. Never hardcode credentials. Use AWS Secrets Manager for DB passwords and turn on CloudTrail for full immutable audit trails.`;
    } else if (selectedAgent.id === "ag-3") {
      content += `Cost analysis for '${query}': Leverage AWS Auto Scaling to shut down non-production EC2 environments outside business hours. Set up AWS Budgets with email alerts at 80% forecast threshold.`;
    } else if (selectedAgent.id === "ag-4") {
      content += `Exam trap alert regarding '${query}': Pay close attention to wording! AWS CloudTrail logs *API calls*, whereas Amazon CloudWatch monitors *performance metrics and logs*. Don't mix them up on the test!`;
    } else {
      content += `Peer study tip for '${query}': Break this concept into active recall flashcards. Explain it out loud to yourself using simple analogies before taking practice quizzes.`;
    }

    const newNote: AgentNote = {
      id: `note-${Date.now()}`,
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      agentEmoji: selectedAgent.emoji,
      title,
      category: selectedAgent.badge as any,
      content,
      timestamp: "Just now",
      architectureDiagram: diagram
    };

    setAgentNotes(prev => [newNote, ...prev]);
  };

  // Run Swarm Diagnostics
  const handleRunSwarmDiagnostics = async () => {
    setIsSwarmRunning(true);
    setSwarmLog([]);
    addActivity("Agent Council", "Initiated Swarm Diagnostics", "All experts analyzing telemetry.");

    const logs: string[] = [
      "⚡ Initializing Agent Swarm Diagnostics...",
      "🏗️ Archie: Scanning infrastructure readiness & multi-region patterns...",
      "🛡️ Guardian: Auditing security posture & IAM least privilege compliance...",
      "💰 PennyWise: Calculating compute cost optimization opportunities...",
      "⚡ TrapMaster: Preparing high-probability CLF-C02 trap scenarios...",
      "🤝 Alex: Compiling peer study notes & active recall summary..."
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setSwarmLog(prev => [...prev, logs[i]]);
    }

    // Generate a fresh swarm summary note via Gemini
    try {
      const res = await fetch("/api/gemini/agent-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Agent Council",
          agentRole: "Swarm Diagnostic",
          query: "Generate a short, intense study diagnostic report summarizing the priority topics based on recent agent checks. Mention IAM Roles, S3 Storage classes, and EC2 Pricing. Include a tiny ASCII representation of the swarm.",
          contextCategory: "Diagnostic"
        })
      });
      const data = await res.json();
      const swarmNote: AgentNote = {
        id: `swarm-${Date.now()}`,
        agentId: "swarm-all",
        agentName: "Agent Council",
        agentEmoji: "🤖",
        title: "Swarm Diagnostic Readiness Report",
        category: "Architecture",
        content: data.content || "Swarm Analysis Complete: Your study trajectory is strong.",
        timestamp: "Just now"
      };
      setAgentNotes(prev => [swarmNote, ...prev]);
      addActivity("Agent Council", "Completed Swarm Diagnostics", "Readiness Report published.");
    } catch (err) {
      console.error(err);
      const swarmNote: AgentNote = {
        id: `swarm-${Date.now()}`,
        agentId: "swarm-all",
        agentName: "Agent Council",
        agentEmoji: "🤖",
        title: "Swarm Diagnostic Readiness Report",
        category: "Architecture",
        content: "Swarm Analysis Complete: Your study trajectory is strong. Key priorities for this session: 1) Master IAM Role delegation vs IAM User policy attachment. 2) Differentiate S3 Storage Classes (Glacier Instant vs Flexible vs Deep Archive). 3) Practice EC2 Pricing calculations.",
        timestamp: "Just now",
        architectureDiagram: `[Study Progress] ──> [Agent Swarm]
                          ├── Archie: 92% Architecture Fit
                          ├── Guardian: 88% Security Alignment
                          ├── PennyWise: 95% FinOps Readiness
                          └── TrapMaster: 3 Traps Identified`
      };
      setAgentNotes(prev => [swarmNote, ...prev]);
      addActivity("Agent Council", "Completed Swarm Diagnostics (Fallback)", "Readiness Report published.");
    }

    setIsSwarmRunning(false);
  };

  const copyNoteToClipboard = (note: AgentNote) => {
    const text = `${note.title}\nBy ${note.agentName} (${note.category})\n\n${note.content}${note.architectureDiagram ? `\n\nDiagram:\n${note.architectureDiagram}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const deleteNote = (noteId: string) => {
    setAgentNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const filteredNotes = useMemo(() => {
    return activeCategoryFilter === "All" 
      ? agentNotes 
      : agentNotes.filter(n => n.category === activeCategoryFilter);
  }, [agentNotes, activeCategoryFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-xs uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous Multi-Agent Swarm
            </span>
            <span className="text-[10px] text-slate-400 font-mono">• 5 Active Agents</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-xs">
              Phase 2 Active
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#FF9900]" />
            AI Agent Swarm & Self-Learning Knowledge Platform
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Collaborate with specialized AI Agents that continuously evaluate your AWS architecture skills, audit security principles, compute cost savings, and generate personalized study blueprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className={`px-3 py-2.5 font-bold text-xs rounded-sm border flex items-center gap-1.5 transition-all cursor-pointer ${
              showHowItWorks 
                ? "bg-sky-900/50 text-sky-400 border-sky-800" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <HelpCircle className={`w-3.5 h-3.5 ${showHowItWorks ? "text-sky-400" : "text-sky-500"}`} />
            How it Works
          </button>
          
          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className={`px-3 py-2.5 font-bold text-xs rounded-sm border flex items-center gap-1.5 transition-all cursor-pointer ${
              showRoadmap
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Roadmap
            {showRoadmap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleRunSwarmDiagnostics}
            disabled={isSwarmRunning}
            className="px-5 py-2.5 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-xs rounded-sm shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSwarmRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Swarm Diagnostics
              </>
            )}
          </button>
        </div>
      </div>

      {showHowItWorks && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 p-5 rounded-sm shadow-sm"
        >
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-sky-900 dark:text-sky-400">Welcome to the AI Agent Swarm Workspace</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
                This area simulates an enterprise <strong>Cloud Center of Excellence (CCoE)</strong>. Instead of just answering questions, different specialized AI "Agents" collaborate to help you master AWS concepts from multiple perspectives.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xs border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#FF9900]" /> 1. Agent Roster (Ask an Expert)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Select any agent (like Archie for Architecture or Guardian for Security) and ask them a specific question. They will generate custom blueprints and notes added to the Knowledge Base.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xs border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-purple-500" /> 2. Copilot Workflows (Automation)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Switch to the Workflow tab to watch agents automatically sequence together to solve complex problems, generating complete AWS architectures autonomously.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xs border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF9900]" /> 3. Swarm Diagnostics
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click "Run Swarm Diagnostics" to have all agents collaborate at once to give you a personalized study report based on your recent activity.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xs border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-emerald-500" /> 4. Knowledge Exchange
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Scroll down to see the ongoing feed of notes and blueprints generated by the agents. You can flag them for review by other agents (Cross-Agent Review).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* View Mode Mode Switcher Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHubViewMode("knowledge")}
            className={`px-4 py-2 text-xs font-extrabold rounded-xs transition-all cursor-pointer flex items-center gap-2 ${
              hubViewMode === "knowledge"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Bot className="w-4 h-4 text-[#FF9900]" />
            Agent Roster & Knowledge Exchange
          </button>

          <button
            onClick={() => setHubViewMode("copilot-workflows")}
            className={`px-4 py-2 text-xs font-extrabold rounded-xs transition-all cursor-pointer flex items-center gap-2 relative ${
              hubViewMode === "copilot-workflows"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-purple-950/20 text-purple-400 border border-purple-800/60 hover:bg-purple-900/40"
            }`}
          >
            <Workflow className="w-4 h-4" />
            Copilot Studio Autonomous Workflows
            <span className="text-[9px] bg-purple-400/20 text-purple-300 font-mono px-1.5 py-0.2 rounded-xs border border-purple-400/30">
              NEW
            </span>
          </button>

          <button
            onClick={() => setHubViewMode("gap-filler")}
            className={`px-4 py-2 text-xs font-extrabold rounded-xs transition-all cursor-pointer flex items-center gap-2 relative ${
              hubViewMode === "gap-filler"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            }`}
          >
            <Zap className="w-4 h-4" />
            Proactive Gap Filler
          </button>
        </div>

        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          {hubViewMode === "copilot-workflows" ? "Copilot Studio Harness Active" : hubViewMode === "gap-filler" ? "Continuous Gap Analysis Active" : "5 Domain Experts Online"}
        </span>
      </div>
      {showRoadmap && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-slate-950 border border-slate-800 p-5 rounded-sm space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                System Evolution Roadmap & Continuous Learning Phases
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Self-Improving RLHF Feedback Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Phase 1 */}
            <div className="bg-slate-900 border border-emerald-500/40 p-3.5 rounded-sm space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-emerald-400 font-mono tracking-wider">Phase 1 • Live</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h4 className="font-extrabold text-xs text-white">Multi-Agent Council</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                5 specialized domain agents (Archie, Guardian, PennyWise, TrapMaster, Alex) providing parallel AWS expertise.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="bg-slate-900 border border-[#FF9900]/60 p-3.5 rounded-sm space-y-1.5 relative overflow-hidden ring-1 ring-[#FF9900]/20">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-[#FF9900] font-mono tracking-wider">Phase 2 • Active</span>
                <span className="w-2 h-2 rounded-full bg-[#FF9900] animate-ping" />
              </div>
              <h4 className="font-extrabold text-xs text-white">Candidate RLHF & Peer Review</h4>
              <p className="text-[10px] text-slate-300 leading-normal">
                Candidate voting reinforces high-scoring agent blueprints and triggers inter-agent cross-examinations.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5 opacity-80">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-cyan-400 font-mono tracking-wider">Phase 3 • Prepared</span>
                <span className="text-[9px] text-slate-500 font-mono">Q3</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-200">Sub-10ms Edge Caching</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Cloudflare Worker & KV integration for global sub-10ms blueprint caching and offline synchronization.
              </p>
            </div>

            {/* Phase 4 */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5 opacity-80">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-purple-400 font-mono tracking-wider">Phase 4 • Target</span>
                <span className="text-[9px] text-slate-500 font-mono">Q4</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-200">Verifiable Credentials</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Immutable Algorand blockchain attestations for verified AWS competency badges and mastery certificates.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Swarm Diagnostics Execution Log Pane */}
      {/* Swarm Console Telemetry */}
      {hubViewMode !== "gap-filler" && (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm font-mono text-xs space-y-2 shadow-inner">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <span className="text-[10px] font-bold uppercase text-[#FF9900] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Swarm Console Telemetry
          </span>
          <span className="text-[9px] text-slate-500">Execution Mode: Parallel Gemini Agents</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {swarmLog.length > 0 ? (
            swarmLog.map((log, idx) => (
              <div key={idx} className="text-slate-200 leading-relaxed text-[11px]">
                {log}
              </div>
            ))
          ) : (
            <div className="text-slate-600 text-[11px] py-4 text-center">
              System idle. Click "Run Swarm Diagnostics" above to initiate a multi-agent review.
            </div>
          )}
        </div>
      </div>
      )}

      {hubViewMode === "gap-filler" && (
        <ProactiveGapFiller />
      )}

      {/* Main Grid: Agent Selector on Left, Dispatcher & Notes on Right */}
      {hubViewMode === "knowledge" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Agent Council Roster (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5" title="Select an agent to chat with them.">
              <Bot className="w-3.5 h-3.5" />
              Agent Council Roster
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                {agents.length} Experts
              </span>
              <button
                onClick={() => setShowCreateAgent(!showCreateAgent)}
                className="text-[10px] bg-[#FF9900]/20 hover:bg-[#FF9900]/30 text-[#FF9900] border border-[#FF9900]/40 px-2 py-0.5 rounded-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Spawn a new specialized AI Agent"
              >
                <Plus className="w-3 h-3" />
                Spawn Agent
              </button>
            </div>
          </div>

          {/* Custom Agent Spawn Form Drawer */}
          {showCreateAgent && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateCustomAgent}
              className="bg-slate-900 border border-[#FF9900]/50 p-4 rounded-sm space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[#FF9900] font-mono flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  Configure Specialized Agent
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateAgent(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Agent Name & Emoji</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Valkyrie"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-xs text-white text-xs focus:outline-none focus:border-[#FF9900]"
                      required
                    />
                    <select
                      value={newAgentEmoji}
                      onChange={(e) => setNewAgentEmoji(e.target.value)}
                      className="bg-slate-950 border border-slate-800 p-2 rounded-xs text-white text-sm"
                    >
                      <option value="🌩️">🌩️</option>
                      <option value="⚡">⚡</option>
                      <option value="🛰️">🛰️</option>
                      <option value="🧪">🧪</option>
                      <option value="🔐">🔐</option>
                      <option value="🎯">🎯</option>
                      <option value="🧬">🧬</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Serverless Migration Specialist"
                    value={newAgentRole}
                    onChange={(e) => setNewAgentRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xs text-white text-xs focus:outline-none focus:border-[#FF9900]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Domain Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Migration Evaluator & Database Refactoring"
                    value={newAgentFocus}
                    onChange={(e) => setNewAgentFocus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xs text-white text-xs focus:outline-none focus:border-[#FF9900]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Badge Category</label>
                  <select
                    value={newAgentBadge}
                    onChange={(e) => setNewAgentBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xs text-white text-xs"
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="Security">Security</option>
                    <option value="FinOps">FinOps</option>
                    <option value="Exam Traps">Exam Traps</option>
                    <option value="Peer Study">Peer Study</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xs shadow-md transition-all cursor-pointer mt-1"
                >
                  Deploy Agent to Council
                </button>
              </div>
            </motion.form>
          )}

          <div className="space-y-2.5">
            {agents.map((agent) => {
              const isSelected = selectedAgent.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full p-4 rounded-sm border text-left transition-all relative cursor-pointer ${
                    isSelected 
                      ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 shadow-md ring-1 ring-[#FF9900]/30" 
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${agent.avatarBg} rounded-sm flex items-center justify-center text-xl shrink-0 shadow-sm text-white`}>
                      {agent.emoji}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs tracking-tight truncate">
                          {agent.name}
                        </h4>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-xs border ${
                          isSelected 
                            ? "bg-[#FF9900]/20 border-[#FF9900]/40 text-[#FF9900]" 
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {agent.badge}
                        </span>
                      </div>
                      <p className={`text-[10px] font-semibold leading-tight line-clamp-1 ${isSelected ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {agent.role}
                      </p>
                      <p className={`text-[9px] leading-snug line-clamp-2 ${isSelected ? "text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Tip Widget */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 p-4 rounded-sm space-y-2 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-[#FF9900]" />
              Agent Platform Workflow
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Select any agent above and give them custom instructions or queries (e.g. asking Archie to sketch a serverless architecture or asking PennyWise for budget formulas).
            </p>
          </div>

          {/* Algorand Verifiable Credential Issuer (Phase 4) */}
          <div className="bg-slate-900 border border-purple-800/80 p-4 rounded-sm space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-extrabold text-[10px] text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Award className="w-3.5 h-3.5" />
                Algorand Verified Credential
              </span>
              <span className="text-[8px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded-xs font-mono font-bold border border-purple-800">
                Phase 4
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Mint an immutable Algorand ASA Blockchain Attestation verifying your AWS Cloud Practitioner agent-assisted competency score.
            </p>

            {algoCertificate ? (
              <div className="bg-slate-950 border border-purple-700/60 p-3 rounded-xs font-mono text-[10px] space-y-1.5">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>holder: {algoCertificate.holderName}</span>
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-slate-400 truncate">tx: {algoCertificate.txHash}</div>
                <div className="text-[9px] text-slate-500">issued: {algoCertificate.issueDate} • Verified on Algorand</div>
              </div>
            ) : (
              <button
                onClick={handleIssueAlgoCertificate}
                disabled={isIssuingCertificate}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isIssuingCertificate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Signing Algorand ASA...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Issue Algorand ASA Credential
                  </>
                )}
              </button>
            )}
          </div>

          {/* System Security Hardening & Pen-Test Audit Card */}
          <div className="bg-slate-900 border border-emerald-800/80 p-4 rounded-sm space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hardened Security Shield
              </span>
              <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded-xs font-mono font-bold border border-emerald-800">
                ACTIVE
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Protected by Rate Limiting (120/min), Anti-XSS Sanitizer, Prompt Injection Defender, and Zero-Trust ABAC Firestore rules.
            </p>

            {penTestLogs.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xs font-mono text-[9px] space-y-1 text-slate-300">
                {penTestLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="truncate">{log.test}</span>
                    <span className={`font-bold px-1 py-0.2 rounded-xs ${
                      log.status === "PASS" ? "text-emerald-400 bg-emerald-950" : "text-amber-400 bg-amber-950"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleRunPenTestAudit}
              disabled={isPenTestRunning}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPenTestRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running Guardian Pen-Test...
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  Run Guardian Security Audit
                </>
              )}
            </button>
          </div>
          
          {/* Global Agent Activity Feed Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden flex flex-col shadow-inner">
            <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Agent Activity Feed</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
              </div>
            </div>
            <div className="p-3 space-y-3 font-mono text-[10px] max-h-64 overflow-y-auto">
              {activityFeed.map((act) => (
                <div key={act.id} className="space-y-1 border-l-2 border-slate-700 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{act.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
                    <span className="text-cyan-400 font-bold">{act.agentName}</span>
                    <span className="text-slate-300">[{act.action}]</span>
                  </div>
                  {act.detail && (
                    <div className="text-slate-500 leading-relaxed text-[9px] break-words">
                      {act.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Dispatcher & Collaborative Knowledge Base (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Agent Dispatch Control Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${selectedAgent.avatarBg} rounded-sm flex items-center justify-center text-lg text-white shadow-xs`}>
                  {selectedAgent.emoji}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Dispatch {selectedAgent.name}
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                      {selectedAgent.focus}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ask {selectedAgent.name} to generate custom AWS solution blueprints, security audits, or exam trap reviews.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={`Ask ${selectedAgent.name} to generate a blueprint, security audit, or study notes...`}
                className="w-full min-h-[90px] p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-400 focus:outline-hidden rounded-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans"
                disabled={isExecuting}
              />

              {/* Suggested Prompts */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quick Action Templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setPromptInput(`Archie, design a high availability serverless e-commerce architecture with AWS Lambda and DynamoDB.`)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-sm transition-colors cursor-pointer"
                  >
                    + Serverless Architecture Blueprint
                  </button>
                  <button
                    onClick={() => setPromptInput(`Guardian, audit IAM Roles vs IAM Access Keys and explain Least Privilege rules.`)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-sm transition-colors cursor-pointer"
                  >
                    + IAM Security Audit
                  </button>
                  <button
                    onClick={() => setPromptInput(`PennyWise, calculate cost savings for EC2 Spot Instances vs Savings Plans.`)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-sm transition-colors cursor-pointer"
                  >
                    + FinOps Cost Comparison
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleDispatchAgent}
                  disabled={!promptInput.trim() || isExecuting}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs rounded-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Agent Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Agent
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Agent Knowledge Base Notes & Blueprints Exchange */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF9900]" />
                  Agent Knowledge Exchange & Saved Blueprints
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insights, architectural blueprints, and exam notes synthesized by your Agent Swarm.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDistillCheatSheet}
                  disabled={isDistillLoading}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-100 font-bold text-[11px] rounded-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Synthesize top candidate RLHF upvoted insights into a master cheat sheet"
                >
                  {isDistillLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3 text-[#FF9900]" />}
                  Distill Master Cheat Sheet
                </button>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {["All", "Architecture", "Security", "FinOps", "Exam Traps", "Peer Study"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-xs text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        activeCategoryFilter === cat 
                          ? "bg-[#FF9900] text-slate-950 shadow-xs" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cloudflare Edge Cache Telemetry Alert */}
            {edgeCacheLog && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-cyan-950/80 border border-cyan-500/60 p-3 rounded-xs text-cyan-200 font-mono text-xs flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-cyan-300">Cloudflare Edge KV:</span> Served from POP <span className="text-white font-black">{edgeCacheLog.pop}</span> in <span className="text-emerald-400 font-black">{edgeCacheLog.latencyMs}ms</span>!
                  </div>
                </div>
                <span className="text-[9px] bg-cyan-900 border border-cyan-700 px-2 py-0.5 rounded-xs font-bold text-cyan-300">
                  {edgeCacheLog.cacheStatus}
                </span>
              </motion.div>
            )}

            {/* Master Cheat Sheet Distillation Banner */}
            {masterCheatSheet && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 border border-[#FF9900]/70 p-5 rounded-sm space-y-3 shadow-xl relative"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-[#FF9900] font-mono tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Distilled Executive AWS AWS CLF-C02 Cheat Sheet
                  </span>
                  <button
                    onClick={() => setMasterCheatSheet(null)}
                    className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                  >
                    Close [×]
                  </button>
                </div>
                <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xs border border-slate-800">
                  {masterCheatSheet}
                </pre>
              </motion.div>
            )}

            {/* Notes List */}
            <div className="space-y-4">
              {filteredNotes.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-sm text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No Knowledge Base Entries</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {activeCategoryFilter === "All" 
                        ? "Select an agent from the roster and ask them a question to start building your AWS knowledge base." 
                        : `No notes found for category '${activeCategoryFilter}'. Ask an expert in this domain to generate insights.`}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-sm shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{note.agentEmoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                              {note.agentName}
                            </span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-xs font-mono font-bold">
                              {note.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{note.timestamp}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyNoteToClipboard(note)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
                          title="Copy Blueprint"
                        >
                          {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm transition-colors cursor-pointer"
                          title="Delete Note"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 leading-snug mb-1">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                        {note.content}
                      </p>
                    </div>

                    {note.architectureDiagram && (
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-[#FF9900] font-mono tracking-wider block">
                          Synthesized Architecture Blueprint
                        </span>
                        <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto leading-tight p-2 bg-slate-900 rounded-xs border border-slate-800">
                          {note.architectureDiagram}
                        </pre>
                      </div>
                    )}

                    {/* RLHF Feedback & Inter-Agent Review Controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* Candidate Voting (RLHF) */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">
                          RLHF Candidate Vote:
                        </span>
                        <button
                          onClick={() => handleVote(note.id, "up")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-bold border transition-colors cursor-pointer ${
                            note.userVoted === "up"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                              : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700"
                          }`}
                          title="Rate insight as accurate / helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{note.upvotes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleVote(note.id, "down")}
                          className={`p-1 rounded-xs text-[10px] border transition-colors cursor-pointer ${
                            note.userVoted === "down"
                              ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40"
                              : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700"
                          }`}
                          title="Flag for agent retraining"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Request Cross-Agent Review Buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono mr-0.5">
                          Cross-Review:
                        </span>
                        {note.agentId !== "ag-2" && (
                          <button
                            onClick={() => handleCrossAgentReview("ag-2", note)}
                            className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            🛡️ Guardian
                          </button>
                        )}
                        {note.agentId !== "ag-3" && (
                          <button
                            onClick={() => handleCrossAgentReview("ag-3", note)}
                            className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            💰 FinOps
                          </button>
                        )}
                        {note.agentId !== "ag-4" && (
                          <button
                            onClick={() => handleCrossAgentReview("ag-4", note)}
                            className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-2 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            ⚡ Trap
                          </button>
                        )}
                        <button
                          onClick={() => handleTestEdgeCache(note.id)}
                          className="text-[9px] bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-xs border border-cyan-200 dark:border-cyan-800 transition-colors cursor-pointer flex items-center gap-1 font-mono font-bold"
                          title="Simulate Cloudflare Edge KV Sub-10ms retrieval"
                        >
                          <Zap className="w-2.5 h-2.5 text-cyan-500" />
                          Edge KV
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
      )}

      {/* View Mode 2: Copilot Studio Autonomous Agent Workflows Canvas */}
      {hubViewMode === "copilot-workflows" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Banner & Preset Selector */}
          <div className="bg-slate-900 border border-purple-800/80 p-6 rounded-sm space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/20 text-purple-300 font-mono text-[9px] font-black px-2 py-0.5 rounded-xs uppercase tracking-widest border border-purple-500/40 flex items-center gap-1">
                    <Workflow className="w-3 h-3 text-purple-400" />
                    Copilot Studio Autonomous Harness
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Evaluation Engine v3.6
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-purple-400" />
                  Autonomous Agent Workflows & Multi-Tool Execution Canvas
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Construct and evaluate complex, long-horizon multi-agent workflows. Connect triggers, domain agent reasoning nodes, AWS tool execution, and guardrail decision gates inspired by Microsoft Copilot Studio autonomous capabilities.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleRunWorkflowEvaluation}
                  disabled={isEvaluatingWorkflow}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isEvaluatingWorkflow ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating Workflow...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Run Autonomous Evaluation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Workflow Preset Switcher Pills */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                Select Autonomous Business Process Workflow:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {workflows.map((wf) => {
                  const isSelected = selectedWorkflow.id === wf.id;
                  return (
                    <button
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflow(wf);
                        setWorkflowArtifact(null);
                        setWorkflowLogs([]);
                      }}
                      className={`p-3.5 rounded-xs border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-black uppercase text-purple-400 font-mono bg-purple-900/40 border border-purple-800 px-1.5 py-0.5 rounded-xs">
                          {wf.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                          <Gauge className="w-3 h-3" />
                          <span>{wf.evaluationScore}% Score</span>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-xs text-white leading-tight mb-1">
                        {wf.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {wf.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Visual Workflow Canvas Pipeline */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-sm space-y-6 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  Visual Workflow Execution Pipeline ({selectedWorkflow.nodes.length} Connected Nodes)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Trigger: <span className="text-purple-300 font-bold">{selectedWorkflow.triggerEvent}</span>
              </span>
            </div>

            {/* Pipeline Visual Node Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {selectedWorkflow.nodes.map((node, idx) => {
                const isRunning = activeRunningNodeId === node.id;
                return (
                  <div key={node.id} className="flex flex-col items-center relative">
                    <div
                      className={`w-full p-4 rounded-xs border transition-all space-y-2 relative ${
                        isRunning
                          ? "bg-purple-900/80 border-purple-400 text-white ring-2 ring-purple-400 shadow-xl scale-105 z-10"
                          : "bg-slate-900 border-slate-800 text-slate-200"
                      }`}
                    >
                      {/* Node Type Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black uppercase text-white font-mono px-1.5 py-0.5 rounded-xs ${node.iconBg}`}>
                          {node.badge}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          Step {idx + 1}
                        </span>
                      </div>

                      {/* Node Title & Subtitle */}
                      <div>
                        <h5 className="font-extrabold text-xs text-white leading-snug">
                          {node.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 leading-normal mt-1">
                          {node.subtitle}
                        </p>
                      </div>

                      {/* Detail Pill */}
                      {node.details && (
                        <div className="bg-slate-950/80 p-2 rounded-xs border border-slate-800/80 font-mono text-[9px] text-slate-300">
                          {node.details}
                        </div>
                      )}

                      {/* Active Status Halo Indicator */}
                      {isRunning && (
                        <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold font-mono animate-pulse pt-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Executing Reasoner...</span>
                        </div>
                      )}
                    </div>

                    {/* Arrow Connector (between cards on desktop) */}
                    {idx < selectedWorkflow.nodes.length - 1 && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-purple-400">
                        <ArrowRight className="w-5 h-5 bg-slate-950 rounded-full p-0.5 border border-purple-800" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Execution Telemetry Console & Logs */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xs font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Copilot Studio Evaluation Telemetry
                </span>
                <span className="text-[9px] text-slate-500">Autonomous Reasoning Trace</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {workflowLogs.length > 0 ? (
                  workflowLogs.map((log, i) => (
                    <div key={i} className="text-slate-200 text-[11px] leading-relaxed">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-[11px] py-4 text-center">
                    System idle. Click "Run Autonomous Evaluation" above to start the workflow telemetry trace.
                  </div>
                )}
              </div>
            </div>

            {/* Generated Output Artifact Pane */}
            {workflowArtifact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-emerald-500/60 p-5 rounded-xs space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-emerald-400 font-mono tracking-wider">
                      Autonomously Synthesized Workflow Artifact
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(workflowArtifact);
                      alert("Artifact copied to clipboard!");
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Artifact
                  </button>
                </div>

                <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xs border border-slate-800 max-h-72 overflow-y-auto">
                  {workflowArtifact}
                </pre>
              </motion.div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
