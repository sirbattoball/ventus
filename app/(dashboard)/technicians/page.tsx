"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Trash2, UserCheck, MapPin, Clock, X } from "lucide-react";
import Papa from "papaparse";

interface Technician {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  available: boolean;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  lat: "",
  lng: "",
  startTime: "08:00",
  endTime: "17:00",
};

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/technicians");
    const data = await res.json();
    setTechnicians(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
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
    await fetch(`/api/technicians/${id}`, { method: "DELETE" });
    load();
  }

  async function handleToggle(id: string, available: boolean) {
    await fetch(`/api/technicians/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !available }),
    });
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
          await fetch("/api/technicians", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: row.name || row.Name,
              email: row.email || row.Email || null,
              phone: row.phone || row.Phone || null,
              lat: parseFloat(row.lat || row.latitude || "33.749"),
              lng: parseFloat(row.lng || row.longitude || "-84.388"),
              startTime: row.startTime || row.start_time || "08:00",
              endTime: row.endTime || row.end_time || "17:00",
            }),
          });
        }
        load();
      },
    });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Technicians</h1>
          <p className="text-sm text-zinc-500 mt-1">{technicians.length} technician{technicians.length !== 1 ? "s" : ""} configured</p>
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
            Add Technician
          </button>
        </div>
      </div>

      {/* CSV hint */}
      <div className="bg-card border border-border rounded-lg p-3 mb-6 text-xs text-zinc-500 font-mono">
        CSV format: <span className="text-zinc-300">name, email, phone, lat, lng, startTime, endTime</span>
        <span className="ml-4 text-zinc-600">// startTime/endTime format: "08:00"</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : technicians.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <UserCheck className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="font-medium mb-1">No technicians yet</h3>
          <p className="text-sm text-zinc-500">Add technicians or import from CSV to start optimizing</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Contact", "Location", "Hours", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-xs text-zinc-500 font-mono uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech, i) => (
                <motion.tr
                  key={tech.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-white/2"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-amber-400">
                        {tech.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-sm">{tech.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400">
                    <div>{tech.email || "—"}</div>
                    <div className="text-xs text-zinc-600">{tech.phone || ""}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400 font-mono">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-600" />
                      {tech.lat.toFixed(3)}, {tech.lng.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {tech.startTime} – {tech.endTime}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(tech.id, tech.available)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        tech.available
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                          : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${tech.available ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {tech.available ? "Available" : "Offline"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(tech.id)}
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

      {/* Add form modal */}
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
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Add Technician</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="Marcus Reid"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="tech@company.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      placeholder="(404) 555-0100"
                    />
                  </div>
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
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>
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
                    {submitting ? "Adding..." : "Add Technician"}
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
