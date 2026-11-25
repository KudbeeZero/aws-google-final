import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Define the 'users' table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define 'user_progress' table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  totalStudyMinutes: integer("total_study_minutes").default(0).notNull(),
  todayStudyMinutes: integer("today_study_minutes").default(0).notNull(),
  dailyStudyGoal: integer("daily_study_goal").default(30).notNull(),
  studyHistory: text("study_history").default("{}").notNull(), // JSON string for flashcard states
  quizHistory: text("quiz_history").default("{}").notNull(),   // JSON string for quiz states
  dailyMinutesLog: text("daily_minutes_log").default("{}").notNull(), // JSON string for daily study minutes
  honePathwayState: text("hone_pathway_state").default("{}").notNull(),
  trickSimulatorState: text("trick_simulator_state").default("{}").notNull(),
  vaultState: text("vault_state").default("{}").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define 'roadmap_items' table
export const roadmapItems = pgTable("roadmap_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  items: text("items").default("[]").notNull(), // JSON string of career roadmap items
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define 'chat_history' table
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  history: text("history").default("[]").notNull(), // JSON string of AWS professor chats
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define 'interview_sessions' table
export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  sessionId: text("session_id").notNull(),
  scenarioId: text("scenario_id").notNull(),
  transcript: text("transcript").notNull(),
  scorecard: text("scorecard").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define 'verified_questions' table (Global AI-reviewed CLF-C02 + SAA-C03 Question Bank)
export const verifiedQuestions = pgTable("verified_questions", {
  id: serial("id").primaryKey(),
  externalKey: text("external_key").notNull().unique(),
  certTrack: text("cert_track").notNull(), // "CLF-C02" | "SAA-C03"
  domainId: text("domain_id").notNull(),
  pillar: text("pillar").notNull(), // 6 AWS Well-Architected Pillars
  difficulty: text("difficulty").default("associate").notNull(), // "foundation" | "associate" | "challenge"
  scenario: text("scenario").notNull(),
  optionsJson: text("options_json").notNull(), // JSON array of 4 strings
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  trapNote: text("trap_note").default("").notNull(),
  audioScript: text("audio_script").default("").notNull(),
  aiReviewScore: integer("ai_review_score").default(92).notNull(),
  aiReviewNotes: text("ai_review_notes").default("").notNull(),
  reviewedByModel: text("reviewed_by_model").default("gemini-4-hydrogen").notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define 'agent_shared_memory' table (Unified Cross-Aware AI Agent Workforce Memory)
export const agentSharedMemory = pgTable("agent_shared_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  activeCertTrack: text("active_cert_track").default("CLF-C02").notNull(),
  pillarScoresJson: text("pillar_scores_json").default("{}").notNull(),
  weakConceptsJson: text("weak_concepts_json").default("[]").notNull(),
  recentEventsJson: text("recent_events_json").default("[]").notNull(),
  bubblePreferencesJson: text("bubble_preferences_json").default("{}").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define 'agent_handoff_logs' table (Chronological Cross-Agent Handoffs & Pillar Insights)
export const agentHandoffLogs = pgTable("agent_handoff_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  fromAgent: text("from_agent").notNull(),
  toAgent: text("to_agent").notNull(),
  pillar: text("pillar").notNull(),
  certTrack: text("cert_track").default("CLF-C02").notNull(),
  summary: text("summary").notNull(),
  recommendedTab: text("recommended_tab").default("question-bank").notNull(),
  resolved: integer("resolved").default(0).notNull(), // 0 = active, 1 = resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define 'readiness_projections_16' table (Proprietary CMI-16 Readiness & Global Benchmark Snapshots)
export const readinessProjections16 = pgTable("readiness_projections_16", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  certTrack: text("cert_track").default("CLF-C02").notNull(),
  overallScore: integer("overall_score").default(0).notNull(),
  scaledScore: integer("scaled_score").default(100).notNull(),
  passProbability: integer("pass_probability").default(0).notNull(),
  dimensionsJson: text("dimensions_json").default("[]").notNull(), // All 16 CMI dimensions JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define 'sqs_event_queue' table (Interactive HERMES SQS Study Event Stream & DLQ)
export const sqsEventQueue = pgTable("sqs_event_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  messageId: text("message_id").notNull(),
  queueType: text("queue_type").default("standard").notNull(), // "standard" | "fifo"
  eventType: text("event_type").notNull(), // "quiz_fail" | "quiz_pass" | "trap_triggered" | "card_review" | "pillar_gap"
  conceptKey: text("concept_key").notNull(),
  conceptTitle: text("concept_title").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").default("queued").notNull(), // "queued" | "in_flight" | "dead_letter" | "processed"
  receiveCount: integer("receive_count").default(0).notNull(),
  visibilityTimeoutUntil: timestamp("visibility_timeout_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

