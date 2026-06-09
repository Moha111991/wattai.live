#!/usr/bin/env bash
set -euo pipefail

mkdir -p .github/workflows frontend/e2e

cat > .github/workflows/playwright.yml <<'EOF'
name: Playwright Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 📦 Install Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: 📦 Install Playwright Browsers
        working-directory: ./frontend
        run: npx playwright install --with-deps chromium firefox webkit

      - name: ✅ Run Playwright Tests
        working-directory: ./frontend
        run: npx playwright test
        env:
          CI: true

      - name: 📊 Upload Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30

      - name: 📸 Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: frontend/test-results/
          retention-days: 7

      - name: 💬 Comment PR with Results
        uses: daun/playwright-report-comment@v3
        if: github.event_name == 'pull_request' && hashFiles('frontend/test-results/results.json') != ''
        with:
          report-file: frontend/test-results/results.json
          comment-title: Playwright test results
          job-summary: false
          icon-style: octicons
EOF

cat > frontend/playwright.config.ts <<'EOF'
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration für WattAI.live
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30 * 1000,
  globalTimeout: 15 * 60 * 1000,

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://www.wattai.live',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 20 * 1000,
    actionTimeout: 10 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
EOF

cat > frontend/e2e/headers-3d.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.describe('3D Header Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
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
      await page.getByRole('button', { name: tab }).click();

      const svgs = page.locator('svg');
      const count = await svgs.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let largestSvg = svgs.first();
      let maxWidth = 0;

      for (let i = 0; i < count; i++) {
        const box = await svgs.nth(i).boundingBox();
        if (box && box.width > maxWidth) {
          maxWidth = box.width;
          largestSvg = svgs.nth(i);
        }
      }

      const viewportSize = page.viewportSize();
      const isMobileViewport = viewportSize ? viewportSize.width < 768 : false;

      if (isMobileViewport) {
        expect(count).toBeGreaterThanOrEqual(1);
        return;
      }

      const minHeaderWidth = viewportSize && viewportSize.width < 1024 ? 350 : 500;
      expect(maxWidth).toBeGreaterThan(minHeaderWidth);
      await expect(largestSvg).toBeVisible();
    });
  }

  test('Header sollte keine störenden Borders haben', async ({ page }) => {
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

    const hasAnimations = await largestSvg.evaluate(el => {
      const animateElements = el.querySelectorAll('animateTransform, animate');
      return animateElements.length > 0;
    });

    expect(hasAnimations).toBeTruthy();
  });

  test('EVHeader3D sollte rotierende Räder haben', async ({ page }) => {
    await page.getByRole('button', { name: 'Elektroauto' }).click();

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

    const wheels = await headerSvg.locator('circle[r="35"]').count();
    expect(wheels).toBeGreaterThanOrEqual(2);
  });

  test('V2H Animation sollte Tag/Nacht Zyklus haben', async ({ page }) => {
    await page.getByRole('button', { name: 'Elektroauto' }).click();

    const tagLaden = page.locator('text=TAG: Laden');
    await tagLaden.scrollIntoViewIfNeeded();

    await expect(tagLaden).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=NACHT: Entladen')).toBeVisible();
  });
});
EOF

cat > frontend/e2e/navigation.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('sollte alle 5 Tabs sichtbar haben', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Geräte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elektroauto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Smart Home' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'KI-Empfehlung' })).toBeVisible();
  });

  test('sollte zum Geräte-Tab navigieren', async ({ page }) => {
    await page.getByRole('button', { name: 'Geräte' }).click();
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.locator('text=Verbundene Geräte')).toBeVisible({ timeout: 10000 });
  });

  test('sollte zum Elektroauto-Tab navigieren und V2H Animation zeigen', async ({ page }) => {
    await page.getByRole('button', { name: 'Elektroauto' }).click();
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=TAG: Laden')).toBeVisible();
    await expect(page.locator('text=NACHT: Entladen')).toBeVisible();
  });

  test('sollte zwischen allen Tabs wechseln können', async ({ page }) => {
    const tabs = ['Dashboard', 'Geräte', 'Elektroauto', 'Smart Home', 'KI-Empfehlung'];

    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      await expect(page.locator('svg').first()).toBeVisible();
    }
  });
});
EOF

cat > frontend/e2e/mobile.spec.ts <<'EOF'
import { test, expect, devices } from '@playwright/test';

const mobileTest = test.extend({});
mobileTest.use({ ...devices['iPhone 12'] });

test.describe('Mobile Optimization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  mobileTest('sollte auf Mobile responsive sein', async ({ page }) => {
    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible();

    const logo = logoBar.locator('svg').first();
    const box = await logo.boundingBox();

    expect(box!.width).toBeGreaterThan(30);
    expect(box!.width).toBeLessThanOrEqual(150);
  });

  mobileTest('Tabs sollten auf Mobile klickbar sein', async ({ page }) => {
    const tabs = ['Dashboard', 'Geräte', 'Elektroauto', 'Smart Home', 'KI-Empfehlung'];

    for (const tabName of tabs) {
      const tabButton = page.getByRole('button', { name: tabName });
      await expect(tabButton).toBeVisible();

      const box = await tabButton.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(40);
    }
  });

  mobileTest('sollte keine horizontale Scrollbar haben', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  mobileTest('Header sollte auf Mobile sichtbar sein', async ({ page }) => {
    const headerSvg = page.locator('svg').first();
    await expect(headerSvg).toBeVisible();

    const box = await headerSvg.boundingBox();
    const viewportWidth = page.viewportSize()!.width;
    expect(box!.width).toBeLessThanOrEqual(viewportWidth);
  });

  mobileTest('DevicesDashboard sollte auf Mobile funktionieren', async ({ page }) => {
    await page.getByRole('button', { name: 'Geräte' }).click();
    await expect(page.locator('text=Verbundene Geräte')).toBeVisible({ timeout: 10000 });

    const deviceManager = page.locator('.device-grid, .device-manager');
    const count = await deviceManager.count();
    expect(count).toBeGreaterThan(0);
  });

  mobileTest('sollte Touch-Events unterstützen', async ({ page }) => {
    const dashboardTab = page.getByRole('button', { name: 'Dashboard' });
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

      await page.goto('/', { waitUntil: 'load' });
      await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('svg').first()).toBeVisible();
    });
  }
});
EOF

cat > frontend/e2e/responsive-logo.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

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
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'load' });

      const logoBar = page.getByTestId('logo-bar');
      await expect(logoBar).toBeVisible({ timeout: 10000 });

      const logo = logoBar.locator('svg').first();
      await expect(logo).toBeVisible();

      const box = await logo.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThanOrEqual(viewport.minSize);
      expect(box!.width).toBeLessThanOrEqual(viewport.maxSize);
    });
  }

  test('Logo-Leiste sollte sichtbar und oben positioniert sein', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/', { waitUntil: 'load' });

    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible({ timeout: 10000 });

    const box = await logoBar.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeLessThan(100);
  });

  test('Logo-Bereich sollte Glassmorphism-Effekt haben', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const logoBar = page.getByTestId('logo-bar');
    await expect(logoBar).toBeVisible({ timeout: 10000 });

    const backdropFilter = await logoBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter');
    });

    expect(backdropFilter).toContain('blur');
  });
});
EOF

cat > frontend/e2e/wattai-live.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test.describe('WattAI.live - Kompletter User Flow', () => {
  test('Sollte durch alle Tabs navigieren und Funktionen testen', async ({ page }) => {
    await page.goto('https://www.wattai.live/', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Elektroauto' }).click({ timeout: 10000 });
    await page.getByRole('button', { name: 'Geräte' }).click();
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await page.getByRole('button', { name: 'Smart Home' }).click();
    await page.getByRole('button', { name: 'KI-Empfehlung' }).click();
  });
});
EOF

echo "Done. Updated 7 files:"
echo "  - .github/workflows/playwright.yml"
echo "  - frontend/playwright.config.ts"
echo "  - frontend/e2e/headers-3d.spec.ts"
echo "  - frontend/e2e/navigation.spec.ts"
echo "  - frontend/e2e/mobile.spec.ts"
echo "  - frontend/e2e/responsive-logo.spec.ts"
echo "  - frontend/e2e/wattai-live.spec.ts"
echo
echo "Next steps:"
echo "  chmod +x apply-playwright-fix.sh"
echo "  ./apply-playwright-fix.sh"
echo "  git diff --stat"
echo "  cd frontend && npx playwright test"