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


