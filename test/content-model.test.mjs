import test from 'node:test';
import assert from 'node:assert/strict';
import { seedContent, contentPayload } from '../src/i18n/content-model.mjs';
const fields = ['name', 'description', 'tags'];
test('legacy-only content is seeded once; existing translations are not duplicated', () => {
  const old = { name: 'Camera', description: '## Info', tags: ['one'] };
  const seeded = seedContent(old, fields);
  assert.equal(seeded.translations.en.name, 'Camera');
  assert.equal(old.translations, undefined);
  const localized = seedContent({ ...old, translations: { fa: { name: 'دوربین' } } }, fields);
  assert.equal(localized.translations.en.name, undefined);
  assert.equal(localized.translations.fa.name, 'دوربین');
});
test('explicit clears are not resurrected from compatibility fields', () => {
  const form = seedContent(
    { name: 'Old', tags: ['old'], translations: { en: { name: null, tags: [] } } },
    fields,
  );
  assert.equal(form.translations.en.name, null);
  assert.deepEqual(form.translations.en.tags, []);
  assert.equal(contentPayload(form, fields).name, '');
  assert.deepEqual(contentPayload(form, fields).tags, []);
});
test('saving can use one filled language even when another tab is empty', () => {
  const form = {
    name: 'legacy',
    translations: {
      en: { name: null },
      fa: { name: 'دوربین', description: '## توضیح', tags: ['تست'] },
    },
  };
  const payload = contentPayload(form, fields);
  assert.equal(payload.name, 'دوربین');
  assert.equal(payload.description, '## توضیح');
  assert.deepEqual(payload.tags, ['تست']);
  assert.equal(payload.translations.en.name, null);
});
