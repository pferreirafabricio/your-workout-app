import { expect, test } from "@playwright/test";


test.describe("Equipment", () => {
  test("loads equipment page and can create equipment", async ({ page }) => {
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { name: "Equipment", level: 1 })).toBeVisible();

    const code = `EQ_${Date.now()}`;
    const name = `Equipment ${Date.now()}`;

    await page.getByLabel("Code").fill(code);
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Display Order").fill("777");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(`code: ${code}`)).toBeVisible();
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
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Archived").first()).toBeVisible();
  });
});
