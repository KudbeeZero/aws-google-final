import React, { useState } from "react";
import { CheckCircle2, XCircle, Award, ArrowRight, RotateCcw, X, Sparkles, Check } from "lucide-react";

interface KnowledgeCheckQuestion {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  domain: string;
}

const KNOWLEDGE_CHECK_QUESTIONS: KnowledgeCheckQuestion[] = [
  {
    id: 1,
    domain: "Domain 2: Security & Compliance",
    question: "Under the AWS Shared Responsibility Model, which of the following is the sole responsibility of the customer?",
    options: [
      { key: "A", text: "Physical security of AWS data centers and hardware facilities" },
      { key: "B", text: "Global network infrastructure and underlying virtualization hypervisors" },
      { key: "C", text: "Configuration of guest operating system, firewall rules, and IAM user credentials" },
      { key: "D", text: "Hardware replacement and maintenance for damaged disk drives" }
    ],
    correctAnswer: "C",
    explanation: "Under the Shared Responsibility Model, AWS is responsible for 'Security OF the Cloud' (hardware, data centers, facilities). The customer is responsible for 'Security IN the Cloud', including guest OS configuration, firewall rules, patch management, and IAM identity management."
  },
  {
    id: 2,
    domain: "Domain 1: Cloud Concepts",
    question: "Which AWS storage class is specifically designed for long-term archival data that is accessed less than once a year and allows retrieval times of 3 to 5 hours?",
    options: [
      { key: "A", text: "S3 Standard-Infrequent Access (Standard-IA)" },
      { key: "B", text: "S3 Intelligent-Tiering" },
      { key: "C", text: "S3 Glacier Deep Archive" },
      { key: "D", text: "S3 Glacier Flexible Retrieval" }
    ],
    correctAnswer: "C",
    explanation: "S3 Glacier Deep Archive is AWS's lowest-cost storage class, designed for long-term retention (7-10+ years compliance) with standard retrieval times of 12 hours (or bulk within 48 hours). S3 Glacier Flexible Retrieval supports 3-5 hour standard retrievals."
  },
  {
    id: 3,
    domain: "Domain 3: Technology & Core Services",
    question: "Which AWS service provides a fully managed relational database engine supporting MySQL, PostgreSQL, MariaDB, Oracle, and SQL Server with automated backups?",
    options: [
      { key: "A", text: "Amazon DynamoDB" },
      { key: "B", text: "Amazon Relational Database Service (Amazon RDS)" },
      { key: "C", text: "Amazon Redshift" },
      { key: "D", text: "Amazon Aurora Serverless" }
    ],
    correctAnswer: "B",
    explanation: "Amazon RDS is a managed relational database service that automates time-consuming administration tasks such as hardware provisioning, database setup, patching, and automated backups."
  },
  {
    id: 4,
    domain: "Domain 4: Billing, Pricing & Support",
    question: "Which AWS pricing model allows you to commit to a consistent amount of compute usage (measured in $/hour) for a 1-year or 3-year term to receive significant discounts compared to On-Demand pricing?",
    options: [
      { key: "A", text: "Spot Instances" },
      { key: "B", text: "AWS Savings Plans" },
      { key: "C", text: "Dedicated Hosts" },
      { key: "D", text: "Reserved Instances (Legacy)" }
    ],
    correctAnswer: "B",
    explanation: "AWS Savings Plans offer flexible pricing models (Compute Savings Plans, EC2 Instance Savings Plans) in exchange for a commitment to a consistent amount of compute usage (e.g. $10/hour) over 1 or 3 years."
  },
  {
    id: 5,
    domain: "Domain 2: Security & Compliance",
    question: "Which AWS tool inspects your AWS environment and makes recommendations for cost optimization, security vulnerabilities, performance improvements, and service limits?",
    options: [
      { key: "A", text: "AWS Trusted Advisor" },
      { key: "B", text: "Amazon CloudWatch" },
      { key: "C", text: "AWS Cost Explorer" },
      { key: "D", text: "AWS CloudTrail" }
    ],
    correctAnswer: "A",
    explanation: "AWS Trusted Advisor draws upon best practices learned across the entire AWS customer base to provide real-time guidance across five pillars (Cost Optimization, Security, Performance, Fault Tolerance, and Service Limits)."
  }
];

interface InteractiveKnowledgeCheckProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

export const InteractiveKnowledgeCheck: React.FC<InteractiveKnowledgeCheckProps> = ({
  onClose,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);

  const question = KNOWLEDGE_CHECK_QUESTIONS[currentIdx];
  const selectedKey = selectedAnswers[question.id];
  const isAnswered = selectedKey !== undefined;

  const handleSelectOption = (key: string) => {
    if (isAnswered) return; // Cannot change once selected
    setSelectedAnswers(prev => ({ ...prev, [question.id]: key }));
  };

  const handleNext = () => {
    if (currentIdx < KNOWLEDGE_CHECK_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setShowResults(true);
      // Calculate final score percentage
      let correctCount = 0;
      KNOWLEDGE_CHECK_QUESTIONS.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswer) correctCount++;
      });
      const scorePct = Math.round((correctCount / KNOWLEDGE_CHECK_QUESTIONS.length) * 100);
      onComplete(scorePct);
    }
  };

  const correctCount = KNOWLEDGE_CHECK_QUESTIONS.filter(
    q => selectedAnswers[q.id] === q.correctAnswer
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-slate-900/5 dark:ring-white/10">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-slate-200 px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#FF9900] text-slate-950 rounded-xs flex items-center justify-center font-black text-xs">
              ⚡
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                Interactive Knowledge Check
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded-sm">
                  Milestone Review
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verify your AWS CLF-C02 comprehension every 10 flashcards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer rounded hover:bg-slate-800"
            title="Close Knowledge Check"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5">
          {!showResults ? (
            <>
              {/* Progress & Domain info */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {question.domain}
                </span>
                <span className="font-bold">
                  Question {currentIdx + 1} of {KNOWLEDGE_CHECK_QUESTIONS.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {question.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                {question.options.map(opt => {
                  const isSelected = selectedKey === opt.key;
                  const isCorrect = opt.key === question.correctAnswer;
                  
                  let btnStyle = "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400";
                  
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/30";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:red-200 ring-1 ring-red-500/30";
                    } else {
                      btnStyle = "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 rounded-sm border text-left text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className={`w-6 h-6 rounded-xs shrink-0 flex items-center justify-center font-bold font-mono text-xs ${
                        isAnswered && isCorrect 
                          ? "bg-emerald-600 text-white" 
                          : isAnswered && isSelected && !isCorrect 
                          ? "bg-red-600 text-white" 
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 mt-0.5 leading-relaxed">{opt.text}</span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box (Appears after answer) */}
              {isAnswered && (
                <div className="bg-slate-900 text-slate-200 p-4 rounded-sm space-y-1.5 border border-slate-800 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF9900]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Official Explanation:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Results Screen */
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Knowledge Check Complete!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You scored <span className="font-bold text-emerald-600">{correctCount} / {KNOWLEDGE_CHECK_QUESTIONS.length}</span> correct ({Math.round((correctCount / KNOWLEDGE_CHECK_QUESTIONS.length) * 100)}%).
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                {correctCount >= 4 
                  ? "Outstanding mastery! Your grasp of AWS CLF-C02 core concepts is rock solid."
                  : "Good effort! Review the flashcard domains above to strengthen your exam readiness."}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            {showResults ? "Milestone Verified" : `Score: ${correctCount} Correct`}
          </span>

          {!showResults ? (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {currentIdx < KNOWLEDGE_CHECK_QUESTIONS.length - 1 ? "Next Question" : "View Results"}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              Continue Flashcards <Check className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
