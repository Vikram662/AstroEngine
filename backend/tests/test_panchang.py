import pytest
from app.modules.panchang.calculator import calculate_daily_panchang, calculate_choghadiya

def test_daily_panchang_calculation():
    res = calculate_daily_panchang(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        lang="hi"
    )
    assert "tithi" in res
    assert "nakshatra" in res
    assert "yoga" in res
    assert "karana" in res
    assert "vaar" in res
    assert res["vaar"]["id"] == "THURSDAY"
    assert res["vaar"]["name"] == "गुरुवार"

def test_choghadiya_calculation():
    res = calculate_choghadiya(
        dob="1995-10-05",
        sunrise_time_str="06:20:00",
        sunset_time_str="18:15:00",
        lang="hi"
    )
    assert "day_choghadiya" in res
    assert len(res["day_choghadiya"]) == 8
    first_slot = res["day_choghadiya"][0]
    assert first_slot["name"] == "SHUBH"
    assert "06:20" in first_slot["start_time"]
