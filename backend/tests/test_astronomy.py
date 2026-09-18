import pytest
from app.core.swisseph import (
    calculate_julian_day,
    get_nakshatra_info,
    get_zodiac_sign_info
)
from app.modules.core_astronomy.calculator import calculate_planetary_positions

def test_julian_day_calculation():
    # 1995-10-05 at 14:30 IST (+5.5 UTC)
    # 14:30 - 5:30 = 09:00:00 UT
    jd = calculate_julian_day("1995-10-05", "14:30", 5.5)
    assert jd > 2449995.0
    assert abs(jd - 2449995.875) < 0.001

def test_nakshatra_calculation():
    # Ashwini starts at 0° Aries, ends at 13° 20' (13.3333°)
    nak1 = get_nakshatra_info(0.5)
    assert nak1["id"] == "ASHWINI"
    assert nak1["index"] == 1
    assert nak1["pada"] == 1

    # Rohini starts at 40° (Taurus 10°)
    nak4 = get_nakshatra_info(42.0)
    assert nak4["id"] == "ROHINI"
    assert nak4["index"] == 4

def test_zodiac_sign_calculation():
    # 28.5 degrees is Aries
    sign1 = get_zodiac_sign_info(28.5)
    assert sign1["id"] == "ARIES"
    assert sign1["index"] == 1

    # 45 degrees is Taurus 15°
    sign2 = get_zodiac_sign_info(45.0)
    assert sign2["id"] == "TAURUS"
    assert sign2["degree"] == 15.0
    assert sign2["index"] == 2

def test_planetary_positions_execution():
    res = calculate_planetary_positions(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        ayanamsa="LAHIRI",
        lang="hi"
    )
    assert "planets" in res
    assert len(res["planets"]) >= 9
    
    # Check Sun presence and Hindi localized name
    sun = next(p for p in res["planets"] if p["id"] == "SUN")
    assert sun["name"] == "सूर्य"
    assert sun["sign"]["name"] == "कन्या" or sun["sign"]["name"] == "सिंह" # Verified by math
    assert "ascendant" in res
