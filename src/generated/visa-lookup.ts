import type { VisaCategory } from '../types';
import visaData from './visa-matrix.json';

export type VisaMatrixCode = 'f' | 'e' | 'r';

export interface VisaMatrixMeta {
  source: string;
  license: string;
  updated: string;
}

interface VisaMatrixFile {
  _meta: VisaMatrixMeta;
  matrix: Record<string, Record<string, VisaMatrixCode>>;
}

const file = visaData as VisaMatrixFile;
const { matrix } = file;

export const VISA_DATA_META = file._meta;

const CODE_TO_CATEGORY: Record<VisaMatrixCode, VisaCategory> = {
  f: 'visa-free',
  e: 'e-visa',
  r: 'visa-required',
};

/** Map a passport-index.org status string to our VisaCategory. */
export function passportStatusToCategory(status: string, from: string, to: string): VisaCategory {
  if (from.toUpperCase() === to.toUpperCase()) return 'home';
  return CODE_TO_CATEGORY[toCode(status)] ?? 'visa-required';
}

function toCode(status: string): VisaMatrixCode {
  switch (status) {
    case 'visa free':
    case 'visa on arrival':
      return 'f';
    case 'eta':
    case 'e-visa':
      return 'e';
    default:
      return 'r';
  }
}

/** Visa category for a passport→destination pair (defaults to visa-required). */
export function getVisaCategory(from: string, to: string): VisaCategory {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 'home';
  const code = matrix[f]?.[t];
  return code ? CODE_TO_CATEGORY[code] : 'visa-required';
}

/** Full destination map for one passport (from Passport Index matrix). */
export function buildVisaMap(passportCode: string): Map<string, VisaCategory> {
  const from = passportCode.toUpperCase();
  const row = matrix[from];
  const map = new Map<string, VisaCategory>();
  map.set(from, 'home');
  if (!row) return map;
  for (const [dest, code] of Object.entries(row)) {
    map.set(dest, CODE_TO_CATEGORY[code]);
  }
  return map;
}

export const VISA_MATRIX_PASSPORTS: readonly string[] = Object.keys(matrix).sort();

export function hasVisaMatrixPassport(code: string): boolean {
  return matrix[code.toUpperCase()] !== undefined;
}
