import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = await requireBusinessId();
    const body = await req.json();
    const { status, notes, outreachMessage } = body;

    const updated = await prisma.lead.update({
      where: { id: params.id, businessId },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(outreachMessage !== undefined ? { outreachMessage } : {}),
        ...(status === "CONTACTED" ? { contactedAt: new Date() } : {}),
        ...(status === "REPLIED" ? { repliedAt: new Date() } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = await requireBusinessId();
    await prisma.lead.delete({ where: { id: params.id, businessId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
