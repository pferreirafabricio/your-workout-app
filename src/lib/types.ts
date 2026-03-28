export type UnwrapAsyncIterator<T> = T extends AsyncIterator<infer U> ? U : never;

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

export type Prettify<T> = { [K in keyof T]: T[K] };

export const WEIGHT_UNITS = ["kg", "lbs"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const PROGRESSION_METRICS = ["maxWeight", "totalReps", "totalVolume"] as const;
export type ProgressionMetric = (typeof PROGRESSION_METRICS)[number];

export const DEFAULT_REST_TARGET_SECONDS = 120;
export const MIN_REST_TARGET_SECONDS = 15;
export const MAX_REST_TARGET_SECONDS = 600;

export const MIN_RPE = 1;
export const MAX_RPE = 10;

export const BODYWEIGHT_EQUIPMENT_CODE = "bodyweight";
