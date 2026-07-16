import React, { useMemo } from "react";
import { Calendar as CalendarIcon, CheckCircle, Circle, Flame } from "lucide-react";

interface MonthlyHeatmapProps {
  dailyMinutesLog?: { [dateKey: string]: number };
  dailyStudyGoal: number;
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({
  dailyMinutesLog = {},
  dailyStudyGoal,
}) => {
  const { daysToDisplay, streak, currentMonthName } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];
    
    // We will show the last 30 days
    let currentStreak = 0;
    let isStreakBroken = false;
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const mins = dailyMinutesLog[dateStr] || 0;
      const metGoal = mins >= dailyStudyGoal && dailyStudyGoal > 0;
      
      result.push({
        date: d,
        dateStr,
        mins,
        metGoal,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.getDay(),
      });
      
      if (i === 0) {
        // Today
        if (metGoal) {
          currentStreak++;
        }
      } else {
        if (metGoal && !isStreakBroken) {
          currentStreak++;
        } else if (!metGoal) {
          isStreakBroken = true;
        }
      }
    }
    
    return {
      daysToDisplay: result,
      streak: currentStreak,
      currentMonthName: today.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }, [dailyMinutesLog, dailyStudyGoal]);

  const daysOfWeekLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // Helper to chunk the days into weeks
  const getWeeks = () => {
    const weeks = [];
    let currentWeek: any[] = Array(7).fill(null);
    let firstDayIndex = daysToDisplay[0].dayOfWeek;
    
    daysToDisplay.forEach((day, index) => {
      const dayIndex = day.dayOfWeek;
      currentWeek[dayIndex] = day;
      
      if (dayIndex === 6 || index === daysToDisplay.length - 1) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    });
    
    return weeks;
  };

  const weeks = getWeeks();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF9900]/10 text-[#FF9900] p-2 rounded-xs dark:bg-[#FF9900]/5">
            <CalendarIcon className="w-5 h-5 text-[#FF9900]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              30-Day Heatmap
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track your consistency over the last month.
            </p>
          </div>
        </div>
        
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 px-3 py-1.5 rounded-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400">{streak} Day Streak!</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center pt-2">
        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-[600px] flex gap-2">
            {daysToDisplay.map((day, i) => {
              const intensity = day.mins === 0 ? 0 : 
                                day.mins >= dailyStudyGoal ? 4 : 
                                day.mins >= dailyStudyGoal * 0.5 ? 3 : 
                                day.mins >= dailyStudyGoal * 0.25 ? 2 : 1;
              
              let bgColorClass = "bg-slate-100 dark:bg-slate-800";
              if (intensity === 4) bgColorClass = "bg-[#FF9900]";
              else if (intensity === 3) bgColorClass = "bg-[#FF9900]/80";
              else if (intensity === 2) bgColorClass = "bg-[#FF9900]/50";
              else if (intensity === 1) bgColorClass = "bg-[#FF9900]/30";
              
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs ${bgColorClass} flex-shrink-0 relative group`}
                  title={`${day.dateStr}: ${day.mins} mins`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-sm pointer-events-none whitespace-nowrap z-10">
                    {day.dateStr} <br/> 
                    {day.mins} mins
                    {day.metGoal && " (Goal Met!)"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end w-full gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>Less</span>
          <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800"></div>
          <div className="w-3 h-3 rounded-xs bg-[#FF9900]/30"></div>
          <div className="w-3 h-3 rounded-xs bg-[#FF9900]/50"></div>
          <div className="w-3 h-3 rounded-xs bg-[#FF9900]/80"></div>
          <div className="w-3 h-3 rounded-xs bg-[#FF9900]"></div>
          <span>Goal Met</span>
        </div>
      </div>
    </div>
  );
};
