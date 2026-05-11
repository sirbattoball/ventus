import { NextRequest, NextResponse } from "next/server";
import { requireBusinessId } from "@/lib/auth";
import { generateOutreachMessage, generateAllMessages } from "@/lib/leads/outreach";
import { scoreLead } from "@/lib/leads/scorer";
import type { RawLead, ScoredLead } from "@/lib/leads/scorer";

/**
 * Normalize a DB lead (has `businessName`) into a ScoredLead (uses `name`).
 * This bridges the gap between the Prisma Lead model and scraper ScoredLead type.
 */
function normalizeLead(lead: any): ScoredLead {
  // Already a ScoredLead
  if (typeof lead.name === "string" && typeof lead.leadScore === "number") {
    return lead as ScoredLead;
  }

  const raw: RawLead = {
    name: lead.businessName ?? lead.name ?? "Unknown",
    phone: lead.phone ?? undefined,
    website: lead.website ?? undefined,
    address: lead.address ?? undefined,
    city: lead.city ?? "",
    state: lead.state ?? "US",
    rating: lead.rating ?? undefined,
    reviewCount: lead.reviewCount ?? 0,
    placeId: lead.placeId ?? undefined,
  };

  if (typeof lead.leadScore === "number") {
    return {
      ...raw,
      estimatedTechs: lead.estimatedTechs ?? 5,
      leadScore: lead.leadScore,
      outreachAngle: lead.outreachAngle ?? "routing_waste",
      isChain: false,
      priorityTier: lead.leadScore >= 75 ? "A" : lead.leadScore >= 50 ? "B" : "C",
    };
  }

  return scoreLead(raw);
}

type Channel = "email" | "sms" | "linkedin" | "facebook";
const VALID_CHANNELS: Channel[] = ["email", "sms", "linkedin", "facebook"];

export async function POST(req: NextRequest) {
  try {
    await requireBusinessId();
    const body = await req.json();
    const { lead, channel, allChannels = false } = body;

    if (!lead) {
      return NextResponse.json({ error: "lead is required" }, { status: 400 });
    }

    const scored = normalizeLead(lead);
    const ch: Channel = VALID_CHANNELS.includes(channel) ? channel : "email";

    if (allChannels) {
      return NextResponse.json(generateAllMessages(scored));
    }

    return NextResponse.json(generateOutreachMessage(scored, ch));
  } catch (e: any) {
    console.error("[OUTREACH ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
