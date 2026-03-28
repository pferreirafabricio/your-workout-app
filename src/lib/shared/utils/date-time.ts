type DateFormatOptions = {
  locale?: string;
  timeZone?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
};

function resolveTimeZone(timeZone?: string): string {
  if (!timeZone) {
    return "UTC";
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function formatDateTime(value: Date | string, options: DateFormatOptions = {}): string {
  const date = toDate(value);
  const timeZone = resolveTimeZone(options.timeZone);

  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    ...options.formatOptions,
  }).format(date);
}

export function formatDate(value: Date | string, options: DateFormatOptions = {}): string {
  const date = toDate(value);
  const timeZone = resolveTimeZone(options.timeZone);

  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
    ...options.formatOptions,
  }).format(date);
}

export function formatDateKey(dateKey: string, options: Omit<DateFormatOptions, "timeZone"> = {}): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return dateKey;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options.formatOptions,
  }).format(date);
}

export function formatDurationSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
