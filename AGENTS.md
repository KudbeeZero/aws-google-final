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

The first item on our roadmap is:
*   **Task 1: Cloudflare & Web-Ready Sign-In Setup**
    *   **Focus:** Assuring the sign-in and persistent user state works perfectly across staging URLs and prepared web host configurations, validating the user authentication lifecycle cleanly.
