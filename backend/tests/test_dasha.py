import pytest
from app.modules.dasha.calculator import (
    calculate_vimshottari_mahadasha,
    calculate_antardashas,
    calculate_pratyantar_dashas,
    get_running_dasha_tree
)

def test_mahadasha_calculation():
    # Moon at 305° is Shatabhisha (lord Rahu)
    res = calculate_vimshottari_mahadasha(
        dob="1995-10-05",
        tob="14:30",
        tz=5.5,
        moon_lon=308.5,
        lang="hi"
    )
    assert "mahadashas" in res
    assert len(res["mahadashas"]) == 9
    assert res["birth_nakshatra_lord"] == "RAHU"
    assert res["mahadashas"][0]["planet_id"] == "RAHU"
    assert res["mahadashas"][0]["planet_name"] == "राहु"
    assert res["mahadashas"][0]["is_birth_dasha"] is True

def test_antardasha_calculation():
    # 9 Antardashas inside Jupiter Mahadasha (16 years)
    ads = calculate_antardashas("JUPITER", "2020-01-01", "2036-01-01", lang="en")
    assert len(ads) == 9
    assert ads[0]["antardasha"] == "JUPITER"
    assert ads[1]["antardasha"] == "SATURN"

def test_running_dasha_tree():
    res = get_running_dasha_tree(
        dob="1995-10-05",
        tob="14:30",
        tz=5.5,
        moon_lon=308.5,
        lang="en"
    )
    assert "running_dasha" in res
    tree = res["running_dasha"]
    assert "hierarchy" in tree
    assert "mahadasha" in tree
    assert "antardasha" in tree
    assert "pratyantar_dasha" in tree
