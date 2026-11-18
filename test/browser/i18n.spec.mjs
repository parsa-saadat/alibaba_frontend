import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const results = [];
const user = {
  _id: '507f1f77bcf86cd799439011',
  role: 'admin',
  firstname: 'Tester',
  is_seller: true,
  seller_approved_status: true,
  seller_active_status: 'active',
};
async function mock(route) {
  const u = new URL(route.request().url());
  let body = { data: [], total: 0, totalPages: 0 };
  if (u.pathname.endsWith('/auth/session')) body = { user, token: 'test' };
  else if (u.pathname.endsWith('/user/' + user._id)) body = user;
  else if (u.pathname.endsWith('/fx/convert')) body = { amount: 100, currency: 'USD' };
  else if (u.pathname.endsWith('/i18n/translate')) {
    const data = route.request().postDataJSON();
    await new Promise((r) => setTimeout(r, 450));
    body = {
      translations: Object.fromEntries(
        data.targets.map((lang) => [
          lang,
          Object.fromEntries(
            Object.entries(data.contents).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map((v) => lang + ' ' + v) : lang + ' ' + value,
            ]),
          ),
        ]),
      ),
      machine_translated: true,
    };
  }
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ body, status: 200, success: true }),
  });
}
try {
  for (const lang of ['en', 'fa', 'ar', 'tr'])
    for (const width of [390, 1365])
      for (const [path, variant] of [
        ['/shop', 'main'],
        ['/dashboard/products/create', 'admin'],
        ['/seller/products/create', 'seller'],
      ]) {
        const context = await browser.newContext({ viewport: { width, height: 850 } });
        await context.addInitScript(
          ({ lang, user }) => {
            localStorage.setItem('app.language', lang);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', 'test');
          },
          { lang, user },
        );
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.route('**/api/**', mock);
        await page.goto('http://127.0.0.1:5173' + path);
        await page.waitForTimeout(300);
        if (variant === 'main' && width < 768) {
          await page
            .locator('.site-header button')
            .filter({ has: page.locator('svg.lucide-menu') })
            .click();
          assert.ok(await page.locator('.mobile-drawer .regional-trigger').isVisible());
        }
        if (variant === 'main' && width >= 768)
          assert.equal(await page.locator('.site-footer .regional-trigger').count(), 1);
        if (variant !== 'main')
          assert.equal(await page.locator('.flex-1.p-4 > .locale-selector').count(), 0);
        if (variant !== 'main' && width < 768) {
          await page
            .locator('button')
            .filter({ has: page.locator('svg.lucide-menu') })
            .first()
            .click();
          await page.locator('.mobile-drawer .regional-trigger').waitFor();
          assert.ok(await page.locator('.mobile-drawer .regional-trigger').isVisible());
          await page
            .locator('.mobile-drawer button')
            .filter({ has: page.locator('svg.lucide-x') })
            .first()
            .click();
        }
        const trigger = page.locator('.regional-trigger:visible').first();
        await trigger.click();
        const dialog = page.locator('.regional-dialog[open]');
        await dialog.waitFor();
        const box = await dialog.boundingBox();
        assert.ok(
          box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= 851,
        );
        await page.keyboard.press('Escape');
        if (variant !== 'main') {
          assert.equal(await page.getByTestId('content-language').count(), 1);
          assert.equal(
            await page
              .locator('.product-editor-heading')
              .evaluate((el) => getComputedStyle(el).position),
            'static',
          );
          const editor = page.getByTestId('content-language');
          await editor.getByRole('button', { name: 'English', exact: true }).click();
          await page.getByLabel('en name', { exact: true }).fill('Camera');
          await editor.getByRole('button', { name: 'فارسی', exact: true }).click();
          await page.getByLabel('fa name', { exact: true }).fill('نام دستی');
          await editor.getByRole('button', { name: 'English', exact: true }).click();
          await page.getByTestId('auto-translate').click();
          await page.getByTestId('auto-translate').waitFor({ state: 'visible' });
          await page.waitForFunction(
            () => !document.querySelector('[data-testid="auto-translate"]').disabled,
          );
          await editor.getByRole('button', { name: 'العربية', exact: true }).click();
          assert.equal(await page.getByLabel('ar name', { exact: true }).inputValue(), 'ar Camera');
          await editor.getByRole('button', { name: 'فارسی', exact: true }).click();
          assert.equal(await page.getByLabel('fa name', { exact: true }).inputValue(), 'نام دستی');
          if (
            process.env.TEST_ARTIFACT_DIR &&
            lang === 'fa' &&
            width === 1365 &&
            variant === 'admin'
          )
            await page.screenshot({
              path: process.env.TEST_ARTIFACT_DIR + '/auto-translate.png',
              fullPage: true,
            });
        }
        assert.deepEqual(errors, []);
        results.push({
          lang,
          width,
          path,
          placement: true,
          dialog: true,
          autoTranslation: variant !== 'main',
          errors,
        });
        await context.close();
      }
  // In-flight source edits must invalidate results, without replacing user text.
  const context = await browser.newContext();
  await context.addInitScript((user) => {
    localStorage.setItem('app.language', 'en');
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test');
  }, user);
  const page = await context.newPage();
  await page.route('**/api/**', mock);
  await page.goto('http://127.0.0.1:5173/dashboard/categories');
  await page.getByLabel('en name', { exact: true }).fill('Before');
  await page.getByTestId('auto-translate').click();
  await page.getByLabel('en name', { exact: true }).fill('After');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="auto-translate"]').disabled,
  );
  await page.getByRole('button', { name: 'فارسی', exact: true }).click();
  assert.equal(await page.getByLabel('fa name', { exact: true }).inputValue(), '');
  await context.close();
  if (process.env.TEST_ARTIFACT_DIR)
    fs.writeFileSync(
      process.env.TEST_ARTIFACT_DIR + '/browser.json',
      JSON.stringify(results, null, 2),
    );
  console.log(
    'PASS',
    results.length,
    'language/layout/viewport combinations: menu/footer placement, settings dialog, automatic field filling, existing translations preserved; stale source race test passed.',
  );
} finally {
  await browser.close();
}
