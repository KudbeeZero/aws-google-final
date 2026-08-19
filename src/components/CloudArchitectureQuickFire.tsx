import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Clock, Trophy, X } from "lucide-react";

interface QuickFireProps {
  onComplete: (winAmount: number) => void;
  onClose: () => void;
}

export const CloudArchitectureQuickFire: React.FC<QuickFireProps> = ({ onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    { q: "Which service for scalable computing?", a: "EC2", choices: ["S3", "EC2", "RDS"] },
    { q: "Which service for object storage?", a: "S3", choices: ["S3", "Lambda", "IAM"] },
    { q: "Which service for serverless?", a: "Lambda", choices: ["EC2", "Lambda", "DynamoDB"] },
  ];

  useEffect(() => {
    if (timeLeft > 0 && currentQuestion < questions.length) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete(score * 100);
    }
  }, [timeLeft, currentQuestion]);

  const handleAnswer = (choice: string) => {
    if (choice === questions[currentQuestion].a) {
      setScore(score + 1);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete((score + (choice === questions[currentQuestion].a ? 1 : 0)) * 100);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6"
    >
      <div className="bg-slate-900 border border-amber-500 p-8 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.3)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="text-amber-400" /> QUICK-FIRE
          </h2>
          <div className="flex items-center gap-4 text-amber-400 font-mono font-bold">
            <div className="flex items-center gap-1"><Clock size={18}/> {timeLeft}s</div>
            <div className="flex items-center gap-1"><Trophy size={18}/> {score}</div>
          </div>
        </div>

        <p className="text-lg text-slate-200 mb-6">{questions[currentQuestion].q}</p>
        
        <div className="grid grid-cols-1 gap-3">
          {questions[currentQuestion].choices.map((choice) => (
            <button 
              key={choice}
              onClick={() => handleAnswer(choice)}
              className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition-all"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
