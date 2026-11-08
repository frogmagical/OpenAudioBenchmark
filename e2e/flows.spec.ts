import { expect, test } from '@playwright/test';

test.describe('main user flows', () => {
  test('filter, select two products, compare, export CSV and JSON', async ({ page }) => {
    await page.goto('/#benchmark');
    await expect(page.locator('#records .record')).toHaveCount(6);
    await page.fill('#budget', '40000');
    await expect(page.locator('#records .record')).toHaveCount(3);

    await page.click('[data-select="b"]');
    await page.click('[data-select="c"]');
    await page.click('.menu-button[data-go="compare"]');
    await expect(page.locator('#compare')).toBeVisible();
    await expect(page.locator('#comparison .cell.head')).toHaveText(['比較指標', 'Studio Amp B', 'Living Amp C']);

    await page.click('.menu-button[data-go="benchmark"]');
    const csvDownload = page.waitForEvent('download');
    await page.click('#csv');
    const csv = await (await csvDownload).createReadStream();
    const csvText = await new Promise<string>((resolve) => {
      let data = '';
      csv.on('data', (c) => (data += c));
      csv.on('end', () => resolve(data));
    });
    expect(csvText.split('\r\n')).toHaveLength(4);
    expect(csvText).toContain('"製品"');

    const jsonDownload = page.waitForEvent('download');
    await page.click('#json');
    const jsonPath = await (await jsonDownload).path();
    const { readFile } = await import('node:fs/promises');
    const json = JSON.parse(await readFile(jsonPath!, 'utf-8')) as { notice: string; products: unknown[] };
    expect(json.notice).toBe('FICTIONAL DEMO DATA ONLY');
    expect(json.products).toHaveLength(3);
  });

  test('menu is keyboard operable and sets aria-current', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-button[data-go="benchmark"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#benchmark')).toBeVisible();
    await expect(page.locator('.menu-button[data-go="benchmark"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#currentView')).toHaveText('製品カタログ');
  });
});
