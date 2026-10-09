#!/usr/bin/env python3
"""Render the app icons for iOS and Android from assets/brand/*.svg.

Requires rsvg-convert (`brew install librsvg`) and Pillow (`pip3 install pillow`).
Run from the repo root: python3 scripts/generate_icons.py
"""
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
IOS_ASSETS = ROOT / 'ios' / 'SledgeFieldCapture' / 'Images.xcassets'
ANDROID_RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

BACKGROUND = (0x12, 0x11, 0x10)
ACCENT = (0xE8, 0xB5, 0x30)
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def render(svg: str, size: int) -> Image.Image:
    png = subprocess.run(
        ['rsvg-convert', '-w', str(size), '-h', str(size), str(BRAND / svg)],
        check=True,
        capture_output=True,
    ).stdout
    return Image.open(io.BytesIO(png)).convert('RGBA')


def on_canvas(mark: Image.Image, canvas: int, mark_size: int) -> Image.Image:
    out = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    offset = (canvas - mark_size) // 2
    out.paste(mark.resize((mark_size, mark_size), Image.LANCZOS), (offset, offset))
    return out


def masked(icon: Image.Image, shape: str) -> Image.Image:
    size = icon.size[0]
    mask = Image.new('L', icon.size, 0)
    draw = ImageDraw.Draw(mask)
    if shape == 'circle':
        draw.ellipse([0, 0, size - 1, size - 1], fill=255)
    else:
        draw.rounded_rectangle([0, 0, size - 1, size - 1], int(size * 0.18), fill=255)
    out = Image.new('RGBA', icon.size, (0, 0, 0, 0))
    out.paste(icon, (0, 0), mask)
    return out


def monochrome(foreground: Image.Image) -> Image.Image:
    # Android 13 themed icons use alpha only: keep the yellow board, drop the check.
    out = Image.new('RGBA', foreground.size, (0, 0, 0, 0))
    src, dst = foreground.load(), out.load()
    for y in range(foreground.size[1]):
        for x in range(foreground.size[0]):
            r, g, b, a = src[x, y]
            if a and abs(r - ACCENT[0]) + abs(g - ACCENT[1]) + abs(b - ACCENT[2]) < 120:
                dst[x, y] = (255, 255, 255, a)
    return out


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n')


def ios() -> None:
    icon_dir = IOS_ASSETS / 'AppIcon.appiconset'
    for old in icon_dir.glob('*.png'):
        old.unlink()
    # App Store icons must not have an alpha channel.
    render('icon.svg', 1024).convert('RGB').save(icon_dir / 'AppIcon-1024.png')
    write_json(icon_dir / 'Contents.json', {
        'images': [{'filename': 'AppIcon-1024.png', 'idiom': 'universal',
                    'platform': 'ios', 'size': '1024x1024'}],
        'info': {'author': 'xcode', 'version': 1},
    })


def android() -> None:
    for density, factor in DENSITIES.items():
        mipmap = ANDROID_RES / f'mipmap-{density}'
        mipmap.mkdir(parents=True, exist_ok=True)

        legacy = render('icon.svg', round(48 * factor))
        masked(legacy, 'square').save(mipmap / 'ic_launcher.png')
        masked(legacy, 'circle').save(mipmap / 'ic_launcher_round.png')

        # Adaptive icon: 108dp layer; the clipboard stays inside the 66dp safe circle.
        foreground = on_canvas(render('mark.svg', round(108 * factor)), round(108 * factor), round(56 * factor))
        foreground.save(mipmap / 'ic_launcher_foreground.png')
        monochrome(foreground).save(mipmap / 'ic_launcher_monochrome.png')


if __name__ == '__main__':
    ios()
    android()
    print('App icons generated.')
