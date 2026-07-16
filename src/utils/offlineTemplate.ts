export function getOfflineHtmlString(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AWS Certified Cloud Practitioner (CLF-C02) Offline Study Companion</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            awsOrange: '#FF9900',
            awsSquid: '#1E293B'
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace']
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    /* Custom thin scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    /* Perspective for 3D flip card effect */
    .perspective-1000 {
      perspective: 1000px;
    }
    
    /* Animated transition helpers */
    .transition-all-300 {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] text-slate-900 h-screen w-full flex flex-col overflow-hidden antialiased">

  <!-- Header -->
  <header class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-20">
    <div class="flex items-center space-x-3">
      <button onclick="toggleSidebar()" class="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-sm" title="Toggle Sidebar">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <div class="w-8 h-8 bg-slate-900 flex items-center justify-center rounded-sm font-black text-[#FF9900] text-xs border border-slate-800">
        AWS
      </div>
      <div class="flex flex-col">
        <span class="font-extrabold tracking-tight text-sm text-slate-900 flex items-center gap-1.5 leading-none">
          CLF-C02 STUDY COMPANION
          <svg class="w-4 h-4 text-amber-500 inline" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
        </span>
        <span class="text-[10px] text-slate-400 font-bold tracking-wide">Solutions Architect Interactive Training Suite (Offline Version)</span>
      </div>
    </div>

    <!-- Global Progress Indicators -->
    <div class="flex items-center space-x-4 sm:space-x-6">
      <div class="flex flex-col items-end">
        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Ready Score</span>
        <span class="text-sm font-black text-slate-800 flex items-center gap-1">
          <span id="header-readiness-percent">0%</span>
          <span id="header-readiness-dot" class="w-2 h-2 rounded-full bg-slate-300"></span>
        </span>
      </div>
      <div class="w-px h-8 bg-slate-200 hidden sm:block"></div>
      <div class="px-3 py-1 bg-[#FF9900]/10 text-[#FF9900] text-xs font-bold rounded-full border border-[#FF9900]/20 flex items-center gap-1">
        <span class="relative flex h-2 w-2 mr-0.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-[#FF9900]"></span>
        </span>
        OFFLINE READY
      </div>
    </div>
  </header>

  <!-- Navigation & Main Layout -->
  <div class="flex-1 flex min-h-0 relative">
    
    <!-- Left Sidebar -->
    <aside id="sidebar-panel" class="h-full border-r border-slate-200 bg-white transition-all duration-300 ease-in-out z-10 shrink-0 flex flex-col justify-between w-64">
      <div class="p-4 space-y-6">
        <div>
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 px-2">Core Workspace</span>
          <nav class="space-y-1">
            <button onclick="switchTab('dashboard')" id="btn-tab-dashboard" class="sidebar-tab w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left bg-slate-900 text-white shadow-sm">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path></svg>
              Dashboard
            </button>

            <button onclick="switchTab('flashcards')" id="btn-tab-flashcards" class="sidebar-tab w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
              Flashcards
            </button>

            <button onclick="switchTab('simulator')" id="btn-tab-simulator" class="sidebar-tab w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Exam Simulator
            </button>

            <button onclick="switchTab('vault')" id="btn-tab-vault" class="sidebar-tab w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold tracking-tight transition-all text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              The Distractor Vault
            </button>
          </nav>
        </div>

        <!-- Quick Progress Widget -->
        <div class="bg-slate-50/70 border border-slate-200/60 p-4 rounded-sm space-y-3">
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quick Progress</span>
          <div class="space-y-2">
            <div>
              <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Cards Mastered</span>
                <span id="quick-mastered-text" class="font-bold">0 / 12</span>
              </div>
              <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div id="quick-mastered-bar" class="bg-emerald-500 h-full" style="width: 0%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Quiz Scenarios</span>
                <span id="quick-quiz-text" class="font-bold">0 / 6</span>
              </div>
              <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div id="quick-quiz-bar" class="bg-[#FF9900] h-full" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1 bg-slate-50/50">
        <p class="font-bold text-slate-500">CLF-C02 Offline Suite</p>
        <p class="leading-snug">Designed for AWS Certified Cloud Practitioner mastery.</p>
      </div>
    </aside>

    <!-- Core Workspace Stage -->
    <main class="flex-1 p-6 min-h-0 overflow-y-auto">
      
      <!-- Top banner -->
      <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-sm flex items-start justify-between gap-4 shadow-sm mb-6 border border-slate-800 animate-fade-in">
        <div class="flex gap-3 items-start">
          <div class="bg-[#FF9900] text-slate-900 p-2 rounded-xs shrink-0">
            <svg class="w-4 h-4 fill-slate-900 text-slate-900" viewBox="0 0 24 24"><path d="M9.813 15.904L9 21l5.447-3.922L21 21l-1.813-5.096L24 10.5h-6.273L15.91-.01 14.09 10.5H7.817l6.273 5.404z"></path></svg>
          </div>
          <div>
            <h3 class="font-extrabold text-sm tracking-tight text-[#FF9900] uppercase">CLF-C02 Masterclass Interactive Simulator</h3>
            <p class="text-xs text-slate-300 leading-normal mt-0.5 max-w-2xl">
              Bypass the AWS exam trap questions! Tap into our active recall flip cards, test yourself in the scenario-based multiple choice engine, or search the Distractor Vault for core overlapping services.
            </p>
          </div>
        </div>
        <span class="text-[10px] font-mono font-bold text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/25 px-2.5 py-1 rounded-sm shrink-0 uppercase tracking-widest hidden md:inline-block">
          Offline Bundle
        </span>
      </div>

      <!-- Dynamic Tab Contents -->
      
      <!-- 1. DASHBOARD VIEW -->
      <section id="view-dashboard" class="tab-view space-y-6 animate-fade-in">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Readiness Score Gauge -->
          <div class="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-sm flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 p-2 bg-[#FF9900]/10 text-[#FF9900] text-[9px] font-bold uppercase tracking-wider rounded-bl-sm">
              Ready Check
            </div>
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Exam Readiness Score</h3>
            <div class="relative flex items-center justify-center mb-4">
              <div class="w-32 h-32 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center relative">
                <span id="readiness-gauge-percent" class="text-4xl font-black text-slate-800 tracking-tight">0%</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                <div class="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-500 animate-spin-slow opacity-15"></div>
              </div>
            </div>
            <div id="readiness-badge" class="px-3 py-1 rounded-full border text-xs font-bold text-rose-500 border-rose-200 bg-rose-50 mb-2">
              Inception
            </div>
            <p class="text-[11px] text-slate-500 max-w-xs leading-normal mt-1">
              Readiness improves as you mark cards as <strong>Mastered</strong> in the flashcard deck and pass scenarios in the <strong>Exam Simulator</strong>.
            </p>
          </div>

          <!-- Pulse Metrics -->
          <div class="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Learning Pulse</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                  <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Flashcard Mastery</span>
                  <span class="text-2xl font-black text-slate-800 tracking-tight block mt-1">
                    <span id="pulse-mastered-count">0</span> <span class="text-xs text-slate-400 font-medium">/ 12</span>
                  </span>
                  <div class="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div id="pulse-mastered-bar" class="bg-blue-600 h-full transition-all duration-300" style="width: 0%"></div>
                  </div>
                </div>

                <div class="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                  <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Simulator Accuracy</span>
                  <span id="pulse-accuracy-percent" class="text-2xl font-black text-slate-800 tracking-tight block mt-1">0%</span>
                  <span id="pulse-accuracy-details" class="text-[10px] text-slate-400 block mt-1">0 correct of 0 attempts</span>
                </div>

                <div class="p-4 bg-slate-50 border border-slate-200/60 rounded-sm">
                  <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Review Pool size</span>
                  <span class="text-2xl font-black text-amber-600 tracking-tight block mt-1 flex items-center gap-1.5">
                    <span id="pulse-review-count">0</span>
                  </span>
                  <button onclick="switchTab('flashcards', 'review-pool')" class="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-wider block mt-1 text-left">
                    Review items →
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-5 p-3.5 bg-amber-50/50 border border-amber-100 rounded-sm flex gap-3 items-start">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l5.447-3.922L21 21l-1.813-5.096L24 10.5h-6.273L15.91-.01 14.09 10.5H7.817l6.273 5.404z"></path></svg>
              <div>
                <h5 class="text-xs font-bold text-slate-800">AWS Pro Tip: Focus on Domain Weight</h5>
                <p class="text-[11px] text-slate-600 leading-normal mt-0.5">
                  Domain 2 (Security) and Domain 3 (Technology) account for over <strong>64%</strong> of the CLF-C02 questions. We recommend focusing heavily on service distinctions like WAF vs Shield in the <strong>Distractor Vault</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Domain Grid -->
        <div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Exam Domain Breakdown & Mastery</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="domain-grid-container">
            <!-- Dynamic Domains go here -->
          </div>
        </div>
      </section>

      <!-- 2. FLASHCARDS VIEW -->
      <section id="view-flashcards" class="tab-view hidden space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 shadow-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Scope:</span>
            <button onclick="filterCards('all')" id="fc-scope-all" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-slate-900 text-white border-slate-900">
              All Cards (12)
            </button>
            <button onclick="filterCards('cloud-concepts')" id="fc-scope-cloud-concepts" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
              Domain 1 (4)
            </button>
            <button onclick="filterCards('security-compliance')" id="fc-scope-security-compliance" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
              Domain 2 (4)
            </button>
            <button onclick="filterCards('cloud-technology')" id="fc-scope-cloud-technology" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
              Domain 3 (2)
            </button>
            <button onclick="filterCards('billing-pricing')" id="fc-scope-billing-pricing" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
              Domain 4 (2)
            </button>
            <button onclick="filterCards('review-pool')" id="fc-scope-review-pool" class="scope-btn px-3 py-1.5 text-xs font-semibold rounded-sm transition-all border bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100 flex items-center gap-1">
              <svg class="w-3 h-3 text-amber-500 fill-amber-500 inline" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
              Review Pool (<span id="btn-review-pool-count">0</span>)
            </button>
          </div>
          <button onclick="resetStudyHistory()" class="text-[10px] font-bold text-slate-400 hover:text-red-600 hover:underline uppercase tracking-wider flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Reset Statistics
          </button>
        </div>

        <div id="fc-cards-container" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Main Interactive Card Stage -->
          <div class="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 p-6 shadow-xs h-[420px]">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div class="flex items-center gap-1.5">
                <span id="active-card-domain-badge" class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                  Domain Card
                </span>
                <span id="active-card-mastered-badge" class="hidden text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase tracking-wider">
                  ★ Mastered
                </span>
                <span id="active-card-review-badge" class="hidden text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 uppercase tracking-wider">
                  ⟲ Review Requested
                </span>
              </div>
              <div id="active-card-counter" class="text-[10px] font-mono text-slate-400">Card 1 of 12</div>
            </div>

            <!-- Flip Stage -->
            <div onclick="flipCard()" id="flip-card-stage" class="flex-1 flex flex-col justify-center items-center p-8 border border-slate-200 bg-slate-50 hover:bg-slate-100/60 rounded-sm cursor-pointer transition-all duration-150 relative select-none">
              <div class="absolute top-3 right-3 text-[9px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1">
                <svg class="w-3 h-3 text-slate-400 inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path></svg>
                Flip Card
              </div>

              <div class="text-center max-h-[180px] overflow-y-auto px-4 w-full">
                <p id="flip-card-text" class="text-xs md:text-sm font-bold leading-relaxed text-slate-800">
                  Question text goes here
                </p>
              </div>

              <div id="tap-helper" class="absolute bottom-3 text-[9px] font-semibold text-slate-500 tracking-wider uppercase">
                [ Tap Card to Flip ]
              </div>
            </div>

            <!-- Grading Buttons -->
            <div class="mt-5 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <button onclick="gradeCard('review')" class="py-2 px-4 text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 rounded-sm flex items-center justify-center gap-1.5 transition-all">
                  ❌ I Got This Wrong (Send to Review Pool)
                </button>
                <button onclick="gradeCard('known')" class="py-2 px-4 text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-sm flex items-center justify-center gap-1.5 transition-all">
                  🚀 I Got This Right (Mark as Mastered)
                </button>
              </div>

              <!-- Navigation Controls -->
              <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span class="text-[10px] text-slate-400 italic">Tips: Mastered cards increase your Exam Readiness score!</span>
                <div class="flex space-x-2">
                  <button onclick="navigateCards(-1)" id="btn-fc-prev" class="px-3 py-1 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center gap-1 text-[11px]">
                    ◀ Previous
                  </button>
                  <button onclick="navigateCards(1)" id="btn-fc-next" class="px-3 py-1 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center gap-1 text-[11px]">
                    Next ▶
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Python exporter -->
          <div class="lg:col-span-5 bg-[#1E293B] rounded-sm shadow-md flex flex-col overflow-hidden h-[420px]">
            <div class="bg-[#0F172A] px-4 py-2.5 flex items-center justify-between border-b border-white/5 shrink-0">
              <div class="flex items-center space-x-2">
                <div class="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                <span class="text-[10px] text-slate-400 font-mono pl-1">jupyter_recall_deck.py</span>
              </div>
              <button onclick="copyPythonSnippet()" class="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 transition-colors">
                <span id="copy-btn-text">COPY PYTHON LIST</span>
              </button>
            </div>
            <div class="p-4 font-mono text-[10.5px] leading-relaxed overflow-y-auto flex-1 text-slate-300">
              <p class="text-slate-500 mb-2"># Copying code representing the current filtered subset</p>
              <p class="text-[#FF9900] font-semibold">cards = [</p>
              <div id="python-exporter-lines">
                <!-- Dynamic cards in Python tuples -->
              </div>
              <p class="text-[#FF9900] font-semibold">]</p>
              <p class="mt-4 text-slate-500"># Plug this inside your create_flashcard(cards) function!</p>
            </div>
          </div>
        </div>

        <div id="fc-empty-state" class="hidden bg-white border border-slate-200 p-12 text-center rounded-sm shadow-xs flex flex-col items-center justify-center">
          <svg class="w-12 h-12 text-emerald-500 mb-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h4 class="font-bold text-slate-800 text-base">Perfect Mastery!</h4>
          <p class="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
            You have no cards marked for review in your pool! High-five. Keep testing yourself in other domains.
          </p>
          <button onclick="filterCards('all')" class="mt-4 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-sm border border-blue-700 hover:bg-blue-700 transition-colors">
            Study All Cards
          </button>
        </div>
      </section>

      <!-- 3. EXAM SIMULATOR VIEW -->
      <section id="view-simulator" class="tab-view hidden space-y-6 animate-fade-in">
        <div class="bg-white border border-slate-200 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-full text-[#FF9900]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Trick Simulator Progress</h3>
              <p class="text-xs text-slate-500">
                Score: <span id="quiz-correct-count" class="font-bold text-slate-800">0</span> correct of <span class="font-bold text-slate-800">6</span> scenario questions
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex space-x-1.5" id="quiz-dots-container">
              <!-- Question navigation circles -->
            </div>
            <button onclick="resetQuiz()" class="px-2.5 py-1 text-[10px] font-bold border border-slate-200 hover:bg-slate-50 hover:text-red-600 text-slate-500 rounded-sm transition-colors uppercase">
              Reset Test
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Scenario and options selector -->
          <div class="lg:col-span-7 bg-white border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span id="quiz-header-text" class="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                  Question 1 of 6 • Cloud Concepts
                </span>
                <span id="quiz-result-badge" class="hidden text-[9px] font-extrabold px-2 py-0.5 rounded-sm border uppercase tracking-wider">
                  Passed
                </span>
              </div>

              <h4 id="quiz-scenario-text" class="text-xs md:text-sm font-bold text-slate-800 italic leading-relaxed bg-orange-50/30 p-4 border border-orange-100 rounded-sm mb-5">
                "Scenario description goes here"
              </h4>

              <!-- Options container -->
              <div class="space-y-3" id="quiz-options-container">
                <!-- Dynamic options go here -->
              </div>
            </div>

            <!-- Actions footer -->
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div class="flex space-x-2">
                <button onclick="navigateQuiz(-1)" id="btn-quiz-prev" class="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-sm text-xs font-semibold transition-all">
                  Previous Question
                </button>
                <button onclick="navigateQuiz(1)" id="btn-quiz-next" class="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-sm text-xs font-semibold transition-all">
                  Next Question
                </button>
              </div>

              <button onclick="submitQuizAnswer()" id="btn-quiz-submit" class="px-5 py-2 bg-[#FF9900] hover:bg-orange-600 text-white text-xs font-bold rounded-sm border border-orange-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider">
                Submit & Verify Answer
              </button>
            </div>
          </div>

          <!-- Deep Analysis panel -->
          <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-sm p-5 text-white flex flex-col justify-between min-h-[460px] overflow-hidden">
            
            <div id="quiz-analysis-locked" class="flex flex-col items-center justify-center text-center py-20 px-6 h-full space-y-4">
              <svg class="w-12 h-12 text-slate-700 animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <h5 class="font-bold text-slate-300 text-sm">Deep Analysis Vault Locked</h5>
              <p class="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Select an option and press <strong>Submit & Verify</strong>. The simulator will unlock the structural breakdown of the correct choice and expose the visual distractor traps.
              </p>
            </div>

            <div id="quiz-analysis-unlocked" class="hidden space-y-4 flex-1 flex flex-col justify-between overflow-y-auto pr-1">
              <div class="space-y-4">
                
                <!-- Result alert banner -->
                <div id="quiz-feedback-banner" class="p-3 rounded-sm text-xs font-bold flex items-center gap-2 border">
                  <!-- Dynamic text -->
                </div>

                <!-- Trap banner -->
                <div class="bg-slate-950 p-3.5 border-l-4 border-l-orange-500 rounded-sm text-[11.5px] leading-relaxed">
                  <span class="text-[#FF9900] font-bold block mb-1">🛡️ THE EXAM TRAP:</span>
                  <span id="quiz-trap-text">Trap alert text...</span>
                </div>

                <!-- Correct description -->
                <div class="bg-slate-950/55 p-3.5 border border-slate-800 rounded-sm">
                  <span id="quiz-correct-header" class="text-emerald-400 font-bold block text-xs mb-1">✓ Why Answer is Correct:</span>
                  <p id="quiz-correct-desc" class="text-[11px] text-slate-300 leading-relaxed">Correct explanation...</p>
                </div>

                <!-- Exposed distractors list -->
                <div class="space-y-2 pt-2 border-t border-slate-800">
                  <span class="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">💀 Distractor Traps Exposed:</span>
                  <div id="quiz-distractor-list" class="space-y-2">
                    <!-- Option items go here -->
                  </div>
                </div>

              </div>

              <div class="text-[9.5px] text-slate-500 font-mono mt-4 pt-2 border-t border-slate-800 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>EXAM TIP: Look for absolute constraints like 'cheapest', 'serverless', or Layer 7 limits.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- 4. DISTRACTOR VAULT VIEW -->
      <section id="view-vault" class="tab-view hidden space-y-6 animate-fade-in">
        <div class="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 max-w-md relative">
              <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                id="vault-search-input"
                type="text"
                oninput="searchVault()"
                placeholder="Search services, traps, or key terms (e.g. Shield, Glacier)..."
                class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] transition-colors bg-slate-50/50"
              />
            </div>

            <div class="text-[11px] text-slate-400 font-mono">
              Displaying <span id="vault-items-count" class="text-slate-800 font-bold">7</span> high-yield traps
            </div>
          </div>

          <!-- Category filter buttons -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2">Category:</span>
            <button onclick="filterVault('all')" id="vault-cat-all" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-[#FF9900] text-white border-[#FF9900] shadow-sm">
              All
            </button>
            <button onclick="filterVault('Security & Protection')" id="vault-cat-security" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Security & Protection
            </button>
            <button onclick="filterVault('Security & Threat Detection')" id="vault-cat-threat" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Security & Threat Detection
            </button>
            <button onclick="filterVault('Storage')" id="vault-cat-storage" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Storage
            </button>
            <button onclick="filterVault('Networking')" id="vault-cat-networking" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Networking
            </button>
            <button onclick="filterVault('Billing & Cost Optimization')" id="vault-cat-billing" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Billing & Cost Optimization
            </button>
            <button onclick="filterVault('Audit & Best Practice')" id="vault-cat-audit" class="vault-cat-btn px-3 py-1 text-[11px] font-semibold rounded-sm transition-all border bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100">
              Audit & Best Practice
            </button>
          </div>
        </div>

        <!-- Cards of comparative data -->
        <div id="vault-items-container" class="space-y-6">
          <!-- Dynamic compare cards -->
        </div>

        <!-- Empty state -->
        <div id="vault-empty-state" class="hidden bg-white border border-slate-200 p-12 text-center rounded-sm shadow-xs">
          <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h4 class="font-bold text-slate-700 text-sm">No traps found</h4>
          <p class="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
            Try adjusting your search criteria or categories to view other critical AWS exam service distinctions.
          </p>
        </div>
      </section>

    </main>
  </div>

  <!-- Footer status bar -->
  <footer class="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 shrink-0 font-mono select-none z-20">
    <div class="flex space-x-6 items-center">
      <span class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        SESSION: <span class="text-slate-600 font-semibold">AWS_OFFLINE_STUDY</span>
      </span>
      <div class="w-px h-3 bg-slate-300 hidden sm:block"></div>
      <span class="hidden sm:flex items-center gap-1.5">
        READINESS SCORE: 
        <span id="footer-readiness-percent" class="text-slate-700 font-bold">0%</span>
        <span class="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden inline-block border border-slate-300/40">
          <span id="footer-readiness-bar" class="bg-emerald-500 h-full block transition-all duration-300" style="width: 0%"></span>
        </span>
      </span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-[#FF9900] font-bold uppercase tracking-widest text-[9px] flex items-center gap-1 bg-slate-200/50 px-2 py-0.5 rounded-sm border border-slate-300/40">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        Solutions Architect Verified
      </span>
    </div>
  </footer>

  <!-- Script for complete Offline State Management -->
  <script>
    // Embedded datasets
    const domains = [
      {
        id: "cloud-concepts",
        number: 1,
        name: "Cloud Concepts",
        subtitle: "The Architecture of Agility",
        overviewSummary: "Mastering the cloud value proposition, fundamental architectural principles, cloud economics, and the Shared Responsibility Model (20% of exam).",
        keyServices: ["IAM", "EC2", "S3", "VPC", "CloudFront"]
      },
      {
        id: "security-compliance",
        number: 2,
        name: "Security & Compliance",
        subtitle: "The Shield of Least Privilege",
        overviewSummary: "Understanding security and access controls, data protection, security services, compliance tools, and active threat detection (30% of exam).",
        keyServices: ["IAM", "WAF", "Shield", "GuardDuty", "Inspector", "KMS", "Artifact"]
      },
      {
        id: "cloud-technology",
        number: 3,
        name: "Technology & Services",
        subtitle: "The Engine Room of the Cloud",
        overviewSummary: "Exploring key AWS compute, storage, database, networking, and application integration services (34% of exam).",
        keyServices: ["EC2", "S3", "EBS", "EFS", "RDS", "DynamoDB", "Lambda", "Route 53", "ECS"]
      },
      {
        id: "billing-pricing",
        number: 4,
        name: "Billing & Pricing",
        subtitle: "The Ledger of Cost Optimization",
        overviewSummary: "Navigating AWS pricing models, cost management tools, support tiers, and consolidated billing (16% of exam).",
        keyServices: ["Cost Explorer", "AWS Budgets", "Trusted Advisor", "Pricing Calculator"]
      }
    ];

    const flashcards = [
      {
        id: "fc-1",
        domainId: "cloud-concepts",
        question: "Who is responsible for the physical security of AWS data centers?",
        answer: "AWS. This falls under Security 'OF' the Cloud, which includes hardware, physical facilities, and virtualization infrastructure."
      },
      {
        id: "fc-2",
        domainId: "cloud-concepts",
        question: "Is the customer responsible for patching the guest operating system on an Amazon EC2 instance?",
        answer: "Yes. This falls under Security 'IN' the Cloud because the customer owns and maintains the guest OS and any applications installed on it."
      },
      {
        id: "fc-3",
        domainId: "cloud-concepts",
        question: "What is 'elasticity' in cloud computing, and how does it differ from 'scalability'?",
        answer: "Scalability is the structural capacity to handle growth. Elasticity is the automatic matching of resource supply to real-time demand dynamically (scaling down when traffic drops to save cost)."
      },
      {
        id: "fc-4",
        domainId: "cloud-concepts",
        question: "What is the primary financial advantage of shifting from Capex to Opex in AWS?",
        answer: "Instead of paying upfront capital costs for physical data centers before using them (Capex), you pay only for what you consume dynamically (Opex), improving cash flow."
      },
      {
        id: "fc-5",
        domainId: "security-compliance",
        question: "Which AWS service provides on-demand downloads of official compliance reports and agreements?",
        answer: "AWS Artifact. It is the central, self-service repository for legal and compliance-related AWS audit documents."
      },
      {
        id: "fc-6",
        domainId: "security-compliance",
        question: "What is the primary difference between AWS WAF and AWS Shield?",
        answer: "AWS WAF filters web traffic to protect against application exploits (Layer 7 like SQLi/XSS). AWS Shield protects against massive DDoS attacks at network and transport layers (Layers 3 & 4)."
      },
      {
        id: "fc-7",
        domainId: "security-compliance",
        question: "What is the best practice for giving an application running on an EC2 instance access to an S3 bucket?",
        answer: "Attach an IAM Role to the EC2 instance instead of embedding hardcoded AWS Access Keys inside the application code."
      },
      {
        id: "fc-8",
        domainId: "security-compliance",
        question: "How does Amazon GuardDuty differ from Amazon Inspector?",
        answer: "GuardDuty is a continuous threat detection service scanning VPC, DNS, and CloudTrail logs for intrusions. Inspector is a vulnerability scanner checking EC2 instances for software CVEs."
      },
      {
        id: "fc-9",
        domainId: "cloud-technology",
        question: "When should you use Amazon EFS over Amazon EBS?",
        answer: "Use EFS when you need shared file storage that can be mounted concurrently by hundreds of EC2 instances. EBS can only attach to one instance at a time (in standard usage)."
      },
      {
        id: "fc-10",
        domainId: "cloud-technology",
        question: "What does it mean that AWS Lambda is 'serverless'?",
        answer: "AWS manages server allocation, patching, and scales the compute power automatically. The customer only pays for active execution time (measured in milliseconds)."
      },
      {
        id: "fc-11",
        domainId: "billing-pricing",
        question: "What tool should you use to receive automated alerts when your projected monthly spend crosses $200?",
        answer: "AWS Budgets. It handles proactive budget limit configurations and email alerts."
      },
      {
        id: "fc-12",
        domainId: "billing-pricing",
        question: "Who is the Technical Account Manager (TAM) and which support plan includes them?",
        answer: "The TAM is a designated AWS engineer acting as your strategic technical advisor. They are only included in the Enterprise Support Plan."
      }
    ];

    const trickQuestions = [
      {
        id: "q-1",
        domainId: "cloud-concepts",
        domainName: "Cloud Concepts",
        scenario: "A global e-commerce company is migrating its infrastructure to AWS. The CTO argues that because AWS operates highly secure, state-of-the-art physical facilities with built-in hardware redundancy, the company no longer needs to configure multi-zone replication, guest operating system updates, or database firewall rules. Under the Shared Responsibility Model, which statement correctly evaluates this claim?",
        options: [
          { key: "A", text: "The CTO is correct because AWS manages security 'OF' the cloud, which automatically covers data encryption, guest OS patching, and network firewall configuration for all database instances." },
          { key: "B", text: "The CTO is incorrect because physical hardware maintenance, physical facility security, and underlying hypervisor security are the sole responsibility of the customer." },
          { key: "C", text: "The CTO is incorrect because the customer remains responsible for security 'IN' the cloud, including configuring network security groups, patching guest operating systems, and enabling encryption." },
          { key: "D", text: "The CTO is correct because the AWS Well-Architected Tool automatically secures, replicates, and patches all customer database storage across multiple geographic regions by default." }
        ],
        correctAnswer: "C",
        trickAlert: "Don't fall for answers claiming AWS automatically configures guest OS patching or database firewall rules for standard Infrastructure as a Service (IaaS) products like EC2. Also, the Well-Architected Tool is a conceptual checklist, not an automated deployment script!",
        correctExplanation: "Option C is correct because guest OS updates, security groups, and customer data encryption are Customer responsibilities under the Shared Responsibility Model (Security 'IN' the Cloud). AWS only manages the security 'OF' the cloud (physical infrastructure, virtualization layer).",
        distractorExplanations: {
          A: "Incorrect. AWS does not manage guest OS patching or security groups for Infrastructure as a Service (IaaS) products like Amazon EC2. The customer has full control over the guest OS.",
          B: "Incorrect. This reverses the model. Physical security, hardware, and hypervisor maintenance are entirely managed by AWS, not the customer.",
          C: "Correct. Highlighting the proper dividing line under the Shared Responsibility Model.",
          D: "Incorrect. The AWS Well-Architected Tool is a conceptual checklist/methodology, not a software tool that automatically implements data replication or operating system patching."
        }
      },
      {
        id: "q-2",
        domainId: "security-compliance",
        domainName: "Security & Compliance",
        scenario: "A healthcare startup needs to verify that the physical infrastructure and cloud platforms hosted by AWS satisfy HIPAA and ISO 27001 regulatory frameworks before migrating patient databases. Which AWS resource should their compliance officer use to download signed, official compliance agreements and third-party audit reports?",
        options: [
          { key: "A", text: "AWS Trusted Advisor Security Dashboard" },
          { key: "B", text: "AWS Systems Manager (SSM) Compliance Hub" },
          { key: "C", text: "AWS Artifact" },
          { key: "D", text: "AWS Shield Advanced Compliance Reports" }
        ],
        correctAnswer: "C",
        trickAlert: "AWS Systems Manager (Option B) is an operational tool to patch/manage your own virtual servers, not a legal compliance vault. Trusted Advisor (Option A) recommends security and cost improvements but doesn't store AWS's compliance documents. AWS Artifact is the sole formal document repository.",
        correctExplanation: "Option C is correct because AWS Artifact is the official, on-demand portal for downloading AWS compliance documents, certifications, and agreements.",
        distractorExplanations: {
          A: "Incorrect. AWS Trusted Advisor inspects your active AWS resources and gives advice on cost, security, tolerance, etc., but does not hold signed global compliance certificates.",
          B: "Incorrect. AWS Systems Manager Compliance audits the operational patch compliance of your EC2 instances; it cannot download AWS cloud physical data center compliance documents.",
          C: "Correct. AWS Artifact is the singular place for official AWS compliance documents and auditor-signed certificates.",
          D: "Incorrect. AWS Shield is a DDoS protection service; it does not issue general regulatory compliance reports."
        }
      },
      {
        id: "q-3",
        domainId: "cloud-technology",
        domainName: "Technology & Services",
        scenario: "A video production enterprise needs to store millions of legacy media files. These files are accessed extremely rarely, but when an editor needs one, it must be available for download within 3 to 5 minutes. Cost is the absolute primary constraint. Which Amazon S3 storage class offers the MOST cost-effective solution for this requirement?",
        options: [
          { key: "A", text: "Amazon S3 Standard-Infrequent Access (S3 Standard-IA)" },
          { key: "B", text: "Amazon S3 Glacier Flexible Retrieval" },
          { key: "C", text: "Amazon S3 Glacier Instant Retrieval" },
          { key: "D", text: "Amazon S3 Glacier Deep Archive" }
        ],
        correctAnswer: "B",
        trickAlert: "This is a dual-constraint trick question. S3 Glacier Deep Archive (Option D) is the cheapest class, but its retrieval takes 12 hours (violating the 3-5 minute rule). Glacier Instant Retrieval (Option C) allows milliseconds retrieval, but has higher storage costs. Glacier Flexible Retrieval (Option B) supports 'Expedited Retrieval' which takes 1-5 minutes and has lower storage costs than Instant Retrieval, making it the correct 'most cost-effective' choice.",
        correctExplanation: "Option B is correct because Amazon S3 Glacier Flexible Retrieval supports Expedited Retrievals (taking 1 to 5 minutes) and is cheaper than Glacier Instant Retrieval, fulfilling both the retrieval time constraint and the cost-minimization constraint.",
        distractorExplanations: {
          A: "Incorrect. S3 Standard-IA has instant retrieval but has significantly higher storage costs than any Glacier tier, violating the 'most cost-effective' constraint for rarely accessed files.",
          B: "Correct. Provides 1-5 minutes expedited retrieval and is more cost-effective than standard or instant retrieval classes.",
          C: "Incorrect. Glacier Instant Retrieval supports milliseconds access, but has higher storage costs than Glacier Flexible Retrieval, making it less cost-effective for extremely rare access.",
          D: "Incorrect. S3 Glacier Deep Archive is the cheapest class, but its minimum retrieval time is 12 hours, failing to meet the required 3-5 minutes threshold."
        }
      },
      {
        id: "q-4",
        domainId: "billing-pricing",
        domainName: "Billing & Pricing",
        scenario: "A startup wants to configure an automated alerting mechanism that sends email notifications to the finance team when the monthly estimated AWS charges are projected to exceed $150. They do not want to stop any services from running automatically, only to trigger notifications. Which tool is designed to meet this specific need?",
        options: [
          { key: "A", text: "AWS Cost Explorer Forecasting Rules" },
          { key: "B", text: "AWS Trusted Advisor Cost Dashboard" },
          { key: "C", text: "AWS Budgets" },
          { key: "D", text: "AWS Organizations Billing Control Alerts" }
        ],
        correctAnswer: "C",
        trickAlert: "This is a classic 'alert vs dashboard' trick. Cost Explorer (Option A) has forecasting charts but is a passive reporting tool — it doesn't send proactive alarms. Trusted Advisor (Option B) lists optimization recommendation checks, but cannot set specific dollar budget threshold alerts. Only AWS Budgets handles alerts on actual or projected spend.",
        correctExplanation: "Option C is correct because AWS Budgets allows you to set custom budgets and trigger email or Amazon SNS alerts when actual OR forecasted costs exceed a threshold.",
        distractorExplanations: {
          A: "Incorrect. AWS Cost Explorer is an analysis and visualization tool. Although it can forecast future expenditures, it does not have built-in notification alerts for budget thresholds.",
          B: "Incorrect. AWS Trusted Advisor identifies cost-saving recommendations (like idle resources) but is not a user-customizable budget alert engine.",
          C: "Correct. AWS Budgets is the correct native tool for configuring spend threshold notification triggers.",
          D: "Incorrect. AWS Organizations consolidated billing does not provide customizable dollar-based alerting features natively without attaching a budget."
        }
      },
      {
        id: "q-5",
        domainId: "cloud-technology",
        domainName: "Technology & Services",
        scenario: "An enterprise is planning to deploy a legacy 3-tier web application. They require a fully managed SQL database solution that supports automated scaling, multi-AZ clustering for high availability, and automatically grows storage up to 128 TiB without manual administrative action. Which database solution matches this description?",
        options: [
          { key: "A", text: "Amazon DynamoDB with Global Tables" },
          { key: "B", text: "Amazon RDS for PostgreSQL" },
          { key: "C", text: "Amazon Aurora" },
          { key: "D", text: "Amazon Redshift with Auto-Slices" }
        ],
        correctAnswer: "C",
        trickAlert: "Amazon RDS (Option B) does support Postgres, but database storage scaling or auto-scaling clusters aren't completely hands-off up to 128 TiB without minor admin thresholds, and it's not the cloud-native, auto-growing solution. DynamoDB (Option A) is a NoSQL key-value store, not SQL. Amazon Aurora (Option C) automatically grows storage in 10 GB increments up to 128 TiB with self-healing replication.",
        correctExplanation: "Option C is correct because Amazon Aurora is a cloud-native relational database service that automatically scales storage, offers continuous backup to Amazon S3, and replicates data across multiple Availability Zones in a self-healing cluster.",
        distractorExplanations: {
          A: "Incorrect. DynamoDB is a NoSQL (non-relational) database. The scenario specifies a 'legacy SQL database solution'.",
          B: "Incorrect. While RDS PostgreSQL is fully managed, it does not have the cloud-native automatic storage scaling up to 128 TiB or storage clustering inherent to Amazon Aurora.",
          C: "Correct. Aurora is the high-end cloud-native SQL engine which automatically scales storage in response to usage.",
          D: "Incorrect. Amazon Redshift is a column-oriented data warehouse designed for heavy analytical processing (OLAP), not standard 3-tier application transaction processing (OLTP)."
        }
      },
      {
        id: "q-6",
        domainId: "security-compliance",
        domainName: "Security & Compliance",
        scenario: "Your development team accidental checked a database configuration file containing active AWS Access Keys into a public GitHub repository. Within 5 minutes, AWS detects this compromised secret and automatically disables the key while notifying you. Which service operates behind the scenes to actively identify the compromised key and automate this alert?",
        options: [
          { key: "A", text: "AWS WAF" },
          { key: "B", text: "AWS Secrets Manager" },
          { key: "C", text: "AWS Trusted Advisor" },
          { key: "D", text: "Amazon GuardDuty" }
        ],
        correctAnswer: "D",
        trickAlert: "Many students assume AWS Secrets Manager (Option B) is responsible since it relates to 'secrets'. However, Secrets Manager is an encrypted vault for rotating credentials, not a scanner. GuardDuty (Option D) acts as an active log scanner and intrusion detection system which can detect compromised credentials and automate response alerts.",
        correctExplanation: "Option D is correct because Amazon GuardDuty is a threat detection service that actively monitors for malicious behavior, including exposed credentials, using ML, VPC Logs, and CloudTrail.",
        distractorExplanations: {
          A: "Incorrect. AWS WAF blocks Layer 7 exploits on active HTTP websites. It cannot scan public GitHub repositories for code secrets.",
          B: "Incorrect. AWS Secrets Manager rotates and stores keys securely inside AWS, but it does not scan external code hosting sites for leaked configurations.",
          C: "Incorrect. AWS Trusted Advisor does run audits of exposed credentials, but it's a recommendation center and not a high-speed real-time 5-minute intrusion scanner.",
          D: "Correct. Amazon GuardDuty actively evaluates compromised keys, handles logs, and triggers rapid intrusion reports."
        }
      }
    ];

    const distractorVault = [
      {
        id: "v-1",
        title: "AWS Shield Standard vs. AWS Shield Advanced",
        category: "Security & Protection",
        serviceA: "AWS Shield Standard",
        serviceB: "AWS Shield Advanced",
        serviceAUsage: "Automatically enabled for free to protect against basic Layer 3 & 4 DDoS attacks across all AWS resources.",
        serviceBUsage: "Paid subscription ($3,000/month) offering tailored protection, DDoS cost protection, 24/7 access to the DDoS Response Team (DRT), and advanced detection.",
        keyTrap: "If a question asks for basic, free, automatic DDoS protection, choose Shield Standard. If it mentions cost protection or 24/7 access to a specialized DDoS response team, choose Shield Advanced."
      },
      {
        id: "v-2",
        title: "AWS WAF vs. Amazon GuardDuty",
        category: "Security & Threat Detection",
        serviceA: "AWS WAF (Web Application Firewall)",
        serviceB: "Amazon GuardDuty",
        serviceAUsage: "Filters active web traffic (Layer 7) to block SQL injections, Cross-Site Scripting (XSS), and bad bots.",
        serviceBUsage: "Intelligent threat detection scanning system logs (VPC Flow, CloudTrail, DNS) using machine learning to detect active server intrusions.",
        keyTrap: "WAF intercepts HTTP/S traffic at the perimeter (blocks bad requests). GuardDuty does NOT block traffic at the firewall; it scans logs in the background to report anomalies."
      },
      {
        id: "v-3",
        title: "S3 Glacier Flexible Retrieval vs. S3 Glacier Deep Archive",
        category: "Storage",
        serviceA: "S3 Glacier Flexible Retrieval",
        serviceB: "S3 Glacier Deep Archive",
        serviceAUsage: "Archival class with flexible retrieval options: Expedited (1-5 mins), Standard (3-5 hours), and Bulk (5-12 hours).",
        serviceBUsage: "Cheapest storage class in AWS. Designed for long-term archiving where access is required only in 12-48 hours.",
        keyTrap: "Glacier Flexible Retrieval is chosen when a retrieval speed of minutes (1-5 min expedited) is needed. Glacier Deep Archive is for ultra-low cost where waiting 12 hours is acceptable."
      },
      {
        id: "v-4",
        title: "Security Groups vs. Network ACLs (NACLs)",
        category: "Networking",
        serviceA: "Security Groups",
        serviceB: "Network ACLs",
        serviceAUsage: "Stateful firewalls operating at the individual EC2 instance level. Automatically allow response traffic.",
        serviceBUsage: "Stateless firewalls operating at the VPC Subnet level. Must explicitly configure inbound and outbound rules.",
        keyTrap: "Security Groups are 'Stateful' (no need to open outbound port if inbound is allowed). Network ACLs are 'Stateless' (you MUST open outbound port manually for response packages)."
      },
      {
        id: "v-5",
        title: "AWS Budgets vs. AWS Cost Explorer",
        category: "Billing & Cost Optimization",
        serviceA: "AWS Budgets",
        serviceB: "AWS Cost Explorer",
        serviceAUsage: "Used to set custom cost/usage limits and configure proactive email notifications when thresholds are crossed.",
        serviceBUsage: "Interactive reporting tool to visually chart past costs, examine spending patterns, and forecast future trends.",
        keyTrap: "AWS Budgets is PROACTIVE (sets alerts for the future). AWS Cost Explorer is RETROSPECTIVE (provides visuals and charts of past expenditures to analyze)."
      },
      {
        id: "v-6",
        title: "Amazon EBS vs. Amazon EFS",
        category: "Storage",
        serviceA: "Amazon EBS (Elastic Block Store)",
        serviceB: "Amazon EFS (Elastic File System)",
        serviceAUsage: "High-performance block storage acting as a virtual hard drive for a single EC2 instance inside one Availability Zone.",
        serviceBUsage: "Serverless, shared network file storage mounted simultaneously by hundreds of virtual instances across multiple zones.",
        keyTrap: "EBS is locked to a single Availability Zone and instance. EFS is multi-AZ, serverless, and supports concurrent attachment."
      },
      {
        id: "v-7",
        title: "AWS Trusted Advisor vs. AWS Inspector",
        category: "Audit & Best Practice",
        serviceA: "AWS Trusted Advisor",
        serviceB: "Amazon Inspector",
        serviceAUsage: "Scans your entire account to recommend best practices in five areas: security, cost, performance, fault tolerance, and limits.",
        serviceBUsage: "Targeted vulnerability scanner specifically for Amazon EC2 instances and container images, checking for software bugs (CVEs).",
        keyTrap: "Trusted Advisor scans your *entire account architecture* against basic best practices (e.g. MFA turned off, idle databases). Inspector scans *individual software packages* running inside virtual machines."
      }
    ];

    // Global Interactive State
    let activeTab = 'dashboard';
    let sidebarOpen = true;
    let studyHistory = {}; // cardId -> 'known' | 'review' | null
    let quizHistory = {};  // questionId -> boolean
    
    // Flashcard local settings
    let fcScope = 'all';
    let fcCurrentIdx = 0;
    let fcIsFlipped = false;
    let filteredCards = [...flashcards];

    // Quiz simulator local settings
    let qCurrentIdx = 0;
    let qSelectedKey = null;
    let qIsSubmitted = false;

    // Vault local settings
    let vaultSearch = '';
    let vaultSelectedCategory = 'all';

    // Initialize LocalStorage Persistence
    function loadState() {
      const savedStudy = localStorage.getItem("aws_offline_study_history_v1");
      if (savedStudy) studyHistory = JSON.parse(savedStudy);
      const savedQuiz = localStorage.getItem("aws_offline_quiz_history_v1");
      if (savedQuiz) quizHistory = JSON.parse(savedQuiz);
    }

    function saveState() {
      localStorage.setItem("aws_offline_study_history_v1", JSON.stringify(studyHistory));
      localStorage.setItem("aws_offline_quiz_history_v1", JSON.stringify(quizHistory));
    }

    // Toggle Sidebar
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      const sidebar = document.getElementById('sidebar-panel');
      if (sidebarOpen) {
        sidebar.classList.remove('w-0', 'overflow-hidden', 'border-r-0');
        sidebar.classList.add('w-64');
      } else {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-0', 'overflow-hidden', 'border-r-0');
      }
    }

    // Tab switcher
    function switchTab(tabId, customScope = null) {
      activeTab = tabId;
      document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
      document.getElementById('view-' + tabId).classList.remove('hidden');

      document.querySelectorAll('.sidebar-tab').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white', 'shadow-sm', 'bg-amber-500');
        btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-50');
      });

      const activeBtn = document.getElementById('btn-tab-' + tabId);
      if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-50');
        if (tabId === 'flashcards') {
          activeBtn.classList.add('bg-[#FF9900]', 'text-white', 'shadow-sm');
        } else {
          activeBtn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        }
      }

      if (tabId === 'flashcards' && customScope) {
        filterCards(customScope);
      } else if (tabId === 'flashcards') {
        filterCards('all');
      }

      render();
    }

    // Calculate dynamic readiness score
    function calculateMetrics() {
      const totalCards = flashcards.length;
      const knownCards = Object.values(studyHistory).filter(v => v === 'known').length;
      const correctQuizzes = Object.values(quizHistory).filter(v => v === true).length;
      const readinessScore = Math.min(100, Math.round(
        (knownCards / (totalCards || 1)) * 50 + 
        (correctQuizzes / (trickQuestions.length || 1)) * 50
      ));
      
      return { knownCards, totalCards, correctQuizzes, readinessScore };
    }

    // Global rendering routine
    function render() {
      const metrics = calculateMetrics();
      
      // Update global badges
      document.getElementById('header-readiness-percent').innerText = \`\${metrics.readinessScore}%\`;
      document.getElementById('footer-readiness-percent').innerText = \`\${metrics.readinessScore}%\`;
      document.getElementById('footer-readiness-bar').style.width = \`\${metrics.readinessScore}%\`;
      
      // Update Readiness Dots colors
      const dot = document.getElementById('header-readiness-dot');
      dot.className = "w-2 h-2 rounded-full " + (metrics.readinessScore >= 80 ? 'bg-emerald-500' : metrics.readinessScore >= 40 ? 'bg-amber-500' : 'bg-slate-300');

      // Update Quick Progress Widgets
      document.getElementById('quick-mastered-text').innerText = \`\${metrics.knownCards} / \${metrics.totalCards}\`;
      document.getElementById('quick-mastered-bar').style.width = \`\${(metrics.knownCards / metrics.totalCards) * 100}%\`;
      document.getElementById('quick-quiz-text').innerText = \`\${metrics.correctQuizzes} / \${trickQuestions.length}\`;
      document.getElementById('quick-quiz-bar').style.width = \`\${(metrics.correctQuizzes / trickQuestions.length) * 100}%\`;

      // Render Active Tab Content
      if (activeTab === 'dashboard') {
        renderDashboard(metrics);
      } else if (activeTab === 'flashcards') {
        renderFlashcards();
      } else if (activeTab === 'simulator') {
        renderQuiz();
      } else if (activeTab === 'vault') {
        renderVault();
      }
    }

    // 1. Render Dashboard Tab
    function renderDashboard(metrics) {
      // Gauge label and color
      const labelBadge = document.getElementById('readiness-badge');
      document.getElementById('readiness-gauge-percent').innerText = \`\${metrics.readinessScore}%\`;
      
      let label = "Inception";
      let classes = "text-rose-500 border-rose-200 bg-rose-50";
      if (metrics.readinessScore >= 80) {
        label = "Exam Ready!";
        classes = "text-emerald-700 border-emerald-200 bg-emerald-50";
      } else if (metrics.readinessScore >= 50) {
        label = "Making Solid Progress";
        classes = "text-amber-700 border-amber-200 bg-amber-50";
      } else if (metrics.readinessScore > 0) {
        label = "Getting Started";
        classes = "text-blue-700 border-blue-200 bg-blue-50";
      }
      labelBadge.className = \`px-3 py-1 rounded-full border text-xs font-bold \${classes} mb-2\`;
      labelBadge.innerText = label;

      // Pulse Panel
      document.getElementById('pulse-mastered-count').innerText = metrics.knownCards;
      document.getElementById('pulse-mastered-bar').style.width = \`\${(metrics.knownCards / metrics.totalCards) * 100}%\`;
      document.getElementById('pulse-accuracy-percent').innerText = \`\${metrics.readinessScore}%\`;
      const quizAttempts = Object.keys(quizHistory).length;
      document.getElementById('pulse-accuracy-details').innerText = \`\${metrics.correctQuizzes} correct of \${quizAttempts} attempts\`;
      
      const reviewCount = Object.values(studyHistory).filter(v => v === 'review').length;
      document.getElementById('pulse-review-count').innerText = reviewCount;

      // Render domains grid
      const container = document.getElementById('domain-grid-container');
      container.innerHTML = '';
      
      domains.forEach(dom => {
        // Calculate mastery in this domain
        const domCards = flashcards.filter(fc => fc.domainId === dom.id);
        const knownInDom = domCards.filter(fc => studyHistory[fc.id] === 'known').length;
        const progress = domCards.length > 0 ? Math.round((knownInDom / domCards.length) * 100) : 0;
        
        const domColor = progress >= 85 ? "bg-emerald-500" : progress >= 40 ? "bg-blue-500" : "bg-slate-300";

        const cardHtml = \`
          <div class="bg-white border border-slate-200 p-5 rounded-sm shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 font-mono">DOMAIN \${dom.number}</span>
                  <h4 class="font-bold text-slate-800 text-sm mt-0.5 leading-snug">\${dom.name}</h4>
                </div>
                <span class="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/60">
                  \${progress}% Mastery
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">\${dom.overviewSummary}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100">
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <div class="h-full rounded-full transition-all duration-500 \${domColor}" style="width: \${progress}%"></div>
              </div>
              <div class="flex justify-between items-center text-[10px]">
                <span class="text-slate-400 font-medium">Key Services: \${dom.keyServices.slice(0, 4).join(', ')}...</span>
                <button onclick="switchTab('flashcards', '\${dom.id}')" class="text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider hover:underline">
                  Study Cards →
                </button>
              </div>
            </div>
          </div>
        \`;
        container.innerHTML += cardHtml;
      });
    }

    // 2. Render Flashcards Tab
    function filterCards(scope) {
      fcScope = scope;
      fcCurrentIdx = 0;
      fcIsFlipped = false;

      // Update scope buttons highlight
      document.querySelectorAll('.scope-btn').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white', 'border-slate-900', 'bg-amber-600');
        btn.classList.add('bg-slate-50', 'text-slate-600', 'border-slate-200');
      });

      const activeBtn = document.getElementById(\`fc-scope-\${scope}\`);
      if (activeBtn) {
        activeBtn.classList.remove('bg-slate-50', 'text-slate-600', 'border-slate-200');
        if (scope === 'review-pool') {
          activeBtn.classList.add('bg-amber-600', 'text-white', 'border-amber-600');
        } else {
          activeBtn.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
        }
      }

      // Filter
      if (scope === 'all') {
        filteredCards = [...flashcards];
      } else if (scope === 'review-pool') {
        filteredCards = flashcards.filter(fc => studyHistory[fc.id] === 'review');
      } else {
        filteredCards = flashcards.filter(fc => fc.domainId === scope);
      }

      render();
    }

    function renderFlashcards() {
      const reviewPoolCount = flashcards.filter(fc => studyHistory[fc.id] === 'review').length;
      document.getElementById('btn-review-pool-count').innerText = reviewPoolCount;

      const cardContainer = document.getElementById('fc-cards-container');
      const emptyState = document.getElementById('fc-empty-state');

      if (filteredCards.length === 0) {
        cardContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
      }

      cardContainer.classList.remove('hidden');
      emptyState.classList.add('hidden');

      const card = filteredCards[fcCurrentIdx];
      const status = studyHistory[card.id];

      // Domain badge text
      const domainObj = domains.find(d => d.id === card.domainId);
      const domNum = domainObj ? domainObj.number : '?';
      document.getElementById('active-card-domain-badge').innerText = \`Domain \${domNum} Card\`;

      // Status markers
      const masterBadge = document.getElementById('active-card-mastered-badge');
      const reviewBadge = document.getElementById('active-card-review-badge');

      masterBadge.classList.add('hidden');
      reviewBadge.classList.add('hidden');

      if (status === 'known') masterBadge.classList.remove('hidden');
      if (status === 'review') reviewBadge.classList.remove('hidden');

      // Counter text
      document.getElementById('active-card-counter').innerText = \`Card \${fcCurrentIdx + 1} of \${filteredCards.length}\`;

      // Flip card layout and style
      const stage = document.getElementById('flip-card-stage');
      const textEl = document.getElementById('flip-card-text');

      if (fcIsFlipped) {
        stage.className = "flex-1 flex flex-col justify-center items-center p-8 border border-slate-800 bg-slate-900 text-white rounded-sm cursor-pointer transition-all duration-150 relative select-none shadow-inner";
        textEl.innerText = card.answer;
        textEl.className = "text-xs md:text-sm font-medium leading-relaxed font-sans text-slate-100 animate-fade-in whitespace-pre-wrap";
      } else {
        stage.className = "flex-1 flex flex-col justify-center items-center p-8 border border-slate-200 bg-slate-50 hover:bg-slate-100/60 rounded-sm cursor-pointer transition-all duration-150 relative select-none";
        textEl.innerText = card.question;
        textEl.className = "text-xs md:text-sm font-bold leading-relaxed font-sans text-slate-800";
      }

      // Prev Next buttons disabling
      document.getElementById('btn-fc-prev').disabled = (fcCurrentIdx === 0);
      document.getElementById('btn-fc-next').disabled = (fcCurrentIdx === filteredCards.length - 1);

      // Render Python Snippet lines
      const pythonLines = document.getElementById('python-exporter-lines');
      pythonLines.innerHTML = '';
      
      const linesToExport = filteredCards.length > 0 ? filteredCards : flashcards;
      linesToExport.forEach(item => {
        const qShort = item.question.length > 50 ? item.question.slice(0, 50) + '...' : item.question;
        const aShort = item.answer.length > 40 ? item.answer.slice(0, 40) + '...' : item.answer;
        pythonLines.innerHTML += \`
          <div class="pl-4 text-emerald-400 py-0.5 hover:bg-slate-800/40 transition-colors rounded-xs">
            (<span class="text-amber-300">"\${qShort}"</span>, <span class="text-blue-300">"\${aShort}"</span>),
          </div>
        \`;
      });
    }

    function flipCard() {
      fcIsFlipped = !fcIsFlipped;
      renderFlashcards();
    }

    function navigateCards(dir) {
      if (dir === 1 && fcCurrentIdx < filteredCards.length - 1) {
        fcIsFlipped = false;
        setTimeout(() => {
          fcCurrentIdx++;
          renderFlashcards();
        }, 100);
      } else if (dir === -1 && fcCurrentIdx > 0) {
        fcIsFlipped = false;
        setTimeout(() => {
          fcCurrentIdx--;
          renderFlashcards();
        }, 100);
      }
    }

    function gradeCard(status) {
      if (filteredCards.length === 0) return;
      const cardId = filteredCards[fcCurrentIdx].id;
      studyHistory[cardId] = status;
      saveState();

      // Auto advance
      if (fcCurrentIdx < filteredCards.length - 1) {
        setTimeout(() => {
          navigateCards(1);
        }, 300);
      } else {
        render();
      }
    }

    function resetStudyHistory() {
      if (confirm("Are you sure you want to reset all flashcard mastery states?")) {
        studyHistory = {};
        saveState();
        filterCards('all');
      }
    }

    function copyPythonSnippet() {
      const listToFormat = filteredCards.length > 0 ? filteredCards : flashcards;
      const formatted = listToFormat
        .map(fc => \`    (\${JSON.stringify(fc.question)}, \${JSON.stringify(fc.answer)})\`)
        .join(",\\n");
      const code = \`cards = [\\n\${formatted}\\n]\`;

      navigator.clipboard.writeText(code).then(() => {
        const btnText = document.getElementById('copy-btn-text');
        btnText.innerText = "COPIED SNIPPET ✔";
        setTimeout(() => {
          btnText.innerText = "COPY PYTHON LIST";
        }, 2000);
      });
    }

    // 3. Render Exam Simulator Tab
    function renderQuiz() {
      const activeQ = trickQuestions[qCurrentIdx];
      const resultStatus = quizHistory[activeQ.id];

      // Progress bar header
      document.getElementById('quiz-header-text').innerText = \`Question \${qCurrentIdx + 1} of \${trickQuestions.length} • \${activeQ.domainName}\`;

      // Badge
      const badge = document.getElementById('quiz-result-badge');
      if (resultStatus !== undefined) {
        badge.classList.remove('hidden');
        if (resultStatus === true) {
          badge.className = "text-[9px] font-extrabold px-2 py-0.5 rounded-sm border uppercase tracking-wider bg-emerald-50 border-emerald-200 text-emerald-800";
          badge.innerText = "Passed";
        } else {
          badge.className = "text-[9px] font-extrabold px-2 py-0.5 rounded-sm border uppercase tracking-wider bg-rose-50 border-rose-200 text-rose-800";
          badge.innerText = "Failed";
        }
      } else {
        badge.classList.add('hidden');
      }

      // Scenario
      document.getElementById('quiz-scenario-text').innerText = activeQ.scenario;

      // Stats counts
      const correctCount = Object.values(quizHistory).filter(Boolean).length;
      document.getElementById('quiz-correct-count').innerText = correctCount;

      // Option dots
      const dotsContainer = document.getElementById('quiz-dots-container');
      dotsContainer.innerHTML = '';
      trickQuestions.forEach((q, idx) => {
        const isCurrent = idx === qCurrentIdx;
        const hasPassed = quizHistory[q.id];
        
        let dotStyle = "bg-slate-200 text-slate-500";
        if (isCurrent) {
          dotStyle = "bg-blue-600 text-white ring-2 ring-blue-100";
        } else if (hasPassed === true) {
          dotStyle = "bg-emerald-500 text-white";
        } else if (hasPassed === false) {
          dotStyle = "bg-rose-500 text-white";
        }

        dotsContainer.innerHTML += \`
          <button onclick="jumpToQuiz(\${idx})" class="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold font-mono transition-all \${dotStyle}">
            \${idx + 1}
          </button>
        \`;
      });

      // Render Multiple Choices
      const optionsContainer = document.getElementById('quiz-options-container');
      optionsContainer.innerHTML = '';

      activeQ.options.forEach(opt => {
        const isSelected = qSelectedKey === opt.key;
        const isCorrectChoice = opt.key === activeQ.correctAnswer;
        
        let style = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700";
        let markerBg = "bg-slate-100 text-slate-500";
        let rightBadge = '';

        if (qIsSubmitted) {
          if (isCorrectChoice) {
            style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
            markerBg = "bg-emerald-600 text-white";
            rightBadge = '<span class="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">CORRECT ANSWER</span>';
          } else if (isSelected) {
            style = "border-rose-400 bg-rose-50 text-rose-900 font-medium";
            markerBg = "bg-rose-600 text-white";
            rightBadge = '<span class="text-[9px] font-mono font-extrabold text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">YOUR TRICKED CHOICE</span>';
          } else {
            style = "border-slate-100 bg-white text-slate-400 opacity-60 cursor-not-allowed";
          }
        } else if (isSelected) {
          style = "border-[#FF9900] bg-orange-50/50 text-slate-900 font-medium ring-1 ring-[#FF9900]/40";
          markerBg = "bg-[#FF9900] text-white";
        }

        optionsContainer.innerHTML += \`
          <div onclick="selectQuizOption('\${opt.key}')" class="p-3.5 border rounded-sm text-xs transition-all flex items-start gap-3 select-none cursor-pointer \${style}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 \${markerBg}">\${opt.key}</span>
            <span class="leading-relaxed flex-1">\${opt.text}</span>
            \${rightBadge}
          </div>
        \`;
      });

      // Prev Next Submit Buttons
      document.getElementById('btn-quiz-prev').disabled = (qCurrentIdx === 0);
      document.getElementById('btn-quiz-next').disabled = (qCurrentIdx === trickQuestions.length - 1);

      const submitBtn = document.getElementById('btn-quiz-submit');
      if (qIsSubmitted) {
        submitBtn.innerText = "Proceed to Next";
        submitBtn.className = "px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-sm transition-all uppercase tracking-wider";
        submitBtn.disabled = (qCurrentIdx === trickQuestions.length - 1);
        submitBtn.setAttribute('onclick', 'navigateQuiz(1)');
      } else {
        submitBtn.innerText = "Submit & Verify Answer";
        submitBtn.className = "px-5 py-2 bg-[#FF9900] hover:bg-orange-600 text-white text-xs font-bold rounded-sm border border-orange-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider";
        submitBtn.disabled = !qSelectedKey;
        submitBtn.setAttribute('onclick', 'submitQuizAnswer()');
      }

      // Render Analysis Panel
      const lockedPanel = document.getElementById('quiz-analysis-locked');
      const unlockedPanel = document.getElementById('quiz-analysis-unlocked');

      if (!qIsSubmitted) {
        lockedPanel.classList.remove('hidden');
        unlockedPanel.classList.add('hidden');
      } else {
        lockedPanel.classList.add('hidden');
        unlockedPanel.classList.remove('hidden');

        // Dynamic result banner
        const isUserCorrect = qSelectedKey === activeQ.correctAnswer;
        const banner = document.getElementById('quiz-feedback-banner');
        if (isUserCorrect) {
          banner.className = "p-3 rounded-sm text-xs font-bold flex items-center gap-2 border bg-emerald-950/40 border-emerald-500/30 text-emerald-400";
          banner.innerHTML = \`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"></path></svg> Incredible job! You successfully bypassed the distractor trap.\`;
        } else {
          banner.className = "p-3 rounded-sm text-xs font-bold flex items-center gap-2 border bg-rose-950/40 border-rose-500/30 text-rose-400";
          banner.innerHTML = \`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Tricked! Option \${qSelectedKey} is a classic AWS exam distractor.\`;
        }

        document.getElementById('quiz-trap-text').innerText = activeQ.trickAlert;
        document.getElementById('quiz-correct-header').innerText = \`✓ Why Answer \${activeQ.correctAnswer} is Correct:\`;
        document.getElementById('quiz-correct-desc').innerText = activeQ.correctExplanation;

        // Distractor break list
        const distractorContainer = document.getElementById('quiz-distractor-list');
        distractorContainer.innerHTML = '';
        Object.entries(activeQ.distractorExplanations).forEach(([key, val]) => {
          if (key === activeQ.correctAnswer) return;
          distractorContainer.innerHTML += \`
            <div class="text-[10.5px] bg-slate-950/30 p-2 border border-slate-800/50 rounded-sm leading-normal">
              <span class="font-mono font-bold text-slate-300 mr-1 uppercase">Option \${key}:</span>
              <span class="text-slate-400">\${val}</span>
            </div>
          \`;
        });
      }
    }

    function selectQuizOption(key) {
      if (qIsSubmitted) return;
      qSelectedKey = key;
      renderQuiz();
    }

    function submitQuizAnswer() {
      if (!qSelectedKey || qIsSubmitted) return;
      const activeQ = trickQuestions[qCurrentIdx];
      const isCorrect = qSelectedKey === activeQ.correctAnswer;
      quizHistory[activeQ.id] = isCorrect;
      qIsSubmitted = true;
      saveState();
      render();
    }

    function navigateQuiz(dir) {
      if (dir === 1 && qCurrentIdx < trickQuestions.length - 1) {
        qCurrentIdx++;
        qSelectedKey = null;
        qIsSubmitted = false;
        // Check if already submitted before to show correct state
        const historyStatus = quizHistory[trickQuestions[qCurrentIdx].id];
        if (historyStatus !== undefined) {
          // If already solved, reset select key but don't force redo
        }
        renderQuiz();
      } else if (dir === -1 && qCurrentIdx > 0) {
        qCurrentIdx--;
        qSelectedKey = null;
        qIsSubmitted = false;
        renderQuiz();
      }
    }

    function jumpToQuiz(idx) {
      qCurrentIdx = idx;
      qSelectedKey = null;
      qIsSubmitted = false;
      renderQuiz();
    }

    function resetQuiz() {
      if (confirm("Reset all quiz answers?")) {
        quizHistory = {};
        saveState();
        qCurrentIdx = 0;
        qSelectedKey = null;
        qIsSubmitted = false;
        render();
      }
    }

    // 4. Render Distractor Vault Tab
    function renderVault() {
      const container = document.getElementById('vault-items-container');
      const emptyState = document.getElementById('vault-empty-state');
      container.innerHTML = '';

      // Filter items
      const filtered = distractorVault.filter(item => {
        const matchesSearch = 
          item.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
          item.serviceA.toLowerCase().includes(vaultSearch.toLowerCase()) ||
          item.serviceB.toLowerCase().includes(vaultSearch.toLowerCase()) ||
          item.keyTrap.toLowerCase().includes(vaultSearch.toLowerCase());

        const matchesCategory = vaultSelectedCategory === 'all' || item.category === vaultSelectedCategory;

        return matchesSearch && matchesCategory;
      });

      document.getElementById('vault-items-count').innerText = filtered.length;

      if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      filtered.forEach(item => {
        container.innerHTML += \`
          <div class="bg-white border border-slate-200 rounded-sm shadow-xs hover:shadow-sm hover:border-slate-300 transition-all overflow-hidden animate-fade-in">
            <!-- Card Header Banner -->
            <div class="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-4 bg-[#FF9900] rounded-sm shrink-0"></div>
                <h4 class="font-extrabold text-slate-800 text-sm tracking-tight">\${item.title}</h4>
              </div>
              <span class="text-[9px] uppercase font-extrabold tracking-widest text-[#FF9900] bg-orange-50 px-2 py-0.5 border border-orange-100 rounded-sm self-start sm:self-auto">
                \${item.category}
              </span>
            </div>

            <!-- Side-by-Side Service Comparison -->
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <!-- Service A -->
              <div class="p-5 space-y-2">
                <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest block font-mono">OPTION A: \${item.serviceA}</span>
                <p class="text-xs text-slate-600 leading-relaxed font-medium">\${item.serviceAUsage}</p>
              </div>

              <!-- Service B -->
              <div class="p-5 space-y-2">
                <span class="text-[10px] font-black text-purple-600 uppercase tracking-widest block font-mono">OPTION B: \${item.serviceB}</span>
                <p class="text-xs text-slate-600 leading-relaxed font-medium">\${item.serviceBUsage}</p>
              </div>
            </div>

            <!-- The Exam Trap Warning Banner -->
            <div class="bg-amber-50/55 p-4 border-t border-slate-100 flex items-start gap-3">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <div class="text-xs">
                <span class="font-extrabold text-amber-800 uppercase tracking-wider block mb-0.5">How to Tell Them Apart on the Exam (Trap exposed):</span>
                <p class="text-slate-600 leading-relaxed">\${item.keyTrap}</p>
              </div>
            </div>
          </div>
        \`;
      });
    }

    function searchVault() {
      vaultSearch = document.getElementById('vault-search-input').value;
      renderVault();
    }

    function filterVault(category) {
      vaultSelectedCategory = category;

      // Update button highlights
      document.querySelectorAll('.vault-cat-btn').forEach(btn => {
        btn.classList.remove('bg-[#FF9900]', 'text-white', 'border-[#FF9900]', 'shadow-sm');
        btn.classList.add('bg-slate-50', 'text-slate-600', 'border-slate-200/60');
      });

      const elementMap = {
        'all': 'vault-cat-all',
        'Security & Protection': 'vault-cat-security',
        'Security & Threat Detection': 'vault-cat-threat',
        'Storage': 'vault-cat-storage',
        'Networking': 'vault-cat-networking',
        'Billing & Cost Optimization': 'vault-cat-billing',
        'Audit & Best Practice': 'vault-cat-audit'
      };

      const elementId = elementMap[category];
      if (elementId) {
        const btn = document.getElementById(elementId);
        btn.classList.remove('bg-slate-50', 'text-slate-600', 'border-slate-200/60');
        btn.classList.add('bg-[#FF9900]', 'text-white', 'border-[#FF9900]', 'shadow-sm');
      }

      renderVault();
    }

    // Startup Init
    loadState();
    switchTab('dashboard');
  </script>
</body>
</html>`;
}
