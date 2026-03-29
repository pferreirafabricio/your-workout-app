import { test, expect, type Page } from "@playwright/test";

async function gotoMovementsPage(page: Page) {
  await page.goto("/movements");
  await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();
}

function getMovementForm(page: Page) {
  return page.locator("form").filter({ hasText: "Add New Movement" });
}

function getMovementRowByName(page: Page, movementName: string) {
  return page.locator("li", { hasText: movementName }).first();
}

async function createMovement(page: Page, movementName: string) {
  const movementForm = getMovementForm(page);
  await movementForm.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName);
  await movementForm.locator("select").nth(0).selectOption("WEIGHTED");
  await movementForm.locator("select").nth(1).selectOption("CHEST");
  await movementForm.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Movement created.")).toBeVisible();
}

async function gotoCurrentWorkoutAndStartIfNeeded(page: Page) {
  await page.goto("/current-workout");
  const startWorkoutButton = page.getByRole("button", { name: "Start Workout" });
  if (await startWorkoutButton.isVisible()) {
    await startWorkoutButton.click();
  }
}

test.describe("Movements", () => {
  test("creates movement and shows saved metadata", async ({ page }) => {
    await gotoMovementsPage(page);

    const suffix = Date.now();
    const movementName = `Movement-${suffix}`;
    await createMovement(page, movementName);

    const createdMovementRow = getMovementRowByName(page, movementName);
    await expect(createdMovementRow).toContainText(movementName);
    await expect(createdMovementRow).toContainText("weighted | CHEST | no equipment");
  });

  test("reads movement from catalog after creation", async ({ page }) => {
    await gotoMovementsPage(page);

    const suffix = Date.now();
    const movementName = `Readable-${suffix}`;
    await createMovement(page, movementName);

    await page.goto("/current-workout");
    await gotoMovementsPage(page);

    const persistedMovementRow = getMovementRowByName(page, movementName);
    await expect(persistedMovementRow).toBeVisible();
    await expect(persistedMovementRow).toContainText("weighted");
  });

  test("updates movement name and reflects changes", async ({ page }) => {
    await gotoMovementsPage(page);

    const suffix = Date.now();
    const movementName = `Movement-${suffix}`;
    const updatedMovementName = `Movement-Updated-${suffix}`;
    await createMovement(page, movementName);

    const createdMovementRow = getMovementRowByName(page, movementName);
    await createdMovementRow.getByRole("button", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Movement" })).toBeVisible();

    const movementForm = getMovementForm(page);
    await movementForm.getByPlaceholder("Movement name (e.g. Bench Press)").fill(updatedMovementName);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Movement updated.")).toBeVisible();
    const updatedMovementRow = getMovementRowByName(page, updatedMovementName);
    await expect(updatedMovementRow).toBeVisible();
    await expect(updatedMovementRow).toContainText(updatedMovementName);
    await expect(updatedMovementRow).not.toContainText(movementName);
  });

  test("archives movement with confirmation and hides it from workout picker", async ({ page }) => {
    await gotoMovementsPage(page);

    const suffix = Date.now();
    const movementName = `Archivable-${suffix}`;
    await createMovement(page, movementName);

    const movementRow = getMovementRowByName(page, movementName);
    await movementRow.getByRole("button", { name: "Archive" }).click();

    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await expect(movementRow.getByText("Archived")).toHaveCount(0);
    await confirmDialog.getByRole("button", { name: "Archive" }).click();

    await expect(page.getByText("Movement status updated.")).toBeVisible();
    await expect(movementRow.getByText("Archived")).toBeVisible();

    await gotoCurrentWorkoutAndStartIfNeeded(page);

    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    await expect(workoutForm.locator("option", { hasText: movementName })).toHaveCount(0);
  });

  test("restores archived movement with confirmation and re-exposes it in workout picker", async ({ page }) => {
    await gotoMovementsPage(page);

    const suffix = Date.now();
    const movementName = `Restorable-${suffix}`;
    await createMovement(page, movementName);

    const movementRow = getMovementRowByName(page, movementName);
    await movementRow.getByRole("button", { name: "Archive" }).click();

    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Movement status updated.")).toBeVisible();
    await expect(movementRow.getByText("Archived")).toBeVisible();

    await gotoMovementsPage(page);
    const archivedMovementRow = getMovementRowByName(page, movementName);
    await archivedMovementRow.getByRole("button", { name: "Restore" }).click();

    const restoreDialog = page.getByRole("alertdialog");
    await expect(restoreDialog).toBeVisible();
    await expect(archivedMovementRow.getByText("Archived")).toBeVisible();
    await restoreDialog.getByRole("button", { name: "Restore" }).click();

    await expect(page.getByText("Movement status updated.")).toBeVisible();
    await expect(archivedMovementRow.getByText("Archived")).toHaveCount(0);

    await gotoCurrentWorkoutAndStartIfNeeded(page);

    const movementSelect = page.locator("form").filter({ hasText: "Select movement" }).locator("select").first();
    await movementSelect.selectOption({ label: movementName });
    await expect(movementSelect).toHaveValue(/.+/);
  });
});
