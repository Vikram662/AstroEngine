import time
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status

# In-memory sliding window store: { "key_or_user_id": [timestamp1, timestamp2, ...] }
_REQUEST_TIMESTAMPS: Dict[str, List[float]] = {}
_CLEANUP_INTERVAL = 120.0
_LAST_CLEANUP = time.time()

def check_sliding_window_rate_limit(key_identifier: str, dynamic_rpm: int = 60) -> Tuple[bool, int]:
    """
    Check if incoming request exceeds the sliding 60-second window rate limit.
    strictly uses dynamic_rpm configured dynamically in database.
    Returns: (allowed: bool, retry_after_seconds: int)
    """
    global _LAST_CLEANUP
    now = time.time()
    rpm_limit = dynamic_rpm if (dynamic_rpm and dynamic_rpm > 0) else 60
    window_start = now - 60.0

    # Periodic cleanup of expired records
    if now - _LAST_CLEANUP > _CLEANUP_INTERVAL:
        for k in list(_REQUEST_TIMESTAMPS.keys()):
            _REQUEST_TIMESTAMPS[k] = [t for t in _REQUEST_TIMESTAMPS[k] if t > window_start]
            if not _REQUEST_TIMESTAMPS[k]:
                del _REQUEST_TIMESTAMPS[k]
        _LAST_CLEANUP = now

    timestamps = _REQUEST_TIMESTAMPS.get(key_identifier, [])
    # Filter to last 60 seconds
    valid_timestamps = [t for t in timestamps if t > window_start]
    _REQUEST_TIMESTAMPS[key_identifier] = valid_timestamps

    if len(valid_timestamps) >= rpm_limit:
        oldest_in_window = valid_timestamps[0]
        retry_after = max(1, int(60.0 - (now - oldest_in_window)))
        return False, retry_after

    # Record current timestamp
    valid_timestamps.append(now)
    return True, 0
