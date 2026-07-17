# AWS CCP Masterclass Study App - Project Roadmap

This document outlines the current project trajectory, tracking the remaining functional enhancements from our interrupted PR and documenting historically encountered/resolved TypeScript compilation issues.

---

## 🚀 The 6 Prioritized Tasks (from Interrupted PR)

These tasks are structured to deliver a robust, persistent, and highly polished full-stack preparation experience for the AWS Certified Cloud Practitioner exam.

| Priority | Task Name | Description | Status |
| :---: | :--- | :--- | :--- |
| **1** | **Cloudflare & Web-Ready Sign-In Setup** | Review, test, and adapt Firebase Authentication configurations (Authorized Domains, redirect handling, and cookie policies) to support seamless authentication when running on external web hosts like Cloudflare Pages/Workers, without breaking the dev environment. | ✅ Completed |
| **-** | **Global Streaks Leaderboard** | Implement a global study streak leaderboard in the dashboard, enabling users to fetch and display the top 5 learners' streaks securely from Firestore. | ✅ Completed |
| **2** | **Multi-Module Progress Persistence** | Extend the PostgreSQL (`user_progress`) schema and backend Express endpoints to fully persist student progress in sub-modules like *HonePathwayView*, *TrickQuestionSimulator*, and *TheDistractorVault*, ensuring no progress is lost across page sessions. | ⏳ Pending |
| **3** | **Offline-to-Cloud State Reconciliation** | Design an intelligent syncing mechanism that handles state reconciliation for users starting as guests (stored in `localStorage`) or offline, merging their study sessions and logs cleanly upon authentication/reconnection. | ⏳ Pending |
| **4** | **Technical Interview / Exam Simulator Archival** | Build database storage schemas to save and display historic technical interview transcripts, scores, and mock interview cards inside the student dashboard for comprehensive performance analysis over time. | ⏳ Pending |
| **5** | **Graceful Session & Middleware Error Handling** | Refine backend auth middleware to handle network dropouts, stale Firebase tokens, or database connection pool timeouts gracefully without crashing or freezing active study timers. | ⏳ Pending |
| **6** | **High-Fidelity Streak Landmark Visualizer** | Implement premium animated canvas celebrations (using particle or firework micro-interactions) in the dashboard when the study streak reaches significant milestones like the 3-day or 7-day targets. | ⏳ Pending |

---

## 🛠️ The 14 Known TypeScript Errors (Recorded & Resolved)

To ensure strict type-safety and long-term codebase maintainability, here are the 14 compilation issues that were tracked, recorded, and successfully resolved:

1. **Duplicate Identifier 'streak'**
   - **File:** `src/components/DashboardView.tsx`
   - **Cause:** Duplicate prop registration in the Component interface and an internal duplicate state declaration.
   - **Status:** ✅ Resolved

2. **Property 'dbUser' Does Not Exist on Type 'Request'**
   - **File:** `server.ts`
   - **Cause:** Express's standard `Request` interface does not implicitly contain custom injected user structures.
   - **Status:** ✅ Resolved (Augmented request typing or cast as `any` in routing files)

3. **Implicit 'any' in Middleware Router Arguments**
   - **File:** `server.ts` & `src/middleware/auth.ts`
   - **Cause:** Middleware parameters `req`, `res`, and `next` lacked explicit Type definitions with `noImplicitAny` enabled.
   - **Status:** ✅ Resolved

4. **Relative Path Import Formatting in Client-side DB Handlers**
   - **File:** `src/lib/db-client.ts`
   - **Cause:** Mixing ES Module paths and importing from server schema without clean builds.
   - **Status:** ✅ Resolved

5. **Missing Named Import for `Flame` Icon**
   - **File:** `src/App.tsx`
   - **Cause:** The `Flame` icon component was introduced in header badge rendering but was omitted from the `lucide-react` imports block.
   - **Status:** ✅ Resolved

6. **Property 'uid' of Undefined Checking on Auth Objects**
   - **File:** `src/components/InteractiveProfessor.tsx`
   - **Cause:** Accessing `user.uid` without safeguarding that the `user` state was not null.
   - **Status:** ✅ Resolved

7. **Incorrect Type-Only Import for Enums**
   - **File:** `src/types.ts`
   - **Cause:** Attempting to use `import type` to load compile-time standard TypeScript enums.
   - **Status:** ✅ Resolved

8. **Loose 'any' Index Signatures for Flashcard Histories**
   - **File:** `src/components/StorageHub.tsx`
   - **Cause:** Object indices were not properly typed to key-value mappings of card IDs to review states.
   - **Status:** ✅ Resolved

9. **Invalid ISO String Conversion to Date Type**
   - **File:** `src/db/schema.ts`
   - **Cause:** Assigning database string timestamps directly to Drizzle table entries expecting native `Date` formats.
   - **Status:** ✅ Resolved

10. **Type safety around `process.env.GEMINI_API_KEY`**
    - **File:** `src/components/InteractiveProfessor.tsx`
    - **Cause:** Referencing NodeJS environment parameters directly in Vite client components instead of using the runtime configuration mapping.
    - **Status:** ✅ Resolved

11. **Drizzle ORM Foreign Key Schema Imports**
    - **File:** `src/db/schema.ts`
    - **Cause:** Incorrect named references to `users.id` in secondary table models.
    - **Status:** ✅ Resolved

12. **React 19 Types for `children` Props**
    - **File:** `src/App.tsx`
    - **Cause:** Standard components using implicit children properties which require explicit declaration in React 19 typing.
    - **Status:** ✅ Resolved

13. **JSON Manifest Resolution at Build-Time**
    - **File:** `src/lib/firebase.ts`
    - **Cause:** Importing local JSON configurations directly in TS source code without active `resolveJsonModule` in `tsconfig`.
    - **Status:** ✅ Resolved

14. **Type safety of local storage string deserialization**
    - **File:** `src/components/InteractiveProfessor.tsx`
    - **Cause:** Parsing potentially null variables returned from `localStorage` without a fallback or type coercion.
    - **Status:** ✅ Resolved
