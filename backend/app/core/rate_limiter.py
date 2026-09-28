import time
import os
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status
from app.core.config import settings

# Optional Redis connection for multi-worker / multi-instance rate limiting
_redis_client = None
_redis_init_attempted = False

def get_redis_client():
    global _redis_client, _redis_init_attempted
    if not _redis_init_attempted:
        _redis_init_attempted = True
        host = settings.REDIS_HOST or os.getenv("REDIS_HOST")
        if host:
            try:
                import redis
                port = settings.REDIS_PORT or int(os.getenv("REDIS_PORT", "6379"))
                password = settings.REDIS_PASSWORD or os.getenv("REDIS_PASSWORD") or None
                _redis_client = redis.Redis(
                    host=host,
                    port=port,
                    password=password,
                    decode_responses=True,
                    socket_timeout=1.5
                )
                _redis_client.ping()
            except Exception:
                _redis_client = None
    return _redis_client

# In-memory sliding window store fallback: { "key_or_user_id": [timestamp1, timestamp2, ...] }
_REQUEST_TIMESTAMPS: Dict[str, List[float]] = {}
_CLEANUP_INTERVAL = 120.0
_LAST_CLEANUP = time.time()

def check_sliding_window_rate_limit(key_identifier: str, dynamic_rpm: int = 60) -> Tuple[bool, int]:
    """
    Check if incoming request exceeds the sliding 60-second window rate limit.
    Uses Upstash/Redis if configured, with automatic in-memory sliding-window fallback.
    Returns: (allowed: bool, retry_after_seconds: int)
    """
    now = time.time()
    rpm_limit = dynamic_rpm if (dynamic_rpm and dynamic_rpm > 0) else 60
    window_start = now - 60.0

    # 1. Try Redis sliding-window (ZSET) if available
    r = get_redis_client()
    if r:
        redis_member = f"{now:.6f}:{time.perf_counter_ns()}"
        redis_key = f"ratelimit:{key_identifier}"
        try:
            pipe = r.pipeline()
            # Remove timestamps older than 60 seconds
            pipe.zremrangebyscore(redis_key, 0, window_start)
            # Count elements currently in window
            pipe.zcard(redis_key)
            # Query oldest timestamp in current window for exact Retry-After
            pipe.zrange(redis_key, 0, 0, withscores=True)
            # Add current timestamp with collision-free unique member
            pipe.zadd(redis_key, {redis_member: now})
            # Set TTL on key
            pipe.expire(redis_key, 90)
            res = pipe.execute()

            current_count = res[1]
            oldest_entries = res[2]

            if current_count >= rpm_limit:
                # Reached or exceeded limit: rollback current addition safely
                try:
                    r.zrem(redis_key, redis_member)
                except Exception:
                    pass
                oldest_ts = oldest_entries[0][1] if oldest_entries else window_start
                retry_after = max(1, int(60.0 - (now - oldest_ts)))
                return False, retry_after

            return True, 0
        except Exception:
            # On any Redis network glitch or failure, fail-open to in-memory fallback
            pass

    # 2. In-memory sliding window store fallback
    global _LAST_CLEANUP
    if now - _LAST_CLEANUP > _CLEANUP_INTERVAL:
        for k in list(_REQUEST_TIMESTAMPS.keys()):
            _REQUEST_TIMESTAMPS[k] = [t for t in _REQUEST_TIMESTAMPS[k] if t > window_start]
            if not _REQUEST_TIMESTAMPS[k]:
                del _REQUEST_TIMESTAMPS[k]
        _LAST_CLEANUP = now

    timestamps = _REQUEST_TIMESTAMPS.get(key_identifier, [])
    valid_timestamps = [t for t in timestamps if t > window_start]
    _REQUEST_TIMESTAMPS[key_identifier] = valid_timestamps

    if len(valid_timestamps) >= rpm_limit:
        oldest_in_window = valid_timestamps[0]
        retry_after = max(1, int(60.0 - (now - oldest_in_window)))
        return False, retry_after

    valid_timestamps.append(now)
    return True, 0
