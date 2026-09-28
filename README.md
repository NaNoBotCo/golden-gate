# The Golden Gate Bridge · สะพานโกลเดนเกต

https://nanobotco.github.io/golden-gate/ · ไทย https://nanobotco.github.io/golden-gate/th/

- `python3 tools/build.py` writes `docs/index.html` and `docs/th/index.html`; all copy lives in it, English and Thai side by side.
- `docs/gg.js` draws everything that moves: the bridge in 3D from its own numbers, sky, fog, water, and the seven toys.
- `python3 tools/data.py` refreshes `docs/tide.json` (eight tide wheels fitted to NOAA 9414290) and `docs/land.json` (Natural Earth). The page refits the wheels live when NOAA answers.
- `tools/card.html` renders `docs/card.jpg` (see the comment inside).
- `python3 tools/serve.py` serves `docs/` on port 8887. Test hooks: `?t=` `?fog=` `?cloud=` `?yaw=`.

Text CC BY 4.0. Code MIT. Photos from Wikimedia Commons keep their own licences, credited on each band.
