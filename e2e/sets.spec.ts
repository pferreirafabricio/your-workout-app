import { test, expect, type Page } from "@playwright/test";

async function createMovement(page: Page, name: string, type: "WEIGHTED" | "BODYWEIGHT") {
  await page.goto("/movements");
  await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();
  await page.getByPlaceholder(/Movement name/).fill(name);
  await page.locator("main select").first().selectOption(type);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Movement created.")).toBeVisible();
}

async function ensureWorkoutStarted(page: Page) {
  await page.goto("/current-workout");
  const startButton = page.getByRole("button", { name: "Start Workout" });
  if (await startButton.isVisible()) {
    await startButton.click();
  }
  await expect(page.getByRole("heading", { name: "Current Workout" })).toBeVisible();
}

test.describe("Sets", () => {
  test("unit switch and bodyweight logging flow", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Weight unit").selectOption("lbs");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    await expect(page.getByText("Preferences saved.")).toBeVisible();

    const bodyweightCard = page.locator("div", { hasText: "Record Bodyweight" }).first();
    await bodyweightCard.locator("input[type='number']").first().fill("180");
    await page.getByRole("button", { name: "Record" }).click();
    await expect(page.getByText("Bodyweight recorded.")).toBeVisible();

    await page.goto("/current-workout");
    const startButton = page.getByRole("button", { name: "Start Workout" });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await expect(page.getByPlaceholder("Weight (lbs)")).toBeVisible();
  });

  test("rest timer starts and target indicator updates between sets", async ({ page }) => {
    const movementName = `RestTimer-${Date.now()}`;
    await createMovement(page, movementName, "WEIGHTED");

    await ensureWorkoutStarted(page);
    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    await workoutForm.locator("select").first().selectOption({ label: movementName });
    await workoutForm.getByPlaceholder(/Weight/).fill("60");
    await workoutForm.getByPlaceholder("Reps").fill("8");
    await workoutForm.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Set added.")).toBeVisible();
    await expect(page.getByText("Rest timer")).toBeVisible();
    await expect(page.getByText(/elapsed/)).toBeVisible();
  });

  test("set add and delete interactions", async ({ page }) => {
    const movementName = `SetDelete-${Date.now()}`;
    await createMovement(page, movementName, "WEIGHTED");

    await ensureWorkoutStarted(page);
    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    await workoutForm.locator("select").first().selectOption({ label: movementName });
    await workoutForm.getByPlaceholder(/Weight/).fill("80");
    await workoutForm.getByPlaceholder("Reps").fill("5");
    await workoutForm.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Set added.")).toBeVisible();

    await page.getByRole("button", { name: "Delete set" }).first().click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete Set" }).click();

    await expect(page.getByText("Set deleted.")).toBeVisible();
    await expect(page.getByText("No sets yet. Add exercises to your workout!")).toBeVisible();
  });

  test("bodyweight movement auto-fills and disables weight input", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Weight unit").selectOption("lbs");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    const bodyweightCard = page.locator("div", { hasText: "Record Bodyweight" }).first();
    await bodyweightCard.locator("input[type='number']").first().fill("180");
    await page.getByRole("button", { name: "Record" }).click();

    const bodyweightMovementName = `Pull-Up-${Date.now()}`;
    await createMovement(page, bodyweightMovementName, "BODYWEIGHT");

    const weightedMovementName = `Bench-${Date.now()}`;
    await createMovement(page, weightedMovementName, "WEIGHTED");

    await ensureWorkoutStarted(page);

    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    const movementSelect = workoutForm.locator("select").first();
    const weightInput = workoutForm.locator("input[type='number']").first();

    await movementSelect.selectOption({ label: bodyweightMovementName });
    await expect(weightInput).toBeDisabled();
    await expect(weightInput).toHaveValue("180");

    await movementSelect.selectOption({ label: weightedMovementName });
    await expect(weightInput).toBeEnabled();
    await expect(weightInput).toHaveValue("");
  });

  test("bodyweight movement without entries keeps weight disabled and errors on submit", async ({ page }) => {
    const movementName = `Push-Up-${Date.now()}`;
    await createMovement(page, movementName, "BODYWEIGHT");

    await ensureWorkoutStarted(page);

    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    await workoutForm.locator("select").first().selectOption({ label: movementName });

    const weightInput = workoutForm.locator("input[type='number']").first();
    await expect(weightInput).toBeDisabled();
    await expect(weightInput).toHaveValue("");

    await workoutForm.getByPlaceholder("Reps").fill("12");
    await workoutForm.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Record bodyweight first before adding a bodyweight set.")).toBeVisible();
  });
});
