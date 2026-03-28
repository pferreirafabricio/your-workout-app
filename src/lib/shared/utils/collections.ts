export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}

export function assertExists<T>(value: T | null | undefined, msg?: string): T {
  if (value === null || value === undefined) {
    throw new Error(msg || "Value is null or undefined");
  }

  return value;
}

export function truthyMap<T, O extends NonNullable<any>>(arr: T[], fn: (item: T) => O | null | undefined): O[] {
  const result: O[] = [];
  for (const item of arr) {
    const transformed = fn(item);
    if (!transformed) continue;
    result.push(transformed);
  }
  return result;
}
