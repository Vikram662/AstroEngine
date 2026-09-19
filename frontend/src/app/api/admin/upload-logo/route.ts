import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin required." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ status: "error", message: "No logo file provided." }, { status: 400 });
    }

    // Allowed image formats
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        status: "error",
        message: "Invalid file type. Please upload a PNG, JPG, WebP, or SVG logo."
      }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        status: "error",
        message: "Logo file size must be less than 5MB."
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Fetch R2 settings from MySQL
    const r2Settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_DOMAIN"]
        }
      }
    });

    const r2Map: Record<string, string> = {};
    for (const s of r2Settings) {
      r2Map[s.key] = s.value;
    }

    const accountId = r2Map["R2_ACCOUNT_ID"] || process.env.R2_ACCOUNT_ID;
    const accessKey = r2Map["R2_ACCESS_KEY_ID"] || process.env.R2_ACCESS_KEY_ID;
    const secretKey = r2Map["R2_SECRET_ACCESS_KEY"] || process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = r2Map["R2_BUCKET_NAME"] || process.env.R2_BUCKET_NAME || "astroengine";
    const publicDomain = r2Map["R2_PUBLIC_DOMAIN"] || process.env.R2_PUBLIC_DOMAIN || "https://pub-a93bf4c11aaf4bac8b6134d08fde08f5.r2.dev";

    if (!accountId || !accessKey || !secretKey) {
      return NextResponse.json({
        status: "error",
        message: "Cloudflare R2 is not fully configured in Settings. Please set Account ID, Access Key, and Secret first."
      }, { status: 500 });
    }

    const ext = file.name.split(".").pop() || "png";
    const objectKey = `branding/company_logo_${Date.now()}.${ext}`;
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${bucketName}/${objectKey}`;

    // SigV4 Signing logic for S3 PUT Object
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
      const errBody = await r2Res.text();
      return NextResponse.json({
        status: "error",
        message: `Cloudflare R2 Upload failed (HTTP ${r2Res.status}): ${errBody}`
      }, { status: 502 });
    }

    // Public URL
    const publicUrl = `${publicDomain.replace(/\/$/, "")}/${objectKey}`;

    // Auto-save to MySQL SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: "COMPANY_LOGO_URL" },
      update: { value: publicUrl },
      create: {
        key: "COMPANY_LOGO_URL",
        value: publicUrl,
        category: "COMPANY",
        description: "Company Brand Logo URL (PNG/SVG/WebP)"
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Logo uploaded directly to Cloudflare R2 and saved!",
      logoUrl: publicUrl
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
