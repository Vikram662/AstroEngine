// Server Component. <script type="application/ld+json"> is documented as
// "Unsupported Metadata" by the Next.js metadata API — the docs say to render it
// directly in the layout/page instead, which is what this does.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
