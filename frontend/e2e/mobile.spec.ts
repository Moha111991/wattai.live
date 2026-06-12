import { test, expect, devices } from '@playwright/test';
import { navigateToApp } from './helpers';

/**
 * Mobile Optimization Tests
 * 
 * Testet mobile-spezifische Optimierungen und Performance
 */

// test.use() muss auf oberster Ebene sein, nicht in describe()
const mobileTest = test.extend({});
mobileTest.use({ ...devices['Pixel 5'] });

test.describe('Mobile Optimization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
  });

  mobileTest('sollte auf Mobile responsive sein', async ({ page }) => {
    // Logo-Leiste sollte vorhanden und sichtbar sein
    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible();

    const logo = logoBar.locator('svg').first();
    const box = await logo.boundingBox();

    // Logo sollte für Mobile-Geräte angemessen sein (nicht größer als Desktop)
    expect(box!.width).toBeGreaterThan(30); // Mindestens 30px
    expect(box!.width).toBeLessThanOrEqual(150); // Maximal 150px auf Mobile
  });

  mobileTest('Tabs sollten auf Mobile klickbar sein', async ({ page }) => {
    const tabs = ['Dashboard', 'Geräte', 'Elektroauto', 'Smart Home', 'KI-Empfehlung'];
    
    for (const tabName of tabs) {
      const tabButton = page.getByRole('button', { name: tabName });
      await expect(tabButton).toBeVisible();
      
  // Prüfe ob Tab groß genug für Touch (UI nutzt kompaktere Pill-Buttons)
      const box = await tabButton.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(34);
    }
  });

  mobileTest('sollte keine horizontale Scrollbar haben', async ({ page }) => {
    // Prüfe Body width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  mobileTest('Header sollte auf Mobile sichtbar sein', async ({ page }) => {
    const headerSvg = page.locator('svg').first();
    await expect(headerSvg).toBeVisible();
    
    // Header sollte nicht über Viewport hinausgehen
    const box = await headerSvg.boundingBox();
    const viewportWidth = page.viewportSize()!.width;
    
    expect(box!.width).toBeLessThanOrEqual(viewportWidth);
  });

  mobileTest('DevicesDashboard sollte auf Mobile funktionieren', async ({ page }) => {
    await page.getByRole('button', { name: 'Geräte' }).click();
    await page.waitForTimeout(500);
    
  // Warte auf Content - Titel wurde auf "Geräte & Adapter" geändert
  await expect(page.getByText(/Geräte\s*&\s*Adapter|Verbundene Geräte/i)).toBeVisible({ timeout: 10000 });

    // Zusätzlich robust prüfen, dass Device-Management-Inhalt sichtbar ist
    await expect(page.getByText(/Protokoll|Jetzt verbinden|Nicht verbunden|Verbunden/i).first()).toBeVisible();
  });

  mobileTest('sollte Touch-Events unterstützen', async ({ page }) => {
    const dashboardTab = page.getByRole('button', { name: 'Dashboard' });
    
    // Tap statt Click auf Mobile
    await dashboardTab.tap();
    
    await expect(page.locator('svg').first()).toBeVisible();
  });
});

test.describe('Cross-Browser Tests', () => {
  const browsers = [
    { name: 'chromium', device: 'Desktop Chrome' },
    { name: 'firefox', device: 'Desktop Firefox' },
    { name: 'webkit', device: 'Desktop Safari' },
  ];

  for (const browser of browsers) {
    test(`sollte auf ${browser.device} funktionieren`, async ({ page, browserName }) => {
      test.skip(browserName !== browser.name, `Nur für ${browser.name}`);

      await navigateToApp(page);
      
      // Tabs vorhanden
      await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
      
      // Header vorhanden
      await expect(page.locator('svg').first()).toBeVisible();
    });
  }
});
