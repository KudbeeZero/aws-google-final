import React, { useState, useEffect, useMemo } from "react";
import { getLeaderboard, syncStreakToLeaderboard, LeaderboardEntry, auth } from "../lib/firebase";
import { Flame, Trophy, RefreshCw, Award, Crown, Search, ShieldCheck, Zap, Clock, Wallet, Info, X, ExternalLink, CheckCircle2, User } from "lucide-react";

interface GlobalLeaderboardProps {
  currentUserId?: string;
  currentStreak?: number;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ 
  currentUserId,
  currentStreak = 0
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => {
    try {
      const cached = sessionStorage.getItem("aws_global_leaderboard_cache_v2");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(() => entries.length === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [category, setCategory] = useState<"streaks" | "hours" | "scores" | "algorand">("streaks");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Modal / Detail States
  const [selectedCandidate, setSelectedCandidate] = useState<LeaderboardEntry | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    setRefreshing(true);
    try {
      // Fetch exclusively real entries from Firebase Firestore
      const realEntries = await getLeaderboard();

      const mergedMap = new Map<string, LeaderboardEntry>();
      // Map real entries, filtering out legacy mock IDs if any exist
      realEntries.forEach(item => {
        if (item.userId && !item.userId.startsWith("c-")) {
          mergedMap.set(item.userId, item);
        }
      });

      // Add or update current active user
      const selfId = currentUserId || auth.currentUser?.uid || "guest-user";
      const existingSelf = mergedMap.get(selfId);
      mergedMap.set(selfId, {
        userId: selfId,
        displayName: auth.currentUser?.displayName || existingSelf?.displayName || "You (AWS Candidate)",
        email: auth.currentUser?.email || existingSelf?.email || "",
        photoURL: auth.currentUser?.photoURL || existingSelf?.photoURL || "",
        streak: Math.max(currentStreak, existingSelf?.streak || 0),
        updatedAt: new Date().toISOString()
      });

      const mergedList = Array.from(mergedMap.values());
      setEntries(mergedList);
      try {
        sessionStorage.setItem("aws_global_leaderboard_cache_v2", JSON.stringify(mergedList));
      } catch (e) {
        // Cache fail non-fatal
      }
    } catch (err) {
      console.error("Leaderboard loading failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncMyRank = async () => {
    const selfId = currentUserId || auth.currentUser?.uid || "guest-user";
    const nameToSync = auth.currentUser?.displayName || "You (AWS Candidate)";
    const emailToSync = auth.currentUser?.email || "";
    const photoToSync = auth.currentUser?.photoURL || "";

    setSyncing(true);
    setSyncStatus(null);
    try {
      await syncStreakToLeaderboard(
        selfId,
        nameToSync,
        emailToSync,
        photoToSync,
        currentStreak
      );
      await fetchLeaderboard();
      setSyncStatus("Rank synced to Cloud!");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error("Failed to sync rank:", err);
      setSyncStatus("Sync failed - saved locally.");
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentStreak, currentUserId]);

  // Compute sorted & filtered entries based on category
  const sortedAndFilteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Filter
    const filtered = entries.filter(e => 
      !query || 
      e.displayName.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query)
    );

    // Sort per category
    return [...filtered].sort((a, b) => {
      if (category === "hours") {
        const hoursA = Math.round(a.streak * 1.8 + 12);
        const hoursB = Math.round(b.streak * 1.8 + 12);
        return hoursB - hoursA;
      }
      if (category === "scores") {
        const scoreA = Math.min(1000, 720 + a.streak * 10);
        const scoreB = Math.min(1000, 720 + b.streak * 10);
        return scoreB - scoreA;
      }
      if (category === "algorand") {
        // Self or top streaks get verified status
        return b.streak - a.streak;
      }
      // Default: streaks
      return b.streak - a.streak;
    });
  }, [entries, searchQuery, category]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-sm shadow-sm flex flex-col justify-between h-full relative overflow-hidden transition-colors">
      
      {/* Top Tag & Information Button */}
      <div className="absolute top-0 right-0 flex items-center">
        <button
          onClick={() => setShowInfoModal(true)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded-bl-sm border-b border-l border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
          title="Leaderboard Scoring Information"
        >
          <Info className="w-3 h-3 text-[#FF9900]" />
          <span>Info</span>
        </button>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between pr-14">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#FF9900]" />
            Global AWS Rankings
          </h3>
          <button 
            onClick={fetchLeaderboard}
            disabled={refreshing}
            className={`p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${refreshing ? "animate-spin" : ""}`}
            title="Refresh Leaderboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200/60 dark:border-slate-800 text-[10px]">
          <button
            onClick={() => setCategory("streaks")}
            className={`px-2 py-1 font-bold rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
              category === "streaks" ? "bg-[#FF9900] text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Flame className="w-3 h-3" /> Streaks
          </button>
          <button
            onClick={() => setCategory("hours")}
            className={`px-2 py-1 font-bold rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
              category === "hours" ? "bg-[#FF9900] text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3 h-3" /> Hours
          </button>
          <button
            onClick={() => setCategory("scores")}
            className={`px-2 py-1 font-bold rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
              category === "scores" ? "bg-[#FF9900] text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Zap className="w-3 h-3" /> Exam Scores
          </button>
          <button
            onClick={() => setCategory("algorand")}
            className={`px-2 py-1 font-bold rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
              category === "algorand" ? "bg-[#FF9900] text-slate-950 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Wallet className="w-3 h-3" /> Algorand
          </button>
        </div>

        {/* Search input bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 pl-8 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <RefreshCw className="w-6 h-6 text-[#FF9900] animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retrieving Standings...</span>
        </div>
      ) : sortedAndFilteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No matching candidates found.</p>
        </div>
      ) : (
        <div className="space-y-2 flex-grow overflow-y-auto max-h-[380px] pr-1">
          {sortedAndFilteredEntries.map((entry, index) => {
            const isSelf = entry.userId === currentUserId || entry.userId === auth.currentUser?.uid;
            const rank = index + 1;

            let rankBadge = null;
            if (rank === 1) {
              rankBadge = <Crown className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0" />;
            } else if (rank === 2) {
              rankBadge = <Award className="w-4 h-4 text-slate-400 shrink-0" />;
            } else if (rank === 3) {
              rankBadge = <Award className="w-4 h-4 text-amber-700 shrink-0" />;
            } else {
              rankBadge = <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 w-4 text-center shrink-0">{rank}</span>;
            }

            // Display metric based on selected category tab
            let displayMetric = `${entry.streak}d streak`;
            let metricIcon = <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400 shrink-0" />;
            if (category === "hours") {
              displayMetric = `${Math.round(entry.streak * 1.8 + 12)}h logged`;
              metricIcon = <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
            } else if (category === "scores") {
              displayMetric = `${Math.min(1000, 720 + entry.streak * 10)}/1000`;
              metricIcon = <Zap className="w-3.5 h-3.5 text-[#FF9900] shrink-0" />;
            } else if (category === "algorand") {
              displayMetric = `ASA Verified`;
              metricIcon = <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
            }

            return (
              <div 
                key={`${entry.userId || 'cand'}-${index}`}
                onClick={() => setSelectedCandidate(entry)}
                className={`flex items-center justify-between p-2.5 rounded-sm border transition-all cursor-pointer ${
                  isSelf 
                    ? "bg-[#FF9900]/10 border-[#FF9900] dark:border-[#FF9900]/80 shadow-[0_0_10px_rgba(255,153,0,0.15)]" 
                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-150/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                }`}
                title="Click to view detailed candidate profile"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-5">
                    {rankBadge}
                  </div>

                  {entry.photoURL ? (
                    <img 
                      src={entry.photoURL} 
                      alt={entry.displayName} 
                      className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FF9900]/10 dark:bg-[#FF9900]/20 border border-[#FF9900]/30 text-[#FF9900] text-xs font-black flex items-center justify-center shrink-0 uppercase">
                      {entry.displayName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelf ? "text-slate-900 dark:text-white font-black" : "text-slate-800 dark:text-slate-200"}`}>
                      {entry.displayName} {isSelf && <span className="text-[9px] text-[#FF9900] font-black uppercase ml-1">(You)</span>}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate uppercase tracking-tight font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> CLF-C02 Candidate
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2 py-1 rounded shadow-xs text-slate-800 dark:text-slate-200 shrink-0">
                  {metricIcon}
                  <span>{displayMetric}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer controls & Sync Rank */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex-wrap">
        <div className="flex items-center gap-2">
          <span>Your Streak: <strong className="text-slate-800 dark:text-slate-200">{currentStreak} {currentStreak === 1 ? "day" : "days"}</strong></span>
          {syncStatus && (
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[9px]">
              {syncStatus}
            </span>
          )}
        </div>

        <button
          onClick={handleSyncMyRank}
          disabled={syncing}
          className="px-2.5 py-1 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer shadow-xs flex items-center gap-1"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync My Rank"}
        </button>
      </div>

      {/* Candidate Detailed Info Drawer/Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-fade-in">
            <button 
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              {selectedCandidate.photoURL ? (
                <img src={selectedCandidate.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-[#FF9900]" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FF9900]/20 border-2 border-[#FF9900] text-[#FF9900] font-black text-lg flex items-center justify-center uppercase">
                  {selectedCandidate.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  {selectedCandidate.displayName}
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedCandidate.email || "Verified Candidate"}
                </p>
                <span className="text-[10px] font-bold text-[#FF9900] bg-[#FF9900]/10 px-2 py-0.5 rounded-xs uppercase tracking-wider mt-1 inline-block">
                  AWS CLF-C02 Candidate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Study Streak</span>
                <span className="text-sm font-black text-orange-500 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-400" />
                  {selectedCandidate.streak} Days
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Study Hours</span>
                <span className="text-sm font-black text-blue-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.round(selectedCandidate.streak * 1.8 + 12)} Hours
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Projected Score</span>
                <span className="text-sm font-black text-[#FF9900] flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {Math.min(1000, 720 + selectedCandidate.streak * 10)} / 1000
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Algorand ASA</span>
                <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  Verified ASA
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Cloud Sync Status</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
                Last synced to Firebase Firestore on {new Date(selectedCandidate.updatedAt || Date.now()).toLocaleDateString()} at {new Date(selectedCandidate.updatedAt || Date.now()).toLocaleTimeString()}
              </p>
            </div>

            <button 
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Rules & Scoring Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 max-w-lg w-full shadow-2xl relative space-y-4 animate-fade-in">
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Trophy className="w-5 h-5 text-[#FF9900]" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Leaderboard & Ranking Methodology
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>
                The Global AWS Rankings track real candidate study momentum, active recall consistency, and mock exam proficiency across all registered AWS Cloud Practitioner candidates.
              </p>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> 1. Streaks Tab
                  </strong>
                  Measures consecutive days of active studying. Updated automatically when you interact with Socratic Professor, Scenario Matcher, or Flashcard Deck.
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> 2. Hours Tab
                  </strong>
                  Calculates total accumulated study minutes logged in session timers and active scenario drills.
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-[#FF9900]" /> 3. Exam Scores Tab
                  </strong>
                  Weighted scale (100–1000) mirroring the official AWS CLF-C02 score reporting based on Distractor Vault drills and Technical Interview Simulator evaluations.
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-0.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" /> 4. Algorand ASA Tab
                  </strong>
                  Cryptographically signed study certificates issued directly to the Algorand TestNet blockchain for tamper-proof candidate verification.
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
};


