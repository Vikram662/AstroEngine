import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(__file__)

FAMILIES = [
    "NotoSans",
    "NotoSansDevanagari",
    "NotoSansGujarati",
    "NotoSansTamil",
    "NotoSansTelugu",
    "NotoSansBengali",
]

for fam in FAMILIES:
    src = os.path.join(HERE, f"{fam}-Variable.ttf")
    if not os.path.exists(src):
        print(f"SKIP (missing source): {fam}")
        continue

    for weight, wght_val, suffix in [(400, 400, "Regular"), (700, 700, "Bold")]:
        font = TTFont(src)
        axes = {a.axisTag: a for a in font["fvar"].axes} if "fvar" in font else {}
        instance_axes = {}
        if "wght" in axes:
            instance_axes["wght"] = wght_val
        if "wdth" in axes:
            instance_axes["wdth"] = axes["wdth"].defaultValue
        instantiateVariableFont(font, instance_axes, inplace=True)
        out_path = os.path.join(HERE, f"{fam}-{suffix}.ttf")
        font.save(out_path)
        print(f"wrote {out_path}")

print("done")
