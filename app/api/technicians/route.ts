import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";
import { z } from "zod";

const TechSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  startTime: z.string().default("08:00"),
  endTime: z.string().default("17:00"),
});

export async function GET() {
  try {
    const businessId = await requireBusinessId();
    const technicians = await prisma.technician.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(technicians);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = await requireBusinessId();
    const body = await req.json();
    const data = TechSchema.parse(body);

    const tech = await prisma.technician.create({
      data: { ...data, businessId },
    });
    return NextResponse.json(tech, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
