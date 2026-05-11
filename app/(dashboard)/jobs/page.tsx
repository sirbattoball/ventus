"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Trash2, Briefcase, X, DollarSign, Clock } from "lucide-react";
import Papa from "papaparse";
import { formatCurrency, priorityColor, statusColor } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  customerName: string;
  address: string | null;
  lat: number;
  lng: number;
  value: number;
  durationMins: number;
  priority: string;
  status: string;
}

const EMPTY_FORM = {
  title: "",
  customerName: "",
  address: "",
  lat: "",
  lng: "",
  value: "",
  durationMins: "60",
  priority: "MEDIUM",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  async function load() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          value: parseFloat(form.value),
          durationMins: parseInt(form.durationMins),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    load();
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data as any[]) {
          await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: row.title || row.Title,
              customerName: row.customerName || row.customer || row.Customer,
              address: row.address || row.Address || null,
              lat: parseFloat(row.lat || row.latitude || "33.749"),
              lng: parseFloat(row.lng || row.longitude || "-84.388"),
              value: parseFloat(row.value || row.Value || "0"),
              durationMins: parseInt(row.durationMins || row.duration || "60"),
              priority: (row.priority || row.Priority || "MEDIUM").toUpperCase(),
            }),
          });
        }
        load();
      },
    });
  }

  const totalValue = jobs.reduce((s, j) => s + j.value, 0);
  const pendingJobs = jobs.filter((j) => j.status === "PENDING");

  const filtered = filter === "ALL" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {jobs.length} total · {pendingJobs.length} pending · {formatCurrency(totalValue)} total value
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm border border-border text-zinc-400 hover:text-white hover:border-zinc-600 px-4 py-2 rounded-md transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* CSV hint */}
      <div className="bg-card border border-border rounded-lg p-3 mb-4 text-xs text-zinc-500 font-mono">
        CSV format: <span className="text-zinc-300">title, customerName, address, lat, lng, value, durationMins, priority</span>
        <span className="ml-4 text-zinc-600">// priority: LOW | MEDIUM | HIGH | URGENT</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit">
        {["ALL", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all font-mono ${
              filter === s ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="font-medium mb-1">No jobs found</h3>
          <p className="text-sm text-zinc-500">Add jobs or import from CSV to start dispatching</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Job", "Customer", "Value", "Duration", "Priority", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-xs text-zinc-500 font-mono uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, i) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 last:border-0 hover:bg-white/2"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-sm">{job.title}</div>
                    {job.address && (
                      <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-[180px]">{job.address}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400">{job.customerName}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatCurrency(job.value).replace("$", "")}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-zinc-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      {job.durationMins}m
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded border font-medium font-mono ${priorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded border font-medium font-mono ${statusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Job Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Add Job</h2>
                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Job Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    placeholder="AC Unit Replacement"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Customer Name *</label>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    placeholder="Northside Medical Center"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    placeholder="123 Peachtree St NE, Atlanta, GA"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Latitude *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 font-mono"
                      placeholder="33.749"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Longitude *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 font-mono"
                      placeholder="-84.388"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Job Value ($) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="1200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Duration (mins) *</label>
                    <input
                      required
                      type="number"
                      min="15"
                      value={form.durationMins}
                      onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="120"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-border text-zinc-400 hover:text-white py-2.5 rounded-md text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-md text-sm transition-all"
                  >
                    {submitting ? "Adding..." : "Add Job"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
