import React, { useState, useEffect } from "react";
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
  }
];

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

export const TechnicalInterviewSimulator: React.FC = () => {
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

  // Roadmap State persistence via localStorage
  const [roadmapItems, setRoadmapItems] = useState(() => {
    const saved = localStorage.getItem("aws_roadmap_items_v1");
    return saved ? JSON.parse(saved) : INITIAL_ROADMAP_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem("aws_roadmap_items_v1", JSON.stringify(roadmapItems));
  }, [roadmapItems]);

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

  const toggleRoadmapItem = (id: string) => {
    setRoadmapItems((prev: any[]) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
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

  // Simulating Voice Recording Drafts
  const handleSimulateVoiceInput = () => {
    setIsRecording(true);
    const mockSpeeches = [
      "To resolve these heavy scaling bottlenecks, I would migrate the current relational database to Amazon Aurora for a cloud-native engine. I would deploy a Multi-AZ architecture to support automated failover and maximize high availability. To scale high-read volumes, I'd spin up Aurora Read Replicas and route read queries there. Finally, I will place an Amazon ElastiCache cluster in front of the database to cache heavy query results.",
      "I would strictly reject hardcoding keys on EC2. Instead, I'll build an IAM Role with a custom IAM Policy that adheres to the Principle of Least Privilege, specifically granting read permission for S3 and write for SQS. Applying the IAM Role ensures AWS yields safe temporary credentials automatically.",
      "For a disaster recovery strategy with an RTO of 15 minutes, we must configure a Warm Standby in a secondary AWS Region. We can route our traffic dynamically via Amazon Route 53 Failover routing based on active health checks. To guarantee database recovery within our 10-minute RPO, we will deploy an Amazon Aurora Global Database with sub-second replication times."
    ];

    setTimeout(() => {
      setIsRecording(false);
      // Try to find a speech relevant to the current scenario
      let relevantSpeech = mockSpeeches[0];
      if (selectedScenario.id === "sc-2") relevantSpeech = mockSpeeches[1];
      if (selectedScenario.id === "sc-3") relevantSpeech = mockSpeeches[2];
      
      setUserResponse(relevantSpeech);
    }, 1500);
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

User Response:
"${userResponse}"

Evaluate the user's response to the scenario. Provide deep Socratic architectural analysis. Grade them strictly on AWS architecture correctness, security, best practices, and communication.
`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
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

    const matchPercent = Math.round(
      (foundKeywords.length / selectedScenario.requiredKeywords.length) * 100
    );

    // Calculate score rubrics
    let accuracy = Math.min(100, Math.max(30, matchPercent + 10));
    let communication = Math.min(100, userResponse.length > 150 ? 95 : userResponse.length > 70 ? 75 : 50);
    let bestPractices = matchPercent >= 80 ? 98 : matchPercent >= 50 ? 80 : 55;
    let businessValue = responseLower.includes("cost") || responseLower.includes("down") || responseLower.includes("failover") || responseLower.includes("temporary") ? 92 : 65;

    // Grades
    let grade: "Exemplary" | "Proficient" | "Developing" | "Needs Review" = "Needs Review";
    if (matchPercent >= 80) grade = "Exemplary";
    else if (matchPercent >= 60) grade = "Proficient";
    else if (matchPercent >= 40) grade = "Developing";

    // Persona-based custom interviewer feedback text
    let feedback = "";
    if (selectedInterviewer.id === "int-1") {
      feedback = `Excellent structuring. You scored a ${matchPercent}% match on core services. ${
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
        responseLower.includes("spot") || responseLower.includes("budget") || responseLower.includes("savings")
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
            <div className="bg-slate-900 rounded-sm overflow-hidden border border-slate-800 shadow-lg relative aspect-video flex flex-col justify-between p-6">
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80 pointer-events-none"></div>
              
              {/* Header inside the video pane */}
              <div className="flex justify-between items-start z-10">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600/90 text-white font-mono text-[9px] font-extrabold rounded-sm uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                  Recruiter Live Cam
                </span>
                <span className="text-[10px] text-slate-300 bg-slate-800/80 px-2 py-1 rounded-xs font-mono">
                  Codec: H.264 • 1080p 60fps
                </span>
              </div>

              {/* Centered Avatar and Name of interviewer */}
              <div className="flex flex-col items-center justify-center py-10 z-10 text-center space-y-4">
                <div className={`w-24 h-24 ${selectedInterviewer.avatarBg} rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-slate-800 ring-2 ring-[#FF9900]/30 relative`}>
                  {selectedInterviewer.emoji}
                  {isRecording && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF9900] text-slate-900 text-[10px] rounded-full flex items-center justify-center animate-bounce font-bold">
                      <Mic className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-tight">{selectedInterviewer.name}</h3>
                  <p className="text-[#FF9900] text-xs font-bold uppercase tracking-wider">{selectedInterviewer.role}</p>
                </div>
              </div>

              {/* Bottom Interviewer Speech Prompt */}
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-sm z-10">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">💬</span>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Active Question Prompt</span>
                    <p className="text-xs md:text-sm text-slate-100 font-bold leading-relaxed italic">
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
                  <button
                    onClick={handleEvaluateResponse}
                    disabled={!userResponse.trim() || isEvaluating}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveSession}
                      disabled={isSavingSession || sessionSaved}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingSession ? "Saving..." : sessionSaved ? "Saved!" : "Save Session"}
                    </button>
                    <button
                      onClick={resetInterviewState}
                      className="px-5 py-2.5 bg-[#FF9900] hover:bg-amber-600 text-white text-xs font-bold rounded-sm shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Retry Active Scenario
                      <RefreshCw className="w-4 h-4" />
                    </button>
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
