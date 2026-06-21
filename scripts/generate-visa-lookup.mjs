/**
 * Reads data/passport-index.json (imorte/passport-index-data, MIT) and emits
 * src/generated/visa-matrix.json — compact ISO2×ISO2 category codes for the app.
 *
 * Category codes: f = visa-free, e = e-visa, r = visa-required
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcPath = join(root, 'data/passport-index.json');
const outDir = join(root, 'src/generated');
const outPath = join(outDir, 'visa-matrix.json');

/** @param {string} status */
function toCode(status) {
  switch (status) {
    case 'visa free':
    case 'visa on arrival':
      return 'f';
    case 'eta':
    case 'e-visa':
      return 'e';
    case 'visa required':
    case 'no admission':
      return 'r';
    default:
      return 'r';
  }
}

const raw = JSON.parse(readFileSync(srcPath, 'utf8'));
/** @type {Record<string, Record<string, string>>} */
const matrix = {};

for (const [from, destinations] of Object.entries(raw)) {
  const fromUp = from.toUpperCase();
  matrix[fromUp] = {};
  for (const [to, entry] of Object.entries(/** @type {Record<string, { status?: string }>} */ (destinations))) {
    const toUp = to.toUpperCase();
    if (fromUp === toUp) continue;
    matrix[fromUp][toUp] = toCode(entry.status ?? 'visa required');
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      _meta: {
        source: 'https://github.com/imorte/passport-index-data',
        license: 'MIT',
        updated: '2026-02-17',
      },
      matrix,
    },
    null,
    0,
  ),
);

const passports = Object.keys(matrix).length;
let pairs = 0;
for (const row of Object.values(matrix)) pairs += Object.keys(row).length;
console.log(`Generated ${outPath}: ${passports} passports, ${pairs} pairs`);
