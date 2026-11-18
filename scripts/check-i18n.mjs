import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../src/i18n/locales/', import.meta.url);
const catalogs = Object.fromEntries(
  ['en', 'fa', 'ar', 'tr'].map((l) => [
    l,
    JSON.parse(fs.readFileSync(new URL(l + '.json', root), 'utf8')),
  ]),
);
const keys = Object.keys(catalogs.fa).sort();
for (const [lang, catalog] of Object.entries(catalogs)) {
  assert.deepEqual(Object.keys(catalog).sort(), keys, `Missing keys in ${lang}`);
  for (const key of keys) {
    assert.equal(typeof catalog[key], 'string');
    assert.ok(catalog[key].trim() || !key.trim());
    const tokens = (s) => [...s.matchAll(/\{\{\s*(v\d+)\s*\}\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(tokens(catalog[key]), tokens(key), `Placeholder mismatch ${lang}: ${key}`);
  }
}
console.log(`PASS: ${keys.length} keys in each of 4 languages; interpolation placeholders match.`);
