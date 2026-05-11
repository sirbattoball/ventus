import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function getBusinessId(): Promise<string | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  // Demo mode: bypass DB lookup in development
  if (process.env.SEED_BUSINESS_ID && process.env.NODE_ENV === "development") {
    return process.env.SEED_BUSINESS_ID;
  }

  // Fast path: user already has a business
  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { businessId: true },
  });
  if (existing?.businessId) return existing.businessId;

  // Fetch real email from Clerk (required for unique constraint)
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `user_${userId}@ventus.app`;
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;

  // Create or find business for this user
  let businessId: string;

  if (orgId) {
    const business = await prisma.business.upsert({
      where: { clerkOrgId: orgId },
      update: {},
      create: { name: "My HVAC Business", clerkOrgId: orgId },
    });
    businessId = business.id;
  } else {
    const business = await prisma.business.create({
      data: { name: "My HVAC Business" },
    });
    businessId = business.id;
  }

  // Create user record — upsert by clerkId to be safe
  await prisma.user.upsert({
    where: { clerkId: userId },
    update: { businessId },
    create: { clerkId: userId, email, name, businessId },
  });

  return businessId;
}

export async function requireBusinessId(): Promise<string> {
  const id = await getBusinessId();
  if (!id) throw new Error("Unauthorized");
  return id;
}
