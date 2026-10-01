// One-off migration: encrypts existing plaintext secrets in SystemSetting.
// Usage: SETTINGS_ENCRYPTION_KEY=... npm run encrypt-settings
import { PrismaClient } from "@prisma/client";
import { ENCRYPTED_SETTING_KEYS, encryptSetting, isEncrypted } from "../src/lib/secretBox.ts";

if (!process.env.SETTINGS_ENCRYPTION_KEY) {
  console.error("Set SETTINGS_ENCRYPTION_KEY first.");
  process.exit(1);
}

const prisma = new PrismaClient();
let done = 0;
for (const key of ENCRYPTED_SETTING_KEYS) {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row || !row.value || isEncrypted(row.value)) continue;
  await prisma.systemSetting.update({ where: { key }, data: { value: encryptSetting(row.value) } });
  console.log(`encrypted ${key}`);
  done++;
}
console.log(done ? `Done: ${done} setting(s) encrypted.` : "Nothing to encrypt.");
await prisma.$disconnect();
