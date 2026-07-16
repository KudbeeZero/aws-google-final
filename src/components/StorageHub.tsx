import React, { useState, useEffect } from "react";
import { 
  Save, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  Calendar,
  Layers,
  ChevronRight,
  Database
} from "lucide-react";

interface StorageHubProps {
  studyHistory: { [key: string]: "known" | "review" | null };
  quizHistory: { [key: string]: boolean };
  onImportProgress: (study: any, quiz: any) => void;
  onClearAll: () => void;
}

interface SaveSlot {
  id: string;
  name: string;
  timestamp: string;
  studyCount: number;
  quizCount: number;
  studyHistory: any;
  quizHistory: any;
}

export const StorageHub: React.FC<StorageHubProps> = ({
  studyHistory,
  quizHistory,
  onImportProgress,
  onClearAll
}) => {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [slotNameInput, setSlotNameInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Load save slots from localStorage on mount
  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = () => {
    try {
      const savedSlots = localStorage.getItem("aws_study_save_slots");
      if (savedSlots) {
        setSlots(JSON.parse(savedSlots));
      } else {
        setSlots([]);
      }
    } catch (e) {
      console.error("Failed to load save slots", e);
    }
  };

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Save current progress to a slot
  const handleSaveToSlot = (slotId: string | null) => {
    const studyCount = Object.values(studyHistory).filter(v => v === "known").length;
    const quizCount = Object.values(quizHistory).filter(v => v === true).length;
    const timestamp = new Date().toLocaleString();

    let updatedSlots: SaveSlot[] = [...slots];

    if (slotId) {
      // Overwrite existing
      const index = updatedSlots.findIndex(s => s.id === slotId);
      if (index !== -1) {
        updatedSlots[index] = {
          ...updatedSlots[index],
          timestamp,
          studyCount,
          quizCount,
          studyHistory,
          quizHistory
        };
        triggerToast(`Overwrote progress in slot "${updatedSlots[index].name}"!`);
      }
    } else {
      // Create new slot
      const name = slotNameInput.trim() || `Study Run - ${new Date().toLocaleDateString()}`;
      const newSlot: SaveSlot = {
        id: `slot-${Date.now()}`,
        name,
        timestamp,
        studyCount,
        quizCount,
        studyHistory,
        quizHistory
      };
      updatedSlots.push(newSlot);
      setSlotNameInput("");
      triggerToast(`Saved progress to new slot "${name}"!`);
    }

    localStorage.setItem("aws_study_save_slots", JSON.stringify(updatedSlots));
    setSlots(updatedSlots);
  };

  // Load progress from a slot
  const handleLoadFromSlot = (slot: SaveSlot) => {
    if (window.confirm(`Are you sure you want to load "${slot.name}"? This will replace your current active workspace progress.`)) {
      onImportProgress(slot.studyHistory || {}, slot.quizHistory || {});
      triggerToast(`Loaded progress from "${slot.name}"!`);
    }
  };

  // Delete a save slot
  const handleDeleteSlot = (slotId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete save slot "${name}"? This action cannot be undone.`)) {
      const filtered = slots.filter(s => s.id !== slotId);
      localStorage.setItem("aws_study_save_slots", JSON.stringify(filtered));
      setSlots(filtered);
      triggerToast(`Deleted slot "${name}".`);
    }
  };

  // Export progress to a downloadable JSON file
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        studyHistory,
        quizHistory
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `aws_clf_c02_progress_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast("Downloaded backup file successfully!");
    } catch (e) {
      triggerToast("Export failed. Please try again.");
    }
  };

  // Import progress from local JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          const study = parsed.studyHistory || {};
          const quiz = parsed.quizHistory || {};
          
          onImportProgress(study, quiz);
          triggerToast("Successfully imported backup file!");
          
          // Reset file input value
          e.target.value = "";
        } else {
          setImportError("Invalid backup file format.");
        }
      } catch (err) {
        setImportError("Could not parse file. Ensure it is a valid backup JSON.");
      }
    };
    fileReader.readAsText(file);
  };

  const activeStudyCount = Object.values(studyHistory).filter(v => v === "known").length;
  const activeQuizCount = Object.values(quizHistory).filter(v => v === true).length;

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-6">
      
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 px-4 py-3 rounded-sm text-xs font-bold tracking-tight shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700">
            <Database className="w-5 h-5 text-[#FF9900]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
              Save Slots & Progress Backups
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Save progress profiles locally, or export standalone backup files to restore across devices.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Backup Buttons */}
          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            Export File (.json)
          </button>

          <label className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import Backup
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded text-[11px] font-semibold text-rose-600">
          {importError}
        </div>
      )}

      {/* Save Slots Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Save current active workspace */}
        <div className="md:col-span-1 bg-slate-50/50 border border-slate-200/60 p-4 rounded-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">
              Active Workspace
            </span>
            <h3 className="font-extrabold text-xs text-slate-800">
              Current Session Progress
            </h3>
            
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Cards Mastered:</span>
                <strong className="text-slate-800">{activeStudyCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Scenarios Correct:</span>
                <strong className="text-slate-800">{activeQuizCount}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Profile Run 1"
              value={slotNameInput}
              onChange={(e) => setSlotNameInput(e.target.value)}
              className="w-full border border-slate-200 p-2 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
            />
            <button
              onClick={() => handleSaveToSlot(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#FF9900]" />
              Save As New Profile
            </button>
          </div>
        </div>

        {/* Right column: List of existing local Save Slots */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">
            Stored Profile Slots ({slots.length} of 3)
          </span>

          {slots.length === 0 ? (
            <div className="border border-dashed border-slate-200 p-8 rounded-sm text-center space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">
                No local progress profiles saved yet. Use the sidebar input on the left to capture your current work.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => handleLoadFromSlot(slot)}
                  className="group border border-slate-200 hover:border-slate-300 bg-white p-3.5 rounded-sm flex items-center justify-between gap-4 transition-all cursor-pointer hover:shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FF9900]/10 border border-[#FF9900]/20 rounded p-1.5 text-[#FF9900]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-[#FF9900] transition-colors leading-tight">
                        {slot.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {slot.timestamp}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">{slot.studyCount} cards</span>
                        <span>•</span>
                        <span className="text-[#FF9900] font-bold">{slot.quizCount} quiz matches</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToSlot(slot.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded"
                      title="Overwrite with current progress"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSlot(slot.id, slot.name, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete profile slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Clear All Button */}
          <div className="flex justify-end">
            <button
              onClick={onClearAll}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 uppercase flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
