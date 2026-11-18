import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const user = {
  _id: '507f1f77bcf86cd799439011',
  role: 'admin',
  firstname: 'Tester',
  is_seller: true,
};
let scenarios = 0;
try {
  for (const locale of ['en', 'fa', 'ar', 'tr']) {
    for (const width of [390, 1365]) {
      const context = await browser.newContext({ viewport: { width, height: 850 } });
      await context.addInitScript(
        ({ locale, user }) => {
          localStorage.setItem('app.language', locale);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', 'test');
        },
        { locale, user },
      );
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const url = new URL(route.request().url());
        let body = { data: [], total: 0, totalPages: 0 };
        if (url.pathname.endsWith('/auth/session')) body = { user, token: 'test' };
        if (url.pathname.endsWith('/user/' + user._id)) body = user;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ body, success: true, status: 200 }),
        });
      });
      for (const path of ['/auth/pre', '/dashboard/pre']) {
        await page.goto('http://127.0.0.1:5173' + path);
        const preferences = page.locator('.regional-placement--card');
        await preferences.waitFor();
        assert.equal(await page.locator('.locale-selector').count(), 1);
        assert.equal(
          await preferences.evaluate(
            (element) => !!element.closest('.card')?.querySelector('input[type="tel"]'),
          ),
          true,
        );
        await preferences.locator('button').click();
        await page.locator('.regional-dialog[open]').waitFor();
        await page.keyboard.press('Escape');
        scenarios++;
      }
      for (const path of [
        '/dashboard/categories',
        '/dashboard/plans',
        '/dashboard/products/create',
      ]) {
        await page.goto('http://127.0.0.1:5173' + path);
        const editor = page.getByTestId('content-language');
        await editor.waitFor();
        for (const [code, name, hint] of [
          ['en', 'English', 'English'],
          ['fa', 'فارسی', 'فارسی'],
          ['ar', 'العربية', 'بالعربية'],
          ['tr', 'Türkçe', 'Türkçe'],
        ]) {
          await editor.getByRole('button', { name, exact: true }).click();
          assert.ok(
            (
              await page.getByLabel(code + ' name', { exact: true }).getAttribute('placeholder')
            ).includes(hint),
          );
          if (path.endsWith('/create')) {
            const placeholder = await page
              .locator('.md-visual [data-placeholder]')
              .first()
              .getAttribute('data-placeholder');
            assert.ok(placeholder.includes(hint), placeholder);
          }
        }
        scenarios++;
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log(
    `PASS ${scenarios} auth-card/content-placeholder scenarios across four locales and two viewports.`,
  );
} finally {
  await browser.close();
}
