import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { requireAuth } from "./src/middleware/auth.js";
import { db } from "./src/db/index.js";
import { userProgress, roadmapItems, chatHistory, interviewSessions } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Save interview session
  app.post("/api/interview-session", requireAuth, async (req: any, res) => {
    try {
      const { sessionId, scenarioId, transcript, scorecard } = req.body;
      await db.insert(interviewSessions).values({
        userId: req.dbUser.id,
        sessionId,
        scenarioId,
        transcript,
        scorecard: JSON.stringify(scorecard || {}),
        createdAt: new Date(),
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save interview session:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Get study progress
  app.get("/api/progress", requireAuth, async (req: any, res) => {
    try {
      const result = await db.select().from(userProgress).where(eq(userProgress.userId, req.dbUser.id)).then(res => res[0]);
      if (result) {
        res.json({
          totalStudyMinutes: result.totalStudyMinutes,
          todayStudyMinutes: result.todayStudyMinutes,
          dailyStudyGoal: result.dailyStudyGoal,
          studyHistory: JSON.parse(result.studyHistory),
          quizHistory: JSON.parse(result.quizHistory),
          dailyMinutesLog: JSON.parse(result.dailyMinutesLog)
        });
      } else {
        res.json(null);
      }
    } catch (err) {
      console.error("Failed to fetch progress from Postgres:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Save study progress
  app.post("/api/progress", requireAuth, async (req: any, res) => {
    try {
      const { totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, dailyMinutesLog } = req.body;
      await db.insert(userProgress)
        .values({
          userId: req.dbUser.id,
          totalStudyMinutes: totalStudyMinutes || 0,
          todayStudyMinutes: todayStudyMinutes || 0,
          dailyStudyGoal: dailyStudyGoal || 30,
          studyHistory: JSON.stringify(studyHistory || {}),
          quizHistory: JSON.stringify(quizHistory || {}),
          dailyMinutesLog: JSON.stringify(dailyMinutesLog || {}),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userProgress.userId,
          set: {
            totalStudyMinutes: totalStudyMinutes || 0,
            todayStudyMinutes: todayStudyMinutes || 0,
            dailyStudyGoal: dailyStudyGoal || 30,
            studyHistory: JSON.stringify(studyHistory || {}),
            quizHistory: JSON.stringify(quizHistory || {}),
            dailyMinutesLog: JSON.stringify(dailyMinutesLog || {}),
            updatedAt: new Date(),
          }
        });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save progress in Postgres:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Get roadmap
  app.get("/api/roadmap", requireAuth, async (req: any, res) => {
    try {
      const result = await db.select().from(roadmapItems).where(eq(roadmapItems.userId, req.dbUser.id)).then(res => res[0]);
      res.json(result ? JSON.parse(result.items) : []);
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Save roadmap
  app.post("/api/roadmap", requireAuth, async (req: any, res) => {
    try {
      const { items } = req.body;
      await db.insert(roadmapItems)
        .values({
          userId: req.dbUser.id,
          items: JSON.stringify(items || []),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: roadmapItems.userId,
          set: {
            items: JSON.stringify(items || []),
            updatedAt: new Date(),
          }
        });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save roadmap:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Get chat history
  app.get("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const result = await db.select().from(chatHistory).where(eq(chatHistory.userId, req.dbUser.id)).then(res => res[0]);
      res.json(result ? JSON.parse(result.history) : []);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API: Save chat history
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const { history } = req.body;
      await db.insert(chatHistory)
        .values({
          userId: req.dbUser.id,
          history: JSON.stringify(history || []),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: chatHistory.userId,
          set: {
            history: JSON.stringify(history || []),
            updatedAt: new Date(),
          }
        });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save chat history:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
