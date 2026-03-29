import { expect, type Page } from "@playwright/test";

export async function createAccountAndSignIn(page: Page, prefix: string) {
  const password = `StrongPass!${Date.now()}Aa1`;
  let email = "";
  let lastError = "";
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${attempt}`;
    email = `${prefix}-${nonce}@example.com`;
    const inlineError = page.locator("text=/account creation failed|unexpected error|invalid account details|forbidden/i");

    await page.goto("/create-account", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible({ timeout: 15000 });
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    try {
      const outcome = await Promise.race([
        page.getByText("Logged in as").waitFor({ timeout: 10000 }),
        page.waitForURL(/\/(current-workout|$)/, { timeout: 10000 }),
        inlineError.first().waitFor({ timeout: 10000 }),
      ]);

      if (outcome === undefined && (await inlineError.first().isVisible())) {
        lastError = await inlineError.first().innerText();
        continue;
      }
    } catch {
      if (await inlineError.first().isVisible()) {
        lastError = await inlineError.first().innerText();
      } else if (pageErrors.length > 0) {
        lastError = `page error: ${pageErrors.at(-1)}`;
      } else if (consoleErrors.length > 0) {
        lastError = `console error: ${consoleErrors.at(-1)}`;
      } else {
        lastError = `timeout while waiting for auth success (url=${page.url()})`;
      }
      continue;
    }

    await expect(page.getByText("Logged in as")).toBeVisible({ timeout: 10000 });
    return { email, password };
  }

  const debugSignals = [
    pageErrors.at(-1) ? `last page error: ${pageErrors.at(-1)}` : "",
    consoleErrors.at(-1) ? `last console error: ${consoleErrors.at(-1)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const suffix = [lastError, debugSignals].filter(Boolean).join(" | ");
  throw new Error(`Unable to create account after retries${suffix}`);
}