import { describe, expect, it } from "vitest";
import {
  addSetServerFn,
  getProgressionSeriesServerFn,
  recordBodyWeightServerFn,
  setUserPreferencesServerFn,
  updateSetServerFn,
} from "@/lib/features/workouts/workouts.server";

describe("workouts server", () => {
  it("rejects invalid add-set payload", async () => {
    await expect(
      addSetServerFn({
        data: {
          movementId: "",
          reps: 0,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid update-set payload", async () => {
    await expect(
      updateSetServerFn({
        data: {
          setId: "",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid user-preferences payload", async () => {
    await expect(
      setUserPreferencesServerFn({
        data: {
          weightUnit: "kg",
          defaultRestTargetSeconds: 99999,
          timeZone: "Invalid/Timezone",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid bodyweight payload", async () => {
    await expect(
      recordBodyWeightServerFn({
        data: {
          weight: -1,
          unit: "kg",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects progression query without auth context", async () => {
    await expect(
      getProgressionSeriesServerFn({
        data: {
          movementId: "movement-id",
          metric: "maxWeight",
        },
      }),
    ).rejects.toThrow();
  });
});
