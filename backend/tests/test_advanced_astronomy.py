import pytest
from app.modules.core_astronomy.advanced_astronomy import (
    calculate_house_cusps,
    calculate_retrograde_details,
    calculate_sun_moon_timings,
    calculate_ayanamsa_comparison,
)

def test_house_cusps_calculation():
    res = calculate_house_cusps(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        house_system="PLACIDUS",
        ayanamsa="LAHIRI"
    )
    assert "houses" in res
    assert len(res["houses"]) == 12
    assert res["houses"][0]["house"] == 1
    assert "ascendant" in res

def test_retrograde_details():
    res = calculate_retrograde_details(
        dob="1995-10-05",
        tob="14:30",
        tz=5.5,
        ayanamsa="LAHIRI"
    )
    assert "planets" in res
    # Ensure physical planets checked
    ids = [p["id"] for p in res["planets"]]
    assert "SATURN" in ids
    assert "MERCURY" in ids

def test_sun_moon_timings():
    res = calculate_sun_moon_timings(
        dob="1995-10-05",
        lat=24.5854,
        lon=73.7125,
        tz=5.5
    )
    assert "sunrise" in res
    assert "sunset" in res
    assert res["sunrise"] != "N/A"
    assert res["day_duration_hours"] > 10.0

def test_ayanamsa_comparison():
    res = calculate_ayanamsa_comparison(
        dob="1995-10-05",
        tob="14:30",
        tz=5.5
    )
    assert "ayanamsas" in res
    assert "LAHIRI" in res["ayanamsas"]
    assert "KP" in res["ayanamsas"]
    assert res["ayanamsas"]["LAHIRI"] > 23.0
