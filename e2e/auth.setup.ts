import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // 1. Create a user or login with an existing one.
  // Creating a new user for each run is safer to avoid state leakage, 
  // but logging in with a "known" user is faster.
  // For now, let's use the UI to ensure the flow works.
  
  const email = `test-user-${Date.now()}@example.com`;
  const password = "Password123!";

  await page.goto("/create-account");
  await page.getByLabel("Name").fill("E2E Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  // 2. Click create and wait for redirect
  await page.getByRole("button", { name: "Create account" }).click();

  // 3. Wait for the URL to change to the dashboard/workout page
  // This is more reliable than just checking for text immediately.
  try {
    await page.waitForURL("**/current-workout", { timeout: 10000 });
  } catch (e) {
    // If it didn't redirect, check if there's an error message on the page
    const errorLocator = page.locator(".text-red-600");
    if (await errorLocator.isVisible()) {
      const errorText = await errorLocator.innerText();
      throw new Error(`Account creation failed with error: ${errorText}`);
    }
    throw new Error(`Account creation failed: timed out waiting for redirect. Current URL: ${page.url()}`);
  }

  // 4. Verify we are indeed logged in
  // Use a more specific locator or wait longer if needed
  await expect(page.getByText("Logged in as")).toBeVisible({ timeout: 10000 });

  // 5. Save the storage state (cookies, localStorage)
  await page.context().storageState({ path: authFile });
});
