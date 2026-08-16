import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  TrendingUp, Cpu, Zap, Activity, AlertTriangle, Play, RefreshCw, 
  Terminal, ShieldCheck, Gauge, Layers, Info, CheckCircle2, ChevronRight
} from "lucide-react";

interface AgentMetrics {
  agentId: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  avgLatencyMs: number;
  inputTokens: number;
  outputTokens: number;
  tasksCompleted: number;
  tasksFailed: number;
}

const INITIAL_METRICS: AgentMetrics[] = [
  {
    agentId: "ag-1",
    name: "Archie",
    role: "Solutions Architect",
    emoji: "🏗️",
    color: "#3B82F6", // Blue
    avgLatencyMs: 1240,
    inputTokens: 48500,
    outputTokens: 75200,
    tasksCompleted: 94,
    tasksFailed: 2
  },
  {
    agentId: "ag-2",
    name: "Guardian",
    role: "SecOps compliance",
    emoji: "🛡️",
    color: "#10B981", // Emerald
    avgLatencyMs: 1850,
    inputTokens: 62000,
    outputTokens: 38000,
    tasksCompleted: 88,
    tasksFailed: 4
  },
  {
    agentId: "ag-3",
    name: "PennyWise",
    role: "FinOps Cost Optimizer",
    emoji: "💰",
    color: "#F59E0B", // Amber
    avgLatencyMs: 980,
    inputTokens: 31000,
    outputTokens: 42000,
    tasksCompleted: 104,
    tasksFailed: 1
  },
  {
    agentId: "ag-4",
    name: "TrapMaster",
    role: "Exam Distractor Trap",
    emoji: "⚡",
    color: "#8B5CF6", // Purple
    avgLatencyMs: 2450,
    inputTokens: 89000,
    outputTokens: 112000,
    tasksCompleted: 76,
    tasksFailed: 8
  },
  {
    agentId: "ag-5",
    name: "Alex",
    role: "Socratic Mentor Partner",
    emoji: "🤝",
    color: "#06B6D4", // Cyan
    avgLatencyMs: 1420,
    inputTokens: 54000,
    outputTokens: 81000,
    tasksCompleted: 112,
    tasksFailed: 3
  }
];

export const AgentAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentMetrics[]>(() => {
    const saved = localStorage.getItem("aws_agent_analytics_metrics");
    return saved ? JSON.parse(saved) : INITIAL_METRICS;
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("exam-prep");
  const [activeChartTab, setActiveChartTab] = useState<"latency" | "tokens" | "success">("latency");

  // Save metrics when updated
  useEffect(() => {
    localStorage.setItem("aws_agent_analytics_metrics", JSON.stringify(metrics));
  }, [metrics]);

  // Aggregate Swarm Stats
  const swarmStats = useMemo(() => {
    let totalTokens = 0;
    let totalInput = 0;
    let totalOutput = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalLatency = 0;

    metrics.forEach(m => {
      totalInput += m.inputTokens;
      totalOutput += m.outputTokens;
      totalTokens += (m.inputTokens + m.outputTokens);
      totalCompleted += m.tasksCompleted;
      totalFailed += m.tasksFailed;
      totalLatency += m.avgLatencyMs;
    });

    const avgLatency = Math.round(totalLatency / metrics.length);
    const successRate = totalCompleted + totalFailed > 0 
      ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100) 
      : 100;

    // Find bottleneck metrics
    // Slowest Agent
    const slowest = [...metrics].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0];
    // Highest Token Consumer
    const highestTokens = [...metrics].sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens))[0];
    // Agent with lowest success rate
    const lowestSuccessAgent = [...metrics].sort((a, b) => {
      const rateA = a.tasksCompleted / (a.tasksCompleted + a.tasksFailed || 1);
      const rateB = b.tasksCompleted / (b.tasksCompleted + b.tasksFailed || 1);
      return rateA - rateB;
    })[0];

    return {
      totalTokens,
      totalInput,
      totalOutput,
      totalCompleted,
      totalFailed,
      avgLatency,
      successRate,
      slowest,
      highestTokens,
      lowestSuccessAgent
    };
  }, [metrics]);

  const handleResetMetrics = () => {
    if (confirm("Are you sure you want to restore the default agent telemetry datasets?")) {
      setMetrics(INITIAL_METRICS);
      setSimulationLogs(["🔄 Telemetry datasets restored to production baselines."]);
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationLogs([]);

    const scenarios: Record<string, { name: string; logs: string[]; metricMultiplier: Record<string, { latency: number; tokens: number; failRate: number }> }> = {
      "exam-prep": {
        name: "Massive Exam Drill Simulation (High Volume)",
        logs: [
          "🎬 [START] Dispatching scenario: AWS Certification Exam Drills Simulation...",
          "🤝 [ALEX] Generating 45 personalized AWS Socratic exam prompts...",
          "⚡ [TRAPMASTER] Formulating complex distractor alternatives & edge traps (Token spike expected)...",
          "🏗️ [ARCHIE] Validating topology correctness against latest AWS Well-Architected updates...",
          "💰 [PENNYWISE] Calculating cost-efficiency scenarios for Auto-Scaling lifecycle options...",
          "🛡️ [GUARDIAN] Reviewing security IAM federation variables across mock questions...",
          "📈 [SUCCESS] Simulation complete! 12,400 new tokens processed. Telemetry updated."
        ],
        metricMultiplier: {
          "ag-4": { latency: 2800, tokens: 25000, failRate: 3 }, // TrapMaster heavy
          "ag-5": { latency: 1550, tokens: 18000, failRate: 1 }, // Alex high volume
          "ag-1": { latency: 1300, tokens: 8000, failRate: 0 },
          "ag-2": { latency: 1900, tokens: 5000, failRate: 1 },
          "ag-3": { latency: 1000, tokens: 4000, failRate: 0 }
        }
      },
      "security-audit": {
        name: "Corporate Security Compliance Verification Audit",
        logs: [
          "🎬 [START] Dispatching scenario: Multi-Account SecOps Regulatory Compliance Audit...",
          "🛡️ [GUARDIAN] Initiating deep IAM Policy evaluations for 150 target CloudRun endpoints...",
          "🏗️ [ARCHIE] Diagramming and auditing cross-AZ failover configurations & KMS Key parameters...",
          "💰 [PENNYWISE] Running billing reviews to identify orphaned EBS volumes & non-encrypted cost overheads...",
          "🤝 [ALEX] Formatting executive compliance study summaries for candidate dashboard...",
          "⚡ [TRAPMASTER] Simulating adversarial penetration vectors and common AWS security slipups...",
          "🛡️ [GUARDIAN] Blocked 3 unsecured S3 bucket configurations! Full telemetry synced."
        ],
        metricMultiplier: {
          "ag-2": { latency: 2400, tokens: 35000, failRate: 0 }, // Guardian heavy
          "ag-1": { latency: 1400, tokens: 12000, failRate: 1 },
          "ag-3": { latency: 1100, tokens: 9000, failRate: 0 },
          "ag-4": { latency: 1800, tokens: 8000, failRate: 2 },
          "ag-5": { latency: 1350, tokens: 6000, failRate: 0 }
        }
      },
      "finops-optimize": {
        name: "Cloud Waste Reduction & Savings Plan Advisory",
        logs: [
          "🎬 [START] Dispatching scenario: Automated AWS FinOps Wasteland Cleanup Optimization...",
          "💰 [PENNYWISE] Syncing detailed Billing CSV files with CloudTrail logs for real-time idle compute scan...",
          "🏗️ [ARCHIE] Restructuring oversized EC2 instance sizes into modern serverless AWS Fargate designs...",
          "🛡️ [GUARDIAN] Assuring that cost-saving horizontal scaling doesn't compromise secure private network borders...",
          "🤝 [ALEX] Delivering simplified cost explanation metrics to the AWS candidate roster...",
          "⚡ [TRAPMASTER] Analyzing typical cost pitfalls in AWS certification exams regarding S3 Intelligent-Tiering...",
          "💰 [PENNYWISE] Identified $4,200 yearly savings! Swarm dispatch completes."
        ],
        metricMultiplier: {
          "ag-3": { latency: 1600, tokens: 28000, failRate: 0 }, // PennyWise heavy
          "ag-1": { latency: 1350, tokens: 15000, failRate: 1 },
          "ag-2": { latency: 1750, tokens: 8000, failRate: 0 },
          "ag-4": { latency: 2100, tokens: 7000, failRate: 1 },
          "ag-5": { latency: 1200, tokens: 5000, failRate: 0 }
        }
      }
    };

    const scenarioData = scenarios[selectedScenario];
    let logIndex = 0;

    const interval = setInterval(() => {
      if (logIndex < scenarioData.logs.length) {
        setSimulationLogs(prev => [...prev, scenarioData.logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        
        // Dynamically update the metrics!
        setMetrics(prevMetrics => {
          return prevMetrics.map(m => {
            const multiplier = scenarioData.metricMultiplier[m.agentId];
            if (multiplier) {
              const inputAdd = Math.round(multiplier.tokens * 0.45);
              const outputAdd = Math.round(multiplier.tokens * 0.55);
              
              // Latency is a rolling average
              const newLatency = Math.round((m.avgLatencyMs * 0.7) + (multiplier.latency * 0.3));
              const newCompleted = m.tasksCompleted + (multiplier.failRate > 0 ? Math.round(15 - multiplier.failRate) : 15);
              const newFailed = m.tasksFailed + multiplier.failRate;

              return {
                ...m,
                inputTokens: m.inputTokens + inputAdd,
                outputTokens: m.outputTokens + outputAdd,
                avgLatencyMs: newLatency,
                tasksCompleted: newCompleted,
                tasksFailed: newFailed
              };
            }
            return m;
          });
        });

        setIsSimulating(false);
      }
    }, 400);
  };

  // Prepare chart datasets
  const chartData = useMemo(() => {
    return metrics.map(m => ({
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      "Avg Latency (ms)": m.avgLatencyMs,
      "Input Tokens": m.inputTokens,
      "Output Tokens": m.outputTokens,
      "Total Tokens": m.inputTokens + m.outputTokens,
      "Completed Tasks": m.tasksCompleted,
      "Failed Tasks": m.tasksFailed,
      "Success Rate (%)": Math.round((m.tasksCompleted / (m.tasksCompleted + m.tasksFailed || 1)) * 100)
    }));
  }, [metrics]);

  // Bottleneck recommendation logic
  const bottleneckRecommendation = useMemo(() => {
    const slowestAgent = swarmStats.slowest;
    const highestTokensAgent = swarmStats.highestTokens;

    if (slowestAgent.avgLatencyMs > 2000) {
      return {
        severity: "high" as const,
        title: `CRITICAL BOTTLENECK: Slow API Response from ${slowestAgent.emoji} ${slowestAgent.name}`,
        desc: `Average response latency is at ${slowestAgent.avgLatencyMs}ms. This is primarily caused by deep multi-agent prompt construction and adversarial testing configurations.`,
        recommendation: "Activate 'Fast Model Mode' or integrate server-side semantic routing to cache typical response configurations, cutting latency by up to 60%."
      };
    } else if (highestTokensAgent.inputTokens + highestTokensAgent.outputTokens > 150000) {
      return {
        severity: "medium" as const,
        title: `BUDGET OVERHEAD: Excessive Token Load on ${highestTokensAgent.emoji} ${highestTokensAgent.name}`,
        desc: `${highestTokensAgent.name} has consumed over ${highestTokensAgent.inputTokens + highestTokensAgent.outputTokens} tokens. High input context overhead can escalate API billing patterns.`,
        recommendation: "Introduce context distillation filters to compress standard study sheets and cache previous vector embeddings inside Cloud SQL database configurations."
      };
    } else {
      return {
        severity: "low" as const,
        title: "All Swarm Operations Performing Within Acceptable SLA",
        desc: "All five domain-expert agents are responding efficiently with active latency constraints well below standard thresholds and healthy balanced loads.",
        recommendation: "Maintain the current configuration. The system is operating symmetrically without critical architectural path bottlenecks."
      };
    }
  }, [swarmStats]);

  return (
    <div className="space-y-6 animate-fade-in" id="agent-swarm-analytics">
      {/* Premium Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-sm p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 font-mono text-[9px] font-black px-2 py-0.5 rounded-xs uppercase tracking-widest border border-blue-500/30 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-400" />
                Live Swarm Metrics
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Model: Gemini 2.5 Flash Telemetry
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Cpu className="w-5.5 h-5.5 text-blue-400" />
              Agent Telemetry & Swarm Performance Analytics
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed font-medium">
              Real-time monitoring console for the specialized AWS Domain Expert Swarm. Analyze API response latencies, track context tokens consumed, and review task accuracy rates to diagnose micro-service bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetMetrics}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xs text-xs font-bold flex items-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer"
              title="Reset metrics to initial system baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Datasets
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Scorecards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Total Tokens Consumed</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-mono">
              {swarmStats.totalTokens.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">tokens</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="text-blue-400 font-bold">{Math.round(swarmStats.totalInput / 1000)}k</span> input / <span className="text-purple-400 font-bold">{Math.round(swarmStats.totalOutput / 1000)}k</span> output
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Avg Swarm Latency</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-mono">
              {swarmStats.avgLatency}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ms</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            Target SLA standard limit: <span className="text-[#FF9900] font-bold font-mono">2500ms</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Success Rate SLA</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black font-mono ${swarmStats.successRate > 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {swarmStats.successRate}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">accuracy</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {swarmStats.totalCompleted} completed / {swarmStats.totalFailed} failed
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Active Swarm Agents</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#FF9900] font-mono">
              {metrics.length}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">online nodes</span>
          </div>
          <div className="text-[10px] text-slate-400 leading-none truncate">
            Primary block: <strong className="text-purple-400 font-bold">{swarmStats.slowest.name}</strong> ({swarmStats.slowest.avgLatencyMs}ms)
          </div>
        </div>
      </div>

      {/* Main Diagnostic & Scenario Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scenario Dispatch & Simulation Terminal */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Gauge className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Simulated Traffic Dispatch</h3>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Choose an operational workload scenario to simulate mock customer query spikes and stress-test the swarm's resource allocation:
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider block">
                Select Study Workload Scenario
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setSelectedScenario("exam-prep")}
                  disabled={isSimulating}
                  className={`p-3 border text-left rounded-sm text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                    selectedScenario === "exam-prep"
                      ? "bg-slate-850 border-purple-500 text-purple-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-base mt-0.5">🎓</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block text-slate-200">Exam Preparation Drills</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Spikes TrapMaster & Socratic tutor queries</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedScenario("security-audit")}
                  disabled={isSimulating}
                  className={`p-3 border text-left rounded-sm text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                    selectedScenario === "security-audit"
                      ? "bg-slate-850 border-emerald-500 text-emerald-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-base mt-0.5">🛡️</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block text-slate-200">Regulatory Security Auditing</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Triggers intensive SecOps Guardian policies</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedScenario("finops-optimize")}
                  disabled={isSimulating}
                  className={`p-3 border text-left rounded-sm text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                    selectedScenario === "finops-optimize"
                      ? "bg-slate-850 border-amber-500 text-amber-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-base mt-0.5">💰</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block text-slate-200">Billing Waste Cleanups</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Fires complex financial optimization metrics</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.97]"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Simulating Telemetry Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  Dispatch Swarm Load Scenario
                </>
              )}
            </button>
          </div>

          {/* Real-time terminal log console */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm font-mono text-[10px] text-indigo-400 space-y-2 shadow-inner h-52 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 uppercase tracking-widest font-black border-b border-slate-900 pb-1.5 shrink-0">
              <span className="flex items-center gap-1.5 text-[9px]">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                Live Swarm Traffic Logs
              </span>
              <span className="animate-pulse flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                Listening
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 my-1.5 pr-1">
              {simulationLogs.length > 0 ? (
                simulationLogs.map((log, i) => (
                  <div key={i} className="animate-fade-in text-[11px] leading-relaxed">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-[11px] py-8 text-center">
                  Swarm terminal idle. Dispatch a load scenario above to view transaction logs in real-time.
                </div>
              )}
            </div>
            
            <div className="text-[9px] text-slate-500 shrink-0 font-sans font-medium">
              SLA Standard Port: 3000 | Context: REST
            </div>
          </div>
        </div>

        {/* Charts and Data Pane */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Chart Selection and Container Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Swarm Performance Visualizations
                </h3>
                <p className="text-[10px] text-slate-500">Telemetry updated dynamically upon scenario dispatch.</p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex bg-slate-950/80 p-0.5 rounded border border-slate-850 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setActiveChartTab("latency")}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    activeChartTab === "latency"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Latency SLA
                </button>
                <button
                  onClick={() => setActiveChartTab("tokens")}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    activeChartTab === "tokens"
                      ? "bg-purple-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Token Loads
                </button>
                <button
                  onClick={() => setActiveChartTab("success")}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    activeChartTab === "success"
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Completion Accuracy
                </button>
              </div>
            </div>

            {/* Render Selected Chart */}
            <div className="h-64 sm:h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === "latency" ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#64748B', fontStyle: 'normal' } }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: 4, color: '#F1F5F9' }}
                      labelStyle={{ fontWeight: 'bold', color: '#FF9900' }}
                    />
                    <Bar dataKey="Avg Latency (ms)" fill="#3B82F6" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : activeChartTab === "tokens" ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: 4, color: '#F1F5F9' }}
                      labelStyle={{ fontWeight: 'bold', color: '#FF9900' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="Input Tokens" stackId="a" fill="#C084FC" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Output Tokens" stackId="a" fill="#818CF8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[70, 100]} label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft', offset: 0 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: 4, color: '#F1F5F9' }}
                      labelStyle={{ fontWeight: 'bold', color: '#FF9900' }}
                    />
                    <Line type="monotone" dataKey="Success Rate (%)" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: '#0F172A' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Socratic Bottleneck Recommender Advisory Card */}
          <div className={`p-5 rounded-sm border shadow-sm ${
            bottleneckRecommendation.severity === "high"
              ? "bg-rose-950/20 border-rose-800 text-rose-200"
              : bottleneckRecommendation.severity === "medium"
              ? "bg-amber-950/20 border-amber-800 text-amber-200"
              : "bg-emerald-950/20 border-emerald-800 text-emerald-200"
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-black/25 shrink-0 mt-0.5">
                <AlertTriangle className={`w-4 h-4 ${
                  bottleneckRecommendation.severity === "high"
                    ? "text-rose-500"
                    : bottleneckRecommendation.severity === "medium"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-xs uppercase tracking-tight">
                  {bottleneckRecommendation.title}
                </h4>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {bottleneckRecommendation.desc}
                </p>
                <div className="pt-2 border-t border-white/5 text-[11px] flex items-start gap-1">
                  <span className="font-bold shrink-0 text-[#FF9900]">Advisory Suggestion:</span>
                  <span className="italic">{bottleneckRecommendation.recommendation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Symmetrical Bottleneck Metrics Matrix Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 space-y-3 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono block">Agent Bottleneck Matrix</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs text-slate-300">
              {metrics.map(m => {
                const totalTokens = m.inputTokens + m.outputTokens;
                const successRatio = m.tasksCompleted / (m.tasksCompleted + m.tasksFailed || 1);
                const successRate = Math.round(successRatio * 100);

                return (
                  <div key={m.agentId} className="bg-slate-950/55 border border-slate-850 p-2.5 rounded flex flex-col justify-between space-y-1.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold truncate text-white">{m.emoji} {m.name}</span>
                      <span className="text-[9px] font-mono text-slate-500">v1.2</span>
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Latency:</span>
                        <span className="font-mono font-bold text-blue-400">{m.avgLatencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tokens:</span>
                        <span className="font-mono font-bold text-purple-400">{Math.round(totalTokens / 1000)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">SLA:</span>
                        <span className={`font-mono font-bold ${successRate > 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{successRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
