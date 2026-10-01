import { PrismaClient } from "@prisma/client";
import { apiKeyFromEnvOrNew, hashPassword, passwordFromEnvOrRandom, refuseInProduction } from "./seed-helpers.mts";

const prisma = new PrismaClient();

async function main() {
  refuseInProduction("prisma/seed_users.mts");

  console.log("Seeding Admin and Developer User credentials...");

  // 1. Super Admin Account (do NOT overwrite existing password on update)
  const adminEmail = "admin@astroengine.io";
  const adminPassword = passwordFromEnvOrRandom(process.env.SEED_ADMIN_PASSWORD);
  const adminKey = apiKeyFromEnvOrNew(process.env.ASTRO_MASTER_API_KEY);
  const adminExisted = Boolean(await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } }));
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      planTier: "ENTERPRISE",
      isBlocked: false,
    },
    create: {
      email: adminEmail,
      emailVerified: true,
      password: hashPassword(adminPassword.value),
      name: "Master Administrator",
      role: "ADMIN",
      apiKeyHash: adminKey.keyHash,
      apiKeyPrefix: adminKey.keyPrefix,
      walletBalance: 999999.0,
      planTier: "ENTERPRISE",
      monthlyQuota: 1000000,
      monthlyUsage: 0,
      isBlocked: false,
    },
  });
  console.log(`✓ Admin seeded successfully: ${admin.email}`);

  // 2. Demo Customer / Developer User Account (do NOT overwrite existing password on update)
  const userEmail = "developer@astroengine.io";
  const userPassword = passwordFromEnvOrRandom(process.env.SEED_DEV_PASSWORD);
  const devKey = apiKeyFromEnvOrNew();
  const devExisted = Boolean(await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } }));
  const devUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      role: "USER",
      planTier: "STARTER",
      isBlocked: false,
    },
    create: {
      email: userEmail,
      emailVerified: true,
      password: hashPassword(userPassword.value),
      name: "Demo Developer",
      role: "USER",
      apiKeyHash: devKey.keyHash,
      apiKeyPrefix: devKey.keyPrefix,
      walletBalance: 100.0,
      planTier: "STARTER",
      monthlyQuota: 35000,
      monthlyUsage: 0,
      isBlocked: false,
    },
  });
  console.log(`✓ Developer User seeded successfully: ${devUser.email}`);
  console.log("\nCredentials (shown once; existing accounts are never modified):");
  if (!adminExisted) {
    console.log(`  ${adminEmail}  password: ${adminPassword.generated ? adminPassword.value : "(from SEED_ADMIN_PASSWORD)"}`);
    console.log(`  admin API key: ${adminKey.rawKey}`);
  }
  if (!devExisted) {
    console.log(`  ${userEmail}  password: ${userPassword.generated ? userPassword.value : "(from SEED_DEV_PASSWORD)"}`);
    console.log(`  developer API key: ${devKey.rawKey}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
