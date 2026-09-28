#!/usr/bin/env python3
"""data.py: bake the two data files the page falls back on when it is offline.

    docs/tide.json   the tide at NOAA station 9414290 (San Francisco, beside the bridge)
                     as eight turning wheels: NOAA's constituent speeds, with amplitudes
                     and phases fitted by least squares to NOAA's own 6-minute prediction
    docs/land.json   Natural Earth 1:110m land, rounded to 0.1 degree, for the globe

The page refits the wheels to the live prediction when it can reach NOAA.
    python3 tools/data.py
"""
import datetime as dt
import json
import math
import os
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
UA = {"User-Agent": "nanobotco-golden-gate/1.0"}
STATION = "9414290"
WHEELS = ["M2", "K1", "O1", "S2", "N2", "P1", "Q1", "K2"]


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))


def tide():
    h = get(f"https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/{STATION}/harcon.json?units=english")
    speed = {c["name"]: c["speed"] for c in h["HarmonicConstituents"]}
    now = dt.datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    a, b = now - dt.timedelta(days=15), now + dt.timedelta(days=15)
    p = get("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MHHW"
            f"&station={STATION}&time_zone=gmt&units=english&interval=6&format=json&application=nanobotco"
            f"&begin_date={a:%Y%m%d %H:%M}&end_date={b:%Y%m%d %H:%M}".replace(" ", "%20"))["predictions"]
    epoch = dt.datetime(2026, 1, 1, tzinfo=dt.timezone.utc).timestamp()
    t = np.array([(dt.datetime.strptime(r["t"], "%Y-%m-%d %H:%M").replace(tzinfo=dt.timezone.utc).timestamp() - epoch) / 3600
                  for r in p])
    y = np.array([float(r["v"]) for r in p])
    cols = [np.ones_like(t)]
    for n in WHEELS:
        w = math.radians(speed[n])
        cols += [np.cos(w * t), np.sin(w * t)]
    A = np.stack(cols, 1)
    x, *_ = np.linalg.lstsq(A, y, rcond=None)
    fit = A @ x
    out = {"station": STATION, "datum": "MHHW", "units": "ft", "epoch": "2026-01-01T00:00:00Z",
           "fitted": f"{a:%Y-%m-%d}..{b:%Y-%m-%d}", "rms_ft": round(float(np.sqrt(np.mean((fit - y) ** 2))), 3),
           "mean": round(float(x[0]), 4), "wheels": []}
    for i, n in enumerate(WHEELS):
        c, s = x[1 + 2 * i], x[2 + 2 * i]
        out["wheels"].append({"name": n, "speed": speed[n], "amp": round(float(math.hypot(c, s)), 4),
                              "phase": round(math.degrees(math.atan2(s, c)) % 360, 2)})
    json.dump(out, open(os.path.join(DOCS, "tide.json"), "w"), indent=1)
    print("tide.json rms", out["rms_ft"], "ft")


def land():
    g = get("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson")
    rings = []
    for f in g["features"]:
        geom = f["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        for poly in polys:
            r, last = [], None
            for lon, lat in poly[0]:
                q = (round(lon, 1), round(lat, 1))
                if q != last:
                    r += q
                    last = q
            if len(r) >= 8:
                rings.append(r)
    json.dump(rings, open(os.path.join(DOCS, "land.json"), "w"), separators=(",", ":"))
    print("land.json", len(rings), "rings")


if __name__ == "__main__":
    tide()
    land()
