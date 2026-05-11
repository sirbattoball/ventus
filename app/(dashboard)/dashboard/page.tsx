"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users, AlertTriangle, Zap, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPct } from "@/lib/utils";

interface DashboardData {
  totalRevenue: number;
  revenuePerTech: number;
  efficiencyGain: number;
  missedRevenue: number;
  technicianCount: number;
  jobCount: number;
  lastSchedule: {
    date: string;
    efficiencyGainPct: number;
    revenueUplift: number;
  } | null;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const kpis = data
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(data.totalRevenue),
          subtext: `${data.jobCount} jobs tracked`,
          icon: DollarSign,
          color: "amber",
          trend: "+12%",
        },
        {
          label: "Revenue / Technician",
          value: formatCurrency(data.revenuePerTech),
          subtext: `${data.technicianCount} active technicians`,
          icon: Users,
          color: "blue",
          trend: data.efficiencyGain > 0 ? formatPct(data.efficiencyGain) : null,
        },
        {
          label: "Efficiency Gain",
          value: data.efficiencyGain > 0 ? formatPct(data.efficiencyGain) : "—",
          subtext: "vs. unoptimized baseline",
          icon: TrendingUp,
          color: "emerald",
          trend: data.lastSchedule ? "Last run today" : "No runs yet",
        },
        {
          label: "Missed Revenue Est.",
          value: formatCurrency(data.missedRevenue),
          subtext: "unassigned job capacity",
          icon: AlertTriangle,
          color: "red",
          trend: "Recoverable",
        },
      ]
    : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time dispatch performance metrics
          </p>
        </div>
        <Link
          href="/dashboard/dispatch"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-md transition-all hover:shadow-lg hover:shadow-amber-500/20"
        >
          <Zap className="w-4 h-4" />
          Run Optimization
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={CARD_VARIANTS}
              className="bg-card border border-border rounded-lg p-5 relative overflow-hidden group hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    kpi.color === "amber"
                      ? "bg-amber-500/10 text-amber-400"
                      : kpi.color === "blue"
                      ? "bg-blue-500/10 text-blue-400"
                      : kpi.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-semibold tracking-tight mb-1">{kpi.value}</div>
              <div className="text-xs text-zinc-500">{kpi.subtext}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
            <h2 className="font-semibold">Last Optimization Run</h2>
          </div>
          {data?.lastSchedule ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Efficiency Gain</div>
                <div className="text-xl font-semibold text-amber-400">
                  {formatPct(data.lastSchedule.efficiencyGainPct)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Revenue Uplift</div>
                <div className="text-xl font-semibold text-emerald-400">
                  {formatCurrency(data.lastSchedule.revenueUplift)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Run Date</div>
                <div className="text-xl font-semibold">
                  {new Date(data.lastSchedule.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500 mb-4">No optimization runs yet</p>
              <Link
                href="/dashboard/dispatch"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Run your first optimization <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-amber-500/20 bg-amber-500/5 rounded-lg p-6"
        >
          <div className="text-xs text-amber-400/70 font-mono uppercase tracking-wider mb-3">
            Quick Actions
          </div>
          <div className="space-y-2">
            {[
              { href: "/dashboard/technicians", label: "Add Technician", icon: Users },
              { href: "/dashboard/jobs", label: "Add Jobs", icon: Zap },
              { href: "/dashboard/dispatch", label: "Optimize Today", icon: TrendingUp },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-amber-500/10 transition-colors group"
              >
                <action.icon className="w-4 h-4 text-amber-500/70 group-hover:text-amber-400" />
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-zinc-600 group-hover:text-amber-500 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
