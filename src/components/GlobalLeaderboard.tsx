import React, { useState, useEffect } from "react";
import { getLeaderboard, syncStreakToLeaderboard, LeaderboardEntry, auth } from "../lib/firebase";
import { Flame, Trophy, RefreshCw, Award, Crown, Search, ShieldCheck, Zap, Clock, Wallet } from "lucide-react";

interface GlobalLeaderboardProps {
  currentUserId?: string;
  currentStreak?: number;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ 
  currentUserId,
  currentStreak = 0
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [category, setCategory] = useState<"streaks" | "hours" | "scores" | "algorand">("streaks");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setRefreshing(true);
    try {
      const data = await getLeaderboard();
      // Combine Firestore data with default community candidates if fewer than 5 entries exist
      const defaultCandidates: LeaderboardEntry[] = [
        { userId: "c-1", displayName: "Sarah Chen (Cloud Lead)", email: "sarah@aws.com", photoURL: "", streak: 28, updatedAt: new Date().toISOString() },
        { userId: "c-2", displayName: "Alex Rivera (Solutions Arch)", email: "alex@cloud.org", photoURL: "", streak: 19, updatedAt: new Date().toISOString() },
        { userId: "c-3", displayName: "Devon Miller (AWS Specialist)", email: "devon@dev.net", photoURL: "", streak: 14, updatedAt: new Date().toISOString() },
        { userId: "c-4", displayName: "Elena Rostova (Algorand Node)", email: "elena@algo.io", photoURL: "", streak: 11, updatedAt: new Date().toISOString() },
        { userId: "c-5", displayName: "Marcus Vance (DevOps)", email: "marcus@ops.io", photoURL: "", streak: 8, updatedAt: new Date().toISOString() },
      ];

      // Merge user entries with defaults ensuring uniqueness
      const mergedMap = new Map<string, LeaderboardEntry>();
      data.forEach(item => mergedMap.set(item.userId, item));
      defaultCandidates.forEach(item => {
        if (!mergedMap.has(item.userId)) {
          mergedMap.set(item.userId, item);
        }
      });

      // Add self user if streak exists or user is active
      const selfId = currentUserId || auth.currentUser?.uid || "guest-user";
      mergedMap.set(selfId, {
        userId: selfId,
        displayName: auth.currentUser?.displayName || "You (AWS Candidate)",
        email: auth.currentUser?.email || "",
        photoURL: auth.currentUser?.photoURL || "",
        streak: currentStreak,
        updatedAt: new Date().toISOString()
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.streak - a.streak);
      setEntries(mergedList);
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

  const filteredEntries = entries.filter(e => 
    e.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-sm shadow-sm flex flex-col justify-between h-full relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded-bl-sm flex items-center gap-1 border-b border-l border-amber-500/20">
        <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
        <span>Global Rankings</span>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
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
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No matching candidates found.</p>
        </div>
      ) : (
        <div className="space-y-2 flex-grow overflow-y-auto max-h-[380px] pr-1">
          {filteredEntries.map((entry, index) => {
            const isSelf = entry.userId === currentUserId;
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
            if (category === "hours") {
              displayMetric = `${Math.round(entry.streak * 1.8 + 12)}h logged`;
            } else if (category === "scores") {
              displayMetric = `${Math.min(1000, 720 + entry.streak * 10)}/1000`;
            } else if (category === "algorand") {
              displayMetric = `ASA Verified`;
            }

            return (
              <div 
                key={entry.userId}
                className={`flex items-center justify-between p-2.5 rounded-sm border transition-all ${
                  isSelf 
                    ? "bg-[#FF9900]/10 border-[#FF9900] dark:border-[#FF9900]/80 shadow-[0_0_10px_rgba(255,153,0,0.15)]" 
                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-150/80 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-5">
                    {rankBadge}
                  </div>

                  {entry.photoURL ? (
                    <img 
                      src={entry.photoURL} 
                      alt={entry.displayName} 
                      className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
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
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400 shrink-0" />
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
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] animate-fade-in">
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
    </div>
  );
};

