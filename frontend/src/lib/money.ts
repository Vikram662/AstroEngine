import { Prisma } from "@prisma/client";

type MoneyInput = Prisma.Decimal | number | string | null | undefined;

/**
 * Converts a Prisma Decimal (or number/string) field to a plain JS number.
 * Prisma Decimal fields deserialize as Decimal.js instances, not numbers — using
 * them directly in `===`, arithmetic, or JSON responses produces wrong results
 * (e.g. `decimal === 0` is always false; JSON.stringify emits a string, not a number).
 * Call this immediately after reading any Decimal field from Prisma.
 */
export function toMoney(value: MoneyInput): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Rounds to 2 decimal places (paise), never negative. */
export function roundMoney(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

/** Multiplies a money amount by a factor using exact decimal arithmetic, rounded to 2dp. */
export function scaleMoney(amount: MoneyInput, factor: number | string): number {
  return new Prisma.Decimal(amount ?? 0).times(factor).toDecimalPlaces(2).toNumber();
}

/** Adds two money amounts using exact decimal arithmetic, rounded to 2dp. */
export function addMoney(a: MoneyInput, b: MoneyInput): number {
  return new Prisma.Decimal(a ?? 0).plus(new Prisma.Decimal(b ?? 0)).toDecimalPlaces(2).toNumber();
}

/** Splits a tax-inclusive gross amount into { taxable, tax } at the given rate (e.g. 0.18 for 18% GST), rounded to 2dp. */
export function splitInclusiveTax(gross: MoneyInput, rate: number): { taxable: number; tax: number } {
  const grossDecimal = new Prisma.Decimal(gross ?? 0);
  const taxable = grossDecimal.dividedBy(1 + rate).toDecimalPlaces(2);
  const tax = grossDecimal.minus(taxable).toDecimalPlaces(2);
  return { taxable: taxable.toNumber(), tax: tax.toNumber() };
}

/**
 * Recursively converts any Prisma.Decimal instances (and BigInts) in a value to
 * plain JSON-safe types, so NextResponse.json() never silently turns a money
 * field into a decimal-string or a BigInt into an unserializable value.
 * Use as a final safety net when returning raw Prisma records/arrays.
 */
export function toJsonSafe<T>(value: T): T {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as unknown as T;
  }
  if (typeof value === "bigint") {
    return value.toString() as unknown as T;
  }
  if (value instanceof Date) {
    return value as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => toJsonSafe(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toJsonSafe(v);
    }
    return out as T;
  }
  return value;
}
