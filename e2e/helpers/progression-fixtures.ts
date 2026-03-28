export type ProgressionSetFixture = {
  movementName: string;
  reps: number;
  weight: number;
  rpe?: number;
  notes?: string;
};

export type ProgressionWorkoutFixture = {
  name: string;
  sets: ProgressionSetFixture[];
};

export const progressionWorkoutFixtures: ProgressionWorkoutFixture[] = [
  {
    name: "Upper Strength A",
    sets: [
      { movementName: "Bench Press", reps: 5, weight: 80, rpe: 8 },
      { movementName: "Bench Press", reps: 5, weight: 82.5, rpe: 8.5 },
      { movementName: "Barbell Row", reps: 8, weight: 70, rpe: 8 },
    ],
  },
  {
    name: "Lower Strength A",
    sets: [
      { movementName: "Back Squat", reps: 5, weight: 100, rpe: 8 },
      { movementName: "Back Squat", reps: 5, weight: 102.5, rpe: 8.5 },
      { movementName: "Romanian Deadlift", reps: 8, weight: 90, rpe: 8 },
    ],
  },
];

export function makeProgressionSet(
  movementName: string,
  reps: number,
  weight: number,
  overrides: Partial<ProgressionSetFixture> = {},
): ProgressionSetFixture {
  return {
    movementName,
    reps,
    weight,
    ...overrides,
  };
}
