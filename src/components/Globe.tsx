import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import GlobeGL, { type GlobeInstance } from 'globe.gl';
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson';
import type { Mode, LatLng, BlastType, ShrinkState, City, Wonder, ISSPosition, FlightMode } from '../types';
import { useTheme } from '../theme';
import {
  getAntipode,
  getClimateTwins,
  getNearestCity,
  getCitiesInRadius,
  destinationPoint,
  generateCirclePolygon,
  getBlastZones,
  subsolarPoint,
  isDaylight,
  getCountryFact,
  NATURAL_WONDERS,
  CITIES,
  buildVisaMap,
  VISA_COLORS,
  COUNTRY_FACTS,
  countryDensity,
  densityColor,
} from '../data';
import { createNightLightsTexture, NIGHT_LIGHTS_BASE_URL } from '../lib/nightLightsTexture';
import { createDayNightMaterial, updateDayNightUniforms } from '../lib/dayNightMaterial';

const ACCENT = '#4FACFE';
const CYAN = '#00F2FE';
const CRUISE_KMH = 900;
const GEO_URL =
  'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

// High-resolution (4K) earth maps — classic, CORS-enabled via raw.githubusercontent
const TEX = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images';
const COLOR_URL = `${TEX}/2_no_clouds_4k.jpg`;
const BUMP_URL = `${TEX}/elev_bump_4k.jpg`;
const WATER_URL = `${TEX}/water_4k.png`;
const CLOUDS_URL = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/clouds/clouds.png';
const CLOUDS_ALT = 0.006;
const CLOUDS_ROTATION = 0.004; // deg / frame

const ATMO = {
  dark: { color: '#4facfe', alt: 0.22 },
  light: { color: '#bcd8ff', alt: 0.26 },
} as const;

// ── Globe zoom boundary (single source of truth) ───────────────
// HANDOFF_ALT is the globe's deepest zoom: at this altitude the 2D satellite
// map takes over — the same way for scroll, pinch, AND the zoom-in button.
// Above REARM_ALT the globe re-arms. minDistance sits just inside the handoff
// so the boundary is always crossable and the globe never silently overshoots it.
const GLOBE_UNITS = 100; // three-globe globe radius, in scene units
const HANDOFF_ALT = 0.2;
const REARM_ALT = 0.7;
const GLOBE_MIN_DISTANCE = GLOBE_UNITS * (1 + HANDOFF_ALT) - 4; // = 116

// Run non-critical work when the main thread is idle (keeps the first paint
// and the cinematic fly-in smooth on weaker devices). Falls back to a timer.
function idleCall(cb: () => void): void {
  const w = globalThis as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2500 });
  else globalThis.setTimeout(cb, 1200);
}

export interface GlobeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  flyTo: (lat: number, lng: number) => void;
}

// ── module-level GeoJSON cache (fetch once, reuse) ─────────────
let countriesCache: FeatureCollection | null = null;
let countriesPromise: Promise<FeatureCollection> | null = null;
function loadCountries(): Promise<FeatureCollection> {
  if (countriesCache) return Promise.resolve(countriesCache);
  if (!countriesPromise) {
    countriesPromise = fetch(GEO_URL)
      .then(r => r.json() as Promise<FeatureCollection>)
      .then(fc => {
        countriesCache = fc;
        return fc;
      });
  }
  return countriesPromise;
}

// ── feature helpers ───────────────────────────────────────────
type Props = Record<string, unknown>;
const iso2 = (f: Feature): string =>
  String(
    (f.properties as Props)?.['ISO_A2'] ??
      (f.properties as Props)?.['ISO_A2_EH'] ??
      (f.properties as Props)?.['ISO3166-1-Alpha-2'] ??
      '',
  ).toUpperCase();
const cName = (f: Feature): string =>
  String(
    (f.properties as Props)?.['ADMIN'] ??
      (f.properties as Props)?.['NAME'] ??
      (f.properties as Props)?.['name'] ??
      'Unknown',
  );

function shiftGeometry(geom: Geometry, dLng: number, dLat: number): Geometry {
  if (geom.type === 'Polygon') {
    const g = geom as Polygon;
    return {
      type: 'Polygon',
      coordinates: g.coordinates.map(ring => ring.map(([x, y]) => [x + dLng, y + dLat])),
    };
  }
  if (geom.type === 'MultiPolygon') {
    const g = geom as MultiPolygon;
    return {
      type: 'MultiPolygon',
      coordinates: g.coordinates.map(poly => poly.map(ring => ring.map(([x, y]) => [x + dLng, y + dLat]))),
    };
  }
  return geom;
}

// ── globe.gl datum shapes ─────────────────────────────────────
interface PointDatum { lat: number; lng: number; color: string; size: number; label?: string; }
interface ArcDatum { startLat: number; startLng: number; endLat: number; endLng: number; color: string | string[]; }
interface RingDatum { lat: number; lng: number; maxR: number; speed: number; period: number; color: string; }
interface LabelDatum { lat: number; lng: number; text: string; color: string; size: number; }
interface PolyDatum { feat: Feature; cap: string; side: string; stroke: string; alt: number; label?: string; }
interface HtmlDatum { lat: number; lng: number; color: string; kind: 'reticle' | 'impact'; label?: string; }

const tipInner = (title: string, sub?: string) => {
  const subHtml = sub ? `<small>${sub}</small>` : '';
  return `<div class="el-tooltip"><b>${title}</b>${subHtml}</div>`;
};
const tip = (title: string, sub?: string) => tipInner(title, sub);

/** "#rrggbb" + alpha → "rgba(r,g,b,a)". */
function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.slice(0, 2), 16);
  const gC = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${gC}, ${b}, ${alpha})`;
}

const prefersReduced = (): boolean =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function makeMarker(d: HtmlDatum): HTMLElement {
  const el = document.createElement('div');
  el.className = `gx-marker gx-${d.kind}`;
  el.style.setProperty('--c', d.color);
  const chip = d.label ? `<span class="gx-chip">${d.label}</span>` : '';
  el.innerHTML = `<span class="gx-core"></span><span class="gx-ring"></span>${chip}`;
  return el;
}

interface GlobeProps {
  mode: Mode;
  onPointClick: (lat: number, lng: number) => void;
  selectedPoint: LatLng | null;
  blastType: BlastType;
  isLanding: boolean;
  passportCode: string;
  flightHours: number;
  shrink: ShrinkState;
  shrinkStage: 'source' | 'target';
  onShrinkUpdate: (s: ShrinkState) => void;
  onEnterMap: (lat: number, lng: number) => void;
  mapOpen: boolean;
  flightMode: FlightMode;
  compareCodes: [string, string];
  timelineCode: string;
  route: { from: City | null; to: City | null };
  wonder: Wonder | null;
  iss: ISSPosition | null;
  onInteract: () => void;
  onDoubleClick: () => void;
  onReady: () => void;
}

const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(props, ref) {
  const {
    mode,
    onPointClick,
    selectedPoint,
    blastType,
    isLanding,
    passportCode,
    flightHours,
    shrink,
    shrinkStage,
    onShrinkUpdate,
    onEnterMap,
    mapOpen,
    flightMode,
    compareCodes,
    timelineCode,
    route,
    wonder,
    iss,
    onInteract,
    onDoubleClick,
    onReady,
  } = props;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const shrinkSource = useRef<{ feature: Feature; centroid: [number, number] } | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const cloudsRaf = useRef<number | null>(null);
  const dayTexRef = useRef<THREE.Texture | null>(null);
  const nightTexRef = useRef<THREE.Texture | null>(null);
  const dayNightMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const savedGlobeMatRef = useRef<THREE.Material | null>(null);
  const spaceGroupRef = useRef<THREE.Group | null>(null);
  const digGroupRef = useRef<THREE.Group | null>(null);
  const digRaf = useRef<number | null>(null);
  const mapOpenRef = useRef(mapOpen);
  const armedRef = useRef(true);
  const prevMapOpen = useRef(mapOpen);
  const onEnterMapRef = useRef(onEnterMap);
  onEnterMapRef.current = onEnterMap;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const flightModeRef = useRef(flightMode);
  flightModeRef.current = flightMode;
  const isLandingRef = useRef(isLanding);
  isLandingRef.current = isLanding;
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const onDoubleClickRef = useRef(onDoubleClick);
  onDoubleClickRef.current = onDoubleClick;
  const dustRef = useRef<THREE.Points | null>(null);
  const lifeRaf = useRef<number | null>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });
  // [west, south, east, north] per country — cheap reject before point-in-polygon
  const bboxRef = useRef<[number, number, number, number][]>([]);
  // throttle rapid re-fires that thrash overlapping camera tweens (stutter)
  const lastClickAt = useRef(0);

  const [countries, setCountries] = useState<Feature[]>([]);
  const [shrinkPolys, setShrinkPolys] = useState<PolyDatum[]>([]);

  const applyDayNightGlobe = useCallback(() => {
    const g = globeRef.current;
    if (!g || !nightTexRef.current) return false;
    const dayTex =
      dayTexRef.current ?? (savedGlobeMatRef.current as THREE.MeshPhongMaterial | null)?.map ?? null;
    if (!dayTex) return false;
    if (!savedGlobeMatRef.current) savedGlobeMatRef.current = g.globeMaterial();
    if (!dayNightMatRef.current) {
      dayNightMatRef.current = createDayNightMaterial(dayTex, nightTexRef.current);
    } else {
      dayNightMatRef.current.uniforms.dayTexture!.value = dayTex;
      dayNightMatRef.current.uniforms.nightTexture!.value = nightTexRef.current;
    }
    g.globeMaterial(dayNightMatRef.current);
    return true;
  }, []);

  const dim = theme === 'dark' ? '#2c3a4f' : '#aebccd';

  // ── init once ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const reduceMotion = prefersReduced();
    // Detect weaker devices so we can lighten first load (deferred/skip textures,
    // a shorter fly-in). Defaults assume a capable device when the API is absent.
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
    let disposed = false;
    const whenIdle = (cb: () => void) => idleCall(() => { if (!disposed) cb(); });

    // Only the colour map loads on the critical path; relief/oceans/clouds are
    // deferred so the first paint + fly-in aren't fighting extra 4K decodes.
    const globe = new GlobeGL(containerRef.current)
      .globeImageUrl(COLOR_URL)
      .backgroundColor('rgba(0,0,0,0)')
      .width(globalThis.innerWidth)
      .height(globalThis.innerHeight)
      .showAtmosphere(true);

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.6;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.9;
    controls.minDistance = GLOBE_MIN_DISTANCE; // floor sits just inside the map handoff
    controls.maxDistance = 600;
    globeRef.current = globe;

    // relief (bump) + glossy oceans (specular map) — deferred to idle so they
    // don't compete with the first paint and the cinematic fly-in
    whenIdle(() => {
      globe.bumpImageUrl(BUMP_URL);
      new THREE.TextureLoader().load(
        WATER_URL,
        tex => {
          if (disposed) { tex.dispose(); return; }
          const mat = globe.globeMaterial() as THREE.MeshPhongMaterial;
          mat.specularMap = tex;
          mat.specular = new THREE.Color('#1b2a38');
          mat.shininess = 14;
          mat.needsUpdate = true;
        },
        undefined,
        () => undefined,
      );
    });

    // hand off to the 2D satellite map once the user zooms in deep
    globe.onZoom((pov: { lat: number; lng: number; altitude: number }) => {
      if (mapOpenRef.current) return;
      if (pov.altitude <= HANDOFF_ALT && armedRef.current) {
        armedRef.current = false;
        onEnterMapRef.current(pov.lat, pov.lng);
      } else if (pov.altitude > REARM_ALT) {
        armedRef.current = true;
      }
    });

    // cinematic intro — emerge from deep space and approach Earth
    // (reduced-motion: settle straight to the resting view, no long fly-in)
    let flyIn1: ReturnType<typeof setTimeout> | undefined;
    let flyIn2: ReturnType<typeof setTimeout> | undefined;
    if (reduceMotion) {
      globe.pointOfView({ lat: 22, lng: 14, altitude: 2.3 }, 0);
    } else if (lowEnd) {
      // weaker device: one short approach instead of the long multi-stage fly-in
      globe.pointOfView({ lat: 10, lng: -20, altitude: 4.2 }, 0);
      flyIn1 = setTimeout(() => globe.pointOfView({ lat: 22, lng: 14, altitude: 2.3 }, 1600), 200);
    } else {
      globe.pointOfView({ lat: 4, lng: -34, altitude: 5.4 }, 0);
      flyIn1 = setTimeout(() => globe.pointOfView({ lat: 15, lng: -8, altitude: 3.4 }, 2600), 250);
      flyIn2 = setTimeout(() => globe.pointOfView({ lat: 22, lng: 14, altitude: 2.3 }, 3200), 2500);
    }

    // soft volumetric cloud shell — deferred to idle, and skipped on low-end
    // devices (silently skipped if the texture is unavailable)
    if (!lowEnd) {
      whenIdle(() => {
        new THREE.TextureLoader().load(
          CLOUDS_URL,
          tex => {
            if (disposed) { tex.dispose(); return; }
            const radius = globe.getGlobeRadius() * (1 + CLOUDS_ALT);
            const clouds = new THREE.Mesh(
              new THREE.SphereGeometry(radius, 96, 96),
              new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false }),
            );
            globe.scene().add(clouds);
            cloudsRef.current = clouds;
            const spin = () => {
              clouds.rotation.y += (CLOUDS_ROTATION * Math.PI) / 180;
              cloudsRaf.current = requestAnimationFrame(spin);
            };
            if (!reduceMotion) spin();
          },
          undefined,
          () => undefined,
        );
      });
    }

    // space view: Moon + orbit ring (hidden until Space mode)
    {
      const gr = globe.getGlobeRadius();
      const moonDist = gr * 4.2;
      const group = new THREE.Group();
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(moonDist, 0.4, 8, 180),
        new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.3 }),
      );
      torus.rotation.x = Math.PI / 2;
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(gr * 0.27, 48, 48),
        new THREE.MeshPhongMaterial({ color: '#c2c7d0', shininess: 2 }),
      );
      moon.position.set(moonDist, 0, 0);
      group.add(torus, moon);
      group.rotation.z = 0.32;
      group.visible = false;
      globe.scene().add(group);
      spaceGroupRef.current = group;
    }

    // faint, distant stardust — atmospheric, never attention-grabbing
    {
      const gr = globe.getGlobeRadius();
      const N = 520;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = gr * (1.7 + Math.random() * 2.0);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
          color: 0x8fb0d8,
          size: 1.6,
          sizeAttenuation: false, // fixed tiny pixels — no near-camera bokeh
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      );
      dust.raycast = () => undefined; // never intercept clicks
      globe.scene().add(dust);
      dustRef.current = dust;
    }

    // mouse-reactive sun: the globe's shading follows the pointer
    let dirLight: THREE.DirectionalLight | undefined;
    let lightBase: THREE.Vector3 | null = null;
    try {
      const lights = (globe as unknown as { lights: () => THREE.Light[] }).lights?.() ?? [];
      dirLight = lights.find(l => l.type === 'DirectionalLight') as THREE.DirectionalLight | undefined;
      if (dirLight) lightBase = dirLight.position.clone();
    } catch {
      /* lights() unavailable — skip reactive lighting */
    }

    const tmpVec = new THREE.Vector3();
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisX = new THREE.Vector3(1, 0, 0);
    const life = () => {
      if (dustRef.current) {
        dustRef.current.rotation.y += 0.00045;
        dustRef.current.rotation.x += 0.00018;
      }
      if (dirLight && lightBase) {
        tmpVec.copy(lightBase);
        tmpVec.applyAxisAngle(axisY, pointerTarget.current.x * 0.22);
        tmpVec.applyAxisAngle(axisX, -pointerTarget.current.y * 0.16);
        dirLight.position.lerp(tmpVec, 0.025);
      }
      lifeRaf.current = requestAnimationFrame(life);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.current.x = (e.clientX / globalThis.innerWidth) * 2 - 1;
      pointerTarget.current.y = (e.clientY / globalThis.innerHeight) * 2 - 1;
    };
    // ambient drift + mouse-reactive light — skipped entirely for reduced motion
    if (!reduceMotion) {
      life();
      globalThis.addEventListener('pointermove', onPointerMove);
    }

    // globe-as-CTA: any interaction during landing dives into the experience
    const onInteractStart = () => {
      if (isLandingRef.current) onInteractRef.current();
    };
    controls.addEventListener('start', onInteractStart);
    containerRef.current.addEventListener('pointerdown', onInteractStart);

    // easter egg: double-click the Earth → fly to your location
    const onDbl = () => {
      if (!isLandingRef.current) onDoubleClickRef.current();
    };
    containerRef.current.addEventListener('dblclick', onDbl);

    const onResize = () => globe.width(globalThis.innerWidth).height(globalThis.innerHeight);
    globalThis.addEventListener('resize', onResize);

    loadCountries()
      .then(fc => {
        setCountries(fc.features);
        onReadyRef.current();
      })
      .catch(() => onReadyRef.current());

    return () => {
      disposed = true;
      if (flyIn1) clearTimeout(flyIn1);
      if (flyIn2) clearTimeout(flyIn2);
      globalThis.removeEventListener('resize', onResize);
      globalThis.removeEventListener('pointermove', onPointerMove);
      controls.removeEventListener('start', onInteractStart);
      containerRef.current?.removeEventListener('pointerdown', onInteractStart);
      containerRef.current?.removeEventListener('dblclick', onDbl);
      if (lifeRaf.current) cancelAnimationFrame(lifeRaf.current);
      if (dustRef.current) {
        globe.scene().remove(dustRef.current);
        dustRef.current.geometry.dispose();
        (dustRef.current.material as THREE.Material).dispose();
        dustRef.current = null;
      }
      if (cloudsRaf.current) cancelAnimationFrame(cloudsRaf.current);
      if (cloudsRef.current) {
        globe.scene().remove(cloudsRef.current);
        cloudsRef.current.geometry.dispose();
        (cloudsRef.current.material as THREE.Material).dispose();
        cloudsRef.current = null;
      }
      if (nightTexRef.current) {
        nightTexRef.current.dispose();
        nightTexRef.current = null;
      }
      if (dayNightMatRef.current) {
        dayNightMatRef.current.dispose();
        dayNightMatRef.current = null;
      }
      dayTexRef.current?.dispose();
      dayTexRef.current = null;
      savedGlobeMatRef.current = null;
      if (spaceGroupRef.current) {
        globe.scene().remove(spaceGroupRef.current);
        spaceGroupRef.current = null;
      }
    };
  }, []);

  // ── preload day + night textures for the day/night shader ───
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const nightUrl = NIGHT_LIGHTS_BASE_URL.startsWith('//')
      ? `https:${NIGHT_LIGHTS_BASE_URL}`
      : NIGHT_LIGHTS_BASE_URL;
    loader.load(COLOR_URL, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      dayTexRef.current = tex;
      if (modeRef.current === 'daynight') applyDayNightGlobe();
    });
    loader.load(nightUrl, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (!nightTexRef.current) nightTexRef.current = tex;
      if (modeRef.current === 'daynight') applyDayNightGlobe();
    });
  }, [applyDayNightGlobe]);

  // ── cache each country's bounding box for fast click hit-testing ──
  useEffect(() => {
    bboxRef.current = countries.map(f => {
      try {
        return turf.bbox(f) as [number, number, number, number];
      } catch {
        return [180, 90, -180, -90]; // degenerate box → never contains a point
      }
    });
  }, [countries]);

  // ── build NASA-style night lights texture from countries + city data ──
  // Deferred to idle: it's a heavy canvas build only needed for Day/Night,
  // so it must not compete with the intro on weaker devices.
  useEffect(() => {
    if (countries.length === 0 || nightTexRef.current) return;
    let cancelled = false;
    idleCall(() => {
      if (cancelled || nightTexRef.current) return;
      createNightLightsTexture(countries).then(tex => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        nightTexRef.current = tex;
        if (modeRef.current === 'daynight') applyDayNightGlobe();
      }).catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [countries, applyDayNightGlobe]);

  // ── theme-aware atmosphere / clouds ─────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const a = ATMO[theme];
    g.atmosphereColor(a.color).atmosphereAltitude(a.alt);
    if (cloudsRef.current) {
      (cloudsRef.current.material as THREE.MeshPhongMaterial).opacity = theme === 'dark' ? 0.78 : 0.5;
    }
  }, [theme]);

  // ── zoom controls (imperative) ──────────────────────────────
  useImperativeHandle(ref, () => ({
    zoomIn() {
      const g = globeRef.current;
      if (!g) return;
      const pov = g.pointOfView();
      const next = (pov.altitude ?? 2) * 0.6;
      // at the boundary, the button hands off to the 2D map — same as scroll/pinch
      if (next <= HANDOFF_ALT && armedRef.current && !mapOpenRef.current) {
        armedRef.current = false;
        onEnterMapRef.current(pov.lat ?? 0, pov.lng ?? 0);
        return;
      }
      g.pointOfView({ altitude: Math.max(next, HANDOFF_ALT) }, 450);
    },
    zoomOut() {
      const g = globeRef.current;
      if (!g) return;
      const pov = g.pointOfView();
      g.pointOfView({ altitude: Math.min((pov.altitude ?? 2) * 1.6, 4) }, 450);
    },
    reset() {
      globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.3 }, 800);
    },
    flyTo(lat: number, lng: number) {
      armedRef.current = false; // a fly-to shouldn't trigger the map handoff
      globeRef.current?.pointOfView({ lat, lng, altitude: 0.9 }, 1400);
    },
  }));

  // ── return from the 2D map → pull the camera back out ───────
  useEffect(() => {
    mapOpenRef.current = mapOpen;
    if (prevMapOpen.current && !mapOpen) {
      armedRef.current = true;
      globeRef.current?.pointOfView({ altitude: 1.6 }, 900);
    }
    prevMapOpen.current = mapOpen;
  }, [mapOpen]);

  // ── keep a gentle, living rotation (faster during landing) ──
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = !prefersReduced();
    g.controls().autoRotateSpeed = isLanding ? 0.4 : 0.22;
  }, [isLanding]);

  // ── reset shrink layers when the comparison is cleared ──────
  useEffect(() => {
    if (!shrink.source) {
      shrinkSource.current = null;
      setShrinkPolys([]);
    }
  }, [shrink.source]);

  const pauseRotateThenResume = () => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = false;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      if (globeRef.current) globeRef.current.controls().autoRotate = !prefersReduced();
    }, 4000);
  };

  // ── click handling (mode-aware) ─────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g || isLanding) return;

    // Radius/blast fill polygons sit above the globe and block re-clicks inside the area.
    g.pointerEventsFilter(obj => {
      const t = (obj as { __globeObjType?: string }).__globeObjType;
      if ((mode === 'flight' || mode === 'blast') && t === 'polygon') return false;
      return true;
    });

    const selectPoint = (lat: number, lng: number) => {
      pauseRotateThenResume();

      if (mode === 'truesize') {
        handleShrinkClick(lat, lng);
        return;
      }

      if (mode === 'dig') {
        // view ~70° off the clicked point so the through-planet beam reads side-on
        const [camLng, camLat] = destinationPoint(lat, lng, 7792, 90);
        g.pointOfView({ lat: camLat, lng: camLng, altitude: 2.1 }, 1200);
      } else {
        g.pointOfView({ lat, lng, altitude: 1.8 }, 1000);
      }
      onPointClick(lat, lng);
    };

    g.onGlobeClick(({ lat, lng }: { lat: number; lng: number }) => {
      // ignore rapid re-fires that stack competing camera tweens (stutter)
      const now = performance.now();
      if (now - lastClickAt.current < 200) return;
      lastClickAt.current = now;
      selectPoint(lat, lng);
    });

    g.onPointClick((pt: object, _ev, coords) => {
      if (mode !== 'flight' || flightModeRef.current !== 'reach') return;
      const p = pt as PointDatum;
      selectPoint(p.lat ?? coords.lat, p.lng ?? coords.lng);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, shrinkStage, countries, isLanding, onPointClick]);

  function findCountryAt(lat: number, lng: number): Feature | null {
    const pt = turf.point([lng, lat]);
    const boxes = bboxRef.current;
    const useBox = boxes.length === countries.length;
    for (let i = 0; i < countries.length; i++) {
      // cheap bounding-box reject before the expensive point-in-polygon test
      if (useBox) {
        const b = boxes[i];
        if (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3]) continue;
      }
      try {
        if (turf.booleanPointInPolygon(pt, countries[i] as Feature<Polygon | MultiPolygon>)) {
          return countries[i];
        }
      } catch {
        /* skip non-polygon features */
      }
    }
    return null;
  }

  function areaKm2(f: Feature): number {
    return turf.area(f) / 1e6;
  }

  function handleShrinkClick(lat: number, lng: number) {
    const g = globeRef.current;
    if (!g) return;

    if (shrinkStage === 'source') {
      const f = findCountryAt(lat, lng);
      if (!f) return;
      const c = turf.centroid(f).geometry.coordinates as [number, number];
      shrinkSource.current = { feature: f, centroid: c };
      setShrinkPolys([{ feat: f, cap: 'rgba(79,172,254,0.35)', side: 'rgba(79,172,254,0.15)', stroke: ACCENT, alt: 0.012 }]);
      onShrinkUpdate({ source: { name: cName(f), areaKm2: areaKm2(f), lat: c[1] }, target: null });
      g.pointOfView({ lat: c[1], lng: c[0], altitude: 1.9 }, 1000);
    } else {
      const src = shrinkSource.current;
      if (!src) return;
      const dLng = lng - src.centroid[0];
      const dLat = lat - src.centroid[1];
      const ghostGeom = shiftGeometry(src.feature.geometry, dLng, dLat);
      const ghost: Feature = { type: 'Feature', properties: {}, geometry: ghostGeom };

      const targetFeat = findCountryAt(lat, lng);
      const targetName = targetFeat ? cName(targetFeat) : 'open water';
      const targetArea = targetFeat ? areaKm2(targetFeat) : 0;

      setShrinkPolys([
        { feat: src.feature, cap: 'rgba(79,172,254,0.18)', side: 'rgba(79,172,254,0.08)', stroke: ACCENT, alt: 0.012 },
        { feat: ghost, cap: 'rgba(0,242,254,0.25)', side: 'rgba(0,242,254,0.12)', stroke: CYAN, alt: 0.02 },
      ]);
      onShrinkUpdate({
        source: { name: cName(src.feature), areaKm2: areaKm2(src.feature), lat: src.centroid[1] },
        target: { name: targetName, areaKm2: targetArea },
      });
      g.pointOfView({ lat, lng, altitude: 1.9 }, 1000);
    }
  }

  // ── render layers per mode ──────────────────────────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    // wipe everything
    g.pointsData([]).ringsData([]).arcsData([]).labelsData([]).polygonsData([]).htmlElementsData([]);

    // Day/Night and Space manage their own layers in dedicated effects
    if (mode === 'daynight' || mode === 'space') return;

    const setHtml = (markers: HtmlDatum[]) =>
      g
        .htmlElementsData(markers)
        .htmlElement((d: object) => makeMarker(d as HtmlDatum))
        .htmlAltitude(0.012);
    const setPoints = (pts: PointDatum[]) =>
      g
        .pointsData(pts)
        .pointColor((d: object) => (d as PointDatum).color)
        .pointAltitude((d: object) => 0.01 + (d as PointDatum).size * 0.01)
        .pointRadius((d: object) => (d as PointDatum).size)
        .pointsMerge(false)
        .pointLabel((d: object) => {
          const p = d as PointDatum;
          return p.label ? tip(p.label) : '';
        });
    const setArcs = (arcs: ArcDatum[]) =>
      g
        .arcsData(arcs)
        .arcColor((d: object) => (d as ArcDatum).color)
        .arcStroke(1.5)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000);
    const setRings = (rings: RingDatum[]) =>
      g
        .ringsData(rings)
        .ringColor((d: object) => (d as RingDatum).color)
        .ringMaxRadius((d: object) => (d as RingDatum).maxR)
        .ringPropagationSpeed((d: object) => (d as RingDatum).speed)
        .ringRepeatPeriod((d: object) => (d as RingDatum).period)
        .ringAltitude(0.006);
    const setLabels = (labels: LabelDatum[]) =>
      g
        .labelsData(labels)
        .labelText((d: object) => (d as LabelDatum).text)
        .labelColor((d: object) => (d as LabelDatum).color)
        .labelSize((d: object) => (d as LabelDatum).size)
        .labelDotRadius(0.25)
        .labelAltitude(0.02);
    const setPolys = (polys: PolyDatum[]) =>
      g
        .polygonsData(polys)
        .polygonGeoJsonGeometry(
          (d: object) => (d as PolyDatum).feat.geometry as unknown as { type: string; coordinates: number[] },
        )
        .polygonCapColor((d: object) => (d as PolyDatum).cap)
        .polygonSideColor((d: object) => (d as PolyDatum).side)
        .polygonStrokeColor((d: object) => (d as PolyDatum).stroke)
        .polygonAltitude((d: object) => (d as PolyDatum).alt)
        .polygonLabel((d: object) => (d as PolyDatum).label ?? '')
        .onPolygonHover((h: object | null) =>
          g.polygonAltitude((d: object) =>
            d === h ? (d as PolyDatum).alt + 0.04 : (d as PolyDatum).alt,
          ),
        );

    // ── VISA: colour every country, no click needed ──────────
    if (mode === 'visa') {
      const visaMap = buildVisaMap(passportCode);
      const catText: Record<string, string> = {
        'visa-free': 'Visa-free / on arrival',
        'e-visa': 'e-Visa / ETA',
        'visa-required': 'Visa required',
        home: 'Home country',
      };
      const stroke = theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(20,40,70,0.22)';
      const polys: PolyDatum[] = countries.map(f => {
        const cat = visaMap.get(iso2(f));
        const color = cat ? VISA_COLORS[cat] : 'rgba(130,140,155,0.22)';
        return {
          feat: f,
          cap: color,
          side: 'rgba(0,0,0,0.12)',
          stroke,
          alt: 0.008,
          label: tip(cName(f), cat ? catText[cat] : 'No data'),
        };
      });
      setPolys(polys).polygonsTransitionDuration(400);
      return;
    }

    // ── POPULATION: choropleth by density ───────────────────
    if (mode === 'population') {
      const factByIso = new Map(COUNTRY_FACTS.map(f => [f.code, f]));
      const stroke = theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(20,40,70,0.22)';
      const neutral = theme === 'dark' ? 'rgba(130,140,155,0.22)' : 'rgba(160,170,185,0.35)';
      const polys: PolyDatum[] = countries.map(f => {
        const code = iso2(f);
        const fact = factByIso.get(code);
        const d = fact ? countryDensity(fact) : null;
        const color = d != null ? densityColor(d) : neutral;
        const label = d != null
          ? tip(cName(f), `${Math.round(d).toLocaleString()} / km²`)
          : tip(cName(f), 'No data');
        return { feat: f, cap: color, side: 'rgba(0,0,0,0.12)', stroke, alt: 0.008, label };
      });
      setPolys(polys).polygonsTransitionDuration(400);
      return;
    }

    // ── TIMELINE: highlight selected country ─────────────────
    if (mode === 'timeline') {
      const fact = getCountryFact(timelineCode);
      const f = countries.find(c => iso2(c) === timelineCode);
      const polys: PolyDatum[] = [];
      if (f) {
        polys.push({
          feat: f,
          cap: hexA(ACCENT, 0.34),
          side: hexA(ACCENT, 0.14),
          stroke: ACCENT,
          alt: 0.012,
          label: tip(fact?.name ?? cName(f)),
        });
      }
      setPolys(polys).polygonsTransitionDuration(500);
      const markers: HtmlDatum[] = [];
      if (fact) markers.push({ lat: fact.lat, lng: fact.lng, color: ACCENT, kind: 'reticle', label: `${fact.flag} ${fact.name}` });
      if (selectedPoint) markers.push({ lat: selectedPoint.lat, lng: selectedPoint.lng, color: CYAN, kind: 'reticle' });
      setHtml(markers);
      return;
    }

    // ── TRUE SIZE: driven by click handler state (pick up → drop) ──
    if (mode === 'truesize') {
      setPolys(shrinkPolys).polygonsTransitionDuration(700);
      return;
    }

    // ── CLIMATE TWIN ─────────────────────────────────────────
    if (mode === 'climatetwin') {
      const city = selectedPoint ? getNearestCity(selectedPoint.lat, selectedPoint.lng, 25) : null;
      if (!city) {
        setPoints(
          CITIES.map(c => ({ lat: c.lat, lng: c.lng, color: dim, size: 0.16, label: tip(c.name, c.country) })),
        );
        return;
      }
      const twins = getClimateTwins(city);
      const twinNames = new Set(twins.map(t => t.city.name));
      setPoints([
        ...CITIES.filter(c => c.name !== city.name && !twinNames.has(c.name)).map(c => ({
          lat: c.lat, lng: c.lng, color: dim, size: 0.14, label: tip(c.name, c.country),
        })),
        ...twins.map(t => ({ lat: t.city.lat, lng: t.city.lng, color: CYAN, size: 0.34, label: tip(t.city.name, t.city.country) })),
      ]);
      setArcs(
        twins.map(t => ({
          startLat: city.lat, startLng: city.lng, endLat: t.city.lat, endLng: t.city.lng, color: CYAN,
        })),
      );
      setLabels(twins.map(t => ({ lat: t.city.lat, lng: t.city.lng, text: t.city.name, color: CYAN, size: 0.7 })));
      setHtml([{ lat: city.lat, lng: city.lng, color: ACCENT, kind: 'reticle', label: city.name }]);
      return;
    }

    // ── FLIGHT · REACH ───────────────────────────────────────
    if (mode === 'flight' && flightMode === 'reach') {
      if (!selectedPoint) return;
      const radiusKm = flightHours * CRUISE_KMH;
      const ring = generateCirclePolygon(selectedPoint.lat, selectedPoint.lng, radiusKm);
      const circleFeat: Feature = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
      setPolys([{ feat: circleFeat, cap: 'rgba(79,172,254,0.15)', side: 'rgba(79,172,254,0.08)', stroke: ACCENT, alt: 0.01 }]).polygonsTransitionDuration(400);

      const inRange = new Set(getCitiesInRadius(selectedPoint.lat, selectedPoint.lng, radiusKm).map(r => r.city.name));
      setHtml([{ lat: selectedPoint.lat, lng: selectedPoint.lng, color: ACCENT, kind: 'reticle', label: 'Origin' }]);
      setPoints([
        ...CITIES.map(c => ({
          lat: c.lat,
          lng: c.lng,
          color: inRange.has(c.name) ? ACCENT : dim,
          size: inRange.has(c.name) ? 0.34 : 0.13,
          label: tip(c.name, c.country),
        })),
      ]);
      return;
    }

    // ── COMPARE COUNTRIES: highlight both, reticles + labels ─
    if (mode === 'compare') {
      const a = getCountryFact(compareCodes[0]);
      const b = getCountryFact(compareCodes[1]);
      const fa = countries.find(f => iso2(f) === compareCodes[0]);
      const fb = countries.find(f => iso2(f) === compareCodes[1]);
      const polys: PolyDatum[] = [];
      if (fa) polys.push({ feat: fa, cap: hexA(ACCENT, 0.34), side: hexA(ACCENT, 0.14), stroke: ACCENT, alt: 0.012, label: tip(a?.name ?? cName(fa)) });
      if (fb) polys.push({ feat: fb, cap: hexA(CYAN, 0.3), side: hexA(CYAN, 0.12), stroke: CYAN, alt: 0.014, label: tip(b?.name ?? cName(fb)) });
      setPolys(polys).polygonsTransitionDuration(500);
      const markers: HtmlDatum[] = [];
      if (a) markers.push({ lat: a.lat, lng: a.lng, color: ACCENT, kind: 'reticle', label: `${a.flag} ${a.name}` });
      if (b) markers.push({ lat: b.lat, lng: b.lng, color: CYAN, kind: 'reticle', label: `${b.flag} ${b.name}` });
      setHtml(markers);
      return;
    }

    // ── FLIGHT · ROUTE: animated great-circle arc ────────────
    if (mode === 'flight' && flightMode === 'route') {
      const { from, to } = route;
      if (from && to) {
        setArcs([{ startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng, color: [ACCENT, CYAN] }]);
        setHtml([
          { lat: from.lat, lng: from.lng, color: ACCENT, kind: 'reticle', label: from.name },
          { lat: to.lat, lng: to.lng, color: CYAN, kind: 'impact', label: to.name },
        ]);
      }
      return;
    }

    // ── NATURAL WONDERS: dots + selected highlight ───────────
    if (mode === 'wonders') {
      setPoints(
        NATURAL_WONDERS.map(w => ({
          lat: w.lat,
          lng: w.lng,
          color: wonder?.id === w.id ? ACCENT : dim,
          size: wonder?.id === w.id ? 0.5 : 0.22,
          label: tip(`${w.emoji} ${w.name}`, w.country),
        })),
      );
      if (wonder) setHtml([{ lat: wonder.lat, lng: wonder.lng, color: ACCENT, kind: 'impact', label: `${wonder.emoji} ${wonder.name}` }]);
      return;
    }

    if (!selectedPoint) return;
    const { lat, lng } = selectedPoint;

    // ── DIG ─ through-planet beam is drawn in a dedicated 3D effect ─
    if (mode === 'dig') {
      const anti = getAntipode(lat, lng);
      setHtml([
        { lat, lng, color: ACCENT, kind: 'reticle', label: 'Start' },
        { lat: anti.lat, lng: anti.lng, color: CYAN, kind: 'impact', label: 'Antipode' },
      ]);
      return;
    }

    // ── BLAST ─ layered damage zones + impact reticle ────────
    if (mode === 'blast') {
      const zones = getBlastZones(blastType); // outer → inner
      const polys: PolyDatum[] = zones.map((z, i) => {
        const ring = generateCirclePolygon(lat, lng, z.radiusKm);
        const feat: Feature = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [ring] },
        };
        return {
          feat,
          cap: hexA(z.color, 0.22),
          side: hexA(z.color, 0.1),
          stroke: hexA(z.color, 0.85),
          alt: 0.006 + i * 0.0012, // inner zones float slightly higher
          label: tip(z.label, `${Math.round(z.radiusKm).toLocaleString()} km · ${z.desc}`),
        };
      });
      setPolys(polys).polygonsTransitionDuration(500);
      setRings([{ lat, lng, maxR: zones[0].radiusKm / 111, speed: 2, period: 1500, color: blastType.color }]);
      setHtml([{ lat, lng, color: blastType.color, kind: 'impact' }]);
      return;
    }

  }, [mode, flightMode, selectedPoint, blastType, passportCode, flightHours, countries, shrinkPolys, theme, dim, compareCodes, timelineCode, route, wonder]);

  // ── DAY / NIGHT: swap globe to day/night shader with live terminator ─
  useEffect(() => {
    const g = globeRef.current;
    const clouds = cloudsRef.current;
    if (!g) return;

    let rafId = 0;
    const controls = g.controls();
    const prevAutoRotate = controls.autoRotate;

    const restore = () => {
      if (savedGlobeMatRef.current) g.globeMaterial(savedGlobeMatRef.current);
    };

    if (mode !== 'daynight') {
      restore();
      if (clouds) clouds.visible = true;
      return;
    }

    applyDayNightGlobe();
    if (clouds) clouds.visible = false;
    controls.autoRotate = false;

    const frame = () => {
      const mat = dayNightMatRef.current;
      if (mat) {
        updateDayNightUniforms(mat, subsolarPoint(new Date()), g.pointOfView());
      }
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      controls.autoRotate = prevAutoRotate;
      restore();
      if (clouds) clouds.visible = true;
    };
  }, [mode, applyDayNightGlobe]);

  // ── DAY / NIGHT markers (sun + selected point) ───────────────
  useEffect(() => {
    const g = globeRef.current;
    if (!g || mode !== 'daynight') return;

    const tick = () => {
      const now = new Date();
      const sub = subsolarPoint(now);
      const markers: HtmlDatum[] = [
        { lat: sub.lat, lng: sub.lng, color: '#ffd54a', kind: 'impact', label: '☀ Sun overhead' },
      ];
      if (selectedPoint) {
        const day = isDaylight(selectedPoint.lat, selectedPoint.lng, now);
        markers.push({
          lat: selectedPoint.lat,
          lng: selectedPoint.lng,
          color: day ? '#ffd54a' : '#6c8cff',
          kind: 'reticle',
          label: day ? 'Daytime' : 'Night',
        });
      }
      g.htmlElementsData(markers).htmlElement((d: object) => makeMarker(d as HtmlDatum)).htmlAltitude(0.02);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mode, selectedPoint]);

  // ── WONDERS: fly the camera to the selected wonder ──────────
  useEffect(() => {
    if (mode !== 'wonders' || !wonder) return;
    globeRef.current?.pointOfView({ lat: wonder.lat, lng: wonder.lng, altitude: 1.4 }, 1400);
  }, [mode, wonder]);

  // ── DIG: glowing beam straight through the planet to the antipode ─
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    const clear = () => {
      if (digRaf.current) {
        cancelAnimationFrame(digRaf.current);
        digRaf.current = null;
      }
      if (digGroupRef.current) {
        g.scene().remove(digGroupRef.current);
        digGroupRef.current.traverse(o => {
          const mesh = o as THREE.Mesh;
          mesh.geometry?.dispose?.();
          (mesh.material as THREE.Material | undefined)?.dispose?.();
        });
        digGroupRef.current = null;
      }
    };

    if (mode !== 'dig' || !selectedPoint) {
      clear();
      return;
    }
    clear();

    const R = g.getGlobeRadius();
    const c = g.getCoords(selectedPoint.lat, selectedPoint.lng, 0) as { x: number; y: number; z: number };
    const start = new THREE.Vector3(c.x, c.y, c.z);
    const end = start.clone().multiplyScalar(-1); // antipode surface = opposite point
    const len = end.clone().sub(start).length(); // = planet diameter
    const axis = end.clone().sub(start).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);

    const group = new THREE.Group();
    // x-ray beam: depthTest off so it reads straight through the globe
    const mkTube = (radius: number, color: string, opacity: number, order: number) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, len, 20, 1, true),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        }),
      );
      mesh.quaternion.copy(quat);
      mesh.renderOrder = order; // centred at the globe's origin
      return mesh;
    };
    group.add(mkTube(R * 0.05, CYAN, 0.14, 12), mkTube(R * 0.018, ACCENT, 0.85, 13));

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.035, 16, 16),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    );
    pulse.renderOrder = 14;
    pulse.position.copy(start);
    group.add(pulse);

    g.scene().add(group);
    digGroupRef.current = group;

    if (!prefersReduced()) {
      let t = 0;
      const tick = () => {
        t += 0.011;
        if (t > 1) t = 0;
        pulse.position.lerpVectors(start, end, t);
        (pulse.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * Math.sin(t * Math.PI);
        digRaf.current = requestAnimationFrame(tick);
      };
      tick();
    }

    return clear;
  }, [mode, selectedPoint]);

  // ── SPACE: pull camera back, reveal Moon + ISS ──────────────
  useEffect(() => {
    const g = globeRef.current;
    const group = spaceGroupRef.current;
    if (!g) return;

    if (mode !== 'space') {
      if (group) group.visible = false;
      g.controls().maxDistance = 600;
      return;
    }

    if (group) group.visible = true;
    g.controls().maxDistance = 2000;
    g.controls().autoRotate = false;
    g.pointOfView({ lat: 12, lng: 0, altitude: 6.2 }, 1800);

    const render = () => {
      const markers: HtmlDatum[] = [];
      if (iss) markers.push({ lat: iss.lat, lng: iss.lng, color: '#00f2fe', kind: 'impact', label: '🛰 ISS' });
      g.pointsData([]).ringsData([]).arcsData([]).labelsData([]).polygonsData([]);
      g.htmlElementsData(markers).htmlElement((d: object) => makeMarker(d as HtmlDatum)).htmlAltitude(0.06);
    };
    render();

    return () => {
      g.controls().maxDistance = 600;
      g.controls().autoRotate = true;
    };
  }, [mode, iss]);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />;
});

export default Globe;
