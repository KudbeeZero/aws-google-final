# Agent Workspace Instructions & Memory (AGENTS.md)

This file maintains project-specific development guidelines, personal user preferences, and strict operational constraints for AI coding agents working in this repository.

---

## 🚫 Critical Constraints & Merge Preferences

*   **NO AUTO-MERGES:** The AI coding agent is **STRICTLY FORBIDDEN** from auto-merging any branches, committing code directly to protected production states, or completing Pull Requests without explicit, real-time approval from the user.
*   **NO UNSOLICITED PRs:** The agent must never open a Pull Request automatically or promote code to staging/production without a direct prompt instructing it to do so.
*   **STEP-BY-STEP PROGRESSION:** Prioritize completing the current specific feature, verifying its stability via `lint_applet` and `compile_applet`, and gathering feedback before initiating any next roadmap steps.

---

## 💡 Developer Guidelines & Workspace Strategy

1.  **Strict Scope Discipline:** Avoid introducing unrequested feature drift. Build exactly what is specified in active user requests or prioritized roadmap items.
2.  **Full-Stack and API Security:** Keep all API keys (such as the Gemini API Key or database credentials) strictly server-side. Proxy external client interactions through Express `/api/*` endpoints.
3.  **No Mock Infrastructure:** Ensure cloud-synced storage operates on real Cloud SQL (Postgres via Drizzle ORM) or Firebase Authentication instances, maintaining a local fallback (`localStorage`) when users are in offline/guest modes.
4.  **Desktop-First Precision:** Build visually stunning, adaptive user interfaces using Tailwind CSS, featuring elegant typographic pairs (e.g., Inter display headings) and high-fidelity interaction feedback.

---

## 🎯 Active Tasks & Current Focus

The active items on our roadmap are:
*   **Task 3: Offline-to-Cloud State Reconciliation (Completed)**
    *   **Focus:** Designed an intelligent syncing mechanism that handles state reconciliation for users starting as guests (stored in `localStorage`) or offline, merging their study sessions and logs cleanly upon authentication/reconnection.
*   **Task 4: Technical Interview / Exam Simulator Archival (Completed)**
    *   **Focus:** Built database storage schemas in Cloud SQL to save and display historic technical interview transcripts, scores, and mock interview cards inside the student dashboard for comprehensive performance analysis over time.
*   **ElevenLabs Text-to-Speech Voice Integration (Completed)**
    *   **Focus:** Implemented a secure, server-side ElevenLabs Text-to-Speech proxy (`/api/elevenlabs/tts`) supporting five custom narrators (Adam, Antoni, Arnold, Rachel, Domi). Designed interactive bubble-level "Listen" buttons with live play, pause, stop, and loading states, with automatic audio context cleanup on unmount.
*   **Task 5: Graceful Session & Middleware Error Handling (Completed)**
    *   **Focus:** Hardened backend auth middleware (`src/middleware/auth.ts`) to handle network dropouts, stale Firebase tokens, or database connection pool timeouts with guest fallbacks. Enhanced Gemini API routes (`/api/gemini/professor-chat`, `/api/gemini/evaluate-interview`, `/api/gemini/agent-insight`) with offline advisory fallbacks during 503 high-demand periods. Fixed duplicate React option key warnings across interactive components.
*   **Task 6: Global Leaderboard Real-Time Optimization & Express Fallback (Completed)**
    *   **Focus:** Removed all mock candidate profiles. Fixed endless spinning by adding a strict timeout wrapper around Firestore calls and implementing a server-backed Express API endpoint (`/api/leaderboard`) with `.cache/leaderboard.json` disk persistence. Real candidate data now loads instantly without hanging on uninitialized Firestore databases.
*   **Task 7: Firestore Custom Database ID Initialization (Completed)**
    *   **Focus:** Updated `src/lib/firebase.ts` to pass the `firestoreDatabaseId` (`ai-studio-awsgoogle-604aa811-c001-435f-9b8a-79bcde52948d`) directly to `getFirestore(app, databaseId)` from `firebase-applet-config.json`, resolving `(default)` database warnings and ensuring seamless multi-region cloud database connectivity.
*   **Task 8: iPhone & Mobile CSS Optimizations (Completed)**
    *   **Focus:** Enhanced `index.html` with viewport-fit=cover and status bar styling. Added iPhone safe area inset padding (`safe-top`, `safe-bottom`), smooth momentum touch scrolling (`touch-scroll`), tap highlight removal, and 44px minimum touch targets in `src/index.css` for a native app feel on mobile devices.
*   **Task 9: Mobile Bottom Navigation & iOS Scroll Locking Refinement (Completed)**
    *   **Focus:** Refined the mobile bottom navigation bar active state logic (`activeTab`) to correctly reflect sub-page selections like 'matching' or 'vault' under the Tools menu, and added automatic iOS body scroll locking (`overflow: hidden`) when `showMobileMoreMenu` is open.
*   **Task 10: Interactive UserProfile Component & Leaderboard Integration (Completed)**
    *   **Focus:** Created the dedicated `UserProfile` component (`src/components/UserProfile.tsx`) displaying candidate avatars, join dates, total study minutes, projected exam scores, and historical streak accomplishments. Integrated it directly into the global leaderboard so clicking any candidate instantly opens their professional profile.
*   **Task 11: UserProfile Milestone Badges & Audio Cache Service (Completed)**
    *   **Focus:** Enhanced `UserProfile.tsx` with dynamic visual milestone badges ('7-Day Streak Master', '100 Minutes Club', '30-Day Elite', and 'Algorand ASA Verified') with unlock status indicators. Also created `src/services/audioCacheService.ts` to support offline audio caching and text-to-speech fallback narration.
*   **Task 12: Interactive Elements Haptic & Active State Animation (Completed)**
    *   **Focus:** Updated `src/index.css` to add a subtle `scale: 0.97` active animation to buttons and anchors globally, creating native-feeling haptic feedback and improving tactile interaction primarily for iOS and mobile devices.
*   **Task 13: Agent Swarm Autonomous Evaluation Upgrade (Completed)**
    *   **Focus:** Upgraded the Agent Swarm Hub to use real Gemini API (`/api/gemini/agent-insight`) for Copilot Studio Autonomous Workflows, Cheat Sheet Distillation, and the Swarm Diagnostic Pulse check, replacing previously hardcoded local artifacts.
*   **Task 14: Cloud Sync Status Indicator Enhancement (Completed)**
    *   **Focus:** Upgraded the header's Cloud Sync Status Indicator in `src/App.tsx` to prominently display the last successful cloud synchronization timestamp (`Last saved: 10:42:05 AM`) alongside the syncing animation, ensuring users have precise confidence in their data persistence.
*   **Task 15: Manual Force Sync Trigger (Completed)**
    *   **Focus:** Added a manual 'Force Sync' button next to the cloud status indicator in `src/App.tsx` allowing users to instantly push their local state to the Cloud SQL backend database via `saveProgressToCloud`.
*   **Task 16: Agent Swarm UX & Tooltips Enhancement (Completed)**
    *   **Focus:** Enhanced the Agent Swarm Hub by introducing a dedicated "How It Works" guided onboarding section, updating empty states for knowledge exchange feeds and autonomous telemetry consoles, and clarifying interaction contexts for Copilot Studio.
*   **Task 17: Global Stability & Application Error Handling (Completed)**
    *   **Focus:** Hardened the application architecture against crashes by implementing global `uncaughtException` and `unhandledRejection` node process listeners in `server.ts`. Implemented an Express global API error handling middleware to gracefully respond to frontend requests. Added global `unhandledrejection` and `error` event listeners in `main.tsx` to trap asynchronous React state failures outside the standard ErrorBoundary constraints.
*   **Task 18: Premium Application Polish & Diagnostic Suite (Completed)**
    *   **Focus:** Delivered five comprehensive app polishing and optimization modules:
        1. **Live Local Telemetry Scanning:** Upgraded `ProactiveGapFiller` to dynamically inspect local browser database keys, surfacing authentic weak architectural spots based on actual failed quiz histories and review deck flags.
        2. **Socratic Concept Practice Check:** Added an interactive practice question engine in `ProactiveGapFiller` that streams tailored AWS exam multiple-choice questions with animated feedback and XP milestone awards.
        3. **Advanced Voice Playback parameters:** Injected state preferences for playback rate speeds (0.8x - 1.5x) and narration volume level parameters inside `InteractiveProfessor` with live localStorage persistence.
        4. **Cloud Network Health and Ping Diagnostics:** Built an absolute-positioned status dashboard containing online socket checkers, custom Firestore validation, and real-time backend Express latency pings in milliseconds.
        5. **Sleek Aesthetic Transitions:** Hardened active tactile interactions and visual status transitions with responsive styling cues.
*   **Task 19: Agent Swarm Analytics Dashboard (Completed)**
    *   **Focus:** Created a high-fidelity 'Agent Analytics' dashboard inside the `AgentSwarmHub`. Visualized API response latency, input/output token usage, and successful task completion rates for each specialized swarm agent using custom-configured Recharts. Integrated interactive simulated workloads and real-time transaction logs.
*   **Task 20: Visual Architecture Learning Studio (Completed)**
    *   **Focus:** Created the `VisualArchitectureLearning` component to provide interactive AWS reference architecture topologies (3-Tier VPC, Serverless Event-Driven API, and CloudFront CDN + S3). Features click-to-inspect service cards with deep AWS Well-Architected pillars (Security, Cost, Performance), interactive exam pro-tips, and blueprint scenario challenge questions with XP rewards.
*   **Task 21: Mobile Vertical & Touch Target CSS Enhancements (Completed)**
    *   **Focus:** Upgraded `index.css` with dedicated mobile-first vertical stacking utilities (`.mobile-stack`, `.mobile-full-width`, `.mobile-p-3`), horizontal overscroll protection, 44px minimum touch targets for all interactive controls on touch viewports, and safe area inset layout padding.
*   **Task 22: Agent Swarm & Mobile Button Layout Polish (Completed)**
    *   **Focus:** Overhauled the Agent Swarm Hub header actions and view-mode switcher tabs with responsive flex wrapping, 44px minimum touch heights, full-width mobile button layouts, and high-contrast active states to ensure seamless usability across all touch devices and viewports.
*   **Task 23: Lightning Blitz Rush & Daily Mystery Loot Arena (Completed)**
    *   **Focus:** Created the `LightningRushArena` component introducing high-energy gamification mechanics to maximize user engagement: a 60-second rapid-fire AWS Cloud Practitioner trivia sprint with streak multipliers and time extensions, daily mystery loot crates with randomized bonus XP and badge rewards, and actionable daily quests.
*   **Task 24: IndexedDB ElevenLabs Audio Caching Service (Completed)**
    *   **Focus:** Upgraded `src/services/audioCacheService.ts` to store frequently requested ElevenLabs audio responses in IndexedDB (`AWSExamAudioCacheDB`), preventing redundant API calls and credit waste while offering seamless localStorage fallback and instant offline playback.
*   **Task 25: Unified Error Handling Wrapper & Demo Mode Fallback (Completed)**
    *   **Focus:** Created a central State Manager (`handleCloudOperation`) in `App.tsx` for all Firestore and cloud operations. Automatically catches 'database not found', '503', and network errors, seamlessly switching the app to a read-only 'Demo Mode' using cached local data with a responsive notification banner and manual retry control.
*   **Task 26: Mobile CSS & Touch Experience Polish (Completed)**
    *   **Focus:** Further hardened mobile touch targets, safe area inset padding, smooth momentum scrolling, and responsive button layouts across the entire application for a native app experience on mobile devices and tablets.
*   **Task 27: Algorand Web Developer CLI & Smart Contract Sandbox (Completed)**
    *   **Focus:** Integrated an interactive AlgoKit CLI terminal and Smart Contract Sandbox into the Algorand Portal (`AlgorandPortal.tsx`). Supports simulated commands (`algokit init`, `goal node status`, `tealscript compile`, `algosdk ping`), live TEALScript code previews (State Counter, Atomic Escrow, Token Minter), and one-click TestNet deployment simulations.
*   **Task 28: Distractor Vault Overhaul & Stability Hardening (Completed)**
    *   **Focus:** Resolved dark mode styling and re-render stability issues in `TheDistractorVault.tsx`. Added mastery progress tracking, high-risk trap flagging, interactive TTS speech narration, copy-to-clipboard actions, and interactive 'Test Me On This Trap' mini-quiz challenges. Expanded the Distractor dataset in `src/data.ts` to cover 18+ high-yield AWS CLF-C02 service pairs.
*   **Task 29: Unified Gamification Engine & Loot Crate System (Completed)**
    *   **Focus:** Built `src/services/gamificationService.ts` providing reactive study XP progression, levels (500 XP / level), rarity tiers (Common, Rare, Epic, Legendary, Mythic), daily mystery loot drop cooldowns, and animated reward opening states. Deeply integrated into `InteractiveProfessor` for real-time Socratic drilling rewards.
*   **Task 30: Agent Swarm Bounties & Swarm Loot Terminal Integration (Completed)**
    *   **Focus:** Integrated the gamification engine directly into `AgentSwarmHub.tsx` and `LightningRushArena.tsx`. Introduced daily autonomous agent bounties (Archie, Guardian, PennyWise, TrapMaster, Alex) with live AI evaluations, mystery crate rewards, inventory vaults, and cross-component XP syncing.
*   **Task 31: Exam Readiness Milestone Level-Up & Badge System (Completed)**
    *   **Focus:** Designed and integrated `ReadinessMilestones.tsx` into the primary dashboard view. Provides an animated 4-tier milestone ladder (🥉 Cloud Novice at 25%, 🥈 Cloud Architect at 50%, 🥇 Lead Specialist at 75%, and 👑 Cloud Guru at 100%), with automatic XP and loot crate rewards, confetti level-up celebrations, interactive badge inspection modals, and widget customizer integration.
*   **Task 32: New Age Slot Machine Game & Socratic Bonus Jackpot Arena (Completed)**
    *   **Focus:** Created `NewAgeSlotMachine.tsx` and procedural Web Audio engine `slotAudio.ts`. Implemented a 3x3 slot reel matrix with AWS cloud services (Lambda, DynamoDB, S3, EC2, CloudFront, Aurora, IAM, Shield, Scatter). Features 5 evaluation paylines, architecture synergy combos, Socratic Bonus Arena with multiplier rewards, and seamless integration with `gamificationService.ts`.
*   **Task 33: Tactical In-Game Hints & Deep Game Metrics Engine (Completed)**
    *   **Focus:** Expanded the gamification engine with comprehensive metrics tracking (accuracy %, reaction times, lifeline telemetry, win rates, rating tiers, and session histories). Enhanced in-game hints with 50:50 lifelines, time-freezes, and combo-protection shields across game modes.
*   **Task 34: Physical Reel Spinning Upgrade & 4 Slot Game Modes (Completed)**
    *   **Focus:** Overhauled `NewAgeSlotMachine.tsx` and `slotAudio.ts` with interactive tactile chrome lever pulling, mechanical physics animations, nudge controls (Up/Down step near-miss adjustments), random Wild Lightning Strikes, and 4 dedicated game modes: Classic Neo-Slots, Chaos Overdrive Fever Mode (unlimited free credits with fever multipliers), 60-Second Timed Rush Marathon, and Architect Boss Raid PvE Battle against the 'Downtime DDoS Behemoth' and 'Bill Shock Dragon'.



