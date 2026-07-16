import React, { useState } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Compass, 
  BookOpen, 
  HelpCircle as QuestionIcon,
  ChevronRight,
  Info,
  Shield,
  ExternalLink
} from "lucide-react";

interface GlossaryItem {
  term: string;
  fullName: string;
  category: "Compute" | "Storage" | "Database" | "Security" | "Billing" | "Management";
  definition: string;
  trapWarning: string;
  examTakeaway: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: "EC2",
    fullName: "Elastic Compute Cloud",
    category: "Compute",
    definition: "Secure, resizable virtual servers in the cloud that provide complete control over physical hardware configurations.",
    trapWarning: "Don't confuse EC2 with AWS Lambda. EC2 is Infrastructure as a Service (IaaS) where you manage operating systems and patching. Lambda is serverless (No OS management).",
    examTakeaway: "Use EC2 when you need continuous, stateful, or non-intermittent background computational resources with custom OS access."
  },
  {
    term: "S3",
    fullName: "Simple Storage Service",
    category: "Storage",
    definition: "Object storage offering industry-leading scalability, data availability, security, and performance.",
    trapWarning: "S3 is object storage (files, keys, metadata). It is NOT block storage (like EBS) and CANNOT be used to run active databases or OS partitions directly.",
    examTakeaway: "Highly durable (99.999999999% over 11 9s). Best for media files, backups, static websites, and logging buckets."
  },
  {
    term: "EBS",
    fullName: "Elastic Block Store",
    category: "Storage",
    definition: "High-performance block-storage service designed for use with Amazon EC2 for both throughput and transaction-intensive workloads.",
    trapWarning: "EBS volumes reside in a SINGLE Availability Zone and can typically only mount to one EC2 instance at a time (unless Multi-Attach is configured).",
    examTakeaway: "Think of EBS as a virtual hard drive for an EC2 instance."
  },
  {
    term: "EFS",
    fullName: "Elastic File System",
    category: "Storage",
    definition: "A serverless, elastic, network file system that dynamically grows and shrinks, mounting to multiple EC2 servers simultaneously.",
    trapWarning: "EFS uses the NFS protocol and mounts to hundreds of instances. S3 uses HTTP API endpoints; EBS is direct-attached block storage.",
    examTakeaway: "Use EFS when multiple EC2 servers need simultaneous read-write access to a shared file system across multiple AZs."
  },
  {
    term: "RDS",
    fullName: "Relational Database Service",
    category: "Database",
    definition: "A managed service that makes it easy to set up, operate, and scale relational databases in the cloud (MySQL, PostgreSQL, Oracle).",
    trapWarning: "RDS handles patching, backups, and replication, but you CANNOT SSH into the database OS container itself.",
    examTakeaway: "Use RDS for traditional SQL queries, ACID compliance, and transactional data processing."
  },
  {
    term: "DynamoDB",
    fullName: "Amazon DynamoDB",
    category: "Database",
    definition: "A fully-managed, serverless NoSQL database service that provides consistent, single-digit millisecond latency at any scale.",
    trapWarning: "DynamoDB uses a key-value or document model. Do not use it if you need complex multi-table SQL JOIN queries.",
    examTakeaway: "Highly scalable, distributed, key-value store. Best for session states, shopping carts, and real-time gaming profiles."
  },
  {
    term: "WAF",
    fullName: "Web Application Firewall",
    category: "Security",
    definition: "A firewall that helps protect web applications against common web exploits like SQL Injections and Cross-Site Scripting (XSS).",
    trapWarning: "WAF filters HTTP/HTTPS web requests (Layer 7). It does NOT protect against lower-layer attacks like network DDoS (Layer 3/4) which are handled by AWS Shield.",
    examTakeaway: "Use WAF to block specific malicious IP ranges or filter parameters targeting your ALB or CloudFront."
  },
  {
    term: "Shield",
    fullName: "AWS Shield",
    category: "Security",
    definition: "A managed Distributed Denial of Service (DDoS) protection service that safeguards applications running on AWS.",
    trapWarning: "AWS Shield Standard is free and enabled for all customers automatically. Shield Advanced offers 24/7 access to the DDoS response team.",
    examTakeaway: "Shield is purely for DDoS protection on Layer 3/4 (network packets flooding)."
  },
  {
    term: "GuardDuty",
    fullName: "Amazon GuardDuty",
    category: "Security",
    definition: "An active threat detection service that continuously monitors your AWS accounts, workloads, and data for malicious activity.",
    trapWarning: "GuardDuty is retrospective and diagnostic. It alerts you of malicious patterns (e.g. EC2 mining crypto), but does NOT actively block vulnerabilities like a firewall.",
    examTakeaway: "Think of GuardDuty as an AI-powered security guard reviewing CloudTrail and VPC Flow Logs."
  },
  {
    term: "Inspector",
    fullName: "Amazon Inspector",
    category: "Security",
    definition: "An automated vulnerability assessment service that continuously scans AWS workloads for software vulnerabilities and unintended exposure.",
    trapWarning: "Inspector scans software vulnerabilities inside EC2 instances and container registries. Do not confuse it with GuardDuty which monitors network threats.",
    examTakeaway: "Use Inspector to verify if your installed server software package is outdated or exposed."
  },
  {
    term: "Trusted Advisor",
    fullName: "AWS Trusted Advisor",
    category: "Management",
    definition: "An online tool that provides real-time guidance to help you provision resources following AWS best practices (cost, security, performance, faults).",
    trapWarning: "Trusted Advisor advises across 5 categories, but does not execute recommendations automatically. You must manually implement them.",
    examTakeaway: "Excellent tool for identifying idle resources (like unattached EBS volumes) to save immediate budget."
  },
  {
    term: "Cost Explorer",
    fullName: "AWS Cost Explorer",
    category: "Billing",
    definition: "A retrospective visual tool that lets you view, analyze, and forecast your AWS costs and usage graphically.",
    trapWarning: "Cost Explorer is for historic visualization. AWS Budgets is for setting spending limits and triggers proactive email alerts.",
    examTakeaway: "Use Cost Explorer to identify which services consumed the highest budget during the previous quarter."
  },
  {
    term: "Budgets",
    fullName: "AWS Budgets",
    category: "Billing",
    definition: "A billing service to set custom budgets and trigger email alerts immediately when usage or costs exceed (or are forecasted to exceed) thresholds.",
    trapWarning: "Budgets will NOT automatically shut down your EC2 servers by default unless you attach a custom SSM action script. It mainly alerts you.",
    examTakeaway: "The primary tool to prevent cloud spending bill shocks before they happen."
  },
  {
    term: "CloudTrail",
    fullName: "AWS CloudTrail",
    category: "Management",
    definition: "A service that monitors and records account activity throughout your AWS infrastructure, auditing actions taken via the API, CLI, or Console.",
    trapWarning: "CloudTrail logs WHO made the API call (auditing). CloudWatch monitors performance metrics, CPU spikes, and application-level log lines.",
    examTakeaway: "Essential for compliance audits: 'Who deleted this S3 bucket at 3:00 AM?'"
  }
];

interface DiagnosticQuestion {
  id: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  recommendationTab: string;
  recommendationText: string;
}

const DIAG_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    question: "Under the AWS Shared Responsibility Model, which of the following is entirely the customer's responsibility?",
    options: [
      "Physical security of datacenters",
      "Configuration of Guest Operating Systems and Firewalls",
      "Decommissioning physical magnetic hard drives",
      "Hypervisor patch management"
    ],
    correctIdx: 1,
    explanation: "AWS is responsible for security 'OF' the cloud (hardware, physical security, virtualization software). The customer is responsible for security 'IN' the cloud (guest operating systems, user data, firewalls).",
    recommendationTab: "flashcards",
    recommendationText: "Study Cloud Concepts and Security flashcards to build standard boundary confidence."
  },
  {
    id: 2,
    question: "You want to set up an alert that sends an email when your bill is forecasted to reach $100. Which tool is best suited?",
    options: [
      "AWS Trusted Advisor",
      "AWS Cost Explorer",
      "AWS Budgets",
      "AWS Pricing Calculator"
    ],
    correctIdx: 2,
    explanation: "AWS Budgets allows you to set custom budgets and alerts based on actual or forecasted cost thresholds.",
    recommendationTab: "vault",
    recommendationText: "Review the 'Cost Explorer vs Budgets' card in the Distractor Vault to master billing tools."
  },
  {
    id: 3,
    question: "Which AWS service is designed for DDoS protection of web apps at Layers 3 and 4?",
    options: [
      "Amazon GuardDuty",
      "AWS WAF",
      "Amazon Inspector",
      "AWS Shield"
    ],
    correctIdx: 3,
    explanation: "AWS Shield protects against DDoS attacks on network layers. AWS WAF targets Layer 7 (application-level exploits).",
    recommendationTab: "matching",
    recommendationText: "Jump into the Scenario Matcher Game to train quick-response service identification!"
  }
];

interface FirstTimeToolsProps {
  onNavigateToTab: (tab: string) => void;
  onSelectDomain: (domainId: string) => void;
}

export const FirstTimeTools: React.FC<FirstTimeToolsProps> = ({
  onNavigateToTab,
  onSelectDomain
}) => {
  // Assessment State
  const [assessmentStep, setAssessmentStep] = useState<"welcome" | "question" | "result">("welcome");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Glossary State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const handleStartDiag = () => {
    setAssessmentStep("question");
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setAnswers(prev => [...prev, idx]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < DIAG_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setAssessmentStep("result");
    }
  };

  // Glossary filtering
  const filteredGlossary = GLOSSARY_ITEMS.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const correctAnswersCount = answers.filter((ans, idx) => ans === DIAG_QUESTIONS[idx].correctIdx).length;
  
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION 1: Welcome & Diagnostic Assessment */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-4">
        
        {assessmentStep === "welcome" && (
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-4 bg-slate-50 border border-slate-100 rounded-sm">
            <div className="space-y-1.5 text-left max-w-xl">
              <span className="text-[9px] font-black tracking-widest text-[#FF9900] uppercase font-mono bg-[#FF9900]/10 px-2.5 py-0.5 rounded border border-[#FF9900]/20 inline-block">
                AWS Quick-Start Guide
              </span>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight uppercase">
                First Time studying? Take our 2-Minute Diagnostic Kickstart
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                AWS service boundaries can be confusing at first. Take our micro-assessment of high-yield CLF-C02 questions to instantly unlock a personalized learning route customized around your weak points.
              </p>
            </div>
            <button
              onClick={handleStartDiag}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-sm shrink-0 inline-flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
            >
              Start Diagnostic Quiz
              <ArrowRight className="w-3.5 h-3.5 text-[#FF9900]" />
            </button>
          </div>
        )}

        {assessmentStep === "question" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Diagnostic Assessment — Question {currentQuestionIdx + 1} of {DIAG_QUESTIONS.length}
              </span>
              <div className="flex space-x-1">
                {DIAG_QUESTIONS.map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-4 h-1.5 rounded-full ${
                      i === currentQuestionIdx ? "bg-slate-900" : i < currentQuestionIdx ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <h4 className="text-xs md:text-sm font-black text-slate-800 leading-relaxed">
              {DIAG_QUESTIONS[currentQuestionIdx].question}
            </h4>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {DIAG_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                let optionStyle = "border-slate-200 hover:bg-slate-50 text-slate-700 bg-white";
                if (isAnswered) {
                  const isCorrectOption = idx === DIAG_QUESTIONS[currentQuestionIdx].correctIdx;
                  const isUserSelection = idx === selectedOption;

                  if (isCorrectOption) {
                    optionStyle = "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold";
                  } else if (isUserSelection) {
                    optionStyle = "border-rose-300 bg-rose-50 text-rose-800 font-bold";
                  } else {
                    optionStyle = "border-slate-100 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-3.5 border rounded-sm text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && idx === DIAG_QUESTIONS[currentQuestionIdx].correctIdx && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm space-y-2 animate-fade-in">
                <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">
                  Concept Breakdown
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {DIAG_QUESTIONS[currentQuestionIdx].explanation}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {currentQuestionIdx < DIAG_QUESTIONS.length - 1 ? "Next Question" : "View Placement recommendations"}
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF9900]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {assessmentStep === "result" && (
          <div className="space-y-4">
            <div className="text-center py-4 border-b border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#FF9900] tracking-widest font-mono block">
                Assessment diagnostic results
              </span>
              <h3 className="text-lg font-black text-slate-800">
                Your Starter Study Profile: {correctAnswersCount === DIAG_QUESTIONS.length ? "Cloud Master" : correctAnswersCount > 0 ? "Aspiring Cloud Practitioner" : "AWS Novice Learner"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                You correctly answered <span className="text-slate-800 font-bold font-mono">{correctAnswersCount} out of {DIAG_QUESTIONS.length}</span> diagnostic questions.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                Your Custom Training Strategy
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DIAG_QUESTIONS.map((q, i) => {
                  const wasCorrect = answers[i] === q.correctIdx;
                  return (
                    <div 
                      key={i}
                      className={`p-4 border rounded-sm flex flex-col justify-between space-y-3 ${
                        wasCorrect ? "bg-emerald-50/20 border-emerald-100" : "bg-rose-50/20 border-rose-100"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded inline-block ${
                          wasCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          Question {i + 1}: {wasCorrect ? "PASSED" : "REVIEW NEEDED"}
                        </span>
                        <p className="text-[11px] text-slate-600 font-semibold line-clamp-2">
                          "{q.question}"
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                          {q.recommendationText}
                        </p>
                        <button
                          onClick={() => onNavigateToTab(q.recommendationTab)}
                          className="w-full text-center py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                        >
                          Unlock module
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setAssessmentStep("welcome")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-sm cursor-pointer"
              >
                Reset Diagnostic Quiz
              </button>
            </div>
          </div>
        )}

      </div>

      {/* SECTION 2: Searchable AWS Glossary Acronym Lookup */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#FF9900]" />
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                AWS CLF-C02 Interactive Search Glossary
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                Bypass service confusion. Search critical AWS tools and reveal their exact exam trap warnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter Pills */}
            {["All", "Compute", "Storage", "Database", "Security", "Billing"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs" 
                    : "bg-slate-50 text-slate-500 border-slate-150 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Input bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Type an AWS service acronym or name (e.g. S3, EC2, GuardDuty, Shield)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-slate-300 p-2.5 pl-10 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9900] transition-all"
          />
        </div>

        {/* Glossary Results List */}
        {filteredGlossary.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-100 rounded-sm space-y-2">
            <Info className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              No service definitions matching "{searchQuery}" found in this study domain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item) => (
              <div 
                key={item.term}
                className="border border-slate-200/80 bg-white hover:bg-slate-50/30 p-4 rounded-sm flex flex-col justify-between space-y-3 transition-shadow duration-200 hover:shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-slate-800 tracking-tight bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 font-mono">
                        {item.term}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-700">
                    {item.fullName}
                  </h4>

                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    {item.definition}
                  </p>
                </div>

                {/* Exam Warning / Takeaway box */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="p-2 bg-rose-50/50 border border-rose-100/60 rounded-xs text-[10px] leading-relaxed text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      AWS Exam Distractor Trap Warning
                    </div>
                    {item.trapWarning}
                  </div>

                  <div className="p-2 bg-emerald-50/50 border border-emerald-100/60 rounded-xs text-[10px] leading-relaxed text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Absolute CLF-C02 Takeaway
                    </div>
                    {item.examTakeaway}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
