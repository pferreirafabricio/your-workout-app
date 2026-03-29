import { Input } from "@/components/ui/input";

type DashboardHeaderCardProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function DashboardHeaderCard({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: Readonly<DashboardHeaderCardProps>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-cyan-100 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Performance Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Explore movement progression and nutrition trends over time.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="dashboard-start-date" className="text-sm font-medium text-slate-700">
            Start Date
          </label>
          <Input
            id="dashboard-start-date"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="dashboard-end-date" className="text-sm font-medium text-slate-700">
            End Date
          </label>
          <Input id="dashboard-end-date" type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
        </div>
      </div>
    </div>
  );
}
