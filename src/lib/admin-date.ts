export type DatePreset =
  | "today"
  | "7days"
  | "30days"
  | "this-month"
  | "last-month"
  | "this-year"
  | "custom"
  | "month"
  | "year";

export type DateFilterState = {
  preset: DatePreset;
  month: number;
  year: number;
  start: string;
  end: string;
};

export type DateWindow = { start: Date; end: Date; label: string };

export function makeDateWindow(filter: DateFilterState, now = new Date()): DateWindow {
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (filter.preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7days":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "30days":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "this-month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last-month":
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      break;
    case "this-year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setFullYear(filter.year, filter.month, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(filter.year, filter.month + 1, 0);
      break;
    case "year":
      start.setFullYear(filter.year, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(filter.year, 11, 31);
      break;
    case "custom": {
      const from = filter.start ? new Date(`${filter.start}T00:00:00`) : new Date(0);
      const to = filter.end ? new Date(`${filter.end}T23:59:59.999`) : new Date(now);
      return { start: from, end: to, label: `${formatDay(from)} – ${formatDay(to)}` };
    }
  }

  const label = filter.preset === "month"
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(start)
    : filter.preset === "year"
      ? String(filter.year)
      : filter.preset === "today"
        ? "Today"
        : filter.preset === "7days"
          ? "Last 7 Days"
          : filter.preset === "30days"
            ? "Last 30 Days"
            : filter.preset === "this-month"
              ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(start)
              : filter.preset === "last-month"
                ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(start)
                : `Year ${start.getFullYear()}`;
  return { start, end, label };
}

export function inDateWindow(value: string, window: DateWindow) {
  const date = new Date(value);
  return date >= window.start && date <= window.end;
}

export function formatDay(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export function dateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
