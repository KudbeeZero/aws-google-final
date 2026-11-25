import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Layers,
  BookOpen,
  Bot,
  AlertTriangle,
  Zap,
  Crown,
  Sparkles,
  Briefcase,
  HelpCircle,
  Database,
  Wallet,
  Cpu,
  Compass,
  Building2,
} from 'lucide-react';
import { DomainData, Flashcard, DistractorItem } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectDomain: (domainId: string) => void;
  domains: DomainData[];
  flashcards: Flashcard[];
  distractors: DistractorItem[];
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'Workspace' | 'Exam Domain' | 'Concept Card' | 'Distractor Trap';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectDomain,
  domains,
  flashcards,
  distractors,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const workspaceItems: SearchResult[] = useMemo(
    () => [
      { id: 'tab-dashboard', title: 'Today & Readiness Hub', subtitle: 'Daily smart sprint, streaks, and domain mastery', category: 'Workspace', icon: <Layers className="w-4 h-4 text-amber-500" />, action: () => onNavigateToTab('dashboard') },
      { id: 'tab-flashcards', title: 'Flashcard Deck', subtitle: 'Active recall cards across all CLF-C02 domains', category: 'Workspace', icon: <BookOpen className="w-4 h-4 text-blue-500" />, action: () => onNavigateToTab('flashcards') },
      { id: 'tab-professor', title: 'Socratic AI Professor', subtitle: 'Interactive reasoning tutor with voice narration', category: 'Workspace', icon: <Bot className="w-4 h-4 text-amber-500" />, action: () => onNavigateToTab('professor') },
      { id: 'tab-simulator', title: 'Exam Simulator', subtitle: 'CLF-C02 scenario trick questions & rationales', category: 'Workspace', icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, action: () => onNavigateToTab('simulator') },
      { id: 'tab-blueprint-lesson', title: 'AWS CLF-C02 Blueprint Lesson', subtitle: '6-chapter digital skyscraper audio & interactive masterclass', category: 'Workspace', icon: <Building2 className="w-4 h-4 text-[#FF9900]" />, action: () => onNavigateToTab('blueprint-lesson') },
      { id: 'tab-visual', title: 'Visual Architecture Studio', subtitle: 'Interactive 3-Tier VPC, Serverless & CDN topologies', category: 'Workspace', icon: <Compass className="w-4 h-4 text-indigo-500" />, action: () => onNavigateToTab('visual-architecture') },
      { id: 'tab-vault', title: 'The Distractor Vault', subtitle: 'Side-by-side comparisons of commonly confused AWS services', category: 'Workspace', icon: <HelpCircle className="w-4 h-4 text-sky-500" />, action: () => onNavigateToTab('vault') },
      { id: 'tab-matching', title: 'Scenario Matcher Game', subtitle: 'Timed AWS service matching challenge', category: 'Workspace', icon: <Zap className="w-4 h-4 text-amber-500" />, action: () => onNavigateToTab('matching') },
      { id: 'tab-lightning', title: 'Lightning Blitz & Loot', subtitle: '60-second rapid trivia sprint & daily mystery crates', category: 'Workspace', icon: <Sparkles className="w-4 h-4 text-amber-500" />, action: () => onNavigateToTab('lightning-rush') },
      { id: 'tab-slots', title: 'New Age Slot Machine', subtitle: 'Architectural synergy reels & Socratic bonus rounds', category: 'Workspace', icon: <Crown className="w-4 h-4 text-amber-500" />, action: () => onNavigateToTab('slots') },
      { id: 'tab-interview', title: 'HONE Interview Prep', subtitle: 'Technical defense mock interviews with AI scorecards', category: 'Workspace', icon: <Briefcase className="w-4 h-4 text-emerald-500" />, action: () => onNavigateToTab('interview') },
      { id: 'tab-agents', title: 'AI Agent Swarm Platform', subtitle: 'Multi-agent cloud architect & FinOps council', category: 'Workspace', icon: <Cpu className="w-4 h-4 text-emerald-500" />, action: () => onNavigateToTab('agents') },
      { id: 'tab-backup', title: 'Save Slots & Backups', subtitle: 'Export, import, and sync study snapshots', category: 'Workspace', icon: <Database className="w-4 h-4 text-indigo-500" />, action: () => onNavigateToTab('backup') },
      { id: 'tab-algorand', title: 'Algorand Web3 Portal', subtitle: 'Mint verifiable credential badges on TestNet', category: 'Workspace', icon: <Wallet className="w-4 h-4 text-yellow-500" />, action: () => onNavigateToTab('algorand') },
    ],
    [onNavigateToTab]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return workspaceItems.slice(0, 7);
    }

    const matchedWorkspaces = workspaceItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );

    const matchedDomains: SearchResult[] = domains
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.keyServices.some((s) => s.toLowerCase().includes(q))
      )
      .map((d) => ({
        id: `domain-${d.id}`,
        title: `Domain ${d.number}: ${d.name}`,
        subtitle: `Services: ${d.keyServices.slice(0, 4).join(', ')}`,
        category: 'Exam Domain',
        icon: <Layers className="w-4 h-4 text-indigo-500" />,
        action: () => onSelectDomain(d.id),
      }));

    const matchedCards: SearchResult[] = flashcards
      .filter(
        (fc) =>
          fc.question.toLowerCase().includes(q) ||
          fc.answer.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((fc) => ({
        id: `fc-${fc.id}`,
        title: fc.question.slice(0, 72) + (fc.question.length > 72 ? '...' : ''),
        subtitle: fc.answer.slice(0, 85),
        category: 'Concept Card',
        icon: <BookOpen className="w-4 h-4 text-blue-500" />,
        action: () => onSelectDomain(fc.domainId),
      }));

    const matchedDistractors: SearchResult[] = distractors
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.serviceA.toLowerCase().includes(q) ||
          item.serviceB.toLowerCase().includes(q) ||
          item.keyTrap.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((item) => ({
        id: `dist-${item.id}`,
        title: item.title,
        subtitle: item.keyTrap.slice(0, 85),
        category: 'Distractor Trap',
        icon: <HelpCircle className="w-4 h-4 text-sky-500" />,
        action: () => onNavigateToTab('vault'),
      }));

    return [...matchedWorkspaces, ...matchedDomains, ...matchedCards, ...matchedDistractors].slice(0, 10);
  }, [query, workspaceItems, domains, flashcards, distractors, onNavigateToTab, onSelectDomain]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    triggerHaptic('light');
    item.action();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/70 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to AWS service, study station, or exam domain..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close quick jump"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2.5 space-y-1">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching AWS services or modules found for "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/15 dark:bg-slate-900/10'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div
                        className={`text-xs truncate ${
                          isSelected
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-medium hidden sm:inline ${
                        isSelected
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>↑↓ to navigate · Enter to open</span>
          <span className="font-mono">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
