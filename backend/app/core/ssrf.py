import ipaddress
import socket
from typing import Any, Dict, List
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, status

# Ranges that are not covered by ipaddress' is_private/is_reserved on every
# Python version (shared address space / CGNAT, benchmarking, NAT64).
_EXTRA_BLOCKED = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("64:ff9b::/96"),
]

_BLOCKED_HOSTNAME_SUFFIXES = (".localhost", ".local", ".internal", ".lan")
_BLOCKED_HOSTNAMES = {"localhost", "metadata.google.internal", "instance-data"}


def is_blocked_ip(ip_str: str) -> bool:
    """True for loopback, private, link-local (incl. cloud metadata), multicast,
    reserved, unspecified and IPv4-mapped/NAT64 forms of those."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # unparseable => unsafe
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    if (
        ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast
        or ip.is_reserved or ip.is_unspecified
    ):
        return True
    return any(ip in net for net in _EXTRA_BLOCKED if net.version == ip.version)


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _resolve_public_addresses(hostname: str, port: int) -> List[str]:
    """Resolve hostname and return its addresses, raising 400 if any is internal."""
    host = hostname.lower().rstrip(".")
    if host in _BLOCKED_HOSTNAMES or host.endswith(_BLOCKED_HOSTNAME_SUFFIXES):
        raise _bad_request("Webhook destination is not allowed.")
    try:
        infos = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise _bad_request("Could not resolve webhook hostname.")
    addresses = [info[4][0] for info in infos]
    if not addresses:
        raise _bad_request("Could not resolve webhook hostname.")
    for addr in addresses:
        if is_blocked_ip(addr):
            raise _bad_request("Webhook destination resolves to a reserved/internal address space.")
    return addresses


def validate_safe_webhook_url(url: str) -> str:
    """
    Validate client-supplied webhook URLs (early rejection at request time):
    1. HTTPS only, no embedded credentials.
    2. Hostname must resolve exclusively to public addresses.
    The send-time check in `post_webhook_json` re-validates and pins the IP.
    """
    if not url:
        return url

    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise _bad_request("Webhook URLs must strictly use HTTPS protocol.")
    if parsed.username or parsed.password:
        raise _bad_request("Webhook URLs must not contain credentials.")
    if not parsed.hostname:
        raise _bad_request("Invalid webhook hostname.")

    _resolve_public_addresses(parsed.hostname, parsed.port or 443)
    return url


async def post_webhook_json(url: str, payload: Dict[str, Any], timeout: float = 10.0) -> int:
    """
    POST JSON to a webhook with SSRF protection that survives DNS rebinding:
    the hostname is resolved once, validated, and the connection is made to that
    exact IP (TLS SNI + Host header keep certificate validation on the real
    hostname). Redirects are never followed. Returns the HTTP status code.
    """
    parsed = urlparse(url)
    if parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Unsafe webhook URL")

    port = parsed.port or 443
    ip = _resolve_public_addresses(parsed.hostname, port)[0]
    ip_host = f"[{ip}]" if ":" in ip else ip
    path = parsed.path or "/"
    target = f"https://{ip_host}:{port}{path}" + (f"?{parsed.query}" if parsed.query else "")
    host_header = parsed.hostname if port == 443 else f"{parsed.hostname}:{port}"

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        resp = await client.post(
            target,
            json=payload,
            headers={"Host": host_header},
            extensions={"sni_hostname": parsed.hostname},
        )
        return resp.status_code
