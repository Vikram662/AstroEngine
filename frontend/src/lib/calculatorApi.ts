import axios, { AxiosResponse } from "axios";
import type { ApiData } from "@/lib/apiTypes";

/**
 * Standard response unwrap utility: extracts payload data whether wrapped in `{ data: ... }` or directly returned.
 */
export function unwrapData<T = ApiData>(res: AxiosResponse<ApiData> | null | undefined): T | null {
  if (!res || !res.data) return null;
  return (res.data?.data !== undefined ? res.data.data : res.data) as T;
}

/**
 * Executes an array of axios request promises via Promise.allSettled.
 *
 * @param requests Array of promises returning AxiosResponse
 * @returns Array where each element is either the unwrapped response data (if fulfilled) or null (if rejected/omitted).
 */
export async function fetchParallelSettled(
  requests: Promise<AxiosResponse<ApiData>>[]
): Promise<(ApiData | null)[]> {
  const settled = await Promise.allSettled(requests);
  return settled.map((result) => {
    if (result.status === "fulfilled") {
      return unwrapData(result.value);
    }
    return null;
  });
}
