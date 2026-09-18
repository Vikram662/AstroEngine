import pytest
from app.modules.lalkitab.calculator import calculate_lalkitab_chart, calculate_lalkitab_varshphal
from app.modules.advanced.calculator import calculate_jaimini_karakas, calculate_tajik_varshphal

def test_lalkitab_chart():
    res = calculate_lalkitab_chart("1995-10-05", "14:30", 24.5854, 73.7125, 5.5, lang="hi")
    assert "planets" in res
    assert "sleeping_houses" in res
    assert "kudrati_debts" in res
    assert len(res["planets"]) >= 9

def test_lalkitab_varshphal():
    res = calculate_lalkitab_varshphal("1995-10-05", 30)
    assert res["age"] == 30
    assert res["target_year"] == 2025

def test_jaimini_karakas():
    karakas = calculate_jaimini_karakas("1995-10-05", "14:30", 5.5, lang="en")
    assert len(karakas) == 7
    # First is Atmakaraka (highest degree)
    assert "Atmakaraka" in karakas[0]["karaka_name"]
    # Verify sorted descending
    for i in range(len(karakas) - 1):
        assert karakas[i]["degree_in_sign"] >= karakas[i + 1]["degree_in_sign"]

def test_tajik_varshphal():
    res = calculate_tajik_varshphal("1995-10-05", 2026, 24.5854, 73.7125, 5.5)
    assert "muntha" in res
    assert 1 <= res["muntha"]["house"] <= 12
    assert "varshesh_candidates" in res
