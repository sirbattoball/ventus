import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";
import { z } from "zod";

const JobSchema = z.object({
  title: z.string().min(1),
  customerName: z.string().min(1),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  value: z.number().min(0),
  durationMins: z.number().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function GET() {
  try {
    const businessId = await requireBusinessId();
    const jobs = await prisma.job.findMany({
      where: { businessId },
      orderBy: [{ priority: "desc" }, { value: "desc" }],
    });
    return NextResponse.json(jobs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = await requireBusinessId();
    const body = await req.json();
    const data = JobSchema.parse(body);

    const job = await prisma.job.create({
      data: { ...data, businessId, status: "PENDING" },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
