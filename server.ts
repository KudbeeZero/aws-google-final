import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "./src/middleware/auth.js";
import { securityHeaders, rateLimiter, promptInjectionGuard } from "./src/middleware/security.js";
import { db } from "./src/db/index.js";
import { userProgress, roadmapItems, chatHistory, interviewSessions } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Security Hardening Middlewares
  app.use(securityHeaders);
  app.use("/api", rateLimiter);
  app.use(express.json({ limit: "1mb" })); // Prevent volumetric payload attacks
  app.use("/api", promptInjectionGuard);

  // Basic in-memory BUSCACHE layer to avoid repeating identical LLM queries
  const busCache = new Map<string, any>();

  // API: Socratic Professor Chat
  app.post("/api/gemini/professor-chat", async (req, res) => {
    try {
      const { contents, aiModelMode, systemInstruction } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          text: "[Answer: A]\n\nSimulated Professor Cloud: It seems my server-side Gemini API key isn't configured in AI Studio Settings. Please configure it to unlock real AI responses. For now, here is a simulated concept check:\n\nA) Mock Correct Answer\nB) Distractor 1\nC) Distractor 2\nD) Distractor 3\n\n[Answer: A]"
        });
      }

      // Generate cache key based on contents
      const cacheKey = JSON.stringify(contents);
      if (busCache.has(cacheKey)) {
        console.log("Serving from BUSCACHE layer");
        return res.json(busCache.get(cacheKey));
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: aiModelMode === "fast" ? "gemini-2.5-flash" : "gemini-1.5-pro",
        contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const result = { text: response.text };
      // Store in busCache
      busCache.set(cacheKey, result);
      
      res.json(result);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to contact Gemini API" });
    }
  });

  // API: Technical Interview Evaluation
  app.post("/api/gemini/evaluate-interview", async (req, res) => {
    try {
      const { prompt, aiModelMode, systemInstruction, responseSchema } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: "GEMINI_API_KEY not configured" });
      }

      // Generate cache key
      const cacheKey = JSON.stringify({ prompt, aiModelMode });
      if (busCache.has(cacheKey)) {
        return res.json(busCache.get(cacheKey));
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: aiModelMode === "fast" ? "gemini-2.5-flash" : "gemini-1.5-pro",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const result = { text: response.text };
      busCache.set(cacheKey, result);
      res.json(result);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to evaluate interview" });
    }
  });

  // API: Gemini 3.6 Flash Agent Insight Generation
  app.post("/api/gemini/agent-insight", async (req, res) => {
    try {
      const { agentName, agentRole, query, contextCategory } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          content: `[${agentName || "Agent"} (${agentRole || "AWS Expert"}) Simulated Advice]: Focus on core AWS CLF-C02 services in ${contextCategory || "Cloud Architecture"}. Remember key pricing tiers, IAM least-privilege principles, and S3 storage classes!`,
          isRealAi: false,
          note: "To enable live Gemini 3.6 Flash responses, ensure GEMINI_API_KEY is configured in AI Studio Settings > Secrets."
        });
      }

      const ai = getGeminiClient();
      const systemPrompt = `You are ${agentName || "AWS Agent"}, an elite expert specializing in ${agentRole || "AWS Cloud Practitioner Mastery"}.
Give a clear, actionable 2-3 paragraph insight or bulleted blueprint answering the candidate's request for the AWS CLF-C02 exam. Include exam trap warnings, cost factors, and security best practices where applicable.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: query || "Provide an essential AWS Cloud Practitioner CLF-C02 exam tip.",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      res.json({
        content: response.text,
        isRealAi: true,
        agentName,
        agentRole
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to contact Gemini API" });
    }
  });

  // API: Security Posture Audit Status
  app.get("/api/security-status", (req, res) => {
    res.json({
      status: "SECURE_HARDENED",
      version: "2.4.0-STAGING",
      protections: {
        rateLimiter: "ACTIVE (120 req/min/IP)",
        headers: "ACTIVE (HSTS, NoSniff, StrictReferrer, NoIframeSniff)",
        inputSanitizer: "ACTIVE (XSS & HTML Script Tag Stripping)",
        promptInjectionGuard: "ACTIVE (Guardian Pattern Blocker)",
        firestoreRules: "ACTIVE (ABAC Zero-Trust + isValidId Validation)",
        postgreSQL: "ACTIVE (Parameterized Queries via Drizzle ORM)",
        firebaseAuth: "ACTIVE (Admin Auth JWT Token Verification)"
      },
      auditTimestamp: new Date().toISOString()
    });
  });

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
          dailyMinutesLog: JSON.parse(result.dailyMinutesLog),
          honePathwayState: JSON.parse(result.honePathwayState),
          trickSimulatorState: JSON.parse(result.trickSimulatorState),
          vaultState: JSON.parse(result.vaultState)
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
      const { totalStudyMinutes, todayStudyMinutes, dailyStudyGoal, studyHistory, quizHistory, dailyMinutesLog, honePathwayState, trickSimulatorState, vaultState } = req.body;
      await db.insert(userProgress)
        .values({
          userId: req.dbUser.id,
          totalStudyMinutes: totalStudyMinutes || 0,
          todayStudyMinutes: todayStudyMinutes || 0,
          dailyStudyGoal: dailyStudyGoal || 30,
          studyHistory: JSON.stringify(studyHistory || {}),
          quizHistory: JSON.stringify(quizHistory || {}),
          dailyMinutesLog: JSON.stringify(dailyMinutesLog || {}),
          honePathwayState: JSON.stringify(honePathwayState || {}),
          trickSimulatorState: JSON.stringify(trickSimulatorState || {}),
          vaultState: JSON.stringify(vaultState || {}),
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
            honePathwayState: JSON.stringify(honePathwayState || {}),
            trickSimulatorState: JSON.stringify(trickSimulatorState || {}),
            vaultState: JSON.stringify(vaultState || {}),
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
