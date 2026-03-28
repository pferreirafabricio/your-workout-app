import { describe, expect, it } from "vitest";
import { createEquipmentServerFn } from "@/lib/features/equipment/equipment.server";

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

  it.todo("adds auth/csrf negative-path coverage");
  it.todo("adds list/create integration coverage");
  it.todo("adds sanitized persistence error coverage");
});
