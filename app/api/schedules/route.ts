import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await requireBusinessId();
    const schedules = await prisma.schedule.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { assignments: true } } },
    });
    return NextResponse.json(schedules);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
