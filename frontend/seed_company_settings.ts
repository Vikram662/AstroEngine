import { prisma } from "./src/lib/prisma";

async function seedCompanySettings() {
  console.log("=" .repeat(70));
  console.log("SEEDING DYNAMIC COMPANY & SOCIAL MEDIA SETTINGS INTO MYSQL");
  console.log("=" .repeat(70));

  const standardCompanySettings = [
    { key: "COMPANY_NAME", value: "AstroEngine Technologies Pvt. Ltd.", category: "COMPANY", description: "Official Registered Company Display Name" },
    { key: "COMPANY_LOGO_URL", value: "", category: "COMPANY", description: "Company Brand Logo URL (PNG/SVG/WebP)" },
    { key: "COMPANY_LEGAL_NAME", value: "AstroEngine Cloud Services", category: "COMPANY", description: "Legal Trade / Operating Name for Invoices" },
    { key: "COMPANY_TAGLINE", value: "Enterprise Vedic & Western Astrology API Infrastructure", category: "COMPANY", description: "Company Tagline / Subtitle" },
    { key: "COMPANY_GSTIN", value: "27AABCA1234F1Z8", category: "COMPANY", description: "Company GSTIN Number for Invoices" },
    { key: "COMPANY_PAN", value: "AABCA1234F", category: "COMPANY", description: "Company PAN Number" },
    { key: "COMPANY_SAC_CODE", value: "998313", category: "COMPANY", description: "GST SAC / HSN Service Code" },
    { key: "COMPANY_ADDRESS_LINE1", value: "Level 4, Tech Park, Bandra Kurla Complex", category: "COMPANY", description: "Registered Office Address Line 1" },
    { key: "COMPANY_CITY", value: "Mumbai", category: "COMPANY", description: "City" },
    { key: "COMPANY_STATE", value: "Maharashtra", category: "COMPANY", description: "State" },
    { key: "COMPANY_STATE_CODE", value: "27", category: "COMPANY", description: "GST State Code (e.g. 27 for Maharashtra)" },
    { key: "COMPANY_PINCODE", value: "400051", category: "COMPANY", description: "Postal Pincode" },
    { key: "COMPANY_COUNTRY", value: "India", category: "COMPANY", description: "Country" },
    { key: "COMPANY_PHONE", value: "+91 22 4910 8800", category: "COMPANY", description: "Official Support & Billing Phone Number" },
    { key: "COMPANY_EMAIL", value: "billing@astroengine.io", category: "COMPANY", description: "Official Billing Email Address" },
    { key: "COMPANY_SUPPORT_EMAIL", value: "support@astroengine.io", category: "COMPANY", description: "Customer Support Email Address" },
    { key: "COMPANY_WEBSITE", value: "https://astroengine.io", category: "COMPANY", description: "Official Website URL" },
    { key: "SOCIAL_TWITTER", value: "https://x.com/astroengine", category: "SOCIAL", description: "Twitter / X Profile URL" },
    { key: "SOCIAL_LINKEDIN", value: "https://linkedin.com/company/astroengine", category: "SOCIAL", description: "LinkedIn Organization URL" },
    { key: "SOCIAL_YOUTUBE", value: "https://youtube.com/@astroengine", category: "SOCIAL", description: "YouTube Channel URL" },
    { key: "SOCIAL_GITHUB", value: "https://github.com/Vikram662/AstroEngine", category: "SOCIAL", description: "GitHub Repository URL" }
  ];

  for (const item of standardCompanySettings) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key: item.key }
    });
    if (!existing) {
      await prisma.systemSetting.create({ data: item });
      console.log(` [INSERTED] ${item.key}`);
    } else {
      console.log(` [EXISTS]   ${item.key} = ${existing.value}`);
    }
  }

  console.log("\nCompany & Social Media Settings successfully synchronized with MySQL!");
}

seedCompanySettings()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
