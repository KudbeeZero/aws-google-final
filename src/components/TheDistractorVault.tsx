import React, { useState, useMemo, useCallback } from "react";
import { 
  Search, 
  ShieldAlert, 
  BookOpen, 
  Star, 
  RefreshCw, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Bookmark, 
  BookmarkCheck,
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  Check, 
  X,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import { DistractorItem } from "../types";
import { synthesizeFallbackSpeechAudio } from "../services/audioCacheService";

interface TheDistractorVaultProps {
  vaultItems: DistractorItem[];
  savedState?: any;
  onSaveState?: (state: any) => void;
}

export const TheDistractorVault: React.FC<TheDistractorVaultProps> = ({
  vaultItems,
  savedState,
  onSaveState
}) => {
  const [searchTerm, setSearchTerm] = useState(savedState?.searchTerm || "");
  const [selectedCategory, setSelectedCategory] = useState(savedState?.selectedCategory || "all");
  const [filterView, setFilterView] = useState<"all" | "flagged" | "mastered">(savedState?.filterView || "all");
  
  const [masteredIds, setMasteredIds] = useState<string[]>(savedState?.masteredIds || []);
  const [flaggedIds, setFlaggedIds] = useState<string[]>(savedState?.flaggedIds || []);
  
  // Interactive Trap Mini-Quiz active item
  const [activeQuizTrapId, setActiveQuizTrapId] = useState<string | null>(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState<"A" | "B" | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync state upward when user modifies bookmarks/filters
  const persistState = useCallback((updates: Partial<any>) => {
    if (onSaveState) {
      onSaveState({
        searchTerm,
        selectedCategory,
        filterView,
        masteredIds,
        flaggedIds,
        ...updates
      });
    }
  }, [searchTerm, selectedCategory, filterView, masteredIds, flaggedIds, onSaveState]);

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      persistState({ masteredIds: next });
      return next;
    });
  };

  const toggleFlagged = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlaggedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      persistState({ flaggedIds: next });
      return next;
    });
  };

  // Audio narration handler
  const handleNarrate = (item: DistractorItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSpeakingId === item.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    setActiveSpeakingId(item.id);
    const narrationText = `AWS Exam Distractor Trap. Comparing ${item.serviceA} versus ${item.serviceB}. ${item.serviceA}: ${item.serviceAUsage}. ${item.serviceB}: ${item.serviceBUsage}. Exam trap warning: ${item.keyTrap}`;
    synthesizeFallbackSpeechAudio(narrationText);

    // Reset speaking status after timeout
    setTimeout(() => {
      setActiveSpeakingId((current) => (current === item.id ? null : current));
    }, 15000);
  };

  const handleCopyTrap = (item: DistractorItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `📌 AWS Exam Distractor: ${item.title}\n• Option A (${item.serviceA}): ${item.serviceAUsage}\n• Option B (${item.serviceB}): ${item.serviceBUsage}\n⚠️ Exam Trap: ${item.keyTrap}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get unique categories for filtering
  const categories: string[] = useMemo(() => {
    return ["all", ...(Array.from(new Set(vaultItems.map((item) => item.category))) as string[])];
  }, [vaultItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return vaultItems.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keyTrap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

      const matchesFilterView = 
        filterView === "all" ? true :
        filterView === "flagged" ? flaggedIds.includes(item.id) :
        filterView === "mastered" ? masteredIds.includes(item.id) : true;

      return matchesSearch && matchesCategory && matchesFilterView;
    });
  }, [vaultItems, searchTerm, selectedCategory, filterView, flaggedIds, masteredIds]);

  const masteredCount = masteredIds.length;
  const totalCount = vaultItems.length;
  const masteryPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header & Mastery Stats Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-sm p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-[#FF9900]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FF9900] text-slate-950 font-black rounded-sm">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black tracking-tight text-white uppercase">
                The Distractor Vault
              </h2>
              <span className="text-[10px] font-mono font-bold bg-[#FF9900]/20 text-[#FF9900] px-2 py-0.5 rounded border border-[#FF9900]/30">
                CLF-C02 Trap Buster
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AWS exams purposely pair closely related services in multiple-choice answers to trick unprepared test-takers. Deconstruct core overlapping features and master high-yield keywords.
            </p>
          </div>

          {/* Mastery Progress Badge */}
          <div className="bg-slate-950/60 border border-slate-700/60 rounded-sm p-3 min-w-[200px] flex flex-col justify-center space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Traps Mastered
              </span>
              <span className="font-mono font-bold text-[#FF9900]">{masteredCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-[#FF9900] to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>{masteryPercentage}% Ready</span>
              <span>{flaggedIds.length} Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Category filters bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-sm shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search services, traps, or key terms (e.g. Shield, Glacier, NACL)..."
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                persistState({ searchTerm: val });
              }}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] transition-colors bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  persistState({ searchTerm: "" });
                }}
                className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick View Filter Tabs */}
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 p-1 rounded-sm bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => {
                setFilterView("all");
                persistState({ filterView: "all" });
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer ${
                filterView === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              All Traps ({vaultItems.length})
            </button>
            <button
              onClick={() => {
                setFilterView("flagged");
                persistState({ filterView: "flagged" });
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1 ${
                filterView === "flagged"
                  ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Bookmark className="w-3 h-3 text-amber-500" />
              Flagged ({flaggedIds.length})
            </button>
            <button
              onClick={() => {
                setFilterView("mastered");
                persistState({ filterView: "mastered" });
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1 ${
                filterView === "mastered"
                  ? "bg-emerald-600 text-white shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Mastered ({masteredIds.length})
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mr-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                persistState({ selectedCategory: cat });
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#FF9900] text-slate-950 font-bold border-[#FF9900] shadow-sm"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat === "all" ? "All Domains" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of vault items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-sm shadow-xs space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No exam traps match your filters</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try clearing your search query or switching your category view to explore all {vaultItems.length} curated AWS CLF-C02 service distinctions.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setFilterView("all");
              persistState({ searchTerm: "", selectedCategory: "all", filterView: "all" });
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredItems.map((item) => {
            const isMastered = masteredIds.includes(item.id);
            const isFlagged = flaggedIds.includes(item.id);
            const isSpeaking = activeSpeakingId === item.id;
            const isQuizOpen = activeQuizTrapId === item.id;

            return (
              <div 
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-sm shadow-xs transition-all overflow-hidden ${
                  isMastered
                    ? "border-emerald-500/40 dark:border-emerald-500/30"
                    : isFlagged
                    ? "border-amber-500/50 dark:border-amber-500/40"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                
                {/* Card Header Banner */}
                <div className="bg-slate-50 dark:bg-slate-950 px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-4 rounded-xs shrink-0 ${isMastered ? 'bg-emerald-500' : 'bg-[#FF9900]'}`} />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#FF9900] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 border border-orange-200 dark:border-orange-900/50 rounded-xs">
                      {item.category}
                    </span>

                    {/* Speech Narration Button */}
                    <button
                      onClick={(e) => handleNarrate(item, e)}
                      title="Listen to audio breakdown"
                      className={`p-1.5 rounded-xs transition-all border cursor-pointer ${
                        isSpeaking
                          ? "bg-amber-500 text-slate-950 border-amber-500 animate-pulse"
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Copy Trap Button */}
                    <button
                      onClick={(e) => handleCopyTrap(item, e)}
                      title="Copy trap summary"
                      className="p-1.5 rounded-xs bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Flag / Watchlist Button */}
                    <button
                      onClick={(e) => toggleFlagged(item.id, e)}
                      title={isFlagged ? "Remove from watchlist" : "Flag as high-risk trap"}
                      className={`p-1.5 rounded-xs transition-all border cursor-pointer ${
                        isFlagged
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                          : "bg-white dark:bg-slate-900 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                    </button>

                    {/* Mastered Toggle Button */}
                    <button
                      onClick={(e) => toggleMastered(item.id, e)}
                      title={isMastered ? "Mark as unmastered" : "Mark as mastered"}
                      className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                        isMastered
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500"
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isMastered ? 'fill-current' : ''}`} />
                      <span>{isMastered ? "Mastered" : "Mark Mastered"}</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Service Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                  
                  {/* Service A */}
                  <div className="p-4 sm:p-5 space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-mono">
                        OPTION A: {item.serviceA}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold">
                        Service A
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {item.serviceAUsage}
                    </p>
                  </div>

                  {/* Service B */}
                  <div className="p-4 sm:p-5 space-y-2 bg-purple-50/20 dark:bg-purple-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block font-mono">
                        OPTION B: {item.serviceB}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono font-bold">
                        Service B
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {item.serviceBUsage}
                    </p>
                  </div>

                </div>

                {/* The Exam Trap Warning Banner (Crucial!) */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider block text-[11px]">
                        How to Tell Them Apart on the Exam (Trap Exposed):
                      </span>
                      <button
                        onClick={() => {
                          if (isQuizOpen) {
                            setActiveQuizTrapId(null);
                            setQuizSelectedOption(null);
                            setQuizSubmitted(false);
                          } else {
                            setActiveQuizTrapId(item.id);
                            setQuizSelectedOption(null);
                            setQuizSubmitted(false);
                          }
                        }}
                        className="text-[10px] font-bold text-[#FF9900] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        {isQuizOpen ? "Hide Challenge" : "Test Me On This Trap"}
                      </button>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.keyTrap}
                    </p>
                  </div>
                </div>

                {/* Interactive Mini-Quiz Challenge for this Trap */}
                {isQuizOpen && (
                  <div className="bg-slate-900 border-t border-slate-800 p-4 text-white space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-yellow-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Exam Trap Quick Check
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Select the matching service</span>
                    </div>

                    <p className="text-xs text-slate-200">
                      <strong>Scenario:</strong> A company needs a solution with the following requirement: <em className="text-amber-300">"{item.serviceAUsage}"</em>. Which service should they choose?
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => !quizSubmitted && setQuizSelectedOption("A")}
                        disabled={quizSubmitted}
                        className={`p-3 rounded text-xs font-bold text-left border transition-all cursor-pointer ${
                          quizSelectedOption === "A"
                            ? quizSubmitted
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-[#FF9900] text-slate-950 border-[#FF9900]"
                            : quizSubmitted
                            ? "bg-slate-950/60 border-slate-800 text-slate-500 opacity-60"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="block text-[10px] font-mono text-slate-400 mb-0.5">Option A:</span>
                        {item.serviceA}
                      </button>

                      <button
                        onClick={() => !quizSubmitted && setQuizSelectedOption("B")}
                        disabled={quizSubmitted}
                        className={`p-3 rounded text-xs font-bold text-left border transition-all cursor-pointer ${
                          quizSelectedOption === "B"
                            ? quizSubmitted
                              ? "bg-rose-600 text-white border-rose-500"
                              : "bg-[#FF9900] text-slate-950 border-[#FF9900]"
                            : quizSubmitted
                            ? "bg-slate-950/60 border-slate-800 text-slate-500 opacity-60"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="block text-[10px] font-mono text-slate-400 mb-0.5">Option B:</span>
                        {item.serviceB}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-2 text-xs">
                          {quizSelectedOption === "A" ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Correct! You correctly identified {item.serviceA}.
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <X className="w-4 h-4" /> Tricked! {item.serviceB} is a distractor for this requirement.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Choose Option A or Option B</span>
                      )}

                      <div className="flex items-center gap-2">
                        {!quizSubmitted ? (
                          <button
                            onClick={() => {
                              if (quizSelectedOption) {
                                setQuizSubmitted(true);
                                if (quizSelectedOption === "A" && !masteredIds.includes(item.id)) {
                                  setMasteredIds((prev) => [...prev, item.id]);
                                  persistState({ masteredIds: [...masteredIds, item.id] });
                                }
                              }
                            }}
                            disabled={!quizSelectedOption}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-all cursor-pointer"
                          >
                            Verify Answer
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setQuizSelectedOption(null);
                              setQuizSubmitted(false);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded transition-all cursor-pointer"
                          >
                            Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
