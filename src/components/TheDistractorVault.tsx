import React, { useState } from "react";
import { Search, ShieldAlert, BookOpen, Star, RefreshCw, HelpCircle, Layers } from "lucide-react";
import { DistractorItem } from "../types";

interface TheDistractorVaultProps {
  vaultItems: DistractorItem[];
}

export const TheDistractorVault: React.FC<TheDistractorVaultProps> = ({
  vaultItems,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get unique categories for filtering
  const categories: string[] = ["all", ...(Array.from(new Set(vaultItems.map((item) => item.category))) as string[])];

  // Filter items
  const filteredItems = vaultItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keyTrap.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Search and Category filters bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search services, traps, or key terms (e.g. Shield, Glacier)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] transition-colors bg-slate-50/50"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Displaying <span className="text-slate-800 font-bold">{filteredItems.length}</span> high-yield traps
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border ${
                selectedCategory === cat
                  ? "bg-[#FF9900] text-white border-[#FF9900] shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of vault items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-sm shadow-xs">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No traps found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
            Try adjusting your search criteria or categories to view other critical AWS exam service distinctions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white border border-slate-200 rounded-sm shadow-xs hover:shadow-sm hover:border-slate-300 transition-all overflow-hidden"
            >
              
              {/* Card Header Banner */}
              <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-4 bg-[#FF9900] rounded-sm shrink-0"></div>
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">
                    {item.title}
                  </h4>
                </div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#FF9900] bg-orange-50 px-2 py-0.5 border border-orange-100 rounded-sm self-start sm:self-auto">
                  {item.category}
                </span>
              </div>

              {/* Side-by-Side Service Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* Service A */}
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block font-mono">
                    OPTION A: {item.serviceA}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.serviceAUsage}
                  </p>
                </div>

                {/* Service B */}
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block font-mono">
                    OPTION B: {item.serviceB}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.serviceBUsage}
                  </p>
                </div>

              </div>

              {/* The Exam Trap Warning Banner (Crucial!) */}
              <div className="bg-amber-50/55 p-4 border-t border-slate-100 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold text-amber-800 uppercase tracking-wider block mb-0.5">
                    How to Tell Them Apart on the Exam (Trap exposed):
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {item.keyTrap}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
