import { PrismaClient, Priority, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_TECHNICIANS = [
  { name: "Marcus Reid", email: "marcus@demo.com", lat: 33.749, lng: -84.388, startTime: "08:00", endTime: "17:00" },
  { name: "Sarah Chen", email: "sarah@demo.com", lat: 33.762, lng: -84.402, startTime: "07:00", endTime: "16:00" },
  { name: "Devon Williams", email: "devon@demo.com", lat: 33.735, lng: -84.371, startTime: "08:00", endTime: "18:00" },
  { name: "Priya Patel", email: "priya@demo.com", lat: 33.778, lng: -84.415, startTime: "09:00", endTime: "18:00" },
  { name: "James Kowalski", email: "james@demo.com", lat: 33.721, lng: -84.395, startTime: "07:30", endTime: "16:30" },
];

const DEMO_JOBS = [
  { title: "AC Unit Replacement", customerName: "Northside Medical", lat: 33.801, lng: -84.379, value: 4200, durationMins: 240, priority: Priority.HIGH },
  { title: "Furnace Tune-Up", customerName: "Midtown Apartments", lat: 33.755, lng: -84.392, value: 340, durationMins: 60, priority: Priority.MEDIUM },
  { title: "Ductwork Inspection", customerName: "Buckhead Office Plaza", lat: 33.843, lng: -84.381, value: 620, durationMins: 90, priority: Priority.MEDIUM },
  { title: "Emergency Repair – No Heat", customerName: "Peachtree Residences", lat: 33.789, lng: -84.404, value: 890, durationMins: 120, priority: Priority.URGENT },
  { title: "HVAC System Install", customerName: "Grant Park Home", lat: 33.732, lng: -84.361, value: 6800, durationMins: 360, priority: Priority.HIGH },
  { title: "Filter Replacement + Service", customerName: "Ponce City Market", lat: 33.771, lng: -84.369, value: 280, durationMins: 45, priority: Priority.LOW },
  { title: "Compressor Replacement", customerName: "Lenox Square Retail", lat: 33.847, lng: -84.362, value: 1850, durationMins: 150, priority: Priority.HIGH },
  { title: "Cooling System Diagnostic", customerName: "Atlantic Station Office", lat: 33.792, lng: -84.401, value: 450, durationMins: 75, priority: Priority.MEDIUM },
  { title: "Heat Pump Installation", customerName: "Inman Park Residence", lat: 33.757, lng: -84.352, value: 5400, durationMins: 300, priority: Priority.HIGH },
  { title: "Thermostat Upgrade", customerName: "Old Fourth Ward Condo", lat: 33.762, lng: -84.374, value: 320, durationMins: 60, priority: Priority.LOW },
  { title: "Refrigerant Recharge", customerName: "Perkerson Apartments", lat: 33.704, lng: -84.408, value: 480, durationMins: 90, priority: Priority.MEDIUM },
  { title: "Annual Maintenance Plan", customerName: "Sandy Springs Estate", lat: 33.924, lng: -84.378, value: 760, durationMins: 120, priority: Priority.MEDIUM },
  { title: "Commercial Rooftop Unit", customerName: "Cumberland Mall", lat: 33.890, lng: -84.468, value: 3100, durationMins: 200, priority: Priority.HIGH },
  { title: "Drain Line Clearing", customerName: "Virginia-Highland Home", lat: 33.778, lng: -84.355, value: 220, durationMins: 45, priority: Priority.LOW },
  { title: "Zone Control System", customerName: "Druid Hills Residence", lat: 33.773, lng: -84.341, value: 2200, durationMins: 180, priority: Priority.MEDIUM },
  { title: "Blower Motor Replacement", customerName: "Brookhaven Office", lat: 33.858, lng: -84.337, value: 740, durationMins: 100, priority: Priority.HIGH },
  { title: "UV Air Purifier Install", customerName: "Decatur Medical Clinic", lat: 33.775, lng: -84.296, value: 1100, durationMins: 90, priority: Priority.MEDIUM },
  { title: "Emergency – Frozen Pipes", customerName: "Midtown High-Rise", lat: 33.784, lng: -84.382, value: 1650, durationMins: 135, priority: Priority.URGENT },
  { title: "Mini-Split Installation", customerName: "East Atlanta Bungalow", lat: 33.726, lng: -84.345, value: 2800, durationMins: 210, priority: Priority.HIGH },
  { title: "Preventive Inspection", customerName: "Westside Townhomes", lat: 33.755, lng: -84.432, value: 290, durationMins: 60, priority: Priority.LOW },
];

async function main() {
  console.log("🌱 Seeding demo business and data...");

  const business = await prisma.business.upsert({
    where: { clerkOrgId: "demo_org" },
    update: {},
    create: {
      name: "Atlanta Climate Solutions",
      clerkOrgId: "demo_org",
      plan: "STARTER",
    },
  });

  console.log(`✓ Business: ${business.name} (${business.id})`);

  // Clear existing demo data
  await prisma.assignment.deleteMany({ where: { schedule: { businessId: business.id } } });
  await prisma.schedule.deleteMany({ where: { businessId: business.id } });
  await prisma.job.deleteMany({ where: { businessId: business.id } });
  await prisma.technician.deleteMany({ where: { businessId: business.id } });

  // Seed technicians
  const technicians = await Promise.all(
    DEMO_TECHNICIANS.map((t) =>
      prisma.technician.create({
        data: { ...t, businessId: business.id, available: true },
      })
    )
  );
  console.log(`✓ Created ${technicians.length} technicians`);

  // Seed jobs
  const jobs = await Promise.all(
    DEMO_JOBS.map((j) =>
      prisma.job.create({
        data: {
          ...j,
          businessId: business.id,
          status: JobStatus.PENDING,
          address: `${j.customerName}, Atlanta, GA`,
        },
      })
    )
  );
  console.log(`✓ Created ${jobs.length} jobs`);
  console.log(`\n✅ Seed complete. Business ID: ${business.id}`);
  console.log(`   Add SEED_BUSINESS_ID=${business.id} to your .env.local to use demo mode`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
