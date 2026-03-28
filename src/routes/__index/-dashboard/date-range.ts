export type DashboardDateRange = {
  startDate: string;
  endDate: string;
};

export function isValidDateInput(dateValue: string): boolean {
  if (!dateValue) return false;
  const parsed = new Date(dateValue);
  return !Number.isNaN(parsed.getTime());
}

export function normalizeDateRange(range: DashboardDateRange): DashboardDateRange {
  if (!isValidDateInput(range.startDate) || !isValidDateInput(range.endDate)) {
    return range;
  }

  if (range.startDate <= range.endDate) {
    return range;
  }

  return {
    startDate: range.endDate,
    endDate: range.startDate,
  };
}

export function canQueryDateRange(range: DashboardDateRange): boolean {
  if (!isValidDateInput(range.startDate) || !isValidDateInput(range.endDate)) {
    return false;
  }

  return range.startDate <= range.endDate;
}
