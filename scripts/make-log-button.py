#!/usr/bin/env python3
"""Rebuilds src/assets/program/button-log-{active,inactive}.svg.

The toolbar banners in this repository are vectorised text, not live text. The "Log" banner follows the
same geometry as its neighbours (measured off button-save-inactive.svg):

    viewBox 0 0 18.66 7.38   banner inner edge 18.32 x 7.04
    icon    x 2.31 .. 4.51   (2.2 units wide, sitting on the baseline)
    word    from x 7.89      baseline y 5.29, cap height 2.86

The letter outlines are taken from Noto Sans Regular so the shapes are real glyphs rather than hand-drawn
approximations; the design font of the original assets is not installed in this environment. Pass a
different font path as the second argument to compare.

    pip install fonttools          # any interpreter; needs the font file below
    python3 scripts/make-log-button.py [--font /path/to/Font.ttf] [--check]

``--check`` rebuilds into memory and compares with the committed files without writing.
"""
import argparse
import os
import pathlib
import sys
from difflib import unified_diff

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "src" / "assets" / "program"
DEFAULT_FONT = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"

TARGET_CAP, BASELINE, X0 = 2.86, 5.29, 7.89
ICON_X, ICON_SIZE = 2.31, 2.2
ICON_Y = BASELINE - ICON_SIZE
BANNER_BORDER = (
    "M17.23.28c.63,0,1.15.51,1.15,1.15v4.52c0,.63-.51,1.15-1.15,1.15H1.43c-.63,0-1.15-.51-"
    "1.15-1.15V1.43c0-.63.52-1.15,1.15-1.15h15.8M17.23,0H1.43C.64,0,0,.64,0,1.43v4.52c0,.79.64,"
    "1.43,1.43,1.43h15.8c.79,0,1.43-.64,1.43-1.43V1.43c0-.79-.64-1.43-1.43-1.43h0Z"
)


def rounded(path_data: str, digits: int = 3) -> str:
    """Round every number in a path so the files stay readable and diff-stable."""
    out, num = [], ""
    for ch in path_data:
        if ch.isdigit() or ch == "." or (ch == "-" and not num):
            num += ch
            continue
        if num:
            out.append(("%.*f" % (digits, float(num))).rstrip("0").rstrip("."))
            num = ""
        out.append(ch)
    if num:
        out.append(("%.*f" % (digits, float(num))).rstrip("0").rstrip("."))
    return "".join(out)


def log_path(font_path: str) -> str:
    font = TTFont(font_path)
    upem = font["head"].unitsPerEm
    cap = getattr(font["OS/2"], "sCapHeight", int(0.71 * upem))
    cmap, glyphset, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
    scale = TARGET_CAP / cap
    x, parts = X0, []
    for ch in "Log":
        glyph = cmap[ord(ch)]
        pen = SVGPathPen(glyphset)
        glyphset[glyph].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, x, BASELINE)))
        parts.append(rounded(pen.getCommands()))
        x += hmtx[glyph][0] * scale
    print(f"  word ends at x={x:.2f} (inner edge is 18.32)")
    return " ".join(parts)


def icon_group() -> str:
    """The console pictogram from icon-split-screen.svg, scaled into the icon slot."""
    s = ICON_SIZE / 21.98
    stroke, inset = 0.22, 0.11
    parts = [
        f'<rect x="{ICON_X + inset:.2f}" y="{ICON_Y + inset:.2f}" '
        f'width="{ICON_SIZE - stroke:.2f}" height="{ICON_SIZE - stroke:.2f}" '
        f'rx="{3.43 * s * 0.5:.2f}" ry="{3.43 * s * 0.5:.2f}" fill="none" stroke="#fff" '
        f'stroke-width="{stroke}"/>'
    ]
    for rx, ry, rw, rh in ((3.5, 3.5, 14.99, 7.5), (3.5, 12.38, 6.9, 6.09), (11.43, 12.38, 7.06, 6.09)):
        parts.append(
            f'<rect x="{ICON_X + rx * s:.2f}" y="{ICON_Y + ry * s:.2f}" '
            f'width="{rw * s:.2f}" height="{rh * s:.2f}" rx="{0.81 * s:.2f}" ry="{0.81 * s:.2f}" '
            f'fill="#fff" opacity=".6"/>'
        )
    return "".join(parts)


def build(name: str, active: bool, word: str, icon: str) -> str:
    like = "button-save-active.svg" if active else "button-save-inactive.svg"
    state = "filled while the console is open" if active else "outline while it is closed"
    body = []
    if active:
        body.append('<rect x=".17" y=".17" width="18.32" height="7.04" rx="1.26" ry="1.26" fill="#e10472"/>')
    body.append(f'<path fill="#fff" d="{BANNER_BORDER}"/>')
    body += [icon, f'<path fill="#fff" d="{word}"/>']
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg id="{name}" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 18.66 7.38">\n'
        f"  <!-- Toolbar banner like {like}: console pictogram on the left, the word \"Log\", {state}. -->\n"
        + "\n".join("  " + part for part in body)
        + "\n</svg>\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", default=DEFAULT_FONT, help="TTF/OTF used for the letter outlines")
    ap.add_argument("--check", action="store_true", help="compare with the committed files, write nothing")
    args = ap.parse_args()
    if not os.path.exists(args.font):
        print(f"font not found: {args.font}", file=sys.stderr)
        return 2
    word, icon = log_path(args.font), icon_group()
    status = 0
    for name, active in (("button-log-active", True), ("button-log-inactive", False)):
        content = build(name, active, word, icon)
        path = OUT / f"{name}.svg"
        if args.check:
            current = path.read_text(encoding="utf-8") if path.exists() else ""
            if current == content:
                print(f"  {name}.svg matches")
            else:
                status = 1
                print(f"  {name}.svg DIFFERS:")
                for line in list(unified_diff(current.splitlines(), content.splitlines(), lineterm=""))[:12]:
                    print("   ", line)
        else:
            path.write_text(content, encoding="utf-8")
            print(f"  wrote {path.relative_to(REPO)} ({len(content)} bytes)")
    return status


if __name__ == "__main__":
    raise SystemExit(main())
