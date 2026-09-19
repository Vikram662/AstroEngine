import { PrismaClient } from "@prisma/client";

export interface EmailOtpModel {
  id: string;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

export type AppPrismaClient = PrismaClient & {
  emailOtp: {
    findUnique(args: { where: { email: string } }): Promise<EmailOtpModel | null>;
    upsert(args: {
      where: { email: string };
      update: { otp: string; expiresAt: Date; createdAt?: Date };
      create: { email: string; otp: string; expiresAt: Date };
    }): Promise<EmailOtpModel>;
    delete(args: { where: { email: string } }): Promise<EmailOtpModel>;
  };
};

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

export const prisma: AppPrismaClient =
  globalForPrisma.prisma ??
  (new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }) as unknown as AppPrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
