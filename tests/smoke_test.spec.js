const { test, expect } = require('@playwright/test');

test('Smoke test production deployment', async ({ page }) => {
  // Go to the production URL
  const response = await page.goto('https://mafiagame-9egr.onrender.com/', { waitUntil: 'networkidle' });
  
  // Verify the page loaded successfully
  expect(response.status()).toBe(200);

  // Check if the title is correct (or at least the main app loaded)
  // Our App.tsx likely renders "Mafia Game" or "Create New Room"
  const createButton = page.locator('button:has-text("Create New Room")');
  await expect(createButton).toBeVisible({ timeout: 10000 });

  console.log('Production URL loaded successfully and React app is rendering!');
});
