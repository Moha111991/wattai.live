import { test, expect } from '@playwright/test';

/**
 * Navigation Tests für WattAI.live
 * 
 * Testet die Hauptnavigation zwischen allen Tabs
 */

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('sollte alle 5 Tabs sichtbar haben', async ({ page }) => {
    // Prüfe ob alle Tabs vorhanden sind
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Geräte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elektroauto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Smart Home' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'KI-Empfehlung' })).toBeVisible();
  });

  test('sollte zum Geräte-Tab navigieren', async ({ page }) => {
    // Klicke auf Geräte Tab
    await page.getByRole('button', { name: 'Geräte' }).click();
    await page.waitForTimeout(500);
    
    // Prüfe ob Header SVG sichtbar ist
    await expect(page.locator('svg').first()).toBeVisible();
    
    // Prüfe ob DevicesDashboard geladen wurde - "Verbundene Geräte" ist der Titel
    await expect(page.locator('text=Verbundene Geräte')).toBeVisible({ timeout: 10000 });
  });

  test('sollte zum Elektroauto-Tab navigieren und V2H Animation zeigen', async ({ page }) => {
    // Klicke auf Elektroauto Tab
    await page.getByRole('button', { name: 'Elektroauto' }).click();
    await page.waitForTimeout(500);
    
    // Warte auf Header SVG
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 5000 });
    
    // Prüfe ob Tag/Nacht Labels vorhanden sind
    await expect(page.locator('text=TAG: Laden')).toBeVisible();
    await expect(page.locator('text=NACHT: Entladen')).toBeVisible();
  });

  test('sollte zwischen allen Tabs wechseln können', async ({ page }) => {
    const tabs = ['Dashboard', 'Geräte', 'Elektroauto', 'Smart Home', 'KI-Empfehlung'];
    
    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('svg').first()).toBeVisible();
      
      // Kurz warten für Animation
      await page.waitForTimeout(300);
    }
  });
});
