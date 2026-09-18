import pytest
from app.modules.parashari.calculator import compute_varga_chart, generate_chart_svg

def test_d1_lagna_chart_calculation():
    res = compute_varga_chart(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        varga="D1",
        lang="hi"
    )
    assert res["varga"] == "D1"
    assert "ascendant" in res
    assert "planets" in res
    assert len(res["planets"]) >= 9
    assert "houses" in res
    assert len(res["houses"]) == 12

def test_d9_navamsha_chart_calculation():
    res = compute_varga_chart(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        varga="D9",
        lang="en"
    )
    assert res["varga"] == "D9"
    assert len(res["houses"]) == 12

def test_svg_chart_generation():
    chart = compute_varga_chart(
        dob="1995-10-05",
        tob="14:30",
        lat=24.5854,
        lon=73.7125,
        tz=5.5,
        varga="D1"
    )
    svg = generate_chart_svg(chart)
    assert "<svg" in svg
    assert "</svg>" in svg
    assert "D1" in svg
