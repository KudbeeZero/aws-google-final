import React, { useState, useEffect } from "react";
import { getLeaderboard, LeaderboardEntry } from "../lib/firebase";
import { Flame, Trophy, RefreshCw, Award, Crown } from "lucide-react";

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

  const fetchLeaderboard = async () => {
    setRefreshing(true);
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error("Leaderboard loading failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentStreak, currentUserId]); // Reload leaderboard when streak or user changes

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded-bl-sm flex items-center gap-1">
        <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
        <span>Global Rankings</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Global Streaks
          </h3>
          <button 
            onClick={fetchLeaderboard}
            disabled={refreshing}
            className={`p-1 text-slate-400 hover:text-slate-600 transition-all rounded ${refreshing ? "animate-spin" : ""}`}
            title="Refresh Leaderboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Top 5 learners maintaining the longest daily study streaks.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <RefreshCw className="w-6 h-6 text-[#FF9900] animate-spin" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retrieving Standings...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No leaderboard entries found yet.</p>
          <p className="text-[10px] text-slate-400 mt-1">Sign in and build your streak to be the first!</p>
        </div>
      ) : (
        <div className="space-y-2 flex-grow">
          {entries.map((entry, index) => {
            const isSelf = entry.userId === currentUserId;
            const rank = index + 1;

            // Define ranking style elements
            let rankBadge = null;
            if (rank === 1) {
              rankBadge = <Crown className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0" />;
            } else if (rank === 2) {
              rankBadge = <Award className="w-4 h-4 text-slate-400 shrink-0" />;
            } else if (rank === 3) {
              rankBadge = <Award className="w-4 h-4 text-amber-700 shrink-0" />;
            } else {
              rankBadge = <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">{rank}</span>;
            }

            return (
              <div 
                key={entry.userId}
                className={`flex items-center justify-between p-2 rounded-sm border transition-all ${
                  isSelf 
                    ? "bg-[#FF9900]/10 border-[#FF9900] shadow-[0_0_8px_rgba(255,153,0,0.1)] animate-pulse" 
                    : "bg-slate-50 border-slate-150/60 hover:bg-slate-100/70"
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
                      className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                      {entry.displayName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelf ? "text-slate-800 font-extrabold" : "text-slate-700"}`}>
                      {entry.displayName} {isSelf && <span className="text-[9px] text-[#FF9900] font-black uppercase ml-1">(You)</span>}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate uppercase tracking-tight font-semibold">
                      AWS Candidate
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold bg-white border border-slate-200/60 px-2 py-0.5 rounded shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400 shrink-0" />
                  <span className="text-slate-800 font-extrabold">{entry.streak}d</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Encouragement message */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
        <span>Your streak: <strong>{currentStreak} {currentStreak === 1 ? "day" : "days"}</strong></span>
        {currentUserId ? (
          <span className="text-[#FF9900] font-extrabold uppercase tracking-wider text-[9px]">Synced to Cloud</span>
        ) : (
          <span className="text-rose-500 font-semibold italic text-[9px]">Guest Mode (Offline)</span>
        )}
      </div>
    </div>
  );
};
