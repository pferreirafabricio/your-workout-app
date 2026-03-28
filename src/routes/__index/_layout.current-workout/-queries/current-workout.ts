import {
  getBodyWeightSeriesServerFn,
  getCurrentWorkoutServerFn,
  getUserPreferencesServerFn,
} from "@/lib/workouts.server";
import { getEquipmentCatalogServerFn, getMovementsServerFn } from "@/lib/movements.server";
import { queryOptions } from "@tanstack/react-query";

export const currentWorkoutQueryOptions = () =>
  queryOptions({
    queryKey: ["current-workout"],
    queryFn: () => getCurrentWorkoutServerFn(),
  });

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovementsServerFn(),
  });

export const equipmentCatalogQueryOptions = () =>
  queryOptions({
    queryKey: ["equipment-catalog"],
    queryFn: () => getEquipmentCatalogServerFn(),
  });

export const userPreferencesQueryOptions = () =>
  queryOptions({
    queryKey: ["user-preferences"],
    queryFn: () => getUserPreferencesServerFn(),
  });

export const bodyWeightSeriesQueryOptions = () =>
  queryOptions({
    queryKey: ["body-weight-series"],
    queryFn: () => getBodyWeightSeriesServerFn({ data: {} }),
  });
