// EarthLens — shared type definitions

export type Mode =
  | 'truesize'
  | 'dig'
  | 'blast'
  | 'daynight'
  | 'visa'
  | 'flight'
  | 'climatetwin'
  | 'compare'
  | 'wonders'
  | 'space'
  | 'timeline'
  | 'population';

/** Flight has two sub-modes: a reach circle, or a route between two cities. */
export type FlightMode = 'reach' | 'route';

/** Curated, accurate country facts for Compare mode. */
export interface CountryFact {
  code: string; // ISO alpha-2
  name: string;
  flag: string;
  lat: number;
  lng: number;
  population: number; // people
  areaKm2: number;
  gdpUsd: number; // nominal, USD
  capital: string;
  language: string;
  internetPct: number; // % population online
}

/** A natural wonder for the Wonders layer. */
export interface Wonder {
  id: string;
  name: string;
  emoji: string;
  country: string;
  lat: number;
  lng: number;
  blurb: string;
  stat: string; // headline figure, e.g. "8,849 m"
  statLabel: string;
  gradient: string; // CSS gradient for the postcard hero
}

export interface WeatherInfo {
  tempC: number;
  windKmh: number;
  humidity: number;
  code: number;
  label: string;
  emoji: string;
}

export interface TimelinePoint {
  year: number;
  value: number;
}

export interface ISSPosition {
  lat: number;
  lng: number;
  altitudeKm: number;
  velocityKmh: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ClimateProfile {
  avgTemp: number; // annual average °C
  annualRainfall: number; // mm / year
  climateZone: string; // Köppen code, e.g. 'Aw', 'Cfb', 'BWh'
}

export interface City extends ClimateProfile {
  name: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  lat: number;
  lng: number;
  population: number; // metro, approximate
  timezone: string; // IANA, e.g. 'Asia/Tokyo'
  utcOffset: number; // standard offset in hours, e.g. 5.5
}

export interface BlastType {
  id: string;
  label: string;
  emoji: string;
  radius: number; // km — reference (severe-blast) radius
  color: string;
  megatons: number; // TNT-equivalent yield
  crater: number; // crater diameter (km)
}

export interface BlastZone {
  id: string;
  label: string;
  radiusKm: number;
  color: string;
  desc: string;
}

export interface ScaleComparison {
  name: string;
  ratio: number; // clicked area ÷ reference area
}

// ── Visa-free mode ─────────────────────────────────────────────
export type VisaCategory = 'visa-free' | 'e-visa' | 'visa-required' | 'home';

/**
 * Passport metadata for the visa mode selector (per-country requirements
 * come from the Passport Index matrix in src/generated/visa-matrix.json).
 */
export interface PassportData {
  code: string; // ISO alpha-2
  name: string;
  flag: string;
}

export interface VisaSummary {
  visaFree: number;
  eVisa: number;
  visaRequired: number;
  total: number;
  score: number; // visa-free + e-visa
  tier: number; // 1 (strongest) … 4
}

// ── Climate twin mode ──────────────────────────────────────────
export interface ClimateTwin {
  city: City;
  similarity: number; // 0–100 %
}

// ── True Size mode (inspect a country, then drop it on another) ─
export interface CountryInfo {
  name: string;
  areaKm2: number;
  lat?: number; // centroid latitude — for the Mercator-inflation reveal
}

export interface ShrinkState {
  source: CountryInfo | null;
  target: CountryInfo | null;
}
