import { expect, test } from "@playwright/test";


test.describe("Equipment", () => {
  test("loads equipment page and can create equipment", async ({ page }) => {
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { name: "Equipment" })).toBeVisible();

    const code = `EQ_${Date.now()}`;
    const name = `Equipment ${Date.now()}`;

    await page.getByLabel("Code").fill(code);
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Display Order").fill("777");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(`code: ${code}`)).toBeVisible();
  });

  test("redirects unauthenticated users to sign-in", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/equipment");
    await expect(page).toHaveURL(/\/sign-in/);
    await context.close();
  });

  test("surfaces safe error state when csrf token is invalid", async ({ page }) => {
    await page.goto("/equipment");

    await page.evaluate(() => {
      globalThis.localStorage.setItem("csrf-token", "invalid-token");
    });

    const suffix = Date.now();
    await page.getByLabel("Code").fill(`BROKEN_${suffix}`);
    await page.getByLabel("Name").fill(`Broken ${suffix}`);
    await page.getByLabel("Display Order").fill("5");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("We could not save your changes. Please try again.")).toBeVisible();
  });

  test("edits and archives an equipment row", async ({ page }) => {
    await page.goto("/equipment");

    const suffix = Date.now();
    await page.getByLabel("Code").fill(`EDIT_${suffix}`);
    await page.getByLabel("Name").fill(`Editable ${suffix}`);
    await page.getByLabel("Display Order").fill("99");
    await page.getByRole("button", { name: "Create" }).click();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.getByLabel("Name").fill(`Edited ${suffix}`);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(`Edited ${suffix}`)).toBeVisible();

    await page.getByRole("button", { name: "Archive" }).first().click();
    await page.getByRole("button", { name: "Archive" }).nth(1).click();
    await expect(page.getByText("Archived").first()).toBeVisible();
  });
});
