import { test, expect } from '@playwright/test';

/**
 * Responsive Logo Tests
 * 
 * Testet die responsive Logo-Größe auf verschiedenen Viewports
 */

test.describe('Responsive Logo Tests', () => {
  const viewports = [
    { name: 'Desktop (1920px)', width: 1920, height: 1080, minSize: 150, maxSize: 250 },
    { name: 'Laptop (1280px)', width: 1280, height: 720, minSize: 100, maxSize: 250 },
    { name: 'Tablet (768px)', width: 768, height: 1024, minSize: 80, maxSize: 220 },
    { name: 'Mobile (480px)', width: 480, height: 800, minSize: 60, maxSize: 150 },
    { name: 'Small Mobile (360px)', width: 360, height: 640, minSize: 50, maxSize: 130 },
  ];

  for (const viewport of viewports) {
    test(`Logo sollte responsive sein auf ${viewport.name}`, async ({ page }) => {
      // Setze Viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Gehe zur Seite
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Warte auf Logo via data-testid
      const logoBar = page.getByTestId('logo-bar');
      await expect(logoBar).toBeVisible({ timeout: 10000 });
      
      const logo = logoBar.locator('svg').first();
      await expect(logo).toBeVisible();
      
      // Prüfe Logo-Größe liegt im erwarteten Bereich
      const box = await logo.boundingBox();
      expect(box).toBeTruthy();
      
      // Logo sollte zwischen min und max Größe liegen
      expect(box!.width).toBeGreaterThanOrEqual(viewport.minSize);
      expect(box!.width).toBeLessThanOrEqual(viewport.maxSize);
    });
  }

  test('Logo-Leiste sollte sichtbar und oben positioniert sein', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible({ timeout: 10000 });
    
    const box = await logoBar.boundingBox();
    expect(box).toBeTruthy();
    
    // Logo-Leiste sollte am oberen Rand der Seite sein
    expect(box!.y).toBeLessThan(100);
  });

  test('Logo-Bereich sollte Glassmorphism-Effekt haben', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible({ timeout: 10000 });
    
    // Prüfe CSS-Eigenschaften
    const backdropFilter = await logoBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter');
    });
    
    // Backdrop-Filter sollte blur enthalten
    expect(backdropFilter).toContain('blur');
  });
});
