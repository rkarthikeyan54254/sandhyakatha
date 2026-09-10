#!/usr/bin/env python3
"""
Pañcāṅga table for Sandhya Katha.

Deliberately the same engine, and the same conventions, as NalNaal
(tamil-nal-app/generate_panchangam.py): Swiss Ephemeris with the Lahiri
ayanāṃśa, evaluated at 06:00 IST for Chennai. Two ephemerides in one house
means two different Ekādaśīs, and the first person to notice is a grandparent.

Like NalNaal, this runs offline and ships a table — no ephemeris in the
browser, nothing computed while a parent waits, and it works on a flight.

    python3 scripts/panchanga.py [years]      # default 4, from 1 Jan this year

Writes content/panchanga.json.
"""
import swisseph as swe, datetime, json, os, sys

swe.set_sid_mode(swe.SIDM_LAHIRI)
FLAG = swe.FLG_SIDEREAL | swe.FLG_SWIEPH

# Amānta (South Indian) lunar months. The corpus tags stories with these.
MASA = ["chaitra","vaishakha","jyeshtha","ashadha","shravana","bhadrapada",
        "ashvina","kartika","margashirsha","pausha","magha","phalguna"]
TITHI = ["pratipada","dvitiya","tritiya","chaturthi","panchami","shashthi","saptami",
         "ashtami","navami","dashami","ekadashi","dvadashi","trayodashi","chaturdashi","purnima",
         "pratipada","dvitiya","tritiya","chaturthi","panchami","shashthi","saptami","ashtami",
         "navami","dashami","ekadashi","dvadashi","trayodashi","chaturdashi","amavasya"]
NAK = ["ashwini","bharani","krithigai","rohini","mrigashirsha","thiruvathirai","punarpoosam",
       "poosam","aayilyam","magam","pooram","uttiram","astham","chithirai","swathi","visakam",
       "anusham","kettai","moolam","pooradam","uttiradam","thiruvonam","avittam","sadhayam",
       "poorattathi","uttirattathi","revathi"]
TAMIL = ["Chithirai","Vaikasi","Aani","Aadi","Avani","Purattasi",
         "Aippasi","Karthigai","Margazhi","Thai","Masi","Panguni"]
SEASON = ["hot","hot","monsoon-onset","monsoon-onset","monsoon-end","monsoon-end",
          "harvest","harvest","winter","winter","spring","spring"]

def _jd(d, h=6.0):                      # 06:00 IST, as NalNaal does
    return swe.julday(d.year, d.month, d.day, h - 5.5)

def _lon(jd, body):
    return swe.calc_ut(jd, body, FLAG)[0][0]

def elong(d):
    jd = _jd(d)
    return (_lon(jd, swe.MOON) - _lon(jd, swe.SUN)) % 360

def sun_rasi(d):
    return int(_lon(_jd(d), swe.SUN) // 30)

def month_start(d):
    """First day of the current amānta month — the day the new moon fell on or
    after. Elongation climbs ~12°/day and only drops when it wraps past 360."""
    for k in range(0, 33):
        a, b = d - datetime.timedelta(days=k), d - datetime.timedelta(days=k + 1)
        if elong(a) < elong(b):
            return a
    return d

def next_month_start(ms):
    """First day of the lunar month after the one beginning at `ms`."""
    probe = ms + datetime.timedelta(days=25)
    for _ in range(12):
        if month_start(probe) != ms:
            return month_start(probe)
        probe += datetime.timedelta(days=2)
    return probe

def is_adhika(ms):
    """A lunar month with no saṅkrānti in it — the sun never changes rāśi
    between one new moon and the next — is adhika (intercalary). It carries the
    same name as the nija month that follows it, which is why 2026 produced two
    Āṣāḍhas and, with them, two Guru Pūrṇimās. Festivals belong to the nija
    month; the adhika one is for vrata and pilgrimage, not for these."""
    # Compare the rāśi at the two new moons that bound the month, not at the
    # last day inside it: a saṅkrānti that happens late on that final day is
    # still inside the month, and testing the day itself missed it — which
    # flagged Jyeṣṭha 2026 adhika when only Āṣāḍha was.
    return sun_rasi(ms) == sun_rasi(next_month_start(ms))

def tamil_month_day(d):
    r = sun_rasi(d); probe, n = d, 1
    while sun_rasi(probe - datetime.timedelta(days=1)) == r:
        probe -= datetime.timedelta(days=1); n += 1
    return r, n

# (masa, paksha, tithi-within-paksha) -> festival slug. Amānta reckoning.
FESTIVALS = {
    ("chaitra","shukla",9):  "rama-navami",
    ("chaitra","shukla",15): "hanuman-jayanti",
    ("vaishakha","shukla",3):"akshaya-tritiya",
    ("ashadha","shukla",15): "guru-purnima",
    ("shravana","krishna",8):"janmashtami",
    ("bhadrapada","shukla",4):"ganesh-chaturthi",
    ("ashvina","shukla",10): "vijayadashami",
    ("ashvina","krishna",14):"diwali",
    ("ashvina","krishna",15):"diwali",
    ("kartika","shukla",1):  "govardhan-puja",
    ("magha","krishna",14):  "mahashivaratri",
    ("phalguna","shukla",15):"holi",
}

# Alternate names that are useful for browse/search but must travel with the
# canonical festival slug when a hand-corrected observance date moves.
FESTIVAL_ALIASES = {
    "govardhan-puja": ["annakut"],
}

def festival_slugs(slug):
    return [slug, *FESTIVAL_ALIASES.get(slug, [])]

def festivals(masa, paksha, n, tamil_idx, nak_idx, adhika=False):
    # Nothing in this table is observed in an intercalary month.
    if adhika:
        return []
    out = []
    f = FESTIVALS.get((masa, paksha, n))
    if f: out.extend(festival_slugs(f))
    if masa == "bhadrapada" and paksha == "krishna": out.append("pitru-paksha")
    if masa == "ashvina" and paksha == "shukla" and n <= 9: out.append("navaratri")
    if tamil_idx == 7 and NAK[nak_idx] == "krithigai": out.append("karthigai-deepam")
    if tamil_idx == 8 and paksha == "shukla" and n == 11: out.append("vaikunta-ekadashi")
    return out

def day(d):
    jd = _jd(d)
    e = elong(d)
    t = int(e // 12)
    paksha = "shukla" if t < 15 else "krishna"
    n = t + 1 if t < 15 else t - 14
    ms = month_start(d)
    masa = MASA[(sun_rasi(ms) + 1) % 12]
    adhika = is_adhika(ms)
    nak_i = int(_lon(jd, swe.MOON) // (360 / 27)) % 27
    tm, td = tamil_month_day(d)
    return {
        "masa": masa,
        **({"adhika": True} if adhika else {}),
        # Purṇimānta (North Indian) names the dark fortnight after the next
        # month. Recorded so a festival sourced from a North Indian almanac
        # can still be matched without re-deriving anything.
        "masaN": MASA[((MASA.index(masa)) + 1) % 12] if paksha == "krishna" else masa,
        "paksha": paksha,
        "tithi": f"{paksha}-{TITHI[t]}",
        "tithiN": n,
        "nakshatra": NAK[nak_i],
        "tamil": TAMIL[tm], "tamilDay": td,
        "season": SEASON[tm],
        "festivals": festivals(masa, paksha, n, tm, nak_i, adhika),
    }

def apply_overrides(days, root):
    """Hand corrections win over the computation. See content/panchanga-overrides.json
    for why they are needed: this table places a festival by the tithi running at
    06:00, and real observance is fixed by madhyahna, nishita, pradosh or midnight
    depending on the festival."""
    path = os.path.join(root, "content", "panchanga-overrides.json")
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as fh:
        ov = json.load(fh).get("moveFestival") or {}
    moved = 0
    for slug, years_ in ov.items():
        for year, target in years_.items():
            slugs = festival_slugs(slug)
            changed = False
            for k, v in days.items():
                if not k.startswith(str(year)) or k == target:
                    continue
                for name in slugs:
                    while name in v["festivals"]:
                        v["festivals"].remove(name)
                        changed = True
            if target in days:
                for name in slugs:
                    if name not in days[target]["festivals"]:
                        days[target]["festivals"].append(name)
                        changed = True
            if changed:
                moved += 1
    return moved

years = int(sys.argv[1]) if len(sys.argv) > 1 else 4
start = datetime.date(datetime.date.today().year, 1, 1)
end = datetime.date(start.year + years, 1, 1)

days, order, d = {}, [], start
while d < end:
    k = d.isoformat()
    days[k] = day(d); order.append(k)
    d += datetime.timedelta(days=1)

# A tithi that begins and ends between two sunrises never shows up in a table
# sampled at 06:00 — it is "skipped" (kṣaya). The festival is still observed:
# the tithi was current during the previous day, so it belongs there. Without
# this, Govardhan Pūjā simply vanishes from some years.
def _runs():
    run, prev = [], None
    for k in order:
        v = days[k]
        cur = (v["masa"], v["paksha"])
        if cur != prev: run and (yield run); run = []
        run.append(k); prev = cur
    if run: yield run

repaired = 0
for run in _runs():
    masa, paksha = days[run[0]]["masa"], days[run[0]]["paksha"]
    for (m, pk, n), slug in FESTIVALS.items():
        if (m, pk) != (masa, paksha): continue
        if any(days[k]["tithiN"] == n for k in run): continue
        for i, k in enumerate(run):
            if days[k]["tithiN"] > n:
                # the day before the tithi was superseded
                target = run[i - 1] if i else order[max(0, order.index(k) - 1)]
                if slug not in days[target]["festivals"]:
                    for name in festival_slugs(slug):
                        if name not in days[target]["festivals"]:
                            days[target]["festivals"].append(name)
                    days[target]["skippedTithi"] = True
                    repaired += 1
                break
print(f"tithi-skip repairs: {repaired}")

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
moved = apply_overrides(days, root)
print(f"hand corrections applied: {moved}")
out = {
    "meta": {
        "engine": "Swiss Ephemeris (pyswisseph), Lahiri ayanāṃśa",
        "convention": "Tithi and nakshatra sampled at 06:00 IST; amānta lunar months; Chennai; adhika months carry no festivals",
        "sharedWith": "NalNaal (tamil-nal-app/generate_panchangam.py) — same engine, same conventions, on purpose",
        "generated": datetime.date.today().isoformat(),
        "from": start.isoformat(), "to": (end - datetime.timedelta(days=1)).isoformat(),
        "caveat": "Computed. A festival is placed on the day carrying its tithi at 06:00, which is NOT how observance is fixed — madhyahna, nishita, pradosh and midnight rules each move some of them by a day. content/panchanga-overrides.json is the correction layer and the source of truth; see its _candidates list for the known disagreements.",
    },
    "days": days,
}
with open(f"{root}/content/panchanga.json", "w") as fh:
    json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
print(f"panchanga: {len(days)} days, {start} to {end - datetime.timedelta(days=1)}")
