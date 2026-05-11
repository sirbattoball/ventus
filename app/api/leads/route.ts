import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessId } from "@/lib/auth";
import { fetchHVACLeads, generateMockLeads } from "@/lib/leads/scraper";
import { generateOutreachMessage } from "@/lib/leads/outreach";
import type { ScoredLead } from "@/lib/leads/scorer";

// ─── LIST LEADS ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireBusinessId(); // auth check
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const businessId = await requireBusinessId();
    const leads = await prisma.lead.findMany({
      where: {
        businessId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { leadScore: "desc" },
      take: limit,
    });

    // Filter by tier client-side (not stored in DB as string tier)
    return NextResponse.json(leads);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

// ─── SCRAPE + STORE LEADS ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireBusinessId();
    const body = await req.json();
    const { location, radius = 25, mock = false } = body;

    if (!location) {
      return NextResponse.json({ error: "location is required" }, { status: 400 });
    }

    let leads: ScoredLead[];
    if (mock || !process.env.GOOGLE_PLACES_API_KEY) {
      leads = generateMockLeads(location, 25);
    } else {
      leads = await fetchHVACLeads(location, radius, 40);
    }

    // Upsert leads into DB (de-duplicate by placeId)
    const stored = await Promise.all(
      leads.map(async (lead) => {
        const outreachMsg = generateOutreachMessage(lead, "email");
        return prisma.lead.upsert({
          where: { placeId: lead.placeId ?? `gen_${lead.name}_${lead.city}_${businessId}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 100) },
          update: {
            leadScore: lead.leadScore,
            estimatedTechs: lead.estimatedTechs,
            outreachAngle: lead.outreachAngle,
            outreachMessage: outreachMsg.body,
            rating: lead.rating,
            reviewCount: lead.reviewCount,
          },
          create: {
            businessId,
            businessName: lead.name,
            phone: lead.phone,
            website: lead.website,
            address: lead.address,
            city: lead.city,
            state: lead.state ?? "US",
            rating: lead.rating,
            reviewCount: lead.reviewCount,
            estimatedTechs: lead.estimatedTechs,
            leadScore: lead.leadScore,
            outreachAngle: lead.outreachAngle,
            outreachMessage: outreachMsg.body,
            placeId: lead.placeId ?? `gen_${lead.name}_${lead.city}_${businessId}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 100),
            status: "NEW",
          },
        });
      })
    );

    return NextResponse.json({
      scraped: leads.length,
      stored: stored.length,
      topLeads: stored.slice(0, 5),
    });
  } catch (e: any) {
    console.error("[LEADS SCRAPE ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
