import { test, expect, type Page } from "@playwright/test";

async function createMovement(page: Page, name: string) {
  await page.goto("/movements");
  await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();
  await page.getByPlaceholder(/Movement name/).fill(name);
  await page.locator("main select").first().selectOption("WEIGHTED");
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

async function addSetForMovement(page: Page, movementName: string, reps: string, weight: string, note?: string) {
  const workoutForm = page.getByTestId("add-set-form");
  await workoutForm.locator("select").first().selectOption({ label: movementName });
  await workoutForm.getByPlaceholder(/Weight/).fill(weight);
  await workoutForm.getByPlaceholder("Reps").fill(reps);
  if (note) {
    await workoutForm.getByPlaceholder("Notes (optional)").fill(note);
  }
  await workoutForm.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Set added.")).toBeVisible();
}

async function completeWorkout(page: Page) {
  await page.getByRole("button", { name: /Complete Workout/ }).first().click();
  await expect(page.getByText("No active workout. Ready to start?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Workout" })).toBeVisible();
}

test.describe("Workouts", () => {
  test("start workout -> log/edit/delete sets -> complete workout", async ({ page }) => {
    const movementName = `Bench-${Date.now()}`;
    await createMovement(page, movementName);

    await ensureWorkoutStarted(page);
    await addSetForMovement(page, movementName, "5", "100", "opening set");

    const setRow = page.locator("li", { hasText: movementName }).filter({ hasText: "opening set" }).first();
    await setRow.getByRole("button", { name: "Edit" }).click();
    await setRow.locator("input[type='number']").nth(0).fill("6");
    await setRow.locator("input[type='number']").nth(1).fill("105");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Set updated.")).toBeVisible();
    await expect(page.getByText("6 reps x 105")).toBeVisible();

    await page.getByRole("button", { name: "Delete set" }).first().click();
    const deleteDialog = page.getByRole("alertdialog");
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete Set" }).click();
    await expect(page.getByText("Set deleted.")).toBeVisible();

    await addSetForMovement(page, movementName, "4", "110", "finisher");
    await completeWorkout(page);
  });

  test("progression metric selection and history visualization", async ({ page }) => {
    const movementName = `Row-${Date.now()}`;
    await createMovement(page, movementName);

    await ensureWorkoutStarted(page);
    await addSetForMovement(page, movementName, "8", "70", "history seed");
    await completeWorkout(page);

    await page.goto("/workout-history");
    await expect(page.getByRole("heading", { name: "Progression Insights" })).toBeVisible();

    await page.getByLabel("Movement").selectOption({ label: movementName });
    await page.getByLabel("Metric").selectOption("totalReps");
    await expect(page.getByText("Latest")).toBeVisible();
    await expect(page.getByText("Best")).toBeVisible();
    await expect(page.getByText("Delta vs previous")).toBeVisible();
    await expect(page.getByText(/points logged/)).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Performance Dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Movement Progression" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nutrition Trend" })).toBeVisible();
    await page.getByLabel("Metric").first().selectOption({ label: "Total Volume" });
    await page.getByLabel("Metric").nth(1).selectOption({ label: "Protein (g)" });
    await expect(page.getByText("Latest Value").first()).toBeVisible();
  });

  test("completed workouts can be selected and deleted", async ({ page }) => {
    const movementName = `DeleteFlow-${Date.now()}`;
    await createMovement(page, movementName);

    await ensureWorkoutStarted(page);
    await addSetForMovement(page, movementName, "3", "120", "deletable workout");
    await completeWorkout(page);

    await page.goto("/workout-history");
    await expect(page.getByRole("heading", { name: "Completed Workouts" })).toBeVisible();

    await page.getByRole("button", { name: "Show" }).first().click();
    await expect(page.getByRole("cell", { name: movementName, exact: true })).toBeVisible();

    await page.locator("tbody input[type='checkbox']").nth(1).check();
    await page.getByRole("button", { name: /Delete Selected \(1\)/ }).click();

    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Delete Workouts" }).click();

    await expect(page.getByText("1 workout deleted.")).toBeVisible();
    await expect(page.getByText(movementName)).toHaveCount(0);
  });
});
