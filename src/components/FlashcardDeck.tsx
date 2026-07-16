import React, { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, ChevronLeft, ChevronRight, Award, Trash2, HelpCircle, Flame, Star } from "lucide-react";
import { Flashcard, DomainData } from "../types";
import { ParticleEffect } from "./ParticleEffect";

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  domains: DomainData[];
  studyHistory: { [key: string]: "known" | "review" | null };
  onMarkCard: (id: string, status: "known" | "review") => void;
  onResetStudyHistory: () => void;
  initialDomainId: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  flashcards,
  domains,
  studyHistory,
  onMarkCard,
  onResetStudyHistory,
  initialDomainId,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomainId || "all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Filter flashcards based on selection
  const filteredCards = flashcards.filter((fc) => {
    if (selectedDomain === "all") return true;
    if (selectedDomain === "review-pool") return studyHistory[fc.id] === "review";
    return fc.domainId === selectedDomain;
  });

  // Keep index in safe range when filters change
  useEffect(() => {
    setCurrentIdx(0);
    setIsFlipped(false);
  }, [selectedDomain, flashcards]);

  const nextCard = () => {
    if (currentIdx < filteredCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
      }, 150);
    }
  };

  const prevCard = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
      }, 150);
    }
  };

  const handleMark = (status: "known" | "review", e?: React.MouseEvent) => {
    if (filteredCards.length === 0) return;
    
    if (status === "known" && e) {
      const newParticle = { id: Date.now().toString(), x: e.clientX, y: e.clientY };
      setParticles(prev => [...prev, newParticle]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    }

    const cardId = filteredCards[currentIdx].id;
    onMarkCard(cardId, status);
    
    // Auto advance if there are more cards
    if (currentIdx < filteredCards.length - 1) {
      setTimeout(() => {
        nextCard();
      }, 300);
    }
  };

  // Format Python list for notebook compatibility
  const getPythonSyntaxString = (): string => {
    const listToFormat = filteredCards.length > 0 ? filteredCards : flashcards;
    const formattedCards = listToFormat
      .map((fc) => `    (${JSON.stringify(fc.question)}, ${JSON.stringify(fc.answer)})`)
      .join(",\n");
    return `cards = [\n${formattedCards}\n]`;
  };

  const handleCopyPython = () => {
    navigator.clipboard.writeText(getPythonSyntaxString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCard = filteredCards[currentIdx];
  const activeCardStatus = activeCard ? studyHistory[activeCard.id] : null;

  // Count items
  const reviewPoolCount = flashcards.filter((fc) => studyHistory[fc.id] === "review").length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Filters Bar & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
            Scope:
          </span>
          
          <button
            onClick={() => setSelectedDomain("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border ${
              selectedDomain === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Cards ({flashcards.length})
          </button>

          {domains.map((dom) => {
            const count = flashcards.filter((fc) => fc.domainId === dom.id).length;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border ${
                  selectedDomain === dom.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Domain {dom.number} ({count})
              </button>
            );
          })}

          <button
            onClick={() => setSelectedDomain("review-pool")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border flex items-center gap-1 ${
              selectedDomain === "review-pool"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Review Pool ({reviewPoolCount})
          </button>
        </div>

        <button
          onClick={onResetStudyHistory}
          className="text-[10px] font-bold text-slate-400 hover:text-red-600 hover:underline uppercase tracking-wider flex items-center gap-1 self-start md:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" /> Reset Statistics
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-sm shadow-xs flex flex-col items-center justify-center">
          <Award className="w-12 h-12 text-emerald-500 mb-3" />
          <h4 className="font-bold text-slate-800 text-base">Perfect Mastery!</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
            {selectedDomain === "review-pool" 
              ? "You have no cards marked for review in your pool! High-five. Keep testing yourself in other domains."
              : "No flashcards found matching this scope."}
          </p>
          {selectedDomain === "review-pool" && (
            <button
              onClick={() => setSelectedDomain("all")}
              className="mt-4 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-sm border border-blue-700 hover:bg-blue-700 transition-colors"
            >
              Study All Cards
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Playable Flashcard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 p-6 shadow-xs h-[420px]">
            
            {/* Card Progress Metrics */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                  Domain {domains.find(d => d.id === activeCard?.domainId)?.number || "?"} Card
                </span>
                {activeCardStatus === "known" && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase tracking-wider">
                    ★ Mastered
                  </span>
                )}
                {activeCardStatus === "review" && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 uppercase tracking-wider">
                    ⟲ Review Requested
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Card {currentIdx + 1} of {filteredCards.length}
              </div>
            </div>

            {/* Flip Card Stage */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`flex-1 flex flex-col justify-center items-center p-8 border rounded-sm cursor-pointer transition-all relative select-none ${
                isFlipped
                  ? "bg-slate-900 border-slate-800 text-white shadow-inner"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
              }`}
            >
              {/* Flip badge helper */}
              <div className={`absolute top-3 right-3 text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 ${
                isFlipped ? "text-slate-400" : "text-slate-500"
              }`}>
                <RefreshCw className="w-3 h-3 text-slate-400" /> {isFlipped ? "Flip to Question" : "Flip to Answer"}
              </div>

              <div className="text-center max-h-[180px] overflow-y-auto px-4">
                {isFlipped ? (
                  <p className="text-xs md:text-sm font-medium leading-relaxed font-sans text-slate-100 animate-fade-in whitespace-pre-wrap">
                    {activeCard.answer}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm font-bold leading-relaxed font-sans text-slate-800">
                    {activeCard.question}
                  </p>
                )}
              </div>

              <div className={`absolute bottom-3 text-[9px] font-semibold tracking-wider uppercase ${isFlipped ? 'text-slate-400' : 'text-slate-500'}`}>
                [ Tap Card to Flip ]
              </div>
            </div>

            {/* Active Recall Buttons */}
            <div className="mt-5 space-y-3 relative">
              {particles.map(p => (
                <ParticleEffect key={p.id} x={p.x} y={p.y} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => handleMark("review", e)}
                  className={`py-2 px-4 text-xs font-bold border rounded-sm flex items-center justify-center gap-1.5 transition-all ${
                    activeCardStatus === "review"
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200"
                  }`}
                >
                  ❌ I Got This Wrong (Send to Review Pool)
                </button>
                <button
                  onClick={(e) => handleMark("known", e)}
                  className={`py-2 px-4 text-xs font-bold border rounded-sm flex items-center justify-center gap-1.5 transition-all ${
                    activeCardStatus === "known"
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200"
                  }`}
                >
                  🚀 I Got This Right (Mark as Mastered)
                </button>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 italic">
                  Tips: Mastered cards increase your Exam Readiness score!
                </span>
                
                <div className="flex space-x-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={prevCard}
                    className="px-3 py-1 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[11px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    disabled={currentIdx === filteredCards.length - 1}
                    onClick={nextCard}
                    className="px-3 py-1 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[11px]"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Python Notebook Exporter (5 cols) */}
          <div className="lg:col-span-5 bg-[#1E293B] rounded-sm shadow-md flex flex-col overflow-hidden h-[420px]">
            <div className="bg-[#0F172A] px-4 py-2.5 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                <span className="text-[10px] text-slate-400 font-mono pl-1">
                  jupyter_recall_deck.py
                </span>
              </div>
              
              <button
                onClick={handleCopyPython}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono rounded transition-colors ${
                  copied
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> COPIED SNIPPET
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> COPY PYTHON LIST
                  </>
                )}
              </button>
            </div>

            <div className="p-4 font-mono text-[10.5px] leading-relaxed overflow-y-auto flex-1 text-slate-300 scrollbar-thin">
              <p className="text-slate-500 mb-2"># Copying code representing the current filtered subset ({filteredCards.length} cards)</p>
              <p className="text-[#FF9900] font-semibold">cards = [</p>
              {filteredCards.map((fc, i) => {
                const qShort = fc.question.length > 50 ? fc.question.slice(0, 50) + "..." : fc.question;
                const aShort = fc.answer.length > 40 ? fc.answer.slice(0, 40) + "..." : fc.answer;
                return (
                  <div key={fc.id} className="pl-4 text-emerald-400 py-0.5 hover:bg-slate-800/40 transition-colors rounded-xs" title={fc.question}>
                    (<span className="text-amber-300">"{qShort}"</span>, <span className="text-blue-300">"{aShort}"</span>),
                  </div>
                );
              })}
              <p className="text-[#FF9900] font-semibold">]</p>
              <p className="mt-4 text-slate-500"># Plug this inside your create_flashcard(cards) function!</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
