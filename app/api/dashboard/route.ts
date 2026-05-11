import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await requireBusinessId();

    const [technicians, jobs, schedules] = await Promise.all([
      prisma.technician.findMany({ where: { businessId, available: true } }),
      prisma.job.findMany({ where: { businessId } }),
      prisma.schedule.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
    ]);

    const lastSchedule = schedules[0] ?? null;

    // Use optimized revenue from last schedule as total — accurate regardless of job status
    const totalRevenue = lastSchedule?.optimizedRevenue
      ?? jobs.filter((j) => j.status === "ASSIGNED" || j.status === "COMPLETE" || j.status === "IN_PROGRESS")
             .reduce((s, j) => s + j.value, 0);

    // Missed revenue = pending job value (unscheduled capacity)
    const missedRevenue = lastSchedule?.missedRevenue
      ?? jobs.filter((j) => j.status === "PENDING").reduce((s, j) => s + j.value, 0);

    const efficiencyGain = lastSchedule?.efficiencyGain ?? 0;
    const revenuePerTech = technicians.length > 0 ? Math.round(totalRevenue / technicians.length) : 0;

    return NextResponse.json({
      totalRevenue,
      revenuePerTech,
      efficiencyGain,
      missedRevenue,
      technicianCount: technicians.length,
      jobCount: jobs.length,
      lastSchedule: lastSchedule
        ? {
            date: lastSchedule.date.toISOString(),
            efficiencyGainPct: lastSchedule.efficiencyGain ?? 0,
            revenueUplift: (lastSchedule.optimizedRevenue ?? 0) - (lastSchedule.baselineRevenue ?? 0),
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
