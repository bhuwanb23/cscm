#!/usr/bin/env python3
"""Render docs/assets/*.svg to PNG via headless Chrome.

Chrome is the renderer (no cairo/rsvg dependency on Windows). Each SVG is
snapshotted at 2x for crisp README rendering, sized from the SVG width/height.
"""
import subprocess, tempfile, os, sys, glob, re

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "docs", "assets")

def render(svg_path):
    svg = open(svg_path, encoding="utf-8").read()
    w = int(re.search(r'width="(\d+)"', svg).group(1))
    h = int(re.search(r'height="(\d+)"', svg).group(1))
    png = os.path.splitext(svg_path)[0] + ".png"
    # HTML wrapper: chrome must load a real page; transparent bg so the dark
    # diagram blends on GitHub — but we paint bg in SVG anyway.
    html = f"<!doctype html><html><body style='margin:0;padding:0'><img src='file:///{svg_path.replace(os.sep, '/')}' width='{w}' height='{h}'></body></html>"
    fd, tmp = tempfile.mkstemp(suffix=".html"); os.close(fd)
    open(tmp, "w", encoding="utf-8").write(html)
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
        f"--screenshot={png}", f"--window-size={w},{h}",
        "--force-device-scale-factor=2", "--hide-scrollbars",
        "--default-background-color=00000000",
        "file:///" + tmp.replace(os.sep, "/"),
    ], check=True, capture_output=True, timeout=60)
    os.unlink(tmp)
    print(f"rendered {os.path.relpath(png, ROOT)}  ({w}x{h} @2x)")

for svg in sorted(glob.glob(os.path.join(ASSETS, "*.svg"))):
    render(svg)
