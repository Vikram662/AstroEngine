/**
 * Payloads returned by the astrology engine are dynamic JSON whose shape differs per endpoint
 * (about 130 of them). This alias is the single, documented place where that looseness lives;
 * tighten it endpoint by endpoint instead of scattering `any` through the components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiData = any;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  response?: { status?: number; data?: ApiData };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Normalises anything thrown by fetch, axios or our own code into one predictable shape. */
export function toApiError(caught: unknown): ApiError {
  if (isRecord(caught) && isRecord(caught.response)) {
    const response = caught.response as { status?: number; data?: ApiData };
    const data = response.data;
    const fromBody = isRecord(data) && typeof data.message === "string" ? data.message : undefined;
    return {
      message: fromBody || (caught instanceof Error ? caught.message : "Request failed."),
      status: response.status,
      code: typeof caught.code === "string" ? caught.code : undefined,
      response: { status: response.status, data },
    };
  }
  if (caught instanceof Error) return { message: caught.message };
  if (typeof caught === "string") return { message: caught };
  return { message: "Something went wrong." };
}
