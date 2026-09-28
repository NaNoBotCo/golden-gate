# -*- coding: utf-8 -*-
"""build.py: write docs/index.html (English) and docs/th/index.html (Thai) from one source.

One inlined stylesheet, system fonts, site-kit parallax bands for the photographs, a top
bar that folds away, and docs/gg.js for everything that moves.
    python3 tools/build.py
"""
import html
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DOCS = os.path.join(ROOT, "docs")
sys.path.insert(0, HERE)
from bands import band  # noqa: E402

SITE = "https://nanobotco.github.io/golden-gate/"
L = "en"


def e(x):
    return html.escape("" if x is None else str(x))


def t(en, th):
    return th if L == "th" else en


def cred(who, lic, url=""):
    w = f'<a href="{e(url)}">{e(who)}</a>' if url else e(who)
    return f"{w} · {e(lic)}"


C = "https://commons.wikimedia.org/wiki/File:"

# img, kicker, head, line (en, th pairs), credit, class
BANDS = {
    "marshalls": (("Marshall's Beach", "หาดมาร์แชลล์"), ("Orange against blue", "สีส้มตัดฟ้าคราม"),
                  ("Irving Morrow picked the colour because it sits warm on the hills and stands out from the sea and sky.",
                   "เออร์วิง มอร์โรว์ เลือกสีนี้เพราะกลมกลืนกับเนินเขาสีอุ่น และตัดกับทะเลและท้องฟ้า"),
                  ("Frank Schulenburg", "CC BY-SA 4.0", C + "Golden_Gate_Bridge_as_seen_from_Marshall%E2%80%99s_Beach,_March_2018.jpg"), "tall"),
    "fort-point": (("Fort Point", "ป้อมฟอร์ตพอยต์"), ("A bridge inside the bridge", "สะพานในสะพาน"),
                   ("Charles Ellis drew a steel arch over the 1861 fort so nobody had to tear it down.",
                    "ชาลส์ เอลลิส ออกแบบโค้งเหล็กคร่อมป้อมเก่าปี 1861 จะได้ไม่ต้องรื้อป้อมทิ้ง"),
                   ("Brocken Inaglory", "CC BY-SA 3.0", C + "Fort_Point_National_Historic_Site_and_Golden_Gate_Bridge.jpg"), "right"),
    "fog-deck": (("Summer", "หน้าร้อน"), ("The fog comes in under the road", "หมอกไหลเข้ามาใต้ถนน"),
                 ("Warm, wet ocean air rides in over cold water and turns to cloud at sea level.",
                  "อากาศชื้นอุ่นจากทะเลลอยผ่านน้ำเย็น แล้วกลายเป็นเมฆที่ระดับน้ำทะเล"),
                 ("Brocken Inaglory", "CC BY-SA 3.0", C + "Golden_Gate_Bridge_at_sunset_1.jpg"), ""),
    "building": (("1933–1937", "1933–1937"), ("1,604 days", "1,604 วัน"),
                 ("Work began on 5 January 1933. Cars crossed on 28 May 1937.",
                  "เริ่มงาน 5 มกราคม 1933 รถยนต์ข้ามได้ 28 พฤษภาคม 1937"),
                 ("Chas. M. Hiller, Associated Oil Company", "public domain", C + "Construction_of_the_Golden_Gate_Bridge_3c22793u.jpg"), "right"),
    "carriers-1936": (("November 1936", "พฤศจิกายน 1936"), ("The fleet sails under", "กองเรือแล่นลอดใต้สะพาน"),
                      ("US Navy aircraft carriers pass beneath the unfinished bridge, six months before it opened.",
                       "เรือบรรทุกเครื่องบินของกองทัพเรือสหรัฐฯ แล่นลอดสะพานที่ยังสร้างไม่เสร็จ หกเดือนก่อนเปิดใช้"),
                      ("U.S. Navy", "public domain", C + "US_Navy_aircraft_carriers_passing_under_the_Golden_Gate_Bridge_in_November_1936.jpg"), ""),
    "hawk-hill": (("Hawk Hill, blue hour", "เนินฮอว์กฮิลล์ ยามโพล้เพล้"), ("The lights come on", "ไฟเริ่มสว่าง"),
                  ("Red lamps top the towers and trace the cables, for aircraft. Green and white under mid-span, for ships.",
                   "ไฟแดงบนยอดเสาและตามสายเคเบิลไว้เตือนเครื่องบิน ไฟเขียวกับขาวใต้กลางสะพานไว้บอกเรือ"),
                  ("Daniel L. Lu", "CC BY-SA 4.0", C + "Golden_Gate_Bridge_and_San_Francisco_skyline_from_Hawk_Hill_at_Blue_Hour_dllu.jpg"), "right tall"),
    "night": (("Night", "กลางคืน"), ("Two towers, one city", "สองเสา หนึ่งเมือง"), ("", ""),
              ("Brocken Inaglory", "CC BY-SA 3.0", C + "Night_Panorama_of_Golden_Gate_Bridge.jpg"), "short"),
    "low-fog": (("From the Marin Headlands", "จากเนินเขามารินเฮดแลนด์ส"), ("Two bridges and a sea of fog", "สองสะพานกับทะเลหมอก"), ("", ""),
                ("Brocken Inaglory", "CC BY-SA 3.0", C + "San_Francisco_with_two_bridges_and_the_low_fog.jpg"), ""),
}


def b(key, r):
    img, (ken, kth), (hen, hth), (len_, lth), (who, lic, url), cls = (key,) + BANDS[key]
    return band(r + "img/" + img + ".jpg", kicker=t(ken, kth), head=t(hen, hth), line=t(len_, lth),
                credit=cred(who, lic, url), cls=cls)


SLAB = [("4,200", "feet between the towers", "ฟุต ระยะระหว่างเสา", "1,280 m"),
        ("746", "feet, tower above water", "ฟุต ความสูงเสาจากน้ำ", "227 m"),
        ("470", "feet, the cable's dip", "ฟุต ส่วนหย่อนของสายเคเบิล", "143 m"),
        ("27,572", "wires in each cable", "เส้นลวดในสายเคเบิลแต่ละเส้น", "Ø 4.9 mm"),
        ("80,000", "miles of wire", "ไมล์ ลวดทั้งหมด", "129,000 km"),
        ("1937", "opened", "เปิดใช้", "27 May")]

STORIES = [
    ("27 May 1937", "27 พ.ค. 1937", "Pedestrian Day", "วันคนเดินข้าม",
     "Before any car, 200,000 people crossed on foot and on roller skates. Donald Bryan, a college sprinter, was first end to end.",
     "ก่อนรถคันแรก คนสองแสนคนเดินและเล่นโรลเลอร์สเกตข้ามสะพาน โดนัลด์ ไบรอัน นักวิ่งระยะสั้นจากวิทยาลัย ข้ามถึงปลายทางเป็นคนแรก"),
    ("28 May 1937", "28 พ.ค. 1937", "A blockade of beauty queens", "ด่านนางงาม",
     "The officials' motorcade passed three ceremonial barriers. The last was a row of beauty queens, who made Joseph Strauss hand the bridge over before they let him through. At noon, President Roosevelt pressed a button in Washington and the cars began.",
     "ขบวนรถของเจ้าหน้าที่ต้องผ่านด่านพิธีสามด่าน ด่านสุดท้ายเป็นแถวนางงาม ซึ่งให้โจเซฟ สเตราส์ ส่งมอบสะพานก่อนจึงยอมให้ผ่าน เที่ยงวันนั้น ประธานาธิบดีรูสเวลต์กดปุ่มที่วอชิงตัน รถยนต์เริ่มวิ่งข้าม"),
    ("1933–1937", "1933–1937", "The first hard hats", "หมวกนิรภัยใบแรก ๆ",
     "Edward Bullard of San Francisco had made a 'Hard-Boiled Hat' of steamed canvas and glue for miners. He adapted it for the bridge crews.",
     "เอ็ดเวิร์ด บุลลาร์ด ชาวซานฟรานซิสโก ทำ \"หมวกต้มแข็ง\" จากผ้าใบนึ่งกับกาวให้คนงานเหมือง แล้วดัดแปลงให้คนงานสร้างสะพานใส่"),
    ("1933–1937", "1933–1937", "The Half Way to Hell Club", "ชมรมครึ่งทางสู่นรก",
     "A net hung under the work caught 19 men, who named their club for how far they had fallen. On 17 February 1937 a scaffold broke through the net and ten men died.",
     "ตาข่ายที่ขึงใต้ที่ทำงานรับคนตกไว้ได้ 19 คน พวกเขาตั้งชื่อชมรมตามระยะที่ตกลงมา วันที่ 17 กุมภาพันธ์ 1937 นั่งร้านหล่นทะลุตาข่าย คนงานเสียชีวิตสิบคน"),
    ("1846", "1846", "Chrysopylae", "คริโซไพลี",
     "Captain John Frémont named the strait for Istanbul's Golden Horn: Chrysopylae, Golden Gate. The bridge is orange; the gate is the water.",
     "ร้อยเอกจอห์น เฟรมองต์ ตั้งชื่อช่องแคบนี้ตามอ่าวโกลเดนฮอร์นของอิสตันบูล ว่า คริโซไพลี แปลว่าประตูทอง สะพานสีส้ม ส่วน \"ประตูทอง\" คือช่องน้ำ"),
    ("24 May 1987", "24 พ.ค. 1987", "The deck went flat", "พื้นสะพานแบนราบ",
     "For the 50th birthday about 300,000 people crowded onto the deck at once, and the gentle upward arch of the main span flattened out under them. It was built to flex that way.",
     "งานวันเกิดครบ 50 ปี คนราวสามแสนคนเบียดกันอยู่บนสะพานพร้อมกัน ส่วนโค้งนูนของช่วงกลางแบนราบลงใต้เท้าพวกเขา สะพานออกแบบให้ยืดหยุ่นได้แบบนั้น"),
    ("19 May 2004", "19 พ.ค. 2004", "A deer takes the toll lane", "กวางวิ่งผ่านช่องจ่ายค่าผ่านทาง",
     "A young deer bounded the whole span, zipped through a FasTrak lane, took the 19th Avenue exit and vanished into the Presidio. Two more crossed in the evening commute in 2014.",
     "กวางหนุ่มกระโดดวิ่งข้ามสะพานทั้งช่วง ผ่านช่องจ่ายค่าผ่านทางอัตโนมัติ ออกทางแยกถนนที่ 19 แล้วหายเข้าป่าเพรสซิดิโอ ปี 2014 มีกวางอีกสองตัวข้ามตอนรถติดเย็น"),
    ("29 Aug 2005", "29 ส.ค. 2005", "Ostrich", "นกกระจอกเทศ",
     "A six-foot ostrich broke out of a cargo van and stopped traffic both ways while people ran for their cameras.",
     "นกกระจอกเทศสูงหกฟุตพังออกจากรถตู้ขนของ รถหยุดทั้งสองฝั่ง ผู้คนวิ่งหากล้องกันวุ่น"),
    ("10 Aug 2008", "10 ส.ค. 2008", "A pelican named G.G.", "นกกระทุงชื่อจีจี",
     "A dazed pelican landed on the roadway. Bird rescuers named her G.G. and let her go a month later.",
     "นกกระทุงมึนงงตกลงบนถนน ทีมช่วยเหลือนกตั้งชื่อเธอว่าจีจี แล้วปล่อยกลับสู่ธรรมชาติในเดือนถัดมา"),
    ("5 Feb 2001", "5 ก.พ. 2001", "A Beetle on a string", "รถเต่าห้อยสะพาน",
     "Engineering students from the University of British Columbia, keeping their tradition of hanging something large from something famous, dangled a Volkswagen Beetle off the side.",
     "นักศึกษาวิศวะจากมหาวิทยาลัยบริติชโคลัมเบีย ทำตามประเพณีแขวนของชิ้นใหญ่จากสิ่งก่อสร้างมีชื่อ ห้อยรถโฟล์กสวาเกนเต่าลงข้างสะพาน"),
    ("27 Oct 1989", "27 ต.ค. 1989", "The busiest day", "วันที่รถมากที่สุด",
     "Ten days after the Loma Prieta earthquake broke the Bay Bridge, 162,414 vehicles crossed the Golden Gate. It came through undamaged.",
     "สิบวันหลังแผ่นดินไหวโลมาพรีเอตาทำสะพานเบย์บริดจ์เสียหาย รถ 162,414 คันข้ามโกลเดนเกต ซึ่งไม่เสียหายเลย"),
    ("Cincinnati", "ซินซินแนติ", "A brick in the anchorage", "อิฐก้อนหนึ่งในฐานยึด",
     "Joseph Strauss set a brick from his old university's demolished McMicken Hall into the south anchorage before the concrete went in.",
     "โจเซฟ สเตราส์ วางอิฐจากอาคารแมกมิกเคนฮอลล์ของมหาวิทยาลัยเก่าที่ถูกรื้อไปแล้ว ลงในฐานยึดสายเคเบิลฝั่งใต้ ก่อนเทคอนกรีต"),
]

YEARS = [
    ("1846", "Frémont names the strait Golden Gate.", "เฟรมองต์ตั้งชื่อช่องแคบว่าโกลเดนเกต"),
    ("1916", "James Wilkins proposes a bridge in the San Francisco Bulletin.", "เจมส์ วิลกินส์ เสนอให้สร้างสะพานในหนังสือพิมพ์ซานฟรานซิสโกบุลเลติน"),
    ("1923", "The Golden Gate Bridge and Highway District Act passes.", "กฎหมายจัดตั้งเขตสะพานและทางหลวงโกลเดนเกตผ่านสภา"),
    ("1933", "5 January: work begins.", "5 มกราคม เริ่มก่อสร้าง"),
    ("1937", "27 May on foot, 28 May by car. Longest main span and tallest towers of any suspension bridge.", "27 พฤษภาคม คนเดินข้าม 28 พฤษภาคม รถข้าม ช่วงกลางยาวที่สุดและเสาสูงที่สุดในบรรดาสะพานแขวน"),
    ("1951", "1 December: gusts of 69 mph close the bridge; the deck sways and rolls.", "1 ธันวาคม ลมกระโชก 111 กม./ชม. ต้องปิดสะพาน พื้นสะพานโยกและบิด"),
    ("1954", "Bracing under the deck stiffens it against twisting.", "ติดโครงค้ำใต้พื้นสะพาน ให้ต้านการบิดได้ดีขึ้น"),
    ("1964", "The Verrazzano–Narrows Bridge in New York takes the longest-span title.", "สะพานเวอร์ราซาโน–แนโรว์สในนิวยอร์กมีช่วงกลางยาวกว่า"),
    ("1968", "Tolls southbound only: the first major bridge in the world to charge one way.", "เก็บค่าผ่านทางขาลงใต้ทางเดียว เป็นสะพานใหญ่แห่งแรกของโลกที่ทำแบบนี้"),
    ("1970", "The ten-cent sidewalk toll ends.", "ยกเลิกค่าเดินข้ามสิบเซนต์"),
    ("1986", "A steel deck 40% lighter replaces the concrete one, 747 sections over 401 nights.", "เปลี่ยนพื้นคอนกรีตเป็นพื้นเหล็กที่เบากว่า 40% ทีละ 747 ชิ้น ใช้เวลา 401 คืน"),
    ("1987", "The 50th birthday flattens the deck.", "งานวันเกิดครบ 50 ปี พื้นสะพานแบนราบ"),
    ("2020", "New railing slats let the bridge take 100 mph winds, and it starts to sing.", "ราวสะพานแบบใหม่ช่วยให้ทนลม 161 กม./ชม. และสะพานเริ่มร้องเพลง"),
]

SOURCES = [
    ("Golden Gate Bridge District: design and construction stats", "https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/"),
    ("District: colour and Art Deco styling", "https://www.goldengate.org/bridge/history-research/bridge-features/color-art-deco-styling/"),
    ("District: painting the bridge", "https://www.goldengate.org/bridge/bridge-maintenance/painting-the-bridge/"),
    ("District: foghorns and beacons", "https://www.goldengate.org/bridge/history-research/bridge-features/foghorns-beacons/"),
    ("District: FAQs", "https://www.goldengate.org/bridge/history-research/statistics-data/faqs/"),
    ("District: fun and interesting events", "https://www.goldengate.org/bridge/history-research/moments-events/fun-interesting-events/"),
    ("District: what's in a name", "https://www.goldengate.org/bridge/history-research/statistics-data/whats-in-a-name/"),
    ("District: cable tension vs tower height exhibit", "https://www.goldengate.org/exhibits/suspension-cable-tension-vs-tower-height/"),
    ("US Naval Institute Proceedings, April 1935 (470 ft sag)", "https://www.usni.org/magazines/proceedings/1935/april/golden-gate-and-san-francisco-bay-bridges"),
    ("Wikipedia: Golden Gate Bridge", "https://en.wikipedia.org/wiki/Golden_Gate_Bridge"),
    ("NOAA Tides & Currents, station 9414290", "https://tidesandcurrents.noaa.gov/stationhome.html?id=9414290"),
    ("Open-Meteo weather and marine APIs", "https://open-meteo.com/"),
    ("Natural Earth", "https://www.naturalearthdata.com/"),
    ("Wikimedia Commons", "https://commons.wikimedia.org/wiki/Category:Golden_Gate_Bridge"),
    ("Wikipedia: Lord Kelvin's tide-predicting machine", "https://en.wikipedia.org/wiki/Tide-predicting_machine"),
    ("Wikipedia: Aeolian sound", "https://en.wikipedia.org/wiki/Aeolian_sound"),
]

MADE = [
    ("NOAA Tides & Currents", "public domain", "tide wheels, the water level now", "วงล้อน้ำขึ้นน้ำลง ระดับน้ำตอนนี้"),
    ("Open-Meteo", "CC BY 4.0", "wind, temperature, dew point, visibility, sea temperature", "ลม อุณหภูมิ จุดน้ำค้าง ทัศนวิสัย อุณหภูมิน้ำทะเล"),
    ("Natural Earth", "public domain", "the land on the globe", "แผ่นดินบนลูกโลก"),
    ("Wikimedia Commons", "CC BY-SA, public domain", "the photographs", "ภาพถ่าย"),
    ("Wikipedia", "CC BY-SA 4.0", "facts and dates", "ข้อเท็จจริงและวันที่"),
    ("Golden Gate Bridge District", "", "numbers, colour formula, foghorn timing, painters", "ตัวเลข สูตรสี จังหวะแตรหมอก ช่างทาสี"),
]


def page():
    r = "../" if L == "th" else ""
    here = SITE + ("th/" if L == "th" else "")
    title = t("The Golden Gate Bridge", "สะพานโกลเดนเกต")
    desc = t("The Golden Gate Bridge drawn by arithmetic under the sun, moon, fog and tide over it right now. "
             "Hang the cable, run Kelvin's tide wheels, see what fits underneath, hear the railing sing, paint it, and measure it from where you are.",
             "สะพานโกลเดนเกตที่วาดด้วยเลขคณิต ใต้ดวงอาทิตย์ พระจันทร์ หมอก และน้ำขึ้นน้ำลงที่อยู่เหนือสะพานตอนนี้ "
             "ลองแขวนสายเคเบิล หมุนวงล้อทำนายน้ำของเคลวิน ดูว่าอะไรลอดใต้สะพานได้ ฟังราวสะพานร้องเพลง ทาสีสะพาน และวัดระยะจากที่ที่คุณอยู่")
    nav = [("hang", "Cable", "สายเคเบิล"), ("tide", "Tide", "น้ำ"), ("fit", "Under", "ใต้สะพาน"), ("fog", "Fog", "หมอก"),
           ("sing", "Song", "เพลง"), ("paint", "Paint", "สี"), ("breathe", "Heat", "ร้อน"), ("globe", "You", "คุณ"),
           ("days", "Days", "วันต่าง ๆ"), ("sources", "Sources", "แหล่งข้อมูล")]
    navh = "".join(f'<a href="#{a}">{e(t(b_, c))}</a>' for a, b_, c in nav)
    langsw = (f'<a href="{r}" hreflang="en" lang="en"{" aria-current=page" if L == "en" else ""}>EN</a> '
              f'<a href="{r}th/" hreflang="th" lang="th"{" aria-current=page" if L == "th" else ""}>ไทย</a>')
    slab = "".join(f'<div><b>{e(n)}</b><span>{e(t(a, b_))}</span><i>{e(m)}</i></div>' for n, a, b_, m in SLAB)
    stories = "".join(f'<article class="story"><span class="when">{e(t(d, dth))}</span><h3>{e(t(h, hth))}</h3><p>{e(t(p, pth))}</p></article>'
                      for d, dth, h, hth, p, pth in STORIES)
    years = "".join(f'<li><b>{y}</b><span>{e(t(a, b_))}</span></li>' for y, a, b_ in YEARS)
    srcs = "".join(f'<li><a href="{e(u)}">{e(n)}</a></li>' for n, u in SOURCES)
    made = "".join(f'<li><b>{e(n)}</b> <span class="lic">{e(lic)}</span><br>{e(t(a, b_))}</li>' for n, lic, a, b_ in MADE)
    css = open(os.path.join(HERE, "bands.css"), encoding="utf-8").read() + CSS

    def rng(i, lab, lo, hi, val, step=1, unit=""):
        return (f'<label class="rng"><span>{e(lab)} <output id="{i}-l"></output></span>'
                f'<input type="range" id="{i}" min="{lo}" max="{hi}" value="{val}" step="{step}"></label>')

    return f"""<!doctype html><html lang="{L}" data-root="{r}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
<title>{e(title)} · {e(t("drawn by arithmetic", "วาดด้วยเลขคณิต"))}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#f04a00">
<link rel="canonical" href="{here}">
<link rel="alternate" hreflang="en" href="{SITE}"><link rel="alternate" hreflang="th" href="{SITE}th/"><link rel="alternate" hreflang="x-default" href="{SITE}">
<meta property="og:type" content="website"><meta property="og:site_name" content="The Golden Gate Bridge · สะพานโกลเดนเกต">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{here}">
<meta property="og:image" content="{SITE}card.jpg"><meta property="og:image:secure_url" content="{SITE}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(t("The Golden Gate Bridge drawn by arithmetic at sunset, fog pouring under the deck", "สะพานโกลเดนเกตวาดด้วยเลขคณิตยามอาทิตย์ตก หมอกไหลใต้พื้นสะพาน"))}">
<meta property="og:locale" content="{t("en_US", "th_TH")}"><meta property="og:locale:alternate" content="{t("th_TH", "en_US")}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}card.jpg">
<link rel="icon" href="{r}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{SITE}llms.txt" title="llms.txt">
<style>{css}</style>
</head><body>
<header class="top"><div class="in">
<a class="brand" href="{r}{"th/" if L == "th" else ""}"><svg viewBox="0 0 64 24" aria-hidden="true"><path d="M2 20h60M14 20V3M50 20V3M2 12Q14 3 14 3Q32 19 50 3Q50 3 62 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg> Golden Gate <span class="th">โกลเดนเกต</span></a>
<nav aria-label="{e(t("Sections", "หัวข้อ"))}">{navh}</nav>
<span class="langsw">{langsw}</span>
</div></header>

<section class="hero" aria-label="{e(t("The bridge, drawn live", "สะพาน วาดสด"))}">
<canvas id="gg-hero" role="img" aria-label="{e(t("The Golden Gate Bridge drawn from its own numbers, under the sky over it now", "สะพานโกลเดนเกตวาดจากตัวเลขของสะพานเอง ใต้ท้องฟ้าเหนือสะพานตอนนี้"))}"></canvas>
<div class="hero-t">
<span class="kicker">{e(t("San Francisco · 1937 · 4,200 feet", "ซานฟรานซิสโก · 1937 · 4,200 ฟุต"))}</span>
<h1>{e(title)}</h1>
<p class="lede">{e(t("Drawn by arithmetic, under the sun, moon, fog and tide that are over it right now.", "วาดด้วยเลขคณิต ใต้ดวงอาทิตย์ พระจันทร์ หมอก และน้ำ ที่อยู่เหนือสะพานตอนนี้"))}</p>
<p class="hint">{e(t("Drag the picture to walk around the bay.", "ลากภาพเพื่อเดินรอบอ่าว"))}</p>
</div>
</section>
<div class="deck">
<div class="ctl">
{rng("gg-time", t("Time", "เวลา"), -12, 12, 0, 0.25)}
{rng("gg-fog", t("Fog", "หมอก"), 0, 100, 35)}
{rng("gg-wind", t("Wind", "ลม"), 0, 75, 8)}
<div class="btns"><button type="button" id="gg-live" class="btn">{e(t("Now", "ตอนนี้"))}</button>
<button type="button" id="gg-sing" class="btn ghost" aria-pressed="false">♪ {e(t("Sing", "ร้องเพลง"))}</button>
<button type="button" id="gg-horn" class="btn ghost" aria-pressed="false">{e(t("Foghorns", "แตรหมอก"))}</button></div>
</div>
<p class="now" id="gg-now" aria-live="polite"></p>
</div>

<main>
<div class="slab">{slab}</div>

<section id="hang" class="toy">
<h2>{e(t("Hang a chain", "แขวนโซ่"))}</h2>
<p class="lede">{e(t("Hold a chain by its ends and it sags into a catenary. Hang a flat, even road from it and the curve turns into a parabola. The Golden Gate's main cable carries the road, so it is the parabola.",
                     "จับปลายโซ่สองข้างแล้วปล่อยให้หย่อน จะได้เส้นโค้งที่เรียกว่าคาทีนารี ลองแขวนถนนเรียบที่หนักเท่ากันตลอดไว้ใต้โซ่ เส้นโค้งจะกลายเป็นพาราโบลา สายเคเบิลหลักของโกลเดนเกตแบกถนนไว้ จึงเป็นพาราโบลา"))}</p>
<div class="stage"><canvas id="cv-hang" class="c360"></canvas></div>
<div class="ctl">
{rng("hang-road", t("Road weight", "น้ำหนักถนน"), 0, 100, 100)}
{rng("hang-sag", t("Dip (taller towers, deeper dip)", "ส่วนหย่อน (เสาสูงขึ้น หย่อนได้มากขึ้น)"), 150, 900, 470, 10)}
</div>
<p class="out" id="hang-out" aria-live="polite"></p>
<div class="eqs">
<div class="eq"><span class="k">{e(t("the bridge", "สะพาน"))}</span><code>y = 470 × (x ÷ 2,100)²</code>
<p>{e(t("Reading it: x is how far you are from the middle, in feet. At a tower x is 2,100, so the cable is 470 feet higher there than at mid-span. Halfway to a tower it is a quarter as high: 117.5 feet.",
         "อ่านว่า: x คือระยะจากกลางสะพาน หน่วยเป็นฟุต ที่เสา x เท่ากับ 2,100 สายเคเบิลจึงสูงกว่ากลางช่วง 470 ฟุต ครึ่งทางไปถึงเสา สูงแค่หนึ่งในสี่ คือ 117.5 ฟุต"))}</p></div>
<div class="eq"><span class="k blue">{e(t("a chain alone", "โซ่อย่างเดียว"))}</span><code>y = a (cosh(x ÷ a) − 1)</code>
<p>{e(t("Reading it: a is the sideways pull divided by the chain's weight per foot. cosh grows slowly near the middle and fast near the ends, so a bare chain hangs a little fuller at the shoulders.",
         "อ่านว่า: a คือแรงดึงแนวนอน หารด้วยน้ำหนักโซ่ต่อฟุต ฟังก์ชัน cosh โตช้าตรงกลาง และโตเร็วตรงปลาย โซ่เปล่าจึงห้อยป่องที่ไหล่มากกว่าเล็กน้อย"))}</p></div>
<div class="eq"><span class="k jade">{e(t("the pull", "แรงดึง"))}</span><code>H = w L² ÷ (8 d)</code>
<p>{e(t("Reading it: the sideways pull H equals the weight per foot w, times the span L squared, divided by eight times the dip d. Double the dip and the pull halves. That is why the towers are tall.",
         "อ่านว่า: แรงดึงแนวนอน H เท่ากับน้ำหนักต่อฟุต w คูณความยาวช่วง L ยกกำลังสอง หารด้วยแปดเท่าของส่วนหย่อน d หย่อนมากขึ้นสองเท่า แรงดึงลดลงครึ่งหนึ่ง เสาจึงต้องสูง"))}</p></div>
</div>
<p class="mute small">{e(t("The side spans hang from the same pull, so their dip scales with span squared: 470 × (1,125 ÷ 4,200)² = 33.7 feet. The picture at the top uses it.",
                            "ช่วงข้างห้อยด้วยแรงดึงเท่ากัน ส่วนหย่อนจึงเป็นสัดส่วนกับความยาวช่วงยกกำลังสอง: 470 × (1,125 ÷ 4,200)² = 33.7 ฟุต ภาพด้านบนใช้ค่านี้"))}</p>
</section>

{b("marshalls", r)}

<section id="tide" class="toy">
<h2>{e(t("The tide machine", "เครื่องทำนายน้ำ"))}</h2>
<p class="lede">{e(t("In 1872 Lord Kelvin built a brass machine that predicted tides by adding up turning wheels. Here are eight wheels for the water under the Golden Gate, fitted to NOAA's prediction for its gauge at the Presidio, about 2 km from the south tower.",
                     "ปี 1872 ลอร์ดเคลวินสร้างเครื่องทองเหลืองที่ทำนายน้ำขึ้นน้ำลง ด้วยการบวกวงล้อที่หมุนอยู่หลายวง ที่นี่มีวงล้อแปดวงสำหรับน้ำใต้สะพานโกลเดนเกต ปรับให้ตรงกับพยากรณ์ของ NOAA ที่สถานีวัดน้ำเพรสซิดิโอ ห่างเสาใต้ราว 2 กิโลเมตร"))}</p>
<div class="stage"><canvas id="cv-tide" class="c360"></canvas></div>
<div class="ctl"><div class="btns"><button type="button" id="tide-play" class="btn" aria-pressed="true">{e(t("Run / stop", "เดิน / หยุด"))}</button>
<button type="button" id="tide-now" class="btn ghost">{e(t("Back to now", "กลับมาตอนนี้"))}</button></div></div>
<p class="out" id="tide-out" aria-live="polite"></p>
<ul class="keys">
<li><b>M2</b> {e(t("the moon, twice a day: one turn every 12 h 25 min", "พระจันทร์ วันละสองรอบ หมุนครบรอบทุก 12 ชม. 25 นาที"))}</li>
<li><b>K1 · O1 · P1 · Q1</b> {e(t("once a day, from the tilt of the moon's and sun's paths", "วันละรอบ เกิดจากแนวโคจรของพระจันทร์และดวงอาทิตย์ที่เอียง"))}</li>
<li><b>S2</b> {e(t("the sun, twice a day: exactly 12 hours", "ดวงอาทิตย์ วันละสองรอบ ทุก 12 ชั่วโมงพอดี"))}</li>
<li><b>N2 · K2</b> {e(t("the moon drawing nearer and farther, and the slow tilt of both", "พระจันทร์เข้าใกล้และถอยห่าง กับการเอียงอย่างช้า ๆ ของทั้งสอง"))}</li>
</ul>
<p class="mute small">{e(t("Line: the wheels. Blue dots: NOAA's prediction. Black dot: the water NOAA measured last.", "เส้น: วงล้อ จุดสีน้ำเงิน: พยากรณ์ของ NOAA จุดสีดำ: ระดับน้ำที่ NOAA วัดได้ล่าสุด"))}</p>
</section>

<section id="fit" class="toy">
<h2>{e(t("Will it fit?", "ลอดได้ไหม"))}</h2>
<p class="lede">{e(t("The bottom of the deck at mid-span is 220 feet above average high water. The tide adds or takes away a few feet, twice a day.",
                     "ใต้พื้นสะพานตรงกลางช่วง สูงจากระดับน้ำขึ้นสูงเฉลี่ย 220 ฟุต น้ำขึ้นน้ำลงเพิ่มหรือลดช่องนี้ไม่กี่ฟุต วันละสองรอบ"))}</p>
<div class="stage"><canvas id="cv-fit" class="c320"></canvas></div>
<div class="ctl"><div class="btns">
<button type="button" class="btn ghost" data-ship="cranes1" aria-pressed="false">{e(t("Cranes 2000", "ปั้นจั่น 2000"))}</button>
<button type="button" class="btn ghost" data-ship="cranes2" aria-pressed="true">{e(t("Cranes 2002 · 2005", "ปั้นจั่น 2002 · 2005"))}</button>
<button type="button" class="btn ghost" data-ship="zhenhua" aria-pressed="false">{e(t("Zhen Hua 15", "เจิ้นหัว 15"))}</button>
<button type="button" class="btn ghost" data-ship="me" aria-pressed="false">{e(t("You", "คุณ"))}</button></div>
<label class="num"><span>{e(t("Your height, cm", "ส่วนสูงของคุณ (ซม.)"))}</span><input type="number" id="fit-me" min="50" max="250" value="160" inputmode="numeric"></label>
</div>
<p class="out" id="fit-out" aria-live="polite"></p>
<p class="mute small">{e(t("Three ships brought giant cranes from China to the Port of Oakland: 223.75 feet tall in 2000 (about 8 feet to spare), 227.7 feet in 2002 and 2005 (12 and 9–10 feet). In 2010 the Zhen Hua 15 stopped in Drakes Bay to lower cranes that stood 253 feet.",
                            "เรือสามลำขนปั้นจั่นยักษ์จากจีนมาท่าเรือโอ๊กแลนด์ ปี 2000 สูง 223.75 ฟุต (เหลือที่ว่างราว 8 ฟุต) ปี 2002 และ 2005 สูง 227.7 ฟุต (เหลือ 12 และ 9–10 ฟุต) ปี 2010 เรือเจิ้นหัว 15 ต้องแวะอ่าวเดรกส์เพื่อลดปั้นจั่นที่สูง 253 ฟุต"))}</p>
</section>

{b("fort-point", r)}

<section id="fog" class="toy">
<h2>{e(t("Fog", "หมอก"))}</h2>
<p class="lede">{e(t("Air turns to fog when it cools to its dew point, the temperature at which it can hold no more water. Wet Pacific air blowing over the cold California Current does that at sea level.",
                     "อากาศกลายเป็นหมอกเมื่อเย็นลงถึงจุดน้ำค้าง คืออุณหภูมิที่อากาศอุ้มน้ำไม่ได้อีกแล้ว อากาศชื้นจากแปซิฟิกที่พัดผ่านกระแสน้ำเย็นแคลิฟอร์เนีย จึงกลายเป็นหมอกที่ระดับน้ำทะเล"))}</p>
<div class="fogbars" id="fog-out" aria-live="polite"></div>
<div class="duo">
<figure><img src="{r}img/rays.jpg" alt="{e(t("Sunbeams through fog pouring over the Marin hills toward the bridge", "ลำแสงแดดส่องผ่านหมอกที่ไหลข้ามเนินเขามารินไปยังสะพาน"))}" width="1489" height="1600" loading="lazy">
<figcaption>{e(t("Fog pouring over the Marin hills. ", "หมอกไหลข้ามเนินเขามาริน "))}<a href="{C}San_francisco_in_fog_with_rays.jpg">Brocken Inaglory · CC BY-SA 3.0</a></figcaption></figure>
<figure><img src="{r}img/raindrops.jpg" alt="{e(t("Raindrops on glass, each showing a small upside-down Golden Gate Bridge", "หยดฝนบนกระจก แต่ละหยดมีสะพานโกลเดนเกตกลับหัวอยู่ข้างใน"))}" width="1600" height="1187" loading="lazy">
<figcaption>{e(t("Every raindrop is a lens and shows the bridge upside down. ", "หยดฝนทุกหยดเป็นเลนส์ และแสดงภาพสะพานกลับหัว "))}<a href="{C}Refraction_of_Golden_Gate_Bridge_in_rain_droplets_1.jpg">Brocken Inaglory · CC BY-SA 3.0</a></figcaption></figure>
</div>
<h3>{e(t("Foghorns", "แตรหมอก"))}</h3>
<p>{e(t("Five horns, switched on by hand when fog comes in under the road: about two and a half hours a day over a year, less than half an hour a day in March, five hours and more in summer. The two at the south tower blast together for 2 seconds every 20. The three at mid-span give two 1-second notes, 2 seconds apart, then wait 36 seconds. Ships coming in keep left of the tower horn and right of the mid-span horns.",
        "แตรห้าตัว เปิดด้วยมือเมื่อหมอกลอยเข้ามาใต้ถนน ตลอดปีเฉลี่ยวันละสองชั่วโมงครึ่ง เดือนมีนาคมไม่ถึงครึ่งชั่วโมงต่อวัน หน้าร้อนห้าชั่วโมงขึ้นไป สองตัวที่เสาใต้ดังพร้อมกัน 2 วินาที ทุก 20 วินาที สามตัวกลางสะพานดังสองจังหวะ จังหวะละ 1 วินาที เว้น 2 วินาที แล้วเงียบ 36 วินาที เรือขาเข้าวิ่งทางซ้ายของแตรที่เสา และทางขวาของแตรกลางสะพาน"))}</p>
<p><button type="button" id="horn-play" class="btn" aria-pressed="false">{e(t("Play the foghorns", "เปิดแตรหมอก"))}</button> <span class="mute small">{e(t("The timing is the District's; the pitches here stand in for the real ones.", "จังหวะตามที่เขตสะพานกำหนด ระดับเสียงที่นี่เป็นเสียงแทน"))}</span></p>
</section>

{b("fog-deck", r)}

<section id="sing" class="toy dark">
<h2>{e(t("The railing sings", "ราวสะพานร้องเพลง"))}</h2>
<p class="lede">{e(t("In 2020 new slats on the west railing let the bridge stand 100 mph winds. When the wind passes 22 mph, the slats hum. A recording held four notes: 354, 398, 439 and 481 hertz, which are F, G, A and B.",
                     "ปี 2020 ราวสะพานฝั่งตะวันตกเปลี่ยนเป็นซี่แบบใหม่ ช่วยให้สะพานทนลมได้ 161 กม./ชม. เมื่อลมแรงเกิน 35 กม./ชม. ซี่ราวจะส่งเสียงหึ่ง เสียงที่อัดไว้มีสี่โน้ต คือ 354, 398, 439 และ 481 เฮิรตซ์ ตรงกับโน้ต ฟา ซอล ลา ที"))}</p>
<div class="stage"><canvas id="cv-sing" class="c300"></canvas></div>
<div class="ctl">{rng("sing-wind", t("Wind", "ลม"), 0, 60, 24)}
<div class="btns"><button type="button" id="sing-play" class="btn" aria-pressed="false">♪ {e(t("Hear it", "ฟังเสียง"))}</button></div></div>
<p class="out" id="sing-out" aria-live="polite"></p>
<div class="eq"><span class="k">{e(t("an Aeolian tone", "เสียงลมผ่านขอบ"))}</span><code>f = 0.2 × U ÷ d</code>
<p>{e(t("Reading it: wind at speed U flowing past an edge d wide sheds a swirl off one side, then the other, f times a second. The 0.2 is the Strouhal number, close to the same for most blunt edges. Swirls at the right rate shake a slat at its own note, and it rings.",
         "อ่านว่า: ลมความเร็ว U ไหลผ่านขอบกว้าง d จะปล่อยน้ำวนออกทางด้านหนึ่ง สลับกับอีกด้าน f ครั้งต่อวินาที เลข 0.2 คือเลขสทรูฮาล ซึ่งใกล้เคียงกันสำหรับขอบทื่อเกือบทุกแบบ เมื่อน้ำวนมาในจังหวะที่ใช่ ซี่ราวจะสั่นตามโน้ตของมันเอง แล้วดังกังวาน"))}</p></div>
</section>

<section id="paint" class="toy">
<h2>{e(t("Is someone always painting it?", "มีคนทาสีสะพานอยู่ตลอดเวลาไหม"))}</h2>
<p class="lede">{e(t("Yes. The District paints the bridge continuously, and says so: not end to end each year, not once every seven years, but wherever inspections find rust coming through. Salt in the fog eats steel. The crew is 28 painters, 5 painter laborers and a chief bridge painter, with 13 ironworkers and 3 pusher ironworkers who replace rusted steel and rivets.",
                     "ใช่ เขตสะพานทาสีสะพานต่อเนื่องไม่หยุด และบอกไว้ชัดว่าไม่ได้ทาจากหัวจรดท้ายทุกปี และไม่ใช่ทุกเจ็ดปี แต่ทาตรงไหนก็ตามที่ตรวจพบสนิมโผล่ เกลือในหมอกกัดกินเหล็ก ทีมมีช่างทาสี 28 คน ผู้ช่วยช่างทาสี 5 คน หัวหน้าช่างทาสีสะพาน 1 คน กับช่างเหล็ก 13 คน และหัวหน้าช่างเหล็ก 3 คน ที่คอยเปลี่ยนเหล็กและหมุดย้ำที่เป็นสนิม"))}</p>
<div class="stage"><canvas id="cv-paint" class="c300 tap"></canvas></div>
<p class="mute small">{e(t("Tap the rust to patch it.", "แตะสนิมเพื่อซ่อม"))} <span id="paint-out" aria-live="polite"></span></p>
<h3>{e(t("The colour", "สี"))}</h3>
<p>{e(t("The steel arrived from Pennsylvania and New Jersey coated in red lead primer. Irving Morrow, riding the ferry to work, liked it on the rising towers. He tested black, grey and aluminum; warm grey came a distant second. The Navy asked for black and yellow stripes. Try them all; the bridge at the top of the page changes too.",
        "เหล็กมาจากเพนซิลเวเนียและนิวเจอร์ซีย์ เคลือบสีรองพื้นตะกั่วแดงมาแล้ว เออร์วิง มอร์โรว์ นั่งเรือข้ามฟากไปทำงาน เห็นสีนี้บนเสาที่กำลังสร้างแล้วชอบ เขาลองสีดำ สีเทา และสีอะลูมิเนียม สีเทาอุ่นได้ที่สองแบบห่างไกล กองทัพเรือขอให้ทาลายทางดำสลับเหลือง ลองทาทุกแบบได้ สะพานด้านบนสุดของหน้าจะเปลี่ยนตามด้วย"))}</p>
<div class="btns coats">
<button type="button" class="btn coat" data-coat="orange" aria-pressed="true"><i style="background:#f04a00"></i>{e(t("International Orange", "ส้มสากล"))}</button>
<button type="button" class="btn coat" data-coat="grey" aria-pressed="false"><i style="background:#8f877c"></i>{e(t("Warm grey", "เทาอุ่น"))}</button>
<button type="button" class="btn coat" data-coat="aluminum" aria-pressed="false"><i style="background:#c9cdd1"></i>{e(t("Aluminum", "อะลูมิเนียม"))}</button>
<button type="button" class="btn coat" data-coat="black" aria-pressed="false"><i style="background:#1d1d20"></i>{e(t("Black", "ดำ"))}</button>
<button type="button" class="btn coat" data-coat="navy" aria-pressed="false"><i style="background:repeating-linear-gradient(0deg,#1d1d20 0 5px,#f2c230 5px 10px)"></i>{e(t("Navy stripes", "ลายทางกองทัพเรือ"))}</button>
</div>
<div class="eq"><span class="k">{e(t("the formula", "สูตรสี"))}</span><code>C 0 · M 69 · Y 100 · K 6</code>
<p>{e(t("The District publishes its mix for anyone to use. On a screen: red = 255 × (1 − 0) × (1 − 0.06) = 240, green = 255 × (1 − 0.69) × (1 − 0.06) = 74, blue = 255 × (1 − 1) × (1 − 0.06) = 0. That is #F04A00, the orange on this page. The nearest paint off the shelf is Sherwin-Williams Fireweed, SW 6328.",
         "เขตสะพานเปิดเผยสูตรสีให้ทุกคนใช้ได้ บนจอภาพ: แดง = 255 × (1 − 0) × (1 − 0.06) = 240 เขียว = 255 × (1 − 0.69) × (1 − 0.06) = 74 น้ำเงิน = 255 × (1 − 1) × (1 − 0.06) = 0 ได้ #F04A00 คือสีส้มในหน้านี้ สีสำเร็จรูปที่ใกล้ที่สุดคือ Fireweed ของเชอร์วิน-วิลเลียมส์ รหัส SW 6328"))}</p></div>
</section>

{b("building", r)}

<section id="breathe" class="toy">
<h2>{e(t("It breathes", "สะพานหายใจ"))}</h2>
<p class="lede">{e(t("Steel grows about 12 millionths of its length for each degree. A longer cable hangs lower, so a warm afternoon lets the middle of the bridge down and a cold night pulls it up.",
                     "เหล็กยืดออกราวสิบสองในล้านส่วนของความยาว ทุกหนึ่งองศา สายเคเบิลที่ยาวขึ้นก็ห้อยต่ำลง บ่ายที่อากาศอุ่นจึงทำให้กลางสะพานลดต่ำ คืนที่หนาวดึงให้สูงขึ้น"))}</p>
<div class="stage"><canvas id="cv-warm" class="c300"></canvas></div>
<div class="ctl">{rng("warm-t", t("Air temperature", "อุณหภูมิอากาศ"), -5, 40, 16)}</div>
<p class="out" id="warm-out" aria-live="polite"></p>
<div class="eq"><span class="k">{e(t("the stretch", "การยืด"))}</span><code>Δd = (3 S ÷ 16 d) × ΔL</code>
<p>{e(t("Reading it: for a shallow parabola of span S and dip d, lengthening the cable by ΔL deepens the dip by 3S ÷ 16d times as much. Here 3 × 4,200 ÷ (16 × 470) = 1.68, so every foot of stretch drops the middle 1.68 feet.",
         "อ่านว่า: สำหรับพาราโบลาตื้นที่มีช่วงยาว S และหย่อน d ถ้าสายยาวขึ้น ΔL ส่วนหย่อนจะลึกขึ้น 3S ÷ 16d เท่าของที่ยืด ที่นี่ 3 × 4,200 ÷ (16 × 470) = 1.68 สายยืดหนึ่งฟุต กลางสะพานลดลง 1.68 ฟุต"))}</p></div>
<div class="moves">
<div><b>10.8 ft</b><span>{e(t("down at mid-span, the most it was built to move: heavy traffic in the middle, none on the side spans, a hot day", "ลงที่กลางช่วง มากที่สุดที่ออกแบบไว้: รถหนักตรงกลาง ช่วงข้างว่าง วันร้อน"))}</span></div>
<div><b>5.8 ft</b><span>{e(t("up: the opposite load on a cold day", "ขึ้น: น้ำหนักกลับข้าง ในวันหนาว"))}</span></div>
<div><b>27.7 ft</b><span>{e(t("sideways in a sustained wind", "ไปด้านข้าง เมื่อมีลมแรงต่อเนื่อง"))}</span></div>
<div><b>22 in</b><span>{e(t("the towers lean toward shore; 18 inches toward the channel", "เสาเอนเข้าหาฝั่ง และ 18 นิ้วเข้าหาร่องน้ำ"))}</span></div>
</div>
<p class="mute small">{e(t("The toy counts the cable's stretch only. Traffic, wind and the towers' own lean add to it.", "ของเล่นนี้คิดแค่การยืดของสายเคเบิล รถ ลม และการเอนของเสาเพิ่มเข้าไปอีก"))}</p>
</section>

{b("carriers-1936", r)}

<section id="globe" class="toy">
<h2>{e(t("From where you are", "จากที่ที่คุณอยู่"))}</h2>
<div class="gwrap"><div class="stage round"><canvas id="cv-globe" class="c420"></canvas></div>
<div><p class="out big" id="globe-out" aria-live="polite"></p>
<div class="btns"><button type="button" id="globe-here" class="btn ghost">{e(t("Use my location", "ใช้ตำแหน่งของฉัน"))}</button>
<button type="button" id="globe-wrap" class="btn" aria-pressed="false">{e(t("Wrap the wire around the Earth", "พันลวดรอบโลก"))}</button></div>
<p>{e(t("Each main cable is 61 bundles of about 452 wires, 27,572 wires in all, each 4.9 mm thick. Laid end to end, the wire in both cables runs 80,000 miles: 3.2 times around the equator. It was spun in place by shuttles running back and forth like a loom, in 6 months and 9 days.",
        "สายเคเบิลหลักแต่ละเส้นมี 61 มัด มัดละราว 452 เส้น รวม 27,572 เส้น แต่ละเส้นหนา 4.9 มม. ถ้าต่อลวดในสายเคเบิลทั้งสองเส้นเป็นเส้นเดียว จะยาว 129,000 กิโลเมตร พันรอบเส้นศูนย์สูตรได้ 3.2 รอบ ลวดถูกปั่นเข้าที่ด้วยกระสวยที่วิ่งไปมาเหมือนกี่ทอผ้า ใช้เวลา 6 เดือน 9 วัน"))}</p></div></div>
</section>

{b("hawk-hill", r)}

<section id="days">
<h2>{e(t("Days at the bridge", "วันต่าง ๆ ที่สะพาน"))}</h2>
<div class="stories">{stories}</div>
</section>

{b("night", r)}

<section id="years">
<h2>{e(t("Years", "ปีต่าง ๆ"))}</h2>
<ol class="years">{years}</ol>
</section>

{b("low-fog", r)}

<section id="sources">
<h2>{e(t("Made from", "สร้างจาก"))}</h2>
<p>{e(t("Open data and free-licence work from these, credited where it appears; the page's own code is on GitHub.", "ข้อมูลเปิดและงานที่ใช้สัญญาอนุญาตเสรีจากแหล่งเหล่านี้ ระบุที่มาไว้ตรงที่ใช้ โค้ดของหน้านี้อยู่บน GitHub"))}</p>
<ul class="made">{made}</ul>
<h3>{e(t("Sources", "แหล่งข้อมูล"))}</h3>
<ul class="src">{srcs}</ul>
</section>
</main>
<footer class="bot"><div class="in">{e(t("Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs keep their own licences.", "ข้อความ CC BY 4.0 NaNoBotCo โค้ด MIT ภาพถ่ายใช้สัญญาอนุญาตของแต่ละภาพ"))} · <a href="https://github.com/NaNoBotCo/golden-gate">GitHub</a></div></footer>
<script src="{r}gg.js" defer></script><script src="{r}top.js" defer></script>
</body></html>
"""


CSS = """
:root{
 --bg:#fff7ec;--panel:#ffffff;--ink:#1c1530;--mute:#675c77;--line:#f0dcc4;
 --accent:#f04a00;--orange:#f04a00;--gold:#ffb000;--pink:#ff5c8a;--sky:#2f7fd8;--jade:#119c78;--fog:#eef3f8;--shadow:rgba(60,20,0,.14);
 --display:"Avenir Next Condensed","HelveticaNeue-CondensedBold","Arial Narrow Bold","Franklin Gothic Heavy",Impact,system-ui,sans-serif;
 --body:"Avenir Next",Avenir,"Segoe UI",system-ui,-apple-system,Helvetica,Arial,sans-serif;
 --thai:"Noto Sans Thai","Leelawadee UI","Thonburi","Sukhumvit Set",Tahoma,sans-serif;
 --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --bg:#120d20;--panel:#1d1631;--ink:#fbf2e8;--mute:#bcb0cc;--line:#352a4d;--accent:#ff7a3d;--gold:#ffc53d;--pink:#ff7aa2;--sky:#7fb4ff;--jade:#3fd1a8;--fog:#241c3a;--shadow:rgba(0,0,0,.5)}}
:root[data-theme="dark"]{
 --bg:#120d20;--panel:#1d1631;--ink:#fbf2e8;--mute:#bcb0cc;--line:#352a4d;--accent:#ff7a3d;--gold:#ffc53d;--pink:#ff7aa2;--sky:#7fb4ff;--jade:#3fd1a8;--fog:#241c3a;--shadow:rgba(0,0,0,.5)}
*{box-sizing:border-box}
html{font-size:18px;scroll-behavior:smooth;scroll-padding-top:3.5rem}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.6;-webkit-text-size-adjust:100%;overflow-x:hidden}
:lang(th),.th{font-family:var(--thai);line-height:1.85}
a{color:var(--accent);text-underline-offset:.18em}
a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--gold);outline-offset:2px;border-radius:6px}
img{max-width:100%;height:auto;display:block}
.mute{color:var(--mute)}.small{font-size:.84rem}

header.top{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:3px solid var(--orange);
 transition:transform .26s cubic-bezier(.4,0,.2,1),box-shadow .26s}
body.nav-away header.top{transform:translateY(-102%)}
body.nav-tight header.top{box-shadow:0 10px 24px -14px var(--shadow)}
header.top nav,header.top .langsw{transition:opacity .18s,max-height .26s,margin .26s}
body.nav-tight header.top nav,body.nav-tight header.top .langsw{opacity:0;max-height:0;margin-block:0;overflow:hidden;pointer-events:none}
header.top .in{max-width:70rem;margin:0 auto;padding:.5rem 1rem;display:flex;gap:.4rem 1rem;align-items:center;flex-wrap:wrap}
.brand{font-family:var(--display);font-weight:800;font-size:1.2rem;text-transform:uppercase;text-decoration:none;color:var(--ink);white-space:nowrap;display:flex;align-items:center;gap:.45rem}
.brand svg{width:2.2rem;height:auto;color:var(--orange)}.brand .th{font-size:.85rem;font-weight:600;text-transform:none;color:var(--orange)}
header.top nav{display:flex;gap:.1rem .75rem;flex-wrap:wrap;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;font-weight:800}
:lang(th) header.top nav{text-transform:none;letter-spacing:0;font-size:.82rem}
header.top nav a{text-decoration:none;color:var(--mute)}
header.top nav a:hover{color:var(--ink);box-shadow:inset 0 -3px 0 var(--orange)}
.langsw{margin-left:auto;font-size:.76rem;font-weight:800;letter-spacing:.08em}
.langsw a{text-decoration:none;padding:.18rem .55rem;border:2px solid var(--line);border-radius:99px;color:var(--mute)}
.langsw a[aria-current]{background:var(--orange);color:#fff;border-color:var(--orange)}

.hero{position:relative;height:min(88vh,860px);min-height:520px;background:#0b0f2a;overflow:hidden}
.hero canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab}
.hero canvas:active{cursor:grabbing}
.hero-t{position:absolute;left:0;right:0;top:0;max-width:70rem;margin:0 auto;padding:2.2rem 1rem 0;pointer-events:none;color:#fff}
.hero .kicker{display:block;font-family:var(--display);font-size:.74rem;font-weight:800;letter-spacing:.34em;text-transform:uppercase;color:#ffd58a;margin-bottom:.5rem;text-shadow:0 1px 10px rgba(0,0,0,.5)}
.hero h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(2.5rem,7.4vw,5.2rem);line-height:.86;margin:0;max-width:10ch;
 background:linear-gradient(180deg,#fff 30%,#ffd9b8);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 18px rgba(20,0,40,.45))}
:lang(th) .hero h1{line-height:1.12;max-width:12ch}
.hero .lede{max-width:min(25rem,100%);color:#fff4ea;text-shadow:0 1px 12px rgba(0,0,0,.7);font-size:clamp(1rem,2.2vw,1.2rem)}
.hero .hint{font-size:.78rem;color:#ffe2c2;opacity:.85;text-shadow:0 1px 8px #000;margin:.2rem 0}
html.gg-day .hero .lede,html.gg-day .hero .hint{text-shadow:0 1px 14px rgba(0,20,60,.8)}
@media (max-width:760px){.hero{height:82vh;min-height:560px}.hero-t{padding-top:1.3rem}}

.deck{background:linear-gradient(90deg,#1c1530,#3a1740 50%,#1c1530);color:#fff7ec;border-bottom:4px solid var(--orange)}
.deck .ctl{max-width:70rem;margin:0 auto;padding:.9rem 1rem .2rem}
.deck .rng span{color:#ffd9b8}.deck output{color:#fff}
.now{max-width:70rem;margin:0 auto;padding:.1rem 1rem .9rem;font-size:.86rem;color:#ffe9d6;min-height:1.6em}
.ctl{display:flex;flex-wrap:wrap;gap:.6rem 1.4rem;align-items:flex-end;margin:.7rem 0}
.rng{display:flex;flex-direction:column;gap:.15rem;flex:1 1 11rem;min-width:10rem;font-size:.8rem;font-weight:800;letter-spacing:.04em}
.rng span{color:var(--mute)}.rng output{font-weight:700;color:var(--ink);margin-left:.3rem}
input[type=range]{width:100%;accent-color:var(--orange);height:1.6rem}
.num{display:flex;flex-direction:column;font-size:.8rem;font-weight:800;color:var(--mute)}
.num input{font:inherit;font-size:1rem;width:7rem;padding:.35rem .5rem;border:2px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink)}
.btns{display:flex;flex-wrap:wrap;gap:.45rem}
.btn{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;padding:.55rem 1.05rem;border-radius:99px;
 background:var(--orange);color:#fff;text-decoration:none;border:0;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.2);transition:transform .12s}
.btn:hover{transform:translateY(-1px)}.btn:active{transform:translateY(1px)}
.btn.ghost{background:transparent;color:var(--orange);box-shadow:inset 0 0 0 2px var(--orange)}
.deck .btn.ghost{color:#ffd9b8;box-shadow:inset 0 0 0 2px #ffb37f}
.btn[aria-pressed=true]{background:var(--gold);color:#1c1530;box-shadow:inset 0 0 0 2px var(--gold)}
:lang(th) .btn{font-family:var(--thai);text-transform:none;letter-spacing:0;font-size:.92rem}
.coat i{display:inline-block;width:1.1rem;height:1.1rem;border-radius:50%;box-shadow:0 0 0 2px #fff}
.btn.coat{background:var(--panel);color:var(--ink);box-shadow:inset 0 0 0 2px var(--line)}
.btn.coat[aria-pressed=true]{box-shadow:inset 0 0 0 3px var(--orange);background:var(--panel)}

main{max-width:70rem;margin:0 auto;padding:1rem 1rem 4rem}
h2{font-family:var(--display);font-size:clamp(1.9rem,5vw,3rem);line-height:.95;margin:3.4rem 0 .8rem;font-weight:800;text-transform:uppercase;padding-bottom:1.1rem;
 background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 24'%3E%3Cpath d='M2 22V2M198 22V2M2 3Q100 38 198 3' fill='none' stroke='%23f04a00' stroke-width='3.4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom/min(14rem,60%) 1rem no-repeat}
h3{font-family:var(--display);font-size:1.2rem;margin:1.6rem 0 .3rem;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
:lang(th) h1,:lang(th) h2,:lang(th) h3,:lang(th) .kicker,:lang(th) .band h2{font-family:var(--thai);letter-spacing:0;line-height:1.25;text-transform:none}
p{margin:.6rem 0;max-width:44rem}
.lede{font-size:clamp(1.05rem,2.3vw,1.22rem);max-width:44rem}
.kicker{display:block;font-family:var(--display);font-size:.72rem;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--orange);margin-bottom:.4rem}

.slab{display:grid;grid-template-columns:repeat(6,1fr);margin:1.8rem 0;gap:.6rem}
.slab div{padding:.9rem .8rem;border-radius:18px;background:var(--panel);box-shadow:0 8px 24px -14px var(--shadow);position:relative;overflow:hidden}
.slab div::after{content:"";position:absolute;right:-18px;top:-18px;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle,var(--gold),transparent 70%);opacity:.35}
.slab b{display:block;font-family:var(--display);font-size:clamp(1.8rem,4.4vw,2.7rem);line-height:.92;font-weight:800;color:var(--orange)}
.slab span{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--mute);font-weight:800;margin-top:.35rem}
.slab i{display:block;font-style:normal;font-size:.72rem;color:var(--mute);margin-top:.15rem}
:lang(th) .slab span{letter-spacing:0;font-size:.8rem;text-transform:none}
@media (max-width:860px){.slab{grid-template-columns:repeat(3,1fr)}}
@media (max-width:520px){.slab{grid-template-columns:repeat(2,1fr)}}

.toy .stage{border-radius:22px;overflow:hidden;box-shadow:0 18px 40px -22px var(--shadow),0 0 0 3px var(--ink);margin:1rem 0 .4rem;background:var(--panel)}
.toy .stage.round{border-radius:50%;aspect-ratio:1;max-width:28rem;box-shadow:0 18px 40px -18px rgba(0,60,140,.45);background:transparent}
.stage canvas{display:block;width:100%}
.c300{height:300px}.c320{height:320px}.c360{height:360px}.c420{height:100%}
.tap{cursor:crosshair;touch-action:manipulation}
@media (max-width:600px){.c360{height:300px}.c300,.c320{height:260px}}
.out{font-size:1.02rem;min-height:1.6em;max-width:48rem}.out.big{font-size:1.12rem}
.out b{color:var(--orange)}
.eqs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:1.2rem 0}
@media (max-width:860px){.eqs{grid-template-columns:1fr}}
.eq{background:var(--panel);border-radius:18px;padding:.9rem 1.1rem;box-shadow:0 8px 24px -16px var(--shadow);margin:1rem 0}
.eqs .eq{margin:0}
.eq .k{display:inline-block;font-size:.66rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;background:var(--orange);color:#fff;border-radius:99px;padding:.1rem .6rem}
.eq .k.blue{background:var(--sky)}.eq .k.jade{background:var(--jade)}
:lang(th) .eq .k{letter-spacing:0;font-size:.8rem}
.eq code{display:block;font-family:var(--mono);font-size:clamp(1.05rem,2.6vw,1.3rem);font-weight:700;margin:.5rem 0 .2rem;color:var(--ink)}
.eq p{font-size:.92rem;margin:.3rem 0 0}
.keys{list-style:none;padding:0;margin:.8rem 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.3rem 1.2rem;font-size:.92rem}
.keys b{font-family:var(--mono);color:var(--orange)}
@media (max-width:640px){.keys{grid-template-columns:1fr}}
.toy.dark{background:linear-gradient(160deg,#141a44,#2b1650);color:#f4ecff;border-radius:28px;padding:.4rem 1.3rem 1.2rem;margin:3rem -.3rem}
.toy.dark h2{margin-top:1.6rem}.toy.dark .rng span{color:#cdbfff}.toy.dark .rng output{color:#fff}
.toy.dark .eq{background:rgba(255,255,255,.07)}.toy.dark .eq code{color:#fff}.toy.dark .stage{box-shadow:0 0 0 3px #ffb37f}
.toy.dark .out b{color:#ffc27a}

.fogbars{display:grid;gap:.5rem;margin:1rem 0;max-width:44rem}
.fb{display:grid;grid-template-columns:8.5rem 1fr 4.5rem;align-items:center;gap:.6rem;font-size:.9rem}
.fb .bar{height:.9rem;border-radius:99px;background:var(--fog);position:relative;overflow:hidden}
.fb .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px}
.fb b{text-align:right}
.fogv{font-size:1.05rem;margin:.3rem 0 0}.fogv b{color:var(--orange)}
.duo{display:grid;grid-template-columns:1fr 1.2fr;gap:1rem;margin:1.2rem 0}
.duo figure{margin:0}.duo img{border-radius:18px;width:100%;height:100%;max-height:26rem;object-fit:cover}
.duo figcaption{font-size:.8rem;color:var(--mute);margin-top:.35rem}
@media (max-width:640px){.duo{grid-template-columns:1fr}}

.moves{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem;margin:1rem 0}
.moves div{background:var(--panel);border-radius:16px;padding:.8rem;box-shadow:0 8px 20px -14px var(--shadow);border-top:5px solid var(--orange)}
.moves b{font-family:var(--display);font-size:1.8rem;display:block;line-height:1;color:var(--orange)}
.moves span{font-size:.84rem;color:var(--mute)}
@media (max-width:760px){.moves{grid-template-columns:repeat(2,minmax(0,1fr))}}

.gwrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1.6rem;align-items:center}
@media (max-width:760px){.gwrap{grid-template-columns:1fr}}

.stories{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
.story{background:var(--panel);border-radius:20px;padding:1rem 1.1rem;box-shadow:0 10px 26px -16px var(--shadow);position:relative;overflow:hidden}
.story:nth-child(3n+1){border-top:6px solid var(--orange)}.story:nth-child(3n+2){border-top:6px solid var(--sky)}.story:nth-child(3n){border-top:6px solid var(--gold)}
.story .when{font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.story h3{margin:.2rem 0 .3rem;font-size:1.15rem}.story p{margin:0;font-size:.95rem}
@media (max-width:900px){.stories{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.stories{grid-template-columns:1fr}}

.band .in{max-width:70rem}
.band .kicker{color:#ffd58a}
.band{--accent:#f04a00;--display:"Avenir Next Condensed","Arial Narrow Bold",Impact,system-ui,sans-serif}

.years{list-style:none;padding:0;margin:1rem 0;border-left:4px solid var(--orange)}
.years li{padding:.1rem 0 .9rem 1.1rem;position:relative}
.years li::before{content:"";position:absolute;left:-.62rem;top:.5rem;width:.95rem;height:.95rem;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px var(--bg),0 0 14px var(--gold)}
.years b{font-family:var(--display);font-size:1.4rem;display:block;line-height:1.1;color:var(--orange)}
.made{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}
.made li{background:var(--panel);border-radius:14px;padding:.7rem .9rem;font-size:.9rem;box-shadow:0 6px 18px -14px var(--shadow)}
.made .lic{font-size:.7rem;font-weight:800;color:var(--jade);letter-spacing:.06em}
@media (max-width:760px){.made{grid-template-columns:1fr}}
.src{columns:2 18rem;padding-left:1.1rem}
.src li{margin-bottom:.3rem;break-inside:avoid}
footer.bot{border-top:3px solid var(--orange);background:var(--panel)}
footer.bot .in{max-width:70rem;margin:0 auto;padding:1.4rem 1rem 3rem;font-size:.82rem;color:var(--mute)}
footer.bot a{color:var(--mute)}
@media print{.hero canvas,header.top,.deck{display:none}.hero{height:auto;min-height:0;background:none}.hero-t{position:static;color:var(--ink)}}
"""


def main():
    global L
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        L = lang
        out = os.path.join(DOCS, path)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(page())
        print("wrote", out)


if __name__ == "__main__":
    main()
