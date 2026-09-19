import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings/public - Returns safe non-sensitive branding, company details and social media links
export async function GET() {
  try {
    const publicKeys = [
      "COMPANY_NAME",
      "COMPANY_LOGO_URL",
      "COMPANY_LEGAL_NAME",
      "COMPANY_TAGLINE",
      "COMPANY_PHONE",
      "COMPANY_EMAIL",
      "COMPANY_SUPPORT_EMAIL",
      "COMPANY_WEBSITE",
      "COMPANY_ADDRESS_LINE1",
      "COMPANY_CITY",
      "COMPANY_STATE",
      "COMPANY_PINCODE",
      "COMPANY_COUNTRY",
      "SOCIAL_TWITTER",
      "SOCIAL_LINKEDIN",
      "SOCIAL_YOUTUBE",
      "SOCIAL_GITHUB"
    ];

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: publicKeys }
      }
    });

    const data: Record<string, string> = {
      COMPANY_NAME: "AstroEngine Technologies Pvt. Ltd.",
      COMPANY_LOGO_URL: "",
      COMPANY_LEGAL_NAME: "AstroEngine Cloud Services",
      COMPANY_TAGLINE: "Enterprise Vedic & Western Astrology API Infrastructure",
      COMPANY_PHONE: "+91 22 4910 8800",
      COMPANY_EMAIL: "billing@astroengine.io",
      COMPANY_SUPPORT_EMAIL: "support@astroengine.io",
      COMPANY_WEBSITE: "https://astroengine.io",
      COMPANY_ADDRESS_LINE1: "Level 4, Tech Park, Bandra Kurla Complex",
      COMPANY_CITY: "Mumbai",
      COMPANY_STATE: "Maharashtra",
      COMPANY_PINCODE: "400051",
      COMPANY_COUNTRY: "India",
      SOCIAL_TWITTER: "https://x.com/astroengine",
      SOCIAL_LINKEDIN: "https://linkedin.com/company/astroengine",
      SOCIAL_YOUTUBE: "https://youtube.com/@astroengine",
      SOCIAL_GITHUB: "https://github.com/Vikram662/AstroEngine"
    };

    for (const s of settings) {
      if (s.value) {
        data[s.key] = s.value;
      }
    }

    return NextResponse.json({
      status: "success",
      data
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
