import { dateInputValue, type DateFilterState, type DatePreset } from "@/lib/admin-date";

const presets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function initialDateFilter(): DateFilterState {
  const now = new Date();
  return { preset: "this-month", month: now.getMonth(), year: now.getFullYear(), start: dateInputValue(now), end: dateInputValue(now) };
}

export function AdminDateFilters({
  value,
  onChange,
}: {
  value: DateFilterState;
  onChange: (value: DateFilterState) => void;
}) {
  const years = Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - 5 + index);
  return (
    <section className="border border-line p-4 sm:p-5" aria-label="Date filters">
      <span className="label-mono text-muted-ink">Date range</span>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange({ ...value, preset: preset.value })}
            className={`label-mono border px-3 py-2 text-[10px] uppercase tracking-[0.1em] ${value.preset === preset.value ? "border-ink bg-ink text-paper" : "border-line hover:bg-muted"}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="label-mono text-muted-ink">
          Month
          <select
            value={value.month}
            onChange={(event) => onChange({ ...value, month: Number(event.target.value), preset: "month" })}
            className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
          >
            {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
          </select>
        </label>
        <label className="label-mono text-muted-ink">
          Year
          <select
            value={value.year}
            onChange={(event) => onChange({ ...value, year: Number(event.target.value), preset: value.preset === "month" ? "month" : "year" })}
            className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
          >
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        {value.preset === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="label-mono text-muted-ink">
              From
              <input type="date" value={value.start} onChange={(event) => onChange({ ...value, start: event.target.value })} className="mt-1 block w-full border border-line bg-paper px-2 py-2 text-sm text-ink" />
            </label>
            <label className="label-mono text-muted-ink">
              To
              <input type="date" value={value.end} onChange={(event) => onChange({ ...value, end: event.target.value })} className="mt-1 block w-full border border-line bg-paper px-2 py-2 text-sm text-ink" />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
