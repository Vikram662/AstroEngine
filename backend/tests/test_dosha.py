import pytest
from app.modules.dosha_matching.calculator import (
    calculate_manglik_dosha,
    calculate_kaal_sarp_dosha,
    calculate_ashtakoot_guna_milan
)

def test_manglik_dosha_analysis():
    res = calculate_manglik_dosha(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5
    )
    assert "status" in res
    assert "is_manglik" in res
    assert "mars_placements" in res
    assert "cancellation_reasons" in res

def test_kaal_sarp_dosha_analysis():
    res = calculate_kaal_sarp_dosha(
        dob="1995-10-05",
        tob="14:30",
        tz=5.5
    )
    assert "is_kaal_sarp" in res
    assert "type" in res
    assert "rahu_degree" in res

def test_ashtakoot_guna_milan():
    # Groom Moon at 308.5° (Aquarius), Bride Moon at 110.0° (Cancer)
    res = calculate_ashtakoot_guna_milan(308.5, 110.0)
    assert "total_score" in res
    assert res["max_score"] == 36.0
    assert "kootas" in res
    assert "nadi" in res["kootas"]
    assert "bhakoot" in res["kootas"]
    assert 0.0 <= res["total_score"] <= 36.0
