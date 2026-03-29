import type { WeightUnit } from "@/lib/shared/consts";

export const KG_PER_LB = 0.45359237;

export function roundWeight(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lbsToKg(lbs: number): number {
  return roundWeight(lbs * KG_PER_LB);
}

export function kgToLbs(kg: number): number {
  return roundWeight(kg / KG_PER_LB);
}

export function toCanonicalKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? roundWeight(value) : lbsToKg(value);
}

export function fromCanonicalKg(valueKg: number, unit: WeightUnit): number {
  return unit === "kg" ? roundWeight(valueKg) : kgToLbs(valueKg);
}

export function formatWeight(value: number, unit: WeightUnit, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)} ${unit}`;
}
