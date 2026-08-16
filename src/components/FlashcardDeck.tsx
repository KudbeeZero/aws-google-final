import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Copy, Check, RefreshCw, ChevronLeft, ChevronRight, Award, Trash2, 
  Flame, Star, Volume2, VolumeX, Shuffle, Search, Plus, X, 
  Grid, CreditCard, Sparkles, Filter, Eye, EyeOff, BookOpen, Layers
} from "lucide-react";
import { Flashcard, DomainData } from "../types";
import { ParticleEffect } from "./ParticleEffect";
import { InteractiveKnowledgeCheck } from "./InteractiveKnowledgeCheck";

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  domains: DomainData[];
  studyHistory: { [key: string]: "known" | "review" | null };
  onMarkCard: (id: string, status: "known" | "review") => void;
  onResetStudyHistory: () => void;
  initialDomainId: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  flashcards: initialSystemFlashcards,
  domains,
  studyHistory,
  onMarkCard,
  onResetStudyHistory,
  initialDomainId,
}) => {
  // Custom user cards persisted in localStorage
  const [customCards, setCustomCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem("aws_custom_flashcards_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Combine system + custom cards
  const allCards = useMemo(() => {
    return [...initialSystemFlashcards, ...customCards];
  }, [initialSystemFlashcards, customCards]);

  // State management
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomainId || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unstudied" | "known" | "review">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deckOrder, setDeckOrder] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState<"deck" | "grid" | "code">("deck");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [expandedGridCards, setExpandedGridCards] = useState<{ [key: string]: boolean }>({});
  const [particles, setParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Modal form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newDomainId, setNewDomainId] = useState("cloud-concepts");

  // Save custom cards
  useEffect(() => {
    try {
      localStorage.setItem("aws_custom_flashcards_v2", JSON.stringify(customCards));
    } catch (e) {
      console.warn("Failed to persist custom flashcards:", e);
    }
  }, [customCards]);

  // Filter flashcards based on domain, status filter, and search query
  const filteredCards = useMemo(() => {
    return allCards.filter((fc) => {
      // Domain filter
      if (selectedDomain === "review-pool") {
        if (studyHistory[fc.id] !== "review") return false;
      } else if (selectedDomain !== "all" && fc.domainId !== selectedDomain) {
        return false;
      }

      // Status filter
      const status = studyHistory[fc.id];
      if (statusFilter === "unstudied" && status !== null && status !== undefined) return false;
      if (statusFilter === "known" && status !== "known") return false;
      if (statusFilter === "review" && status !== "review") return false;

      // Keyword search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchQ = fc.question.toLowerCase().includes(query);
        const matchA = fc.answer.toLowerCase().includes(query);
        if (!matchQ && !matchA) return false;
      }

      return true;
    });
  }, [allCards, selectedDomain, statusFilter, searchQuery, studyHistory]);

  // Sync deck order when filtered cards change
  useEffect(() => {
    setDeckOrder(filteredCards.map((c) => c.id));
    setCurrentIdx(0);
    setIsFlipped(false);
  }, [filteredCards]);

  // Current active card
  const activeCard = useMemo(() => {
    if (filteredCards.length === 0) return null;
    const activeId = deckOrder[currentIdx];
    return filteredCards.find((c) => c.id === activeId) || filteredCards[currentIdx] || null;
  }, [filteredCards, deckOrder, currentIdx]);

  const activeCardStatus = activeCard ? studyHistory[activeCard.id] : null;

  // Deck statistics
  const totalInScope = filteredCards.length;
  const knownCount = allCards.filter((fc) => studyHistory[fc.id] === "known").length;
  const reviewPoolCount = allCards.filter((fc) => studyHistory[fc.id] === "review").length;
  const unstudiedCount = allCards.length - (knownCount + reviewPoolCount);

  const masteryPercent = allCards.length > 0 ? Math.round((knownCount / allCards.length) * 100) : 0;
  const reviewPercent = allCards.length > 0 ? Math.round((reviewPoolCount / allCards.length) * 100) : 0;
  const unstudiedPercent = Math.max(0, 100 - (masteryPercent + reviewPercent));

  // Speech synthesis
  const handleToggleSpeech = useCallback(() => {
    if (!activeCard) return;
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const textToSpeak = isFlipped 
          ? `Answer: ${activeCard.answer}`
          : `Question: ${activeCard.question}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [activeCard, isFlipped, isSpeaking]);

  // Cancel speech on card switch
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIdx, isFlipped]);

  // Card navigation
  const nextCard = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => {
        const next = prev < filteredCards.length - 1 ? prev + 1 : 0;
        if (next > 0 && next % 10 === 0) {
          setShowKnowledgeCheck(true);
        }
        return next;
      });
    }, 120);
  }, [filteredCards]);

  const prevCard = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
    }, 120);
  }, [filteredCards]);

  // Active recall mark
  const handleMark = useCallback((status: "known" | "review", e?: React.MouseEvent) => {
    if (!activeCard) return;

    if (status === "known" && e) {
      const newParticle = { id: Date.now().toString(), x: e.clientX, y: e.clientY };
      setParticles((prev) => [...prev, newParticle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1000);
    }

    onMarkCard(activeCard.id, status);

    // Auto advance to next card after marking
    if (currentIdx < filteredCards.length - 1) {
      setTimeout(() => {
        nextCard();
      }, 250);
    }
  }, [activeCard, currentIdx, filteredCards.length, nextCard, onMarkCard]);

  // Shuffle deck
  const handleShuffle = useCallback(() => {
    if (filteredCards.length <= 1) return;
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5).map((c) => c.id);
    setDeckOrder(shuffled);
    setCurrentIdx(0);
    setIsFlipped(false);
  }, [filteredCards]);

  // Keyboard hotkeys
  useEffect(() => {
    if (viewMode !== "deck") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        nextCard();
      } else if (e.code === "ArrowLeft" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        prevCard();
      } else if (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleMark("known");
      } else if (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        handleMark("review");
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, nextCard, prevCard, handleMark, handleShuffle]);

  // Python notebook snippet generator
  const getPythonSyntaxString = (): string => {
    const listToFormat = filteredCards.length > 0 ? filteredCards : allCards;
    const formattedCards = listToFormat
      .map((fc) => `    (${JSON.stringify(fc.question)}, ${JSON.stringify(fc.answer)})`)
      .join(",\n");
    return `# AWS CLF-C02 High-Yield Study Deck (${listToFormat.length} Cards)\ncards = [\n${formattedCards}\n]`;
  };

  const handleCopyPython = () => {
    const text = getPythonSyntaxString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn("Clipboard writeText error in FlashcardDeck:", err);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Custom Card Creation
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `custom-fc-${Date.now()}`,
      domainId: newDomainId,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };

    setCustomCards((prev) => [newCard, ...prev]);
    setNewQuestion("");
    setNewAnswer("");
    setShowCreateModal(false);
  };

  const handleDeleteCustomCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomCards((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleGridAnswer = (id: string) => {
    setExpandedGridCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner & Mastery Analytics */}
      <div className="bg-white border border-slate-200 p-5 shadow-xs rounded-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-150">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                AWS CLF-C02 Flashcards Engine
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-xs">
                {allCards.length} Total Cards
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive 3D active-recall deck with spaced repetition and hotkeys.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowKnowledgeCheck(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" /> Knowledge Check
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Flashcard
            </button>

            <button
              onClick={onResetStudyHistory}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-sm transition-all flex items-center gap-1 cursor-pointer"
              title="Reset study statistics"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Stats
            </button>
          </div>
        </div>

        {/* Live Segmented Progress Bar */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                Exam Readiness Progress ({masteryPercent}% Mastered)
              </span>
              <span className="text-slate-500 font-mono">
                {knownCount} Mastered • {reviewPoolCount} Review • {unstudiedCount} Unstudied
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-xs overflow-hidden flex border border-slate-200">
              <div 
                style={{ width: `${masteryPercent}%` }} 
                className="bg-emerald-500 transition-all duration-500" 
                title={`${knownCount} Mastered (${masteryPercent}%)`}
              />
              <div 
                style={{ width: `${reviewPercent}%` }} 
                className="bg-amber-500 transition-all duration-500" 
                title={`${reviewPoolCount} Review Pool (${reviewPercent}%)`}
              />
              <div 
                style={{ width: `${unstudiedPercent}%` }} 
                className="bg-slate-200 transition-all duration-500" 
                title={`${unstudiedCount} Unstudied (${unstudiedPercent}%)`}
              />
            </div>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="md:col-span-4 flex items-center justify-end gap-1">
            <button
              onClick={() => setViewMode("deck")}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border flex items-center gap-1.5 transition-all ${
                viewMode === "deck"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> 3D Deck
            </button>

            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border flex items-center gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Cheat Sheet
            </button>

            <button
              onClick={() => setViewMode("code")}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border flex items-center gap-1.5 transition-all ${
                viewMode === "code"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Copy className="w-3.5 h-3.5" /> Python Code
            </button>
          </div>
        </div>
      </div>

      {/* Scope Controls & Search Bar */}
      <div className="bg-white p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Domain Scope Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1">
            Domain:
          </span>

          <button
            onClick={() => setSelectedDomain("all")}
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all border ${
              selectedDomain === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Cards ({allCards.length})
          </button>

          {domains.map((dom) => {
            const count = allCards.filter((fc) => fc.domainId === dom.id).length;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-3 py-1 text-xs font-bold rounded-sm transition-all border ${
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
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-all border flex items-center gap-1.5 ${
              selectedDomain === "review-pool"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Review Pool ({reviewPoolCount})
          </button>
        </div>

        {/* Search & Status Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search flashcards (e.g. S3, EC2, IAM, Cost)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="unstudied">Unstudied Only</option>
              <option value="known">Mastered (★) Only</option>
              <option value="review">Needs Review (⟲) Only</option>
            </select>

            <button
              onClick={handleShuffle}
              disabled={filteredCards.length <= 1}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-sm border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
              title="Shuffle card deck"
            >
              <Shuffle className="w-3.5 h-3.5 text-slate-600" /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {filteredCards.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-sm shadow-xs flex flex-col items-center justify-center">
          <Award className="w-12 h-12 text-emerald-500 mb-3" />
          <h4 className="font-bold text-slate-800 text-base">Perfect Mastery or Empty Scope!</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
            {selectedDomain === "review-pool" 
              ? "You have zero cards in your Review Pool! Excellent job. Test yourself on other domains."
              : "No flashcards match your current search query or filter."}
          </p>
          <div className="flex gap-2 mt-4">
            {selectedDomain === "review-pool" && (
              <button
                onClick={() => setSelectedDomain("all")}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-sm border border-blue-700 hover:bg-blue-700 transition-colors"
              >
                Study All Cards
              </button>
            )}
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-sm border border-slate-900 hover:bg-slate-900 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "deck" && activeCard ? (
        /* -------------------------------------------------------------------------- */
        /* MODE 1: 3D INTERACTIVE CARD DECK                                          */
        /* -------------------------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12 space-y-4">
            
            {/* 3D Card Stage with CSS Perspective */}
            <div className="w-full h-[380px] sm:h-[400px] perspective-1000 relative">
              
              {/* Particle confetti effect */}
              {particles.map((p) => (
                <ParticleEffect key={p.id} x={p.x} y={p.y} />
              ))}

              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full h-full relative cursor-pointer select-none transition-transform duration-500 preserve-3d shadow-md rounded-md ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT FACE (QUESTION) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border-2 border-slate-700/80 rounded-md p-6 sm:p-8 flex flex-col justify-between text-white overflow-hidden shadow-xl">
                  {/* Watermark accent */}
                  <div className="absolute -right-12 -bottom-12 text-slate-800/20 font-black text-9xl pointer-events-none select-none font-mono">
                    AWS
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800/60 uppercase tracking-widest font-mono">
                        Domain {domains.find((d) => d.id === activeCard.domainId)?.number || "?"}: {domains.find((d) => d.id === activeCard.domainId)?.name || "AWS"}
                      </span>
                      {activeCard.id.startsWith("custom-") && (
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 border border-purple-800/60 uppercase tracking-wider">
                          Custom Card
                        </span>
                      )}
                      {activeCardStatus === "known" && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800/60 uppercase tracking-wider">
                          ★ Mastered
                        </span>
                      )}
                      {activeCardStatus === "review" && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 border border-amber-800/60 uppercase tracking-wider">
                          ⟲ Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleSpeech(); }}
                        className={`p-1.5 rounded-full transition-colors ${
                          isSpeaking ? "bg-amber-500 text-slate-950 animate-pulse" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                        title="Read question out loud"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {currentIdx + 1} / {totalInScope}
                      </span>
                    </div>
                  </div>

                  {/* Card Question Center */}
                  <div className="my-auto text-center px-2 sm:px-6 z-10 max-h-[220px] overflow-y-auto scrollbar-thin">
                    <p className="text-sm sm:text-lg font-bold leading-relaxed text-slate-100 font-sans tracking-wide">
                      {activeCard.question}
                    </p>
                  </div>

                  {/* Card Footer Prompt */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono z-10">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-blue-400 animate-spin-slow" /> Tap Card or press [Space] to reveal answer
                    </span>
                    <span className="hidden sm:inline text-slate-500">
                      AWS CLF-C02 High Yield
                    </span>
                  </div>
                </div>

                {/* BACK FACE (ANSWER) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border-2 border-blue-500 rounded-md p-6 sm:p-8 flex flex-col justify-between text-slate-900 overflow-hidden shadow-xl">
                  {/* Card Header */}
                  <div className="flex items-center justify-between z-10 pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-widest font-mono">
                      Official Exam Answer
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleSpeech(); }}
                        className={`p-1.5 rounded-full transition-colors ${
                          isSpeaking ? "bg-amber-500 text-slate-950 animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                        title="Read answer out loud"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {currentIdx + 1} / {totalInScope}
                      </span>
                    </div>
                  </div>

                  {/* Card Answer Body */}
                  <div className="my-auto text-left px-2 sm:px-4 z-10 max-h-[220px] overflow-y-auto scrollbar-thin space-y-2">
                    <p className="text-xs sm:text-base font-medium leading-relaxed text-slate-800 font-sans whitespace-pre-wrap">
                      {activeCard.answer}
                    </p>
                  </div>

                  {/* Card Footer Prompt */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono z-10">
                    <span className="flex items-center gap-1 text-blue-600 font-bold">
                      <RefreshCw className="w-3 h-3" /> Tap to flip back to question
                    </span>
                    <span>Rate your active recall below ↓</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Active Recall Action Controls */}
            <div className="bg-white p-4 border border-slate-200 shadow-xs rounded-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={(e) => handleMark("review", e)}
                  className={`py-3 px-4 text-xs font-bold rounded-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeCardStatus === "review"
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>I Got This Wrong (Send to Review Pool)</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">[R]</span>
                </button>

                <button
                  onClick={(e) => handleMark("known", e)}
                  className={`py-3 px-4 text-xs font-bold rounded-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeCardStatus === "known"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300"
                  }`}
                >
                  <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  <span>I Got This Right (Mark Mastered)</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">[K]</span>
                </button>
              </div>

              {/* Navigation Bar & Keyboard Hotkeys */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span className="font-bold text-slate-700">Shortcuts:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">[Space] Flip</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">[←/P] Prev</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">[→/N] Next</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">[K] Master</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">[R] Review</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prevCard}
                    className="px-3 py-1.5 rounded-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={nextCard}
                    className="px-4 py-1.5 rounded-sm border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* -------------------------------------------------------------------------- */
        /* MODE 2: CHEAT SHEET GRID CATALOG VIEW                                     */
        /* -------------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card, idx) => {
            const isKnown = studyHistory[card.id] === "known";
            const isReview = studyHistory[card.id] === "review";
            const isExpanded = !!expandedGridCards[card.id];

            return (
              <div
                key={card.id}
                className={`bg-white border p-4 rounded-sm shadow-xs space-y-3 transition-all ${
                  isKnown
                    ? "border-emerald-300 bg-emerald-50/20"
                    : isReview
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      Domain {domains.find((d) => d.id === card.domainId)?.number || "?"}
                    </span>
                    {isKnown && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        ★ Mastered
                      </span>
                    )}
                    {isReview && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        ⟲ Review
                      </span>
                    )}
                  </div>

                  {card.id.startsWith("custom-") && (
                    <button
                      onClick={(e) => handleDeleteCustomCard(card.id, e)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete custom card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {card.question}
                  </h4>
                </div>

                {isExpanded ? (
                  <div className="p-3 bg-slate-900 text-slate-100 text-xs leading-relaxed rounded-sm border border-slate-800 animate-fade-in font-sans whitespace-pre-wrap">
                    <div className="text-[9px] text-emerald-400 font-mono font-bold uppercase mb-1">
                      Answer Key:
                    </div>
                    {card.answer}
                  </div>
                ) : (
                  <button
                    onClick={() => toggleGridAnswer(card.id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Show Answer
                  </button>
                )}

                {isExpanded && (
                  <button
                    onClick={() => toggleGridAnswer(card.id)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Hide Answer
                  </button>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onMarkCard(card.id, "known")}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      isKnown ? "bg-emerald-600 text-white border-emerald-700" : "bg-slate-50 text-slate-600 hover:bg-emerald-50"
                    }`}
                  >
                    ★ Mastered
                  </button>
                  <button
                    onClick={() => onMarkCard(card.id, "review")}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      isReview ? "bg-amber-500 text-slate-950 border-amber-600" : "bg-slate-50 text-slate-600 hover:bg-amber-50"
                    }`}
                  >
                    ⟲ Needs Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* -------------------------------------------------------------------------- */
        /* MODE 3: PYTHON JUPYTER NOTEBOOK EXPORTER                                 */
        /* -------------------------------------------------------------------------- */
        <div className="bg-[#1E293B] rounded-sm shadow-md flex flex-col overflow-hidden h-[450px]">
          <div className="bg-[#0F172A] px-4 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs text-slate-300 font-mono pl-1 font-bold">
                aws_clf_c02_flashcards.py ({filteredCards.length} Cards in Scope)
              </span>
            </div>

            <button
              onClick={handleCopyPython}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors ${
                copied
                  ? "bg-emerald-600 text-white border border-emerald-500"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> COPIED SNIPPET
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> COPY PYTHON ARRAY
                </>
              )}
            </button>
          </div>

          <div className="p-4 font-mono text-xs leading-relaxed overflow-y-auto flex-1 text-slate-300 scrollbar-thin">
            <p className="text-slate-500 mb-2"># Copying code representing active filtered scope ({filteredCards.length} cards)</p>
            <p className="text-[#FF9900] font-bold">cards = [</p>
            {filteredCards.map((fc) => {
              const qShort = fc.question.length > 60 ? fc.question.slice(0, 60) + "..." : fc.question;
              const aShort = fc.answer.length > 50 ? fc.answer.slice(0, 50) + "..." : fc.answer;
              return (
                <div key={fc.id} className="pl-4 text-emerald-400 py-0.5 hover:bg-slate-800/40 transition-colors rounded-xs" title={fc.question}>
                  (<span className="text-amber-300">"{qShort}"</span>, <span className="text-blue-300">"{aShort}"</span>),
                </div>
              );
            })}
            <p className="text-[#FF9900] font-bold">]</p>
            <p className="mt-4 text-slate-500"># Plug this directly into your Python active-recall study script!</p>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM FLASHCARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 w-full max-w-lg p-6 rounded-sm shadow-2xl space-y-4 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Create Custom AWS Flashcard</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS Exam Domain:
                </label>
                <select
                  value={newDomainId}
                  onChange={(e) => setNewDomainId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-sm focus:outline-none focus:border-blue-500"
                >
                  {domains.map((dom) => (
                    <option key={dom.id} value={dom.id}>
                      Domain {dom.number}: {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question / Scenario:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Which AWS service provides a fully managed relational database with automated Multi-AZ failover?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 rounded-sm focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Answer & Key Takeaways:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Amazon RDS (or Amazon Aurora). It handles server provisioning, OS patching, backups, and failover."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 rounded-sm focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-sm shadow-xs transition-colors"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE KNOWLEDGE CHECK MODAL */}
      {showKnowledgeCheck && (
        <InteractiveKnowledgeCheck
          onClose={() => setShowKnowledgeCheck(false)}
          onComplete={(score) => {
            console.log("Knowledge check completed with score:", score);
          }}
        />
      )}

    </div>
  );
};
