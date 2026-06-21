# Orbis — Features & How It Works

A deep dive into what Orbis does, how each mode behaves, and where its data comes from. For a quick overview see the [README](../README.md).

Orbis is a single-page React app. The globe (`globe.gl` on top of Three.js) is always rendered; everything else is an overlay. State lives in [`src/App.tsx`](../src/App.tsx); the globe scene and all per-mode layers live in [`src/components/Globe.tsx`](../src/components/Globe.tsx); panels live in [`src/components/InfoPanel.tsx`](../src/components/InfoPanel.tsx); datasets and fetchers live in [`src/data.ts`](../src/data.ts).

---

## The landing experience

When the app opens, the camera **emerges from deep space** and approaches Earth in a multi-stage easing move while clouds, atmosphere, and night-lights resolve. The overlay is intentionally minimal and globe-first:

- A frameless hero — **"One planet. Infinite perspectives."** — with a staggered, blur-to-sharp reveal that only plays **once the globe is ready** (no text popping or layout shift on refresh).
- A rotating one-line tagline that cycles through what you can do ("Dig a tunnel through the planet", "Compare the true size of countries", …).
- An **orbital system** in the empty space around the globe: three concentric spinning rings (with small satellites) plus two crossing tilted elliptical orbits with glowing moons.
- A **magnetic "Enter Orbis"** button (it gently pulls toward the cursor), though you can also just **click/drag the globe** or press **Enter** to begin.

---

## Universal place info (any mode)

Click anywhere on the globe, in any mode, and the panel header shows that location's:

- **Exact place** — the clicked coordinates are reverse-geocoded (BigDataCloud) to a real "City, Region, Country"; falls back to raw coordinates over open ocean (never to a far "nearest city"),
- **Local time** (from the nearest city's timezone, or estimated from longitude),
- **Day or night** (computed from the live solar position), and
- **Live weather** — temperature, conditions, wind, humidity — fetched from **Open-Meteo**.

A 📍 control flies to your current location (geolocation), and **double-clicking** the globe does the same.

---

## Modes

Modes are grouped into **Explore**, **Data**, and **Sky** in the bottom dock.

### Explore

- **Dig** — Draws an arc from your click to its exact antipode and names the city you'd surface near (~12,742 km straight down).
- **Blast** — Pick an impactor (meteor → dinosaur-killer); the globe shows concentric **fireball / destruction / thermal / blast / window** damage rings, TNT-equivalent energy, crater size, Hiroshima multiples, and estimated population within range.
- **Scale** — Click a country to reveal its **true area** versus how inflated it looks on a Mercator map at that latitude, with comparisons to familiar regions.
- **Shrink Ray** — Pick up a country, then drop its outline anywhere else on Earth to viscerally compare real sizes (areas via Turf.js).
- **Flight Radius** — Set a flight time; the globe draws the great-circle reach circle and highlights every reachable major city.
- **Flight Route** — Choose two cities for an animated great-circle arc with distance, flight time, typical aircraft, and percentage of Earth's circumference.

### Data

- **Compare** — Two countries side by side with animated bars for population, area, GDP, and internet penetration, plus capital and language. Both are highlighted on the globe.
- **Timeline** — Pick a country and an indicator (population / GDP / internet users); Orbis fetches the full series from the **World Bank API** and animates an SVG line chart with the latest value and growth since 1990.
- **Population** — A choropleth shading every country by **population density**, with a legend and the densest countries listed.
- **Climate Twin** — Click near a city to find cities with the most similar climate (Köppen zone + average temperature + annual rainfall), drawn as connected arcs.
- **Visa-Free** — Colors every country by your passport's access (visa-free / e-visa / required). The headline visa-free score follows the **Henley Passport Index**; the per-country map uses a Passport-Index matrix. Your passport is auto-detected by IP and fully overridable.

### Sky

- **Day / Night** — Swaps the globe to a custom **GLSL day/night shader** with a live terminator and city lights on the dark side, plus a marker for the sub-solar point and whether your clicked spot is in daylight.
- **Wonders** — A curated set of natural wonders; selecting one flies the camera there and shows a storytelling card (with a designed gradient hero and a headline stat).
- **Space** — Pulls the camera back past the atmosphere to reveal the Moon's orbit and the **live position of the ISS** (refreshed every few seconds), with its latitude, longitude, altitude, and speed.

---

## Live data sources (free, keyless, CORS-enabled)

| Source | Used by | Endpoint |
|--------|---------|----------|
| Open-Meteo | place-info weather | `api.open-meteo.com/v1/forecast` |
| BigDataCloud | reverse geocoding (place names) | `api.bigdatacloud.net/data/reverse-geocode-client` |
| World Bank | Timeline | `api.worldbank.org/v2/country/{iso2}/indicator/{id}` |
| wheretheiss.at | Space | `api.wheretheiss.at/v1/satellites/25544` |
| Natural Earth | country polygons | GeoJSON from the globe.gl example dataset |
| Passport Index | Visa map matrix | bundled / generated at build time |
| IP geolocation (multi-provider) | passport auto-detect | `api.country.is`, `ipwho.is`, `ipapi.co` |

All numeric "facts" datasets (country stats, cities, climate, wonders, Henley scores) are curated in [`src/data.ts`](../src/data.ts) and clearly approximate where noted in the UI.

---

## Notable implementation details

- **Performance**: country GeoJSON is fetched once and cached at module scope; MapLibre is lazy-loaded only on deep zoom.
- **Camera handoff**: zooming in past a threshold opens a 2D satellite map ([`MapView.tsx`](../src/components/MapView.tsx)); zooming back out re-arms the globe.
- **Day/Night shader**: see [`src/lib/dayNightMaterial.ts`](../src/lib/dayNightMaterial.ts) and the generated night-lights texture in [`src/lib/nightLightsTexture.ts`](../src/lib/nightLightsTexture.ts).
- **Accessibility/motion**: `prefers-reduced-motion` is respected app-wide via `MotionConfig reducedMotion="user"`, plus explicit guards on the globe's JS-driven motion (cosmic dust, mouse-reactive light, cloud spin, the cinematic fly-in, and auto-rotate).
- **Performance**: heavy vendor code (`three`/`globe.gl`, `framer-motion`, `turf`) is split into long-cached chunks, and the app `preconnect`s/`dns-prefetch`es its texture & data hosts.
- **Location accuracy**: clicks and browser geolocation (`enableHighAccuracy`) are reverse-geocoded from the precise coordinates rather than snapped to a city list.

---

## Running it

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # type-check + production build to dist/
npm run preview   # serve the build at http://localhost:4173
```

To launch and **screenshot** the app from an automated/headless environment, use the project `run` skill at [`.claude/skills/run/SKILL.md`](../.claude/skills/run/SKILL.md).
