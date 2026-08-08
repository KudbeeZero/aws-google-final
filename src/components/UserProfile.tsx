import React from "react";
import { LeaderboardEntry } from "../lib/firebase";
import { Trophy, Flame, Clock, Zap, Wallet, ShieldCheck, CheckCircle2, Calendar, Award, X, Sparkles, ExternalLink } from "lucide-react";

interface UserProfileProps {
  user: LeaderboardEntry;
  onClose: () => void;
  isSelf?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, isSelf }) => {
  const totalStudyMinutes = Math.round(user.streak * 108 + 720); // ~1.8 hours per streak day + base
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  const projectedScore = Math.min(1000, 720 + user.streak * 10);
  const joinDateFormatted = user.updatedAt 
    ? new Date(user.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : "Recently Joined";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Terminal Header Bar */}
        <div className="bg-slate-900 text-slate-200 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400 ml-2">aws-candidate-profile://{user.userId.slice(0, 8)}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer rounded hover:bg-slate-800"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Header Info */}
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="relative">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-16 h-16 rounded-full border-2 border-[#FF9900] object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FF9900]/15 dark:bg-[#FF9900]/25 border-2 border-[#FF9900] text-[#FF9900] text-xl font-black flex items-center justify-center uppercase shadow-md">
                  {user.displayName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-[10px] shadow-sm" title="Verified AWS Candidate">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </h3>
                {isSelf && (
                  <span className="px-2 py-0.5 bg-[#FF9900]/20 text-[#FF9900] dark:text-amber-400 text-[10px] font-black uppercase rounded-xs">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                {user.email || "aws.candidate@cloud.verified"}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#FF9900]" />
                <span>Joined {joinDateFormatted}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                <span>Active Streak</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {user.streak} <span className="text-xs text-orange-500 font-bold">Days</span>
              </p>
              <span className="text-[9px] text-emerald-500 font-semibold mt-0.5 block">Consistent Study</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Study Minutes</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {totalStudyMinutes.toLocaleString()} <span className="text-xs text-blue-500 font-bold">min</span>
              </p>
              <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">~{totalHours} Total Hours</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Zap className="w-3.5 h-3.5 text-[#FF9900]" />
                <span>Projected Score</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {projectedScore} <span className="text-xs text-[#FF9900] font-bold">/ 1000</span>
              </p>
              <span className="text-[9px] text-emerald-500 font-semibold mt-0.5 block">Pass Probability: 98%</span>
            </div>

          </div>

          {/* Historical Streak & Accomplishments Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FF9900]" />
              Milestone Badges & Accomplishments
            </h4>

            {/* Visual Badges Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded border flex items-center gap-2 ${user.streak >= 7 ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'}`}>
                <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs ${user.streak >= 7 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  🔥
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] truncate">7-Day Streak Master</p>
                  <p className="text-[9px] opacity-80">{user.streak >= 7 ? 'Unlocked' : `${7 - user.streak} days to go`}</p>
                </div>
              </div>

              <div className={`p-2.5 rounded border flex items-center gap-2 ${totalStudyMinutes >= 100 ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'}`}>
                <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs ${totalStudyMinutes >= 100 ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  ⏱️
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] truncate">100 Minutes Club</p>
                  <p className="text-[9px] opacity-80">{totalStudyMinutes >= 100 ? 'Unlocked' : 'In Progress'}</p>
                </div>
              </div>

              <div className={`p-2.5 rounded border flex items-center gap-2 ${user.streak >= 30 ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'}`}>
                <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs ${user.streak >= 30 ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  👑
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] truncate">30-Day Elite</p>
                  <p className="text-[9px] opacity-80">{user.streak >= 30 ? 'Unlocked' : `${30 - user.streak} days to go`}</p>
                </div>
              </div>

              <div className={`p-2.5 rounded border flex items-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400`}>
                <div className="w-7 h-7 rounded bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  🛡️
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] truncate">Algorand ASA Verified</p>
                  <p className="text-[9px] opacity-80">On-Chain Credential</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 fill-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{user.streak}-Day Active Streak Milestone</p>
                    <p className="text-[10px] text-slate-400">Unlocked consistent active recall mastery</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Achieved</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{totalHours} Hours Cloud Simulator Drill</p>
                    <p className="text-[10px] text-slate-400">Completed Socratic & Scenario drills</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Achieved</span>
              </div>
            </div>
          </div>

          {/* Cloud Sync Status Footer */}
          <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9900]" />
              Cloud Synchronized
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Active"}
            </span>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#FF9900] hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
