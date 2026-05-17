import { test, expect } from '@playwright/test';

test.describe('WattAI.live - Kompletter User Flow', () => {
  test('Sollte durch alle Tabs navigieren und Funktionen testen', async ({ page }) => {
    // Gehe zur Seite und warte bis vollständig geladen
    await page.goto('https://www.wattai.live/', { waitUntil: 'networkidle' });
    
    // Warte auf Dashboard-Tab als stabiler App-Ready-Indikator
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    
    // Warte kurz für Animationen
    await page.waitForTimeout(1000);
    
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
