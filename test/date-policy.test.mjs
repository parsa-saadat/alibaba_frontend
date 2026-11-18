import test from 'node:test';
import assert from 'node:assert/strict';
import { datePolicy, dateFormatter } from '../src/i18n/date-policy.js';
for (const lang of ['en', 'fa', 'ar', 'tr'])
  test(`${lang}: explicit regional calendar policy`, () => {
    const formatter = dateFormatter(lang, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    });
    assert.equal(formatter.resolvedOptions().calendar, lang === 'fa' ? 'persian' : 'gregory');
    const formatted = formatter.format(new Date('2026-11-18T12:00:00Z'));
    assert.ok(formatted);
    const year = formatter
      .formatToParts(new Date('2026-11-18T12:00:00Z'))
      .find((p) => p.type === 'year')
      .value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    assert.equal(year, lang === 'fa' ? '1405' : '2026');
    assert.equal(
      datePolicy(lang).locale,
      { fa: 'fa-IR', en: 'en-GB', ar: 'ar-AE', tr: 'tr-TR' }[lang],
    );
  });
