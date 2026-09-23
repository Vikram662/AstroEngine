import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/locale";
import { LocaleHtmlLangSync } from "@/components/seo/LocaleHtmlLangSync";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <>
      <LocaleHtmlLangSync locale={locale} />
      {children}
    </>
  );
}
