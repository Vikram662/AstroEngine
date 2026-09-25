# Dashboard & Admin Panel — Static-to-Dynamic Fix Log

This documents a pass that went through the authenticated user dashboard
(`frontend/src/app/(dashboard)/**`) and admin panel
(`frontend/src/app/(admin)/**`) looking for UI that *looked* real but was
backed by hardcoded/fake data or dead buttons instead of the database or the
FastAPI backend. See the main [README.md](README.md) for overall project
status — this file is scoped to just this pass.

## What was found

An investigation across ~7,855 lines of dashboard/admin code found the
problem clustered into two patterns: **buttons/forms that looked functional
but silently did nothing**, and a few **frontend/schema field-name
mismatches** that left columns permanently blank or showing a fallback that
looked like real data.

## Fixed

1. **Admin health probes** (`(admin)/admin/page.tsx`, `AdminSidebar.tsx`,
   `api/admin/stats/route.ts`) — the FastAPI row always rendered `200 OK •
   Online` with no actual request made; the sidebar separately hardcoded
   `FastAPI C-Core: ONLINE`, `MySQL Database: CONNECTED`, and
   `Active Node: prod-mumbai-01` (a fictional node name — this app isn't
   multi-region). All three now reflect a real `fetch(.../health)` call and
   the real `NODE_ENV`/`ENVIRONMENT` value.

2. **API key dates** (`(dashboard)/api-keys/page.tsx`) — "Created on Sep 16,
   2026" and "Last used: Active now" were literal strings. `User.apiKeyCreatedAt`
   / `apiKeyLastUsedAt` were already returned by `/api/user/me` unfiltered;
   the page just never read them. Now wired, with a relative-time formatter
   for "last used".

3. **Razorpay checkout prefill** (`(dashboard)/billing/page.tsx`) — all three
   checkout flows (recharge, plan upgrade, add-on purchase) prefilled
   `name: "Developer"`, `email: "dev@client.com"` regardless of who was
   paying. Now uses the real user's name/email, already available from the
   page's own `/api/user/me` fetch.

4. **Admin audit log** (`(admin)/admin/audit-log/page.tsx`,
   `api/admin/data/route.ts`) — three separate issues: the acting admin was
   always written as the literal string `"admin_super"` instead of the real
   session's user id; the IP address was always the hardcoded literal
   `"127.0.0.1"` (the column didn't exist on the schema at all); and the
   frontend's `AuditEntry` interface used field names (`targetUserId`,
   `details`, `ipAddress`) that don't match the real `AuditLog` model
   (`targetType`/`targetId`/`metadata`), so two columns were permanently
   blank. Fixed by using the real admin session, adding a real
   `AuditLog.ipAddress` column captured from the request, resolving
   `targetId` to an email when the target is a `User`, and correcting the
   frontend's field mapping.

5. **PDF job retry** (`(admin)/admin/pdf-queue/page.tsx`,
   `api/admin/pdf-queue/retry/route.ts`) — "Retry" on a failed job ran
   `await new Promise(r => setTimeout(r, 1000))` and refetched — no backend
   call was ever made. The deeper problem: the original birth-data payload
   used to create a job was never persisted anywhere, so a real retry wasn't
   even possible. Added `PdfGenerationJob.requestPayload` (Json) to store it
   at creation time, extracted the report-dispatch logic shared with
   `api/pdf/queue/route.ts` into `lib/pdfEngine.ts`, and built a real retry
   route that resubmits the stored payload and updates the job in place.
   Jobs created before this change have no stored payload and are reported
   as non-retryable rather than silently failing.

6. **PDF report generation** (`(dashboard)/pdf-reports/page.tsx`) — the only
   button always POSTed the same literal sample birth data
   (`dob: "1995-10-05"`, etc.) — there was no way to generate a report for an
   actual person. Replaced with a real form (reusing the existing
   `BirthDataFields` component) covering report type, subject birth data,
   matchmaking's second person, Varshphal's target year, and language. Also
   added `PdfGenerationJob.subjectName` since the table rendered a `job.name`
   field that didn't exist on the schema at all (always blank).

7. **Branding logo upload** (`(dashboard)/branding/page.tsx`,
   `api/user/upload-logo/route.ts`) — the "Click to upload brand logo"
   dropzone was a plain `<div>` with no file input or handler. The admin side
   already had a complete Cloudflare R2 upload implementation
   (`api/admin/upload-logo/route.ts`); extracted its SigV4 signing logic into
   `lib/r2Upload.ts` and built a per-tenant equivalent. Also fixed
   `api/user/branding/route.ts`, which overwrote the entire
   `brandingConfig` JSON on every save (silently dropping a previously
   uploaded `logoUrl`) and masked every save error as a fake `"success"`
   response — both fixed.

8. **Astrological Interpretation Rules / prompts**
   (`(admin)/admin/prompts/page.tsx`, `api/admin/prompts/route.ts`) — "Add
   New Rule" and "Edit" had no `onClick` handlers at all. The
   `AstrologicalPrediction` model already existed and was already read via
   `/api/admin/data?type=prompts`, but no create/update/delete route existed
   anywhere. Built all three plus a create/edit modal and delete
   confirmation.

## Schema changes

```prisma
model AuditLog {
  ...
  ipAddress String? // request IP of the acting admin
}

model PdfGenerationJob {
  ...
  requestPayload Json?   // { birthData, branding, lang } — enables real retry
  subjectName    String? // display name of the person the report is for
}
```

Applied and verified against a local MySQL dev database with
`npx prisma db push` — not just added to the schema file.

## Verified live, not just type-checked

Logged in as a seeded `SUPER_ADMIN` against a local MySQL instance:
created a rule via the Prompt Rules modal and confirmed it appeared in both
the rules table and the audit log with the real admin email, real IP, and
real JSON metadata (previously would have shown blank/hardcoded values);
confirmed the API key page shows the real creation date; opened the PDF
report generation form and confirmed all fields render and gate the submit
button correctly.

## Deliberately not fixed in this pass

- **Admin billing table's fallback email** (`{tx.user?.email ||
  "dev@client.com"}`) — cosmetic fallback for a genuinely missing user
  relation, low value.
- **Team per-member cost/usage attribution** — the Team page's copy claims
  scoped API keys get separate cost attribution in Usage Telemetry, but
  `ApiRequestLog` has no `teamMemberId` column, so this is structurally
  impossible today. Fixing it needs a new column + relation, a migration,
  and updates to whatever logs usage against a scoped key
  (`api/internal/verify-key/route.ts`) — larger than a "wire it up" fix, left
  as a follow-up.
