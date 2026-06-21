import type {
  City,
  BlastType,
  BlastZone,
  ScaleComparison,
  PassportData,
  VisaCategory,
  VisaSummary,
  ClimateTwin,
  CountryFact,
  Wonder,
  ISSPosition,
  WeatherInfo,
  TimelinePoint,
} from './types';
import {
  buildVisaMap,
  VISA_MATRIX_PASSPORTS,
} from './generated/visa-lookup';

export { buildVisaMap, VISA_DATA_META, getVisaCategory, hasVisaMatrixPassport } from './generated/visa-lookup';

// ───────────────────────────────────────────────────────────────
// CITIES — 30 metros, fully populated
// ───────────────────────────────────────────────────────────────
export const CITIES: City[] = [
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.68, lng: 139.69, population: 13960000, timezone: 'Asia/Tokyo', utcOffset: 9, avgTemp: 16, annualRainfall: 1530, climateZone: 'Cfa' },
  { name: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.07, lng: 72.87, population: 20667656, timezone: 'Asia/Kolkata', utcOffset: 5.5, avgTemp: 27, annualRainfall: 2200, climateZone: 'Aw' },
  { name: 'New York', country: 'USA', countryCode: 'US', lat: 40.71, lng: -74.0, population: 8336817, timezone: 'America/New_York', utcOffset: -5, avgTemp: 13, annualRainfall: 1200, climateZone: 'Cfa' },
  { name: 'London', country: 'UK', countryCode: 'GB', lat: 51.5, lng: -0.12, population: 9002488, timezone: 'Europe/London', utcOffset: 0, avgTemp: 11, annualRainfall: 690, climateZone: 'Cfb' },
  { name: 'Paris', country: 'France', countryCode: 'FR', lat: 48.85, lng: 2.35, population: 2161000, timezone: 'Europe/Paris', utcOffset: 1, avgTemp: 12, annualRainfall: 640, climateZone: 'Cfb' },
  { name: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.86, lng: 151.2, population: 5312000, timezone: 'Australia/Sydney', utcOffset: 10, avgTemp: 18, annualRainfall: 1150, climateZone: 'Cfa' },
  { name: 'Dubai', country: 'UAE', countryCode: 'AE', lat: 25.2, lng: 55.27, population: 3331420, timezone: 'Asia/Dubai', utcOffset: 4, avgTemp: 28, annualRainfall: 100, climateZone: 'BWh' },
  { name: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.35, lng: 103.81, population: 5850342, timezone: 'Asia/Singapore', utcOffset: 8, avgTemp: 27, annualRainfall: 2340, climateZone: 'Af' },
  { name: 'São Paulo', country: 'Brazil', countryCode: 'BR', lat: -23.55, lng: -46.63, population: 12325232, timezone: 'America/Sao_Paulo', utcOffset: -3, avgTemp: 19, annualRainfall: 1450, climateZone: 'Cfa' },
  { name: 'Cairo', country: 'Egypt', countryCode: 'EG', lat: 30.04, lng: 31.23, population: 10107125, timezone: 'Africa/Cairo', utcOffset: 2, avgTemp: 22, annualRainfall: 25, climateZone: 'BWh' },
  { name: 'Lagos', country: 'Nigeria', countryCode: 'NG', lat: 6.45, lng: 3.39, population: 14862111, timezone: 'Africa/Lagos', utcOffset: 1, avgTemp: 27, annualRainfall: 1500, climateZone: 'Aw' },
  { name: 'Mexico City', country: 'Mexico', countryCode: 'MX', lat: 19.43, lng: -99.13, population: 9209944, timezone: 'America/Mexico_City', utcOffset: -6, avgTemp: 17, annualRainfall: 820, climateZone: 'Cwb' },
  { name: 'Beijing', country: 'China', countryCode: 'CN', lat: 39.9, lng: 116.4, population: 21893095, timezone: 'Asia/Shanghai', utcOffset: 8, avgTemp: 13, annualRainfall: 570, climateZone: 'Dwa' },
  { name: 'Moscow', country: 'Russia', countryCode: 'RU', lat: 55.75, lng: 37.61, population: 12506468, timezone: 'Europe/Moscow', utcOffset: 3, avgTemp: 6, annualRainfall: 700, climateZone: 'Dfb' },
  { name: 'Istanbul', country: 'Turkey', countryCode: 'TR', lat: 41.01, lng: 28.94, population: 15462452, timezone: 'Europe/Istanbul', utcOffset: 3, avgTemp: 15, annualRainfall: 850, climateZone: 'Csa' },
  { name: 'Bangalore', country: 'India', countryCode: 'IN', lat: 12.97, lng: 77.59, population: 12765000, timezone: 'Asia/Kolkata', utcOffset: 5.5, avgTemp: 24, annualRainfall: 970, climateZone: 'Aw' },
  { name: 'Chennai', country: 'India', countryCode: 'IN', lat: 13.08, lng: 80.27, population: 7088000, timezone: 'Asia/Kolkata', utcOffset: 5.5, avgTemp: 29, annualRainfall: 1400, climateZone: 'Aw' },
  { name: 'Delhi', country: 'India', countryCode: 'IN', lat: 28.61, lng: 77.2, population: 32226000, timezone: 'Asia/Kolkata', utcOffset: 5.5, avgTemp: 25, annualRainfall: 790, climateZone: 'BSh' },
  { name: 'Seoul', country: 'South Korea', countryCode: 'KR', lat: 37.56, lng: 126.97, population: 9776000, timezone: 'Asia/Seoul', utcOffset: 9, avgTemp: 13, annualRainfall: 1450, climateZone: 'Dwa' },
  { name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', lat: -6.21, lng: 106.84, population: 10770000, timezone: 'Asia/Jakarta', utcOffset: 7, avgTemp: 27, annualRainfall: 1800, climateZone: 'Af' },
  { name: 'Los Angeles', country: 'USA', countryCode: 'US', lat: 34.05, lng: -118.24, population: 3979576, timezone: 'America/Los_Angeles', utcOffset: -8, avgTemp: 18, annualRainfall: 380, climateZone: 'Csb' },
  { name: 'Chicago', country: 'USA', countryCode: 'US', lat: 41.87, lng: -87.62, population: 2693976, timezone: 'America/Chicago', utcOffset: -6, avgTemp: 10, annualRainfall: 990, climateZone: 'Dfa' },
  { name: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.65, lng: -79.38, population: 2930000, timezone: 'America/Toronto', utcOffset: -5, avgTemp: 9, annualRainfall: 830, climateZone: 'Dfb' },
  { name: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.52, lng: 13.4, population: 3669491, timezone: 'Europe/Berlin', utcOffset: 1, avgTemp: 10, annualRainfall: 570, climateZone: 'Cfb' },
  { name: 'Madrid', country: 'Spain', countryCode: 'ES', lat: 40.41, lng: -3.7, population: 3223334, timezone: 'Europe/Madrid', utcOffset: 1, avgTemp: 15, annualRainfall: 430, climateZone: 'Csa' },
  { name: 'Rome', country: 'Italy', countryCode: 'IT', lat: 41.89, lng: 12.48, population: 2872800, timezone: 'Europe/Rome', utcOffset: 1, avgTemp: 16, annualRainfall: 800, climateZone: 'Csa' },
  { name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.37, lng: 4.89, population: 921402, timezone: 'Europe/Amsterdam', utcOffset: 1, avgTemp: 10, annualRainfall: 840, climateZone: 'Cfb' },
  { name: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.75, lng: 100.52, population: 10723000, timezone: 'Asia/Bangkok', utcOffset: 7, avgTemp: 28, annualRainfall: 1500, climateZone: 'Aw' },
  { name: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.29, lng: 36.82, population: 4734882, timezone: 'Africa/Nairobi', utcOffset: 3, avgTemp: 19, annualRainfall: 870, climateZone: 'Cwb' },
  { name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', lat: -34.6, lng: -58.38, population: 3075646, timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3, avgTemp: 18, annualRainfall: 1150, climateZone: 'Cfa' },
];

// ───────────────────────────────────────────────────────────────
// BLAST PRESETS  (radius = severe-blast reference radius, km)
// ───────────────────────────────────────────────────────────────
export const BLAST_TYPES: BlastType[] = [
  { id: 'meteor', label: 'Meteor', emoji: '☄️', radius: 12, color: '#ffb020', megatons: 0.4, crater: 1 },
  { id: 'asteroid', label: 'City-killer', emoji: '🪨', radius: 60, color: '#ff7a45', megatons: 50, crater: 5 },
  { id: 'large', label: 'Regional', emoji: '💥', radius: 320, color: '#f5484a', megatons: 5000, crater: 30 },
  { id: 'dino', label: 'Dinosaur Killer', emoji: '🦕', radius: 1500, color: '#c84bd6', megatons: 100_000_000, crater: 180 },
];

const HIROSHIMA_MT = 0.015; // ~15 kt

/** Concentric impact zones, ordered outer → inner. */
export function getBlastZones(bt: BlastType): BlastZone[] {
  const r = bt.radius;
  return [
    { id: 'window', label: 'Window damage', radiusKm: r * 2.6, color: '#ffd60a', desc: 'Glass shatters · light injuries' },
    { id: 'thermal', label: 'Thermal burns', radiusKm: r * 1.7, color: '#ff9f0a', desc: 'Third-degree burns' },
    { id: 'severe', label: 'Severe blast', radiusKm: r, color: '#ff6b35', desc: 'Most buildings collapse' },
    { id: 'total', label: 'Total destruction', radiusKm: r * 0.45, color: '#ff3b30', desc: 'Near-total annihilation' },
    { id: 'fireball', label: 'Fireball', radiusKm: r * 0.18, color: '#ffec99', desc: 'Everything vaporized' },
  ];
}

export function hiroshimaEquivalent(megatons: number): number {
  return megatons / HIROSHIMA_MT;
}

// ───────────────────────────────────────────────────────────────
// SCALE — true size & Mercator distortion
// ───────────────────────────────────────────────────────────────
export const EARTH_LAND_AREA = 148_940_000; // km²
export const EARTH_SURFACE_AREA = 510_072_000; // km²

export const REFERENCE_AREAS: { name: string; areaKm2: number }[] = [
  { name: 'Africa', areaKm2: 30_370_000 },
  { name: 'Russia', areaKm2: 17_098_242 },
  { name: 'Antarctica', areaKm2: 14_200_000 },
  { name: 'Europe', areaKm2: 10_180_000 },
  { name: 'Canada', areaKm2: 9_984_670 },
  { name: 'USA', areaKm2: 9_833_517 },
  { name: 'China', areaKm2: 9_596_961 },
  { name: 'Brazil', areaKm2: 8_515_767 },
  { name: 'Australia', areaKm2: 7_692_024 },
  { name: 'India', areaKm2: 3_287_263 },
  { name: 'Greenland', areaKm2: 2_166_086 },
  { name: 'Alaska', areaKm2: 1_717_856 },
  { name: 'Texas', areaKm2: 695_662 },
  { name: 'France', areaKm2: 551_695 },
  { name: 'Japan', areaKm2: 377_975 },
  { name: 'United Kingdom', areaKm2: 243_610 },
];

/** Mercator linear stretch at a latitude (1 / cos φ). */
export function mercatorLinearFactor(lat: number): number {
  return 1 / Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
}

/** Mercator area inflation at a latitude (1 / cos²φ). */
export function mercatorAreaFactor(lat: number): number {
  return mercatorLinearFactor(lat) ** 2;
}

/** Closest reference regions by area (most comparable first). */
export function getScaleComparisons(areaKm2: number, count = 4): ScaleComparison[] {
  return REFERENCE_AREAS.map(r => ({ name: r.name, ratio: areaKm2 / r.areaKm2 }))
    .sort((a, b) => Math.abs(Math.log(a.ratio)) - Math.abs(Math.log(b.ratio)))
    .slice(0, count);
}

// ───────────────────────────────────────────────────────────────
// KÖPPEN climate-zone descriptions
// ───────────────────────────────────────────────────────────────
export const KOPPEN_DESCRIPTIONS: Record<string, string> = {
  Af: 'Tropical rainforest',
  Am: 'Tropical monsoon',
  Aw: 'Tropical savanna',
  BWh: 'Hot desert',
  BWk: 'Cold desert',
  BSh: 'Hot semi-arid steppe',
  BSk: 'Cold semi-arid steppe',
  Csa: 'Hot-summer Mediterranean',
  Csb: 'Warm-summer Mediterranean',
  Cwa: 'Humid subtropical (dry winter)',
  Cwb: 'Subtropical highland',
  Cfa: 'Humid subtropical',
  Cfb: 'Temperate oceanic',
  Dfa: 'Hot-summer humid continental',
  Dfb: 'Warm-summer humid continental',
  Dwa: 'Monsoon humid continental',
};

export function koppenLabel(code: string): string {
  return KOPPEN_DESCRIPTIONS[code] ?? 'Mixed climate';
}

// ───────────────────────────────────────────────────────────────
// VISA — Passport Index matrix (imorte/passport-index-data, MIT)
// Regenerate: npm run generate:visa
// ───────────────────────────────────────────────────────────────
export const PASSPORT_DATA: Record<string, PassportData> = {
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  FR: { code: 'FR', name: 'France', flag: '🇫🇷' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  CH: { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  NO: { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  GR: { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  PL: { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  IE: { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  NZ: { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  AE: { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  IL: { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  MX: { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  TR: { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  TH: { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  RU: { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  SA: { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  ID: { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  PH: { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  VN: { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  IN: { code: 'IN', name: 'India', flag: '🇮🇳' },
  CN: { code: 'CN', name: 'China', flag: '🇨🇳' },
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  PK: { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
};

export const PASSPORT_LIST: PassportData[] = Object.values(PASSPORT_DATA).sort((a, b) =>
  a.name.localeCompare(b.name),
);

/** Best-effort passport-country detection (IP based, keyless, CORS-enabled). */
export async function detectPassportCountry(): Promise<string | null> {
  const providers: { url: string; pick: (d: Record<string, unknown>) => unknown }[] = [
    { url: 'https://api.country.is/', pick: d => d.country },
    { url: 'https://ipwho.is/', pick: d => d.country_code },
    { url: 'https://ipapi.co/json/', pick: d => d.country_code },
  ];
  for (const p of providers) {
    try {
      const res = await fetch(p.url);
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown>;
      const code = p.pick(data);
      if (typeof code === 'string' && code.length === 2) return code.toUpperCase();
    } catch {
      /* try next provider */
    }
  }
  return null;
}

export function visaTier(score: number): number {
  if (score >= 150) return 1;
  if (score >= 90) return 2;
  if (score >= 45) return 3;
  return 4;
}

export function summarizeVisa(passportCode: string): VisaSummary {
  const map = buildVisaMap(passportCode);
  let visaFree = 0,
    eVisa = 0,
    visaRequired = 0;
  for (const cat of map.values()) {
    if (cat === 'visa-free') visaFree++;
    else if (cat === 'e-visa') eVisa++;
    else if (cat === 'visa-required') visaRequired++;
  }
  const total = map.size;
  const score = visaFree + eVisa;
  return { visaFree, eVisa, visaRequired, total, score, tier: visaTier(score) };
}

let _rankCache: Map<string, number> | null = null;
function passportScoreRankings(): Map<string, number> {
  if (_rankCache) return _rankCache;
  const scores = VISA_MATRIX_PASSPORTS.map(code => ({ code, score: summarizeVisa(code).score }));
  scores.sort((a, b) => b.score - a.score);
  _rankCache = new Map(scores.map((s, i) => [s.code, i + 1]));
  return _rankCache;
}

/** Global rank by easy-access destinations (visa-free + e-visa) in the matrix. */
export function passportRank(code: string): number {
  return passportScoreRankings().get(code.toUpperCase()) ?? 0;
}

export const VISA_COLORS: Record<VisaCategory, string> = {
  'visa-free': '#22C55E',
  'e-visa': '#F59E0B',
  'visa-required': '#EF4444',
  home: '#6B7280',
};

// ───────────────────────────────────────────────────────────────
// GEO / MATH HELPERS (pure)
// ───────────────────────────────────────────────────────────────
const R_EARTH = 6371; // km
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function getAntipode(lat: number, lng: number): { lat: number; lng: number } {
  return { lat: -lat, lng: lng > 0 ? lng - 180 : lng + 180 };
}

export function getLocationLabel(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCitiesOnLatitude(lat: number, tolerance = 3): City[] {
  return CITIES.filter(c => Math.abs(c.lat - lat) <= tolerance);
}

export function getNearestCity(lat: number, lng: number, maxDeg = 15): City | null {
  let nearest: City | null = null;
  let minDist = Infinity;
  for (const city of CITIES) {
    const d = Math.sqrt((city.lat - lat) ** 2 + (city.lng - lng) ** 2);
    if (d < minDist) {
      minDist = d;
      nearest = city;
    }
  }
  return minDist < maxDeg ? nearest : null;
}

export function getPopulationInRadius(lat: number, lng: number, radiusKm: number): number {
  let total = 0;
  for (const city of CITIES) {
    if (haversine(lat, lng, city.lat, city.lng) <= radiusKm) total += city.population;
  }
  return total;
}

export interface CityDistance {
  city: City;
  distanceKm: number;
}

/** Cities within radiusKm of a point, nearest first. */
export function getCitiesInRadius(lat: number, lng: number, radiusKm: number): CityDistance[] {
  return CITIES.map(city => ({ city, distanceKm: haversine(lat, lng, city.lat, city.lng) }))
    .filter(c => c.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Destination point given start, distance (km) and bearing (deg). */
export function destinationPoint(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDeg: number,
): [number, number] {
  const δ = distanceKm / R_EARTH;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  let lngOut = toDeg(λ2);
  lngOut = ((lngOut + 540) % 360) - 180; // normalise to [-180,180)
  return [lngOut, toDeg(φ2)];
}

/** A great-circle "reachable" ring as a GeoJSON-style [lng,lat][] loop. */
export function generateCirclePolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  points = 96,
): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    ring.push(destinationPoint(lat, lng, radiusKm, (i / points) * 360));
  }
  return ring;
}

// ───────────────────────────────────────────────────────────────
// CLIMATE TWIN scoring (pure)
// ───────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function climateSimilarity(a: City, b: City): number {
  const sameZone = a.climateZone === b.climateZone;
  const sameGroup = a.climateZone[0] === b.climateZone[0];
  const zoneScore = sameZone ? 50 : sameGroup ? 20 : 0;
  const tempScore = clamp(30 * (1 - Math.abs(a.avgTemp - b.avgTemp) / 20), 0, 30);
  const rainScore = clamp(20 * (1 - Math.abs(a.annualRainfall - b.annualRainfall) / 1500), 0, 20);
  return Math.round(zoneScore + tempScore + rainScore);
}

export function getClimateTwins(city: City, count = 5): ClimateTwin[] {
  return CITIES.filter(c => c.name !== city.name)
    .map(c => ({ city: c, similarity: climateSimilarity(city, c) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}

// ───────────────────────────────────────────────────────────────
// TIME-ZONE helpers
// ───────────────────────────────────────────────────────────────
export function getUserUtcOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}

export function formatUtcOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ':00'}`;
}

export interface OverlapResult {
  hours: boolean[]; // length 24, indexed by USER local hour
  bestWindow: string | null;
}

const fmtHour = (h: number) => {
  const hr = ((h % 24) + 24) % 24;
  const period = hr < 12 ? 'AM' : 'PM';
  const display = hr % 12 === 0 ? 12 : hr % 12;
  return `${display}${period}`;
};

/** For each USER-local hour, is it inside business hours (9–18) for both parties? */
export function getTimezoneOverlap(userOffset: number, cityOffset: number): OverlapResult {
  const diff = Math.round(cityOffset - userOffset);
  const hours: boolean[] = [];
  for (let userHour = 0; userHour < 24; userHour++) {
    const cityHour = ((userHour + diff) % 24 + 24) % 24;
    const userOk = userHour >= 9 && userHour < 18;
    const cityOk = cityHour >= 9 && cityHour < 18;
    hours.push(userOk && cityOk);
  }
  // longest contiguous run
  let bestStart = -1,
    bestLen = 0,
    curStart = -1,
    curLen = 0;
  for (let i = 0; i < 24; i++) {
    if (hours[i]) {
      if (curLen === 0) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else curLen = 0;
  }
  const bestWindow =
    bestLen > 0 ? `${fmtHour(bestStart)} – ${fmtHour(bestStart + bestLen)} your time` : null;
  return { hours, bestWindow };
}

/** UTC-offset colour band for the time-zone globe dots. */
export function offsetBandColor(offset: number): string {
  if (offset <= -3) return '#4FACFE'; // west — blue
  if (offset < 5) return '#22C55E'; // centre — green
  return '#F59E0B'; // east — amber
}

// ───────────────────────────────────────────────────────────────
// SOLAR position — day / night terminator
// ───────────────────────────────────────────────────────────────
/** Solar declination in degrees (the latitude where the sun is overhead). */
export function solarDeclination(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
}

/** Point on Earth where the sun is directly overhead right now. */
export function subsolarPoint(date: Date): { lat: number; lng: number } {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lng = -(utcHours - 12) * 15;
  return { lat: solarDeclination(date), lng: ((lng + 540) % 360) - 180 };
}

/** Sun elevation above the horizon (degrees) at a point; negative = night. */
export function solarElevation(lat: number, lng: number, date: Date): number {
  const sub = subsolarPoint(date);
  const phi = toRad(lat);
  const dec = toRad(sub.lat);
  const hourAngle = toRad(lng - sub.lng);
  const cosZ = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle);
  return toDeg(Math.asin(clamp(cosZ, -1, 1)));
}

export function isDaylight(lat: number, lng: number, date: Date): boolean {
  return solarElevation(lat, lng, date) > 0;
}

// ───────────────────────────────────────────────────────────────
// COMPARE COUNTRIES — curated facts (2023/24, approximate)
// ───────────────────────────────────────────────────────────────
export const COUNTRY_FACTS: CountryFact[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', lat: 39.8, lng: -98.6, population: 335_000_000, areaKm2: 9_833_517, gdpUsd: 27.4e12, capital: 'Washington, D.C.', language: 'English', internetPct: 92 },
  { code: 'CN', name: 'China', flag: '🇨🇳', lat: 35.9, lng: 104.2, population: 1_410_000_000, areaKm2: 9_596_961, gdpUsd: 17.8e12, capital: 'Beijing', language: 'Mandarin', internetPct: 76 },
  { code: 'IN', name: 'India', flag: '🇮🇳', lat: 22.4, lng: 78.7, population: 1_430_000_000, areaKm2: 3_287_263, gdpUsd: 3.7e12, capital: 'New Delhi', language: 'Hindi, English', internetPct: 52 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', lat: 36.2, lng: 138.3, population: 124_000_000, areaKm2: 377_975, gdpUsd: 4.2e12, capital: 'Tokyo', language: 'Japanese', internetPct: 83 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', lat: 51.2, lng: 10.4, population: 84_000_000, areaKm2: 357_588, gdpUsd: 4.5e12, capital: 'Berlin', language: 'German', internetPct: 93 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lat: 54.0, lng: -2.5, population: 68_000_000, areaKm2: 243_610, gdpUsd: 3.3e12, capital: 'London', language: 'English', internetPct: 96 },
  { code: 'FR', name: 'France', flag: '🇫🇷', lat: 46.6, lng: 2.4, population: 68_000_000, areaKm2: 551_695, gdpUsd: 3.0e12, capital: 'Paris', language: 'French', internetPct: 86 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', lat: 41.9, lng: 12.6, population: 59_000_000, areaKm2: 301_340, gdpUsd: 2.3e12, capital: 'Rome', language: 'Italian', internetPct: 85 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', lat: 40.0, lng: -3.7, population: 48_000_000, areaKm2: 505_990, gdpUsd: 1.6e12, capital: 'Madrid', language: 'Spanish', internetPct: 94 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', lat: -14.2, lng: -51.9, population: 216_000_000, areaKm2: 8_515_767, gdpUsd: 2.2e12, capital: 'Brasília', language: 'Portuguese', internetPct: 84 },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', lat: 61.5, lng: 105.3, population: 144_000_000, areaKm2: 17_098_242, gdpUsd: 2.0e12, capital: 'Moscow', language: 'Russian', internetPct: 90 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lat: 56.1, lng: -106.3, population: 40_000_000, areaKm2: 9_984_670, gdpUsd: 2.1e12, capital: 'Ottawa', language: 'English, French', internetPct: 93 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', lat: -25.3, lng: 133.8, population: 26_000_000, areaKm2: 7_692_024, gdpUsd: 1.7e12, capital: 'Canberra', language: 'English', internetPct: 96 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', lat: 36.5, lng: 127.9, population: 52_000_000, areaKm2: 100_210, gdpUsd: 1.7e12, capital: 'Seoul', language: 'Korean', internetPct: 98 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', lat: 23.6, lng: -102.6, population: 128_000_000, areaKm2: 1_964_375, gdpUsd: 1.8e12, capital: 'Mexico City', language: 'Spanish', internetPct: 76 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', lat: -2.5, lng: 118.0, population: 277_000_000, areaKm2: 1_904_569, gdpUsd: 1.4e12, capital: 'Jakarta', language: 'Indonesian', internetPct: 66 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', lat: 52.1, lng: 5.3, population: 18_000_000, areaKm2: 41_850, gdpUsd: 1.1e12, capital: 'Amsterdam', language: 'Dutch', internetPct: 97 },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', lat: 23.9, lng: 45.1, population: 37_000_000, areaKm2: 2_149_690, gdpUsd: 1.1e12, capital: 'Riyadh', language: 'Arabic', internetPct: 99 },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', lat: 39.0, lng: 35.2, population: 85_000_000, areaKm2: 783_562, gdpUsd: 1.1e12, capital: 'Ankara', language: 'Turkish', internetPct: 83 },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', lat: 46.8, lng: 8.2, population: 8_800_000, areaKm2: 41_285, gdpUsd: 0.9e12, capital: 'Bern', language: 'German, French', internetPct: 96 },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', lat: 51.9, lng: 19.1, population: 38_000_000, areaKm2: 312_696, gdpUsd: 0.81e12, capital: 'Warsaw', language: 'Polish', internetPct: 88 },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', lat: -38.4, lng: -63.6, population: 46_000_000, areaKm2: 2_780_400, gdpUsd: 0.64e12, capital: 'Buenos Aires', language: 'Spanish', internetPct: 88 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', lat: 60.1, lng: 18.6, population: 10_500_000, areaKm2: 450_295, gdpUsd: 0.59e12, capital: 'Stockholm', language: 'Swedish', internetPct: 95 },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', lat: 60.5, lng: 8.5, population: 5_500_000, areaKm2: 385_207, gdpUsd: 0.49e12, capital: 'Oslo', language: 'Norwegian', internetPct: 99 },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', lat: 53.4, lng: -8.2, population: 5_100_000, areaKm2: 70_273, gdpUsd: 0.55e12, capital: 'Dublin', language: 'English, Irish', internetPct: 95 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', lat: 1.35, lng: 103.8, population: 5_900_000, areaKm2: 728, gdpUsd: 0.5e12, capital: 'Singapore', language: 'English', internetPct: 96 },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', lat: 23.4, lng: 53.8, population: 9_400_000, areaKm2: 83_600, gdpUsd: 0.5e12, capital: 'Abu Dhabi', language: 'Arabic', internetPct: 100 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', lat: 15.9, lng: 100.9, population: 72_000_000, areaKm2: 513_120, gdpUsd: 0.51e12, capital: 'Bangkok', language: 'Thai', internetPct: 88 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', lat: 12.9, lng: 121.8, population: 117_000_000, areaKm2: 300_000, gdpUsd: 0.44e12, capital: 'Manila', language: 'Filipino, English', internetPct: 73 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', lat: 14.1, lng: 108.3, population: 98_000_000, areaKm2: 331_212, gdpUsd: 0.43e12, capital: 'Hanoi', language: 'Vietnamese', internetPct: 79 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', lat: -30.6, lng: 22.9, population: 60_000_000, areaKm2: 1_221_037, gdpUsd: 0.38e12, capital: 'Pretoria', language: 'Multiple', internetPct: 72 },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', lat: 26.8, lng: 30.8, population: 112_000_000, areaKm2: 1_001_450, gdpUsd: 0.4e12, capital: 'Cairo', language: 'Arabic', internetPct: 72 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', lat: 9.1, lng: 8.7, population: 223_000_000, areaKm2: 923_768, gdpUsd: 0.36e12, capital: 'Abuja', language: 'English', internetPct: 55 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', lat: -0.0, lng: 37.9, population: 55_000_000, areaKm2: 580_367, gdpUsd: 0.11e12, capital: 'Nairobi', language: 'Swahili, English', internetPct: 42 },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', lat: 30.4, lng: 69.3, population: 240_000_000, areaKm2: 881_913, gdpUsd: 0.34e12, capital: 'Islamabad', language: 'Urdu', internetPct: 36 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', lat: 39.4, lng: -8.2, population: 10_300_000, areaKm2: 92_090, gdpUsd: 0.29e12, capital: 'Lisbon', language: 'Portuguese', internetPct: 85 },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', lat: 39.1, lng: 21.8, population: 10_400_000, areaKm2: 131_957, gdpUsd: 0.24e12, capital: 'Athens', language: 'Greek', internetPct: 84 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', lat: -40.9, lng: 174.9, population: 5_200_000, areaKm2: 268_021, gdpUsd: 0.25e12, capital: 'Wellington', language: 'English, Māori', internetPct: 96 },
];

export const COUNTRY_FACT_LIST = [...COUNTRY_FACTS].sort((a, b) => a.name.localeCompare(b.name));

export function getCountryFact(code: string): CountryFact | undefined {
  return COUNTRY_FACTS.find(c => c.code === code);
}

// ───────────────────────────────────────────────────────────────
// FLIGHT ROUTE — great-circle distance, duration, aircraft
// ───────────────────────────────────────────────────────────────
export interface FlightInfo {
  distanceKm: number;
  duration: string;
  aircraft: string;
}

export function getFlightInfo(from: City, to: City): FlightInfo {
  const distanceKm = haversine(from.lat, from.lng, to.lat, to.lng);
  const hours = distanceKm / 850 + 0.5; // cruise + taxi/climb
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  let aircraft: string;
  if (distanceKm < 1500) aircraft = 'A320 / B737';
  else if (distanceKm < 4500) aircraft = 'A321neo / B737 MAX';
  else if (distanceKm < 9000) aircraft = 'A330 / B787';
  else aircraft = 'B777 / A350';
  return { distanceKm, duration: `${h}h ${m}m`, aircraft };
}

// ───────────────────────────────────────────────────────────────
// NATURAL WONDERS
// ───────────────────────────────────────────────────────────────
export const NATURAL_WONDERS: Wonder[] = [
  { id: 'everest', name: 'Mount Everest', emoji: '🏔', country: 'Nepal / China', lat: 27.99, lng: 86.92, blurb: "Earth's highest peak above sea level, towering over the Himalayas.", stat: '8,849 m', statLabel: 'summit altitude', gradient: 'linear-gradient(145deg, #1a3a5c 0%, #6eb5e8 45%, #e8f4fc 100%)' },
  { id: 'amazon', name: 'Amazon Rainforest', emoji: '🌳', country: 'Brazil', lat: -3.46, lng: -62.21, blurb: "The planet's largest rainforest — home to 10% of known species.", stat: '5.5M km²', statLabel: 'forest area', gradient: 'linear-gradient(145deg, #0d2818 0%, #2d6a4f 50%, #52b788 100%)' },
  { id: 'grandcanyon', name: 'Grand Canyon', emoji: '🏜', country: 'USA', lat: 36.1, lng: -112.11, blurb: 'A mile-deep gorge carved by the Colorado River over millions of years.', stat: '446 km', statLabel: 'length', gradient: 'linear-gradient(145deg, #5c3d2e 0%, #c17817 50%, #e8a838 100%)' },
  { id: 'reef', name: 'Great Barrier Reef', emoji: '🐠', country: 'Australia', lat: -18.29, lng: 147.7, blurb: "The world's largest coral reef system, visible from space.", stat: '2,300 km', statLabel: 'length', gradient: 'linear-gradient(145deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)' },
  { id: 'sahara', name: 'Sahara Desert', emoji: '🐪', country: 'North Africa', lat: 23.42, lng: 25.66, blurb: 'The largest hot desert on Earth — roughly the size of the USA.', stat: '9.2M km²', statLabel: 'area', gradient: 'linear-gradient(145deg, #8b6914 0%, #d4a853 50%, #f5e6c8 100%)' },
  { id: 'victoria', name: 'Victoria Falls', emoji: '💦', country: 'Zambia / Zimbabwe', lat: -17.92, lng: 25.86, blurb: 'One of the largest waterfalls on Earth, known as "the smoke that thunders".', stat: '108 m', statLabel: 'drop height', gradient: 'linear-gradient(145deg, #0e7490 0%, #22d3ee 50%, #a5f3fc 100%)' },
  { id: 'aurora', name: 'Northern Lights', emoji: '🌌', country: 'Arctic Circle', lat: 69.65, lng: 18.96, blurb: 'Auroras painted across polar skies by solar particles hitting the atmosphere.', stat: '100–300 km', statLabel: 'altitude', gradient: 'linear-gradient(145deg, #1e1b4b 0%, #6d28d9 40%, #34d399 100%)' },
  { id: 'uluru', name: 'Uluru', emoji: '🪨', country: 'Australia', lat: -25.34, lng: 131.04, blurb: 'A vast sandstone monolith sacred to the Aṉangu people, glowing red at dusk.', stat: '348 m', statLabel: 'height', gradient: 'linear-gradient(145deg, #7c2d12 0%, #ea580c 50%, #fdba74 100%)' },
];

// ───────────────────────────────────────────────────────────────
// LIVE WEATHER — Open-Meteo (keyless, CORS)
// ───────────────────────────────────────────────────────────────
export function weatherCodeInfo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear', emoji: '☀️' };
  if (code >= 1 && code <= 3) return { label: 'Partly cloudy', emoji: '⛅' };
  if (code === 45 || code === 48) return { label: 'Fog', emoji: '🌫' };
  if (code >= 51 && code <= 67) return { label: 'Rain', emoji: '🌧' };
  if (code >= 71 && code <= 77) return { label: 'Snow', emoji: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Showers', emoji: '🌦' };
  if (code >= 95 && code <= 99) return { label: 'Storm', emoji: '⛈' };
  return { label: 'Unknown', emoji: '🌡' };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
        weather_code?: number;
      };
    };
    const c = d.current;
    if (!c || typeof c.temperature_2m !== 'number') return null;
    const code = c.weather_code ?? 0;
    const info = weatherCodeInfo(code);
    return {
      tempC: c.temperature_2m,
      windKmh: c.wind_speed_10m ?? 0,
      humidity: c.relative_humidity_2m ?? 0,
      code,
      label: info.label,
      emoji: info.emoji,
    };
  } catch {
    return null;
  }
}

/** Rough UTC offset from longitude when no nearby city is available. */
export function estimateUtcOffset(lng: number): number {
  return Math.round(lng / 15);
}

// ───────────────────────────────────────────────────────────────
// COUNTRY TIMELINE — World Bank (keyless, CORS)
// ───────────────────────────────────────────────────────────────
export const TIMELINE_INDICATORS = {
  population: { id: 'SP.POP.TOTL', label: 'Population' },
  gdp: { id: 'NY.GDP.MKTP.CD', label: 'GDP' },
  internet: { id: 'IT.NET.USER.ZS', label: 'Internet' },
} as const;

export type TimelineIndicator = keyof typeof TIMELINE_INDICATORS;

export async function fetchCountryTimeline(
  iso2: string,
  indicator: string,
): Promise<TimelinePoint[]> {
  try {
    const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${indicator}?format=json&per_page=100&date=1990:2023`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as [
      unknown,
      { date?: string; value?: number | null }[] | undefined,
    ];
    const rows = data[1];
    if (!Array.isArray(rows)) return [];
    return rows
      .filter(r => r.value != null && r.date)
      .map(r => ({ year: +r.date!, value: r.value! }))
      .sort((a, b) => a.year - b.year);
  } catch {
    return [];
  }
}

// ───────────────────────────────────────────────────────────────
// POPULATION DENSITY — choropleth helpers
// ───────────────────────────────────────────────────────────────
export function countryDensity(fact: CountryFact): number {
  return fact.population / fact.areaKm2;
}

export function densityColor(d: number): string {
  if (d < 50) return '#22c55e';
  if (d < 150) return '#84cc16';
  if (d < 400) return '#f59e0b';
  if (d < 1000) return '#f97316';
  return '#ef4444';
}

export const DENSITY_BINS: { max: number; color: string; label: string }[] = [
  { max: 50, color: '#22c55e', label: '< 50 / km²' },
  { max: 150, color: '#84cc16', label: '50–150 / km²' },
  { max: 400, color: '#f59e0b', label: '150–400 / km²' },
  { max: 1000, color: '#f97316', label: '400–1K / km²' },
  { max: Infinity, color: '#ef4444', label: '> 1K / km²' },
];

// ───────────────────────────────────────────────────────────────
// LIVE ISS — wheretheiss.at (free, no key, HTTPS, CORS)
// ───────────────────────────────────────────────────────────────
export async function fetchISS(): Promise<ISSPosition | null> {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return null;
    const d: unknown = await res.json();
    const o = d as { latitude?: number; longitude?: number; altitude?: number; velocity?: number };
    if (typeof o.latitude !== 'number' || typeof o.longitude !== 'number') return null;
    return {
      lat: o.latitude,
      lng: o.longitude,
      altitudeKm: o.altitude ?? 420,
      velocityKmh: o.velocity ?? 27600,
    };
  } catch {
    return null;
  }
}
