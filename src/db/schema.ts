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
