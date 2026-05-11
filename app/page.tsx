"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SignUpButton, SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// ─── AUTO-REDIRECT SIGNED-IN USERS ───────────────────────────────────────────
function AuthRedirect() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && isSignedIn) router.push("/dashboard");
  }, [isLoaded, isSignedIn, router]);
  return null;
}

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: "#060a0d",
  surface: "#0a0f14",
  elevated: "#0f1620",
  border: "#141f2a",
  borderStrong: "#1c2d3d",
  accent: "#06b6d4",
  accentDim: "rgba(6,182,212,0.08)",
  accentBorder: "rgba(6,182,212,0.2)",
  positive: "#10b981",
  positiveDim: "rgba(16,185,129,0.08)",
  positiveBorder: "rgba(16,185,129,0.2)",
  warning: "#f59e0b",
  text: "#e2e8f0",
  textSub: "#94a3b8",
  textMuted: "#4a6070",
};

// ─── ANIMATED NUMBER ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, prefix = "", suffix = "", duration = 1800 }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || started) return;
    setStarted(true);
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCurrent(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, started, target, duration]);

  return (
    <span ref={ref}>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  );
}

// ─── SECTION FADE ──────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── TICKER HERO ──────────────────────────────────────────────────────────────
function RevenueTicker() {
  const [values, setValues] = useState([0, 0, 0]);
  const targets = [4_200, 19, 31];

  useEffect(() => {
    const duration = 2200;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setValues([
        Math.round(4200 * ease),
        Math.round(19 * ease * 10) / 10,
        Math.round(31 * ease),
      ]);
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: "flex", gap: 1, justifyContent: "center", marginBottom: 56 }}>
      {[
        { val: `+$${values[0].toLocaleString()}`, label: "avg weekly uplift" },
        { val: `+${values[1]}%`, label: "revenue per tech hour" },
        { val: `-${values[2]}%`, label: "wasted drive time" },
      ].map((item, i) => (
        <div key={i} style={{
          background: i === 0 ? "rgba(16,185,129,0.08)" : "rgba(6,182,212,0.06)",
          border: `1px solid ${i === 0 ? "rgba(16,185,129,0.18)" : "rgba(6,182,212,0.14)"}`,
          padding: "10px 20px",
          borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : "0",
          textAlign: "center",
          minWidth: 130,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? "#10b981" : C.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
            {item.val}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SCHEDULE VISUALIZATION ────────────────────────────────────────────────────
function ScheduleViz({ type }) {
  const isOptimized = type === "optimized";
  const techs = ["M. Reid", "S. Chen", "D. Williams", "P. Patel", "J. Kowalski"];

  const baseline = [
    [{ w: 20, v: 320, gap: 18 }, { w: 35, v: 890, gap: 24 }, { w: 12, v: 280, gap: 32 }],
    [{ w: 42, v: 4200, gap: 0 }, { w: 18, v: 340, gap: 28 }],
    [{ w: 55, v: 6800, gap: 0 }, { w: 20, v: 620, gap: 0 }],
    [{ w: 28, v: 1850, gap: 16 }, { w: 14, v: 480, gap: 22 }],
    [{ w: 10, v: 280, gap: 38 }, { w: 18, v: 740, gap: 28 }, { w: 8, v: 220, gap: 0 }],
  ];

  const optimized = [
    [{ w: 42, v: 4200, gap: 0 }, { w: 20, v: 1650, gap: 4 }, { w: 22, v: 2200, gap: 4 }],
    [{ w: 55, v: 6800, gap: 0 }, { w: 20, v: 1100, gap: 4 }],
    [{ w: 48, v: 5400, gap: 0 }, { w: 34, v: 3100, gap: 4 }],
    [{ w: 28, v: 2800, gap: 0 }, { w: 20, v: 1850, gap: 4 }, { w: 14, v: 740, gap: 4 }],
    [{ w: 24, v: 2200, gap: 0 }, { w: 18, v: 890, gap: 4 }, { w: 14, v: 480, gap: 4 }],
  ];

  const data = isOptimized ? optimized : baseline;
  const totalRev = data.flat().reduce((s, j) => s + j.v, 0);

  return (
    <div style={{
      background: isOptimized ? "rgba(16,185,129,0.03)" : C.surface,
      border: `1px solid ${isOptimized ? "rgba(16,185,129,0.18)" : C.border}`,
      borderRadius: 12, padding: "20px 22px",
      flex: 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: isOptimized ? "#10b981" : C.textMuted, marginBottom: 3 }}>
            {isOptimized ? "▲ OPTIMIZED SCHEDULE" : "▼ BASELINE SCHEDULE"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: isOptimized ? "#10b981" : C.textSub }}>
            ${totalRev.toLocaleString()}
          </div>
        </div>
        {isOptimized && (
          <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>
            +25.1% GAIN
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {techs.map((name, ti) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 62, fontSize: 9, color: C.textMuted, fontFamily: "monospace", flexShrink: 0, textAlign: "right" }}>
              {name}
            </div>
            <div style={{ flex: 1, height: 22, display: "flex", gap: 0, alignItems: "center", position: "relative" }}>
              {data[ti].map((job, ji) => (
                <>
                  {job.gap > 0 && (
                    <div key={`gap-${ji}`} style={{
                      width: `${job.gap * 0.7}%`, height: "100%",
                      background: "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(239,68,68,0.06) 3px, rgba(239,68,68,0.06) 6px)",
                      borderRadius: 2, flexShrink: 0,
                    }} />
                  )}
                  <div key={`job-${ji}`} style={{
                    width: `${job.w}%`, height: "100%",
                    background: isOptimized
                      ? `rgba(16,185,129,${0.15 + (job.v / 7000) * 0.25})`
                      : `rgba(6,182,212,${0.08 + (job.v / 7000) * 0.15})`,
                    border: `1px solid ${isOptimized ? "rgba(16,185,129,0.3)" : "rgba(6,182,212,0.2)"}`,
                    borderRadius: 3, display: "flex", alignItems: "center",
                    paddingLeft: 4, flexShrink: 0, marginRight: isOptimized ? 2 : 0,
                    transition: "all 0.3s",
                  }}>
                    {job.v >= 1000 && (
                      <span style={{ fontSize: 7, color: isOptimized ? "#10b981" : C.accent, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        ${(job.v / 1000).toFixed(1)}K
                      </span>
                    )}
                  </div>
                </>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Time labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginLeft: 70, fontSize: 8, color: C.textMuted, fontFamily: "monospace" }}>
        {["8AM","10AM","12PM","2PM","4PM"].map(t => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

// ─── PAIN POINT CARD ──────────────────────────────────────────────────────────
function PainCard({ icon, title, stat, desc, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: C.elevated, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "28px 26px", position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, rgba(239,68,68,0.4), transparent)" }} />
      <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{stat}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  );
}

// ─── ROI ROW ──────────────────────────────────────────────────────────────────
function ROIRow({ label, value, sub, color, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex", alignItems: "center", gap: 20,
        padding: "18px 24px", background: C.elevated,
        border: `1px solid ${C.border}`, borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color, minWidth: 110, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {inView ? <AnimatedNumber target={typeof value === "number" ? value : 0} prefix={typeof value === "string" ? value.replace(/\d+/g, "") : ""} suffix="" /> : "0"}
        {typeof value === "string" && value}
      </div>
      <div style={{ width: 1, height: 32, background: C.border }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</div>
      </div>
    </motion.div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [techCount, setTechCount] = useState("5-10");
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(6,182,212,0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1c2d3d; border-radius: 2px; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glow-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #e2e8f0 0%, #10b981 40%, #06b6d4 60%, #e2e8f0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .btn-primary {
          background: linear-gradient(135deg, #06b6d4, #10b981);
          color: #000;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(6,182,212,0.35); }
        .btn-ghost {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #141f2a;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-ghost:hover { border-color: #1c2d3d; color: #e2e8f0; }
        .grid-bg {
          background-image: linear-gradient(rgba(6,182,212,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        input, select {
          font-family: inherit;
          background: #0a0f14;
          border: 1px solid #141f2a;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus { border-color: rgba(6,182,212,0.4); }
        input::placeholder { color: #4a6070; }
        select option { background: #0a0f14; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 60,
        background: scrollY > 40 ? "rgba(6,10,13,0.92)" : "transparent",
        borderBottom: scrollY > 40 ? `1px solid ${C.border}` : "1px solid transparent",
        backdropFilter: scrollY > 40 ? "blur(12px)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg, #06b6d4, #10b981)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>Ventus</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SignInButton mode="modal">
            <button className="btn-ghost" style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7 }}>Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary" style={{ fontSize: 13, padding: "8px 18px", borderRadius: 7 }}>Start Free Trial</button>
          </SignUpButton>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="grid-bg" style={{ position: "relative", paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 65%)", pointerEvents: "none", animation: "glow-pulse 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "40%", left: "20%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ fontSize: 11, color: C.accent, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Dispatch Intelligence Engine · Field-Service Optimized
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: "clamp(36px, 5.5vw, 68px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Increase HVAC Revenue<br />
            <span className="shimmer-text">Per Technician by 15–25%</span>
            <br />Without Hiring
          </h1>

          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: C.textSub, maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.65 }}>
            AI-powered dispatch optimization that turns your daily schedule into a
            revenue-maximizing operation. See your exact opportunity in under 60 seconds.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            <SignUpButton mode="modal">
              <button className="btn-primary" style={{ fontSize: 15, padding: "14px 28px", borderRadius: 9, display: "flex", alignItems: "center", gap: 8 }}>
                See My Revenue Opportunity
                <span style={{ fontSize: 18 }}>→</span>
              </button>
            </SignUpButton>
            <button className="btn-ghost" style={{ fontSize: 14, padding: "14px 24px", borderRadius: 9 }} onClick={() => document.getElementById("demo-capture")?.scrollIntoView({ behavior: "smooth" })}>
              View Live Demo
            </button>
          </div>

          {/* Tickers */}
          <RevenueTicker />

          {/* Trust bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, fontSize: 11, color: C.textMuted, flexWrap: "wrap" }}>
            {["No setup required", "See results in 60 seconds", "Cancel anytime"].map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {i > 0 && <span style={{ color: C.border }}>·</span>}
                <span style={{ color: "#10b981", fontSize: 12 }}>✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PROBLEM AGITATION ───────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The Problem</div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, maxWidth: 600, margin: "0 auto" }}>
              Most HVAC companies lose revenue every day without realizing it
            </h2>
          </div>
        </FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <PainCard delay={0} icon="🗺️" stat="$1,200+" title="Wasted per technician weekly" desc="Unoptimized routing sends techs across town for low-value jobs while high-margin work sits unscheduled nearby." />
          <PainCard delay={0.1} icon="⏱️" stat="2.4 hrs" title="Average daily idle time per tech" desc="Gaps between jobs compound across your fleet. Five technicians. That's 12+ hours of paid time producing zero revenue." />
          <PainCard delay={0.2} icon="💸" stat="$8K–$15K" title="Monthly revenue left on the table" desc="High-value jobs are routinely delayed or skipped when schedulers manually assign work in creation order instead of value order." />
        </div>
      </section>

      {/* ── SOLUTION MECHANISM ──────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The System</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                A real-time dispatch optimization engine<br />built for field service operations
              </h2>
            </div>
          </FadeUp>

          {/* 3-step flow */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { step: "01", icon: "◉", title: "Ingest", desc: "Add technicians and jobs — or import via CSV. The system ingests location, availability, job value, and duration in seconds." },
              { step: "02", icon: "⚡", title: "Optimize", desc: "The greedy scheduling engine scores every possible assignment by revenue-per-minute, weighting travel time and job priority." },
              { step: "03", icon: "▲", title: "Execute", desc: "Receive a ranked, optimized daily schedule per technician. Compare it against your baseline. See the exact revenue delta." },
            ].map((step, i) => (
              <FadeUp key={i} delay={i * 0.12} style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "28px 24px" }}>
                    <div style={{ width: 48, height: 48, background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.accent, margin: "0 auto 16px" }}>{step.icon}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8 }}>STEP {step.step}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                  {i < 2 && (
                    <div style={{ color: C.textMuted, fontSize: 20, flexShrink: 0, padding: "0 4px" }}>→</div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE VS AFTER ─────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The Transformation</div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              The same team. A completely different outcome.
            </h2>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ScheduleViz type="baseline" />
            <ScheduleViz type="optimized" />
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 16, fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 6, background: "rgba(239,68,68,0.3)", borderRadius: 2, backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(239,68,68,0.3) 2px, rgba(239,68,68,0.3) 4px)" }} />
              Idle gap / wasted time
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 6, background: "rgba(16,185,129,0.4)", borderRadius: 2 }} />
              Revenue-generating work
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── ROI METRICS ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Modeled Results</div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
                What optimization actually delivers
              </h2>
            </div>
          </FadeUp>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ROIRow label="More jobs completed per day" sub="Across all technicians, avg 5-tech fleet" value="+18%" color="#10b981" delay={0} />
            <ROIRow label="Revenue per technician hour" sub="vs. unoptimized baseline dispatch" value="+22%" color={C.accent} delay={0.08} />
            <ROIRow label="Travel time reduction" sub="Route clustering and sequential assignment" value="-14%" color="#f59e0b" delay={0.16} />
            <ROIRow label="Weekly revenue uplift potential" sub="Based on simulated 7-tech dispatch model" value="$3,000–$10,000" color="#10b981" delay={0.24} />
          </div>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
            * Based on simulated dispatch optimization model. Individual results vary by team size and job mix.
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Operator Scenarios</div>
            <h2 style={{ fontSize: "clamp(22px, 2.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Built around real operational constraints
            </h2>
          </div>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {[
            { size: "7 technicians", region: "Southeast residential market", stat: "+19%", metric: "utilization improvement", detail: "Simulated deployment scenario. High-value commercial jobs moved to first AM slot across 4 of 7 techs." },
            { size: "12 technicians", region: "Mixed commercial/residential fleet", stat: "+$6,200", metric: "weekly revenue delta", detail: "Route optimization reduced avg drive time by 18 min/tech/day. Freed capacity for 3 additional high-value jobs." },
            { size: "4 technicians", region: "Urban dense market", stat: "−28%", metric: "idle time reduction", detail: "Geographic clustering eliminated cross-town dispatching. 2.1 more jobs completed per technician per day." },
          ].map((c, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 22px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.accent}40, transparent)` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginBottom: 4 }}>{c.size}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{c.region}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{c.stat}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{c.metric}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.65 }}>{c.detail}</div>
                <div style={{ marginTop: 12, fontSize: 9, color: C.textMuted, fontFamily: "monospace" }}>SIMULATED PRODUCTION SCENARIO</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── DEMO CAPTURE ────────────────────────────────────────────────── */}
      <section id="demo-capture" style={{ padding: "80px 24px", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <FadeUp>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Revenue Diagnostic</div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>
              See Your Revenue Opportunity in Under 60 Seconds
            </h2>
            <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.65, marginBottom: 36 }}>
              Enter your details and we'll run a simulated dispatch analysis for a fleet matching your operation.
            </p>
          </FadeUp>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleSubmit} style={{ background: C.elevated, border: `1px solid ${C.borderStrong}`, borderRadius: 14, padding: "32px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #06b6d4, #10b981)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input
                    type="email" required placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 8, fontSize: 14 }}
                  />
                  <select value={techCount} onChange={e => setTechCount(e.target.value)} style={{ width: "100%", padding: "13px 16px", borderRadius: 8, fontSize: 14, color: techCount === "" ? "#4a6070" : C.text }}>
                    <option value="" disabled>Number of technicians</option>
                    <option value="1-4">1–4 technicians</option>
                    <option value="5-10">5–10 technicians</option>
                    <option value="11-20">11–20 technicians</option>
                    <option value="21+">21+ technicians</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px", borderRadius: 8, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Run My Dispatch Analysis
                    <span style={{ fontSize: 18 }}>→</span>
                  </button>
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                  No credit card · No setup · Instant results
                </div>
              </motion.form>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "44px 28px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>⚡</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Analysis incoming</div>
                <div style={{ fontSize: 13, color: C.textSub }}>Check your inbox. In the meantime, explore the live demo →</div>
                <SignUpButton mode="modal">
                  <button className="btn-primary" style={{ marginTop: 20, padding: "11px 24px", borderRadius: 8, fontSize: 14 }}>Open Live Demo</button>
                </SignUpButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <FadeUp>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Start Today</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Every inefficient dispatch<br />
            <span style={{ color: "#ef4444" }}>is lost revenue.</span>
          </h2>
          <p style={{ fontSize: 15, color: C.textSub, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
            Most teams see measurable ROI within the first week of usage.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <SignUpButton mode="modal">
              <button className="btn-primary" style={{ fontSize: 16, padding: "16px 36px", borderRadius: 10, display: "flex", alignItems: "center", gap: 9 }}>
                Start Optimizing My Schedule
                <span style={{ fontSize: 20 }}>→</span>
              </button>
            </SignUpButton>
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: C.textMuted }}>
            Starter $199/mo · Growth $399/mo · Cancel anytime
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.textMuted, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 18, height: 18, background: "linear-gradient(135deg, #06b6d4, #10b981)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>⚡</div>
          Ventus © 2024
        </div>
        <div style={{ fontFamily: "monospace" }}>Built for the field. Powered by Ventus.</div>
      </footer>
    </div>
  );
}
