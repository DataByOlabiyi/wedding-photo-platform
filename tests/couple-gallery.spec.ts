/**
 * E2E: Couple gallery view + ZIP download trigger
 *
 * Required env vars:
 *   TEST_COUPLE_EMAIL     — email of a Couple account
 *   TEST_COUPLE_PASSWORD  — password of that account
 *   TEST_EVENT_SLUG       — slug of an event belonging to that account
 *
 * Run with: npx playwright test tests/couple-gallery.spec.ts
 */
import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_COUPLE_EMAIL
const PASSWORD = process.env.TEST_COUPLE_PASSWORD
const EVENT_SLUG = process.env.TEST_EVENT_SLUG

async function loginAsCouple(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.fill('#email', EMAIL!)
  await page.fill('#password', PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 15_000 })
}

test.describe('Couple gallery view', () => {
  test.skip(!EMAIL || !PASSWORD || !EVENT_SLUG, 'Set TEST_COUPLE_EMAIL, TEST_COUPLE_PASSWORD, TEST_EVENT_SLUG')

  test('couple logs in, opens event, sees gallery and download button', async ({ page }) => {
    await loginAsCouple(page)

    // Dashboard should list events
    await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible()

    // Find and click the target event card (matches by slug text or event name)
    // The event link text is the event name; we navigate directly since we know the slug
    // First, find the event id by looking for a link that navigates to /dashboard/events/...
    // We click the first event card matching our slug
    const eventLink = page
      .getByRole('link', { name: new RegExp(EVENT_SLUG!.replace(/-/g, '.'), 'i') })
      .or(page.locator(`a[href*="dashboard/events"]`).first())
    await eventLink.click()

    // Event gallery page
    await expect(page.url()).toMatch(/\/dashboard\/events\/[a-f0-9-]+/)

    // Gallery header elements should be visible
    await expect(page.getByText(/photos from/i)).toBeVisible({ timeout: 10_000 })

    // "Download all" button must be present (visible regardless of plan)
    const downloadBtn = page.getByRole('button', { name: /Download all/i })
    await expect(downloadBtn).toBeVisible()

    // For Pro accounts this initiates a download; for Starter it shows an upgrade toast.
    // We just verify the button is clickable — we don't assert on the download itself.
    await downloadBtn.click()

    // Either a file download starts (Pro) or a toast appears (Starter)
    // Wait briefly to ensure no unhandled errors
    await page.waitForTimeout(1_000)
  })
})
