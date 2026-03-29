import { describe, expect, it } from "vitest";
import {
  archiveMovementServerFn,
  createMovementServerFn,
  getEquipmentCatalogServerFn,
  getMovementsServerFn,
  updateMovementServerFn,
} from "@/lib/features/movements/movements.server";

describe("movements server", () => {
  it("rejects invalid create payload", async () => {
    await expect(
      createMovementServerFn({
        data: {
          name: "",
          type: "INVALID",
        } as unknown as Parameters<typeof createMovementServerFn>[0]["data"],
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid update payload", async () => {
    await expect(
      updateMovementServerFn({
        data: {
          movementId: "",
          name: "Push-up",
          type: "BODYWEIGHT",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid archive payload", async () => {
    await expect(
      archiveMovementServerFn({
        data: {
          movementId: "",
          archive: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects list endpoints without auth context", async () => {
    await expect(getMovementsServerFn()).rejects.toThrow();
    await expect(getEquipmentCatalogServerFn()).rejects.toThrow();
  });
});
