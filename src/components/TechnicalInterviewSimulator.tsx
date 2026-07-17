import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { 
  Briefcase, 
  Video, 
  MessageSquare, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Map, 
  UserCheck, 
  ShieldAlert, 
  Bookmark, 
  Award, 
  Sparkles, 
  ArrowRight, 
  Check, 
  RefreshCw, 
  AlertCircle,
  VideoOff,
  Mic,
  Plus,
  Play,
  Save,
  Loader2,
  HelpCircle
} from "lucide-react";
import { auth, saveInterviewSessionToCloud } from "../lib/firebase";
import { getRoadmapFromCloud, saveRoadmapToCloud } from "../lib/db-client";

interface Interviewer {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  emoji: string;
  tone: string;
  focusArea: string;
}

interface InterviewScenario {
  id: string;
  title: string;
  domain: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  question: string;
  requiredKeywords: string[];
  helperTips: string[];
  optimalResponseStructure: string;
}

interface ScorecardResult {
  matchPercent: number;
  grade: "Exemplary" | "Proficient" | "Developing" | "Needs Review";
  foundKeywords: string[];
  missingKeywords: string[];
  interviewerFeedback: string;
  rubricScores: {
    accuracy: number;
    communication: number;
    bestPractices: number;
    businessValue: number;
  };
}

const INTERVIEWERS: Interviewer[] = [
  {
    id: "int-1",
    name: "Sarah Jenkins",
    role: "Lead Cloud Solutions Architect",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-indigo-500",
    emoji: "👩‍💻",
    tone: "Professional, analytical, focuses on AWS Well-Architected Framework compliance.",
    focusArea: "High Availability & Multi-Region Resiliency"
  },
  {
    id: "int-2",
    name: "Raj Patel",
    role: "Director of DevSecOps & Security",
    avatarBg: "bg-gradient-to-tr from-emerald-600 to-teal-500",
    emoji: "👨‍💻",
    tone: "Meticulous, safety-first, values Least Privilege, network segregation, and KMS keys.",
    focusArea: "Cloud Security, IAM & Identity Management"
  },
  {
    id: "int-3",
    name: "Marcus Sterling",
    role: "VP of Cloud Economics & FinOps",
    avatarBg: "bg-gradient-to-tr from-amber-500 to-orange-500",
    emoji: "👨‍💼",
    tone: "Business-savvy, metrics-driven, hates idle capacity, loves Spot Instances and Savings Plans.",
    focusArea: "Cloud Cost Optimization & AWS Billing"
  }
];

const SCENARIOS: InterviewScenario[] = [
  {
    id: "sc-1",
    title: "The Sluggish E-Commerce Database",
    domain: "Technology & Services",
    difficulty: "Intermediate",
    question: "Our flagship retail application runs on virtual machines, and during seasonal shopping events, our relational database bottlenecks, causing page load failures. What AWS database architectures and best practices should we implement to resolve scaling bottlenecks and guarantee high availability?",
    requiredKeywords: ["Aurora", "Multi-AZ", "Read Replicas", "ElastiCache", "Auto Scaling"],
    helperTips: [
      "Mention Amazon Aurora for modern cloud-native relational databases with self-healing features.",
      "Advocate for Multi-AZ deployments to ensure high availability and automatic failover.",
      "Recommend Read Replicas to offload traffic from the primary read-write database node.",
      "Incorporate Amazon ElastiCache (Redis/Memcached) for lightning-fast memory caching of repetitive queries."
    ],
    optimalResponseStructure: "Start by analyzing the database bottleneck. Introduce Amazon Aurora as the serverless or provisioned relational engine. Detail how Multi-AZ guarantees instant failover. Explain how spinning up Read Replicas segregates heavy reporting/read operations. Conclude with adding a caching layer like ElastiCache to offload the database entirely."
  },
  {
    id: "sc-2",
    title: "Addressing the Over-Privileged VM",
    domain: "Security & Compliance",
    difficulty: "Beginner",
    question: "A developer is asking for full AdministratorAccess credentials to be hardcoded inside an application configuration file on an EC2 instance. They claim this is required so the application can fetch files from Amazon S3 and publish messages to Amazon SQS. How would you secure this scenario following AWS core security guidelines?",
    requiredKeywords: ["IAM Role", "Least Privilege", "IAM Policy", "Access Keys", "Temporary Credentials"],
    helperTips: [
      "Explicitly reject hardcoding long-term Access Keys or using full Admin rights.",
      "Use IAM Roles attached directly to the EC2 instance (instance profiles).",
      "Explain the Principle of Least Privilege: granting only s3:GetObject and sqs:SendMessage permissions.",
      "Point out that IAM Roles supply secure temporary credentials automatically rotated by AWS."
    ],
    optimalResponseStructure: "Decline hardcoding credentials immediately. Introduce the concept of IAM Roles for EC2 instances. Formulate a custom IAM policy with minimal actions (e.g. S3 read, SQS write). Emphasize that IAM Roles automatically generate temporary, self-rotating credentials, eliminating hardcoded secret exposures."
  },
  {
    id: "sc-3",
    title: "High-Priority Disaster Recovery Policy",
    domain: "Cloud Concepts & Tech",
    difficulty: "Advanced",
    question: "A financial service client requires a bulletproof multi-region Disaster Recovery plan. They specified a Recovery Point Objective (RPO) of under 10 minutes and a Recovery Time Objective (RTO) of under 15 minutes. Which architectural options and AWS replication technologies support these strict SLAs?",
    requiredKeywords: ["Warm Standby", "Pilot Light", "Multi-Region", "Route 53 Failover", "Global Database"],
    helperTips: [
      "Compare DR methods: Backup & Restore vs. Pilot Light vs. Warm Standby vs. Multi-Site Active-Active.",
      "Select Warm Standby or Multi-Region Active-Active for extremely aggressive RTOs under 15 minutes.",
      "Incorporate Route 53 DNS Failover (with health checks) to route external users to the backup region automatically.",
      "Propose Amazon Aurora Global Database for sub-second database replication across geographical zones."
    ],
    optimalResponseStructure: "Acknowledge the strict 10-minute RPO / 15-minute RTO. Recommend a Warm Standby or Active-Active Multi-Region strategy. Deploy Route 53 Routing Policies (Failover or Latency-based) for instant traffic routing. Set up Aurora Global Database for real-time replica streams across regions. Explain the cost vs. recovery speed tradeoffs."
  },
  {
    id: "sc-4",
    title: "Aggressive Development Budget Overruns",
    domain: "Billing & Cost Management",
    difficulty: "Intermediate",
    question: "The engineering team has spun up hundreds of sandbox environments for testing, causing the monthly AWS bill to spike dramatically. Developers frequently leave instances running over weekends. What structural billing features, pricing models, and automation can we deploy to optimize costs?",
    requiredKeywords: ["Cost Explorer", "AWS Budgets", "Savings Plans", "Spot Instances", "Instance Scheduler"],
    helperTips: [
      "Use AWS Cost Explorer to analyze and visualize where expenditures are occurring.",
      "Configure AWS Budgets with proactive email/SMS alarms based on actual and forecasted spending.",
      "Use AWS Instance Scheduler to automatically stop EC2 test systems outside business hours.",
      "Utilize Spot Instances for temporary non-critical dev containers to save up to 90% compared to On-Demand."
    ],
    optimalResponseStructure: "Deploy AWS Cost Explorer for deep analytics of the sudden spikes. Implement AWS Budgets with active threshold notifications. Configure AWS Instance Scheduler to shut down dev virtual machines on weekends and evenings. Transition non-production test containers to Spot Instances and lock in predictable continuous workloads with AWS Savings Plans."
  },
  {
    id: "sc-5",
    title: "Defending Against DDoS & Bot Scrapers",
    domain: "Security & Compliance",
    difficulty: "Intermediate",
    question: "A global application is suffering from recurring Distributed Denial of Service (DDoS) attempts at the network layer and high-volume scraper bots stealing proprietary API data. What multi-tier AWS edge-security architecture would you propose to shield the application?",
    requiredKeywords: ["WAF", "Shield Advanced", "CloudFront", "Security Groups", "Route 53"],
    helperTips: [
      "Place Amazon CloudFront at the front line as a globally distributed Content Delivery Network (CDN).",
      "Deploy AWS Shield Advanced for massive Layer 3/4 protection and specialized 24/7 DDoS response.",
      "Attach AWS WAF (Web Application Firewall) to CloudFront to inspect Layer 7 HTTP rules and block bot traffic.",
      "Configure VPC Security Groups to reject all traffic except requests sourced directly from CloudFront IP blocks."
    ],
    optimalResponseStructure: "Design defense-in-depth starting from the edge. Set up Amazon Route 53 and Amazon CloudFront to absorb network-level spikes globally. Subscribe to AWS Shield Advanced for proactive protection and DRT expert engagement. Implement AWS WAF rulesets targeting SQL Injection and crawler scripts. Limit backend Security Groups to trust only CloudFront proxies."
  },
  {
    id: "sc-6",
    title: "The Scalable Serverless Microservice API",
    domain: "Technology & Services",
    difficulty: "Beginner",
    question: "Our development team is launching a new public API that needs to scale instantly from zero to thousands of requests with minimal operations overhead. They also need a fully managed NoSQL database. What serverless AWS architecture would you design?",
    requiredKeywords: ["Lambda", "API Gateway", "DynamoDB", "S3", "CloudWatch"],
    helperTips: [
      "Utilize Amazon API Gateway to receive HTTPS endpoints and throttle traffic.",
      "Execute application logic inside AWS Lambda for zero-admin serverless compute.",
      "Save transactional data inside Amazon DynamoDB for seamless high-throughput NoSQL storage.",
      "Store static front-end assets inside Amazon S3 and monitor performance with Amazon CloudWatch."
    ],
    optimalResponseStructure: "Propose placing Amazon API Gateway at the public boundary. Integrate API Gateway directly with AWS Lambda functions to handle backend microservice routing. Write persistent transactional state to Amazon DynamoDB, a fully managed NoSQL catalog. Configure Amazon CloudWatch for unified logging and set up S3 static website hosting for front-end presentation."
  },
  {
    id: "sc-7",
    title: "The Shared Responsibility Boundary",
    domain: "Cloud Concepts & Tech",
    difficulty: "Beginner",
    question: "A customer wants to deploy a proprietary medical records application onto AWS EC2 instances, and is confused about who handles what. Specifically, who is responsible for patching the guest operating system, securing physical data centers, and encrypting customer data?",
    requiredKeywords: ["Shared Responsibility", "AWS Artifact", "Guest OS", "Infrastructure", "Encryption"],
    helperTips: [
      "Reference the AWS Shared Responsibility Model to split duties cleanly.",
      "State that AWS is responsible for security 'OF' the cloud (hardware, physical data centers, hypervisor).",
      "State that the customer is responsible for security 'IN' the cloud (patching the Guest OS, firewalls, and data encryption).",
      "Mention AWS Artifact to download compliance and security audit reports."
    ],
    optimalResponseStructure: "Reference the AWS Shared Responsibility Model explicitly. Clarify that AWS secures 'OF' the cloud—shielding hardware, hypervisors, global infrastructure, and physical vaults. Explain that the client owns security 'IN' the cloud—meaning they must patch the Guest OS, manage application firewalls, set up KMS Encryption, and govern IAM permissions. Point them to AWS Artifact for compliance validation reports."
  },
  {
    id: "sc-8",
    title: "The Secure Multi-Tier VPC Layout",
    domain: "Security & Compliance",
    difficulty: "Advanced",
    question: "We are building an enterprise billing application that must run behind virtual machines. The app server must access the internet for updates, but the database must never be exposed directly to the outside world. How do you design a secure multi-tier virtual network to satisfy these rules?",
    requiredKeywords: ["VPC", "Private Subnet", "NAT Gateway", "Internet Gateway", "Network ACL"],
    helperTips: [
      "Design an isolated Amazon Virtual Private Cloud (VPC) spanning multiple Availability Zones.",
      "Deploy public subnets for the load balancers and NAT Gateways.",
      "Deploy private subnets for the application servers and database engines.",
      "Configure an Internet Gateway for public ingress, a NAT Gateway to allow private subnet internet egress, and Network ACLs as subnet boundaries."
    ],
    optimalResponseStructure: "Begin by provisioning an Amazon VPC (Virtual Private Cloud). Segment the VPC into Public Subnets (facing the Internet Gateway) and Private Subnets. Place the public-facing Load Balancer in the public subnet, and the app VMs and database in isolated private subnets. Route private subnet internet outbound traffic through a secure NAT Gateway. Enforce subnet boundaries utilizing stateless Network ACLs and stateful Security Groups."
  }
];

const VOCAB_DEFINITIONS: Record<string, string> = {
  "Aurora": "Amazon Aurora: A high-performance, fully managed relational database engine compatible with MySQL and PostgreSQL.",
  "Multi-AZ": "Multi-AZ Deployment: Provisioning redundant database replicas in a different Availability Zone for automatic failover and high availability.",
  "Read Replicas": "Read Replicas: Secondary database instances used to offload read traffic from the primary database node, boosting query performance.",
  "ElastiCache": "Amazon ElastiCache: A fully managed, in-memory caching service (supporting Redis/Memcached) to accelerate database response times.",
  "Auto Scaling": "AWS Auto Scaling: Automatically adjusting compute capacity (like EC2 instances) up or down based on real-time traffic demand.",
  "IAM Role": "IAM Role: An identity with permission policies that can be assumed by AWS services (e.g. EC2) instead of using hardcoded long-term keys.",
  "Least Privilege": "Principle of Least Privilege: Giving users or services only the minimum necessary permissions required to perform their specific task.",
  "IAM Policy": "IAM Policy: A JSON document defining permissions (allow/deny actions) that is attached to IAM Users, Groups, or Roles.",
  "Access Keys": "Access Keys: Long-term credentials (Access Key ID and Secret Access Key) that should NEVER be hardcoded or checked into source code.",
  "Temporary Credentials": "Temporary Credentials: Short-lived credentials provided by AWS Security Token Service (STS) or IAM Roles that rotate automatically.",
  "Warm Standby": "Warm Standby: A disaster recovery strategy where a scaled-down but fully functional copy of the environment runs continuously in another region.",
  "Pilot Light": "Pilot Light: A DR strategy where core database/storage structures run in a secondary region, but application servers remain offline until failover.",
  "Multi-Region": "Multi-Region Architecture: Deploying applications across separate geographical AWS regions to guarantee survival of catastrophic regional outages.",
  "Route 53 Failover": "Route 53 Failover Routing: DNS-level routing that automatically redirects user traffic to a backup environment when primary health checks fail.",
  "Global Database": "Amazon Aurora Global Database: Supports sub-second database replication across multiple global AWS regions for disaster recovery.",
  "Cost Explorer": "AWS Cost Explorer: A tool to visualize, analyze, and forecast historical and current AWS resource costs and usage trends.",
  "AWS Budgets": "AWS Budgets: A tool to set custom spending limits and trigger proactive email or SMS alerts when costs exceed defined thresholds.",
  "Savings Plans": "AWS Savings Plans: A flexible pricing model that offers low rates in exchange for a commitment to a consistent amount of usage.",
  "Spot Instances": "Amazon EC2 Spot Instances: Unused EC2 capacity available at up to 90% discount, suitable for fault-tolerant, flexible workloads.",
  "Instance Scheduler": "AWS Instance Scheduler: An automated solution that starts and stops EC2 or RDS instances on a defined custom calendar schedule.",
  "WAF": "AWS WAF: Web Application Firewall that shields web apps from common exploits, SQL injections, cross-site scripting, and malicious scraping bots.",
  "Shield Advanced": "AWS Shield Advanced: A managed service providing comprehensive DDoS protection, specialized health-based routing, and 24/7 DRT support.",
  "CloudFront": "Amazon CloudFront: A global Content Delivery Network (CDN) that delivers static and dynamic web content with low latency.",
  "Security Groups": "Security Groups: Stateful virtual firewalls that control inbound and outbound traffic at the individual instance/resource level.",
  "Route 53": "Amazon Route 53: A highly available and scalable Domain Name System (DNS) web service with health checking and advanced routing capabilities.",
  "Lambda": "AWS Lambda: Serverless compute service that runs code in response to events and automatically manages the underlying resources.",
  "API Gateway": "Amazon API Gateway: A fully managed service that makes it easy for developers to create, publish, maintain, and secure APIs at any scale.",
  "DynamoDB": "Amazon DynamoDB: A fully managed, serverless, high-throughput NoSQL database service that provides single-digit millisecond latency.",
  "S3": "Amazon Simple Storage Service: Scalable, secure object storage service widely used for backups, files, and hosting static website code.",
  "CloudWatch": "Amazon CloudWatch: A monitoring and observability service providing logs, metrics, alerts, and real-time dashboard views of AWS resources.",
  "Shared Responsibility": "Shared Responsibility Model: AWS is responsible for security 'OF' the cloud (hardware/global infrastructure); customers secure 'IN' the cloud.",
  "AWS Artifact": "AWS Artifact: A self-service portal providing on-demand access to AWS security and compliance reports and select online agreements.",
  "Guest OS": "Guest Operating System: The OS running inside a virtual machine (like EC2). Under the Shared Responsibility Model, the customer must patch it.",
  "Infrastructure": "Physical/Global Infrastructure: AWS's regions, availability zones, and edge locations. AWS is 100% responsible for securing these physical centers.",
  "Encryption": "Data Encryption: Securing data at rest or in transit. The customer is responsible for configuring KMS, TLS, and client-side encryption.",
  "VPC": "Amazon VPC: A logically isolated virtual network where you launch AWS resources, enabling customized IP ranges, subnets, and route tables.",
  "Private Subnet": "Private Subnet: A subnet within a VPC that does NOT have a route to an Internet Gateway; resources inside cannot be reached from the internet.",
  "NAT Gateway": "NAT Gateway: Network Address Translation gateway allowing resources in private subnets to send outbound internet traffic while blocking inbound connections.",
  "Internet Gateway": "Internet Gateway: VPC component allowing communication between public subnets and the internet, enabling public IP traffic routing.",
  "Network ACL": "Network Access Control List: An optional, stateless layer of security for subnets that acts as a firewall for controlling packet ingress and egress."
};

const INITIAL_ROADMAP_ITEMS = [
  {
    id: "rm-1",
    phase: "Phase 1: Core Fundamentals",
    title: "AWS Cloud Concepts & Economics",
    description: "Learn the Cloud value proposition, Shared Responsibility boundaries, and the six pillars of the AWS Well-Architected Framework.",
    targetHours: "6 Hours",
    completed: true,
    resources: ["AWS Cloud Practitioner Essentials digital course", "Pillars of Well-Architected PDF"]
  },
  {
    id: "rm-2",
    phase: "Phase 1: Core Fundamentals",
    title: "Core Services: Compute & Network",
    description: "Understand virtual servers (EC2), auto-scaling containers (ECS/Fargate), and building isolated secure subnets (VPC).",
    targetHours: "8 Hours",
    completed: true,
    resources: ["Hands-on lab: Launch a free-tier EC2 instance", "VPC architectural cheat sheet"]
  },
  {
    id: "rm-3",
    phase: "Phase 2: Data & Threat Management",
    title: "AWS Storage Ecosystem & Glacier",
    description: "Differentiate block storage (EBS) from network file storage (EFS), object store (S3), and cold archival tiers.",
    targetHours: "5 Hours",
    completed: false,
    resources: ["S3 Lifecycle Rules configurations", "Glacier retrieval speed comparison guide"]
  },
  {
    id: "rm-4",
    phase: "Phase 2: Data & Threat Management",
    title: "Identity & Parameter Security",
    description: "Build IAM Policies, attach Roles to instances, and use KMS for envelope data encryption.",
    targetHours: "7 Hours",
    completed: false,
    resources: ["IAM Policy Simulator training", "Principle of Least Privilege documentation"]
  },
  {
    id: "rm-5",
    phase: "Phase 3: Cost & Mastery",
    title: "Financial Governance & Billing",
    description: "Configure AWS Budgets alerts, review Cost Explorer forecasting, and understand Support tiers (Developer vs. Enterprise).",
    targetHours: "4 Hours",
    completed: false,
    resources: ["AWS Cost Anomaly Detection setup guide", "AWS Support plan matrix summary"]
  },
  {
    id: "rm-6",
    phase: "Phase 3: Cost & Mastery",
    title: "Exam Trick Simulator & Speed Drills",
    description: "Run 65 targeted practitioner trick questions repeatedly to recognize linguistic distractors and trap keywords.",
    targetHours: "5 Hours",
    completed: false,
    resources: ["Active recall practice inside our Companion app", "65-question randomized practice sets"]
  }
];

interface TechnicalInterviewSimulatorProps {
  user?: any;
  aiModelMode?: "fast" | "expert";
}

export const TechnicalInterviewSimulator: React.FC<TechnicalInterviewSimulatorProps> = ({ user, aiModelMode = "expert" }) => {
  const [activeSubTab, setActiveSubTab] = useState<"interview" | "roadmap">("interview");
  
  // Interview Simulator States
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer>(INTERVIEWERS[0]);
  const [selectedScenario, setSelectedScenario] = useState<InterviewScenario>(SCENARIOS[0]);
  const [userResponse, setUserResponse] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);

  // Interactive Boardroom States
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);
  const [difficultyMode, setDifficultyMode] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [interviewFormat, setInterviewFormat] = useState<"single" | "panel">("single");
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState<number>(0);
  const [sessionScenarios, setSessionScenarios] = useState<InterviewScenario[]>([]);
  const [sessionScorecards, setSessionScorecards] = useState<ScorecardResult[]>([]);
  const [sessionTranscripts, setSessionTranscripts] = useState<string[]>([]);
  const [hintsLeft, setHintsLeft] = useState<number>(1);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);
  const [sessionTimer, setSessionTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Timer simulation
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Roadmap State persistence via Firestore or localStorage
  const [roadmapItems, setRoadmapItems] = useState(() => {
    return INITIAL_ROADMAP_ITEMS;
  });

  useEffect(() => {
    if (user) {
      getRoadmapFromCloud().then((items) => {
        if (items) {
          setRoadmapItems(items);
        } else {
          setRoadmapItems(INITIAL_ROADMAP_ITEMS);
        }
      }).catch((e) => {
        console.error("Failed to load roadmap:", e);
        setRoadmapItems(INITIAL_ROADMAP_ITEMS);
      });
    } else {
      const saved = localStorage.getItem("aws_roadmap_items_v1");
      if (saved) {
        try { setRoadmapItems(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, [user]);

  const handleSaveSession = async () => {
    if (!auth.currentUser || !scorecard) return;
    setIsSavingSession(true);
    try {
      const sessionId = `session-${Date.now()}`;
      await saveInterviewSessionToCloud(auth.currentUser.uid, sessionId, {
        scenarioId: selectedScenario.id,
        transcript: userResponse,
        scorecard,
        createdAt: new Date().toISOString()
      });
      setSessionSaved(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingSession(false);
    }
  };

  const toggleRoadmapItem = async (id: string) => {
    const newItems = roadmapItems.map((item: any) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setRoadmapItems(newItems);
    
    if (user) {
      await saveRoadmapToCloud(newItems);
    } else {
      localStorage.setItem("aws_roadmap_items_v1", JSON.stringify(newItems));
    }
  };

  const resetInterviewState = () => {
    setUserResponse("");
    setHasSubmitted(false);
    setScorecard(null);
    setShowHints(false);
    setSessionSaved(false);
  };

  const handleSuggestPhrase = (phrase: string) => {
    setUserResponse((prev) => (prev ? prev + " " + phrase : phrase));
  };

  // Simulating Voice Recording Drafts for all 8 Scenarios
  const handleSimulateVoiceInput = () => {
    setIsRecording(true);
    
    const mockSpeeches: Record<string, string> = {
      "sc-1": "To resolve these heavy database scaling bottlenecks, I would migrate our database to Amazon Aurora, which is a modern, high-performance cloud-native relational engine. I would deploy it as a Multi-AZ architecture to guarantee automated failover and maximize high availability. To scale high-read volumes, I'd spin up multiple Aurora Read Replicas and route read-only query streams to them. Finally, I will place an Amazon ElastiCache cluster in front of the database to store and cache heavy query results in memory.",
      "sc-2": "I would strictly reject hardcoding keys on virtual machines as it creates critical security risks. Instead, I will build and attach an IAM Role directly to the EC2 instance (using instance profiles). I will construct an IAM Policy that adheres to the Principle of Least Privilege, specifically granting read permission for S3 and write actions for SQS. This ensures AWS yields safe temporary credentials that rotate automatically.",
      "sc-3": "For a secure multi-region disaster recovery strategy with a strict RTO of 15 minutes, we must configure a Warm Standby in a secondary AWS Region. We can route our user traffic dynamically via Amazon Route 53 Failover routing based on active health checks. To guarantee database recovery within our 10-minute RPO, we will deploy an Amazon Aurora Global Database with sub-second replication times.",
      "sc-4": "To analyze our high development costs, I would open AWS Cost Explorer to visualize where spending spikes are happening. I'd configure proactive AWS Budgets with active threshold notifications. To stop instances over weekends, I'll deploy the AWS Instance Scheduler. For temporary dev containers, we can transition to Spot Instances to save up to 90% and use Savings Plans to cover continuous production workloads.",
      "sc-5": "To protect our system, I would deploy Amazon CloudFront at the outer edge to cache content globally. I'll subscribe to AWS Shield Advanced for dedicated Layer 3/4 protection. I'll configure AWS WAF rules on CloudFront to block crawler bots and common exploits. Finally, I will adjust VPC Security Groups to ensure backend web servers accept traffic only from our CloudFront proxies.",
      "sc-6": "To build a serverless microservice, I would expose our public endpoints via Amazon API Gateway, which handles routing and throttling. I will run the application code inside AWS Lambda functions for stateless serverless compute. For storage, I will write persistent data to Amazon DynamoDB for millisecond-scale NoSQL lookups. Finally, I'll store static files in S3 and monitor performance metrics using Amazon CloudWatch.",
      "sc-7": "Under the Shared Responsibility Model, AWS manages security OF the cloud, including physical data centers and hypervisor infrastructure. The customer is responsible for security IN the cloud, which includes patching the Guest OS, setting up local firewalls, and managing customer data Encryption. We can download official compliance documents from AWS Artifact.",
      "sc-8": "To design this network, I will provision an Amazon VPC and segment it into Public Subnets and Private Subnets. I'll place our load balancer in the public subnet connected to an Internet Gateway. The application servers and databases will go in private subnets, using a NAT Gateway to permit secure outbound internet traffic for patches. Subnet boundaries will be protected using stateless Network ACLs and stateful Security Groups."
    };

    setTimeout(() => {
      setIsRecording(false);
      const relevantSpeech = mockSpeeches[selectedScenario.id] || mockSpeeches["sc-1"];
      setUserResponse(relevantSpeech);
    }, 1500);
  };

  // Boardroom Lifecycle Managers
  const startInterviewSession = (format: "single" | "panel", diff: "Easy" | "Medium" | "Hard", startingScenario: InterviewScenario) => {
    setCameraLoading(true);
    setInterviewFormat(format);
    setDifficultyMode(diff);
    setHintsLeft(diff === "Easy" ? 3 : diff === "Medium" ? 1 : 0);
    setSessionTimer(0);
    setIsSessionFinished(false);
    setSessionScorecards([]);
    setSessionTranscripts([]);
    
    if (format === "panel") {
      // Create a 3-question session where the first is the starting scenario
      const others = SCENARIOS.filter(s => s.id !== startingScenario.id);
      const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
      const chosen = [startingScenario, shuffledOthers[0], shuffledOthers[1]];
      setSessionScenarios(chosen);
      setCurrentScenarioIndex(0);
      setSelectedScenario(chosen[0]);
    } else {
      setSessionScenarios([startingScenario]);
      setCurrentScenarioIndex(0);
      setSelectedScenario(startingScenario);
    }

    setTimeout(() => {
      setCameraLoading(false);
      setIsInterviewActive(true);
      setIsTimerRunning(true);
      resetInterviewState();
    }, 1500);
  };

  const advanceSessionQuestion = () => {
    if (scorecard) {
      setSessionScorecards(prev => [...prev, scorecard]);
      setSessionTranscripts(prev => [...prev, userResponse]);
    }
    
    const nextIndex = currentScenarioIndex + 1;
    if (nextIndex < sessionScenarios.length) {
      setCurrentScenarioIndex(nextIndex);
      setSelectedScenario(sessionScenarios[nextIndex]);
      resetInterviewState();
      setHintsLeft(difficultyMode === "Easy" ? 3 : difficultyMode === "Medium" ? 1 : 0);
    } else {
      setIsTimerRunning(false);
      setIsSessionFinished(true);
    }
  };

  const exitInterviewSession = () => {
    setIsInterviewActive(false);
    setIsSessionFinished(false);
    setIsTimerRunning(false);
    resetInterviewState();
  };

  const [isEvaluating, setIsEvaluating] = useState(false);

  // Hone-style keyword matching and scorecard evaluation engine
  const handleEvaluateResponse = async () => {
    if (!userResponse.trim()) {
      alert("Please enter a response first.");
      return;
    }

    const apiKey = localStorage.getItem("aws_professor_api_key");
    if (!apiKey) {
      alert("Please configure your Gemini API Key in the Interactive Professor tab to unlock AI-powered interview grading. Using fallback matching logic for now.");
      fallbackEvaluateResponse();
      return;
    }

    setIsEvaluating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert AWS technical interviewer: ${selectedInterviewer.name}, a ${selectedInterviewer.role}.
Tone: ${selectedInterviewer.tone}
Scenario: ${selectedScenario.question}
Expected Keywords: ${selectedScenario.requiredKeywords.join(", ")}
Chosen Difficulty Mode: ${difficultyMode}

Evaluate the user's response based on the chosen difficulty level:
- If difficulty is Easy: provide highly encouraging, supportive feedback and grade slightly more leniency in scores.
- If difficulty is Hard: act as a highly critical, rigorous executive architect. Deduct points severely if they miss any of the expected key words/phrases or fail to structure their explanation according to Well-Architected guidelines.

User Response:
"${userResponse}"

Evaluate the user's response. Provide deep Socratic architectural analysis. Grade them strictly out of 100 on AWS architecture correctness, security, best practices, and communication.
`;

      const response = await ai.models.generateContent({
        model: aiModelMode === "fast" ? "gemini-2.5-flash" : "gemini-1.5-pro",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite, strict AWS solutions architect evaluating a candidate. Be extremely precise and provide deep Socratic architectural analysis rather than generic responses. Output strictly as JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              matchPercent: { type: "integer", description: "Overall score out of 100" },
              grade: { type: "string", enum: ["Exemplary", "Proficient", "Developing", "Needs Review"] },
              foundKeywords: { type: "array", items: { type: "string" } },
              missingKeywords: { type: "array", items: { type: "string" } },
              interviewerFeedback: { type: "string", description: "Deep Socratic architectural analysis and feedback from the interviewer persona" },
              rubricScores: {
                type: "object",
                properties: {
                  accuracy: { type: "integer" },
                  communication: { type: "integer" },
                  bestPractices: { type: "integer" },
                  businessValue: { type: "integer" }
                },
                required: ["accuracy", "communication", "bestPractices", "businessValue"]
              }
            },
            required: ["matchPercent", "grade", "foundKeywords", "missingKeywords", "interviewerFeedback", "rubricScores"]
          }
        }
      });

      const text = response.text || "";
      const result = JSON.parse(text) as ScorecardResult;
      setScorecard(result);
      setHasSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to reach Gemini API. Using fallback grading.");
      fallbackEvaluateResponse();
    } finally {
      setIsEvaluating(false);
    }
  };

  const fallbackEvaluateResponse = () => {
    const responseLower = userResponse.toLowerCase();
    const foundKeywords = selectedScenario.requiredKeywords.filter((kw) =>
      responseLower.includes(kw.toLowerCase())
    );
    const missingKeywords = selectedScenario.requiredKeywords.filter(
      (kw) => !responseLower.includes(kw.toLowerCase())
    );

    let matchPercent = Math.round(
      (foundKeywords.length / selectedScenario.requiredKeywords.length) * 100
    );

    // Dynamic scale based on chosen difficulty
    if (difficultyMode === "Easy") {
      matchPercent = Math.min(100, matchPercent + 15); // +15% lenient bonus for beginners
    } else if (difficultyMode === "Hard") {
      if (missingKeywords.length > 0) {
        matchPercent = Math.max(0, matchPercent - 15); // -15% strict deduction for missing key terms
      }
    }

    // Calculate score rubrics
    let accuracy = Math.min(100, Math.max(30, matchPercent + (difficultyMode === "Easy" ? 10 : difficultyMode === "Hard" ? -5 : 5)));
    let communication = Math.min(100, userResponse.length > 150 ? 95 : userResponse.length > 70 ? 75 : 50);
    if (difficultyMode === "Easy") communication = Math.min(100, communication + 10);
    
    let bestPractices = matchPercent >= 80 ? 98 : matchPercent >= 50 ? 80 : 55;
    let businessValue = responseLower.includes("cost") || responseLower.includes("down") || responseLower.includes("failover") || responseLower.includes("temporary") || responseLower.includes("serverless") ? 92 : 65;

    // Grades
    let grade: "Exemplary" | "Proficient" | "Developing" | "Needs Review" = "Needs Review";
    if (matchPercent >= 85) grade = "Exemplary";
    else if (matchPercent >= 65) grade = "Proficient";
    else if (matchPercent >= 45) grade = "Developing";

    // Persona-based custom interviewer feedback text
    let feedback = "";
    if (selectedInterviewer.id === "int-1") {
      feedback = `${difficultyMode === "Easy" ? "Splendid attempt!" : "Evaluation finalized."} You scored a ${matchPercent}% match on core architectural vocabulary. ${
        matchPercent >= 80 
          ? "Your response directly aligns with the Reliability and Security pillars of the AWS Well-Architected Framework. I liked how you layered your services."
          : `We need to flesh out your services. You missed important aspects like: ${missingKeywords.join(", ")}. Study our AWS structural guides to strengthen this response.`
      }`;
    } else if (selectedInterviewer.id === "int-2") {
      feedback = `Security review complete. Rubric check: ${matchPercent}%. ${
        responseLower.includes("least privilege") || responseLower.includes("role")
          ? "I am highly satisfied to hear you advocate for Roles and Least Privilege. Removing hardcoded Access Keys is non-negotiable."
          : "Your solution has safety vulnerabilities. Ensure you highlight IAM Roles and avoid any hardcoded access credentials."
      }`;
    } else {
      feedback = `Let's talk cost and impact. Match rating: ${matchPercent}%. ${
        responseLower.includes("spot") || responseLower.includes("budget") || responseLower.includes("savings") || responseLower.includes("serverless")
          ? "Splendid work highlighting financial guardrails. Cost optimization requires combining on-demand scheduling with spot instances."
          : "This proposal looks expensive. Ensure you propose Spot Instances or automated instance scheduling rules to contain waste."
      }`;
    }

    setScorecard({
      matchPercent,
      grade,
      foundKeywords,
      missingKeywords,
      interviewerFeedback: feedback,
      rubricScores: {
        accuracy,
        communication,
        bestPractices,
        businessValue
      }
    });
    setHasSubmitted(true);
  };

  const totalRoadmapCount = roadmapItems.length;
  const completedRoadmapCount = roadmapItems.filter((i: any) => i.completed).length;
  const roadmapPercent = Math.round((completedRoadmapCount / totalRoadmapCount) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#FF9900]" />
            HONE Interview Simulator & Roadmap
          </h2>
          <p className="text-xs text-slate-500">
            Hone your communication skills, solve real architectural scenarios, and manage your custom certification master roadmap.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab("interview")}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "interview" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Interview Practice Stage
          </button>
          <button
            onClick={() => setActiveSubTab("roadmap")}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "roadmap" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Certification Master Roadmap
          </button>
        </div>
      </div>

      {activeSubTab === "interview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interview Stage and Drafting response (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Video Simulation Box */}
            <div className="bg-slate-900 rounded-sm border border-slate-800 shadow-lg relative min-h-[460px] sm:min-h-[500px] flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80 pointer-events-none"></div>
              
              {/* Simulated Lens Focus Brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700 pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700 pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700 pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700 pointer-events-none"></div>

              {/* Header inside the video pane */}
              <div className="flex justify-between items-center z-10">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600/90 text-white font-mono text-[9px] font-extrabold rounded-sm uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                  Recruiter Live Cam
                </span>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xs border border-slate-800/80 text-[8px] font-mono text-emerald-400">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>HD 1080P • FEED SECURE</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded-xs font-mono">
                    Codec: H.264 • 60fps
                  </span>
                </div>
              </div>

              {/* Centered Avatar and Name of interviewer */}
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 z-10 text-center space-y-4">
                <div className="relative">
                  {/* Glowing webcam outer active ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF9900]/20 to-blue-500/20 blur-md animate-pulse"></div>
                  
                  <div className={`w-24 h-24 ${selectedInterviewer.avatarBg} rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-slate-800 ring-4 ring-[#FF9900]/20 relative z-10`}>
                    {selectedInterviewer.emoji}
                    {isRecording && (
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FF9900] text-slate-900 rounded-full flex items-center justify-center animate-bounce font-bold border-2 border-slate-900 shadow-md">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  
                  {/* Webcam On LED dot */}
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 z-20" title="Webcam sensor online" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-base tracking-tight flex items-center justify-center gap-1.5">
                    {selectedInterviewer.name}
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-[2px] uppercase font-black tracking-wider">
                      Interviewer
                    </span>
                  </h3>
                  <p className="text-[#FF9900] text-xs font-black uppercase tracking-widest">{selectedInterviewer.role}</p>
                  
                  <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400 font-mono">
                    <span>Focus: <span className="text-slate-200 font-bold">{selectedInterviewer.focusArea}</span></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block"></span>
                      Active Session
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Interviewer Speech Prompt */}
              <div className="bg-slate-950/95 border border-slate-800 p-4 rounded-sm z-10 shadow-xl ring-1 ring-white/5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-xl">💬</span>
                    {/* Live Equalizer indicator */}
                    <div className="flex gap-0.5 items-end h-2 w-5 justify-center">
                      <span className="w-0.5 bg-[#FF9900] rounded-full animate-pulse h-2" />
                      <span className="w-0.5 bg-[#FF9900] rounded-full animate-pulse h-3.5" style={{ animationDelay: "150ms" }} />
                      <span className="w-0.5 bg-[#FF9900] rounded-full animate-pulse h-1.5" style={{ animationDelay: "300ms" }} />
                      <span className="w-0.5 bg-[#FF9900] rounded-full animate-pulse h-2.5" style={{ animationDelay: "450ms" }} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Active Recruiter Question</span>
                      <span className="text-[8px] font-mono text-[#FF9900] uppercase tracking-widest bg-[#FF9900]/10 px-1.5 py-0.5 rounded-[2px] border border-[#FF9900]/20">
                        {selectedScenario.difficulty}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-bold leading-relaxed italic pr-1">
                      "{selectedScenario.question}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Drafting Area */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Formulate Your Architectural Response</h3>
                  <p className="text-xs text-slate-500">Practice stating your solution by drafting below, or click 'Simulate Voice' for a speech sample draft.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateVoiceInput}
                    disabled={isRecording || hasSubmitted}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm border border-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#FF9900]" />
                    {isRecording ? "Simulating Voice..." : "Simulate Voice Answer"}
                  </button>
                  <button
                    onClick={resetInterviewState}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm"
                    title="Reset Response Fields"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Type your structured solution here. Incorporate the core target AWS services (e.g. Aurora, Multi-AZ, Load Balancers, IAM Roles, etc.) to optimize your matching scorecard..."
                className="w-full min-h-[140px] text-xs p-4 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:outline-hidden rounded-sm font-sans leading-relaxed"
                disabled={hasSubmitted}
              />

              {/* Dynamic word tags / helper cheat phrases */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Recommended Vocabulary (Click to append):</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedScenario.requiredKeywords.map((kw) => {
                    const isContained = userResponse.toLowerCase().includes(kw.toLowerCase());
                    return (
                      <button
                        key={kw}
                        onClick={() => handleSuggestPhrase(kw)}
                        disabled={hasSubmitted}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                          isContained 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" 
                            : "bg-slate-100 hover:bg-[#FF9900]/10 hover:border-[#FF9900]/30 text-slate-600"
                        }`}
                      >
                        {isContained ? "✓ " : "+ "} {kw}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hints Feature Section */}
              {!hasSubmitted && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHints ? "Hide Guidance Hints" : "Need a Hint?"}
                  </button>
                  
                  {showHints && (
                    <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-sm space-y-2 animate-fade-in">
                      <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Architectural Hints
                      </span>
                      <ul className="space-y-1.5 pl-1">
                        {selectedScenario.helperTips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-blue-900 flex gap-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span className="leading-snug">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Trigger Row */}
              <div className="flex justify-end pt-2 border-t border-slate-100 gap-3">
                {!hasSubmitted ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEvaluateResponse}
                    disabled={!userResponse.trim() || isEvaluating}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Submit Response for Assessment
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveSession}
                      disabled={isSavingSession || sessionSaved}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingSession ? "Saving..." : sessionSaved ? "Saved!" : "Save Session"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetInterviewState}
                      className="px-5 py-2.5 bg-[#FF9900] hover:bg-amber-600 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,153,0,0.3)] hover:shadow-[0_0_15px_rgba(255,153,0,0.4)]"
                    >
                      Retry Active Scenario
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Scorecard Assessment Results (Only when submitted) */}
            {hasSubmitted && scorecard && (
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-md space-y-6 animate-fade-in">
                
                {/* Result Title Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-sm bg-slate-900 flex items-center justify-center font-bold text-[#FF9900] text-xl">
                      {scorecard.matchPercent}%
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">Technical Interview Score</span>
                      <h4 className="font-extrabold text-slate-800 text-base">Grade: {scorecard.grade}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assessment Status:</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 px-3 py-1 rounded-sm uppercase tracking-wide">
                      Review Completed
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics grids */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Architecture Accuracy</span>
                    <span className="text-base font-black text-slate-800">{scorecard.rubricScores.accuracy}/100</span>
                    <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${scorecard.rubricScores.accuracy}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Communication Clarity</span>
                    <span className="text-base font-black text-slate-800">{scorecard.rubricScores.communication}/100</span>
                    <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#FF9900] h-full" style={{ width: `${scorecard.rubricScores.communication}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">AWS Best Practices</span>
                    <span className="text-base font-black text-slate-800">{scorecard.rubricScores.bestPractices}/100</span>
                    <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${scorecard.rubricScores.bestPractices}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">FinOps & Business Value</span>
                    <span className="text-base font-black text-slate-800">{scorecard.rubricScores.businessValue}/100</span>
                    <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full" style={{ width: `${scorecard.rubricScores.businessValue}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Scorecard details layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      Audited Keyword Scorecard
                    </h5>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Identified Services/Terms:</span>
                        {scorecard.foundKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {scorecard.foundKeywords.map((kw) => (
                              <span key={kw} className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic block">No target AWS terms were identified.</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Recommended Missing Terms:</span>
                        {scorecard.missingKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {scorecard.missingKeywords.map((kw) => (
                              <span key={kw} className="bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[9px] px-2 py-0.5 rounded-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold block">✓ Excellent! Perfect core vocabulary match.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF9900]" />
                      Interviewer's Executive Feedback
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{scorecard.interviewerFeedback}"
                    </p>
                  </div>
                </div>

                {/* Perfect structure guide */}
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-sm space-y-1.5">
                  <h5 className="font-extrabold text-xs text-orange-900 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                    Optimal Solution Framework
                  </h5>
                  <p className="text-xs text-orange-800 leading-relaxed">
                    {selectedScenario.optimalResponseStructure}
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Scenario & Interviewer Selection Sidebar (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Active Interviewer Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Interviewer Selector</h3>
              <div className="space-y-2">
                {INTERVIEWERS.map((interviewer) => {
                  const isSelected = selectedInterviewer.id === interviewer.id;
                  return (
                    <button
                      key={interviewer.id}
                      onClick={() => {
                        setSelectedInterviewer(interviewer);
                        resetInterviewState();
                      }}
                      className={`w-full p-3 rounded-sm border text-left flex items-start gap-3 transition-all ${
                        isSelected 
                          ? "border-slate-800 bg-slate-50 shadow-xs" 
                          : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{interviewer.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{interviewer.name}</h4>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900]" />}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-tight mb-1">{interviewer.role}</p>
                        <p className="text-[9px] text-slate-400 leading-normal line-clamp-1">{interviewer.focusArea}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenario Navigator Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Scenario Selector</h3>
                <span className="text-[9px] font-mono font-bold bg-[#FF9900]/10 text-[#FF9900] px-2 py-0.5 border border-[#FF9900]/20 rounded-sm">
                  {SCENARIOS.length} Scenarios
                </span>
              </div>

              <div className="space-y-2">
                {SCENARIOS.map((scenario) => {
                  const isSelected = selectedScenario.id === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        resetInterviewState();
                      }}
                      className={`w-full p-3 rounded-sm border text-left space-y-1.5 transition-all ${
                        isSelected 
                          ? "border-[#FF9900] bg-amber-50/50 shadow-xs" 
                          : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                          {scenario.domain}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 rounded-xs tracking-wider border ${
                          scenario.difficulty === "Beginner" 
                            ? "bg-slate-50 border-slate-200 text-slate-600" 
                            : scenario.difficulty === "Intermediate"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-purple-50 border-purple-200 text-purple-700"
                        }`}>
                          {scenario.difficulty}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-800 text-xs leading-tight">
                        {scenario.title}
                      </h4>

                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                        {scenario.question}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Certification master roadmap view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Main Roadmaps (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Progress Gauge Container */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-sm border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <span className="text-[9px] uppercase font-black text-[#FF9900] tracking-widest block">Study Certification Tracker</span>
                <h3 className="font-extrabold text-lg tracking-tight">Your Custom AWS CLF-C02 Masterplan</h3>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  Toggle milestones as you progress. Master all three core phases to reach 100% cloud practitioner examination readiness.
                </p>
              </div>

              {/* Graphical Circular Percent Indicator */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="34" className="stroke-slate-700 fill-none" strokeWidth="6" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      className="stroke-[#FF9900] fill-none transition-all duration-500" 
                      strokeWidth="6" 
                      strokeDasharray="213.6" 
                      strokeDashoffset={213.6 - (213.6 * roadmapPercent) / 100} 
                    />
                  </svg>
                  <span className="absolute font-black text-sm text-slate-100">{roadmapPercent}%</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Milestones Mastered</span>
                  <span className="text-xl font-extrabold text-[#FF9900]">{completedRoadmapCount} of {totalRoadmapCount}</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step interactive roadmap milestones */}
            <div className="space-y-4">
              {roadmapItems.map((item: any, idx: number) => (
                <div 
                  key={item.id} 
                  className={`bg-white border p-5 rounded-sm shadow-xs transition-all flex items-start gap-4 ${
                    item.completed 
                      ? "border-emerald-200 bg-emerald-50/10" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Custom Checklist Button */}
                  <button
                    onClick={() => toggleRoadmapItem(item.id)}
                    className={`w-5 h-5 rounded-sm border shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                      item.completed 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-300 bg-white text-transparent hover:border-slate-500"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </button>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-[#FF9900] font-mono tracking-wider">
                          {item.phase}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est: {item.targetHours}
                        </span>
                      </div>
                      
                      {item.completed && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-sm uppercase tracking-wide border border-emerald-200 w-fit self-start sm:self-center">
                          Completed
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className={`text-sm font-bold text-slate-800 ${item.completed ? "line-through text-slate-400" : ""}`}>
                        {idx + 1}. {item.title}
                      </h4>
                      <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${item.completed ? "text-slate-400" : ""}`}>
                        {item.description}
                      </p>
                    </div>

                    {/* Resources */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[9px] uppercase text-slate-400 font-black tracking-wider block mb-1">Recommended Resources:</span>
                      <div className="flex flex-col space-y-1">
                        {item.resources.map((res: string) => (
                          <div key={res} className="text-[10px] text-slate-600 flex items-center gap-1.5 font-sans">
                            <span className="text-[#FF9900]">▶</span>
                            <span>{res}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Study Stats & Support Tiers (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Proactive Cheat Sheet Widget */}
            <div className="bg-slate-900 text-white p-5 rounded-sm shadow-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-[#FF9900] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                AWS Practitioner Guide Checklists
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Passing the AWS CLF-C02 exam requires sharp differentiation between similar services. Keep this core logic close:
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase">✔ Stateful vs Stateless Firewalls</span>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Security Groups are **Stateful** (automatically allows outbound traffic). Network ACLs are **Stateless** (explicit outbound rules required).
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase">✔ Budgets vs Cost Explorer</span>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Budgets are **Proactive** (limits, emails, alarms). Cost Explorer is **Retrospective** (graphs, visual patterns, future projections).
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase">✔ Developer vs Business Support</span>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Developer Plan includes **Email Access** within 24 business hours. Business Plan includes **24/7 Phone/Chat/Email** and 1-hour response times.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick tips for the interview */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Hone Preparation Advice</h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="text-[#FF9900] font-bold">1.</span>
                  <span className="leading-snug"><strong>Always lead with the customer value.</strong> Explain why high availability or encryption protects trust and limits liabilities.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF9900] font-bold">2.</span>
                  <span className="leading-snug"><strong>Name exact services.</strong> Don't just say 'caching service' — explicitly say <em>Amazon ElastiCache</em> or <em>Amazon CloudFront</em>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF9900] font-bold">3.</span>
                  <span className="leading-snug"><strong>Reference the Well-Architected Pillars.</strong> Incorporate references to 'Security', 'Cost Optimization', and 'Reliability' frequently.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
