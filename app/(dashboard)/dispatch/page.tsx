"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Play,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency, formatPct, formatTime, priorityColor } from "@/lib/utils";
import type { OptimizationResult } from "@/lib/dispatch-engine";

interface DispatchResponse extends OptimizationResult {
  scheduleId: string;
}

export default function DispatchPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DispatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"optimized" | "baseline">("optimized");
  const [expandedTech, setExpandedTech] = useState<string | null>(null);
  const [techCount, setTechCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/technicians").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
    ]).then(([techs, jobs]) => {
      setTechCount(Array.isArray(techs) ? techs.length : 0);
      setJobCount(Array.isArray(jobs) ? jobs.filter((j: any) => j.status === "PENDING").length : 0);
    });
  }, []);

  async function runOptimization() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/dispatch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function resetAndRerun() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      await fetch("/api/dispatch/reset", { method: "POST" });
      const res = await fetch("/api/jobs").then((r) => r.json());
      const pending = Array.isArray(res) ? res.filter((j: any) => j.status === "PENDING").length : 0;
      setJobCount(pending);
      await runOptimization();
    } catch (e: any) {
      setError(e.message);
      setRunning(false);
    }
  }

  async function loadDemoData() {
    setRunning(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      const res = await fetch("/api/dispatch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      setTechCount(5);
      setJobCount(20);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const schedule = result ? (view === "optimized" ? result.optimized : result.baseline) : null;

  // Group assignments by technician
  const byTech = schedule
    ? schedule.assignments.reduce((acc: Record<string, typeof schedule.assignments>, a) => {
        if (!acc[a.technicianId]) acc[a.technicianId] = [];
        acc[a.technicianId].push(a);
        return acc;
      }, {})
    : {};

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Dispatch Engine
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Greedy optimization maximizing revenue per technician-hour
          </p>
        </div>
        <div className="flex items-center gap-3">
          {techCount === 0 && (
            <button
              onClick={loadDemoData}
              disabled={running}
              className="flex items-center gap-2 text-sm border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded-md transition-all disabled:opacity-50"
            >
              Load Demo Data
            </button>
          )}
          {result && (
          <button
            onClick={resetAndRerun}
            disabled={running}
            className="flex items-center gap-2 text-sm border border-border text-zinc-400 hover:text-white hover:border-zinc-600 px-4 py-2 rounded-md transition-all disabled:opacity-50"
          >
            Reset &amp; Re-run
          </button>
        )}
        <button
            onClick={runOptimization}
            disabled={running || techCount === 0}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-5 py-2 rounded-md transition-all hover:shadow-lg hover:shadow-amber-500/20"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Optimization
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${techCount > 0 ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className="text-zinc-400">
            {techCount} technician{techCount !== 1 ? "s" : ""} loaded
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${jobCount > 0 ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className="text-zinc-400">
            {jobCount} pending job{jobCount !== 1 ? "s" : ""}
          </span>
        </div>
        {techCount === 0 && (
          <div className="flex items-center gap-2 text-amber-400/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs">Add technicians and jobs to run optimization</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Efficiency Gain",
                  value: formatPct(result.summary.efficiencyGainPct),
                  icon: TrendingUp,
                  color: "emerald",
                  sub: "vs. unoptimized",
                },
                {
                  label: "Revenue Uplift",
                  value: formatCurrency(result.summary.revenueUplift),
                  icon: DollarSign,
                  color: "amber",
                  sub: "additional revenue",
                },
                {
                  label: "Jobs Assigned",
                  value: `${result.summary.assignedJobs} / ${result.summary.jobCount}`,
                  icon: Clock,
                  color: "blue",
                  sub: `${result.optimized.unassignedJobs.length} unschedulable`,
                },
                {
                  label: "Missed Revenue",
                  value: formatCurrency(result.summary.missedRevenue),
                  icon: AlertTriangle,
                  color: "red",
                  sub: "unassigned capacity",
                },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{kpi.label}</span>
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        kpi.color === "emerald" ? "bg-emerald-500/10 text-emerald-400"
                        : kpi.color === "amber" ? "bg-amber-500/10 text-amber-400"
                        : kpi.color === "blue" ? "bg-blue-500/10 text-blue-400"
                        : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <kpi.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-semibold tracking-tight ${
                      kpi.color === "emerald" ? "text-emerald-400"
                      : kpi.color === "amber" ? "text-amber-400"
                      : ""
                    }`}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{kpi.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Comparison toggle */}
            <div className="flex items-center gap-1 mb-4 bg-card border border-border rounded-lg p-1 w-fit">
              {(["optimized", "baseline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === v
                      ? "bg-amber-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {v === "optimized" ? "Optimized Schedule" : "Baseline Schedule"}
                </button>
              ))}
            </div>

            {/* Revenue comparison bar */}
            <div className="bg-card border border-border rounded-lg p-5 mb-4">
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-zinc-400">Revenue comparison</span>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-zinc-500">Baseline: {formatCurrency(result.summary.baselineRevenue)}</span>
                  <span className="text-amber-400">Optimized: {formatCurrency(result.summary.optimizedRevenue)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Baseline</span>
                    <span>{formatCurrency(result.summary.baselineRevenue)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-600 rounded-full"
                      style={{ width: `${(result.summary.baselineRevenue / result.summary.totalPossibleRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Optimized</span>
                    <span className="text-amber-400">{formatCurrency(result.summary.optimizedRevenue)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${(result.summary.optimizedRevenue / result.summary.totalPossibleRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Technician schedules */}
            <div className="space-y-3">
              {Object.entries(byTech).map(([techId, assignments]) => {
                const techRevenue = assignments.reduce((s, a) => s + a.revenue, 0);
                const techName = assignments[0]?.technicianName ?? techId;
                const isExpanded = expandedTech === techId;

                return (
                  <div
                    key={techId}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTech(isExpanded ? null : techId)}
                      className="w-full flex items-center gap-4 p-5 hover:bg-white/2 transition-colors"
                    >
                      <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-amber-400 flex-shrink-0">
                        {techName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{techName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {assignments.length} job{assignments.length !== 1 ? "s" : ""} assigned
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="text-sm font-semibold text-amber-400">{formatCurrency(techRevenue)}</div>
                        <div className="text-xs text-zinc-500">revenue</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border">
                            {assignments
                              .sort((a, b) => a.sequence - b.sequence)
                              .map((assignment, idx) => (
                                <div
                                  key={assignment.jobId}
                                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-white/2"
                                >
                                  <div className="text-xs font-mono text-zinc-600 w-4">{idx + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{assignment.jobTitle}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5">
                                      {formatTime(assignment.startTime)} → {formatTime(assignment.endTime)}
                                      {" · "}
                                      <span className="text-zinc-600">{assignment.travelMins}min drive</span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-emerald-400 flex-shrink-0">
                                    {formatCurrency(assignment.revenue)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-dashed border-border rounded-xl p-16 text-center"
        >
          <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-amber-500/60" />
          </div>
          <h3 className="text-lg font-medium mb-2">Ready to optimize</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
            {techCount === 0
              ? "Load demo data to see the engine in action, or add your technicians and jobs first."
              : `${techCount} technician${techCount !== 1 ? "s" : ""} and ${jobCount} job${jobCount !== 1 ? "s" : ""} loaded. Click Run Optimization to begin.`}
          </p>
          {techCount === 0 && (
            <button
              onClick={loadDemoData}
              className="flex items-center gap-2 mx-auto bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-md transition-all"
            >
              <Zap className="w-4 h-4" />
              Load Demo Data + Optimize
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
