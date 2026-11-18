import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceContent, mergeGenerated } from '../src/i18n/auto-translate.mjs';
test('uses only populated fields from the selected source locale', () => {
  assert.deepEqual(
    sourceContent(
      { fa: { name: 'دوربین', description: ' ', tags: [] }, en: { name: 'Camera' } },
      'fa',
      ['name', 'description', 'tags'],
    ),
    { name: 'دوربین' },
  );
});
test('fills blanks but preserves manual and concurrently edited translations', () => {
  const original = {
    fa: { name: 'دوربین' },
    en: { name: 'Camera', description: null },
    tr: { name: 'Manual edit' },
  };
  const result = mergeGenerated(original, {
    en: { name: 'Do not replace', description: 'Description' },
    tr: { name: 'Do not replace' },
    ar: { name: 'كاميرا' },
  });
  assert.equal(result.translations.en.name, 'Camera');
  assert.equal(result.translations.tr.name, 'Manual edit');
  assert.equal(result.translations.en.description, 'Description');
  assert.equal(result.count, 2);
  assert.equal(original.en.description, null);
});
