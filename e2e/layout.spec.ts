import { expect, test } from '@playwright/test';

const VIEWS = ['overview', 'benchmark', 'compare', 'pairing', 'methodology', 'principles'] as const;

test.describe('layout at the project viewport', () => {
  for (const view of VIEWS) {
    test(`no horizontal overflow on #${view}`, async ({ page }, info) => {
      await page.goto(`/#${view}`);
      await expect(page.locator(`#${view}`)).toBeVisible();
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`).toBeLessThanOrEqual(clientWidth);
      await page.screenshot({ path: info.outputPath(`${view}.png`), fullPage: true });
      await info.attach(`${view}-${info.project.name}`, { path: info.outputPath(`${view}.png`), contentType: 'image/png' });
    });
  }

  test('navigation shape matches the viewport', async ({ page }, info) => {
    await page.goto('/');
    const sidebar = page.locator('.app-sidebar');
    const box = (await sidebar.boundingBox())!;
    const width = info.project.use.viewport!.width;
    if (width > 760) {
      // Fixed left sidebar, 238 px (210 px below 1150 px), workspace header visible.
      expect(box.x).toBe(0);
      expect(box.width).toBe(width > 1150 ? 238 : 210);
      await expect(page.locator('.app-header')).toBeVisible();
    } else {
      // Compact top navigation spanning the full width; header hidden.
      expect(box.width).toBe(width);
      await expect(page.locator('.app-header')).toBeHidden();
      await expect(page.locator('.menu-button').first()).toBeVisible();
    }
  });
});
