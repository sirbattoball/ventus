# Ventus

> Dispatch optimization engine for HVAC companies. Maximize revenue per technician-day, eliminate idle time, surface missed revenue.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Clerk Auth

---

## What It Does

The core dispatch engine uses a **greedy optimization algorithm** that:

1. Scores every job for every technician: `(job_value / (travel_time + job_duration)) × priority_weight`
2. Assigns the highest-scoring job to each available technician
3. Repeats until all technicians are fully scheduled or no jobs remain
4. Compares the optimized schedule vs. naive round-robin baseline
5. Reports: efficiency gain %, revenue uplift $, missed revenue estimate

**Typical results on demo data (5 techs, 20 jobs): +14–22% efficiency gain**

---

## Local Setup (5 minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud — see options below)

### Step 1: Clone & Install

```bash
git clone <your-repo>
cd ventus
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://..."          # Your PostgreSQL URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."  # From Clerk dashboard
CLERK_SECRET_KEY="..."                   # From Clerk dashboard
```

### Step 3: Set Up Database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# (Optional) Seed demo data
npm run db:seed
```

### Step 4: Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Database Options (Free Tiers)

| Provider | Free Tier | Connection String Format |
|---|---|---|
| **Neon** (recommended) | 0.5 GB | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` |
| **Supabase** | 500 MB | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| **Railway** | $5 credit | `postgresql://postgres:pass@monorail.proxy.rlwy.net:PORT/railway` |

---

## Clerk Auth Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Enable **Email** sign-in method
4. Copy **Publishable Key** and **Secret Key** to `.env.local`
5. Set allowed redirect URLs: `http://localhost:3000`

---

## Deploy to Vercel

### One-Click Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI:
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
```

### In Vercel Dashboard
1. Import GitHub repo
2. Add Environment Variables (copy from `.env.local`)
3. Build command: `prisma generate && next build`
4. Deploy

### Post-Deploy
```bash
# Run migrations against production DB
DATABASE_URL="your-prod-url" npx prisma db push
```

---

## Demo Mode

Load 5 technicians + 20 jobs instantly from the Dispatch Engine page:

1. Navigate to **Dispatch Engine**
2. Click **"Load Demo Data"**
3. Click **"Run Optimization"**
4. See the +12–22% efficiency gain simulation

---

## File Structure

```
ventus/
├── app/
│   ├── (auth)/                    # Sign in / Sign up pages
│   ├── (dashboard)/               # Protected dashboard routes
│   │   ├── layout.tsx             # Sidebar navigation
│   │   ├── dashboard/page.tsx     # KPI overview
│   │   ├── dispatch/page.tsx      # 🔥 Core product feature
│   │   ├── technicians/page.tsx   # Tech management + CSV
│   │   ├── jobs/page.tsx          # Job management + CSV
│   │   └── schedules/page.tsx     # History
│   ├── api/
│   │   ├── dashboard/route.ts     # KPI aggregation
│   │   ├── dispatch/route.ts      # 🔥 Optimization engine endpoint
│   │   ├── technicians/           # CRUD
│   │   ├── jobs/                  # CRUD
│   │   ├── schedules/             # Read + delete
│   │   └── seed/route.ts          # Demo data loader
│   ├── globals.css                # Design tokens (dark mode, amber accent)
│   ├── layout.tsx                 # Root layout + Clerk
│   └── page.tsx                   # Landing / marketing page
├── lib/
│   ├── dispatch-engine.ts         # 🔥 Greedy optimization algorithm
│   ├── auth.ts                    # Business context from Clerk
│   ├── db.ts                      # Prisma singleton
│   └── utils.ts                   # Formatters, color helpers
├── prisma/
│   ├── schema.prisma              # DB schema
│   └── seed.ts                    # Demo data seed script
├── .env.example                   # Environment template
├── vercel.json                    # Vercel config
└── README.md
```

---

## Adding Stripe Billing

The app is structured for easy Stripe integration:

```typescript
// Future: app/api/billing/checkout/route.ts
const PLANS = {
  STARTER: {
    price: 199,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: ["5 technicians", "Unlimited jobs", "Full optimization"],
  },
  GROWTH: {
    price: 399,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    features: ["Unlimited technicians", "CSV imports", "Priority support"],
  },
};
```

Gate features by checking `business.plan` in your API routes:

```typescript
const business = await prisma.business.findUnique({ where: { id: businessId } });
if (business?.plan === "STARTER" && techCount > 5) {
  return NextResponse.json({ error: "Upgrade to Growth for unlimited technicians" }, { status: 403 });
}
```

---

## Optimization Algorithm Details

**Scoring function:**
```
score(job, tech) = (job.value / (travel_minutes + job.duration_minutes)) × priority_weight
```

**Priority weights:**
- `URGENT` → 2.0×
- `HIGH` → 1.5×
- `MEDIUM` → 1.0×
- `LOW` → 0.7×

**Distance calculation:** Haversine formula → converted to travel time at 25 mph avg city speed

**Complexity:** O(J × T) per iteration, O(J² × T) total — fast enough for up to 200 jobs / 50 technicians without optimization

---

## CSV Import Formats

### Technicians CSV
```csv
name,email,phone,lat,lng,startTime,endTime
Marcus Reid,marcus@co.com,(404)555-0100,33.749,-84.388,08:00,17:00
```

### Jobs CSV
```csv
title,customerName,address,lat,lng,value,durationMins,priority
AC Replacement,Smith Residence,123 Oak St,33.762,-84.402,2400,180,HIGH
```

---

## License

MIT — Use it, sell it, modify it.
