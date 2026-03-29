import { test, expect } from "@playwright/test";

test.describe("Movements", () => {
  test("create and update movement with equipment and muscle group", async ({ page }) => {
    await page.goto("/movements");
    await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();

    const suffix = Date.now();
    const movementName = `Movement-${suffix}`;
    const updatedMovementName = `Movement-Updated-${suffix}`;

    const movementForm = page.locator("form").filter({ hasText: "Add New Movement" });
    await movementForm.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName);
    await movementForm.locator("select").nth(0).selectOption("WEIGHTED");
    await movementForm.locator("select").nth(1).selectOption("CHEST");
    await movementForm.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Movement created.")).toBeVisible();
    await expect(page.getByText(movementName)).toBeVisible();
    await expect(page.getByText("weighted | CHEST | no equipment")).toBeVisible();

    const createdMovementRow = page.locator("li", { hasText: movementName }).first();
    await createdMovementRow.getByRole("button", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Movement" })).toBeVisible();

    await movementForm.getByPlaceholder("Movement name (e.g. Bench Press)").fill(updatedMovementName);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Movement updated.")).toBeVisible();
    await expect(page.getByText(updatedMovementName)).toBeVisible();
  });

  test("archive and restore movement while preserving history visibility", async ({ page }) => {
    await page.goto("/movements");
    await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();

    const suffix = Date.now();
    const movementName = `Archivable-${suffix}`;

    const movementForm = page.locator("form").filter({ hasText: "Add New Movement" });
    await movementForm.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName);
    await movementForm.locator("select").nth(0).selectOption("WEIGHTED");
    await movementForm.getByRole("button", { name: "Add" }).click();

    const movementRow = page.locator("li", { hasText: movementName }).first();
    await movementRow.getByRole("button", { name: "Archive" }).click();

    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Archive" }).click();

    await expect(page.getByText("Movement status updated.")).toBeVisible();
    await expect(movementRow.getByText("Archived")).toBeVisible();

    await page.goto("/current-workout");
    const startWorkoutButton = page.getByRole("button", { name: "Start Workout" });
    if (await startWorkoutButton.isVisible()) {
      await startWorkoutButton.click();
    }

    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    await expect(workoutForm.locator("option", { hasText: movementName })).toHaveCount(0);

    await page.goto("/movements");
    const archivedMovementRow = page.locator("li", { hasText: movementName }).first();
    await archivedMovementRow.getByRole("button", { name: "Restore" }).click();

    const restoreDialog = page.getByRole("alertdialog");
    await expect(restoreDialog).toBeVisible();
    await restoreDialog.getByRole("button", { name: "Restore" }).click();

    await expect(page.getByText("Movement status updated.")).toBeVisible();

    await page.goto("/current-workout");
    if (await startWorkoutButton.isVisible()) {
      await startWorkoutButton.click();
    }

    const movementSelect = page.locator("form").filter({ hasText: "Select movement" }).locator("select").first();
    await movementSelect.selectOption({ label: movementName });
    await expect(movementSelect).toHaveValue(/.+/);
  });
});
