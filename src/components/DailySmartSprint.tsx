import React, { useState, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Trophy,
  Clock,
  Headphones,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Flashcard, DomainData } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { addXP } from '../services/gamificationService';
import { useAudioLesson } from '../contexts/AudioLessonContext';

interface DailySmartSprintProps {
  flashcards: Flashcard[];
  domains: DomainData[];
  studyHistory: { [key: string]: 'known' | 'review' | null };
  onMarkCard: (cardId: string, status: 'known' | 'review') => void;
  onAddStudyMinutes: (mins: number) => void;
  onNavigateToTab: (tab: string) => void;
  readinessScore: number;
  streak: number;
}

const HERO_IMAGE_PATH = '/src/assets/images/study_studio_hero_1795367047967.jpg';

export const DailySmartSprint: React.FC<DailySmartSprintProps> = ({
  flashcards,
  domains,
  studyHistory,
  onMarkCard,
  onAddStudyMinutes,
  onNavigateToTab,
  readinessScore,
  streak,
}) => {
  const [sprintActive, setSprintActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sprintResults, setSprintResults] = useState<{ [id: string]: 'known' | 'review' }>({});
  const [sprintCompleted, setSprintCompleted] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(true);
  const [batchSeed, setBatchSeed] = useState(0);
  const { playLesson, playQueue, currentLesson, isPlaying } = useAudioLesson();

  // Build prioritized 5-card queue: review items first, then high-yield unseen cards, then reinforcement
  const sprintDeck = useMemo(() => {
    const reviewCards = flashcards.filter((c) => studyHistory[c.id] === 'review');
    const unseenHighYield = flashcards.filter(
      (c) => !studyHistory[c.id] && (c.domainId === 'domain-2' || c.domainId === 'domain-3')
    );
    const unseenRest = flashcards.filter(
      (c) => !studyHistory[c.id] && c.domainId !== 'domain-2' && c.domainId !== 'domain-3'
    );
    const knownCards = flashcards.filter((c) => studyHistory[c.id] === 'known');

    const combined = [...reviewCards, ...unseenHighYield, ...unseenRest, ...knownCards];
    const startOffset = (batchSeed * 5) % Math.max(1, combined.length);
    const rotated = [...combined.slice(startOffset), ...combined.slice(0, startOffset)];
    return rotated.slice(0, 5);
  }, [flashcards, studyHistory, batchSeed]);

  const currentCard = sprintDeck[currentIndex];
  const currentDomain = useMemo(
    () => domains.find((d) => d.id === currentCard?.domainId),
    [domains, currentCard]
  );

  const reviewQueueCount = useMemo(
    () => Object.values(studyHistory).filter((v) => v === 'review').length,
    [studyHistory]
  );

  const knownCount = useMemo(
    () => Object.values(studyHistory).filter((v) => v === 'known').length,
    [studyHistory]
  );

  const handleStartSprint = () => {
    triggerHaptic('medium');
    setCurrentIndex(0);
    setIsFlipped(false);
    setSprintResults({});
    setSprintCompleted(false);
    setSprintActive(true);
  };

  const handleAnswerCard = (status: 'known' | 'review') => {
    if (!currentCard) return;
    triggerHaptic(status === 'known' ? 'success' : 'light');
    onMarkCard(currentCard.id, status);

    const updated = { ...sprintResults, [currentCard.id]: status };
    setSprintResults(updated);

    if (currentIndex + 1 < sprintDeck.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      triggerHaptic('success');
      onAddStudyMinutes(3);
      addXP(75, 'Daily 5-Card Smart Sprint');
      setSprintCompleted(true);
    }
  };

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  if (sprintActive && !sprintCompleted && currentCard) {
    const progressPct = Math.round(((currentIndex + 1) / sprintDeck.length) * 100);

    return (
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => {
              triggerHaptic('light');
              setSprintActive(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit Sprint</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <button
              onClick={() => {
                const lessonId = `sprint-${currentCard.id}-${isFlipped ? 'a' : 'q'}`;
                playLesson(
                  {
                    id: lessonId,
                    title: isFlipped ? `Answer: ${currentCard.question.slice(0, 48)}` : currentCard.question.slice(0, 56),
                    module: 'Smart Sprint',
                    domainId: currentCard.domainId,
                    text: isFlipped
                      ? `Question: ${currentCard.question}. Verified Answer: ${currentCard.answer}`
                      : `Question: ${currentCard.question}`,
                  },
                  { toggleIfSame: true }
                );
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPlaying && currentLesson?.id.startsWith(`sprint-${currentCard.id}`)
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Listen to this sprint card"
            >
              {isPlaying && currentLesson?.id.startsWith(`sprint-${currentCard.id}`) ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isPlaying && currentLesson?.id.startsWith(`sprint-${currentCard.id}`) ? 'Pause' : 'Listen'}</span>
            </button>
            <span>
              Card {currentIndex + 1} of {sprintDeck.length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {currentDomain ? `Domain ${currentDomain.number}` : 'Core Concept'}
            </span>
          </div>
        </div>

        {/* Thin progress track */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Interactive Flip Card */}
        <div
          onClick={() => {
            triggerHaptic('light');
            setIsFlipped((f) => !f);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              triggerHaptic('light');
              setIsFlipped((f) => !f);
            }
          }}
          className="min-h-[210px] sm:min-h-[230px] rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none transition-colors hover:border-amber-400/60"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{isFlipped ? 'Verified Answer' : 'Question'}</span>
            <span>{isFlipped ? 'Tap to show question' : 'Tap to reveal answer'}</span>
          </div>

          <div className="my-auto py-4">
            <p className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed text-center max-w-2xl mx-auto">
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
          </div>

          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            {currentDomain?.name}
          </div>
        </div>

        {/* Ergonomic Thumb-Zone Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleAnswerCard('review')}
            className="min-h-[48px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span>Needs Review</span>
          </button>
          <button
            onClick={() => handleAnswerCard('known')}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Got It</span>
          </button>
        </div>
      </section>
    );
  }

  if (sprintActive && sprintCompleted) {
    const knownInSprint = Object.values(sprintResults).filter((v) => v === 'known').length;
    return (
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 text-center space-y-5 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Trophy className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Daily Smart Sprint Complete
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You mastered {knownInSprint} of {sprintDeck.length} concepts, logged 3 study minutes, and earned +75 XP.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setBatchSeed((s) => s + 1);
              handleStartSprint();
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Another 5 Cards</span>
          </button>
          <button
            onClick={() => {
              setSprintActive(false);
              onNavigateToTab('simulator');
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Test in Exam Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white shadow-sm">
      {heroLoaded && (
        <img
          src={HERO_IMAGE_PATH}
          alt="CloudMaster Study Studio"
          referrerPolicy="no-referrer"
          onError={() => setHeroLoaded(false)}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <span>Today&apos;s Focus</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {reviewQueueCount > 0 ? `${reviewQueueCount} cards queued for review` : '5 high-yield CLF-C02 concepts'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" /> 3 min
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Stay sharp with a 3-minute Smart Sprint
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Spaced-repetition review tailored to your blind spots across Security, Technology, and Cloud Economics — offline-ready whenever you have a spare moment.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleStartSprint}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start 5-Card Sprint</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigateToTab('simulator');
              }}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-sm inline-flex items-center gap-2 border border-white/15 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Practice Exam Traps</span>
            </button>

            <button
              onClick={() => {
                playQueue(
                  sprintDeck.map((card, i) => ({
                    id: `sprint-audio-${card.id}`,
                    title: `Sprint ${i + 1}: ${card.question.slice(0, 48)}`,
                    module: 'Smart Sprint Audio',
                    domainId: card.domainId,
                    text: `Concept ${i + 1}. Question: ${card.question}. Answer: ${card.answer}`,
                  }))
                );
              }}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-sm inline-flex items-center gap-2 border border-white/15 transition-colors cursor-pointer"
              title="Play continuous 5-card audio sprint"
            >
              <Headphones className="w-4 h-4 text-amber-300" />
              <span>Listen to Sprint</span>
            </button>
          </div>
        </div>

        {/* Apple Fitness-style Readiness Ring Card */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 self-start lg:self-center shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#F59E0B"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-white tabular-nums">
              {readinessScore}%
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-bold text-white text-sm">Exam Readiness</div>
            <div className="text-slate-300 tabular-nums">
              {knownCount} / {flashcards.length} cards mastered
            </div>
            <div className="text-amber-300 font-medium tabular-nums">
              {streak} {streak === 1 ? 'day' : 'days'} active streak
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
