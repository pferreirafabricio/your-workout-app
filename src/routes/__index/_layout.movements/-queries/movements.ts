import { getEquipmentCatalogServerFn, getMovementsServerFn } from "@/lib/features/movements/movements.server";
import { queryOptions } from "@tanstack/react-query";

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovementsServerFn(),
  });

export const equipmentQueryOptions = () =>
  queryOptions({
    queryKey: ["equipment-catalog"],
    queryFn: () => getEquipmentCatalogServerFn(),
  });
