import pytest
from app.modules.western.calculator import (
    calculate_tropical_planets,
    calculate_aspects_matrix,
    calculate_big_three,
    generate_western_wheel_svg
)

def test_tropical_planets():
    planets = calculate_tropical_planets("1995-10-05", "14:30", 5.5, lang="en")
    assert len(planets) >= 9
    sun = next(p for p in planets if p["id"] == "SUN")
    # In Tropical astrology, Oct 5 is Libra (Sun ~11-12° Libra)
    assert sun["sign"]["id"] == "LIBRA"
    assert sun["sign"]["number"] == 7

def test_big_three():
    res = calculate_big_three("1995-10-05", "14:30", 24.5854, 73.7125, 5.5)
    assert "sun_sign" in res
    assert "moon_sign" in res
    assert "ascendant_sign" in res

def test_aspects_matrix():
    planets = calculate_tropical_planets("1995-10-05", "14:30", 5.5)
    aspects = calculate_aspects_matrix(planets)
    assert isinstance(aspects, list)
    if aspects:
        assert "aspect" in aspects[0]
        assert "nature" in aspects[0]

def test_western_wheel_svg():
    planets = calculate_tropical_planets("1995-10-05", "14:30", 5.5)
    svg = generate_western_wheel_svg(planets)
    assert "<svg" in svg
    assert "</svg>" in svg
    assert "Western Wheel" in svg
