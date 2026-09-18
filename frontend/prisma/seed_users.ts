import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding Admin and Developer User credentials...");

  // 1. Super Admin Account
  const adminEmail = "admin@astroengine.io";
  const adminPassword = "Admin@12345";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashPassword(adminPassword),
      role: "ADMIN",
      planTier: "ENTERPRISE",
      isBlocked: false,
    },
    create: {
      email: adminEmail,
      password: hashPassword(adminPassword),
      name: "Master Administrator",
      role: "ADMIN",
      apiKeyHash: crypto.randomBytes(32).toString("hex"),
      apiKeyPrefix: "ak_live_admin_root",
      walletBalance: 999999.0,
      planTier: "ENTERPRISE",
      monthlyQuota: 1000000,
      monthlyUsage: 0,
      isBlocked: false,
    },
  });
  console.log(`✓ Admin seeded successfully: ${admin.email}`);

  // 2. Demo Customer / Developer User Account
  const userEmail = "developer@astroengine.io";
  const userPassword = "User@12345";
  const devUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      password: hashPassword(userPassword),
      role: "USER",
      planTier: "STARTER",
      isBlocked: false,
    },
    create: {
      email: userEmail,
      password: hashPassword(userPassword),
      name: "Demo Developer",
      role: "USER",
      apiKeyHash: crypto.randomBytes(32).toString("hex"),
      apiKeyPrefix: "ak_live_demo_dev",
      walletBalance: 100.0,
      planTier: "STARTER",
      monthlyQuota: 35000,
      monthlyUsage: 0,
      isBlocked: false,
    },
  });
  console.log(`✓ Developer User seeded successfully: ${devUser.email}`);
  console.log("\nCredentials Ready!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
