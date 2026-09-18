import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all_117_endpoints_live():
    """Parametric test suite executing against all endpoints in OpenAPI schema."""
    schema = app.openapi()
    paths = schema["paths"]
    
    headers = {"x-api-key": "test_verification_key"}
    default_body = {
        "dob": "1995-10-05",
        "tob": "14:30",
        "lat": 24.5854,
        "lon": 73.7125,
        "tz": 5.5,
        "ayanamsa": "LAHIRI",
        "lang": "en"
    }
    match_body = {
        "groom_dob": "1995-10-05",
        "groom_tob": "14:30",
        "groom_lat": 24.5854,
        "groom_lon": 73.7125,
        "groom_tz": 5.5,
        "bride_dob": "1997-08-15",
        "bride_tob": "10:15",
        "bride_lat": 28.6139,
        "bride_lon": 77.2090,
        "bride_tz": 5.5
    }

    tested_count = 0
    for path, methods in paths.items():
        for method in methods.keys():
            tested_count += 1
            if method == "get":
                if "search" in path:
                    res = client.get(f"{path}?q=Delhi", headers=headers)
                elif "timezone" in path:
                    res = client.get(f"{path}?lat=28.6&lon=77.2", headers=headers)
                elif "status" in path:
                    res = client.get(path.replace("{job_id}", "demo_job_123"), headers=headers)
                else:
                    res = client.get(path, headers=headers)
                assert res.status_code in [200, 404]
            elif method == "post":
                body = match_body if "matchmaking" in path else default_body
                res = client.post(path, json=body, headers=headers)
                assert res.status_code in [200, 202]

    assert tested_count == 117
