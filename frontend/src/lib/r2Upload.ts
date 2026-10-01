import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { decryptSetting } from "@/lib/secretBox";

// SVG is deliberately not allowed: it can carry script and the files are served
// from a public origin. Raster formats only, verified by magic bytes below.
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const LOGO_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp" };

/** Extension derived from the validated MIME type - never from the client filename. */
export function logoExtension(file: File): string {
  return LOGO_EXT[file.type] || "png";
}

function detectImageType(b: Buffer): string | null {
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export class LogoUploadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function validateLogoFile(file: File | null): asserts file is File {
  if (!file) throw new LogoUploadError("No logo file provided.", 400);
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new LogoUploadError("Invalid file type. Please upload a PNG, JPG, or WebP logo.", 400);
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new LogoUploadError("Logo file size must be less than 5MB.", 400);
  }
}

// Uploads a file to Cloudflare R2 via a signed S3 PUT (SigV4) and returns its
// public URL. objectKey should already include any desired path prefix, e.g.
// `branding/company_logo_${Date.now()}.png`.
export async function uploadFileToR2(file: File, objectKey: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const detected = detectImageType(buffer);
  const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!detected || detected !== declared) {
    throw new LogoUploadError("File content does not match a valid PNG, JPG, or WebP image.", 400);
  }
  if (!/^[a-zA-Z0-9_\-./]+$/.test(objectKey) || objectKey.includes("..")) {
    throw new LogoUploadError("Invalid storage key.", 400);
  }

  const r2Settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_DOMAIN"] }
    }
  });
  const r2Map: Record<string, string> = {};
  for (const s of r2Settings) r2Map[s.key] = decryptSetting(s.value);

  const accountId = r2Map["R2_ACCOUNT_ID"] || process.env.R2_ACCOUNT_ID;
  const accessKey = r2Map["R2_ACCESS_KEY_ID"] || process.env.R2_ACCESS_KEY_ID;
  const secretKey = r2Map["R2_SECRET_ACCESS_KEY"] || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = r2Map["R2_BUCKET_NAME"] || process.env.R2_BUCKET_NAME || "astroengine";
  const publicDomain = r2Map["R2_PUBLIC_DOMAIN"] || process.env.R2_PUBLIC_DOMAIN || "https://pub-a93bf4c11aaf4bac8b6134d08fde08f5.r2.dev";

  if (!accountId || !accessKey || !secretKey) {
    throw new LogoUploadError("Cloudflare R2 is not fully configured in Settings. Please set Account ID, Access Key, and Secret first.", 500);
  }

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucketName}/${objectKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const payloadHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const canonicalUri = `/${bucketName}/${objectKey}`;
  const canonicalHeaders = `content-type:${file.type}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash("sha256").update(canonicalRequest).digest("hex")}`;

  function sign(key: Buffer | string, msg: string) {
    return crypto.createHmac("sha256", key).update(msg).digest();
  }

  const kDate = sign("AWS4" + secretKey, dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  const kSigning = sign(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const r2Res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authHeader,
      "Content-Type": file.type
    },
    body: buffer
  });

  if (r2Res.status !== 200 && r2Res.status !== 201) {
    console.error(`[r2Upload] R2 upload failed (HTTP ${r2Res.status}):`, await r2Res.text());
    throw new LogoUploadError(`Cloudflare R2 upload failed (HTTP ${r2Res.status}).`, 502);
  }

  return `${publicDomain.replace(/\/$/, "")}/${objectKey}`;
}
