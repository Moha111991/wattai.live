import { Page, expect } from '@playwright/test';

/**
 * Navigate from the Landing Page (startseite) into the main App (home/tab view).
 * The app starts on the landing page by default; we must click the CTA to enter the app.
 */
export async function navigateToApp(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' });

  // If the tab bar is already visible (e.g. direct app URL), skip the CTA click
  const dashboardBtn = page.getByRole('button', { name: 'Dashboard' });
  const alreadyInApp = await dashboardBtn.isVisible().catch(() => false);
  if (alreadyInApp) return;

  // Click the main CTA on the landing page to enter the app
  // Try both DE and EN versions of the CTA text
  const cta = page
    .getByRole('link', { name: /Jetzt kostenlos testen|Start Free Trial/i })
    .or(page.getByRole('button', { name: /Jetzt kostenlos testen|Start Free Trial/i }))
    .first();

  await cta.click({ timeout: 10000 });

  // Wait until the tab bar is visible
  await expect(dashboardBtn).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}
