import * as THREE from 'three';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { CITIES, haversine } from '../data';
import type { City } from '../types';

const W = 2048;
const H = 1024;

/** NASA-style city lights base (three-globe / Visible Earth derivative). */
export const NIGHT_LIGHTS_BASE_URL = '//unpkg.com/three-globe/example/img/earth-night.jpg';

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/** Zero out dim pixels so rural land & ocean stay dark; keep urban cores. */
function crushShadows(ctx: CanvasRenderingContext2D, floor = 0.055, gain = 1.15) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    if (lum < floor) {
      d[i] = d[i + 1] = d[i + 2] = 0;
    } else {
      const t = Math.min((lum - floor) / (1 - floor), 1);
      const v = Math.round(Math.pow(t, 1.35) * gain * 255);
      d[i] = d[i + 1] = d[i + 2] = Math.min(v, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grd.addColorStop(0, `rgba(255, 230, 185, ${alpha})`);
  grd.addColorStop(0.45, `rgba(255, 210, 150, ${alpha * 0.25})`);
  grd.addColorStop(1, 'rgba(255, 200, 140, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function ringToPath(ctx: CanvasRenderingContext2D, ring: [number, number][]) {
  ring.forEach(([lng, lat], i) => {
    const { x, y } = latLngToXY(lat, lng);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawCoastlines(ctx: CanvasRenderingContext2D, countries: Feature[]) {
  ctx.strokeStyle = 'rgba(90, 130, 170, 0.035)';
  ctx.lineWidth = 0.9;
  ctx.lineJoin = 'round';
  for (const f of countries) {
    const g = f.geometry;
    if (g.type === 'Polygon') {
      for (const ring of (g as Polygon).coordinates) {
        ctx.beginPath();
        ringToPath(ctx, ring as [number, number][]);
        ctx.stroke();
      }
    } else if (g.type === 'MultiPolygon') {
      for (const poly of (g as MultiPolygon).coordinates) {
        for (const ring of poly) {
          ctx.beginPath();
          ringToPath(ctx, ring as [number, number][]);
          ctx.stroke();
        }
      }
    }
  }
}

function buildCorridors(max: number): [City, City][] {
  const pairs: { a: City; b: City; score: number }[] = [];
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      const a = CITIES[i];
      const b = CITIES[j];
      const d = haversine(a.lat, a.lng, b.lat, b.lng);
      if (d < 150 || d > 2200) continue;
      pairs.push({ a, b, score: (a.population + b.population) / d });
    }
  }
  return pairs
    .sort((x, y) => y.score - x.score)
    .slice(0, max)
    .map(p => [p.a, p.b]);
}

function drawCorridor(ctx: CanvasRenderingContext2D, a: City, b: City) {
  const p0 = latLngToXY(a.lat, a.lng);
  const p1 = latLngToXY(b.lat, b.lng);
  const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  grad.addColorStop(0, 'rgba(255, 210, 150, 0)');
  grad.addColorStop(0.5, 'rgba(255, 210, 150, 0.018)');
  grad.addColorStop(1, 'rgba(255, 210, 150, 0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

/**
 * NASA Black Marble base (shadow-crushed) + sparse procedural city accents.
 * Rural regions and oceans stay near-black.
 */
export async function createNightLightsTexture(countries: Feature[]): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  try {
    const base = await loadImage(NIGHT_LIGHTS_BASE_URL);
    ctx.drawImage(base, 0, 0, W, H);
    crushShadows(ctx);
  } catch {
    /* black canvas + city dots only */
  }

  ctx.globalCompositeOperation = 'lighter';

  const maxCityPop = Math.max(...CITIES.map(c => c.population));
  for (const city of CITIES) {
    const { x, y } = latLngToXY(city.lat, city.lng);
    const t = Math.pow(city.population / maxCityPop, 0.55);
    const radius = 2 + t * 18;
    const alpha = 0.04 + t * 0.28;
    drawGlow(ctx, x, y, radius, alpha);
    if (t > 0.55) drawGlow(ctx, x, y, radius * 0.22, alpha * 0.7);
  }

  ctx.globalCompositeOperation = 'source-over';
  drawCoastlines(ctx, countries);

  ctx.globalCompositeOperation = 'lighter';
  for (const [a, b] of buildCorridors(8)) drawCorridor(ctx, a, b);

  crushShadows(ctx, 0.04, 1.05);

  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
