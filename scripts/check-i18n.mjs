import fs from 'node:fs';
import path from 'node:path';
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
// Interface copy uses sentence case, not blanket Title Case. Leading-space keys
// are sentence fragments; acronyms, product names and user content are not rewritten.
for (const locale of ['en','tr']) for (const key of keys) {
  if (/^\s/.test(key) || key === 'reviews.stars') continue; // Count suffix, not a standalone sentence.
  assert.ok(!/^[a-zçğıöşü]/.test(catalogs[locale][key].trimStart()), `Use sentence case in ${locale}: ${key}`);
}

// A dotted key that no locale defines renders as its raw key on screen (this is
// how chat.closedShort leaked into the admin moderation bar). Only strings that
// are actually passed to translateText() are checked — plain URLs and
// localStorage keys are not i18n keys.
const srcRoot = path.resolve('src');
const sourceFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx|js|tsx)$/.test(entry.name)) sourceFiles.push(full);
  }
})(srcRoot);

const dottedUsed = new Set();
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const m of text.matchAll(/translateText\(\s*(['"])([a-z][\w.]*(?:\.[\w]+)*)\1/g)) dottedUsed.add(m[2]);
  // translateText(cond ? 'a.b' : 'c.d')
  for (const m of text.matchAll(/translateText\([^)]*\?\s*(['"])([\w.]+)\1\s*:\s*(['"])([\w.]+)\3/g)) {
    dottedUsed.add(m[2]);
    dottedUsed.add(m[4]);
  }
}
const definedOnly = [...dottedUsed].filter((key) => key.includes('.') && !/\.$/.test(key));
const undefinedKeys = definedOnly.filter((key) => !(key in catalogs.en)).sort();
assert.deepEqual(
  undefinedKeys,
  [],
  `Dotted i18n keys passed to translateText but missing from the catalogs: ${undefinedKeys.join(', ')}`,
);
console.log(`PASS: ${keys.length} keys in each of 4 languages; placeholders match; ${definedOnly.length} dotted keys used in source are all defined.`);
