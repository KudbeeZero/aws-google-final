import React, { useState, useEffect } from "react";
import { AlertCircle, HelpCircle, Trophy, ChevronLeft, ChevronRight, Check, RefreshCw, Star, Info } from "lucide-react";
import { TrickQuestion, TrickQuestionOption } from "../types";
import { ParticleEffect } from "./ParticleEffect";

interface TrickQuestionSimulatorProps {
  questions: TrickQuestion[];
  quizHistory: { [key: string]: boolean };
  onRecordResult: (id: string, isCorrect: boolean) => void;
  onResetQuiz: () => void;
}

export const TrickQuestionSimulator: React.FC<TrickQuestionSimulatorProps> = ({
  questions,
  quizHistory,
  onRecordResult,
  onResetQuiz,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  const activeQuestion = questions[currentIdx];

  // Sync state when active question index changes
  useEffect(() => {
    setSelectedKey(null);
    setIsSubmitted(false);
  }, [currentIdx]);

  const handleSelectOption = (key: "A" | "B" | "C" | "D") => {
    if (isSubmitted) return; // Can't change after submitting
    setSelectedKey(key);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    if (!selectedKey || isSubmitted) return;
    const isCorrect = selectedKey === activeQuestion.correctAnswer;
    onRecordResult(activeQuestion.id, isCorrect);
    setIsSubmitted(true);

    if (isCorrect) {
      const newParticle = { id: Date.now().toString(), x: e.clientX, y: e.clientY };
      setParticles(prev => [...prev, newParticle]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  // Stats calculation
  const totalAttempted = Object.keys(quizHistory).length;
  const totalCorrect = Object.values(quizHistory).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top statistics panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-full text-[#FF9900]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Trick Simulator Progress</h3>
            <p className="text-xs text-slate-500">
              Score: <span className="font-bold text-slate-800">{totalCorrect}</span> correct of <span className="font-bold text-slate-800">{questions.length}</span> scenario questions
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Question markers container */}
          <div className="flex flex-wrap gap-1.5 max-w-xs md:max-w-md lg:max-w-lg max-h-20 overflow-y-auto p-1.5 bg-slate-50 border border-slate-100 rounded-sm scrollbar-thin">
            {questions.map((q, idx) => {
              const status = quizHistory[q.id];
              let dotBg = "bg-slate-200";
              if (idx === currentIdx) dotBg = "bg-slate-900 text-white ring-2 ring-slate-200";
              else if (status === true) dotBg = "bg-emerald-500 text-white";
              else if (status === false) dotBg = "bg-rose-500 text-white";

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-5.5 h-5.5 rounded-xs flex items-center justify-center text-[9px] font-black font-mono transition-all hover:scale-105 cursor-pointer ${
                    idx === currentIdx ? "text-white" : "text-slate-600"
                  } ${dotBg}`}
                  title={`Go to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={onResetQuiz}
            className="px-3 py-1.5 text-[9px] font-black border border-slate-200 hover:bg-slate-50 hover:text-red-600 text-slate-500 rounded-sm transition-colors uppercase shrink-0 cursor-pointer"
          >
            Reset Test
          </button>
        </div>
      </div>

      {/* Main scenario block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area: Scenario and Options Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                Question {currentIdx + 1} of {questions.length} • {activeQuestion.domainName}
              </span>
              
              {quizHistory[activeQuestion.id] !== undefined && (
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${
                  quizHistory[activeQuestion.id] ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {quizHistory[activeQuestion.id] ? "Passed" : "Failed"}
                </span>
              )}
            </div>

            {/* Scenario Paragraph */}
            <h4 className="text-xs md:text-sm font-bold text-slate-800 italic leading-relaxed bg-orange-50/30 p-4 border border-orange-100 rounded-sm mb-5">
              "{activeQuestion.scenario}"
            </h4>

            {/* Interactive choices */}
            <div className="space-y-3">
              {activeQuestion.options.map((opt) => {
                const isSelected = selectedKey === opt.key;
                const isCorrect = opt.key === activeQuestion.correctAnswer;
                
                let optionStyle = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700";
                
                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
                  } else if (isSelected) {
                    optionStyle = "border-rose-400 bg-rose-50 text-rose-900 font-medium";
                  } else {
                    optionStyle = "border-slate-100 bg-white text-slate-400 opacity-60 cursor-not-allowed";
                  }
                } else if (isSelected) {
                  optionStyle = "border-[#FF9900] bg-orange-50/50 text-slate-900 font-medium ring-1 ring-[#FF9900]/40";
                }

                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-3.5 border rounded-sm text-xs transition-all flex items-start gap-3 select-none ${
                      isSubmitted ? "cursor-default" : "cursor-pointer"
                    } ${optionStyle}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      isSelected 
                        ? isSubmitted
                          ? isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          : "bg-[#FF9900] text-white"
                        : isSubmitted && isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {opt.key}
                    </span>
                    <span className="leading-relaxed flex-1">{opt.text}</span>
                    
                    {isSubmitted && isCorrect && (
                      <span className="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        CORRECT ANSWER
                      </span>
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <span className="text-[9px] font-mono font-extrabold text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                        YOUR TRICKED CHOICE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative">
            {particles.map(p => (
              <ParticleEffect key={p.id} x={p.x} y={p.y} />
            ))}
            <div className="flex space-x-2">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-sm text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous Question
              </button>
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={handleNext}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-sm text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next Question
              </button>
            </div>

            {!isSubmitted ? (
              <button
                disabled={!selectedKey}
                onClick={handleSubmit}
                className="px-5 py-2 bg-[#FF9900] hover:bg-orange-600 text-white text-xs font-bold rounded-sm border border-orange-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#FF9900] transition-all uppercase tracking-wider"
              >
                Submit & Verify Answer
              </button>
            ) : (
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={handleNext}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-sm transition-all uppercase tracking-wider"
              >
                Proceed to Next
              </button>
            )}
          </div>
        </div>

        {/* Right Area: Deep Analysis / Distractor Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-sm p-5 text-white flex flex-col justify-between min-h-[460px] overflow-hidden">
          
          {!isSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 h-full space-y-4">
              <HelpCircle className="w-12 h-12 text-slate-700 animate-pulse" />
              <h5 className="font-bold text-slate-300 text-sm">Deep Analysis Vault Locked</h5>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Select an option and press <strong>Submit & Verify</strong>. The simulator will unlock the structural breakdown of the correct choice and expose the visual distractor traps.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin">
              
              <div className="space-y-4">
                {/* Result Notification */}
                <div className={`p-3 rounded-sm text-xs font-bold flex items-center gap-2 border ${
                  selectedKey === activeQuestion.correctAnswer
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {selectedKey === activeQuestion.correctAnswer ? (
                    <span>Incredible job! You successfully bypassed the distractor trap.</span>
                  ) : (
                    <span>Tricked! Option {selectedKey} is a classic AWS exam distractor.</span>
                  )}
                </div>

                {/* Trap Alert */}
                <div className="bg-slate-950 p-3.5 border-l-4 border-l-orange-500 rounded-sm text-[11.5px] leading-relaxed">
                  <span className="text-[#FF9900] font-bold block mb-1">
                    🛡️ THE EXAM TRAP:
                  </span>
                  {activeQuestion.trickAlert}
                </div>

                {/* Correct Explanation */}
                <div className="bg-slate-950/55 p-3.5 border border-slate-800 rounded-sm">
                  <span className="text-emerald-400 font-bold block text-xs mb-1">
                    ✓ Why Answer {activeQuestion.correctAnswer} is Correct:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeQuestion.correctExplanation}
                  </p>
                </div>

                {/* Distractors Exposed */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    💀 Distractor Traps Exposed:
                  </span>
                  
                  {Object.entries(activeQuestion.distractorExplanations).map(([key, value]) => {
                    if (key === activeQuestion.correctAnswer) return null;
                    return (
                      <div key={key} className="text-[10.5px] bg-slate-950/30 p-2 border border-slate-800/50 rounded-sm leading-normal">
                        <span className="font-mono font-bold text-slate-300 mr-1 uppercase">
                          Option {key}:
                        </span>
                        <span className="text-slate-400">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips block */}
              <div className="text-[9.5px] text-slate-500 font-mono mt-4 pt-2 border-t border-slate-800 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>EXAM TIP: Look for absolute constraints like 'cheapest', 'serverless', or Layer 7 limits.</span>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
