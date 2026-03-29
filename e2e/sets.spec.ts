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

async function recordBodyweight(page: Page, value: string) {
  const bodyweightForm = page
    .locator("form")
    .filter({ has: page.getByLabel(/Bodyweight \((kg|lbs)\)/) });
  const bodyweightInput = bodyweightForm.getByLabel(/Bodyweight \((kg|lbs)\)/);
  const recordButton = bodyweightForm.getByRole("button", { name: "Record" });

  await bodyweightInput.fill(value);
  await expect(recordButton).toBeEnabled();
  await recordButton.click();
  await expect(page.getByText("Bodyweight recorded.")).toBeVisible();
}

test.describe("Sets", () => {
  test("unit switch and bodyweight logging flow", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Weight unit").selectOption("lbs");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    await expect(page.getByText("Preferences saved.")).toBeVisible();

    await recordBodyweight(page, "180");

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
    const suffix = Date.now();
    const movementName = `SetDelete-${suffix}`;
    const deleteNote = `delete-target-${suffix}`;
    await createMovement(page, movementName, "WEIGHTED");

    await ensureWorkoutStarted(page);
    const workoutForm = page.getByTestId("add-set-form");
    await workoutForm.locator("select").first().selectOption({ label: movementName });
    await workoutForm.getByPlaceholder(/Weight/).fill("80");
    await workoutForm.getByPlaceholder("Reps").fill("5");
    await workoutForm.getByPlaceholder("Notes (optional)").fill(deleteNote);
    await workoutForm.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Set added.")).toBeVisible();

    const createdSetRow = page.locator("li").filter({
      hasText: deleteNote,
      has: page.getByRole("button", { name: "Delete set" }),
    });

    await expect(createdSetRow).toHaveCount(1);
    await createdSetRow.getByRole("button", { name: "Delete set" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete Set" }).click();

    await expect(page.getByText("Set deleted.")).toBeVisible();
    await expect(createdSetRow).toHaveCount(0);
  });

  test("bodyweight movement auto-fills and disables weight input", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Weight unit").selectOption("lbs");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    await recordBodyweight(page, "180");

    const bodyweightMovementName = `Pull-Up-${Date.now()}`;
    await createMovement(page, bodyweightMovementName, "BODYWEIGHT");

    const weightedMovementName = `Bench-${Date.now()}`;
    await createMovement(page, weightedMovementName, "WEIGHTED");

    await ensureWorkoutStarted(page);

    const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
    const movementSelect = workoutForm.locator("select").first();
    const weightInput = workoutForm.getByPlaceholder(/Weight/);

    await movementSelect.selectOption({ label: bodyweightMovementName });
    await expect(weightInput).toBeDisabled();
    const autoFilledWeight = Number.parseFloat(await weightInput.inputValue());
    expect(autoFilledWeight).toBeCloseTo(180, 1);

    await movementSelect.selectOption({ label: weightedMovementName });
    await expect(weightInput).toBeEnabled();
    await expect(weightInput).toHaveValue("");
  });
});
