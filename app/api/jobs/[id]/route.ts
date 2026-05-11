import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = await requireBusinessId();
    const body = await req.json();
    const job = await prisma.job.findFirst({ where: { id: params.id, businessId } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.job.update({ where: { id: params.id }, data: body });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = await requireBusinessId();
    const job = await prisma.job.findFirst({ where: { id: params.id, businessId } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
