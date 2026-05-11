"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, DollarSign, CheckCircle, Trash2 } from "lucide-react";
import { formatCurrency, formatPct } from "@/lib/utils";

interface Schedule {
  id: string;
  date: string;
  baselineRevenue: number | null;
  optimizedRevenue: number | null;
  efficiencyGain: number | null;
  missedRevenue: number | null;
  _count: { assignments: number };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/schedules");
    const data = await res.json();
    setSchedules(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Schedule History</h1>
        <p className="text-sm text-zinc-500 mt-1">{schedules.length} optimization run{schedules.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="font-medium mb-1">No schedules yet</h3>
          <p className="text-sm text-zinc-500">Run an optimization from the Dispatch Engine to create a schedule</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, i) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 flex items-center gap-6 hover:border-zinc-700 transition-colors"
            >
              {/* Date */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs text-amber-400/70 font-mono">
                    {new Date(schedule.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-amber-400 leading-none">
                    {new Date(schedule.date).getDate()}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Efficiency Gain</div>
                  <div className={`text-lg font-semibold ${(schedule.efficiencyGain ?? 0) > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                    {schedule.efficiencyGain != null ? formatPct(schedule.efficiencyGain) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Optimized Revenue</div>
                  <div className="text-lg font-semibold text-amber-400">
                    {schedule.optimizedRevenue != null ? formatCurrency(schedule.optimizedRevenue) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Revenue Uplift</div>
                  <div className="text-lg font-semibold">
                    {schedule.optimizedRevenue != null && schedule.baselineRevenue != null
                      ? formatCurrency(schedule.optimizedRevenue - schedule.baselineRevenue)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Jobs Assigned</div>
                  <div className="text-lg font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {schedule._count.assignments}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleDelete(schedule.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
