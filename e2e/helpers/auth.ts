import { expect, type Page } from "@playwright/test";

export async function createAccountAndSignIn(page: Page, prefix: string) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${prefix}-${nonce}@example.com`;
  const password = "StrongPass123!";

  await page.goto("/create-account");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Logged in as")).toBeVisible();

  return { email, password };
}