import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration für WattAI.live
 * 
 * Nutzung:
 * - Tests ausführen: npx playwright test
 * - UI Mode: npx playwright test --ui
 * - Codegen (Recorder): npx playwright codegen http://localhost:5173
 * - Debug Mode: npx playwright test --debug
 * - Bestimmten Browser: npx playwright test --project=chromium
 * - Report anzeigen: npx playwright show-report
 */

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Timeout für einzelne Tests erhöht */
  timeout: 60 * 1000, // 60 Sekunden pro Test
  
  /* Globaler Timeout für gesamten Test-Run */
  globalTimeout: 30 * 60 * 1000, // 30 Minuten
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://www.wattai.live',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Erhöhte Timeouts für Navigation */
    navigationTimeout: 30 * 1000, // 30 Sekunden
    actionTimeout: 15 * 1000, // 15 Sekunden für Aktionen
  },

  /* Configure projects for major browsers */
  projects: [
    // ✅ Standard Chromium (Open-Source)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ✅ Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // ✅ WebKit (Safari-Engine)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ✅ Mobile Chrome (Pixel 5)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // ✅ Mobile Safari (iPhone 12)
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // ✅ Google Chrome (branded - requires Chrome installed)
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        browserName: 'chromium',  // Correct: Chrome uses chromium engine
        channel: 'chrome'  // Use installed Chrome browser
      }
    },

    // ✅ Microsoft Edge (branded - requires Edge installed)
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        browserName: 'chromium',  // Correct: Edge uses chromium engine
        channel: 'msedge'  // Use installed Edge browser
      }
    },
  ],

  /* Optional: Run local dev server for development
   * Auskommentiert, da wir die Live-Site testen */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5175',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
