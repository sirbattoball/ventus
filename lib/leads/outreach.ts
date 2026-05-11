/**
 * Outreach Message Generator
 * Generates personalized cold outreach per HVAC lead
 * Based on outreachAngle, estimated tech count, and business profile
 */

import type { ScoredLead } from "./scorer";

type Channel = "email" | "sms" | "linkedin" | "facebook";

interface OutreachMessage {
  subject?: string;   // email only
  body: string;
  channel: Channel;
  estimatedReadTime: number; // seconds
  angle: string;
}

// ─── REVENUE ESTIMATES BY TECH COUNT ─────────────────────────────────────────
function estimateMonthlyLoss(techs: number): string {
  if (techs <= 4) return "$2,400–$4,800";
  if (techs <= 8) return "$4,800–$8,400";
  if (techs <= 15) return "$7,200–$14,000";
  return "$12,000–$28,000";
}

function estimateWeeklyUplift(techs: number): string {
  if (techs <= 4) return "$800–$1,600";
  if (techs <= 8) return "$1,600–$3,200";
  if (techs <= 15) return "$2,400–$5,200";
  return "$4,000–$8,000";
}

// ─── FIRST NAME EXTRACTOR ─────────────────────────────────────────────────────
function extractFirstName(businessName: string): string {
  if (!businessName) return "there";
  // Check for owner-named businesses: "Smith's HVAC", "Bob's Heating"
  const possessive = businessName.match(/^([A-Z][a-z]+)'s/);
  if (possessive) return possessive[1];
  const firstWord = businessName.split(/\s+/)[0];
  if (firstWord.length > 2 && firstWord.length < 12 && !/HVAC|Air|Heat|Cool|Climate|Comfort|Service|Pro|Elite|Premier|Metro|Southern|Southern/.test(firstWord)) {
    return firstWord;
  }
  return "there"; // fallback: "Hey there,"
}

// ─── MESSAGE TEMPLATES ────────────────────────────────────────────────────────
const TEMPLATES: Record<string, (lead: ScoredLead) => Record<Channel, Partial<OutreachMessage>>> = {

  fleet_scale: (lead) => ({
    email: {
      subject: `Quick question about your dispatch process — ${lead.name}`,
      body: `Hi ${extractFirstName(lead.name)},

I work with HVAC companies in your area and noticed ${lead.name} has built a solid reputation (${lead.reviewCount}+ reviews — that doesn't happen by accident).

Quick question: how are you currently sequencing jobs for your ${lead.estimatedTechs} technicians each day?

The reason I ask — we built a dispatch optimization system specifically for HVAC fleets. Most companies your size are losing ${estimateMonthlyLoss(lead.estimatedTechs)}/month in routing inefficiency without realizing it. We can model exactly what that looks like for your operation.

Takes about 10 minutes. No obligation — just want to show you the number.

Worth a quick look?

— [Your Name]
ventus.io
Ventus
[Your phone]`,
    },
    sms: {
      body: `Hi ${extractFirstName(lead.name)} — I help HVAC teams with ${lead.estimatedTechs}+ techs recover ${estimateWeeklyUplift(lead.estimatedTechs)}/week in dispatch inefficiency. 10-min demo, no commitment. Worth a look? — [Name]`,
    },
    linkedin: {
      body: `Hey ${extractFirstName(lead.name)},

Impressive review count on ${lead.name} — that's a well-run operation.

I work with HVAC businesses your size on dispatch optimization. Most companies with ${lead.estimatedTechs}+ techs are leaving ${estimateMonthlyLoss(lead.estimatedTechs)}/month on the table in routing gaps.

Would it be worth 10 minutes to see what that looks like for your specific setup?`,
    },
    facebook: {
      body: `Hey ${extractFirstName(lead.name)}! Love what you've built with ${lead.name}. Quick question — are you using any dispatch optimization software for your technicians? We help HVAC teams recover ${estimateWeeklyUplift(lead.estimatedTechs)}/week in lost revenue. Happy to show you a quick demo if it's relevant!`,
    },
  }),

  small_team_roi: (lead) => ({
    email: {
      subject: `How ${lead.name} could add ${estimateWeeklyUplift(lead.estimatedTechs)}/week`,
      body: `Hi ${extractFirstName(lead.name)},

With a small HVAC team, every technician hour counts. When you've only got ${lead.estimatedTechs} techs, one inefficient routing day can cost you $400–$800 in recoverable revenue.

We built a dispatch optimization system that takes your job list each morning and builds the highest-revenue schedule for each tech automatically.

Most teams our size see ${estimateWeeklyUplift(lead.estimatedTechs)} more per week from the same crew — no new hires.

Happy to show you a 5-minute demo with your own numbers?

— [Your Name]
ventus.io`,
    },
    sms: {
      body: `Hi ${extractFirstName(lead.name)} — we help small HVAC teams (${lead.estimatedTechs} techs) squeeze ${estimateWeeklyUplift(lead.estimatedTechs)}/week more revenue from existing crew. Quick demo? — [Name]`,
    },
    linkedin: {
      body: `Hi ${extractFirstName(lead.name)}, I help small HVAC teams get more revenue from their existing technicians through dispatch optimization. For a ${lead.estimatedTechs}-tech operation, that's typically ${estimateWeeklyUplift(lead.estimatedTechs)}/week. Worth a 10-minute look?`,
    },
    facebook: {
      body: `Hey ${extractFirstName(lead.name)}! Do you use any software to optimize your tech routing? Most ${lead.estimatedTechs}-tech HVAC teams recover ${estimateWeeklyUplift(lead.estimatedTechs)}/week just from smarter dispatch. Happy to show you how!`,
    },
  }),

  routing_waste: (lead) => ({
    email: {
      subject: `Routing inefficiency is costing ${lead.name} money — here's the math`,
      body: `Hi ${extractFirstName(lead.name)},

Most HVAC dispatch works like this: jobs get assigned in order they come in, techs drive across town, and idle gaps pile up between appointments.

For a ${lead.estimatedTechs}-tech team, that's roughly ${estimateMonthlyLoss(lead.estimatedTechs)}/month in lost revenue — not from lack of demand, but from how jobs get sequenced.

We built a system that fixes this automatically. Load your jobs in the morning, get a revenue-optimized schedule for each tech in seconds.

I can model the exact number for your operation in 10 minutes. Interested?

— [Your Name]
ventus.io`,
    },
    sms: {
      body: `Hi ${extractFirstName(lead.name)} — routing inefficiency costs ${lead.estimatedTechs}-tech HVAC teams ${estimateMonthlyLoss(lead.estimatedTechs)}/month. We fix it automatically. 10-min demo? — [Name]`,
    },
    linkedin: {
      body: `Hi ${extractFirstName(lead.name)}, curious — how does ${lead.name} currently handle dispatch sequencing for ${lead.estimatedTechs} technicians? Most teams lose significant revenue in routing gaps. We solve that automatically. Worth a quick look?`,
    },
    facebook: {
      body: `Hey ${extractFirstName(lead.name)}! Quick question for you — how do you currently route jobs for your technicians? We help HVAC teams like yours recover ${estimateWeeklyUplift(lead.estimatedTechs)}/week by optimizing the schedule automatically. Happy to show you!`,
    },
  }),

  growth_momentum: (lead) => ({
    email: {
      subject: `${lead.name}'s reviews suggest it's time to scale smart`,
      body: `Hi ${extractFirstName(lead.name)},

${lead.reviewCount}+ reviews and ${lead.rating != null ? `${lead.rating} stars` : "strong ratings"} — ${lead.name} is clearly doing the fundamentals right.

The next lever for companies at your stage is usually operational efficiency. Specifically: are your ${lead.estimatedTechs} technicians running at maximum revenue output each day, or are there hidden gaps in your dispatch?

We built a system that shows you exactly where the revenue is being left on the table — and eliminates it automatically.

Most teams at your growth stage recover ${estimateWeeklyUplift(lead.estimatedTechs)} more per week without changing headcount.

10 minutes to show you the model?

— [Your Name]
ventus.io`,
    },
    sms: {
      body: `Hi ${extractFirstName(lead.name)} — ${lead.name}'s ${lead.reviewCount} reviews tell me you're growing. Next lever is dispatch efficiency. We show ${lead.estimatedTechs}-tech teams their exact revenue gap. 10-min demo? — [Name]`,
    },
    linkedin: {
      body: `Hi ${extractFirstName(lead.name)}, ${lead.name}'s review count suggests strong growth. The next unlock for scaling HVAC businesses is usually dispatch optimization — we help teams your size capture ${estimateWeeklyUplift(lead.estimatedTechs)} more per week from existing crews. Worth a quick conversation?`,
    },
    facebook: {
      body: `Hey ${extractFirstName(lead.name)}! Love the growth at ${lead.name}! As you scale your team, dispatch optimization becomes a big revenue lever. We help ${lead.estimatedTechs}-tech teams recover ${estimateWeeklyUplift(lead.estimatedTechs)}/week automatically. Happy to show you!`,
    },
  }),
};

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────
export function generateOutreachMessage(
  lead: ScoredLead,
  channel: Channel = "email"
): OutreachMessage {
  const angle = lead.outreachAngle in TEMPLATES ? lead.outreachAngle : "routing_waste";
  const templates = TEMPLATES[angle](lead);
  const template = templates[channel] ?? templates.email ?? {};

  const body = template.body ?? "";

  return {
    subject: template.subject,
    body,
    channel,
    estimatedReadTime: Math.ceil(body.split(/\s+/).length / 200) * 60, // 200 wpm
    angle,
  };
}

// Generate all channel variants for a lead
export function generateAllMessages(lead: ScoredLead): Record<Channel, OutreachMessage> {
  const channels: Channel[] = ["email", "sms", "linkedin", "facebook"];
  return Object.fromEntries(
    channels.map((ch) => [ch, generateOutreachMessage(lead, ch)])
  ) as Record<Channel, OutreachMessage>;
}

// Batch generate for export (CSV-ready)
export function batchGenerateMessages(
  leads: ScoredLead[],
  channel: Channel = "email"
): Array<{ lead: ScoredLead; message: OutreachMessage }> {
  return leads.map((lead) => ({
    lead,
    message: generateOutreachMessage(lead, channel),
  }));
}
