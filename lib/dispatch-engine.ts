/**
 * Ventus Optimization Engine
 * Greedy scheduling algorithm maximizing revenue per unit time
 * while minimizing travel distance
 */

export interface TechnicianInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  startTime: string; // "HH:MM"
  endTime: string;
}

export interface JobInput {
  id: string;
  title: string;
  lat: number;
  lng: number;
  value: number;
  durationMins: number;
  priority: string;
}

export interface AssignmentResult {
  technicianId: string;
  technicianName: string;
  jobId: string;
  jobTitle: string;
  sequence: number;
  travelMins: number;
  startTime: string;
  endTime: string;
  revenue: number;
  score: number;
}

export interface ScheduleResult {
  assignments: AssignmentResult[];
  totalRevenue: number;
  totalJobs: number;
  avgEfficiencyScore: number;
  unassignedJobs: string[];
}

export interface OptimizationResult {
  baseline: ScheduleResult;
  optimized: ScheduleResult;
  efficiencyGainPct: number;
  revenueUplift: number;
  missedRevenue: number;
  summary: OptimizationSummary;
}

export interface OptimizationSummary {
  technicianCount: number;
  jobCount: number;
  assignedJobs: number;
  totalPossibleRevenue: number;
  baselineRevenue: number;
  optimizedRevenue: number;
  efficiencyGainPct: number;
  revenueUplift: number;
  missedRevenue: number;
  avgRevenuePerTech: number;
}

// Haversine distance in miles
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Assume 25 mph average in-city travel
function travelMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.ceil((distanceMiles(lat1, lng1, lat2, lng2) / 25) * 60);
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(timeStr: string, mins: number): string {
  const total = parseTime(timeStr) + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Priority multiplier for job scoring
const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 2.0,
  HIGH: 1.5,
  MEDIUM: 1.0,
  LOW: 0.7,
};

// Revenue efficiency score: value per minute of total time (travel + work)
function jobScore(job: JobInput, travelMins: number): number {
  const priority = PRIORITY_WEIGHT[job.priority] ?? 1.0;
  const totalTime = travelMins + job.durationMins;
  return (job.value / totalTime) * priority;
}

interface TechState {
  id: string;
  name: string;
  currentLat: number;
  currentLng: number;
  currentTime: number; // minutes from midnight
  endTime: number;
  assignments: AssignmentResult[];
  sequence: number;
}

function buildSchedule(
  technicians: TechnicianInput[],
  jobs: JobInput[],
  optimized: boolean
): ScheduleResult {
  const techStates: TechState[] = technicians.map((t) => ({
    id: t.id,
    name: t.name,
    currentLat: t.lat,
    currentLng: t.lng,
    currentTime: parseTime(t.startTime),
    endTime: parseTime(t.endTime),
    assignments: [],
    sequence: 0,
  }));

  const unassigned: JobInput[] = [...jobs];
  const assigned: JobInput[] = [];
  const allAssignments: AssignmentResult[] = [];

  if (!optimized) {
    // Baseline: round-robin assignment, no optimization
    let techIdx = 0;
    for (const job of unassigned) {
      const tech = techStates[techIdx % techStates.length];
      const travel = travelMinutes(tech.currentLat, tech.currentLng, job.lat, job.lng);
      const startMin = tech.currentTime + travel;
      const endMin = startMin + job.durationMins;

      if (endMin <= tech.endTime) {
        const startStr = addMinutes("00:00", startMin);
        const endStr = addMinutes("00:00", endMin);
        const score = jobScore(job, travel);

        const assignment: AssignmentResult = {
          technicianId: tech.id,
          technicianName: tech.name,
          jobId: job.id,
          jobTitle: job.title,
          sequence: tech.sequence + 1,
          travelMins: travel,
          startTime: startStr,
          endTime: endStr,
          revenue: job.value,
          score,
        };

        tech.assignments.push(assignment);
        allAssignments.push(assignment);
        tech.currentLat = job.lat;
        tech.currentLng = job.lng;
        tech.currentTime = endMin;
        tech.sequence++;
        assigned.push(job);
      }
      techIdx++;
    }
  } else {
    // Optimized: greedy - always pick highest score job for each available technician
    const remainingJobs = [...unassigned];

    let iterations = 0;
    const maxIterations = jobs.length * technicians.length * 2;

    while (remainingJobs.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find the tech with earliest available time
      const availableTechs = techStates.filter((t) => t.currentTime < t.endTime);
      if (availableTechs.length === 0) break;

      let bestScore = -Infinity;
      let bestTech: TechState | null = null;
      let bestJob: JobInput | null = null;
      let bestTravel = 0;
      let bestJobIdx = -1;

      for (const tech of availableTechs) {
        for (let j = 0; j < remainingJobs.length; j++) {
          const job = remainingJobs[j];
          const travel = travelMinutes(tech.currentLat, tech.currentLng, job.lat, job.lng);
          const startMin = tech.currentTime + travel;
          const endMin = startMin + job.durationMins;

          if (endMin > tech.endTime) continue;

          const score = jobScore(job, travel);

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

      const startMin = bestTech.currentTime + bestTravel;
      const endMin = startMin + bestJob.durationMins;
      const startStr = addMinutes("00:00", startMin);
      const endStr = addMinutes("00:00", endMin);

      const assignment: AssignmentResult = {
        technicianId: bestTech.id,
        technicianName: bestTech.name,
        jobId: bestJob.id,
        jobTitle: bestJob.title,
        sequence: bestTech.sequence + 1,
        travelMins: bestTravel,
        startTime: startStr,
        endTime: endStr,
        revenue: bestJob.value,
        score: bestScore,
      };

      bestTech.assignments.push(assignment);
      allAssignments.push(assignment);
      bestTech.currentLat = bestJob.lat;
      bestTech.currentLng = bestJob.lng;
      bestTech.currentTime = endMin;
      bestTech.sequence++;

      remainingJobs.splice(bestJobIdx, 1);
    }

    // Track unassigned
    for (const job of remainingJobs) {
      if (!allAssignments.find((a) => a.jobId === job.id)) {
        unassigned.push(job);
      }
    }
  }

  const totalRevenue = allAssignments.reduce((sum, a) => sum + a.revenue, 0);
  const avgScore =
    allAssignments.length > 0
      ? allAssignments.reduce((sum, a) => sum + a.score, 0) / allAssignments.length
      : 0;

  const assignedIds = new Set(allAssignments.map((a) => a.jobId));
  const unassignedIds = jobs.filter((j) => !assignedIds.has(j.id)).map((j) => j.id);

  return {
    assignments: allAssignments,
    totalRevenue,
    totalJobs: allAssignments.length,
    avgEfficiencyScore: avgScore,
    unassignedJobs: unassignedIds,
  };
}

export function optimize(
  technicians: TechnicianInput[],
  jobs: JobInput[]
): OptimizationResult {
  if (technicians.length === 0 || jobs.length === 0) {
    const empty: ScheduleResult = {
      assignments: [],
      totalRevenue: 0,
      totalJobs: 0,
      avgEfficiencyScore: 0,
      unassignedJobs: jobs.map((j) => j.id),
    };
    return {
      baseline: empty,
      optimized: empty,
      efficiencyGainPct: 0,
      revenueUplift: 0,
      missedRevenue: 0,
      summary: {
        technicianCount: 0,
        jobCount: 0,
        assignedJobs: 0,
        totalPossibleRevenue: 0,
        baselineRevenue: 0,
        optimizedRevenue: 0,
        efficiencyGainPct: 0,
        revenueUplift: 0,
        missedRevenue: 0,
        avgRevenuePerTech: 0,
      },
    };
  }

  const baseline = buildSchedule(technicians, jobs, false);
  const optimized = buildSchedule(technicians, jobs, true);

  const totalPossibleRevenue = jobs.reduce((s, j) => s + j.value, 0);
  const missedRevenue = totalPossibleRevenue - optimized.totalRevenue;

  const efficiencyGainPct =
    baseline.totalRevenue > 0
      ? ((optimized.totalRevenue - baseline.totalRevenue) / baseline.totalRevenue) * 100
      : 0;

  const revenueUplift = optimized.totalRevenue - baseline.totalRevenue;

  const summary: OptimizationSummary = {
    technicianCount: technicians.length,
    jobCount: jobs.length,
    assignedJobs: optimized.assignments.length,
    totalPossibleRevenue,
    baselineRevenue: baseline.totalRevenue,
    optimizedRevenue: optimized.totalRevenue,
    efficiencyGainPct: Math.round(efficiencyGainPct * 10) / 10,
    revenueUplift: Math.round(revenueUplift),
    missedRevenue: Math.round(missedRevenue),
    avgRevenuePerTech:
      technicians.length > 0
        ? Math.round(optimized.totalRevenue / technicians.length)
        : 0,
  };

  return { baseline, optimized, efficiencyGainPct, revenueUplift, missedRevenue, summary };
}
