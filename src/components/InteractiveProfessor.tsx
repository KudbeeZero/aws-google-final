import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { getChatHistoryFromCloud, saveChatHistoryToCloud } from "../lib/db-client.js";
import { 
  Bot, 
  Send, 
  Trash2, 
  Key, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Flame,
  HelpCircle,
  GraduationCap,
  Copy,
  Download,
  Check
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  // Parsed checkpoint data
  hasQuiz?: boolean;
  quizOptions?: { key: string; text: string }[];
  quizAnswer?: string;
  userSelectedAnswer?: string;
  quizCorrect?: boolean;
}

interface InteractiveProfessorProps {
  user?: any;
  onAddMinutes?: (mins: number) => void;
  aiModelMode?: "fast" | "expert";
}

const SYSTEM_INSTRUCTION = `You are 'Professor Cloud'—an elite AWS Solutions Architect and an encouraging, interactive Socratic mentor.

Socratic Pedagogy Rules:
1. Deep Socratic Architectural Analysis: Always dive deep into architectural trade-offs, security, cost optimization, and performance instead of giving generic surface-level responses. Ask probing Socratic questions that force the student to justify their architectural choices.
2. Relatable Context: Begin technical explanations with clear, relatable real-world analogies (e.g., comparing Security Groups to instance-level hotel room security guards, and NACLs to subnet-level border checkpoint gates).
3. Distractor Alert: Explicitly call out typical keyword pitfalls, vocabulary traps, or misleading options common to the AWS Certified Cloud Practitioner (CLF-C02) exam paper.
4. Active Checkpoints: Always end your response with a brief, high-yield multiple-choice concept check or scenario riddle to verify user retention.

Active Checkpoint Formatting Rules (MANDATORY):
- Provide exactly 4 options labeled A), B), C), and D). Place each option on a new line.
- Always include the correct answer code in your output inside the exact bracket format at the very bottom of your message: [Answer: X] (where X is A, B, C, or D), so that our system can parse it and render interactive click-buttons for the user. Example: [Answer: C].
- Example multiple choice format:
  A) Option A description
  B) Option B description
  C) Option C description
  D) Option D description
  
  [Answer: C]`;

const INITIAL_WELCOME: ChatMessage = {
  id: "welcome-msg",
  role: "model",
  text: "Hello, Practitioner! I am **Professor Cloud**, your Socratic mentor. Let's conquer the AWS CLF-C02 certification together! I'll explain complex cloud concepts using simple real-world analogies, warn you about sneaky exam distractors, and give you active checkpoints along the way.\n\nWhat AWS topic are we tackling today? Select a quick-study topic below or type your own question!",
  timestamp: new Date().toISOString()
};

export const InteractiveProfessor: React.FC<InteractiveProfessorProps> = ({ user, onAddMinutes, aiModelMode = "expert" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isKeySetupOpen, setIsKeySetupOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Retrieve stored API key or env key
  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem("aws_professor_api_key");
    if (saved) return saved;
    // Fallback to Vite public env variable
    const metaEnv = (import.meta as any).env;
    return (metaEnv?.VITE_GEMINI_API_KEY as string) || "";
  });

  // Load chat history from Postgres or localStorage
  useEffect(() => {
    if (user) {
      getChatHistoryFromCloud().then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([INITIAL_WELCOME]);
        }
      }).catch((e) => {
        console.error("Failed to load chat history from Postgres:", e);
        setMessages([INITIAL_WELCOME]);
      });
    } else {
      const savedChat = localStorage.getItem("aws_professor_chat_history_v1");
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (e) {
          setMessages([INITIAL_WELCOME]);
        }
      }
    }
  }, [user]);

  // Save chat history to Postgres or localStorage
  const saveHistory = async (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    if (user) {
      await saveChatHistoryToCloud(newMessages);
    } else {
      localStorage.setItem("aws_professor_chat_history_v1", JSON.stringify(newMessages));
    }
  };

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Helper to parse Professor messages for concept check quizzes
  const parseProfessorMessage = (text: string) => {
    // Extract [Answer: X]
    const answerMatch = text.match(/\[Answer:\s*([A-D])\]/i);
    const answer = answerMatch ? answerMatch[1].toUpperCase() : undefined;

    // Clean the text by removing the [Answer: X] block
    let cleanedText = text.replace(/\[Answer:\s*([A-D])\]/gi, "").trim();

    // Parse options starting with A), B), C), D) or A., B., C., D.
    const lines = cleanedText.split("\n");
    const options: { key: string; text: string }[] = [];
    
    lines.forEach(line => {
      const match = line.match(/^\s*(?:-\s*)?([A-D])\s*[\s\-\).:\]]+(.+)$/i);
      if (match) {
        options.push({
          key: match[1].toUpperCase(),
          text: match[2].trim()
        });
      }
    });

    return {
      cleanedText,
      answer,
      options
    };
  };

  // Handle setting API key manually
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem("aws_professor_api_key", cleanKey);
      setApiKey(cleanKey);
      setIsKeySetupOpen(false);
      setApiError(null);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("aws_professor_api_key");
    setApiKey("");
    setApiKeyInput("");
    setIsKeySetupOpen(true);
  };

  const handleResetChat = () => {
    if (window.confirm("Are you sure you want to reset your conversation history with Professor Cloud?")) {
      saveHistory([INITIAL_WELCOME]);
      setApiError(null);
    }
  };

  const handleExportChat = () => {
    const textToSave = messages.map(m => `[${m.role.toUpperCase()}]\n${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([textToSave], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `professor-cloud-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send message to Gemini
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (!apiKey) {
      setIsKeySetupOpen(true);
      return;
    }

    setApiError(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMessage];
    saveHistory(updatedHistory);
    setInputText("");
    setIsLoading(true);

    // Credit user with +2 minutes of study time on send
    if (onAddMinutes) {
      onAddMinutes(2);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build stateless history structure matching the SDK Content type
      const contents = updatedHistory.map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.text }]
      }));

      // Call Gemini model
      const response = await ai.models.generateContent({
        model: aiModelMode === "fast" ? "gemini-2.5-flash" : "gemini-1.5-pro",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "Professor Cloud is reflecting on that...";
      const parsed = parseProfessorMessage(responseText);

      const professorMessage: ChatMessage = {
        id: `professor-${Date.now()}`,
        role: "model",
        text: parsed.cleanedText,
        timestamp: new Date().toISOString(),
        hasQuiz: parsed.options.length > 0 && !!parsed.answer,
        quizOptions: parsed.options,
        quizAnswer: parsed.answer,
      };

      saveHistory([...updatedHistory, professorMessage]);
    } catch (err: any) {
      console.error("Gemini API error:", err);
      setApiError(err.message || "Failed to communicate with Gemini API. Please check your network or key.");
      // Remove last user message so they can retry
      saveHistory(messages);
    } finally {
      setIsLoading(false);
    }
  };

  // Preset prompts
  const triggerPreset = (topic: string) => {
    let promptText = "";
    if (topic === "security") {
      promptText = "Professor, can you explain the differences between Security Groups and Network Access Control Lists (NACLs) using a clear Socratic analogy, and give me a practice concept check?";
    } else if (topic === "responsibility") {
      promptText = "Professor, can you break down the AWS Shared Responsibility Model (what AWS is responsible for vs. what the customer is responsible for) with a simple analogy and a practice question?";
    } else if (topic === "support") {
      promptText = "Professor, can you explain the differences between Basic, Developer, Business, and Enterprise Support tiers in AWS with a real-world comparison and a concept check question?";
    }
    handleSendMessage(promptText);
  };

  // Handle quiz option selection
  const handleSelectQuizOption = (messageId: string, optionKey: string) => {
    const updated = messages.map(msg => {
      if (msg.id === messageId && msg.quizAnswer) {
        const isCorrect = optionKey.toUpperCase() === msg.quizAnswer.toUpperCase();
        
        // If correct, award +2 study minutes!
        if (isCorrect && !msg.userSelectedAnswer && onAddMinutes) {
          onAddMinutes(2);
        }

        return {
          ...msg,
          userSelectedAnswer: optionKey,
          quizCorrect: isCorrect
        };
      }
      return msg;
    });
    saveHistory(updated);
  };

  return (
    <div className="flex flex-col h-[650px] bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-amber-500 to-[#FF9900] p-1.5 rounded-sm shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">
                Professor Cloud
              </h3>
              <span className="text-[9px] bg-amber-500/10 text-[#FF9900] font-bold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-mono">
                Socratic AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              AWS Solutions Architect & Pedagogue
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2">
          {apiKey ? (
            <>
              <button
                onClick={handleExportChat}
                className="text-slate-400 hover:text-[#FF9900] text-[10px] font-bold font-mono transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Export Chat History"
              >
                <Download className="w-3 h-3" />
                Save Notes
              </button>
              <button
                onClick={handleClearApiKey}
                className="text-slate-400 hover:text-rose-400 text-[10px] font-bold font-mono transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Change Gemini API Key"
              >
                <Key className="w-3 h-3" />
                Reset Key
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsKeySetupOpen(true)}
              className="text-amber-500 hover:text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer"
            >
              <Key className="w-3 h-3 animate-pulse" />
              Setup API Key
            </button>
          )}

          <button
            onClick={handleResetChat}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CONDITIONAL KEY SETUP DRAWER / MODAL PANEL */}
      {(!apiKey || isKeySetupOpen) ? (
        <div className="flex-1 bg-slate-900 text-slate-100 p-6 flex flex-col justify-center items-center space-y-6 text-center animate-fade-in relative z-10">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-full text-[#FF9900] animate-bounce">
            <Key className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Socratic Professor Setup
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Professor Cloud uses the client-side Google Gemini SDK to drive custom Socratic reasoning. To start, enter your Gemini API Key below.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-left space-y-1.5 mt-2">
              <span className="text-[9px] uppercase font-bold text-amber-500 font-mono tracking-widest block flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                Security Note
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Your key is strictly stored in your local browser sandbox (<code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[9px]">localStorage</code>) and sent directly to Google APIs. It is never transmitted to secondary servers.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApiKey} className="w-full max-w-sm space-y-3">
            <div className="space-y-1">
              <input
                type="password"
                required
                placeholder="Pasted AI Studio API Key (AIzaSy...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs rounded text-white focus:outline-none focus:border-[#FF9900]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-[#FF9900] text-slate-950 text-xs font-black uppercase tracking-wider rounded transition-all hover:opacity-90 cursor-pointer"
              >
                Connect Professor
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setIsKeySetupOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <p className="text-[10px] text-slate-500">
            Need a key? Grab a free or tier-based key inside the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#FF9900] hover:underline">Google AI Studio Console</a>.
          </p>
        </div>
      ) : (
        <>
          {/* CHAT BUBBLE CONSOLE VIEW */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            
            {/* Session Status Banner */}
            <div className={`p-2.5 rounded-sm border text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              user 
                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800' 
                : 'bg-amber-500/5 border-amber-500/10 text-amber-800'
            }`}>
              <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-widest shrink-0">
                <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {user ? "Cloud Sync Secured" : "Guest Sandbox active"}
              </div>
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] leading-tight">
                {user 
                  ? "Your conversational history with Professor Cloud is fully preserved in Cloud Run storage." 
                  : "Conversations are kept in local storage. Connect a Google Account on the dashboard to save sessions permanently."
                }
              </span>
            </div>
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar Icons */}
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                    msg.role === "user" 
                      ? "bg-slate-900 border-slate-800 text-white" 
                      : "bg-[#FF9900]/10 border-[#FF9900]/20 text-[#FF9900]"
                  }`}>
                    {msg.role === "user" ? (
                      <span className="text-[10px] font-black font-mono">ME</span>
                    ) : (
                      <Bot className="w-4 h-4 text-[#FF9900]" />
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-3 relative group">
                    <div className={`p-3.5 rounded-sm shadow-sm border text-xs leading-relaxed overflow-hidden ${
                      msg.role === "user"
                        ? "bg-slate-900 border-slate-800 text-white rounded-tr-none"
                        : "bg-white border-slate-200 text-slate-800 rounded-tl-none prose prose-sm prose-slate max-w-none"
                    }`}>
                      {msg.role === "user" ? (
                        <span className="whitespace-pre-wrap">{msg.text}</span>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>

                    {/* Copy Button for Model responses */}
                    {msg.role === "model" && (
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-slate-500 hover:text-[#FF9900] p-1.5 rounded-sm shadow-sm cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* INTERACTIVE QUIZ CARD (Parsed checkpoint) */}
                    {msg.role === "model" && msg.hasQuiz && msg.quizOptions && msg.quizOptions.length > 0 && (
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-md space-y-3 max-w-full">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#FF9900] tracking-widest uppercase font-mono">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 animate-pulse" />
                          Professor Checkpoint Quiz
                        </div>
                        
                        <p className="text-[11px] text-slate-300 font-medium">
                          Select the correct answer below to verify your retention and score <span className="text-emerald-400 font-extrabold">+2 mins study goal credit</span>:
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {msg.quizOptions.map((opt) => {
                            const isSelected = msg.userSelectedAnswer === opt.key;
                            const isAnswerCorrect = opt.key === msg.quizAnswer;
                            const showResult = !!msg.userSelectedAnswer;

                            let buttonStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white";
                            if (showResult) {
                              if (isAnswerCorrect) {
                                buttonStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-300";
                              } else if (isSelected) {
                                buttonStyle = "bg-rose-950/80 border-rose-500 text-rose-300";
                              } else {
                                buttonStyle = "bg-slate-950/50 border-slate-900 text-slate-600 opacity-50";
                              }
                            }

                            return (
                              <button
                                key={opt.key}
                                disabled={showResult}
                                onClick={() => handleSelectQuizOption(msg.id, opt.key)}
                                className={`w-full text-left p-2.5 rounded-sm border text-xs font-bold transition-all flex items-start gap-2.5 ${buttonStyle} ${!showResult && "cursor-pointer hover:translate-x-1"}`}
                              >
                                <span className={`w-5 h-5 rounded-sm text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                                  showResult && isAnswerCorrect 
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                                    : showResult && isSelected 
                                    ? "bg-rose-500/20 border-rose-500 text-rose-400" 
                                    : "bg-slate-800 border-slate-700 text-slate-400"
                                }`}>
                                  {opt.key}
                                </span>
                                <span className="leading-tight pt-0.5">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quiz result messages */}
                        {msg.userSelectedAnswer && (
                          <div className={`p-3 rounded-sm text-[11px] flex items-start gap-2 animate-fade-in ${
                            msg.quizCorrect 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}>
                            {msg.quizCorrect ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-extrabold text-[12px]">Outstanding! Correct Answer.</p>
                                  <p className="mt-0.5 text-emerald-500/90 leading-relaxed">
                                    You've identified the key exam concept successfully! Socratic active recall works. Your daily tracker has been awarded **+2 minutes** of study progress!
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-extrabold text-[12px]">Not quite correct, Practitioner.</p>
                                  <p className="mt-0.5 text-rose-400/90 leading-relaxed">
                                    Watch out for exam distractors! The correct answer was indeed <span className="font-black bg-rose-500/20 px-1 py-0.5 rounded">{msg.quizAnswer}</span>. Read the professor's breakdown above to review the analogies.
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-[#FF9900]/10 border border-[#FF9900]/20 text-[#FF9900] shrink-0">
                    <Bot className="w-4 h-4 text-[#FF9900] animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-200 text-slate-500 p-3.5 rounded-sm text-xs rounded-tl-none flex items-center gap-2 shadow-sm">
                    <span className="font-bold text-slate-700">Professor Cloud is typing</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#FF9900] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-sm text-xs space-y-2 max-w-xl mx-auto flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black uppercase tracking-wider text-rose-900 leading-none mb-1">
                    API Execution Interrupted
                  </h4>
                  <p className="leading-relaxed font-semibold text-rose-700">{apiError}</p>
                  <p className="mt-2 text-[11px] text-slate-500 leading-normal">
                    Tip: Verify your key is active and supports standard Gemini 1.5 Pro queries. Click the "Reset Key" button in the upper right header to change it.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM PRESET FILTERS AND INPUT BOX */}
          <div className="bg-white border-t border-slate-200 p-4 space-y-3.5">
            
            {/* Quick Presets Pills */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF9900]" />
                Select Quick Socratic Topic
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => triggerPreset("security")}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  🛡️ Security Groups vs. NACLs
                </button>
                <button
                  onClick={() => triggerPreset("responsibility")}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  ⚖️ Shared Responsibility Model
                </button>
                <button
                  onClick={() => triggerPreset("support")}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  💰 AWS Support Tiers Decoded
                </button>
              </div>
            </div>

            {/* Input Submission Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input
                id="professor-chat-input"
                type="text"
                disabled={isLoading}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Professor Cloud anything about AWS cloud concepts..."
                className="flex-1 px-3 py-2 border border-slate-200 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900] bg-slate-50 hover:bg-slate-100/50 focus:bg-white transition-colors text-slate-800 disabled:opacity-60 font-semibold"
              />
              <button
                type="submit"
                id="professor-chat-submit-btn"
                disabled={!inputText.trim() || isLoading}
                className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-sm shrink-0 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              >
                Send
                <Send className="w-3 h-3 text-amber-500" />
              </button>
            </form>

            {/* Micro attribution footer */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold font-mono">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#FF9900]" />
                Interactive responses add +2m study time
              </span>
              <span>Model: {aiModelMode === "fast" ? "gemini-2.5-flash" : "gemini-1.5-pro"}</span>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
