import { describe, expect, it } from "vitest";
import {
  createEquipmentServerFn,
  getEquipmentListServerFn,
  setEquipmentActiveStateServerFn,
  updateEquipmentServerFn,
} from "@/lib/features/equipment/equipment.server";

describe("equipment server", () => {
  it("returns validation-safe error when create payload is invalid", async () => {
    await expect(
      createEquipmentServerFn({
        data: {
          code: "",
          name: "",
          displayOrder: -1,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid update payload", async () => {
    await expect(
      updateEquipmentServerFn({
        data: {
          equipmentId: "",
          code: "BARBELL",
          name: "Barbell",
          displayOrder: 10,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid active-state payload", async () => {
    await expect(
      setEquipmentActiveStateServerFn({
        data: {
          equipmentId: "",
          isActive: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects list endpoint without auth context", async () => {
    await expect(getEquipmentListServerFn()).rejects.toThrow();
  });
});
