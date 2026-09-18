import pytest
from app.modules.dasha.calculator import (
    calculate_vimshottari_mahadasha,
    calculate_antardashas,
    calculate_pratyantar_dashas,
    calculate_sookshma_dashas,
    calculate_prana_dashas,
    get_running_dasha_tree
)

def test_mahadasha_calculation():
    # Moon at 305° is Shatabhisha (lord Rahu)
    res = calculate_vimshottari_mahadasha(
        dob="1995-10-05",
        tob="14:30:00",
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
    # Verify exact time fields
    assert "start_time" in res["mahadashas"][0]
    assert "end_time" in res["mahadashas"][0]
    assert "start_datetime" in res["mahadashas"][0]
    assert "end_datetime" in res["mahadashas"][0]

def test_antardasha_calculation():
    # 9 Antardashas inside Jupiter Mahadasha (16 years)
    ads = calculate_antardashas("JUPITER", "2020-01-01 00:00:00", "2036-01-01 00:00:00", lang="en")
    assert len(ads) == 9
    assert ads[0]["antardasha"] == "JUPITER"
    assert ads[1]["antardasha"] == "SATURN"
    assert "start_time" in ads[0]
    assert "end_time" in ads[0]

def test_sookshma_and_prana_calculation():
    pds = calculate_pratyantar_dashas("JUPITER", "SATURN", "2024-01-01 00:00:00", lang="en")
    assert len(pds) == 9
    assert "start_time" in pds[0]

    sds = calculate_sookshma_dashas("JUPITER", "SATURN", "MERCURY", "2024-05-27 00:00:00", lang="en")
    assert len(sds) == 9
    assert "duration_hours" in sds[0]
    assert "start_time" in sds[0]

    prs = calculate_prana_dashas("JUPITER", "SATURN", "MERCURY", "VENUS", "2024-06-15 00:00:00", lang="en")
    assert len(prs) == 9
    assert "duration_hours" in prs[0]
    assert "start_time" in prs[0]

def test_running_dasha_tree():
    res = get_running_dasha_tree(
        dob="1995-10-05",
        tob="14:30:00",
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
    assert "sookshma_dasha" in tree
    assert "prana_dasha" in tree
    assert "start_time" in tree["sookshma_dasha"]
    assert "start_time" in tree["prana_dasha"]
