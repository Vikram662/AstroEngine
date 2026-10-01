import dns from "dns/promises";
import net from "net";
import http from "http";
import https from "https";

/**
 * Validates if an IP address belongs to a private, loopback, link-local,
 * or cloud metadata range (AWS/GCP/Azure 169.254.169.254).
 */
export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) {
    return true; // Malformed IP, treat as unsafe
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return true;

    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;

    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;

    // 169.254.0.0/16 (Link-local & Cloud metadata e.g. 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

    // 192.0.0.0/24 (IETF protocol assignments) & 198.18.0.0/15 (benchmarking)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (parts[0] >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback
    if (normalized === "::1" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
    // Unspecified
    if (normalized === "::") return true;
    // Unique local address (fc00::/7)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Link-local address (fe80::/10)
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    // IPv4-mapped IPv6: dotted (::ffff:127.0.0.1) or hex (::ffff:7f00:1) form
    const mapped = normalized.match(/^(?:0{0,4}:){0,5}:?ffff:(.+)$/);
    if (mapped) {
      const tail = mapped[1];
      if (net.isIPv4(tail)) return isPrivateIp(tail);
      const hex = tail.split(":");
      if (hex.length === 2 && hex.every((h) => /^[0-9a-f]{1,4}$/.test(h))) {
        const hi = parseInt(hex[0], 16);
        const lo = parseInt(hex[1], 16);
        return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
      }
      return true;
    }
    // NAT64 (64:ff9b::/96) can embed private IPv4 targets
    if (normalized.startsWith("64:ff9b:")) return true;
  }

  return false;
}

/**
 * Validates that a user-provided Webhook or Outbound URL is strictly safe from SSRF:
 * 1. Protocol must be HTTPS (or HTTP only in non-production local development)
 * 2. Host cannot be localhost, 127.0.0.1, internal domains (.local, .internal, .lan, metadata)
 * 3. Resolves DNS records and asserts all resolved IPs are public non-private IPs.
 */
export async function validateSafeWebhookUrl(urlStr: string): Promise<{ valid: boolean; reason?: string }> {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, reason: "Empty or invalid URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return { valid: false, reason: "Malformed URL syntax" };
  }

  const isProd = process.env.NODE_ENV === "production";

  // Protocol validation
  if (isProd && parsed.protocol !== "https:") {
    return { valid: false, reason: "Webhook URL must use HTTPS in production." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, reason: "Invalid protocol. Only HTTP(S) supported." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Common blacklisted hostnames & suffixes
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname === "metadata.google.internal" ||
    hostname === "instance-data"
  ) {
    return { valid: false, reason: "Internal and localhost hostnames are prohibited." };
  }

  // If host is a direct IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, reason: "Private, loopback, or cloud metadata IP addresses are prohibited." };
    }
    return { valid: true };
  }

  // Resolve DNS to verify all destination IPs
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, reason: "Could not resolve hostname via DNS." };
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return { valid: false, reason: `Host resolves to private IP (${record.address}). Webhook blocked.` };
      }
    }
  } catch (err: unknown) {
    const msg = (err as Error).message || "DNS lookup failed";
    return { valid: false, reason: `DNS resolution error: ${msg}` };
  }

  return { valid: true };
}


export interface SafePostResult {
  ok: boolean;
  status: number;
}

/**
 * POSTs JSON to a user-supplied URL with SSRF protection that cannot be
 * bypassed by DNS rebinding: the destination IP is validated inside the socket
 * `lookup` hook, i.e. for the exact address that is connected to. Redirects are
 * never followed and the response body is discarded.
 */
export async function safePostJson(
  urlStr: string,
  body: string,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 5000
): Promise<SafePostResult> {
  const check = await validateSafeWebhookUrl(urlStr);
  if (!check.valid) throw new Error(`SSRF blocked: ${check.reason}`);

  const url = new URL(urlStr.trim());
  const client = url.protocol === "https:" ? https : http;

  return new Promise<SafePostResult>((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "POST",
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...extraHeaders,
        },
        lookup: (hostname, options, callback) => {
          dns.lookup(hostname, { ...options, all: true }).then(
            (addresses) => {
              const bad = addresses.find((a) => isPrivateIp(a.address));
              if (bad || addresses.length === 0) {
                return callback(new Error("SSRF blocked: destination resolves to a private address"), "", 4);
              }
              if ((options as { all?: boolean }).all) {
                return callback(null, addresses);
              }
              callback(null, addresses[0].address, addresses[0].family);
            },
            (err) => callback(err, "", 4)
          );
        },
      },
      (res) => {
        res.resume();
        resolve({ ok: (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300, status: res.statusCode ?? 0 });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Webhook request timed out")));
    req.on("error", reject);
    req.end(body);
  });
}
