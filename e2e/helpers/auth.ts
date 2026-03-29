import { expect, type Page } from "@playwright/test";

export async function createAccountAndSignIn(page: Page, prefix: string) {
  const password = `StrongPass!${Date.now()}Aa1`;
  let email = "";
  let lastError = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${attempt}`;
    email = `${prefix}-${nonce}@example.com`;

    await page.goto("/create-account");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: "Create account" }).click();

    try {
      await Promise.race([
        page.getByText("Logged in as").waitFor({ timeout: 10000 }),
        page.waitForURL(/\/(current-workout|$)/, { timeout: 10000 }),
      ]);
    } catch {
      const inlineError = page.locator("text=/account creation failed|unexpected error|invalid account details/i");
      if (await inlineError.first().isVisible()) {
        lastError = await inlineError.first().innerText();
      }
      continue;
    }

    await expect(page.getByText("Logged in as")).toBeVisible({ timeout: 10000 });
    return { email, password };
  }

  const suffix = lastError ? `: ${lastError}` : "";
  throw new Error(`Unable to create account after retries${suffix}`);
}