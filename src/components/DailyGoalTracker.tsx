import React, { useState } from "react";
import { 
  Flame, 
  Target, 
  Plus, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  Sparkles,
  Sliders
} from "lucide-react";

interface DailyGoalTrackerProps {
  dailyStudyGoal: number;
  todayStudyMinutes: number;
  onUpdateDailyGoal: (mins: number) => void;
  onAddStudyMinutes: (mins: number) => void;
  onResetStudyMinutes: () => void;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  dailyStudyGoal,
  todayStudyMinutes,
  onUpdateDailyGoal,
  onAddStudyMinutes,
  onResetStudyMinutes
}) => {
  const [customGoal, setCustomGoal] = useState<string>(dailyStudyGoal.toString());
  const [customAddMins, setCustomAddMins] = useState<string>("10");

  const handleUpdateCustomGoal = (val: string) => {
    setCustomGoal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateDailyGoal(parsed);
    }
  };

  const handleAddCustomMinutes = () => {
    const parsed = parseInt(customAddMins, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onAddStudyMinutes(parsed);
      setCustomAddMins("10"); // Reset custom add
    }
  };

  // Calculations
  const percentage = Math.min(100, Math.round((todayStudyMinutes / dailyStudyGoal) * 100));
  const isGoalAchieved = todayStudyMinutes >= dailyStudyGoal;

  return (
    <div id="daily-study-goal-panel" className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-[#FF9900]/10 text-[#FF9900] p-2 rounded-xs shrink-0">
            <Target className="w-5 h-5 text-[#FF9900]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Daily Study Goal Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Maintain daily momentum. Set study targets and track real-time active study time.
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center self-start md:self-auto">
          {isGoalAchieved ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-sm border border-emerald-150 uppercase tracking-wide">
              <Flame className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 animate-pulse" />
              Goal Smashed!
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-sm border border-amber-150 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              In Progress
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Progress Display: 7 Cols */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded border border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest block">
              Today's Progress
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800 tracking-tight">
                {todayStudyMinutes}
              </span>
              <span className="text-sm text-slate-400 font-bold">
                / {dailyStudyGoal} minutes
              </span>
              <span className="text-xs font-black text-slate-500 ml-auto bg-slate-100 px-2 py-0.5 rounded">
                {percentage}% Done
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-[2px] border border-slate-200/50">
              <div 
                className="bg-gradient-to-r from-amber-500 to-[#FF9900] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
              <span>0% Start</span>
              {!isGoalAchieved ? (
                <span>{dailyStudyGoal - todayStudyMinutes} mins remaining to goal</span>
              ) : (
                <span className="text-emerald-600 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {todayStudyMinutes - dailyStudyGoal}m extra effort!
                </span>
              )}
              <span>100% Target</span>
            </div>
          </div>

          {/* Celebration / Motivational Block */}
          {isGoalAchieved ? (
            <div className="bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-sm flex items-start gap-3 text-emerald-800 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold leading-snug">
                  Fantastic consistency!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-normal">
                  You have surpassed your daily study goal. This level of active repetition is the exact key to crushing AWS trap questions.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-slate-200/40 p-3.5 rounded-sm text-slate-600 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Consistency builds neural connections. Complete active recall cards or run a session on the focus timer below to automatically track your time!
              </p>
            </div>
          )}
        </div>

        {/* Goal Settings & Manual Logs: 5 Cols */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          {/* Target Setter */}
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest block flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              Change Target Goal (mins)
            </span>
            
            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1">
              {[15, 30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  id={`goal-preset-${mins}`}
                  onClick={() => {
                    onUpdateDailyGoal(mins);
                    setCustomGoal(mins.toString());
                  }}
                  className={`py-1.5 text-[10px] font-bold font-mono rounded border transition-all cursor-pointer ${
                    dailyStudyGoal === mins 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Custom Goal Input */}
            <div className="flex gap-2">
              <input 
                id="custom-goal-input"
                type="number"
                min="1"
                max="480"
                value={customGoal}
                onChange={(e) => handleUpdateCustomGoal(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
                placeholder="Custom mins"
              />
              <span className="text-[11px] self-center text-slate-400 font-medium font-mono">mins / day</span>
            </div>
          </div>

          {/* Quick Manual Log */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest block flex items-center gap-1">
              <Plus className="w-3 h-3 text-slate-400" />
              Log Study Time Manually
            </span>

            {/* Quick addition increments */}
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 15, 30, 45].map(mins => (
                <button
                  key={mins}
                  id={`log-add-${mins}`}
                  onClick={() => onAddStudyMinutes(mins)}
                  className="py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-sm text-[10px] font-extrabold cursor-pointer transition-colors"
                >
                  +{mins}m
                </button>
              ))}
            </div>

            {/* Custom Add Minutes */}
            <div className="flex gap-2">
              <input 
                id="custom-add-minutes-input"
                type="number"
                min="1"
                max="180"
                value={customAddMins}
                onChange={(e) => setCustomAddMins(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
                placeholder="Custom mins to add"
              />
              <button 
                id="log-add-custom-btn"
                onClick={handleAddCustomMinutes}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                Log Time
              </button>
            </div>
          </div>

          {/* Quick Stats Clear/Reset */}
          <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 font-medium">
            <span>Progress resets automatically daily</span>
            <button
              id="reset-study-minutes-btn"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset today's study minutes to zero?")) {
                  onResetStudyMinutes();
                }
              }}
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              Reset Today
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
