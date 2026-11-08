import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const BLUE = 'rgb(23, 93, 160)';
const RED = 'rgb(187, 48, 55)';
const BLACK = 'rgb(32, 39, 46)';

async function color(page: Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((el) => getComputedStyle(el).color);
}

test.describe('pairing view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#pairing');
  });

  test('renders the primary card, three sub-cards and collapsible details', async ({ page }) => {
    await expect(page.locator('.pair-hero')).toBeVisible();
    await expect(page.locator('.pair-result-card')).toHaveCount(3);
    const details = page.locator('details.pair-method');
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
  });

  test('default case is positive: blue text with a label; sub-cards pending in black', async ({ page }) => {
    await expect(page.locator('.pair-hero-title')).toHaveText('出力に余裕あり');
    expect(await color(page, '.pair-hero-title')).toBe(BLUE);
    await expect(page.locator('[data-card="output"] .pair-result-value')).toHaveText('+5.8 dB');
    for (const card of ['load', 'band']) {
      await expect(page.locator(`[data-card="${card}"] .pair-result-value`)).toHaveText('判定保留');
      expect(await color(page, `[data-card="${card}"] .pair-result-value`)).toBe(BLACK);
    }
  });

  test('unknown 4 Ω output is pending (black), not red', async ({ page }) => {
    await page.selectOption('#pairAmp', 'e');
    await page.selectOption('#pairSpeaker', 's3');
    await expect(page.locator('.pair-hero-title')).toHaveText('判定保留');
    expect(await color(page, '.pair-hero-title')).toBe(BLACK);
  });

  test('insufficient output is negative (red) and input edits update the result', async ({ page }) => {
    await page.selectOption('#pairAmp', 'e');
    await page.selectOption('#pairSpeaker', 's1');
    await page.fill('#pairDistance', '8');
    await page.fill('#pairPeak', '115');
    await page.selectOption('#pairGain', '0');
    await page.selectOption('#pairMargin', '6');
    await expect(page.locator('.pair-hero-title')).toHaveText('出力不足のおそれ');
    expect(await color(page, '.pair-hero-title')).toBe(RED);
    await page.fill('#pairDistance', '0.4');
    await expect(page.locator('#pairResult')).toContainText('入力値を確認');
  });
});
