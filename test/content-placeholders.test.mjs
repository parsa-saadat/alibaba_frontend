import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPlaceholder } from '../src/i18n/content-placeholders.mjs';

test('content placeholders follow the edited locale for every entity', () => {
  for (const entity of ['product', 'category', 'store', 'plan']) {
    assert.match(contentPlaceholder('en', entity, 'name'), /English/);
    assert.match(contentPlaceholder('fa', entity, 'name'), /فارسی/);
    assert.match(contentPlaceholder('ar', entity, 'description'), /بالعربية/);
    assert.match(contentPlaceholder('tr', entity, 'description'), /Türkçe/);
  }
});
