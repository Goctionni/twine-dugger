import { expect, test } from '@playwright/test';

import { installMockGameRuntime } from './helpers/install-mock-game-runtime';

test('should render mocked game metadata and state after tracking starts', async ({ page }) => {
  await installMockGameRuntime(page);
  await page.goto('/index.html');

  await expect(page.getByText('Game:')).toBeVisible();
  await expect(page.getByText('Mock SugarCube Story')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start tracking' })).toBeVisible();

  await page.getByRole('button', { name: 'Start tracking' }).click();

  await expect(page.getByText('player')).toBeVisible();
  await expect(page.getByText('inventory')).toBeVisible();
  await expect(page.getByText('flags')).toBeVisible();
});

test('should reflect boolean state edits in mocked runtime', async ({ page }) => {
  await installMockGameRuntime(page);
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Start tracking' }).click();

  await page.getByText('flags', { exact: true }).click();
  await page.getByText('tutorialSeen', { exact: true }).first().click();

  const checkbox = page.locator('input[type="checkbox"]').first();
  await expect(checkbox).toBeChecked();

  await page.locator('label', { hasText: 'False' }).first().click();

  await expect(checkbox).not.toBeChecked();

  const stateValue = await page.evaluate(() => {
    const runtimeWindow = window as unknown as {
      TwineDugger?: { getState: () => { state: { flags?: { tutorialSeen?: boolean } } } };
    };
    if (!runtimeWindow.TwineDugger) return null;
    return runtimeWindow.TwineDugger.getState().state.flags?.tutorialSeen;
  });
  expect(stateValue).toBe(false);
});
