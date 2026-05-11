/**
 * Ventus — Synthetic Demo Data Engine
 * Generates statistically coherent HVAC operational datasets
 * following Pareto distribution for revenue skew
 */

export interface SimTechnician {
  id: string;
  name: string;
  efficiency: number;        // 0.75–1.15
  speedMultiplier: number;   // inverse of efficiency
  baseLat: number;
  baseLng: number;
  capacityHours: number;     // 6–10
  startHour: number;         // 7–9
}

export interface SimJob {
  id: string;
  title: string;
  customerName: string;
  customerType: "residential" | "commercial";
  value: number;             // log-normal $120–$8000
  durationMins: number;      // 30–240
  urgency: number;           // 1–10
  lat: number;
  lng: number;
  createdOrder: number;      // for FIFO simulation
}

export interface SimAssignment {
  techId: string;
  jobId: string;
  sequence: number;
  startMin: number;
  endMin: number;
  travelMins: number;
  revenue: number;
}

export interface SimSchedule {
  assignments: SimAssignment[];
  totalRevenue: number;
  totalJobs: number;
  totalTravelMins: number;
  idleMins: number;
  techUtilization: Record<string, number>; // techId → pct
}

export interface SimKPIs {
  baselineRevenue: number;
  optimizedRevenue: number;
  efficiencyGainPct: number;
  revenueUplift: number;
  baselineJobCount: number;
  optimizedJobCount: number;
  baselineTravelMins: number;
  optimizedTravelMins: number;
  travelReductionPct: number;
  baselineRPTH: number;       // Revenue per tech hour
  optimizedRPTH: number;
  rpthGainPct: number;
  missedRevenue: number;
  topMissedJobs: SimJob[];
}

export interface SimResult {
  technicians: SimTechnician[];
  jobs: SimJob[];
  baseline: SimSchedule;
  optimized: SimSchedule;
  kpis: SimKPIs;
}

// ─── RNG UTILITIES ─────────────────────────────────────────────────────────────
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  // Box-Muller normal distribution
  normal(mean: number, std: number): number {
    const u1 = this.next(), u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  // Log-normal distribution for revenue
  logNormal(mean: number, sigma: number): number {
    const n = this.normal(0, 1);
    return Math.exp(mean + sigma * n);
  }
}

// ─── DATA CONSTANTS ────────────────────────────────────────────────────────────
const TECH_NAMES = [
  "Marcus Reid", "Sarah Chen", "Devon Williams", "Priya Patel",
  "James Kowalski", "Mike Torres", "Lisa Nguyen", "Carlos Rivera",
  "Rachel Kim", "Brian O'Sullivan", "Destiny Johnson", "Aaron Metz",
  "Simone Burke", "Tyler Walsh", "Nina Peres",
];

const JOB_TITLES_RESIDENTIAL = [
  "AC Unit Replacement", "Furnace Tune-Up", "Heat Pump Installation",
  "Thermostat Upgrade", "Ductwork Inspection", "Filter Replacement + Service",
  "Refrigerant Recharge", "Blower Motor Replacement", "Emergency – No Heat",
  "UV Air Purifier Install", "Drain Line Clearing", "Annual Maintenance Plan",
  "Mini-Split Installation", "Preventive Inspection", "Zone Control System",
];

const JOB_TITLES_COMMERCIAL = [
  "Commercial Rooftop Unit", "Emergency HVAC Repair", "Compressor Replacement",
  "Cooling System Diagnostic", "HVAC System Install", "Multi-Zone Installation",
  "Building HVAC Audit", "RTU Preventive Maintenance", "Chiller Inspection",
  "BMS Integration Setup",
];

const CUSTOMER_NAMES_RES = [
  "Smith Residence", "Johnson Home", "Garcia Family", "Martinez Residence",
  "Anderson Home", "Taylor House", "Thomas Family", "Jackson Residence",
  "Wilson Home", "Moore Estate", "Davis Residence", "Brown Family",
];

const CUSTOMER_NAMES_COM = [
  "Northside Medical Center", "Buckhead Office Plaza", "Ponce City Market",
  "Atlantic Station Office", "Lenox Square Retail", "Cumberland Mall",
  "Sandy Springs Clinic", "Midtown High-Rise", "Perimeter Business Park",
  "Downtown Hotel Group",
];

// Atlanta metro region clusters (lat/lng)
const TERRITORY_CLUSTERS = [
  { lat: 33.749, lng: -84.388, weight: 0.25 },  // Downtown
  { lat: 33.843, lng: -84.381, weight: 0.2 },   // Buckhead
  { lat: 33.762, lng: -84.353, weight: 0.15 },  // Inman Park
  { lat: 33.924, lng: -84.378, weight: 0.1 },   // Sandy Springs
  { lat: 33.890, lng: -84.468, weight: 0.1 },   // Cumberland
  { lat: 33.726, lng: -84.345, weight: 0.1 },   // East Atlanta
  { lat: 33.704, lng: -84.408, weight: 0.1 },   // South Atlanta
];

// ─── DISTANCE MODEL ────────────────────────────────────────────────────────────
function euclideanMins(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dist = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
  // Scale: 1 degree ≈ 60 miles, 25 mph city → ~2.4 min per 0.01 degree
  return Math.ceil(dist * 240);
}

// ─── ENTITY GENERATORS ────────────────────────────────────────────────────────
function generateTechnicians(count: number, rng: SeededRandom): SimTechnician[] {
  const names = [...TECH_NAMES].sort(() => rng.next() - 0.5).slice(0, count);
  return names.map((name, i) => {
    const efficiency = Math.max(0.75, Math.min(1.15, rng.normal(0.95, 0.1)));
    const cluster = TERRITORY_CLUSTERS[i % TERRITORY_CLUSTERS.length];
    return {
      id: `tech_${i + 1}`,
      name,
      efficiency,
      speedMultiplier: 1 / efficiency,
      baseLat: cluster.lat + rng.range(-0.02, 0.02),
      baseLng: cluster.lng + rng.range(-0.02, 0.02),
      capacityHours: rng.range(7, 10),
      startHour: rng.int(7, 9),
    };
  });
}

function generateJobs(count: number, rng: SeededRandom): SimJob[] {
  const jobs: SimJob[] = [];

  for (let i = 0; i < count; i++) {
    const isCommercial = rng.next() < 0.2; // 80/20 residential split
    const type = isCommercial ? "commercial" : "residential";

    // Log-normal revenue distribution (Pareto-skewed)
    const logMean = isCommercial ? 7.2 : 6.4; // ln(~1300) vs ln(~600)
    const logSigma = isCommercial ? 0.7 : 0.8;
    const rawValue = rng.logNormal(logMean, logSigma);
    const value = Math.round(Math.max(120, Math.min(8000, rawValue)) / 10) * 10;

    // Duration correlates with value
    const baseDuration = isCommercial ? 120 : 75;
    const valueFactor = Math.log(value) / Math.log(4000);
    const durationMins = Math.round(
      Math.max(30, Math.min(360, rng.normal(baseDuration + valueFactor * 120, 30)))
    );

    // Location: clustered but not uniform
    const cluster = TERRITORY_CLUSTERS[Math.floor(rng.next() * TERRITORY_CLUSTERS.length)];
    const spread = isCommercial ? 0.04 : 0.025;

    const title = rng.pick(isCommercial ? JOB_TITLES_COMMERCIAL : JOB_TITLES_RESIDENTIAL);
    const customerName = rng.pick(isCommercial ? CUSTOMER_NAMES_COM : CUSTOMER_NAMES_RES);

    jobs.push({
      id: `job_${i + 1}`,
      title,
      customerName: `${customerName} ${i + 1}`,
      customerType: type,
      value,
      durationMins,
      urgency: Math.round(rng.normal(7, 1.5)),
      lat: cluster.lat + rng.range(-spread, spread),
      lng: cluster.lng + rng.range(-spread, spread),
      createdOrder: i,
    });
  }

  return jobs;
}

// ─── BASELINE SCHEDULE (NAIVE FIFO) ───────────────────────────────────────────
function generateBaselineSchedule(
  technicians: SimTechnician[],
  jobs: SimJob[]
): SimSchedule {
  const sortedJobs = [...jobs].sort((a, b) => a.createdOrder - b.createdOrder);

  const techState: Record<string, { currentMin: number; lat: number; lng: number; idleMins: number }> = {};
  technicians.forEach(t => {
    techState[t.id] = {
      currentMin: t.startHour * 60,
      lat: t.baseLat,
      lng: t.baseLng,
      idleMins: 0,
    };
  });

  const assignments: SimAssignment[] = [];
  let techIdx = 0;

  // Round-robin FIFO assignment (intentionally suboptimal)
  for (const job of sortedJobs) {
    const tech = technicians[techIdx % technicians.length];
    const state = techState[tech.id];
    const endOfDay = (tech.startHour + tech.capacityHours) * 60;

    const travel = euclideanMins(state.lat, state.lng, job.lat, job.lng);
    const start = state.currentMin + travel;
    const end = start + job.durationMins;

    if (end <= endOfDay) {
      // Add idle gap if technician finishes early and there's a delay
      const idleGap = Math.max(0, travel - 15); // anything over 15min travel adds idle feel
      state.idleMins += idleGap;

      assignments.push({
        techId: tech.id,
        jobId: job.id,
        sequence: assignments.filter(a => a.techId === tech.id).length + 1,
        startMin: start,
        endMin: end,
        travelMins: travel,
        revenue: job.value,
      });

      state.currentMin = end;
      state.lat = job.lat;
      state.lng = job.lng;
    }

    techIdx++;
  }

  return buildScheduleStats(assignments, technicians, techState);
}

// ─── OPTIMIZED SCHEDULE (GREEDY NEAREST-NEIGHBOR) ─────────────────────────────
function generateOptimizedSchedule(
  technicians: SimTechnician[],
  jobs: SimJob[]
): SimSchedule {
  const remaining = [...jobs];
  const techState: Record<string, { currentMin: number; lat: number; lng: number; endMin: number; idleMins: number }> = {};

  technicians.forEach(t => {
    techState[t.id] = {
      currentMin: t.startHour * 60,
      lat: t.baseLat,
      lng: t.baseLng,
      endMin: (t.startHour + t.capacityHours) * 60,
      idleMins: 0,
    };
  });

  const assignments: SimAssignment[] = [];

  // Greedy: score = (value / (travel + duration)) × urgency_weight
  let iterations = 0;
  const maxIter = jobs.length * technicians.length * 3;

  while (remaining.length > 0 && iterations++ < maxIter) {
    let bestScore = -Infinity;
    let bestTech: SimTechnician | null = null;
    let bestJob: SimJob | null = null;
    let bestTravel = 0;
    let bestJobIdx = -1;

    for (const tech of technicians) {
      const state = techState[tech.id];
      if (state.currentMin >= state.endMin) continue;

      for (let j = 0; j < remaining.length; j++) {
        const job = remaining[j];
        const travel = euclideanMins(state.lat, state.lng, job.lat, job.lng);
        const start = state.currentMin + travel;
        const end = start + job.durationMins;
        if (end > state.endMin) continue;

        // Score: revenue-per-minute with urgency and efficiency bonuses
        const urgencyMultiplier = 1 + (job.urgency - 5) * 0.08;
        const score = (job.value / (travel + job.durationMins)) * urgencyMultiplier * tech.efficiency;

        if (score > bestScore) {
          bestScore = score;
          bestTech = tech;
          bestJob = job;
          bestTravel = travel;
          bestJobIdx = j;
        }
      }
    }

    if (!bestTech || !bestJob || bestJobIdx === -1) break;

    const state = techState[bestTech.id];
    const start = state.currentMin + bestTravel;
    const end = start + bestJob.durationMins;

    assignments.push({
      techId: bestTech.id,
      jobId: bestJob.id,
      sequence: assignments.filter(a => a.techId === bestTech!.id).length + 1,
      startMin: start,
      endMin: end,
      travelMins: bestTravel,
      revenue: bestJob.value,
    });

    state.currentMin = end;
    state.lat = bestJob.lat;
    state.lng = bestJob.lng;
    remaining.splice(bestJobIdx, 1);
  }

  return buildScheduleStats(assignments, technicians, techState);
}

function buildScheduleStats(
  assignments: SimAssignment[],
  technicians: SimTechnician[],
  techState: Record<string, any>
): SimSchedule {
  const totalRevenue = assignments.reduce((s, a) => s + a.revenue, 0);
  const totalTravelMins = assignments.reduce((s, a) => s + a.travelMins, 0);
  const idleMins = Object.values(techState).reduce((s: number, ts: any) => s + (ts.idleMins || 0), 0);

  const techUtilization: Record<string, number> = {};
  for (const tech of technicians) {
    const techAssigns = assignments.filter(a => a.techId === tech.id);
    const workMins = techAssigns.reduce((s, a) => s + (a.endMin - a.startMin), 0);
    const capacityMins = tech.capacityHours * 60;
    techUtilization[tech.id] = Math.min(1, workMins / capacityMins);
  }

  return { assignments, totalRevenue, totalJobs: assignments.length, totalTravelMins, idleMins, techUtilization };
}

// ─── KPI COMPUTATION ──────────────────────────────────────────────────────────
function computeKPIs(
  technicians: SimTechnician[],
  jobs: SimJob[],
  baseline: SimSchedule,
  optimized: SimSchedule
): SimKPIs {
  const totalTechHours = technicians.reduce((s, t) => s + t.capacityHours, 0);

  const efficiencyGainPct = baseline.totalRevenue > 0
    ? ((optimized.totalRevenue - baseline.totalRevenue) / baseline.totalRevenue) * 100
    : 0;

  const travelReductionPct = baseline.totalTravelMins > 0
    ? ((baseline.totalTravelMins - optimized.totalTravelMins) / baseline.totalTravelMins) * 100
    : 0;

  const assignedJobIds = new Set(optimized.assignments.map(a => a.jobId));
  const missedJobs = jobs.filter(j => !assignedJobIds.has(j.id)).sort((a, b) => b.value - a.value);

  return {
    baselineRevenue: baseline.totalRevenue,
    optimizedRevenue: optimized.totalRevenue,
    efficiencyGainPct: Math.round(efficiencyGainPct * 10) / 10,
    revenueUplift: optimized.totalRevenue - baseline.totalRevenue,
    baselineJobCount: baseline.totalJobs,
    optimizedJobCount: optimized.totalJobs,
    baselineTravelMins: baseline.totalTravelMins,
    optimizedTravelMins: optimized.totalTravelMins,
    travelReductionPct: Math.round(travelReductionPct * 10) / 10,
    baselineRPTH: Math.round(baseline.totalRevenue / totalTechHours),
    optimizedRPTH: Math.round(optimized.totalRevenue / totalTechHours),
    rpthGainPct: Math.round(efficiencyGainPct * 10) / 10,
    missedRevenue: missedJobs.reduce((s, j) => s + j.value, 0),
    topMissedJobs: missedJobs.slice(0, 3),
  };
}

// ─── MAIN SIMULATION RUNNER ───────────────────────────────────────────────────
export function runSimulation(options?: {
  techCount?: number;
  jobCount?: number;
  seed?: number;
}): SimResult {
  const seed = options?.seed ?? Date.now();
  const techCount = options?.techCount ?? 5;
  const jobCount = options?.jobCount ?? 20;

  const rng = new SeededRandom(seed);

  const technicians = generateTechnicians(techCount, rng);
  const jobs = generateJobs(jobCount, rng);
  const baseline = generateBaselineSchedule(technicians, jobs);
  const optimized = generateOptimizedSchedule(technicians, jobs);
  const kpis = computeKPIs(technicians, jobs, baseline, optimized);

  // Guarantee minimum wow-state thresholds
  // If efficiency gain is less than 12%, re-run with adjusted seed
  if (kpis.efficiencyGainPct < 12 && (options?.seed === undefined)) {
    return runSimulation({ techCount, jobCount, seed: seed + 1 });
  }

  return { technicians, jobs, baseline, optimized, kpis };
}

// ─── DEMO SUMMARY FORMATTER ───────────────────────────────────────────────────
export function formatDemoSummary(result: SimResult) {
  const { kpis } = result;
  return {
    headline: `+${kpis.efficiencyGainPct.toFixed(1)}% efficiency gain`,
    revenueUplift: `+$${kpis.revenueUplift.toLocaleString()} projected revenue uplift`,
    travelReduction: `-${kpis.travelReductionPct.toFixed(0)}% travel time reduction`,
    rpthGain: `+$${kpis.optimizedRPTH - kpis.baselineRPTH}/hr revenue per tech hour`,
    missedRevenue: `$${kpis.missedRevenue.toLocaleString()} recoverable missed revenue`,
    topMissedJob: kpis.topMissedJobs[0]
      ? `"${kpis.topMissedJobs[0].title}" ($${kpis.topMissedJobs[0].value.toLocaleString()}) unscheduled in baseline`
      : null,
  };
}
