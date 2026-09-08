#!/usr/bin/env python3
"""Share cards, 1200x630. Run when a story is published:  python3 scripts/og.py
Kept out of the Netlify build on purpose — these are committed assets, not
build output, so a deploy never depends on Python or PIL being present."""
import json, glob, os, unicodedata
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NIGHT, LAMP, PAPER, DIM = (20,16,28), (240,180,88), (243,231,211), (169,124,58)
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
SANS  = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

PUNCT = {'\u2013': '-', '\u2014': '-', '\u00b7': '\u2022', '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u2026': '...'}
def fold(s):
    """Liberation has no Latin Extended Additional — strip to what it can draw,
    but keep the punctuation that carries meaning (an en dash in '24-25' is not
    decoration; losing it silently printed 'CHAPTERS 2425')."""
    for k, v in PUNCT.items(): s = s.replace(k, v)
    out = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return (out or s).replace('\u2022', '\u00b7')

def wrap(d, text, font, width):
    out, line = [], ""
    for w in text.split():
        t = (line + " " + w).strip()
        if d.textlength(t, font=font) <= width: line = t
        else: out.append(line); line = w
    if line: out.append(line)
    return out

def card(path, title, kicker, foot):
    im = Image.new("RGB", (W, H), NIGHT); d = ImageDraw.Draw(im)
    for y in range(H):                                   # dusk wash
        k = 1 - y / H
        d.line([(0,y),(W,y)], fill=(int(20+22*k), int(16+17*k), int(28+36*k)))
    d.ellipse([70, 62, 96, 100], fill=LAMP)              # the lamp flame
    d.line([64, 108, 102, 108], fill=DIM, width=3)
    d.text((120, 68), "SANDHYA KATHA", font=ImageFont.truetype(SANSB, 24), fill=PAPER)
    k = fold(kicker).upper()
    fk = ImageFont.truetype(SANS, 18)
    while d.textlength(k, font=fk) > W - 190 and len(k) > 12: k = k[:-2]
    d.text((120, 98), k, font=fk, fill=DIM)
    ft = ImageFont.truetype(SERIF, 74)
    lines = wrap(d, fold(title), ft, W - 140)[:3]
    y = H//2 - (len(lines) * 86)//2 - 10
    for ln in lines:
        d.text((70, y), ln, font=ft, fill=PAPER); y += 86
    d.line([70, H-104, W-70, H-104], fill=(48,41,65), width=2)
    d.text((70, H-82), fold(foot), font=ImageFont.truetype(SANS, 22), fill=DIM)
    im.save(path, optimize=True)
    print("og:", path)

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(f"{root}/public/og", exist_ok=True)
card(f"{root}/public/og/default.png", "Six minutes at dusk.",
     "One story a night", "Itihasas and Puranas, cited, and written to be read aloud")
for f in glob.glob(f"{root}/content/stories/*.json"):
    s = json.load(open(f))
    if s["status"] != "published" or s["audience"].get("gated"): continue
    card(f"{root}/public/og/{s['id']}.png", s["title"],
         f"{s['source']['work']} · {s['source']['locus']}",
         f"Ages {s['audience']['minAge']}+  ·  {s['lengths'].get('short', s['lengths']['full'])['minutes']} minutes aloud")
