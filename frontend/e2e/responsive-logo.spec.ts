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
      
      // Warte auf Logo
      const logoCard = page.locator('.logo-overlay-card');
      await expect(logoCard).toBeVisible({ timeout: 10000 });
      
      const logo = logoCard.locator('svg');
      await expect(logo).toBeVisible();
      
      // Prüfe Logo-Größe liegt im erwarteten Bereich
      const box = await logo.boundingBox();
      expect(box).toBeTruthy();
      
      // Logo sollte zwischen min und max Größe liegen
      expect(box!.width).toBeGreaterThanOrEqual(viewport.minSize);
      expect(box!.width).toBeLessThanOrEqual(viewport.maxSize);
    });
  }

  test('Logo sollte auf Mobile oben links positioniert sein', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const logoCard = page.locator('.logo-overlay-card');
    await expect(logoCard).toBeVisible({ timeout: 10000 });
    
    const box = await logoCard.boundingBox();
    expect(box).toBeTruthy();
    
    // Logo sollte nahe am oberen linken Rand sein
    expect(box!.x).toBeLessThan(30);
    expect(box!.y).toBeLessThan(30);
  });

  test('Logo sollte Glassmorphism-Effekt haben', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const logoCard = page.locator('.logo-overlay-card');
    await expect(logoCard).toBeVisible({ timeout: 10000 });
    
    // Prüfe CSS-Eigenschaften
    const backdropFilter = await logoCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter');
    });
    
    // Backdrop-Filter sollte blur enthalten
    expect(backdropFilter).toContain('blur');
  });
});
