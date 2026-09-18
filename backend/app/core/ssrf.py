import ipaddress
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status

PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),   # Cloud metadata service (AWS/GCP/Azure)
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]

def validate_safe_webhook_url(url: str) -> str:
    """
    Validate that client-supplied webhook URLs:
    1. Strictly use HTTPS (unless development mode localhost is allowed).
    2. Resolve hostnames and reject loopback, link-local, or private RFC1918 IPs.
    Prevents Server-Side Request Forgery (SSRF) against internal infra or cloud metadata.
    """
    if not url:
        return url
    
    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook URLs must strictly use HTTPS protocol."
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook hostname.")

    try:
        # Resolve hostname to IPv4/IPv6 addresses
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            for private_net in PRIVATE_NETWORKS:
                if ip_obj in private_net:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook destination resolves to a reserved/internal address space."
                    )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not resolve webhook hostname."
        )

    return url
