const DATE_LOCALE = "pt-BR";
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(
    Object.entries(options).sort(([left], [right]) => left.localeCompare(right)),
  );
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(DATE_LOCALE, options);
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

  return getDateFormatter(options).format(date);
}

export function formatMonth(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" },
) {
  const month = formatDate(date, options);
  return month.charAt(0).toLocaleUpperCase(DATE_LOCALE) + month.slice(1);
}

export function formatShortMonth(date: Date) {
  return formatDate(date, { month: "short" }).replace(".", "");
}

export function parseMonth(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match)
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return new Date();
  return new Date(year, month - 1, 1);
}

export function monthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthDate(date: Date) {
  return `${monthString(date)}-01`;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function dateForDay(month: Date, day: number | null) {
  if (!day) return null;
  const bounded = Math.min(
    day,
    daysInMonth(month.getFullYear(), month.getMonth()),
  );
  return `${monthString(month)}-${String(bounded).padStart(2, "0")}`;
}

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseMonthInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
