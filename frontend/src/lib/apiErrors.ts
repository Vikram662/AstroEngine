/**
 * Logs the real error on the server and returns a safe message for the client,
 * so database / stack details never leak through API responses.
 */
export function publicMessage(err: unknown, fallback = "Internal server error."): string {
  console.error(err);
  return fallback;
}
