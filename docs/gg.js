/* gg.js: the Golden Gate Bridge, drawn by arithmetic.
   Every shape here is computed. The cables are the parabola y = 470(x/2100)^2 feet over the
   real 4,200-foot main span; the side spans hang with the same pull, so their dip is
   470 x (1125/4200)^2. Sun, moon and stars sit where they are over the bridge at the scene's
   time (low-precision Meeus formulas). Weather is Open-Meteo, the water is NOAA station
   9414290 at the Presidio, the globe is Natural Earth.
   Test hooks: ?t=2026-09-28T02:10:00Z  ?fog=0.8  ?yaw=128 */
(function () {
"use strict";
var D = document, L = D.documentElement.lang === "th" ? "th" : "en";
function T(en, th) { return L === "th" ? th : en; }
var RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
var DPR = Math.min(window.devicePixelRatio || 1, 2);
var Q = new URLSearchParams(location.search), T0 = Q.get("t") ? Date.parse(Q.get("t")) : null, BOOT = Date.now();
function now() { return T0 ? new Date(T0 + (Date.now() - BOOT)) : new Date(); }
var BR = { lat: 37.8199, lon: -122.4783, ax: 354 };
var ROOT = D.documentElement.getAttribute("data-root") || "";
function $(id) { return D.getElementById(id); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function fmt(n, d) { d = d || 0; try { return n.toLocaleString(L === "th" ? "th-TH" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: d }); } catch (e) { return n.toFixed(d); } }
var PI = Math.PI, rad = PI / 180, sin = Math.sin, cos = Math.cos;
var FONT = '"Avenir Next",Avenir,"Segoe UI","Noto Sans Thai",Thonburi,system-ui,sans-serif';

/* ---- colour */
function hex(h) { var p = parseInt(h.slice(1), 16); return [(p >> 16) & 255, (p >> 8) & 255, p & 255]; }
function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c, a) { return a == null ? "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")" : "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a.toFixed(3) + ")"; }
function mul(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
/* International Orange from the District's CMYK 0/69/100/6: R=255(1-C)(1-K) and so on */
function cmyk(c, m, y, k) { return [255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k)]; }
var ORANGE = cmyk(0, 0.69, 1, 0.06);
var COATS = {
  orange: { a: ORANGE },
  grey: { a: hex("#8f877c") },
  aluminum: { a: hex("#c9cdd1") },
  black: { a: hex("#1d1d20") },
  navy: { a: hex("#1d1d20"), b: hex("#f2c230"), band: 34 }
};
var PAINT = COATS.orange;

/* ---- canvas + a loop that sleeps off screen */
function Canvas(cv) {
  var o = { cv: cv, cx: cv.getContext("2d"), W: 1, H: 1 };
  o.fit = function () { var r = cv.getBoundingClientRect(); o.W = Math.max(1, r.width); o.H = Math.max(1, r.height);
    cv.width = Math.round(o.W * DPR); cv.height = Math.round(o.H * DPR); o.cx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  o.fit(); return o;
}
function Loop(el, draw) {
  var on = false, raf = 0;
  function frame(t) { raf = 0; if (!on || D.hidden) return; draw(t / 1000); if (!RM) raf = requestAnimationFrame(frame); }
  function kick() { if (on && !raf) raf = requestAnimationFrame(frame); }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; kick(); }, { rootMargin: "120px" }).observe(el);
  else on = true;
  D.addEventListener("visibilitychange", kick);
  return { kick: kick };
}
function onResize(f) { var t; addEventListener("resize", function () { clearTimeout(t); t = setTimeout(f, 120); }); }

/* ---- astronomy (Meeus low precision; Astronomy Answers) */
var E = rad * 23.4397, asin = Math.asin, atan = Math.atan2, acos = Math.acos;
function days(d) { return d.valueOf() / 864e5 - 0.5 + 2440588 - 2451545; }
function ra(l, b) { return atan(sin(l) * cos(E) - Math.tan(b) * sin(E), cos(l)); }
function dec(l, b) { return asin(sin(b) * cos(E) + cos(b) * sin(E) * sin(l)); }
function sid(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
function sunC(d) { var M = rad * (357.5291 + 0.98560028 * d), C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), Lm = M + C + rad * 102.9372 + PI; return { dec: dec(Lm, 0), ra: ra(Lm, 0) }; }
function moonC(d) { var Lm = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.229350 * d), l = Lm + rad * 6.289 * sin(M), b = rad * 5.128 * sin(F); return { ra: ra(l, b), dec: dec(l, b), dist: 385001 - 20905 * cos(M) }; }
function pos(c, d, lat, lon) { var lw = rad * -lon, phi = rad * lat, H = sid(d, lw) - c.ra;
  return { alt: asin(sin(phi) * sin(c.dec) + cos(phi) * cos(c.dec) * cos(H)) / rad,
    az: (atan(sin(H), cos(H) * sin(phi) - Math.tan(c.dec) * cos(phi)) / rad + 180 + 360) % 360,
    pa: atan(sin(H), Math.tan(phi) * cos(c.dec) - sin(c.dec) * cos(H)) }; }
function sky(date) { var d = days(date), s = sunC(d), m = moonC(d), S = 149598000,
  ph = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)), inc = atan(S * sin(ph), m.dist - S * cos(ph)),
  ang = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra)),
  mp = pos(m, d, BR.lat, BR.lon);
  return { sun: pos(s, d, BR.lat, BR.lon), moon: mp, frac: (1 + cos(inc)) / 2, limb: ang - mp.pa, d: d }; }
/* alt/az to the bridge frame: x runs along the deck toward Marin (bearing 354), z toward the bay, y up */
function dirOf(alt, az) { var ce = cos(alt * rad), e = ce * sin(az * rad), n = ce * cos(az * rad), a = BR.ax * rad;
  return [e * sin(a) + n * cos(a), sin(alt * rad), e * cos(a) - n * sin(a)]; }
function compass(az) { var en = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
  th = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
  var i = Math.round(((az % 360) + 360) % 360 / 45) % 8; return L === "th" ? th[i] : en[i]; }
function bridgeClock(date) { try { return date.toLocaleTimeString(L === "th" ? "th-TH" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }); } catch (e) { return ""; } }

/* ---- live: Open-Meteo weather and sea, NOAA water */
var LIVE = { ok: false }, subs = [];
function onLive(f) { subs.push(f); if (LIVE.ok) f(LIVE); }
function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
var NOAA = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=9414290&time_zone=gmt&units=english&format=json&application=nanobotco";
var TIDE = null;
function tideAt(ms) { if (!TIDE) return null; var h = (ms - TIDE.t0) / 36e5, y = TIDE.mean;
  for (var i = 0; i < TIDE.w.length; i++) { var w = TIDE.w[i]; y += w.amp * cos(w.om * h - w.ph); } return y; }
function useTide(j) { TIDE = { t0: Date.parse(j.epoch), mean: j.mean, rms: j.rms_ft, live: !!j.live,
  w: j.wheels.map(function (w) { return { name: w.name, amp: w.amp, om: w.speed * rad, ph: w.phase * rad, speed: w.speed }; }) }; }
/* least squares: the same wheel speeds, fitted to NOAA's live six-minute prediction */
function refit(pred, base) {
  var t0 = Date.parse(base.epoch), n = 1 + 2 * base.wheels.length, A = [], b = [], i, j, k;
  for (i = 0; i < n; i++) { A.push(new Float64Array(n)); b.push(0); }
  var row = new Float64Array(n);
  pred.forEach(function (p) {
    var h = (Date.parse(p.t.replace(" ", "T") + ":00Z") - t0) / 36e5, y = +p.v; row[0] = 1;
    base.wheels.forEach(function (w, q) { var a = w.speed * rad * h; row[1 + 2 * q] = cos(a); row[2 + 2 * q] = sin(a); });
    for (i = 0; i < n; i++) { b[i] += row[i] * y; for (j = 0; j < n; j++) A[i][j] += row[i] * row[j]; }
  });
  for (i = 0; i < n; i++) { var m = i; for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k;
    var t = A[i]; A[i] = A[m]; A[m] = t; var tb = b[i]; b[i] = b[m]; b[m] = tb;
    for (k = i + 1; k < n; k++) { var f = A[k][i] / A[i][i]; for (j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  var x = new Float64Array(n); for (i = n - 1; i >= 0; i--) { var s = b[i]; for (j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  var out = { epoch: base.epoch, mean: x[0], live: true, wheels: base.wheels.map(function (w, q) { var c = x[1 + 2 * q], s = x[2 + 2 * q];
    return { name: w.name, speed: w.speed, amp: Math.hypot(c, s), phase: (atan(s, c) / rad + 360) % 360 }; }) };
  var se = 0; useTide(out); pred.forEach(function (p) { var e = tideAt(Date.parse(p.t.replace(" ", "T") + ":00Z")) - +p.v; se += e * e; });
  out.rms_ft = Math.sqrt(se / pred.length); useTide(out); return out;
}
function ymd(d) { return d.toISOString().slice(0, 10).replace(/-/g, ""); }
var tideReady = getJSON(ROOT + "tide.json").then(function (j) {
  useTide(j);
  var a = new Date(Date.now() - 2 * 864e5), b = new Date(Date.now() + 3 * 864e5);
  return getJSON(NOAA + "&product=predictions&datum=MHHW&interval=6&begin_date=" + ymd(a) + "&end_date=" + ymd(b)).then(function (p) {
    LIVE.pred = p.predictions; refit(p.predictions, j); }).catch(function () {});
}).catch(function () {});
Promise.all([
  getJSON("https://api.open-meteo.com/v1/forecast?latitude=37.8199&longitude=-122.4783&current=temperature_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high&wind_speed_unit=mph&timezone=GMT").catch(function () { return null; }),
  getJSON("https://marine-api.open-meteo.com/v1/marine?latitude=37.81&longitude=-122.53&current=sea_surface_temperature&timezone=GMT").catch(function () { return null; }),
  getJSON(NOAA + "&product=water_level&date=latest&datum=MHHW").catch(function () { return null; }),
  tideReady
]).then(function (r) {
  var w = r[0] && r[0].current, m = r[1] && r[1].current, wl = r[2] && r[2].data && r[2].data[0];
  LIVE.w = w; LIVE.sst = m ? m.sea_surface_temperature : null;
  LIVE.level = wl ? +wl.v : null; LIVE.levelT = wl ? Date.parse(wl.t.replace(" ", "T") + ":00Z") : null;
  if (w) { var v = w.visibility, sp = w.temperature_2m - w.dew_point_2m;
    var fv = v == null ? 0 : clamp(1 - Math.log(Math.max(v, 150) / 300) / Math.log(24000 / 300), 0, 1);
    var fl = (w.cloud_cover_low || 0) / 100 * sstep(4, 0.5, sp);
    LIVE.fog = clamp(Math.max(fv, fl * 0.85), 0, 1);
    LIVE.cloud = clamp(((w.cloud_cover_mid || 0) + (w.cloud_cover_high || 0)) / 140, 0, 1); }
  LIVE.ok = true; subs.forEach(function (f) { f(LIVE); });
});
function levelNow() { var t = tideAt(Date.now()); if (t != null) return t; return LIVE.level != null ? LIVE.level : -2.6; }

/* ---- sound: the four recorded notes, and the foghorn patterns */
var AC = null, SING = null, HORNS = null, ringHooks = [];
function ac() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === "suspended") AC.resume(); return AC; }
var NOTES = [354, 398, 439, 481];
function singStart() {
  var a = ac(); if (!a || SING) return; var out = a.createGain(); out.gain.value = 0; out.connect(a.destination);
  var vs = NOTES.map(function (f, i) { var o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f; lfo.frequency.value = 0.17 + i * 0.09; lg.gain.value = 0.5;
    g.gain.value = 0.5; lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(out); o.start(); lfo.start(); return { o: o, lfo: lfo }; });
  SING = { out: out, vs: vs }; singLevel(SING_WIND);
}
function singStop() { if (!SING) return; var s = SING; SING = null; s.out.gain.setTargetAtTime(0, AC.currentTime, 0.2);
  setTimeout(function () { s.vs.forEach(function (v) { v.o.stop(); v.lfo.stop(); }); s.out.disconnect(); }, 1200); }
var SING_WIND = 0;
function singLevel(mph) { SING_WIND = mph; if (!SING) return; var g = 0.03 + 0.1 * sstep(18, 30, mph);
  SING.out.gain.setTargetAtTime(g, AC.currentTime, 0.4); SING.vs.forEach(function (v, i) { v.o.detune.setTargetAtTime((mph - 25) * 0.8 + i, AC.currentTime, 0.5); }); }
/* the District's timing: south tower 2 s on, 18 s off; mid-span 9 s pause, then 1 s, 2 s pause, 1 s, 36 s pause.
   The pitches are stand-ins; the Coast Guard sets the real ones and charts list them. */
function blast(when, dur, f, gain, where) {
  var a = AC, o = a.createOscillator(), o2 = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain();
  o.type = "sawtooth"; o2.type = "square"; o.frequency.value = f; o2.frequency.value = f * 1.004; lp.type = "lowpass"; lp.frequency.value = f * 3.2; lp.Q.value = 3;
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(gain, when + 0.12); g.gain.setValueAtTime(gain, when + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.25);
  o.frequency.setValueAtTime(f * 0.96, when); o.frequency.linearRampToValueAtTime(f, when + 0.25);
  o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(a.destination); o.start(when); o2.start(when); o.stop(when + dur + 0.3); o2.stop(when + dur + 0.3);
  setTimeout(function () { ringHooks.forEach(function (h) { h(where, dur); }); }, Math.max(0, (when - a.currentTime) * 1000));
}
function hornsStart() {
  var a = ac(); if (!a || HORNS) return; var t0 = a.currentTime + 0.1, next = 0;
  function plan() { if (!HORNS) return; var horizon = a.currentTime + 45;
    while (t0 + next < horizon) { var c = t0 + next; blast(c, 2, 110, 0.22, "south"); blast(c + 20, 2, 110, 0.22, "south");
      blast(c + 9, 1, 196, 0.12, "mid"); blast(c + 12, 1, 262, 0.1, "mid"); next += 40; }
    HORNS.timer = setTimeout(plan, 5000); }
  HORNS = {}; plan();
}
function hornsStop() { if (!HORNS) return; clearTimeout(HORNS.timer); HORNS = null; if (AC) { AC.close(); AC = null; SING = null; } }
function toggleBtn(b, on) { if (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); } }

/* ======================================================================= HERO */
(function hero() {
  var cv = $("gg-hero"); if (!cv) return;
  var C = Canvas(cv), cx = C.cx, bc = D.createElement("canvas"), bx = bc.getContext("2d"), rc = D.createElement("canvas"), rx = rc.getContext("2d");
  var st = { off: 0, fog: Q.get("fog") != null ? +Q.get("fog") : null, wind: null, yaw: Q.get("yaw") != null ? +Q.get("yaw") : 66, drag: 0 };
  var fogLive = 0.35, windLive = 8, S = null, lastS = 0, lastB = -1, W, H, F, X0, Y0, cam = {}, f3, r3, u3;
  var lamps = [], beacons = [], stars = [], blobs = [], birds = [], rings = [], boats = [];
  function size() { C.fit(); W = C.W; H = C.H; [bc, rc].forEach(function (c) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    bx.setTransform(DPR, 0, 0, DPR, 0, 0); rx.setTransform(DPR, 0, 0, DPR, 0, 0); lastB = -1; }
  size(); onResize(function () { size(); loop.kick(); });

  /* random but seeded, so the card and the page agree */
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (var i = 0; i < 420; i++) stars.push({ ra: rnd() * 2 * PI, dec: asin(rnd() * 1.9 - 0.9), m: Math.pow(rnd(), 3), p: rnd() * 7 });
  stars.push({ ra: 37.95 * rad, dec: 89.26 * rad, m: 0.75, p: 0 }); /* Polaris: the one that holds still */
  for (i = 0; i < 90; i++) blobs.push({ x: lerp(-9000, 9000, rnd()), z: lerp(-12000, 12000, rnd()), y: rnd(), r: lerp(500, 1500, rnd()), s: lerp(0.6, 1.4, rnd()) });
  for (i = 0; i < 7; i++) birds.push({ k: i, ph: rnd() * 6 });
  var clouds = [], cloudLive = Q.get("cloud") != null ? +Q.get("cloud") : 0.35;
  for (i = 0; i < 16; i++) { var pf = []; for (var j = 0; j < 7; j++) pf.push({ dx: (rnd() - 0.5) * 2.2, dy: (rnd() - 0.5) * 0.35, r: 0.35 + rnd() * 0.55 });
    clouds.push({ az: rnd() * 360, alt: 6 + Math.pow(rnd(), 1.6) * 34, w: 0.6 + rnd() * 1.2, pf: pf, o: rnd() }); }
  boats = [{ kind: "sail", x: 700, z0: -2500, v: 26, len: 40, h: 55 }, { kind: "ship", x: -600, z0: -16000, v: 40, len: 900, h: 190 }];

  /* fog sprite */
  var fs = D.createElement("canvas"); fs.width = fs.height = 128; (function () { var g = fs.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); })();

  /* ---- camera */
  function setCam(yaw) {
    var narrow = W / H < 1.1; if (narrow) yaw -= 50; var dist = narrow ? 4300 : 5400, a = (yaw - BR.ax) * rad, tx = narrow ? -500 : 700, ty = narrow ? 470 : 400;
    cam.x = cos(a) * dist + tx; cam.z = sin(a) * dist; cam.y = narrow ? 70 : 55;
    var fx = tx - cam.x, fy = ty - cam.y, fz = -cam.z, n = Math.hypot(fx, fy, fz); f3 = [fx / n, fy / n, fz / n];
    var rn = Math.hypot(f3[2], f3[0]); r3 = [-f3[2] / rn, 0, f3[0] / rn];
    u3 = [-r3[2] * f3[1], r3[2] * f3[0] - r3[0] * f3[2], r3[0] * f3[1]];
    var fov = narrow ? 64 : 58; F = (W / 2) / Math.tan(fov * rad / 2); X0 = W * (narrow ? 0.5 : 0.64); Y0 = H * (narrow ? 0.64 : 0.5);
  }
  var MW = null; /* mirror the world in the water plane at this height */
  function P(x, y, z) { if (MW !== null) y = 2 * MW - y; var dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, c = dx * f3[0] + dy * f3[1] + dz * f3[2];
    if (c < 60) return null; return { X: X0 + (dx * r3[0] + dz * r3[2]) * F / c, Y: Y0 - (dx * u3[0] + dy * u3[1] + dz * u3[2]) * F / c, z: c }; }
  function Pd(v) { var c = v[0] * f3[0] + v[1] * f3[1] + v[2] * f3[2]; if (c < 0.02) return null;
    return { X: X0 + (v[0] * r3[0] + v[2] * r3[2]) * F / c, Y: Y0 - (v[0] * u3[0] + v[1] * u3[1] + v[2] * u3[2]) * F / c }; }

  /* ---- the bridge, in feet */
  var TW = 2100, SIDE = 1125, SAG = 470, SAG2 = SAG * Math.pow(SIDE / (2 * TW), 2), CZ = 45, ANCH = 255;
  /* side-span dip: same horizontal pull and load, so dip scales with span squared: 470 x (1125/4200)^2 = 33.7 ft */
  function cableY(x) { var ax = Math.abs(x); if (ax <= TW) return 276 + SAG * (x / TW) * (x / TW);
    var s = (ax - TW) / SIDE; return lerp(746, ANCH, s) - 4 * SAG2 * s * (1 - s); }
  var sway = 0;
  function swayZ(x) { var ax = Math.abs(x); return ax < TW ? sway * cos(PI * x / (2 * TW)) : 0; }

  var prims = [];
  function prim(z, f) { prims.push({ z: z, f: f }); }
  function line(ctx, a, b, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke(); }
  function quad(ctx, p, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p[0].X, p[0].Y); for (var i = 1; i < 4; i++) ctx.lineTo(p[i].X, p[i].Y); ctx.closePath(); ctx.fill(); }

  function build(ctx, env) {
    prims.length = 0; var sd = env.sunDir, day = env.day, night = env.night, fog = env.fog, amb = env.amb;
    var base = PAINT.a, alt = PAINT.b;
    function tone(c, n, depth, y) { var k = 0.42 + 0.22 * amb + 0.5 * day * Math.max(0, n[0] * sd[0] + n[1] * sd[1] + n[2] * sd[2]);
      var col = mul(c, k); if (night > 0) { var fl = night * (0.35 + 0.45 * clamp((y - 250) / 500, 0, 1)); col = mixc(col, mul(c, 1.25), fl); }
      var haze = clamp(depth / 26000, 0, 0.6) + fog * clamp(depth / 9000, 0, 0.75) * (y < env.fogTop ? 1 : 0.35);
      return rgb(mixc(col, env.haze, clamp(haze, 0, 0.9))); }
    function box(x0, x1, y0, y1, z0, z1, striped) {
      var cxm = (x0 + x1) / 2, czm = (z0 + z1) / 2;
      var faces = [[[1, 0, 0], x1, "x"], [[-1, 0, 0], x0, "x"], [[0, 0, 1], z1, "z"], [[0, 0, -1], z0, "z"]];
      faces.forEach(function (fc) { var n = fc[0], fx = fc[2] === "x" ? fc[1] : cxm, fz = fc[2] === "z" ? fc[1] : czm;
        if ((cam.x - fx) * n[0] + (cam.z - fz) * n[2] <= 0) return;
        var bands = striped && alt ? Math.max(1, Math.round((y1 - y0) / PAINT.band)) : 1;
        for (var k = 0; k < bands; k++) { (function (k) {
          var ya = lerp(y0, y1, k / bands), yb = lerp(y0, y1, (k + 1) / bands), q;
          if (fc[2] === "x") q = [P(fx, ya, z0), P(fx, ya, z1), P(fx, yb, z1), P(fx, yb, z0)];
          else q = [P(x0, ya, fz), P(x1, ya, fz), P(x1, yb, fz), P(x0, yb, fz)];
          if (!q[0] || !q[1] || !q[2] || !q[3]) return;
          var col = tone(k % 2 && alt ? alt : base, n, (q[0].z + q[2].z) / 2, (ya + yb) / 2);
          prim((q[0].z + q[1].z + q[2].z + q[3].z) / 4 + 2, function (c) { quad(c, q, col); c.strokeStyle = col; c.lineWidth = 0.6; c.stroke(); });
        })(k); }
      });
    }
    /* towers: two legs with deco setbacks, portal struts that shrink as they climb */
    var SEG = [[0, 245, 27, 16.5], [245, 452, 24, 15], [452, 583, 21.5, 13.5], [583, 700, 19, 12], [700, 746, 17, 11]];
    var STRUT = [[300, 332, 13], [452, 478, 11], [583, 606, 10], [700, 738, 9]];
    [-TW, TW].forEach(function (xt) {
      [-CZ, CZ].forEach(function (zl) { SEG.forEach(function (s) { box(xt - s[2], xt + s[2], s[0], s[1], zl - s[3], zl + s[3], true); }); });
      STRUT.forEach(function (s) { box(xt - s[2], xt + s[2], s[0], s[1], -CZ + 12, CZ - 12, true); });
      box(xt - 30, xt + 30, -10, 30, -70, 70, false); /* pier */
      for (var k = 0; k < 3; k++) { var ya = 40 + k * 60, yb = ya + 60; (function (ya, yb) { /* X bracing under the deck */
        [[-CZ, ya, CZ, yb], [-CZ, yb, CZ, ya]].forEach(function (d) { var a = P(xt, d[1], d[0]), b = P(xt, d[3], d[2]); if (!a || !b) return;
          var col = tone(base, [0, 0, 1], a.z, ya); prim((a.z + b.z) / 2 + 1, function (c) { line(c, a, b, Math.max(0.8, 7 * F / a.z), col); }); }); })(ya, yb); }
    });
    /* cables, suspenders every 50 ft, stiffening truss every 25 ft */
    [-CZ, CZ].forEach(function (zc) {
      for (var x = -TW - SIDE; x < TW + SIDE; x += 25) { (function (x) {
        var x2 = x + 25, a = P(x, cableY(x), zc + swayZ(x)), b = P(x2, cableY(x2), zc + swayZ(x2)); if (!a || !b) return;
        var col = tone(base, [0, 0.6, zc > 0 ? 0.8 : -0.8], a.z, cableY(x)), w = Math.max(1, 3.1 * F / a.z);
        prim((a.z + b.z) / 2, function (c) { line(c, a, b, w, col); }); })(x); }
      for (x = -TW - SIDE + 50; x < TW + SIDE; x += 50) { (function (x) { if (Math.abs(Math.abs(x) - TW) < 30) return;
        var a = P(x, cableY(x), zc + swayZ(x)), b = P(x, 250, zc + swayZ(x)); if (!a || !b) return;
        var col = tone(base, [0, 0, zc > 0 ? 1 : -1], a.z, 400); prim(a.z - 1, function (c) { line(c, a, b, Math.max(0.35, 0.9 * F / a.z), col); }); })(x); }
      for (x = -3900; x < 3700; x += 25) { (function (x, k) {
        var z = zc + swayZ(x), t1 = P(x, 250, z), t2 = P(x + 25, 250, z), b1 = P(x, 220, z), b2 = P(x + 25, 220, z); if (!t1 || !t2 || !b1 || !b2) return;
        var col = tone(base, [0, 0, zc > 0 ? 1 : -1], t1.z, 235), w = Math.max(0.7, 2.4 * F / t1.z), dark = rgb(mul(env.haze, 0.35));
        prim((t1.z + t2.z) / 2 + (zc * (cam.z > 0 ? -1 : 1) > 0 ? 3 : -3), function (c) {
          c.fillStyle = dark; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(t1.X, t1.Y); c.lineTo(t2.X, t2.Y); c.lineTo(b2.X, b2.Y); c.lineTo(b1.X, b1.Y); c.fill(); c.globalAlpha = 1;
          c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(t1.X, t1.Y); c.lineTo(t2.X, t2.Y); c.moveTo(b1.X, b1.Y); c.lineTo(b2.X, b2.Y);
          c.moveTo(t1.X, t1.Y); c.lineTo(b1.X, b1.Y); if (k % 2) { c.moveTo(t1.X, t1.Y); c.lineTo(b2.X, b2.Y); } else { c.moveTo(b1.X, b1.Y); c.lineTo(t2.X, t2.Y); } c.stroke(); });
      })(x, Math.round(x / 25)); }
    });
    /* the road itself, a thin dark ribbon, and Morrow's lamps */
    for (var x = -3900; x < 3700; x += 50) { (function (x) {
      var q = [P(x, 252, -CZ + swayZ(x)), P(x + 50, 252, -CZ + swayZ(x + 50)), P(x + 50, 252, CZ + swayZ(x + 50)), P(x, 252, CZ + swayZ(x))]; if (!q[0] || !q[1] || !q[2] || !q[3]) return;
      var col = rgb(mixc([58, 58, 64], env.haze, 0.35 + 0.3 * fog)); prim((q[0].z + q[2].z) / 2 - 2, function (c) { quad(c, q, col); }); })(x); }
    prims.sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < prims.length; i++) prims[i].f(ctx);
  }
  function lightsList() {
    lamps.length = 0; beacons.length = 0;
    for (var x = -3200; x <= 3200; x += 100) [-CZ - 3, CZ + 3].forEach(function (z) { var p = P(x, 266, z + swayZ(x)); if (p) lamps.push(p); });
    [-TW, TW].forEach(function (xt) { [-CZ, CZ].forEach(function (z) { var p = P(xt, 752, z); if (p) beacons.push({ p: p, k: 0 }); }); });
    for (var k = 1; k <= 8; k++) { var xx = -TW + k * (2 * TW / 9); [-CZ, CZ].forEach(function (z) { var p = P(xx, cableY(xx) + 3, z + swayZ(xx)); if (p) beacons.push({ p: p, k: 1 }); }); }
    var g = P(0, 214, CZ + 4), w = P(0, 214, -CZ - 4); if (g) beacons.push({ p: g, k: 2 }); if (w) beacons.push({ p: w, k: 3 });
  }

  /* ---- land: the Marin Headlands, Mount Tamalpais, the Presidio; world feet */
  var RIDGES = [
    { far: 1, pts: [[26000, -30000, 900], [23000, -16000, 1900], [24000, -9000, 2571], [22000, -2000, 2100], [21000, 6000, 1200], [22000, 14000, 700], [26000, 26000, 400]] },
    { pts: [[4200, -13000, 250], [4800, -8000, 600], [4700, -5200, 820], [4300, -3200, 920], [3900, -1600, 700], [3500, -500, 380], [3350, 200, 240], [3700, 1200, 330], [4300, 2600, 520], [5200, 4200, 560], [6500, 6000, 380], [8000, 8500, 160], [9000, 10000, 60]] },
    { pts: [[-3700, -14000, 60], [-3600, -7000, 220], [-3800, -3500, 260], [-3450, -900, 150], [-3500, 800, 110], [-3900, 2600, 160], [-4600, 4400, 220], [-6000, 6500, 120], [-8000, 9000, 60]] }
  ];
  function ridge(ctx, rg, env, wl) {
    /* densify, then keep only what is comfortably in front of the camera, one run at a time */
    var pts = [], i, k;
    for (i = 1; i < rg.pts.length; i++) for (k = 0; k < 6; k++) { var p0 = rg.pts[i - 1], p1 = rg.pts[i], f = k / 6;
      pts.push([lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), lerp(p0[2], p1[2], f)]); }
    pts.push(rg.pts[rg.pts.length - 1]);
    var run = [];
    pts.forEach(function (p) { var a = P(p[0], p[2], p[1]), b = P(p[0], wl, p[1]); if (a && b && a.z > 2600) run.push([a, b]); else { if (run.length > 1) fillRun(ctx, run, rg, env); run = []; } });
    if (run.length > 1) fillRun(ctx, run, rg, env);
  }
  function fillRun(ctx, run, rg, env) {
    var top = run.map(function (q) { return q[0]; }), bot = run.map(function (q) { return q[1]; });
    var dep = top[Math.floor(top.length / 2)].z, col = rg.far ? mixc(env.land, env.haze, 0.62) : mixc(env.land, env.haze, clamp(dep / 30000, 0.05, 0.5) + env.fog * 0.25);
    var gy = Math.min.apply(null, top.map(function (p) { return p.Y; })), by = Math.max.apply(null, bot.map(function (p) { return p.Y; }));
    var gr = ctx.createLinearGradient(0, gy, 0, by); gr.addColorStop(0, rgb(mixc(mul(col, 1.15), hex("#ffd28a"), rg.far ? 0 : 0.18 * env.day))); gr.addColorStop(0.45, rgb(col)); gr.addColorStop(1, rgb(mul(col, 0.62)));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(top[0].X, top[0].Y);
    for (var i = 1; i < top.length; i++) { var m = top[i - 1], n = top[i]; ctx.quadraticCurveTo(m.X, m.Y, (m.X + n.X) / 2, (m.Y + n.Y) / 2); }
    ctx.lineTo(top[top.length - 1].X, top[top.length - 1].Y);
    for (i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].X, bot[i].Y); ctx.closePath(); ctx.fill();
  }

  /* ---- sky: colour keyed to the sun's altitude */
  var K = [[-18, "#050716", "#131a3c", "#1b1f3a"], [-10, "#0c1238", "#2e2a63", "#2a2352"], [-5, "#1f2b6e", "#b3547a", "#5b3f72"], [-1, "#35469a", "#ff8a5c", "#c45c66"],
    [3, "#4a73c4", "#ffb86b", "#e79a6a"], [10, "#3f86d6", "#ffd9a8", "#b8cbe0"], [25, "#2f7fd8", "#bfe0f7", "#c9d9e6"], [60, "#236fd0", "#a9d5f5", "#cfe0ea"]];
  function skyAt(alt) { if (alt <= K[0][0]) return K[0].slice(1).map(hex); for (var i = 1; i < K.length; i++) if (alt <= K[i][0]) { var f = (alt - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
    return [1, 2, 3].map(function (j) { return mixc(hex(K[i - 1][j]), hex(K[i][j]), f); }); } return K[K.length - 1].slice(1).map(hex); }

  function drawMoon(ctx, p, frac, limb, day, r) {
    var g = ctx.createRadialGradient(p.X, p.Y, r * 0.6, p.X, p.Y, r * 5); g.addColorStop(0, "rgba(255,244,214," + (day ? 0.06 : 0.22) + ")"); g.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.X, p.Y, r * 5, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(p.X, p.Y); ctx.rotate(-PI / 2 - limb);
    ctx.fillStyle = day ? "rgba(255,255,255,.1)" : "rgba(40,36,70,.85)"; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    var k = 1 - 2 * frac, h = PI / 2; ctx.fillStyle = day ? "rgba(255,255,255,.85)" : "#fff3d6"; ctx.beginPath(); ctx.arc(0, 0, r, -h, h, false); ctx.ellipse(0, 0, Math.abs(k) * r, r, 0, h, -h, k > 0); ctx.fill(); ctx.restore();
  }

  function envAt(date) {
    if (!S || Math.abs(date - lastS) > 20000) { S = sky(date); lastS = +date; }
    var sa = S.sun.alt, c = skyAt(sa), fog = st.fog != null ? st.fog : fogLive;
    var day = sstep(-4, 8, sa), night = 1 - sstep(-7, -1, sa), amb = sstep(-12, 20, sa);
    var land = mixc(mixc(hex("#0b1026"), hex("#3c3a52"), sstep(-10, 0, sa)), hex("#8f8a52"), day);
    land = mixc(land, hex("#c98a5a"), day * (1 - sstep(2, 14, sa)) * 0.5);
    var fogc = mixc(mixc(hex("#2a2f52"), hex("#f4c7b0"), sstep(-8, 0, sa)), hex("#f4f5f7"), sstep(4, 20, sa));
    return { S: S, sa: sa, top: c[0], hor: c[1], haze: c[2], fog: fog, day: day, night: night, amb: amb, land: land, fogc: fogc,
      sunDir: dirOf(sa, S.sun.az), fogTop: 180 + 620 * fog };
  }

  var tPrev = 0, zBoat = [0, 0];
  function draw(t) {
    var dt = Math.min(0.1, t - (tPrev || t)); tPrev = t;
    var date = new Date(now().getTime() + st.off * 36e5), env = envAt(date);
    var wind = st.wind != null ? st.wind : windLive;
    var yaw = st.yaw + (RM ? 0 : 9 * sin(t / 38)) + st.drag;
    setCam(yaw);
    sway = (RM ? 0 : sin(t * 0.55) * 0.7 + sin(t * 0.21) * 0.3) * 27.7 * 2.2 * sstep(8, 68, wind);
    var wl = levelNow();

    /* sky */
    var g = cx.createLinearGradient(0, 0, 0, Y0 + 10); g.addColorStop(0, rgb(env.top)); g.addColorStop(1, rgb(env.hor)); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    var horizon = Pd([f3[0], 0, f3[2]]), hy = horizon ? horizon.Y : Y0;
    var sp = Pd(env.sunDir);
    if (sp && env.sa > -8) { var gr = cx.createRadialGradient(sp.X, sp.Y, 0, sp.X, sp.Y, W * 0.7), warm = env.sa < 12 ? "255,150,90" : "255,245,220";
      gr.addColorStop(0, "rgba(" + warm + "," + (0.55 * sstep(-8, 0, env.sa)).toFixed(2) + ")"); gr.addColorStop(1, "rgba(" + warm + ",0)"); cx.fillStyle = gr; cx.fillRect(0, 0, W, H); }
    var dark = 1 - sstep(-14, -3, env.sa);
    if (dark > 0.02) { for (var i = 0; i < stars.length; i++) { var s = stars[i], o = pos(s, env.S.d, BR.lat, BR.lon); if (o.alt < 1) continue;
        var p = Pd(dirOf(o.alt, o.az)); if (!p || p.Y > hy) continue; var tw = RM ? 0.8 : 0.6 + 0.4 * sin(t * 1.7 + s.p * 9);
        var a = Math.min(1, dark * tw * (0.5 + 0.9 * s.m) * (1 - env.fog * 0.5)); cx.fillStyle = "rgba(255,250,240," + a.toFixed(3) + ")"; var r = 0.8 + s.m * 2; cx.fillRect(p.X - r / 2, p.Y - r / 2, r, r); } }
    var mp = Pd(dirOf(env.S.moon.alt, env.S.moon.az));
    if (mp && env.S.moon.alt > -3 && mp.Y < hy + 2) drawMoon(cx, mp, env.S.frac, env.S.limb, env.sa > 0, Math.max(9, W * 0.012));
    if (sp && env.sa > -3 && sp.Y < hy + 6) { var rs = Math.max(12, W * 0.016), low = env.sa < 8, sg = cx.createRadialGradient(sp.X, sp.Y, rs * 0.5, sp.X, sp.Y, rs * 6);
      sg.addColorStop(0, low ? "rgba(255,190,110,.7)" : "rgba(255,252,230,.8)"); sg.addColorStop(1, "rgba(255,200,120,0)"); cx.fillStyle = sg; cx.beginPath(); cx.arc(sp.X, sp.Y, rs * 6, 0, 7); cx.fill();
      cx.fillStyle = low ? "#ffc27a" : "#fffbe9"; cx.beginPath(); cx.arc(sp.X, sp.Y, rs, 0, 7); cx.fill(); }

    /* the city's glow on the horizon at night, toward downtown (bearing 110) */
    if (env.night > 0.1) { var cg = Pd(dirOf(0.6, 110)); if (cg) { var cr = W * 0.35, gg2 = cx.createRadialGradient(cg.X, 0, 0, cg.X, 0, cr);
      gg2.addColorStop(0, "rgba(255,170,110," + (0.35 * env.night).toFixed(2) + ")"); gg2.addColorStop(1, "rgba(255,150,90,0)");
      cx.save(); cx.translate(0, hy); cx.scale(1, 0.4); cx.fillStyle = gg2; cx.fillRect(cg.X - cr, -cr, cr * 2, cr); cx.restore(); } }
    cloudsDraw(env, t, hy);
    /* water */
    var wg = cx.createLinearGradient(0, hy, 0, H), deep = mixc(mixc(hex("#040a1c"), hex("#1d3f6e"), env.day), hex("#0d5a78"), env.day * 0.6);
    wg.addColorStop(0, rgb(mixc(env.hor, env.haze, 0.3))); wg.addColorStop(0.35, rgb(mixc(deep, env.hor, 0.35))); wg.addColorStop(1, rgb(mul(deep, 0.8)));
    cx.fillStyle = wg; cx.fillRect(0, hy, W, H - hy);

    /* land, far to near */
    RIDGES.forEach(function (rg) { ridge(cx, rg, env, wl); });

    /* far fog */
    var bs = cam.z > 0 ? 1 : -1;
    fogDraw(env, t, dt, wind, function (b) { return b.z * bs < 0; });

    /* boats behind */
    boatsDraw(env, t, wl, -bs);

    /* the bridge and its reflection, redrawn at most 24 times a second */
    if (t - lastB > (RM ? 0 : 0.04) || lastB < 0) { lastB = t;
      bx.clearRect(0, 0, W, H); build(bx, env); lightsList();
      rx.clearRect(0, 0, W, H); MW = wl; build(rx, env); MW = null; }
    for (var y = Math.floor(hy); y < H; y += 3) { var k = (y - hy) / (H - hy), dx = RM ? 0 : sin(y * 0.09 + t * 1.6) * (1 + 6 * k);
      cx.globalAlpha = 0.34 * (1 - k * 0.6) * (1 - env.fog * 0.5); cx.drawImage(rc, 0, y * DPR, W * DPR, 3 * DPR, dx, y, W, 3); }
    cx.globalAlpha = 1;
    /* glitter under the sun or moon */
    var gl = sp && env.sa > -2 ? { p: sp, c: env.sa < 10 ? "255,196,120" : "255,250,230", a: 0.9 } : mp && env.S.moon.alt > 0 && env.night > 0.5 ? { p: mp, c: "255,244,214", a: 0.55 * env.S.frac } : null;
    if (gl) { for (i = 0; i < 160; i++) { var yy = hy + 2 + Math.pow((i + 1) / 160, 1.6) * (H - hy), spread = 6 + (yy - hy) * 0.35,
        xx = gl.p.X + spread * sin(i * 12.9898 + (RM ? 0 : t * (0.6 + (i % 7) * 0.13))) * 1.2, al = gl.a * (0.3 + 0.7 * Math.abs(sin(i * 3.3 + (RM ? 0 : t * 2.1))));
        cx.fillStyle = "rgba(" + gl.c + "," + (al * (1 - env.fog * 0.6)).toFixed(3) + ")"; cx.fillRect(xx, yy, 2 + spread * 0.12, 1.2); } }
    /* ripples */
    cx.strokeStyle = "rgba(255,255,255," + (0.05 + 0.08 * env.day).toFixed(3) + ")"; cx.lineWidth = 1; cx.beginPath();
    for (i = 0; i < 70; i++) { var ry = hy + Math.pow(((i * 0.618) % 1), 1.8) * (H - hy), rl = 8 + (ry - hy) * 0.12, rx0 = ((i * 97.3 + (RM ? 0 : t * (8 + i % 5))) % (W + 60)) - 30; cx.moveTo(rx0, ry); cx.lineTo(rx0 + rl, ry); }
    cx.stroke();

    cx.drawImage(bc, 0, 0, W, H);

    /* lights at night */
    if (env.night > 0.05) { var ln = env.night;
      lamps.forEach(function (p) { var r = Math.max(1.2, 70 * F / p.z * 0.06); var lg = cx.createRadialGradient(p.X, p.Y, 0, p.X, p.Y, r * 5); lg.addColorStop(0, "rgba(255,210,140," + (0.9 * ln).toFixed(2) + ")"); lg.addColorStop(1, "rgba(255,180,90,0)"); cx.fillStyle = lg; cx.fillRect(p.X - r * 5, p.Y - r * 5, r * 10, r * 10); });
      var on = RM ? 1 : (Math.floor(t * 0.8) % 2 ? 1 : 0.25);
      beacons.forEach(function (b) { var c = b.k === 2 ? "90,255,160" : b.k === 3 ? "255,255,255" : "255,50,40", a = (b.k === 0 ? on : 0.75) * ln, r = b.k === 0 ? 6 : b.k === 1 ? 2.2 : 3;
        var bg = cx.createRadialGradient(b.p.X, b.p.Y, 0, b.p.X, b.p.Y, r * 3); bg.addColorStop(0, "rgba(" + c + "," + a.toFixed(2) + ")"); bg.addColorStop(1, "rgba(" + c + ",0)"); cx.fillStyle = bg; cx.fillRect(b.p.X - r * 3, b.p.Y - r * 3, r * 6, r * 6); }); }

    boatsDraw(env, t, wl, bs);
    birdsDraw(env, t);
    fogDraw(env, t, dt, wind, function (b) { return b.z * bs >= 0; });

    /* foghorn rings */
    for (i = rings.length - 1; i >= 0; i--) { var rg = rings[i], age = (Date.now() - rg.t0) / 1000; if (age > 4) { rings.splice(i, 1); continue; }
      var c0 = P(rg.x, rg.y, 0); if (!c0) continue; cx.strokeStyle = "rgba(255,255,255," + (0.6 * (1 - age / 4)).toFixed(2) + ")"; cx.lineWidth = 2;
      for (var q = 0; q < 3; q++) { var rr = (age - q * 0.35) * 90; if (rr > 0) { cx.beginPath(); cx.ellipse(c0.X, c0.Y, rr, rr * 0.45, 0, 0, 7); cx.stroke(); } } }

    D.documentElement.classList.toggle("gg-day", env.sa > 2);
    say(date, env, wind, wl);
  }

  function cloudsDraw(env, t, hy) {
    var n = Math.round(clouds.length * cloudLive); if (!n) return;
    var sa = env.sa, gold = sstep(-6, 1, sa) * (1 - sstep(4, 16, sa)), dayc = sstep(-2, 10, sa), nightc = 1 - sstep(-10, -2, sa);
    var lit = mixc(mixc(hex("#2b2d52"), hex("#ffffff"), dayc), hex("#ff9a6a"), gold * 0.9), shade = mixc(mixc(hex("#161834"), hex("#c8d3e6"), dayc), hex("#b0507a"), gold * 0.8);
    for (var i = 0; i < n; i++) { var c = clouds[i], az = c.az + (RM ? 0 : t * 0.25), p = Pd(dirOf(c.alt, az)); if (!p || p.Y > hy - 4) continue;
      var sz = W * 0.05 * c.w * (1.3 - c.alt / 60), a = (0.55 + 0.35 * c.o) * (1 - nightc * 0.55);
      c.pf.forEach(function (f) { var x = p.X + f.dx * sz, y = p.Y + f.dy * sz, r = f.r * sz;
        var g = cx.createLinearGradient(0, y - r, 0, y + r * 0.6); g.addColorStop(0, rgb(mixc(shade, lit, 0.4 + 0.6 * dayc), a)); g.addColorStop(1, rgb(gold > 0.2 ? lit : shade, a));
        cx.fillStyle = g; cx.beginPath(); cx.ellipse(x, y, r * 1.6, r * 0.62, 0, 0, 7); cx.fill(); }); }
  }
  function fogDraw(env, t, dt, wind, which) {
    var f = env.fog; if (f < 0.03) return; var v = (6 + wind * 0.8) * 22, n = Math.round(blobs.length * clamp(0.25 + f, 0, 1));
    for (var i = 0; i < n; i++) { var b = blobs[i]; if (!RM) { b.z += v * dt * b.s; if (b.z > 12000) b.z -= 24000; }
      if (!which(b)) continue; var y = 20 + b.y * env.fogTop, p = P(b.x, y, b.z); if (!p) continue;
      var r = b.r * (1 + f) * F / p.z; if (r < 2) continue; var edge = sstep(12000, 9000, Math.abs(b.z));
      cx.globalAlpha = clamp(f * 0.42 * edge * (0.6 + 0.4 * (1 - b.y)), 0, 0.6);
      cx.drawImage(fs, p.X - r, p.Y - r * 0.55, r * 2, r * 1.1); }
    cx.globalAlpha = 1;
    if (f > 0.25) { var hz = Pd([f3[0], 0, f3[2]]); if (hz) { var gb = cx.createLinearGradient(0, hz.Y - 60 * f, 0, hz.Y + 40); gb.addColorStop(0, rgb(env.fogc, 0)); gb.addColorStop(0.6, rgb(env.fogc, 0.35 * f)); gb.addColorStop(1, rgb(env.fogc, 0)); cx.fillStyle = gb; cx.fillRect(0, hz.Y - 60 * f, W, 100 + 60 * f); } }
    if (which({ z: cam.z })) { cx.fillStyle = rgb(env.fogc, 0.1 * f); cx.fillRect(0, 0, W, H); }
  }
  function boatsDraw(env, t, wl, side) {
    boats.forEach(function (b, i) { var z = b.z0 + ((RM ? 0 : t) * b.v * 3) % 32000; if (z > 16000) z -= 32000; if (z * side < 0) return;
      var h0 = P(b.x - b.len / 2, wl + 4, z), h1 = P(b.x + b.len / 2, wl + 4, z); if (!h0 || !h1) return;
      var dim = 1 - env.fog * clamp(h0.z / 9000, 0, 0.9), light = env.night > 0.5;
      if (b.kind === "sail") { var m = P(b.x, wl + b.h, z), m2 = P(b.x - b.len * 0.45, wl + 8, z); if (!m || !m2) return;
        cx.globalAlpha = dim; cx.fillStyle = light ? "#2a2f45" : "#f7f3ea"; cx.beginPath(); cx.moveTo(m.X, m.Y); cx.lineTo(h1.X, h1.Y - 2); cx.lineTo(m2.X, m2.Y); cx.fill();
        cx.fillStyle = light ? "#11131f" : "#1b2c4a"; cx.fillRect(Math.min(h0.X, h1.X), h0.Y - 2, Math.abs(h1.X - h0.X) + 1, 3); }
      else { var tp = P(b.x - b.len / 2, wl + b.h * 0.55, z), tp2 = P(b.x + b.len / 2, wl + b.h * 0.55, z), br = P(b.x + b.len * 0.36, wl + b.h, z); if (!tp || !tp2 || !br) return;
        cx.globalAlpha = dim; cx.fillStyle = light ? "#141726" : "#2b3552"; cx.beginPath(); cx.moveTo(h0.X, h0.Y); cx.lineTo(h1.X, h1.Y); cx.lineTo(tp2.X, tp2.Y); cx.lineTo(tp.X, tp.Y); cx.fill();
        var cols = ["#d8452f", "#2c6fb7", "#e2a93b", "#3c8f5a", "#c9cfd6"], n = 12;
        for (var k = 0; k < n; k++) { var a = P(b.x - b.len / 2 + (k + 0.5) * b.len * 0.78 / n, wl + b.h * 0.8, z), c = P(b.x - b.len / 2 + (k + 0.5) * b.len * 0.78 / n, wl + b.h * 0.55, z); if (!a || !c) continue;
          cx.fillStyle = light ? "#20243a" : cols[(k * 7 + i) % 5]; cx.fillRect(a.X - Math.abs(h1.X - h0.X) / n / 2, a.Y, Math.abs(h1.X - h0.X) / n * 0.9, c.Y - a.Y); }
        var bt = P(b.x + b.len * 0.36, wl + b.h * 0.55, z); cx.fillStyle = light ? "#fff2c4" : "#f2efe8"; cx.fillRect(br.X - 3, br.Y, 7, bt.Y - br.Y);
        if (light) { cx.fillStyle = "#ffe7a0"; for (k = 0; k < 6; k++) cx.fillRect(h0.X + (h1.X - h0.X) * (k + 0.5) / 6, h0.Y - 4, 1.5, 1.5); } }
      cx.globalAlpha = 1; });
  }
  function birdsDraw(env, t) {
    if (env.night > 0.7) return; var x0 = ((RM ? 0.3 : t * 0.018) % 1.4 - 0.2) * 7000 - 3500;
    cx.strokeStyle = env.day > 0.5 ? "rgba(40,30,30,.8)" : "rgba(20,15,30,.8)"; cx.lineWidth = 1.4;
    birds.forEach(function (b) { var p = P(x0 - b.k * 70, 34 + 6 * sin(b.k), 1400 * (cam.z > 0 ? 1 : -1) - b.k * 15); if (!p) return;
      var s = Math.max(3, 14 * F / p.z), fl = RM ? 0.3 : (sin(t * 5 + b.ph) > 0.85 ? 0.9 : 0.2);
      cx.beginPath(); cx.moveTo(p.X - s, p.Y - s * fl * 0.5); cx.quadraticCurveTo(p.X - s * 0.4, p.Y - s * fl, p.X, p.Y); cx.quadraticCurveTo(p.X + s * 0.4, p.Y - s * fl, p.X + s, p.Y - s * fl * 0.5); cx.stroke(); });
  }
  ringHooks.push(function (where) { rings.push({ x: where === "south" ? -TW : 0, y: where === "south" ? 40 : 215, t0: Date.now() }); loop.kick(); });

  /* ---- words under the picture */
  var out = $("gg-now"), lastSay = 0;
  function say(date, env, wind, wl) {
    if (!out || Date.now() - lastSay < 900) return; lastSay = Date.now(); var S = env.S, w = LIVE.w, bits = [];
    bits.push(T("At the bridge ", "ที่สะพาน ") + bridgeClock(date));
    var sa = Math.round(S.sun.alt); bits.push(sa > 0 ? T("sun " + sa + "° up in the " + compass(S.sun.az), "ดวงอาทิตย์สูง " + sa + "° ทาง" + compass(S.sun.az)) : T("sun " + (-sa) + "° below the horizon", "ดวงอาทิตย์อยู่ใต้ขอบฟ้า " + (-sa) + "°"));
    bits.push(T("moon " + Math.round(S.frac * 100) + "% lit", "พระจันทร์สว่าง " + Math.round(S.frac * 100) + "%"));
    if (w && st.off === 0) bits.push(T(Math.round(w.temperature_2m) + " °C, wind " + Math.round(w.wind_speed_10m) + " mph from the " + compass(w.wind_direction_10m),
      Math.round(w.temperature_2m) + " °C ลม " + Math.round(w.wind_speed_10m * 1.609) + " กม./ชม. จากทิศ" + compass(w.wind_direction_10m)));
    var fg = env.fog; bits.push(fg < 0.15 ? T("clear", "ฟ้าโปร่ง") : fg < 0.45 ? T("a little fog", "หมอกบาง") : fg < 0.75 ? T("fog", "หมอก") : T("thick fog", "หมอกหนา"));
    bits.push(wind >= 22 ? T("the railing is singing", "ราวสะพานกำลังร้องเพลง") : T("the railing is quiet", "ราวสะพานเงียบ"));
    out.textContent = bits.join(" · ");
  }

  /* ---- controls */
  var tIn = $("gg-time"), fIn = $("gg-fog"), wIn = $("gg-wind"), tL = $("gg-time-l"), fL = $("gg-fog-l"), wL = $("gg-wind-l"), liveB = $("gg-live");
  function labels() { var date = new Date(now().getTime() + st.off * 36e5);
    if (tL) tL.textContent = bridgeClock(date) + (st.off ? (st.off > 0 ? " (+" : " (") + st.off + T(" h)", " ชม.)") : T(" · now", " · ตอนนี้"));
    if (fL) fL.textContent = Math.round((st.fog != null ? st.fog : fogLive) * 100) + "%" + (st.fog == null ? T(" · live", " · สด") : "");
    if (wL) { var mph = st.wind != null ? st.wind : windLive; wL.textContent = L === "th" ? Math.round(mph * 1.609) + " กม./ชม." + (st.wind == null ? " · สด" : "") : Math.round(mph) + " mph" + (st.wind == null ? " · live" : ""); } }
  if (tIn) tIn.addEventListener("input", function () { st.off = +tIn.value; S = null; labels(); loop.kick(); });
  if (fIn) fIn.addEventListener("input", function () { st.fog = +fIn.value / 100; labels(); loop.kick(); });
  if (wIn) wIn.addEventListener("input", function () { st.wind = +wIn.value; singLevel(st.wind); labels(); loop.kick(); });
  if (liveB) liveB.addEventListener("click", function () { st.off = 0; st.fog = null; st.wind = null; if (tIn) tIn.value = 0; if (fIn) fIn.value = Math.round(fogLive * 100); if (wIn) wIn.value = Math.round(windLive); singLevel(windLive); S = null; labels(); loop.kick(); });
  var sb = $("gg-sing"), hb = $("gg-horn");
  if (sb) sb.addEventListener("click", function () { if (SING) singStop(); else { singStart(); singLevel(st.wind != null ? st.wind : windLive); } toggleBtn(sb, !!SING); });
  if (hb) hb.addEventListener("click", function () { if (HORNS) hornsStop(); else hornsStart(); toggleBtn(hb, !!HORNS); toggleBtn(sb, !!SING); });
  /* drag to walk around the bay */
  var dragX = null; cv.addEventListener("pointerdown", function (e) { dragX = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", function (e) { if (dragX == null) return; st.drag = clamp(st.drag - (e.clientX - dragX) * 0.15, -95, 95); dragX = e.clientX; loop.kick(); });
  cv.addEventListener("pointerup", function () { dragX = null; }); cv.addEventListener("pointercancel", function () { dragX = null; });
  D.addEventListener("gg:paint", function () { lastB = -1; loop.kick(); });
  onLive(function (l) { if (l.cloud != null && Q.get("cloud") == null) cloudLive = l.cloud; if (l.fog != null) fogLive = l.fog; if (l.w) windLive = l.w.wind_speed_10m;
    if (fIn && st.fog == null) fIn.value = Math.round(fogLive * 100); if (wIn && st.wind == null) wIn.value = Math.round(windLive); SING_WIND = windLive; labels(); loop.kick(); });
  var loop = Loop(cv, draw); labels(); loop.kick();
  setInterval(function () { labels(); if (RM) loop.kick(); }, 30000);
})();

/* ======================================================================= HANG A CHAIN */
(function hang() {
  var cv = $("cv-hang"); if (!cv) return; var C = Canvas(cv), cx = C.cx, road = $("hang-road"), sagIn = $("hang-sag"), out = $("hang-out"), t0 = null;
  /* the cable's own weight is q per foot of cable; the road adds r per foot of span.
     H y'' = r + q sqrt(1 + y'^2). Shoot from the middle (y = 0, y' = 0) and find the pull H
     that brings the cable to the tower top at the chosen dip. */
  function shape(rw, sag, half) {
    var q = 1, r = rw * 9, n = 160, h = half / n;
    function run(H) { var y = 0, p = 0, pts = [[0, 0]];
      for (var i = 0; i < n; i++) { var f = function (pp) { return (r + q * Math.sqrt(1 + pp * pp)) / H; };
        var k1 = f(p), k2 = f(p + h * k1 / 2), k3 = f(p + h * k2 / 2), k4 = f(p + h * k3);
        y += h * (p + h * (k1 + k2 + k3) / 6); p += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; if (!isFinite(y) || y > 1e6) { y = 1e9; break; } pts.push([(i + 1) * h, y]); }
      return { y: y, p: p, pts: pts }; }
    var lo = Math.log(0.01), hi = Math.log(1e7);
    for (var it = 0; it < 70; it++) { var m = (lo + hi) / 2, s = run(Math.exp(m)); if (s.y > sag) lo = m; else hi = m; }
    var H = Math.exp((lo + hi) / 2), res = run(H); res.H = H; res.T = H * Math.sqrt(1 + res.p * res.p); return res;
  }
  function draw(t) {
    if (t0 == null) t0 = t; var W = C.W, Hh = C.H, rw = +road.value / 100, sag = +sagIn.value, half = 2100;
    var s = shape(rw, sag, half), ref = shape(rw, 470, half), rel = s.T / ref.T;
    var gr = cx.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#fff6e6"); gr.addColorStop(1, "#ffe1c6");
    cx.fillStyle = gr; cx.fillRect(0, 0, W, Hh);
    var pad = 28, sc = Math.min((W - pad * 2) / (2 * half), (Hh - 70) / 950), gx = W / 2, gy = Hh - 34, top = 746, lowest = top - sag;
    function X(x) { return gx + x * sc; } function Y(y) { return gy - y * sc; }
    /* water */
    cx.fillStyle = "#9fd3e6"; cx.fillRect(0, gy, W, Hh - gy); cx.strokeStyle = "rgba(255,255,255,.7)"; cx.lineWidth = 1.2; cx.beginPath();
    for (var x = 0; x < W; x += 18) { var yy = gy + 6 + 2 * sin(x * 0.05 + (RM ? 0 : t * 2)); cx.moveTo(x, yy); cx.lineTo(x + 8, yy); } cx.stroke();
    /* reference curves: pure chain (catenary) and pure road (parabola), same dip */
    function curve(fn, col, dash) { cx.setLineDash(dash); cx.strokeStyle = col; cx.lineWidth = 2; cx.beginPath();
      for (var i = 0; i <= 120; i++) { var xx = -half + i * 2 * half / 120, y = lowest + fn(Math.abs(xx)); if (i) cx.lineTo(X(xx), Y(y)); else cx.moveTo(X(xx), Y(y)); } cx.stroke(); cx.setLineDash([]); }
    var cat = shape(0, sag, half), a = cat.H; /* catenary: y = a (cosh(x/a) - 1), a = H/q */
    curve(function (x) { return a * (Math.cosh(x / a) - 1); }, "rgba(44,111,183,.85)", [7, 6]);
    curve(function (x) { return sag * (x / half) * (x / half); }, "rgba(34,139,90,.85)", [2, 5]);
    /* towers */
    cx.fillStyle = "#f04a00"; [-half, half].forEach(function (xt) { cx.fillRect(X(xt) - 7, Y(top) - 4, 14, gy - Y(top) + 4); });
    /* road and suspenders */
    var deckY = 245, droop = RM ? 1 : Math.min(1, (t - t0) * 1.5);
    if (rw > 0.01) { cx.strokeStyle = "rgba(240,74,0,.55)"; cx.lineWidth = 1;
      for (x = -half + 150; x < half; x += 150) { var yc = lowest + interp(s.pts, Math.abs(x)); cx.beginPath(); cx.moveTo(X(x), Y(yc)); cx.lineTo(X(x), Y(deckY)); cx.stroke(); }
      cx.fillStyle = "rgba(60,50,60," + (0.35 + 0.5 * rw).toFixed(2) + ")"; cx.fillRect(X(-half), Y(deckY) - 2, 2 * half * sc, 3 + 5 * rw); }
    /* the live cable */
    cx.strokeStyle = "#c93a00"; cx.lineWidth = 4; cx.lineCap = "round"; cx.beginPath();
    for (var i = -s.pts.length + 1; i < s.pts.length; i++) { var pt = s.pts[Math.abs(i)], xx2 = (i < 0 ? -1 : 1) * pt[0], y2 = lowest + pt[1] * droop + (1 - droop) * sag;
      if (i === -s.pts.length + 1) cx.moveTo(X(xx2), Y(y2)); else cx.lineTo(X(xx2), Y(y2)); } cx.stroke();
    /* people for scale: 250 of them would be 1,500 ft */
    cx.font = "700 12px " + FONT; cx.fillStyle = "#3b2a2a"; cx.textAlign = "center";
    cx.fillText(T("dip ", "ส่วนหย่อน ") + fmt(sag) + T(" ft", " ฟุต"), X(0), Y(lowest) - 10);
    if (out) out.innerHTML = T("Pull at the tower top: <b>×" + rel.toFixed(2) + "</b> the real bridge's, for the same load. ",
      "แรงดึงที่ยอดเสา <b>×" + rel.toFixed(2) + "</b> ของสะพานจริง เมื่อน้ำหนักเท่ากัน ") +
      (rw < 0.05 ? T("Just the chain: a catenary.", "มีแต่โซ่: เส้นคาทีนารี") : rw > 0.9 ? T("Almost all road: a parabola.", "แทบทั้งหมดเป็นถนน: พาราโบลา") : T("Chain and road together: in between.", "โซ่กับถนนรวมกัน: อยู่ระหว่างสองเส้น"));
  }
  function interp(pts, x) { var h = pts[1][0], i = Math.min(pts.length - 2, Math.floor(x / h)), f = (x - pts[i][0]) / h; return lerp(pts[i][1], pts[i + 1][1], f); }
  var loop = Loop(cv, draw), rl = $("hang-road-l"), sl = $("hang-sag-l");
  function labs() { if (rl) rl.textContent = road.value + "%"; if (sl) sl.textContent = L === "th" ? fmt(+sagIn.value * 0.3048) + " ม." : fmt(+sagIn.value) + " ft"; }
  labs(); [road, sagIn].forEach(function (el) { el.addEventListener("input", labs); });
  [road, sagIn].forEach(function (el) { el.addEventListener("input", function () { t0 = null; loop.kick(); }); });
  onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();

/* ======================================================================= THE TIDE MACHINE */
(function tides() {
  var cv = $("cv-tide"); if (!cv) return; var C = Canvas(cv), cx = C.cx, out = $("tide-out"), play = $("tide-play"), running = !RM, clock = Date.now(), lastT = null, trail = [];
  var COL = ["#f04a00", "#2c6fb7", "#1f9d6b", "#e2a93b", "#a44cc1", "#d6336c", "#0b8fa8", "#6b7a2b"];
  function draw(t) {
    if (!TIDE) return; var dt = lastT == null ? 0 : Math.min(0.1, t - lastT); lastT = t; if (running) clock += dt * 3600e3 * 4; /* four hours a second */
    var W = C.W, H = C.H, split = Math.min(W * 0.36, 300), cy = H / 2, sc = (H * 0.4) / 5;
    cx.fillStyle = "#fffaf0"; cx.fillRect(0, 0, W, H);
    /* paper */
    cx.fillStyle = "#fdf3dd"; cx.fillRect(split, 0, W - split, H); cx.strokeStyle = "rgba(160,120,60,.18)"; cx.lineWidth = 1;
    for (var f = -6; f <= 2; f++) { var gy = cy - (f + 2.6) * sc; cx.beginPath(); cx.moveTo(split, gy); cx.lineTo(W, gy); cx.stroke(); }
    var perPx = 36e5 * 36 / (W - split); /* 36 hours across the paper */
    var head = split + (W - split) * 0.32, t0p = clock - (head - split) * perPx;
    /* NOAA's own prediction, as dots */
    if (LIVE.pred) { cx.fillStyle = "rgba(20,60,120,.45)"; LIVE.pred.forEach(function (p, i) { if (i % 5) return; var ms = Date.parse(p.t.replace(" ", "T") + ":00Z"), x = head + (ms - clock) / perPx; if (x < split || x > W) return; cx.fillRect(x - 1, cy - (+p.v + 2.6) * sc - 1, 2.4, 2.4); }); }
    /* the wheels' own curve ahead of the pen */
    cx.strokeStyle = "#f04a00"; cx.lineWidth = 2.4; cx.beginPath();
    for (var x = split; x <= W; x += 3) { var y = cy - (tideAt(t0p + (x - split) * perPx) + 2.6) * sc; if (x === split) cx.moveTo(x, y); else cx.lineTo(x, y); } cx.stroke();
    cx.fillStyle = "rgba(253,243,221,.55)"; cx.fillRect(head, 0, W - head, H); /* ahead of the pen: not yet drawn */
    /* now */
    var nx = head + (Date.now() - clock) / perPx; if (nx > split && nx < W) { cx.strokeStyle = "rgba(0,0,0,.5)"; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(nx, 10); cx.lineTo(nx, H - 10); cx.stroke(); cx.setLineDash([]);
      cx.fillStyle = "#222"; cx.font = "700 11px " + FONT; cx.textAlign = "center"; cx.fillText(T("now", "ตอนนี้"), nx, 14); }
    if (LIVE.level != null && LIVE.levelT) { var ox = head + (LIVE.levelT - clock) / perPx; if (ox > split && ox < W) { cx.fillStyle = "#111"; cx.beginPath(); cx.arc(ox, cy - (LIVE.level + 2.6) * sc, 4.5, 0, 7); cx.fill(); } }
    /* wheels, chained: each rides on the rim of the one before */
    var h = (clock - TIDE.t0) / 36e5, px = split * 0.46, py = cy - (TIDE.mean + 2.6) * sc, R = sc;
    cx.lineWidth = 1.5;
    TIDE.w.forEach(function (w, i) { var a = w.om * h - w.ph, r = w.amp * R, nxp = px + r * sin(a), nyp = py - r * cos(a);
      cx.strokeStyle = COL[i] + "88"; cx.beginPath(); cx.arc(px, py, r, 0, 7); cx.stroke();
      cx.strokeStyle = COL[i]; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(nxp, nyp); cx.stroke(); px = nxp; py = nyp; });
    cx.strokeStyle = "rgba(240,74,0,.6)"; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(px, py); cx.lineTo(head, py); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = "#f04a00"; cx.beginPath(); cx.arc(head, py, 5, 0, 7); cx.fill();
    /* labels */
    cx.textAlign = "left"; cx.font = "700 11px " + FONT;
    TIDE.w.forEach(function (w, i) { cx.fillStyle = COL[i]; cx.fillText(w.name + "  " + (w.amp * 30.48).toFixed(0) + T(" cm", " ซม."), 10, 18 + i * 15); });
    cx.fillStyle = "#555"; cx.textAlign = "right"; cx.fillText(T("high water line", "ระดับน้ำขึ้นสูง"), W - 8, cy - 2.6 * sc - 4);
    var d = new Date(clock); cx.fillText(bridgeClock(d) + " · " + d.toLocaleDateString(L === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }), W - 8, H - 8);
    if (out && !out.dataset.done) { out.dataset.done = 1; var lv = tideAt(Date.now());
      out.innerHTML = T("Eight wheels, fitted to NOAA's prediction" + (TIDE.live ? " this week" : "") + ": within <b>" + (TIDE.rms * 30.48).toFixed(1) + " cm</b>. Right now the water is <b>" + (-lv).toFixed(1) + " ft</b> below average high water.",
        "วงล้อแปดวง ปรับให้ตรงกับพยากรณ์ของ NOAA" + (TIDE.live ? "สัปดาห์นี้" : "") + " คลาดไม่เกิน <b>" + (TIDE.rms * 30.48).toFixed(1) + " ซม.</b> ตอนนี้น้ำต่ำกว่าระดับน้ำขึ้นสูงเฉลี่ย <b>" + (-lv * 30.48).toFixed(0) + " ซม.</b>"); }
  }
  var loop = Loop(cv, draw);
  if (play) play.addEventListener("click", function () { running = !running; if (running) lastT = null; play.setAttribute("aria-pressed", running ? "true" : "false"); loop.kick(); });
  var nb = $("tide-now"); if (nb) nb.addEventListener("click", function () { clock = Date.now(); loop.kick(); });
  tideReady.then(function () { if (out) delete out.dataset.done; loop.kick(); });
  onLive(function () { if (out) delete out.dataset.done; loop.kick(); }); onResize(function () { C.fit(); loop.kick(); });
})();

/* ======================================================================= WILL IT FIT */
(function fit() {
  var cv = $("cv-fit"); if (!cv) return; var C = Canvas(cv), cx = C.cx, out = $("fit-out"), me = $("fit-me"), which = "cranes2";
  var SHIPS = { cranes1: { h: 223.75, en: "Cranes, Oct 2000", th: "ปั้นจั่น ต.ค. 2000", ok: T("about 8 feet", "ราว 2.4 เมตร") },
    cranes2: { h: 227.7, en: "Cranes, 2002 and 2005", th: "ปั้นจั่น 2002 และ 2005", ok: T("12 and 9–10 feet", "3.7 และ 2.7–3 เมตร") },
    zhenhua: { h: 253, en: "Zhen Hua 15 cranes, full height", th: "ปั้นจั่นเรือเจิ้นหัว 15 เต็มความสูง" }, me: { h: 0 } };
  function draw(t) {
    var W = C.W, H = C.H, lv = levelNow(), gap = 220 - lv, cm = +(me && me.value) || 160, meFt = cm / 30.48;
    var sc = (H - 40) / 280, wy = H - 14 - (lv + 6) * sc, dy = wy - gap * sc;
    cx.fillStyle = "#eaf6fb"; cx.fillRect(0, 0, W, H);
    /* deck */
    cx.fillStyle = "#f04a00"; cx.fillRect(0, dy - 25 * sc, W, 25 * sc); cx.strokeStyle = "#b53800"; cx.lineWidth = 1.2; cx.beginPath();
    for (var x = 0; x < W; x += 25 * sc) { cx.moveTo(x, dy - 25 * sc); cx.lineTo(x + 12.5 * sc, dy); cx.lineTo(x + 25 * sc, dy - 25 * sc); } cx.stroke();
    /* water */
    var wg = cx.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, "#3b9cc4"); wg.addColorStop(1, "#1d5f86"); cx.fillStyle = wg; cx.fillRect(0, wy, W, H - wy);
    cx.strokeStyle = "rgba(255,255,255,.6)"; cx.beginPath(); for (x = 0; x < W; x += 16) { var yy = wy + 3 * sin(x * 0.06 + (RM ? 0 : t * 1.8)); cx.moveTo(x, yy); cx.lineTo(x + 8, yy); } cx.stroke();
    /* the thing */
    var mid = W * 0.5, s = SHIPS[which];
    if (which === "me") { var n = Math.floor(gap / meFt), ph = meFt * sc; cx.fillStyle = "#2b2b3a";
      for (var i = 0; i < n; i++) { var y0 = wy - (i + 1) * ph, bob = RM ? 0 : sin(t * 3 + i * 0.5) * 0.6; person(mid + bob, y0, ph); }
      out.innerHTML = T("Right now: <b>" + fmt(gap * 0.3048, 1) + " m</b> from the water to the bottom of the deck at mid-span. That's <b>" + fmt(n) + "</b> of you, standing on each other's heads" + (gap / meFt - n > 0.5 ? ", and most of one more." : "."),
        "ตอนนี้ จากผิวน้ำถึงใต้พื้นสะพานกลางช่วง <b>" + fmt(gap * 0.3048, 1) + " เมตร</b> เท่ากับคุณ <b>" + fmt(n) + "</b> คน ยืนต่อหัวกัน" + (gap / meFt - n > 0.5 ? " กับอีกเกือบหนึ่งคน" : ""));
    } else { var top = wy - s.h * sc, ok = s.h < gap - 2, went = !ok && s.ok, bw = Math.min(W * 0.55, 380);
      cx.fillStyle = "#23304f"; cx.beginPath(); cx.moveTo(mid - bw / 2, wy - 30 * sc); cx.lineTo(mid + bw / 2, wy - 30 * sc); cx.lineTo(mid + bw / 2 - 18, wy + 6); cx.lineTo(mid - bw / 2 + 12, wy + 6); cx.fill();
      cx.strokeStyle = ok ? "#1f7a4d" : went ? "#c77700" : "#c0392b"; cx.lineWidth = 3;
      [-0.3, 0, 0.3].forEach(function (k) { var cxp = mid + k * bw; cx.beginPath(); cx.moveTo(cxp, wy - 30 * sc); cx.lineTo(cxp, top); cx.lineTo(cxp + bw * 0.16, top + 30 * sc); cx.moveTo(cxp, top); cx.lineTo(cxp - bw * 0.1, top + 10 * sc); cx.stroke(); });
      cx.fillStyle = ok ? "#1f7a4d" : went ? "#c77700" : "#c0392b"; cx.font = "800 13px " + FONT; cx.textAlign = "center";
      cx.fillText(ok ? T("fits, " + fmt(gap - s.h, 0) + " ft to spare", "ผ่านได้ เหลือที่ว่าง " + fmt((gap - s.h) * 0.3048, 1) + " ม.") : T(fmt(s.h - gap, 0) + " ft over the charted gap", "สูงเกินช่องตามแผนที่เดินเรือ " + fmt((s.h - gap) * 0.3048, 1) + " ม."), mid, Math.max(top - 8, dy + 16));
      var more = ok ? "" : went ? T(" It went under anyway, at low tide, with " + s.ok + " to spare: on those days the deck sat higher than the charted figure.", " แต่ก็ลอดผ่านไปได้ ตอนน้ำลง เหลือที่ว่าง " + s.ok + " วันนั้นพื้นสะพานอยู่สูงกว่าตัวเลขในแผนที่เดินเรือ")
        : T(" The ship stopped in Drakes Bay and lowered its cranes first.", " เรือต้องแวะอ่าวเดรกส์ เพื่อลดปั้นจั่นลงก่อน");
      out.innerHTML = T("<b>" + s.en + "</b>: " + fmt(s.h, 1) + " ft above the waterline. Charted gap under the deck at this tide: <b>" + fmt(gap, 1) + " ft</b> (" + fmt(gap * 0.3048, 1) + " m).",
        "<b>" + s.th + "</b>: สูง " + fmt(s.h * 0.3048, 1) + " ม. จากระดับน้ำ ช่องใต้สะพานตามแผนที่เดินเรือ ที่ระดับน้ำตอนนี้ <b>" + fmt(gap * 0.3048, 1) + " ม.</b>") + more; }
    cx.fillStyle = "#1d3b55"; cx.font = "700 11px " + FONT; cx.textAlign = "left";
    cx.fillText(T("tide now: " + (lv >= 0 ? "+" : "") + lv.toFixed(1) + " ft against average high water", "น้ำตอนนี้ " + (lv * 30.48 >= 0 ? "+" : "") + (lv * 30.48).toFixed(0) + " ซม. เทียบระดับน้ำขึ้นสูงเฉลี่ย"), 8, H - 4);
  }
  function person(x, yTop, h) { var r = h * 0.13; cx.beginPath(); cx.arc(x, yTop + r, r, 0, 7); cx.fill(); cx.fillRect(x - h * 0.1, yTop + r * 2, h * 0.2, h * 0.45); cx.fillRect(x - h * 0.09, yTop + h * 0.7, h * 0.07, h * 0.3); cx.fillRect(x + h * 0.02, yTop + h * 0.7, h * 0.07, h * 0.3); }
  var loop = Loop(cv, draw);
  D.querySelectorAll("[data-ship]").forEach(function (b) { b.addEventListener("click", function () { which = b.getAttribute("data-ship");
    D.querySelectorAll("[data-ship]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); loop.kick(); }); });
  if (me) me.addEventListener("input", function () { which = "me"; D.querySelectorAll("[data-ship]").forEach(function (o) { o.setAttribute("aria-pressed", o.getAttribute("data-ship") === "me" ? "true" : "false"); }); loop.kick(); });
  tideReady.then(loop.kick); onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();

/* ======================================================================= FOG, LIVE */
(function fogNow() {
  var el = $("fog-out"); if (!el) return;
  onLive(function (l) { var w = l.w; if (!w) { el.innerHTML = '<p class="mute small">' + T("Live weather did not load.", "โหลดสภาพอากาศสดไม่ได้") + "</p>"; return; }
    var rows = [[T("Air", "อากาศ"), w.temperature_2m, "#ff8a3d"], [T("Dew point", "จุดน้ำค้าง"), w.dew_point_2m, "#2f7fd8"]];
    if (l.sst != null) rows.push([T("Sea", "น้ำทะเล"), l.sst, "#119c78"]);
    var lo = 0, hi = 30, html = rows.map(function (r) { var f = clamp((r[1] - lo) / (hi - lo), 0.02, 1);
      return '<div class="fb"><span>' + r[0] + '</span><span class="bar"><i style="width:' + (f * 100).toFixed(1) + "%;background:" + r[2] + '"></i></span><b>' + r[1].toFixed(1) + " °C</b></div>"; }).join("");
    var sp = w.temperature_2m - w.dew_point_2m, cold = l.sst != null && l.sst <= w.dew_point_2m + 0.5, vis = w.visibility != null ? w.visibility / 1000 : null;
    var v = sp < 1 ? T("The air is at its dew point: <b>fog or cloud on the water</b>.", "อากาศถึงจุดน้ำค้างแล้ว: <b>มีหมอกหรือเมฆบนผิวน้ำ</b>")
      : cold ? T("The sea is as cold as the dew point, so air touching it can turn to fog. Only " + sp.toFixed(1) + " °C to go.", "น้ำทะเลเย็นเท่าจุดน้ำค้าง อากาศที่แตะผิวน้ำจึงกลายเป็นหมอกได้ เหลืออีกแค่ " + sp.toFixed(1) + " °C")
      : T("The air is " + sp.toFixed(1) + " °C above its dew point, and the sea is warmer than that dew point: <b>clear over the water for now</b>.", "อากาศสูงกว่าจุดน้ำค้าง " + sp.toFixed(1) + " °C และน้ำทะเลอุ่นกว่าจุดน้ำค้าง: <b>ตอนนี้เหนือน้ำยังโปร่ง</b>");
    el.innerHTML = '<p class="kicker">' + T("At the bridge now", "ที่สะพานตอนนี้") + "</p>" + html + '<p class="fogv">' + v + (vis != null ? T(" You can see " + fmt(vis, 1) + " km.", " มองเห็นได้ไกล " + fmt(vis, 1) + " กม.") : "") + "</p>"; });
})();

/* ======================================================================= THE SINGING RAILING */
(function song() {
  var cv = $("cv-sing"); if (!cv) return; var C = Canvas(cv), cx = C.cx, win = $("sing-wind"), wl = $("sing-wind-l"), out = $("sing-out"), vort = [], lastT = null, acc = [];
  function draw(t) {
    var W = C.W, H = C.H, mph = +win.value, ms = mph * 0.44704, dt = lastT == null ? 0 : Math.min(0.1, t - lastT); lastT = t;
    cx.fillStyle = "#101634"; cx.fillRect(0, 0, W, H);
    var n = 5, gapx = W * 0.62 / n, x0 = W * 0.12, sw = 7, sing = sstep(20, 24, mph), hi = sstep(25, 29, mph);
    /* wind lines */
    cx.strokeStyle = "rgba(160,200,255,.18)"; cx.lineWidth = 1; cx.beginPath();
    for (var k = 0; k < 14; k++) { var y = (k + 0.5) * H / 14, off = RM ? 0 : (t * (20 + mph * 6)) % 80; for (var x = -80 + off; x < W; x += 80) { cx.moveTo(x, y); cx.lineTo(x + 30, y); } } cx.stroke();
    /* vortices shed from each slat, alternately above and below: a Karman street */
    var shedHz = 0.2 * ms / 0.005 / 180; /* the real rate over 180, so an eye can follow it */
    if (!RM && mph > 3) for (var s = 0; s < n; s++) { acc[s] = (acc[s] || 0) + dt * shedHz; while (acc[s] >= 1) { acc[s] -= 1; vort.push({ x: x0 + s * gapx + sw, y: H / 2, side: vort.length % 2 ? 1 : -1, age: 0, s: s }); } }
    for (var i = vort.length - 1; i >= 0; i--) { var v = vort[i]; v.age += dt; v.x += dt * (18 + mph * 3.2); if (v.age > 2.6 || v.x > W + 30) { vort.splice(i, 1); continue; }
      var r = 5 + v.age * 9, yy = v.y + v.side * (H * 0.09 + v.age * 5), a = 0.55 * (1 - v.age / 2.6);
      cx.strokeStyle = "rgba(255,190,120," + a.toFixed(2) + ")"; cx.lineWidth = 1.6; cx.beginPath();
      for (var q = 0; q < 26; q++) { var ang = q * 0.45 * v.side + v.age * 6 * v.side, rr = r * q / 26; var px = v.x + rr * cos(ang), py = yy + rr * sin(ang); if (q) cx.lineTo(px, py); else cx.moveTo(px, py); } cx.stroke(); }
    /* slats, trembling when they sing */
    for (s = 0; s < n; s++) { var jit = RM ? 0 : sing * sin(t * 80 + s) * 1.2; cx.fillStyle = "#f04a00"; cx.fillRect(x0 + s * gapx + jit, H * 0.18, sw, H * 0.64); }
    /* the four notes */
    var kx = W * 0.8, kw = (W * 0.18) / 4, names = ["F4", "G4", "A4", "B4"];
    NOTES.forEach(function (f, j) { var lit = sing * (0.5 + 0.5 * sin((RM ? 0 : t) * (2 + j) + j)); cx.fillStyle = "rgba(255,230,160," + (0.12 + 0.75 * lit).toFixed(2) + ")";
      cx.fillRect(kx + j * kw + 2, H * 0.25, kw - 4, H * 0.5); cx.fillStyle = "#fff"; cx.font = "800 12px " + FONT; cx.textAlign = "center"; cx.fillText(names[j], kx + j * kw + kw / 2, H * 0.25 - 8); cx.font = "600 10px " + FONT; cx.fillText(f + " Hz", kx + j * kw + kw / 2, H * 0.8 + 14); });
    if (hi > 0) { cx.fillStyle = "rgba(160,220,255," + (0.8 * hi).toFixed(2) + ")"; cx.font = "800 12px " + FONT; cx.fillText("1.1 kHz", kx + 2 * kw, H * 0.12); }
    if (wl) wl.textContent = L === "th" ? Math.round(mph * 1.609) + " กม./ชม." : Math.round(mph) + " mph";
    if (out) { var f0 = 0.2 * ms / 0.005;
      out.innerHTML = (mph >= 22 ? T("<b>Singing.</b> ", "<b>กำลังร้องเพลง</b> ") : T("<b>Quiet.</b> It starts at 22 mph. ", "<b>เงียบ</b> เริ่มร้องที่ลม 35 กม./ชม. ")) +
        T("An edge 5 mm thick in this wind sheds swirls at 0.2 × " + ms.toFixed(1) + " m/s ÷ 0.005 m = <b>" + fmt(f0) + " Hz</b>.",
          "ขอบหนา 5 มม. ในลมแรงเท่านี้ ปล่อยน้ำวนออกมา 0.2 × " + ms.toFixed(1) + " ม./วินาที ÷ 0.005 ม. = <b>" + fmt(f0) + " ครั้งต่อวินาที</b>"); }
    singLevel(mph);
  }
  var loop = Loop(cv, draw);
  win.addEventListener("input", loop.kick);
  var pb = $("sing-play"), hb = $("horn-play");
  if (pb) pb.addEventListener("click", function () { if (SING) singStop(); else singStart(); toggleBtn(pb, !!SING); toggleBtn($("gg-sing"), !!SING); });
  if (hb) hb.addEventListener("click", function () { if (HORNS) hornsStop(); else hornsStart(); toggleBtn(hb, !!HORNS); toggleBtn($("gg-horn"), !!HORNS); toggleBtn(pb, !!SING); });
  onLive(function (l) { if (l.w && !win.dataset.touched) { win.value = Math.round(l.w.wind_speed_10m); loop.kick(); } });
  win.addEventListener("input", function () { win.dataset.touched = 1; });
  onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();

/* ======================================================================= PAINT IT */
(function paint() {
  var cv = $("cv-paint"); if (!cv) return; var C = Canvas(cv), cx = C.cx, out = $("paint-out"), spots = [], splats = [], done = 0, coat = "orange", sweep = 1, lastT = null, prev = COATS.orange;
  var painters = [0.18, 0.52, 0.8];
  [-2800, -1500, -600, 900, 1800, 2700].forEach(function (x, i) { spots.push({ x: i % 3 === 1 ? (x < 0 ? -2100 : 2100) : x, y: i % 3 === 1 ? 300 + i * 60 : i % 2 ? 240 : cab(x), r: 1 }); });
  function geom() { var W = C.W, H = C.H, sc = Math.min(W / 7000, (H - 30) / 820), gx = W / 2, gy = H - 18;
    return { W: W, H: H, X: function (x) { return gx + x * sc; }, Y: function (y) { return gy - y * sc; }, sc: sc }; }
  function cab(x) { var ax = Math.abs(x); if (ax <= 2100) return 276 + 470 * (x / 2100) * (x / 2100); var s = (ax - 2100) / 1125; return lerp(746, 255, s) - 4 * 33.7 * s * (1 - s); }
  function colAt(c, y) { if (!c.b) return rgb(c.a); return Math.floor(y / c.band) % 2 ? rgb(c.b) : rgb(c.a); }
  function draw(t) {
    var g = geom(), W = g.W, H = g.H, dt = lastT == null ? 0 : Math.min(0.1, t - lastT); lastT = t;
    if (!RM) sweep = Math.min(1, sweep + dt * 0.5); else sweep = 1;
    var sky = cx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#bfe3f5"); sky.addColorStop(1, "#fbe6cf"); cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#3f8fb3"; cx.fillRect(0, g.Y(0), W, H - g.Y(0));
    var edge = g.X(-3225 + 6450 * sweep);
    function paintWith(c, clipL, clipR) { cx.save(); cx.beginPath(); cx.rect(clipL, 0, clipR - clipL, H); cx.clip();
      [-2100, 2100].forEach(function (xt) { for (var y = 0; y < 746; y += (c.b ? c.band : 746)) { cx.fillStyle = colAt(c, y); cx.fillRect(g.X(xt) - 22 * g.sc - 2, g.Y(Math.min(746, y + (c.b ? c.band : 746))), 44 * g.sc + 4, (Math.min(746, y + (c.b ? c.band : 746)) - y) * g.sc); } });
      cx.lineWidth = 3; for (var x = -3225; x < 3225; x += 40) { cx.strokeStyle = colAt(c, cab(x)); cx.beginPath(); cx.moveTo(g.X(x), g.Y(cab(x))); cx.lineTo(g.X(x + 40), g.Y(cab(x + 40))); cx.stroke(); }
      cx.lineWidth = 1; for (x = -3200; x < 3225; x += 50) { cx.strokeStyle = colAt(c, 300); cx.beginPath(); cx.moveTo(g.X(x), g.Y(cab(x))); cx.lineTo(g.X(x), g.Y(250)); cx.stroke(); }
      cx.fillStyle = colAt(c, 235); cx.fillRect(g.X(-3500), g.Y(250), 7000 * g.sc, 25 * g.sc + 1); cx.restore(); }
    paintWith(COATS[coat], 0, edge); paintWith(prev, edge, W);
    if (sweep < 1) { cx.fillStyle = "#fff"; cx.fillRect(edge - 2, g.Y(760), 4, g.Y(0) - g.Y(760)); }
    /* rust arrives with the salt air; tap it */
    if (!RM && Math.random() < dt * 0.9 && spots.length < 14) { var xs = lerp(-3100, 3100, Math.random()), onT = Math.random() < 0.35, xt = Math.random() < 0.5 ? -2100 : 2100;
      spots.push(onT ? { x: xt + lerp(-15, 15, Math.random()), y: lerp(60, 720, Math.random()), r: 0 } : { x: xs, y: Math.random() < 0.5 ? cab(xs) : 240, r: 0 }); }
    if (RM && !spots.length) for (var k = 0; k < 8; k++) { var xx = -3000 + k * 850; spots.push({ x: xx, y: k % 2 ? cab(xx) : 240, r: 1 }); }
    spots.forEach(function (s) { s.r = Math.min(1, s.r + dt * 0.4); var px = g.X(s.x), py = g.Y(s.y), rr = 3 + 5 * s.r;
      cx.fillStyle = "rgba(122,62,30,.9)"; cx.beginPath(); cx.arc(px, py, rr, 0, 7); cx.fill(); cx.fillStyle = "rgba(90,40,20,.8)"; cx.beginPath(); cx.arc(px + rr * 0.3, py - rr * 0.2, rr * 0.45, 0, 7); cx.fill(); });
    for (var i = splats.length - 1; i >= 0; i--) { var p = splats[i]; p.a += dt; if (p.a > 0.7) { splats.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
      cx.fillStyle = rgb(COATS[coat].a, 1 - p.a / 0.7); cx.beginPath(); cx.arc(p.x, p.y, 2.5, 0, 7); cx.fill(); }
    /* painters on their rigging, walking the cable */
    painters.forEach(function (f, j) { var ph = RM ? f : (f + t * 0.012 * (j % 2 ? 1 : -1) + 5) % 1, x = -3100 + 6200 * ph, y = cab(x) - 8, px = g.X(x), py = g.Y(y);
      cx.fillStyle = "#fff"; cx.fillRect(px - 4, py - 1, 8, 3); cx.fillStyle = "#1f2f4f"; cx.fillRect(px - 1.5, py - 8, 3, 7); cx.fillStyle = "#f2c230"; cx.beginPath(); cx.arc(px, py - 10, 2.6, 0, 7); cx.fill(); });
    cx.fillStyle = "#15314a"; cx.font = "800 13px " + FONT; cx.textAlign = "left"; cx.fillText(T("patched: ", "ซ่อมแล้ว: ") + done, 10, 20);
  }
  function hit(e) { var r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, g = geom(), best = -1, bd = 26;
    spots.forEach(function (s, i) { var d = Math.hypot(g.X(s.x) - mx, g.Y(s.y) - my); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return; var s = spots.splice(best, 1)[0]; done++;
    for (var k = 0; k < 14; k++) { var a = Math.random() * 7; splats.push({ x: g.X(s.x), y: g.Y(s.y), vx: cos(a) * 120, vy: sin(a) * 120 - 60, a: 0 }); }
    if (out) out.textContent = done >= 10 ? T("Hired. The crew is 28 painters, 5 painter laborers and a chief bridge painter; you'd be number 29.", "รับเข้าทำงาน! ทีมมีช่างทาสี 28 คน ผู้ช่วยช่างทาสี 5 คน และหัวหน้าช่างทาสีสะพาน 1 คน คุณเป็นช่างทาสีคนที่ 29") : ""; loop.kick(); }
  cv.addEventListener("pointerdown", hit);
  var loop = Loop(cv, draw);
  D.querySelectorAll("[data-coat]").forEach(function (b) { b.addEventListener("click", function () { var c = b.getAttribute("data-coat"); if (c === coat) return;
    prev = COATS[coat]; coat = c; sweep = RM ? 1 : 0; PAINT = COATS[c];
    D.querySelectorAll("[data-coat]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    D.dispatchEvent(new CustomEvent("gg:paint")); loop.kick(); }); });
  onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();

/* ======================================================================= IT BREATHES */
(function warm() {
  var cv = $("cv-warm"); if (!cv) return; var C = Canvas(cv), cx = C.cx, tin = $("warm-t"), tl = $("warm-t-l"), out = $("warm-out"), shown = 0;
  /* steel grows 12 millionths of its length per degree C. Main-span cable: S + 8d^2/(3S) = 4,340 ft.
     For a shallow parabola, a longer cable dips more: change in dip = 3S/(16d) x change in length. */
  var S = 4200, d0 = 470, Lc = S + 8 * d0 * d0 / (3 * S), K = 3 * S / (16 * d0) * Lc * 12e-6; /* feet per degree C */
  function draw(t) {
    var W = C.W, H = C.H, T0c = +tin.value, dd = K * (T0c - 15), cm = dd * 30.48;
    shown = RM ? cm : lerp(shown, cm, 0.12);
    var sky = cx.createLinearGradient(0, 0, 0, H), hot = clamp((T0c + 5) / 45, 0, 1);
    sky.addColorStop(0, rgb(mixc(hex("#cfe6ff"), hex("#ffd2a6"), hot))); sky.addColorStop(1, rgb(mixc(hex("#eef6ff"), hex("#fff0d8"), hot))); cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
    var sc = Math.min(W / 5000, (H - 40) / 820), gx = W / 2, gy = H - 20, ex = 60; /* the movement drawn 60 times bigger */
    function X(x) { return gx + x * sc; } function Y(y) { return gy - y * sc; }
    cx.fillStyle = "#4b9cc1"; cx.fillRect(0, Y(0), W, H - Y(0));
    cx.fillStyle = "#f04a00"; [-2100, 2100].forEach(function (xt) { cx.fillRect(X(xt) - 5, Y(746), 10, Y(0) - Y(746)); });
    function cable(extra, col, w, dash) { cx.setLineDash(dash || []); cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath();
      for (var x = -2100; x <= 2100; x += 30) { var y = 276 - extra + (470 + extra) * (x / 2100) * (x / 2100); if (x === -2100) cx.moveTo(X(x), Y(y)); else cx.lineTo(X(x), Y(y)); } cx.stroke(); cx.setLineDash([]); }
    cable(0, "rgba(40,40,60,.35)", 1.5, [5, 5]);
    var ext = shown / 30.48 * ex; cable(ext, "#f04a00", 3.5);
    cx.fillStyle = "rgba(60,50,60,.75)"; cx.fillRect(X(-2600), Y(250 - ext * 0.9), 5200 * sc, 4);
    var ay = Y(276 - ext), a0 = Y(276); cx.strokeStyle = "#222"; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(gx + 40, a0); cx.lineTo(gx + 40, ay); cx.stroke();
    if (Math.abs(ay - a0) > 6) { var dir = ay > a0 ? 1 : -1; cx.beginPath(); cx.moveTo(gx + 35, ay - dir * 6); cx.lineTo(gx + 40, ay); cx.lineTo(gx + 45, ay - dir * 6); cx.stroke(); }
    cx.fillStyle = "#222"; cx.font = "700 12px " + FONT; cx.textAlign = "left"; cx.fillText((shown >= 0 ? "↧ " : "↥ ") + Math.abs(shown).toFixed(0) + T(" cm", " ซม."), gx + 50, (ay + a0) / 2 + 4);
    cx.fillStyle = "#555"; cx.font = "600 10px " + FONT; cx.fillText(T("movement drawn 60× bigger", "ขยายการเคลื่อนที่ 60 เท่า"), 8, 14);
    if (tl) tl.textContent = T0c + " °C";
    if (out) out.innerHTML = T("At " + T0c + " °C the middle of the main span sits <b>" + Math.abs(cm).toFixed(0) + " cm " + (cm >= 0 ? "lower" : "higher") + "</b> than on a 15 °C day, from the cable's stretch alone: " + K.toFixed(3) + " ft for every degree.",
      "ที่ " + T0c + " °C กลางช่วงสะพาน" + (cm >= 0 ? "ต่ำ" : "สูง") + "กว่าวันที่อากาศ 15 °C <b>" + Math.abs(cm).toFixed(0) + " ซม.</b> จากการยืดของสายเคเบิลอย่างเดียว องศาละ " + (K * 30.48).toFixed(1) + " ซม.");
    if (Math.abs(shown - cm) > 0.3) loop.kick();
  }
  var loop = Loop(cv, draw); tin.addEventListener("input", function () { tin.dataset.touched = 1; loop.kick(); });
  onLive(function (l) { if (l.w && !tin.dataset.touched) { tin.value = Math.round(l.w.temperature_2m); loop.kick(); } });
  onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();

/* ======================================================================= FROM WHERE YOU ARE */
(function globe() {
  var cv = $("cv-globe"); if (!cv) return; var C = Canvas(cv), cx = C.cx, out = $("globe-out"), land = null, wrap = 0, wrapping = false, lastT = null, spin = 0;
  var Z = { "Asia/Bangkok": [18.79, 98.98, "Chiang Mai", "เชียงใหม่"], "America/Los_Angeles": [37.7749, -122.4194, "San Francisco", "ซานฟรานซิสโก"], "America/New_York": [40.71, -74.01, "New York", "นิวยอร์ก"],
    "America/Chicago": [41.88, -87.63, "Chicago", "ชิคาโก"], "America/Denver": [39.74, -104.99, "Denver", "เดนเวอร์"], "America/Phoenix": [33.45, -112.07, "Phoenix", "ฟีนิกซ์"], "America/Vancouver": [49.28, -123.12, "Vancouver", "แวนคูเวอร์"],
    "America/Mexico_City": [19.43, -99.13, "Mexico City", "เม็กซิโกซิตี"], "America/Sao_Paulo": [-23.55, -46.63, "São Paulo", "เซาเปาลู"], "Europe/London": [51.51, -0.13, "London", "ลอนดอน"],
    "Europe/Paris": [48.86, 2.35, "Paris", "ปารีส"], "Europe/Berlin": [52.52, 13.4, "Berlin", "เบอร์ลิน"], "Europe/Istanbul": [41.01, 28.98, "Istanbul", "อิสตันบูล"], "Africa/Lagos": [6.52, 3.38, "Lagos", "ลากอส"],
    "Africa/Nairobi": [-1.29, 36.82, "Nairobi", "ไนโรบี"], "Asia/Dubai": [25.2, 55.27, "Dubai", "ดูไบ"], "Asia/Kolkata": [28.61, 77.21, "Delhi", "เดลี"], "Asia/Yangon": [16.84, 96.17, "Yangon", "ย่างกุ้ง"],
    "Asia/Vientiane": [17.97, 102.6, "Vientiane", "เวียงจันทน์"], "Asia/Ho_Chi_Minh": [10.82, 106.63, "Ho Chi Minh City", "โฮจิมินห์"], "Asia/Singapore": [1.35, 103.82, "Singapore", "สิงคโปร์"],
    "Asia/Shanghai": [31.23, 121.47, "Shanghai", "เซี่ยงไฮ้"], "Asia/Hong_Kong": [22.32, 114.17, "Hong Kong", "ฮ่องกง"], "Asia/Manila": [14.6, 120.98, "Manila", "มะนิลา"], "Asia/Tokyo": [35.68, 139.69, "Tokyo", "โตเกียว"],
    "Asia/Seoul": [37.57, 126.98, "Seoul", "โซล"], "Australia/Sydney": [-33.87, 151.21, "Sydney", "ซิดนีย์"], "Pacific/Auckland": [-36.85, 174.76, "Auckland", "โอ๊คแลนด์"], "Pacific/Honolulu": [21.31, -157.86, "Honolulu", "โฮโนลูลู"] };
  var here = (function () { var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {} var z = Z[tz];
    if (z) return { lat: z[0], lon: z[1], name: L === "th" ? z[3] : z[2] }; return { lat: 18.79, lon: 98.98, name: T("Chiang Mai", "เชียงใหม่") }; })();
  function v3(lat, lon) { return [cos(lat * rad) * cos(lon * rad), cos(lat * rad) * sin(lon * rad), sin(lat * rad)]; }
  function slerp(a, b, t) { var d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)); if (d < 1e-6) return a; var s1 = sin((1 - t) * d) / sin(d), s2 = sin(t * d) / sin(d);
    return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2]; }
  function bearing(a, b) { var f1 = a.lat * rad, f2 = b.lat * rad, dl = (b.lon - a.lon) * rad; return (atan(sin(dl) * cos(f2), cos(f1) * sin(f2) - sin(f1) * cos(f2) * cos(dl)) / rad + 360) % 360; }
  function draw(t) {
    var W = C.W, H = C.H, R = Math.min(W, H) * 0.42, ox = W / 2, oy = H / 2, dt = lastT == null ? 0 : Math.min(0.1, t - lastT); lastT = t;
    var A = v3(here.lat, here.lon), B = v3(BR.lat, BR.lon), dAng = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1)), km = dAng * 6371;
    var M = slerp(A, B, 0.5), mn = Math.hypot(M[0], M[1], M[2]); M = [M[0] / mn, M[1] / mn, M[2] / mn];
    if (!RM) spin += dt * (wrapping ? 0.35 : 0.04);
    var clat = asin(M[2]) * (wrapping ? 0.35 : 1), clon = atan(M[1], M[0]) + sin(spin) * 0.25 + (wrapping ? spin * 3 : 0);
    function proj(v) { var lon = atan(v[1], v[0]) - clon, lat = asin(clamp(v[2], -1, 1)), x = cos(lat) * sin(lon), y = cos(clat) * sin(lat) - sin(clat) * cos(lat) * cos(lon), z = sin(clat) * sin(lat) + cos(clat) * cos(lat) * cos(lon);
      if (z <= 0) { var n = Math.hypot(x, y) || 1; x /= n; y /= n; } /* hidden: pin to the rim so fills close along the edge */
      return { X: ox + R * x, Y: oy - R * y, v: z > 0 }; }
    cx.clearRect(0, 0, W, H);
    var sea = cx.createRadialGradient(ox - R * 0.35, oy - R * 0.4, R * 0.1, ox, oy, R); sea.addColorStop(0, "#5fc0e8"); sea.addColorStop(1, "#1a5d9a");
    cx.fillStyle = sea; cx.beginPath(); cx.arc(ox, oy, R, 0, 7); cx.fill();
    cx.strokeStyle = "rgba(255,255,255,.14)"; cx.lineWidth = 1;
    for (var la = -60; la <= 60; la += 30) { cx.beginPath(); var st2 = false; for (var lo = -180; lo <= 180; lo += 5) { var p = proj(v3(la, lo)); if (p.v) { if (st2) cx.lineTo(p.X, p.Y); else cx.moveTo(p.X, p.Y); st2 = true; } else st2 = false; } cx.stroke(); }
    for (lo = -180; lo < 180; lo += 30) { cx.beginPath(); st2 = false; for (la = -90; la <= 90; la += 5) { p = proj(v3(la, lo)); if (p.v) { if (st2) cx.lineTo(p.X, p.Y); else cx.moveTo(p.X, p.Y); st2 = true; } else st2 = false; } cx.stroke(); }
    if (land) { cx.fillStyle = "#f6e7c1"; cx.strokeStyle = "rgba(120,90,40,.35)";
      land.forEach(function (r) { cx.beginPath(); var any = false; for (var i = 0; i < r.length; i += 2) { var q = proj(v3(r[i + 1], r[i])); if (q.v) any = true;
        if (i === 0) cx.moveTo(q.X, q.Y); else cx.lineTo(q.X, q.Y); } if (any) { cx.closePath(); cx.fill(); } }); }
    /* 80,000 miles of wire, wound around the equator: 3.2 turns */
    if (wrap > 0) { var turns = 80000 / 24901, tot = wrap * turns; cx.strokeStyle = "#f04a00"; cx.lineWidth = 2; cx.beginPath(); var on = false;
      for (var u = 0; u <= tot; u += 0.004) { var lat2 = -6 + 12 * (u / turns), q2 = proj(v3(lat2, u * 360 - 180)); if (q2.v) { if (on) cx.lineTo(q2.X, q2.Y); else cx.moveTo(q2.X, q2.Y); on = true; } else on = false; } cx.stroke();
      if (!RM && wrap < 1) { wrap = Math.min(1, wrap + dt * 0.12); } }
    /* the great circle from you to the bridge, with a little bridge running along it */
    cx.strokeStyle = "#ff5a1f"; cx.lineWidth = 3; cx.setLineDash([2, 6]); cx.lineCap = "round"; cx.beginPath(); var on2 = false;
    for (var k = 0; k <= 80; k++) { var q3 = proj(slerp(A, B, k / 80)); if (q3.v) { if (on2) cx.lineTo(q3.X, q3.Y); else cx.moveTo(q3.X, q3.Y); on2 = true; } else on2 = false; } cx.stroke(); cx.setLineDash([]);
    var ph = RM ? 0.7 : (t * 0.12) % 1, qm = proj(slerp(A, B, ph)); if (qm.v) { cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(qm.X, qm.Y, 4, 0, 7); cx.fill(); }
    [[A, here.name, "#1b2c4a"], [B, T("Golden Gate", "โกลเดนเกต"), "#f04a00"]].forEach(function (m) { var q = proj(m[0]); if (!q.v) return; cx.fillStyle = m[2]; cx.beginPath(); cx.arc(q.X, q.Y, 6, 0, 7); cx.fill();
      cx.strokeStyle = "#fff"; cx.lineWidth = 2; cx.stroke(); cx.font = "800 12px " + FONT; cx.textAlign = "left"; cx.fillStyle = "#fff"; cx.strokeStyle = "rgba(0,0,0,.55)"; cx.lineWidth = 3; cx.strokeText(m[1], q.X + 9, q.Y + 4); cx.fillText(m[1], q.X + 9, q.Y + 4); });
    var sh = cx.createRadialGradient(ox - R * 0.4, oy - R * 0.45, 0, ox, oy, R * 1.05); sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(0.7, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,20,60,.35)");
    cx.fillStyle = sh; cx.beginPath(); cx.arc(ox, oy, R, 0, 7); cx.fill();
    if (out && !out.dataset.done) { out.dataset.done = 1; var br = bearing(here, BR), anti = { lat: -BR.lat, lon: BR.lon + 180 };
      out.innerHTML = T("From <b>" + here.name + "</b>: <b>" + fmt(km) + " km</b> (" + fmt(km / 1.609344) + " miles) along the shortest path over the curve of the Earth. Set off toward the <b>" + compass(br) + "</b> (" + br.toFixed(0) + "°). Walking at 5 km an hour, day and night: <b>" + fmt(km / 5 / 24) + " days</b>. Dig straight down from the bridge and you come out in the Indian Ocean at " + (-anti.lat).toFixed(1) + "° S, " + anti.lon.toFixed(1) + "° E.",
        "จาก<b>" + here.name + "</b> ถึงสะพาน <b>" + fmt(km) + " กิโลเมตร</b> ตามเส้นทางสั้นที่สุดบนผิวโลกที่โค้ง ออกเดินทางไปทาง<b>" + compass(br) + "</b> (" + br.toFixed(0) + "°) เดินชั่วโมงละ 5 กิโลเมตรทั้งวันทั้งคืน ใช้เวลา <b>" + fmt(km / 5 / 24) + " วัน</b> ถ้าขุดดินลงไปตรง ๆ จากสะพาน จะโผล่ขึ้นมากลางมหาสมุทรอินเดีย ที่ " + (-anti.lat).toFixed(1) + "° ใต้ " + anti.lon.toFixed(1) + "° ตะวันออก"); }
  }
  var loop = Loop(cv, draw);
  getJSON(ROOT + "land.json").then(function (j) { land = j; loop.kick(); }).catch(function () {});
  var hb = $("globe-here");
  if (hb && navigator.geolocation) hb.addEventListener("click", function () { hb.disabled = true; navigator.geolocation.getCurrentPosition(function (p) {
    here = { lat: p.coords.latitude, lon: p.coords.longitude, name: T("you", "คุณ") }; hb.hidden = true; if (out) delete out.dataset.done; loop.kick(); }, function () { hb.disabled = false; }, { maximumAge: 6e5, timeout: 15000 }); });
  else if (hb) hb.hidden = true;
  var wb = $("globe-wrap"); if (wb) wb.addEventListener("click", function () { wrapping = !wrapping; if (wrapping) wrap = RM ? 1 : Math.max(wrap, 0.001); else wrap = 0; wb.setAttribute("aria-pressed", wrapping ? "true" : "false"); loop.kick(); });
  onResize(function () { C.fit(); loop.kick(); }); loop.kick();
})();
})();
