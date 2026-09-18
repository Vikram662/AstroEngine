import pytest
from app.modules.kp.calculator import (
    get_kp_sub_lord,
    calculate_kp_planets,
    calculate_kp_cusps,
    calculate_kp_horary_chart
)

def test_kp_sub_lord_logic():
    # 0° Aries is Ashwini (Ketu star) -> Ketu sub
    sign_l, star_l, sub_l = get_kp_sub_lord(0.1)
    assert sign_l == "MARS"
    assert star_l == "KETU"
    assert sub_l == "KETU"

def test_kp_planets_calculation():
    planets = calculate_kp_planets("1995-10-05", "14:30", 5.5, lang="hi")
    assert len(planets) >= 9
    sun = next(p for p in planets if p["planet_id"] == "SUN")
    assert "sign_lord" in sun
    assert "star_lord" in sun
    assert "sub_lord" in sun

def test_kp_cusps_calculation():
    cusps = calculate_kp_cusps("1995-10-05", "14:30", 24.5854, 73.7125, 5.5)
    assert len(cusps) == 12
    assert cusps[0]["cusp"] == 1
    assert "sub_lord" in cusps[0]

def test_kp_horary_chart():
    res = calculate_kp_horary_chart(123, "1995-10-05", "14:30", 24.5854, 73.7125, 5.5)
    assert res["horary_number"] == 123
    assert "horary_ascendant" in res
    assert "sub_lord" in res["horary_ascendant"]
