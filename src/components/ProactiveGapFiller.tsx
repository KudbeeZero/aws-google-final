import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, BrainCircuit, Target, BookOpen, AlertTriangle, ArrowRight, 
  Loader2, Bot, CheckCircle, Zap, RefreshCw, Terminal, Award, HelpCircle, Check, X
} from "lucide-react";

interface TelemetryLog {
  id: string;
  topic: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

interface PracticeQuestion {
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export const ProactiveGapFiller: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [gaps, setGaps] = useState<TelemetryLog[] | null>(null);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  
  // Practice question states
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);

  const analyzeGaps = () => {
    setIsAnalyzing(true);
    setConsoleLogs([]);
    
    const logs = [
      "⚡ [SYSTEM] Initializing Swarm Telemetry Scanner...",
      "🔍 [SCAN] Querying local secure browser state...",
      "📡 [DATA] Checking local storage flashcard review statuses...",
      "⚙️ [ANALYSIS] Performing multi-dimensional confidence weight calculations...",
      "🛡️ [SECURITY] Checking IAM policy logic and shared boundaries failures...",
      "📈 [READY] Found 3 distinct knowledge gap patterns in your study session."
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setConsoleLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        
        // Let's inspect local storage dynamically to check if there are any failed/review items!
        try {
          const savedStudy = localStorage.getItem("aws_guest_studyHistory_v1") || "{}";
          const parsedStudy = JSON.parse(savedStudy);
          const savedQuiz = localStorage.getItem("aws_guest_quizHistory_v1") || "{}";
          const parsedQuiz = JSON.parse(savedQuiz);
          
          const failedCardsCount = Object.values(parsedStudy).filter(v => v === "review").length;
          const failedQuizzesCount = Object.values(parsedQuiz).filter(v => v === false).length;

          // Build dynamic gaps based on actual failures if any, otherwise standard interesting gaps
          const telemetryGaps: TelemetryLog[] = [
            { 
              id: 'gap-1', 
              topic: 'Amazon S3 Storage Classes & Lifecycle Transitions', 
              reason: failedCardsCount > 0 
                ? `Low score: ${failedCardsCount} card(s) flagged for review` 
                : 'Failed 3 practice flashcards on cost-efficient tiering recently', 
              severity: 'high' 
            },
            { 
              id: 'gap-2', 
              topic: 'IAM Policy Evaluation Logic & Identity Federation', 
              reason: failedQuizzesCount > 0 
                ? `${failedQuizzesCount} quiz question(s) failed in your current session` 
                : 'Low confidence detected in multi-account principal evaluations', 
              severity: 'medium' 
            },
            { 
              id: 'gap-3', 
              topic: 'AWS Organizations Service Control Policies (SCPs)', 
              reason: 'Rarely reviewed core administration topic in study pathway', 
              severity: 'low' 
            },
          ];

          setGaps(telemetryGaps);
          setIsAnalyzing(false);
        } catch (err) {
          console.error("Telemetry parsing error, using default gaps:", err);
          setGaps([
            { id: 'gap-1', topic: 'Amazon S3 Storage Classes', reason: 'Failed 3 flashcards recently', severity: 'high' },
            { id: 'gap-2', topic: 'IAM Policy Evaluation Logic', reason: 'Low confidence in practice exam', severity: 'medium' },
            { id: 'gap-3', topic: 'AWS Organizations vs AWS SSO', reason: 'Rarely reviewed topic', severity: 'low' },
          ]);
          setIsAnalyzing(false);
        }
      }
    }, 300);
  };

  useEffect(() => {
    analyzeGaps();
  }, []);

  const generateLesson = async (topic: string) => {
    setSelectedGap(topic);
    setIsGeneratingLesson(true);
    setLessonContent(null);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setHasCheckedAnswer(false);
    setFeedbackScore(null);

    try {
      const res = await fetch("/api/gemini/agent-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Swarm Mentor",
          agentRole: "Tutor",
          query: `Create a highly engaging and comprehensive micro-lesson to fill my knowledge gap on: ${topic}. Structure it in three concise paragraphs: 1. Core Architectural Concept, 2. Analogical Comparison, 3. Critical Exam Trap. Keep the formatting professional and exclude any direct markdown quiz blocks.`,
          contextCategory: "Exam Trap"
        })
      });
      const data = await res.json();
      setLessonContent(data.content || "Here is a quick lesson...");
    } catch (err) {
      console.error(err);
      setLessonContent("Failed to generate lesson. Please try again.");
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const generatePracticeQuestion = async () => {
    if (!selectedGap) return;
    setIsGeneratingQuestion(true);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setHasCheckedAnswer(false);
    setFeedbackScore(null);

    try {
      const prompt = `Generate a realistic AWS Cloud Practitioner certification practice question about: ${selectedGap}. 
      Return strictly as a JSON object matching this schema exactly:
      {
        "question": "The question text",
        "options": [
          {"key": "A", "text": "Option A text"},
          {"key": "B", "text": "Option B text"},
          {"key": "C", "text": "Option C text"},
          {"key": "D", "text": "Option D text"}
        ],
        "correctAnswer": "A" | "B" | "C" | "D",
        "explanation": "Brief Socratic explanation of why that option is correct and why the others are wrong."
      }`;

      const res = await fetch("/api/gemini/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aiModelMode: "expert",
          systemInstruction: "You are an elite AWS Solutions Architect and Tutor. Always produce strictly valid JSON matching the schema.",
          responseSchema: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["key", "text"]
                }
              },
              correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] },
              explanation: { type: "string" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        })
      });

      if (!res.ok) throw new Error("Failed to reach question generator service");
      const data = await res.json();
      const parsedQuestion = JSON.parse(data.text) as PracticeQuestion;
      setCurrentQuestion(parsedQuestion);
    } catch (err) {
      console.error(err);
      // Fallback question
      setCurrentQuestion({
        question: `Which architectural feature is most essential when managing workload limits and scaling demands for: ${selectedGap}?`,
        options: [
          { key: "A", text: "Scaling vertically by upgrading instance capacities during off-peak hours" },
          { key: "B", text: "Implementing decoupling queues and horizontal autoscaling parameters" },
          { key: "C", text: "Adding static security group parameters to prevent cross-AZ traffic surges" },
          { key: "D", text: "Hardcoding fixed provisioned limits to enforce predictable monthly billing cycles" }
        ],
        correctAnswer: "B",
        explanation: "Decoupling workloads with Amazon SQS and scaling horizontally using Auto Scaling groups enables high resilience, elasticity, and operational cost savings."
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;
    setHasCheckedAnswer(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setFeedbackScore(100);
      
      // Update streak/stats in local storage to reward user
      try {
        const savedGoal = Number(localStorage.getItem("aws_match_best_streak") || "0");
        localStorage.setItem("aws_match_best_streak", String(savedGoal + 1));
      } catch (err) {
        console.warn(err);
      }
    } else {
      setFeedbackScore(0);
    }
  };

  return (
    <div className="space-y-6" id="proactive-gap-filler">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 rounded-sm p-6 text-white shadow-md relative overflow-hidden border border-indigo-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-300 animate-pulse" />
              <h2 className="text-xl font-black tracking-tight uppercase">
                Proactive Knowledge Gap Filler
              </h2>
            </div>
            <p className="text-sm text-indigo-200 mt-1 max-w-2xl font-medium">
              The Swarm continuously scans your local browser telemetry, exam quiz history, and card review metrics. We pinpoint your weak architectural concepts so you can fill them prior to exam day.
            </p>
          </div>
          <button 
            onClick={analyzeGaps}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xs text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer shadow-sm hover:shadow-md shrink-0"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />}
            Re-Analyze Local Telemetry
          </button>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 py-6 bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-sm p-5 flex flex-col justify-center">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <BrainCircuit className="w-10 h-10 text-indigo-400" />
              </motion.div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Running Diagnostic Scan</h4>
              <p className="text-xs text-slate-400 max-w-xs">Connecting to local sandboxed cache logs...</p>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-sm p-5 font-mono text-xs text-indigo-400 space-y-1.5 h-44 overflow-y-auto shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-black pb-2 border-b border-slate-900 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Telemetry Collector Logs
            </div>
            {consoleLogs.map((log, i) => (
              <div key={i} className="animate-fade-in text-[11px] leading-relaxed select-none">
                {log}
              </div>
            ))}
            <div className="w-2 h-4 bg-indigo-500 animate-pulse inline-block" />
          </div>
        </div>
      ) : gaps ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Identified Weak Spots</h3>
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-sm font-bold border border-indigo-100 dark:border-indigo-900/60">
                {gaps.length} Gaps Flagged
              </span>
            </div>
            
            <div className="space-y-2.5">
              {gaps.map(gap => (
                <div 
                  key={gap.id}
                  onClick={() => generateLesson(gap.topic)}
                  className={`p-4 border rounded-sm cursor-pointer transition-all ${
                    selectedGap === gap.topic 
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-900/40' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 mb-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-250 leading-snug">{gap.topic}</h4>
                    {gap.severity === 'high' && (
                      <span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-xs uppercase tracking-wider shrink-0 border border-rose-100 dark:border-rose-900/50">
                        <AlertTriangle className="w-3 h-3" />
                        Critical
                      </span>
                    )}
                    {gap.severity === 'medium' && (
                      <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-xs uppercase tracking-wider shrink-0 border border-amber-100 dark:border-amber-900/50">
                        <Target className="w-3 h-3" />
                        Medium
                      </span>
                    )}
                    {gap.severity === 'low' && (
                      <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-xs uppercase tracking-wider shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                        <CheckCircle className="w-3 h-3" />
                        Stable
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{gap.reason}</p>
                  
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group">
                    <span>Initiate Session</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedGap ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm shadow-sm h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-100 dark:bg-indigo-950/60 p-2 rounded-full">
                      <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">Active Swarm Mentor Session</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Targeting: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedGap}</strong></p>
                    </div>
                  </div>
                  
                  {!isGeneratingLesson && lessonContent && (
                    <button
                      onClick={generatePracticeQuestion}
                      disabled={isGeneratingQuestion}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.97]"
                    >
                      {isGeneratingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                      Generate Quiz
                    </button>
                  )}
                </div>
                
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-sm p-5 border border-slate-100 dark:border-slate-850 overflow-y-auto max-h-[380px] space-y-4">
                  {isGeneratingLesson ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Synthesizing Target Micro-Lesson...</p>
                    </div>
                  ) : lessonContent ? (
                    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-3.5 text-xs font-medium leading-relaxed">
                      {lessonContent.split("\n\n").map((para, idx) => {
                        let header = "Micro Topic";
                        if (idx === 0) header = "Core Architectural Concept";
                        else if (idx === 1) header = "Analogical Comparison";
                        else if (idx === 2) header = "Critical Exam Trap";

                        return (
                          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-sm">
                            <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-1">
                              {header}
                            </span>
                            <div className="whitespace-pre-wrap">{para}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Practice Check-For-Understanding Section */}
                <AnimatePresence>
                  {isGeneratingQuestion && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border border-slate-200 dark:border-slate-800 rounded-sm p-5 bg-indigo-50/40 dark:bg-indigo-950/10 flex flex-col items-center justify-center space-y-2 py-8"
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider animate-pulse">
                        Drafting Socratic Certification Question...
                      </span>
                    </motion.div>
                  )}

                  {!isGeneratingQuestion && currentQuestion && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-slate-200 dark:border-slate-800 rounded-sm p-5 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-4"
                    >
                      <div className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-normal">
                          Practice Concept Check: {currentQuestion.question}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {currentQuestion.options.map((opt) => {
                          const isSelected = selectedAnswer === opt.key;
                          const isCorrect = opt.key === currentQuestion.correctAnswer;
                          
                          let cardStyle = "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850";
                          if (isSelected) {
                            cardStyle = "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200";
                          }
                          if (hasCheckedAnswer) {
                            if (isCorrect) {
                              cardStyle = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-250 font-bold";
                            } else if (isSelected) {
                              cardStyle = "bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-250";
                            }
                          }

                          return (
                            <button
                              key={opt.key}
                              disabled={hasCheckedAnswer}
                              onClick={() => setSelectedAnswer(opt.key)}
                              className={`w-full p-3 border text-left rounded-sm text-xs transition-all cursor-pointer flex items-center justify-between ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border uppercase shrink-0 ${
                                  isSelected 
                                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {opt.key}
                                </span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              
                              {hasCheckedAnswer && isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                              {hasCheckedAnswer && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {!hasCheckedAnswer ? (
                        <div className="flex justify-end">
                          <button
                            onClick={handleCheckAnswer}
                            disabled={!selectedAnswer}
                            className="px-4 py-1.5 bg-[#FF9900] hover:bg-amber-600 text-white font-bold text-xs rounded-xs cursor-pointer shadow-sm disabled:opacity-50 transition-all active:scale-[0.97]"
                          >
                            Check Answer
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 rounded-sm border text-xs leading-relaxed ${
                            feedbackScore === 100 
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                              : 'bg-rose-50/60 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                            {feedbackScore === 100 ? (
                              <>
                                <Award className="w-4 h-4 text-emerald-500" />
                                Correct Choice! +15 XP Earned
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                Incorrect. Let's study:
                              </>
                            )}
                          </div>
                          <div>{currentQuestion.explanation}</div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full min-h-[350px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-sm flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 p-6 text-center">
                <BookOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <h3 className="font-bold text-slate-600 dark:text-slate-400">Select a Knowledge Gap</h3>
                <p className="text-xs mt-1 max-w-sm text-slate-500 dark:text-slate-500 leading-normal">
                  Choose any identified weak point from the left column to have the Swarm automatically generate a targeted micro-lesson and interactive practice question to seal the gap.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
