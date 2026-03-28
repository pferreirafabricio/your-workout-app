import { queryOptions } from "@tanstack/react-query";
import { getEquipmentListServerFn } from "@/lib/equipment.server";

export const equipmentManagementQueryOptions = () =>
  queryOptions({
    queryKey: ["equipment-management"],
    queryFn: () => getEquipmentListServerFn(),
  });
