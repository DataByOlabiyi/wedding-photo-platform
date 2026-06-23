/**
 * E2E: Guest upload flow
 *
 * Required env vars:
 *   TEST_EVENT_SLUG  — slug of an open event to upload to (e.g. "emma-jack-2026")
 *
 * Run with: npx playwright test tests/guest-upload.spec.ts
 */
import { test, expect } from '@playwright/test'

// Minimal valid 1×1 PNG — passes magic-byte check, renders on canvas
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

// Second PNG with an appended byte — same image, different binary hash (avoids perceptual-hash early dedup)
const MINIMAL_PNG_2 = Buffer.concat([MINIMAL_PNG, Buffer.from([0x00])])

const EVENT_SLUG = process.env.TEST_EVENT_SLUG

test.describe('Guest upload flow', () => {
  test.skip(!EVENT_SLUG, 'Set TEST_EVENT_SLUG to run this test')

  test('guest enters name, uploads 2 photos, and sees success screen', async ({ page }) => {
    await page.goto(`/e/${EVENT_SLUG}`)

    // Step 1: info screen
    await expect(page.getByRole('heading', { name: 'Share Your Memories' })).toBeVisible()

    // Use a timestamp-suffixed name so duplicate detection never fires across runs
    const guestName = `E2E Test ${Date.now()}`
    await page.fill('#name', guestName)
    await page.click('button:has-text("Continue to Upload")')

    // Step 2: upload screen
    await expect(page.getByRole('heading', { name: 'Upload Your Photos' })).toBeVisible()
    await expect(page.getByText(guestName)).toBeVisible()

    // Select 2 photos via the hidden file input
    await page.locator('input[type="file"]').setInputFiles([
      { name: 'photo-1.png', mimeType: 'image/png', buffer: MINIMAL_PNG },
      { name: 'photo-2.png', mimeType: 'image/png', buffer: MINIMAL_PNG_2 },
    ])

    // Files appear in the upload queue (either file names or count text)
    await expect(page.getByText('photo-1.png').or(page.getByText(/2\s*(photos|files)/i))).toBeVisible({
      timeout: 5_000,
    })

    // Wait for both uploads to complete and success screen to appear (30s max — network dependent)
    await expect(page.getByRole('heading', { name: /Thank you/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/2 photos/i)).toBeVisible()
  })
})
