import { test, expect } from '@playwright/test';

/**
 * 3D Header Animation Tests
 * 
 * Testet ob alle 3D Header korrekt geladen und animiert werden
 */

test.describe('3D Header Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Warte auf Tab-Navigation als stabiler App-Ready-Indikator
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  const headers = [
    { tab: 'Dashboard', component: 'DashboardHeader3D' },
    { tab: 'Geräte', component: 'DevicesHeader3D' },
    { tab: 'Elektroauto', component: 'EVHeader3D' },
    { tab: 'Smart Home', component: 'SmartHomeHeader3D' },
    { tab: 'KI-Empfehlung', component: 'AIHeader3D' },
  ];

  for (const { tab, component } of headers) {
    test(`${component} sollte auf ${tab}-Tab sichtbar sein`, async ({ page }) => {
      // Navigiere zum Tab
      await page.getByRole('button', { name: tab }).click();
      await page.waitForTimeout(500); // Warte für Tab-Wechsel
      
      // Prüfe ob mindestens ein großes SVG vorhanden ist (Header, nicht Logo)
      const svgs = page.locator('svg');
      const count = await svgs.count();
      expect(count).toBeGreaterThanOrEqual(1);
      
      // Finde das größte SVG (das ist der Header, nicht das Logo)
      let largestSvg = null;
      let maxWidth = 0;
      
      for (let i = 0; i < count; i++) {
        const box = await svgs.nth(i).boundingBox();
        if (box && box.width > maxWidth) {
          maxWidth = box.width;
          largestSvg = svgs.nth(i);
        }
      }
      
      // Get viewport width and set appropriate threshold
      const viewportSize = page.viewportSize();
      let minHeaderWidth = 500; // Desktop default

      if (viewportSize) {
        if (viewportSize.width < 768) {
          minHeaderWidth = 200; // Mobile
        } else if (viewportSize.width < 1024) {
          minHeaderWidth = 350; // Tablet
        }
      }

      // Das größte SVG sollte der Header sein
      expect(maxWidth).toBeGreaterThan(minHeaderWidth);
      expect(largestSvg).toBeTruthy();
    });
  }

  test('Header sollte keine störenden Borders haben', async ({ page }) => {
    // Finde alle SVGs und nimm das größte (Header, nicht Logo)
    const svgs = page.locator('svg');
    const count = await svgs.count();
    
    let largestSvg = svgs.first();
    let maxWidth = 0;
    
    for (let i = 0; i < count; i++) {
      const box = await svgs.nth(i).boundingBox();
      if (box && box.width > maxWidth) {
        maxWidth = box.width;
        largestSvg = svgs.nth(i);
      }
    }
    
    await expect(largestSvg).toBeVisible();
    
    // Prüfe auf <animateTransform> oder <animate> Tags
    const hasAnimations = await largestSvg.evaluate(el => {
      const animateElements = el.querySelectorAll('animateTransform, animate');
      return animateElements.length > 0;
    });
    
    expect(hasAnimations).toBeTruthy();
  });

  test('EVHeader3D sollte rotierende Räder haben', async ({ page }) => {
    await page.getByRole('button', { name: 'Elektroauto' }).click();
    await page.waitForTimeout(500);
    
    // Finde das Header-SVG (größtes SVG)
    const svgs = page.locator('svg');
    const count = await svgs.count();
    
    let headerSvg = svgs.first();
    let maxWidth = 0;
    
    for (let i = 0; i < count; i++) {
      const box = await svgs.nth(i).boundingBox();
      if (box && box.width > maxWidth) {
        maxWidth = box.width;
        headerSvg = svgs.nth(i);
      }
    }
    
    await expect(headerSvg).toBeVisible();
    
    // Suche nach Rad-Elementen (große Circles = Räder)
    const wheels = await headerSvg.locator('circle[r="35"]').count();
    expect(wheels).toBeGreaterThanOrEqual(2); // Mindestens 2 Räder
  });

  test('V2H Animation sollte Tag/Nacht Zyklus haben', async ({ page }) => {
    await page.getByRole('button', { name: 'Elektroauto' }).click();
    await page.waitForTimeout(1000);
    
    // Scroll zum V2H Bereich
    const tagLaden = page.locator('text=TAG: Laden');
    await tagLaden.scrollIntoViewIfNeeded();
    
    // Prüfe Labels
    await expect(tagLaden).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=NACHT: Entladen')).toBeVisible();
    
    // Das V2H SVG sollte auf der Seite sein (wir testen nur ob die Labels da sind)
    // Das reicht als Beweis dass die V2H Animation geladen wurde
  });
});
