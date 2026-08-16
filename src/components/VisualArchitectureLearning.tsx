import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Layers, Shield, Cpu, Zap, Server, Database, Globe, Lock, 
  CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Sparkles, 
  ArrowRight, Compass, Flame, Award, ChevronRight, Eye
} from "lucide-react";

interface ArchitectureNode {
  id: string;
  name: string;
  category: "compute" | "storage" | "database" | "networking" | "security";
  icon: string;
  description: string;
  examTip: string;
  securityPillar: string;
  costPillar: string;
  performancePillar: string;
}

interface ArchitectureScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  nodes: ArchitectureNode[];
  challenge: {
    question: string;
    options: { id: string; text: string; correct: boolean; explanation: string }[];
  };
}

const ARCHITECTURE_SCENARIOS: ArchitectureScenario[] = [
  {
    id: "3-tier-vpc",
    title: "Highly Available 3-Tier Web Application VPC",
    subtitle: "Classic Enterprise Web App with ALB, Public/Private Subnets, EC2, and Multi-AZ RDS",
    badge: "SAA-C03 Core",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    description: "Designed for extreme fault tolerance across multiple Availability Zones. Client requests hit Route 53, pass through an Application Load Balancer in public subnets, reach EC2 web/app servers in private subnets, and persist data securely in Multi-AZ Amazon RDS PostgreSQL.",
    nodes: [
      {
        id: "r53",
        name: "Amazon Route 53",
        category: "networking",
        icon: "🌍",
        description: "Global DNS service routing user requests with latency-based and failover routing policies.",
        examTip: "Always use Route 53 for global multi-region routing and health checks.",
        securityPillar: "Supports DNSSEC and DDoS Shield protection.",
        costPillar: "Priced per million queries and managed zones.",
        performancePillar: "Anycast DNS network guarantees sub-30ms global resolution."
      },
      {
        id: "alb",
        name: "Application Load Balancer (ALB)",
        category: "networking",
        icon: "⚖️",
        description: "Distributes incoming HTTP/HTTPS traffic across multiple targets (EC2, ECS, Lambda) in multiple AZs.",
        examTip: "Operates at Layer 7. Perfect for path-based routing (/images vs /api).",
        securityPillar: "Terminates SSL/TLS certificates and integrates with AWS WAF.",
        costPillar: "Hourly charge + Load Balancer Capacity Units (LCU).",
        performancePillar: "Automatically scales to handle sudden traffic spikes."
      },
      {
        id: "ec2-app",
        name: "EC2 Auto Scaling Group (Private)",
        category: "compute",
        icon: "💻",
        description: "Compute fleet running business logic inside private subnets without direct public IPs.",
        examTip: "Private subnets require NAT Gateways to fetch patches or outbound APIs.",
        securityPillar: "Protected behind Security Groups and Network ACLs.",
        costPillar: "Use Reserved Instances or Savings Plans for predictable workloads.",
        performancePillar: "Auto Scaling scales out dynamically based on CPU utilization."
      },
      {
        id: "rds-multi-az",
        name: "Amazon RDS Multi-AZ",
        category: "database",
        icon: "🗄️",
        description: "Relational database with synchronous standby replica in a secondary AZ for automatic failover.",
        examTip: "Multi-AZ is for High Availability; Read Replicas are for Read Scaling.",
        securityPillar: "Encrypted at rest using KMS and in transit via SSL.",
        costPillar: "Doubles storage and compute billing for synchronous standby.",
        performancePillar: "Automatic failover occurs in 60-120 seconds during AZ outage."
      }
    ],
    challenge: {
      question: "If an Availability Zone hosting the primary RDS Multi-AZ database instance suffers an abrupt power failure, what happens?",
      options: [
        { id: "a", text: "Database operations fail permanently until manual administrator intervention.", correct: false, explanation: "Incorrect. Multi-AZ is designed for automated hands-off failover." },
        { id: "b", text: "Amazon RDS automatically promotes the synchronous standby replica in the secondary AZ to primary.", correct: true, explanation: "Correct! RDS automatically switches the DNS record of the DB instance to point to the standby replica." },
        { id: "c", text: "Traffic is immediately routed to an unmanaged EC2 backup instance.", correct: false, explanation: "Incorrect. RDS manages its own standby replication cluster." }
      ]
    }
  },
  {
    id: "serverless-api",
    title: "Serverless Event-Driven API & Data Pipeline",
    subtitle: "Zero-Administration Architecture with API Gateway, AWS Lambda, DynamoDB & SQS",
    badge: "Developer / SAA Favorite",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    description: "Completely serverless architecture requiring zero server provisioning. REST requests arrive at API Gateway, trigger AWS Lambda execution functions, decouple asynchronous workloads via Amazon SQS, and persist records in DynamoDB with single-digit millisecond latency.",
    nodes: [
      {
        id: "apigw",
        name: "Amazon API Gateway",
        category: "networking",
        icon: "🚪",
        description: "Fully managed service making it easy for developers to create, publish, and secure APIs at any scale.",
        examTip: "Supports REST APIs, HTTP APIs, and WebSocket APIs.",
        securityPillar: "Integrates with IAM, Cognito, and Lambda authorizers.",
        costPillar: "Pay only for API calls received and data transferred out.",
        performancePillar: "Built-in caching reduces latency and backend load."
      },
      {
        id: "lambda",
        name: "AWS Lambda",
        category: "compute",
        icon: "⚡",
        description: "Run code without thinking about servers. Automatically scales from a few requests per day to thousands per second.",
        examTip: "Maximum execution timeout is 15 minutes per invocation.",
        securityPillar: "Executes inside secure isolated sandboxes with IAM execution roles.",
        costPillar: "Billed precisely to the nearest millisecond for execution time and memory.",
        performancePillar: "Provisioned concurrency eliminates cold starts for latency-sensitive APIs."
      },
      {
        id: "sqs",
        name: "Amazon SQS (Queue)",
        category: "storage",
        icon: "📬",
        description: "Fully managed message queuing service that decouples microservices and distributed systems.",
        examTip: "Standard queues offer maximum throughput; FIFO queues guarantee exact-once processing.",
        securityPillar: "Client-side and server-side encryption with AWS KMS.",
        costPillar: "First 1 million requests per month are free.",
        performancePillar: "Buffers traffic spikes so backend Lambda functions are never overwhelmed."
      },
      {
        id: "dynamodb",
        name: "Amazon DynamoDB",
        category: "database",
        icon: "⚡",
        description: "Key-value and document database that delivers single-digit millisecond performance at any scale.",
        examTip: "Choose between Provisioned capacity (with Auto Scaling) and On-Demand capacity.",
        securityPillar: "Fine-grained access control using IAM conditions and attribute-based security.",
        costPillar: "Priced by read/write capacity units or storage GB.",
        performancePillar: "Global Tables replicate data across multiple AWS regions in under 1 second."
      }
    ],
    challenge: {
      question: "Your Lambda function experiences intermittent latency spikes when triggered by sudden API Gateway traffic. What is the most cost-effective AWS feature to resolve cold starts?",
      options: [
        { id: "a", text: "Provisioned Concurrency", correct: true, explanation: "Correct! Provisioned Concurrency keeps functions initialized and warm, ready to respond immediately." },
        { id: "b", text: "Increasing Lambda memory allocation to 10GB", correct: false, explanation: "While more memory speeds up execution, it does not prevent cold start initialization delays." },
        { id: "c", text: "Switching from Lambda to EC2 Auto Scaling", correct: false, explanation: "That defeats the serverless zero-admin architecture requirement." }
      ]
    }
  },
  {
    id: "cloudfront-s3",
    title: "Global Content Delivery & Secure S3 Static Hosting",
    subtitle: "Low Latency Edge Distribution with CloudFront, S3 Origin Access Control (OAC), and WAF",
    badge: "Cloud Practitioner Essential",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    description: "Accelerate delivery of static and dynamic web assets globally using AWS Edge locations. CloudFront caches content worldwide while restricting direct S3 bucket access using Origin Access Control (OAC).",
    nodes: [
      {
        id: "cf",
        name: "Amazon CloudFront (CDN)",
        category: "networking",
        icon: "🌐",
        description: "Global Content Delivery Network (CDN) operating across hundreds of Points of Presence (PoPs) worldwide.",
        examTip: "Always use CloudFront with S3 to lower origin load and accelerate static asset delivery.",
        securityPillar: "Integrated with AWS WAF to block SQL injection and malicious IP attacks at the edge.",
        costPillar: "Data transfer out rates are cheaper than standard EC2 bandwidth.",
        performancePillar: "Caches assets close to users, reducing latency from 200ms to <15ms."
      },
      {
        id: "s3-bucket",
        name: "Amazon S3 Bucket",
        category: "storage",
        icon: "🪣",
        description: "Object storage built to store and retrieve any amount of data with 99.999999999% durability.",
        examTip: "S3 buckets have globally unique names and support lifecycle policies for glacier archival.",
        securityPillar: "Block Public Access enabled by default. Only CloudFront OAC is permitted.",
        costPillar: "Standard, Intelligent-Tiering, Glacier Flexible, and Glacier Deep Archive.",
        performancePillar: "Supports thousands of parallel PUT/GET requests per second per prefix."
      },
      {
        id: "waf",
        name: "AWS WAF (Web Firewall)",
        category: "security",
        icon: "🛡️",
        description: "Protects web applications from common web exploits and bots that could affect availability or consume excess resources.",
        examTip: "Can be attached to CloudFront distributions, ALB, and API Gateway.",
        securityPillar: "Inspects HTTP headers, query strings, and URI paths in real time.",
        costPillar: "Priced per web ACL and rules evaluated.",
        performancePillar: "Inspects traffic at the edge before it reaches your origin servers."
      }
    ],
    challenge: {
      question: "How can you ensure users cannot bypass CloudFront and download files directly from the underlying Amazon S3 bucket?",
      options: [
        { id: "a", text: "Make the S3 bucket public and obscure the bucket URL.", correct: false, explanation: "Incorrect. Obscurity is not security; anyone can find the bucket URL." },
        { id: "b", text: "Configure CloudFront Origin Access Control (OAC) and block all public access on the S3 bucket.", correct: true, explanation: "Correct! OAC securely signs requests from CloudFront to S3, keeping the bucket entirely private." },
        { id: "c", text: "Attach an IAM user key inside client browser JavaScript code.", correct: false, explanation: "Dangerous! Never expose AWS credentials in frontend client code." }
      ]
    }
  }
];

export const VisualArchitectureLearning: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(ARCHITECTURE_SCENARIOS[0].id);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(ARCHITECTURE_SCENARIOS[0].nodes[0]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const currentScenario = ARCHITECTURE_SCENARIOS.find(s => s.id === selectedScenarioId) || ARCHITECTURE_SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    const scen = ARCHITECTURE_SCENARIOS.find(s => s.id === id);
    if (scen && scen.nodes.length > 0) {
      setSelectedNode(scen.nodes[0]);
    }
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleAnswerSubmit = (optionId: string) => {
    setSelectedAnswer(optionId);
    setShowExplanation(true);
    const opt = currentScenario.challenge.options.find(o => o.id === optionId);
    if (opt?.correct) {
      setScore(prev => prev + 100);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="visual-architecture-studio">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-sm p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-black px-2 py-0.5 rounded-xs uppercase tracking-widest border border-indigo-500/30 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                AWS Reference Architecture Studio
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Visual Topology & Exam Practice
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Compass className="w-5.5 h-5.5 text-indigo-400" />
              Visual Architecture & Cloud Blueprint Learning
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Explore interactive AWS architecture topologies, inspect security and cost pillars for each cloud service, and test your exam readiness with interactive architectural challenges.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded shadow shrink-0">
            <Award className="w-5 h-5 text-[#FF9900]" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Blueprint XP</span>
              <span className="text-sm font-black text-white font-mono">+{score} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ARCHITECTURE_SCENARIOS.map(scen => (
          <button
            key={scen.id}
            onClick={() => handleSelectScenario(scen.id)}
            className={`p-4 rounded-sm border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
              selectedScenarioId === scen.id
                ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${scen.badgeColor}`}>
                {scen.badge}
              </span>
              {selectedScenarioId === scen.id && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-tight">{scen.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">{scen.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Interactive Diagram & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Top: Interactive Blueprint Topology Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                {currentScenario.title}
              </h3>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">Interactive Nodes: {currentScenario.nodes.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {currentScenario.description}
            </p>
          </div>

          {/* Visual Topology Diagram Flow Nodes */}
          <div className="py-6 space-y-4 relative">
            <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 -ml-px hidden sm:block opacity-30" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {currentScenario.nodes.map((node, index) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-sm border cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-slate-850 border-indigo-500 shadow-lg ring-2 ring-indigo-500/20"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {node.icon}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white truncate">{node.name}</span>
                        <span className="text-[9px] font-mono text-indigo-400 uppercase bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                        {node.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-sm flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tip: Click any service card above to inspect deep exam architectural pillars.
            </span>
            <span className="font-mono text-indigo-400 font-bold">{currentScenario.badge}</span>
          </div>
        </div>

        {/* Right: Node Deep Inspector & Exam Practice (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedNode ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedNode.icon}</span>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-tight">{selectedNode.name}</h3>
                    <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold">Category: {selectedNode.category}</span>
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                  Active Inspector
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1 bg-slate-950/60 p-3 rounded border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-[#FF9900] font-mono block">Architectural Overview</span>
                  <p className="text-slate-300 leading-relaxed text-xs">{selectedNode.description}</p>
                </div>

                <div className="space-y-1 bg-indigo-950/20 p-3 rounded border border-indigo-900/40">
                  <span className="text-[10px] font-black uppercase text-indigo-400 font-mono block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    AWS Exam Pro-Tip
                  </span>
                  <p className="text-indigo-200 leading-relaxed text-xs">{selectedNode.examTip}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800 text-[11px]">
                    <span className="font-bold text-emerald-400 block text-[10px] uppercase font-mono">Security Pillar:</span>
                    <span className="text-slate-300">{selectedNode.securityPillar}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800 text-[11px]">
                    <span className="font-bold text-amber-400 block text-[10px] uppercase font-mono">Cost Optimization:</span>
                    <span className="text-slate-300">{selectedNode.costPillar}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800 text-[11px]">
                    <span className="font-bold text-blue-400 block text-[10px] uppercase font-mono">Performance Efficiency:</span>
                    <span className="text-slate-300">{selectedNode.performancePillar}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Architectural Challenge Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Shield className="w-4.5 h-4.5 text-[#FF9900]" />
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Blueprint Scenario Check</h3>
            </div>

            <p className="text-xs font-bold text-white leading-relaxed">
              {currentScenario.challenge.question}
            </p>

            <div className="space-y-2">
              {currentScenario.challenge.options.map(option => {
                const isSelected = selectedAnswer === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSubmit(option.id)}
                    disabled={showExplanation}
                    className={`w-full p-3 rounded-sm border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      showExplanation
                        ? option.correct
                          ? "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                          : isSelected
                          ? "bg-rose-950/30 border-rose-500 text-rose-200"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 opacity-60"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <span className="font-mono font-bold shrink-0 mt-0.5 text-indigo-400">({option.id.toUpperCase()})</span>
                    <span className="flex-1 leading-normal">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="pt-2 border-t border-slate-800 animate-fade-in space-y-3">
                <div className={`p-3 rounded-sm text-xs border ${
                  currentScenario.challenge.options.find(o => o.id === selectedAnswer)?.correct
                    ? "bg-emerald-950/20 border-emerald-800 text-emerald-200"
                    : "bg-rose-950/20 border-rose-800 text-rose-200"
                }`}>
                  <span className="font-extrabold uppercase block text-[10px] font-mono mb-1">
                    {currentScenario.challenge.options.find(o => o.id === selectedAnswer)?.correct ? "✅ Correct Answer" : "❌ Incorrect Answer"}
                  </span>
                  <p className="leading-relaxed">{currentScenario.challenge.options.find(o => o.id === selectedAnswer)?.explanation}</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Another Challenge
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
