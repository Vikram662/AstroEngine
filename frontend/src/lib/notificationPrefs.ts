// The notification events and the user-panel switch that controls each one
// (Dashboard > Settings > Notifications). One switch per event group; the stored object is
// User.notificationPrefs. A key the user never touched falls back to its default, so adding
// a new event never silently turns it off for existing accounts.

export type NotificationEvent =
  | "LOW_BALANCE"
  | "QUOTA_80"
  | "QUOTA_100"
  | "ERROR_SPIKE"
  | "PDF_READY"
  | "PDF_FAILED"
  | "PAYMENT_RECEIVED"
  | "INVOICE_ISSUED"
  | "REFUND_ISSUED"
  | "PASSWORD_CHANGED"
  | "TWO_FA_CHANGED"
  | "TEST";

export interface NotificationPrefs {
  emailLowBalance: boolean;
  emailQuotaWarning: boolean;
  emailSpikeAlert: boolean;
  emailPdfReady: boolean;
  emailPdfFailed: boolean;
  emailPayments: boolean;
  emailInvoices: boolean;
  emailRefunds: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  emailLowBalance: true,
  emailQuotaWarning: true,
  emailSpikeAlert: true,
  emailPdfReady: false, // unchanged: opt-in
  emailPdfFailed: true,
  emailPayments: true,
  emailInvoices: true,
  emailRefunds: true,
};

/** Switch that governs each event. `null` = security event: always sent, cannot be turned off. */
export const EVENT_SWITCH: Record<NotificationEvent, keyof NotificationPrefs | null> = {
  LOW_BALANCE: "emailLowBalance",
  QUOTA_80: "emailQuotaWarning",
  QUOTA_100: "emailQuotaWarning",
  ERROR_SPIKE: "emailSpikeAlert",
  PDF_READY: "emailPdfReady",
  PDF_FAILED: "emailPdfFailed",
  PAYMENT_RECEIVED: "emailPayments",
  INVOICE_ISSUED: "emailInvoices",
  REFUND_ISSUED: "emailRefunds",
  PASSWORD_CHANGED: null,
  TWO_FA_CHANGED: null,
  TEST: null,
};

export function resolvePrefs(stored: unknown): NotificationPrefs {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<Record<keyof NotificationPrefs, unknown>>;
  const out = { ...DEFAULT_PREFS };
  for (const key of Object.keys(DEFAULT_PREFS) as Array<keyof NotificationPrefs>) {
    if (typeof s[key] === "boolean") out[key] = s[key] as boolean;
  }
  return out;
}

/** Is this user currently subscribed to this event? */
export function isEventEnabled(event: NotificationEvent, stored: unknown): boolean {
  const sw = EVENT_SWITCH[event];
  if (sw === null) return true;
  return resolvePrefs(stored)[sw];
}

/** Security events and the settings-page test are e-mail only (never sent to a customer webhook). */
export function isEmailOnlyEvent(event: NotificationEvent): boolean {
  return event === "PASSWORD_CHANGED" || event === "TWO_FA_CHANGED";
}
