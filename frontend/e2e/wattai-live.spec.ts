import { test, expect } from '@playwright/test';
import { navigateToApp } from './helpers';

test.describe('WattAI.live - Kompletter User Flow', () => {
  test('Sollte durch alle Tabs navigieren und Funktionen testen', async ({ page }) => {
    // Navigate past landing page into the app
    await navigateToApp(page);

    // Navigation Tests - mit stabileren Selektoren
    await page.getByRole('button', { name: 'Elektroauto' }).click({ timeout: 10000 });
    await page.waitForTimeout(500); // Warte für Tab-Wechsel Animation

    await page.getByRole('button', { name: 'Geräte' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Dashboard' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Smart Home' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'KI-Empfehlung' }).click();
    await page.waitForTimeout(500);
  });
});
