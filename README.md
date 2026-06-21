# 🌍 Orbis

**One planet. Infinite perspectives.**

Orbis is a cinematic, interactive 3D globe you explore through **14 lenses** — dig a tunnel to the other side of Earth, simulate asteroid impacts, watch the day/night terminator sweep across continents in real time, see where your passport can take you, trace flight paths, and track the ISS live. It runs entirely in the browser with **no backend and no API keys** — all live data comes from free, public, CORS-enabled endpoints.

> Click or drag the globe to begin. Click anywhere on Earth in any mode to see live weather, local time, and day/night for that spot.

---

## ✨ What it does

Orbis renders a high-resolution Earth (`globe.gl` / Three.js) and overlays mode-specific visualizations. A shared **place-info panel** shows live details for wherever you click, and a cinematic camera flies you to points of interest.

### The 14 modes

| Group | Mode | What it shows |
|-------|------|---------------|
| **Explore** | 🛠 Dig | Tunnel straight through the planet to the antipode |
| | ⚡ Blast | Asteroid/impact simulator with layered damage zones & population hit |
| | ▦ Scale | A country's *true* area vs. the Mercator map "lie" |
| | ⤢ Shrink Ray | Pick up a country and drop it on another to compare real sizes |
| | ✈ Flight Radius | Everywhere you can reach within *N* hours of flying |
| | ➤ Flight Route | Animated great-circle route, distance, duration & aircraft between two cities |
| **Data** | ⇄ Compare | Two countries side by side — population, area, GDP, internet use |
| | 📈 Timeline | Animated history (population / GDP / internet) from the **World Bank** |
| | 👥 Population | Choropleth of every country shaded by population density |
| | 🌡 Climate Twin | Cities that share your spot's climate (Köppen + temp + rainfall) |
| | 🛂 Visa-Free | Where your passport goes visa-free (Henley index + per-country matrix) |
| **Sky** | ☀ Day / Night | Real-time terminator via a custom GLSL shader, with city lights |
| | ⛰ Wonders | Fly to natural wonders with storytelling cards |
| | 🚀 Space | Pull back to orbit — the Moon and the **live ISS** position |

### Always-on touches
- **Live place info** on any click — nearest city, local time, day/night, and **live weather** (Open-Meteo).
- **Cinematic landing** — Earth emerges from deep space with concentric & tilted orbital rings; the globe itself is the call-to-action.
- **Current location** 📍 and **double-click-to-fly** to where you are (geolocation).
- **Deep-zoom handoff** to a 2D satellite map (MapLibre) when you zoom right in.
- **Auto passport detection** (IP-based) and **light / dark** themes.
- Mouse-reactive lighting, drifting stardust, slow auto-rotation — the globe always feels alive.

See [`docs/FEATURES.md`](docs/FEATURES.md) for the full breakdown and data sources.

---

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

### Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Generate the visa matrix, type-check, and build to `dist/` |
| `npm run preview` | Serve the production build locally (`http://localhost:4173`) |
| `npm run lint` | Run ESLint |
| `npm run generate:visa` | Regenerate `src/generated/visa-matrix.json` from Passport-Index data |

---

## 🛰 Live data (all free, keyless, CORS-enabled)

| Source | Used for |
|--------|----------|
| [Open-Meteo](https://open-meteo.com) | Live weather on click |
| [World Bank API](https://data.worldbank.org) | Country timeline (population / GDP / internet) |
| [wheretheiss.at](https://wheretheiss.at) | Live ISS position |
| Natural Earth GeoJSON | Country polygons |
| [Passport Index](https://github.com/ilyankou/passport-index-dataset) | Visa requirements matrix |
| Henley Passport Index (curated) | Visa-free headline scores |

No accounts, no tokens, no server — deployable as static files.

---

## 🏗 Architecture (high level)

```
src/
├── App.tsx              # app shell, global state, landing/map orchestration
├── components/
│   ├── Globe.tsx        # globe.gl + Three.js scene, per-mode layers, camera
│   ├── Landing.tsx      # cinematic intro overlay (orbits, staggered reveal)
│   ├── ModeSwitcher.tsx # grouped Explore / Data / Sky dock
│   ├── InfoPanel.tsx    # place-info header + per-mode panels
│   ├── MapView.tsx      # lazy-loaded 2D MapLibre satellite handoff
│   └── …                # StarField, ZoomControls, Header, Toast, Logo
├── data.ts              # datasets, geo math, and all live-data fetchers
├── lib/                 # day/night shader material, night-lights texture
└── generated/           # build-time visa matrix
```

---

## ☁️ Deploy (free)

It's a static SPA — build and host anywhere:

- **Vercel**: `vercel --prod`
- **Netlify**: drag the `dist/` folder onto netlify.com
- **GitHub Pages**: publish `dist/` to a `gh-pages` branch

---

## 🧰 Tech stack

React 19 · Vite · TypeScript · [globe.gl](https://globe.gl) (Three.js) · Framer Motion · MapLibre GL · Turf.js · lucide-react

---

*Built with zero backend and zero cost.*
