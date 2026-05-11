import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = await requireBusinessId();
    const schedule = await prisma.schedule.findFirst({
      where: { id: params.id, businessId },
    });
    if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.schedule.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
