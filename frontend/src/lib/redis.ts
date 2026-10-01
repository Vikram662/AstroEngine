import Redis from "ioredis";

let client: Redis | null | undefined;

/** Shared Redis client, or null when REDIS_URL is not configured. */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return client;
  }
  client = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false, // fail fast (callers fall back to in-memory)
    commandTimeout: 500,
    connectTimeout: 2000,
  });
  client.on("error", (err) => console.error("[redis]", err.message));
  return client;
}
