#!/usr/bin/env python3
"""Wrap a PNG in an SVG the way the existing avatar assets are built.

The files in assets/icons/*.svg are NOT vector art: each is a PNG embedded as
base64 inside an <svg> wrapper (zero <path> elements). This reproduces that
exact structure so a new avatar matches the others.

    python3 scripts/png-to-svg.py mother.png assets/icons/mother-avatar.svg 28

The optional third argument is the display box in points; omit it to keep the
source aspect ratio. The PNG should have a transparent background (colour type
6 / RGBA) — the existing avatars do, and a solid background would show as a
rectangle inside the app's circular IconContainer.
"""
import base64, struct, sys, os

def wrap(png_path, out_path, box=None):
    data = open(png_path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit("not a PNG — export the image as PNG first")
    w, h = struct.unpack(">II", data[16:24])
    # Display box: square by default, else proportional to the source.
    vw, vh = (box, box) if box else (w, h)
    b64 = base64.b64encode(data).decode()
    uid = os.path.splitext(os.path.basename(out_path))[0].replace("-", "_")
    svg = (
        f'<svg width="{vw}" height="{vh}" viewBox="0 0 {vw} {vh}" fill="none" '
        f'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n'
        f'<rect width="{vw}" height="{vh}" fill="url(#pattern_{uid})"/>\n'
        f'<defs>\n'
        f'<pattern id="pattern_{uid}" patternContentUnits="objectBoundingBox" width="1" height="1">\n'
        f'<use xlink:href="#image_{uid}" transform="scale({1/w:.10g} {1/h:.10g})"/>\n'
        f'</pattern>\n'
        f'<image id="image_{uid}" width="{w}" height="{h}" preserveAspectRatio="none" '
        f'xlink:href="data:image/png;base64,{b64}"/>\n'
        f'</defs>\n</svg>\n'
    )
    open(out_path, "w").write(svg)
    print(f"{out_path}: {w}x{h} source -> {vw}x{vh} box, {len(svg)/1024:.0f} KB")

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    wrap(src, dst, int(sys.argv[3]) if len(sys.argv) > 3 else None)
