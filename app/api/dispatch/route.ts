import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";
import { optimize } from "@/lib/dispatch-engine";

export async function POST() {
  try {
    const businessId = await requireBusinessId();

    // Fetch available technicians and pending jobs
    const [technicians, jobs] = await Promise.all([
      prisma.technician.findMany({
        where: { businessId, available: true },
      }),
      prisma.job.findMany({
        where: { businessId, status: "PENDING" },
      }),
    ]);

    if (technicians.length === 0) {
      return NextResponse.json({ error: "No available technicians. Add technicians first." }, { status: 400 });
    }
    if (jobs.length === 0) {
      return NextResponse.json({ error: "No pending jobs. Add jobs first." }, { status: 400 });
    }

    // Run optimization engine
    const result = optimize(
      technicians.map((t) => ({
        id: t.id,
        name: t.name,
        lat: t.lat,
        lng: t.lng,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
      jobs.map((j) => ({
        id: j.id,
        title: j.title,
        lat: j.lat,
        lng: j.lng,
        value: j.value,
        durationMins: j.durationMins,
        priority: j.priority,
      }))
    );

    // Persist schedule to database
    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(),
        businessId,
        baselineRevenue: result.baseline.totalRevenue,
        optimizedRevenue: result.optimized.totalRevenue,
        efficiencyGain: result.summary.efficiencyGainPct,
        missedRevenue: result.summary.missedRevenue,
        assignments: {
          create: result.optimized.assignments.map((a) => ({
            technicianId: a.technicianId,
            jobId: a.jobId,
            sequence: a.sequence,
            travelMins: a.travelMins,
            startTime: a.startTime,
            endTime: a.endTime,
            isOptimized: true,
          })),
        },
      },
    });

    // Update assigned job statuses
    if (result.optimized.assignments.length > 0) {
      await prisma.job.updateMany({
        where: { id: { in: result.optimized.assignments.map((a) => a.jobId) } },
        data: { status: "ASSIGNED" },
      });
    }

    return NextResponse.json({
      ...result,
      scheduleId: schedule.id,
    });
  } catch (e: any) {
    console.error("[DISPATCH ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
