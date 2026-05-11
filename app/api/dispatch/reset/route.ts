import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

/**
 * POST /api/dispatch/reset
 * Resets all ASSIGNED jobs back to PENDING so the optimizer can re-run.
 * Also deletes today's schedule entries to allow a fresh run.
 */
export async function POST() {
  try {
    const businessId = await requireBusinessId();

    // Reset job statuses
    const resetResult = await prisma.job.updateMany({
      where: { businessId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      data: { status: "PENDING" },
    });

    // Delete today's schedules so we get fresh results
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedulesToDelete = await prisma.schedule.findMany({
      where: { businessId, date: { gte: today } },
      select: { id: true },
    });

    if (schedulesToDelete.length > 0) {
      await prisma.assignment.deleteMany({
        where: { scheduleId: { in: schedulesToDelete.map((s) => s.id) } },
      });
      await prisma.schedule.deleteMany({
        where: { id: { in: schedulesToDelete.map((s) => s.id) } },
      });
    }

    return NextResponse.json({
      success: true,
      jobsReset: resetResult.count,
      schedulesCleared: schedulesToDelete.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
