"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Star, Phone, Globe, Zap, Copy, Check,
  ChevronDown, ChevronUp, RefreshCw, X, Mail, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustNote } from "@/components/TrustNote";

interface Lead {
  id: string;
  businessName: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string;
  rating: number | null;
  reviewCount: number;
  estimatedTechs: number;
  leadScore: number;
  outreachAngle: string | null;
  outreachMessage: string | null;
  status: string;
  notes: string | null;
  contactedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  NEW:         { label: "New",         color: "#94a3b8", bg: "#94a3b815", border: "#94a3b830" },
  CONTACTED:   { label: "Contacted",   color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  REPLIED:     { label: "Replied",     color: "#06b6d4", bg: "#06b6d415", border: "#06b6d430" },
  DEMO_BOOKED: { label: "Demo",        color: "#a78bfa", bg: "#a78bfa15", border: "#a78bfa30" },
  CONVERTED:   { label: "Converted",  color: "#10b981", bg: "#10b98115", border: "#10b98130" },
  DEAD:        { label: "Dead",        color: "#ef4444", bg: "#ef444415", border: "#ef444430" },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  A: { label: "A — High Priority",  color: "#10b981" },
  B: { label: "B — Mid Priority",   color: "#f59e0b" },
  C: { label: "C — Low Priority",   color: "#6b7280" },
};

function scoreTier(score: number): "A" | "B" | "C" {
  if (score >= 75) return "A";
  if (score >= 50) return "B";
  return "C";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
      {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function LeadRow({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [channel, setChannel] = useState<"email" | "sms" | "linkedin" | "facebook">("email");
  const [message, setMessage] = useState(lead.outreachMessage ?? "");
  const [loadingMsg, setLoadingMsg] = useState(false);

  // Auto-load email message on first expand if not already stored
  useEffect(() => {
    if (expanded && !message) {
      loadMessage("email");
    }
  }, [expanded]);
  const tier = scoreTier(lead.leadScore);
  const statusCfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.NEW;
  const tierCfg = TIER_CONFIG[tier];

  async function loadMessage(ch: typeof channel) {
    setChannel(ch);
    setLoadingMsg(true);
    try {
      const res = await fetch("/api/leads/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass the full lead — the API normalizes businessName → name internally
        body: JSON.stringify({ lead, channel: ch }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate message");
      }
      const data = await res.json();
      setMessage(data.body ?? "");
    } catch (err: any) {
      setMessage(`Error generating message: ${err.message}. Please try again.`);
    } finally {
      setLoadingMsg(false);
    }
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden transition-all", expanded && "border-zinc-700")}>
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/2 transition-colors text-left"
      >
        {/* Score + tier */}
        <div className="flex-shrink-0 w-14 text-center">
          <div className="text-base font-bold" style={{ color: tierCfg.color }}>{lead.leadScore.toFixed(0)}</div>
          <div className="text-[9px] font-mono" style={{ color: tierCfg.color }}>{tier}</div>
        </div>

        {/* Business info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{lead.businessName}</div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{lead.city}
            </span>
            {lead.rating && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />{lead.rating} ({lead.reviewCount})
              </span>
            )}
          </div>
        </div>

        {/* Est techs */}
        <div className="text-center flex-shrink-0 w-16">
          <div className="text-sm font-semibold">{lead.estimatedTechs}</div>
          <div className="text-[10px] text-zinc-500 font-mono">est. techs</div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <select
            value={lead.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); onStatusChange(lead.id, e.target.value); }}
            className="text-[10px] font-mono px-2 py-1 rounded border cursor-pointer appearance-none focus:outline-none"
            style={{ background: statusCfg.bg, borderColor: statusCfg.border, color: statusCfg.color }}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Contact icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {lead.phone && <Phone className="w-3.5 h-3.5 text-zinc-600" />}
          {lead.website && <Globe className="w-3.5 h-3.5 text-zinc-600" />}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-5 grid grid-cols-2 gap-6">
              {/* Contact details */}
              <div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">Contact Details</div>
                <div className="space-y-2 text-sm">
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="text-zinc-300">{lead.phone}</span>
                      <CopyButton text={lead.phone} />
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-600" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs truncate max-w-[200px]">
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {lead.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-600 mt-0.5" />
                      <span className="text-zinc-400 text-xs">{lead.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-2">Opportunity</div>
                <div className="bg-background border border-border rounded-md p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Lead Score</span>
                    <span className="font-mono" style={{ color: tierCfg.color }}>{lead.leadScore.toFixed(0)}/100 · {tier} tier</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Est. Technicians</span>
                    <span className="text-zinc-300">{lead.estimatedTechs} techs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Monthly Opportunity</span>
                    <span className="text-emerald-400 font-semibold">
                      {lead.estimatedTechs <= 4 ? "$2.4K–$4.8K" : lead.estimatedTechs <= 8 ? "$4.8K–$8.4K" : "$7.2K–$14K"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Outreach Angle</span>
                    <span className="text-zinc-300 font-mono">{lead.outreachAngle?.replace("_", " ")}</span>
                  </div>
                </div>
              </div>

              {/* Outreach message */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Outreach Message</div>
                  <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5">
                    {(["email","sms","linkedin","facebook"] as const).map(ch => (
                      <button
                        key={ch}
                        onClick={() => loadMessage(ch)}
                        className={cn(
                          "text-[10px] font-mono px-2 py-1 rounded transition-all",
                          channel === ch ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {ch === "linkedin" ? "LI" : ch === "facebook" ? "FB" : ch.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {loadingMsg && (
                    <div className="absolute inset-0 bg-card/60 flex items-center justify-center rounded-md z-10">
                      <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                    </div>
                  )}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full bg-background border border-border rounded-md p-3 text-xs text-zinc-300 leading-relaxed resize-none focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <TrustNote variant="simulation" size="xs" />
                  <CopyButton text={message} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  async function loadLeads() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadLeads(); }, []);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), mock: true }), // mock=true until Google key added
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadLeads();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScraping(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  const filtered = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);
  const tierCounts = { A: 0, B: 0, C: 0 };
  leads.forEach((l) => { const t = scoreTier(l.leadScore); tierCounts[t]++; });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            HVAC contractor leads scored by revenue opportunity. Outreach messages auto-generated.
          </p>
        </div>
        {/* Scrape form */}
        <form onSubmit={handleScrape} className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Atlanta, GA"
              className="bg-card border border-border rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-44"
            />
          </div>
          <button
            type="submit"
            disabled={scraping || !location.trim()}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold text-sm px-4 py-2 rounded-md transition-all"
          >
            {scraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {scraping ? "Scraping..." : "Find Leads"}
          </button>
        </form>
      </div>

      {/* Trust note */}
      <div className="mb-5">
        <TrustNote variant="privacy" size="xs" />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5 text-sm text-red-400">{error}</div>
      )}

      {/* Tier summary */}
      {leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["A", "B", "C"] as const).map((tier) => {
            const cfg = TIER_CONFIG[tier];
            return (
              <div key={tier} className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-zinc-500 font-mono mb-1">{cfg.label}</div>
                <div className="text-2xl font-semibold" style={{ color: cfg.color }}>{tierCounts[tier]}</div>
                <div className="text-xs text-zinc-600 mt-0.5">leads</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 mb-5 bg-card border border-border rounded-lg p-1 w-fit">
        {["ALL", "NEW", "CONTACTED", "REPLIED", "DEMO_BOOKED", "CONVERTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] font-mono font-medium transition-all",
              filter === s ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {s.replace("_", " ")}
            {s !== "ALL" && (
              <span className="ml-1.5 text-zinc-600">
                {leads.filter((l) => l.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-cyan-500/60" />
          </div>
          <h3 className="font-medium mb-2">No leads yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Enter a city above to pull HVAC contractor leads in that market. Each lead is auto-scored and has an outreach message ready to send.
          </p>
          <div className="mt-6 text-xs text-zinc-600 font-mono">
            Tip: Try "Atlanta, GA" or "Dallas, TX" to test with mock data
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LeadRow lead={lead} onStatusChange={handleStatusChange} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pipeline stats footer */}
      {leads.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border flex items-center gap-8 text-xs text-zinc-500">
          <span>{leads.length} total leads</span>
          <span>{leads.filter((l) => l.status === "CONVERTED").length} converted</span>
          <span className="text-emerald-400">
            {leads.filter((l) => l.status === "CONVERTED").length > 0
              ? `~$${(leads.filter((l) => l.status === "CONVERTED").length * 299).toLocaleString()} MRR from pipeline`
              : "Close your first lead → $199–$399/mo"}
          </span>
        </div>
      )}
    </div>
  );
}
