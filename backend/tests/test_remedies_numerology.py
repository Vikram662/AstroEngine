import pytest
from app.modules.remedies.calculator import (
    calculate_gemstone_recommendations,
    get_rudraksha_recommendations,
    get_planetary_mantras_list
)
from app.modules.numerology.calculator import (
    calculate_core_numbers,
    calculate_loshu_grid,
    reduce_to_single_digit
)

def test_gemstone_recommendations():
    res = calculate_gemstone_recommendations("1995-10-05", "14:30", 24.5854, 73.7125, 5.5, lang="hi")
    assert "life_stone" in res
    assert "lucky_stone" in res
    assert "benefic_stone" in res
    assert "maraka_caution" in res

def test_rudraksha_recommendations():
    recs = get_rudraksha_recommendations("SATURN")
    assert len(recs) >= 1
    assert any("Mukhi" in r["mukhi"] for r in recs)

def test_mantras_list():
    mantras = get_planetary_mantras_list()
    assert "SUN" in mantras
    assert "beej_mantra" in mantras["SUN"]

def test_numerology_core_numbers():
    # 1995-10-05 -> Day 5 => Mulank 5 (Mercury)
    # Sum: 1+9+9+5+1+0+0+5 = 30 => 3+0 = 3 (Bhagyank 3 Jupiter)
    res = calculate_core_numbers("1995-10-05", name="Rahul")
    assert res["mulank"]["number"] == 5
    assert res["mulank"]["ruler"] == "MERCURY"
    assert res["bhagyank"]["number"] == 3
    assert res["bhagyank"]["ruler"] == "JUPITER"
    assert "namank" in res

def test_loshu_grid():
    res = calculate_loshu_grid("1995-10-05")
    assert "grid_matrix" in res
    assert len(res["grid_matrix"]) == 3
    assert "planes" in res
    assert "missing_numbers" in res
