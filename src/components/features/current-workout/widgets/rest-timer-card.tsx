import { Card, CardContent } from "@/components/ui/card";

type RestTimerCardProps = {
  hasLastSet: boolean;
  restTargetReached: boolean;
  restRemainingSeconds: number;
  restElapsedSeconds: number;
  restTargetSeconds: number;
  restProgress: number;
};

export function RestTimerCard({
  hasLastSet,
  restTargetReached,
  restRemainingSeconds,
  restElapsedSeconds,
  restTargetSeconds,
  restProgress,
}: Readonly<RestTimerCardProps>) {
  const restStatusText = hasLastSet
    ? restTargetReached
      ? "Target reached"
      : "Keep resting"
    : "No active rest interval";

  return (
    <Card>
      <CardContent className="py-5 px-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-24 w-24 rounded-full grid place-items-center text-slate-900 text-sm font-semibold"
            style={{
              background: `conic-gradient(${restTargetReached ? "#059669" : "#0f766e"} ${Math.round(restProgress * 360)}deg, #e2e8f0 0deg)`,
            }}>
            <div className="h-[4.8rem] w-[4.8rem] rounded-full bg-white grid place-items-center leading-tight text-center">
              <div>{hasLastSet ? `${restRemainingSeconds}s` : "Ready"}</div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Rest timer</p>
            <p className="text-base font-semibold text-slate-900">{hasLastSet ? `${restElapsedSeconds}s elapsed` : "Starts after your first set"}</p>
            <p className="text-sm text-slate-600">Target: {restTargetSeconds}s</p>
          </div>
        </div>
        <span className={restTargetReached ? "text-emerald-600 font-semibold" : "text-slate-500 font-medium"}>
          {restStatusText}
        </span>
      </CardContent>
    </Card>
  );
}
