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

def test_kp_2193_table_structure():
    from fractions import Fraction
    from app.modules.kp.calculator import KP_2193_TABLE
    assert len(KP_2193_TABLE) == 2193  # 243 subs x 9 + 6 sign-boundary splits
    assert KP_2193_TABLE[0]["start_deg"] == 0 and KP_2193_TABLE[-1]["end_deg"] == 360
    for prev, nxt in zip(KP_2193_TABLE, KP_2193_TABLE[1:]):
        assert prev["end_deg"] == nxt["start_deg"]
    for e in KP_2193_TABLE:  # no arc crosses a sign, and its lords match the 249 system
        assert e["start_deg"] // 30 == (e["end_deg"] - Fraction(1, 10**9)) // 30
        assert get_kp_sub_lord(float((e["start_deg"] + e["end_deg"]) / 2)) == (e["sign_lord"], e["star_lord"], e["sub_lord"])

def test_kp_horary_2193_is_proportional_and_starts_from_sub_lord():
    from app.modules.kp.calculator import calculate_kp_horary_2193
    first = calculate_kp_horary_2193(1, "2000-01-01", "12:00", 5.5)
    # Ketu sub of Ketu star = 7/9 deg; its Ketu sub-sub = 7/120 of that.
    assert first["sub_sub_lord"] == "KETU"
    assert first["arc_end_deg"] == pytest.approx(7 / 9 * 7 / 120, abs=1e-5)
    venus_sub = calculate_kp_horary_2193(10, "2000-01-01", "12:00", 5.5)
    assert (venus_sub["sub_lord"], venus_sub["sub_sub_lord"]) == ("VENUS", "VENUS")
    last = calculate_kp_horary_2193(2193, "2000-01-01", "12:00", 5.5)
    assert (last["sub_249_number"], last["sub_sub_lord"]) == (249, "JUPITER")
    with pytest.raises(ValueError):
        calculate_kp_horary_2193(2194, "2000-01-01", "12:00", 5.5)
